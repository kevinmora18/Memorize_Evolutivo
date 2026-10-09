import { Server, Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { GameEngine } from '../engine/GameEngine';
import { IGameCommand, ICommandOutcome } from '../engine/types';

/**
 * SocketManager - Gestor de conexiones Socket.IO con POO
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Agrupa toda la lógica de sockets
 * - SRP: Solo maneja eventos de socket, delega lógica de juego al GameEngine
 * - DEPENDENCY INJECTION: Recibe RoomManager como dependencia
 * - ABSTRACCIÓN: Traduce eventos de socket a comandos del motor
 * 
 * ARQUITECTURA:
 * - Desacoplado del motor: no conoce reglas del juego
 * - Solo traduce entre Socket.IO y GameEngine
 * - El motor decide qué es válido, SocketManager solo transmite
 */
export class SocketManager {
  private io: Server;
  private roomManager: RoomManager;
  private gameEngine: GameEngine;

  constructor(io: Server, roomManager: RoomManager) {
    this.io = io;
    this.roomManager = roomManager;
    
    // Inicializar el motor de juego con callback para propagar eventos
    this.gameEngine = new GameEngine((outcome: ICommandOutcome) => {
      this.applyOutcome(outcome);
    });
  }

  /**
   * Inicializar todos los handlers de socket
   */
  initialize(): void {
    this.io.on('connection', (socket: Socket) => {
      this.log(`Usuario conectado: ${socket.id}`);

      // Registrar todos los eventos
      this.registerRoomEvents(socket);
      this.registerGameEvents(socket);
      this.registerChatEvents(socket);
      this.registerConnectionEvents(socket);
    });

    this.log('Socket.IO handlers configurados');
  }

  /**
   * Registrar eventos de sala
   */
  private registerRoomEvents(socket: Socket): void {
    // Unirse a una sala
    socket.on('room:join', async ({ roomId, userId, userName, userLevel }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        
        if (!room) {
          socket.emit('room:error', { message: 'Sala no encontrada' });
          return;
        }

        socket.join(roomId);

        // Si el jugador ya existe, actualizar socket
        if (room.hasPlayer(userId)) {
          room.reconnectPlayer(userId, socket.id);
        } else {
          room.addPlayer({
            id: userId,
            socketId: socket.id,
            name: userName,
            level: userLevel,
            isReady: false,
            score: 0,
            matches: 0,
            isConnected: true,
          });
        }

        // Notificar a todos
        this.io.to(roomId).emit('room:player-joined', {
          player: room.getPlayer(userId)?.toJSON(),
          players: room.getPlayers().map(p => p.toJSON()),
        });

        // Enviar estado actual al jugador
        socket.emit('room:joined', {
          roomId,
          players: room.getPlayers().map(p => p.toJSON()),
          gameState: room.getGameState(),
        });

        this.log(`${userName} se unió a la sala ${roomId}`);
      } catch (error: any) {
        this.logError('room:join', error);
        socket.emit('room:error', { message: error.message });
      }
    });

    // Salir de una sala
    socket.on('room:leave', ({ roomId, userId }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const player = room.getPlayer(userId);
        room.removePlayer(userId);
        socket.leave(roomId);

        this.io.to(roomId).emit('room:player-left', {
          playerId: userId,
          playerName: player?.name,
          players: room.getPlayers().map(p => p.toJSON()),
        });

        if (room.isEmpty()) {
          this.roomManager.deleteRoom(roomId);
        }

        this.log(`${player?.name} salió de la sala ${roomId}`);
      } catch (error: any) {
        this.logError('room:leave', error);
      }
    });

    // Marcar como listo
    socket.on('room:ready', ({ roomId, userId, isReady }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        room.setPlayerReady(userId, isReady);

        this.io.to(roomId).emit('room:player-ready', {
          playerId: userId,
          isReady,
          players: room.getPlayers().map(p => p.toJSON()),
        });

        this.log(`Jugador ${userId} está ${isReady ? 'listo' : 'no listo'}`);
      } catch (error: any) {
        this.logError('room:ready', error);
      }
    });
  }

  /**
   * Registrar eventos de juego
   */
  private registerGameEvents(socket: Socket): void {
    // Iniciar partida
    socket.on('game:start', async ({ roomId, userId }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        
        if (!room) {
          socket.emit('game:error', { message: 'Sala no encontrada' });
          return;
        }

        // Crear comando para el motor
        const command: IGameCommand = {
          type: 'start',
          roomId,
          userId,
        };

        // Procesar comando a través del motor (autoritativo)
        await this.gameEngine.processCommand(command, room);

        this.log(`Partida iniciada en sala ${roomId} vía motor`);
      } catch (error: any) {
        this.logError('game:start', error);
        socket.emit('game:error', { message: error.message });
      }
    });

    // Voltear carta
    socket.on('game:flip-card', async ({ roomId, userId, cardIndex }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        // Crear comando para el motor
        const command: IGameCommand = {
          type: 'flip',
          roomId,
          userId,
          payload: { cardIndex },
        };

        // Procesar comando a través del motor (autoritativo)
        // El motor manejará la evaluación automáticamente
        await this.gameEngine.processCommand(command, room);

      } catch (error: any) {
        this.logError('game:flip-card', error);
        socket.emit('game:error', { message: error.message });
      }
    });

    // Actualizar puntuación
    socket.on('game:update-score', ({ roomId, userId, score, matches }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        const player = room.getPlayer(userId);
        if (player) {
          player.score = score;
          player.matches = matches;

          this.io.to(roomId).emit('game:score-updated', {
            playerId: userId,
            score,
            matches,
            players: room.getPlayers().map(p => p.toJSON()),
          });
        }
      } catch (error: any) {
        this.logError('game:update-score', error);
      }
    });
  }

  /**
   * ARQUITECTURA: Traducir resultado del motor a eventos Socket.IO
   * 
   * EXPLICACIÓN POO:
   * - ABSTRACCIÓN: El motor NO conoce Socket.IO, devuelve ICommandOutcome
   * - SRP: Este método solo traduce outcomes a eventos
   * - INVERSIÓN DE DEPENDENCIAS: Motor depende de abstracción (callback), no de Socket.IO
   * 
   * @param outcome - Resultado del comando procesado por el motor
   */
  private applyOutcome(outcome: ICommandOutcome): void {
    try {
      // El outcome puede tener roomId+event+payload o solo type (comandos internos)
      const { roomId, event, payload, type } = outcome;

      // Si tiene roomId y event, es un evento para propagar
      if (roomId && event) {
        this.io.to(roomId).emit(event, payload);
        this.log(`Evento ${event} enviado a sala ${roomId}`);
      } else if (type) {
        // Comandos internos sin roomId específico (ej: errors de validación)
        this.log(`Outcome interno: ${type}`);
      }
    } catch (error: any) {
      this.logError('applyOutcome', error);
    }
  }

  /**
   * Registrar eventos de chat
   */
  private registerChatEvents(socket: Socket): void {
    socket.on('chat:message', ({ roomId, userId, userName, message }) => {
      try {
        this.io.to(roomId).emit('chat:message', {
          userId,
          userName,
          message,
          timestamp: new Date(),
        });
      } catch (error: any) {
        this.logError('chat:message', error);
      }
    });
  }

  /**
   * Registrar eventos de conexión/desconexión
   */
  private registerConnectionEvents(socket: Socket): void {
    // Desconexión
    socket.on('disconnect', () => {
      this.log(`Usuario desconectado: ${socket.id}`);

      // Buscar en qué sala estaba
      // (implementación similar a handlers.ts original)
    });

    // Reconexión
    socket.on('room:reconnect', ({ roomId, userId }) => {
      try {
        const room = this.roomManager.getRoom(roomId);
        if (!room) return;

        room.reconnectPlayer(userId, socket.id);
        socket.join(roomId);

        this.io.to(roomId).emit('room:player-reconnected', {
          playerId: userId,
        });

        socket.emit('room:state', {
          roomId,
          players: room.getPlayers().map(p => p.toJSON()),
          gameState: room.getGameState(),
        });

        this.log(`Jugador ${userId} reconectado a sala ${roomId}`);
      } catch (error: any) {
        this.logError('room:reconnect', error);
      }
    });
  }

  /**
   * Logging
   */
  private log(message: string): void {
    console.log(`[SocketManager] ${message}`);
  }

  private logError(event: string, error: any): void {
    console.error(`[SocketManager] Error en ${event}:`, error.message);
  }
}
