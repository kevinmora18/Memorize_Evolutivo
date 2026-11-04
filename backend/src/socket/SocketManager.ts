import { Server, Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager';
import { GameEngine } from '../engine/GameEngine';
import { IGameCommand, ICommandOutcome } from '../engine/types';
import { JwtUtil } from '../core/JwtUtil';
import { Container } from '../Container';

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
    // Middleware de autenticación: exige JWT válido en el handshake y
    // contrasta el estado actual del usuario en la BD (baneo/borrado/rol).
    // La identidad del jugador NUNCA se toma de los eventos del cliente.
    this.io.use(async (socket: Socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        next(new Error('Token de autenticación requerido'));
        return;
      }

      try {
        const payload = JwtUtil.verify(token);
        const prisma = Container.getInstance().prisma;

        const dbUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            username: true,
            level: true,
            role: true,
            isBanned: true,
            bannedUntil: true,
            deletedAt: true,
          },
        });

        if (!dbUser || dbUser.deletedAt) {
          next(new Error('Token inválido o usuario eliminado'));
          return;
        }

        const banActive = dbUser.isBanned
          && (!dbUser.bannedUntil || new Date() < dbUser.bannedUntil);

        if (banActive) {
          next(new Error('Usuario baneado'));
          return;
        }

        socket.data.user = {
          userId: dbUser.id,
          email: dbUser.email,
          username: dbUser.username,
          level: dbUser.level,
          role: dbUser.role,
        };
        next();
      } catch {
        next(new Error('Token inválido o expirado'));
      }
    });

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
    socket.on('room:join', async ({ roomId, password }) => {
      try {
        // Identidad SIEMPRE desde el token (nunca desde el cliente)
        const userId = socket.data.user.userId;
        const userName = socket.data.user.username || socket.data.user.email;
        const userLevel = socket.data.user.level;

        const room = this.roomManager.getRoom(roomId);
        
        if (!room) {
          socket.emit('room:error', { message: 'Sala no encontrada' });
          return;
        }

        // Salas privadas: validar contraseña igual que en la vía HTTP
        if (!room.validatePassword(password || '')) {
          socket.emit('room:error', { message: 'Contraseña de sala incorrecta' });
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
            name: userName || socket.data.user.email,
            level: typeof userLevel === 'number' ? userLevel : 1,
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
    socket.on('room:leave', ({ roomId }) => {
      try {
        const userId = socket.data.user.userId;
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
    socket.on('room:ready', ({ roomId, isReady }) => {
      try {
        const userId = socket.data.user.userId;
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
    socket.on('game:start', async ({ roomId }) => {
      try {
        const userId = socket.data.user.userId;
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
    socket.on('game:flip-card', async ({ roomId, cardIndex }) => {
      try {
        const userId = socket.data.user.userId;
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

    // NOTA DE SEGURIDAD: el evento `game:update-score` fue eliminado.
    // El servidor es la única fuente de verdad del puntaje (GameEngine);
    // aceptar scores desde el cliente permitía trampas triviales.
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
      const { roomId, event, payload, type, room } = outcome;
      const targetRoomId = roomId || room?.id;

      if (targetRoomId) {
        if (event) {
          this.io.to(targetRoomId).emit(event, payload);
          this.log(`Evento ${event} enviado a sala ${targetRoomId}`);
        } else if (type) {
          switch (type) {
            case 'game_started':
              this.io.to(targetRoomId).emit('room:started', payload);
              this.io.to(targetRoomId).emit('game:started', payload);
              this.log(`Evento game:started enviado a sala ${targetRoomId}`);
              break;
            case 'card_flipped':
              this.io.to(targetRoomId).emit('game:card-flipped', payload);
              break;
            case 'match_found':
              this.io.to(targetRoomId).emit('game:match-found', payload);
              break;
            case 'no_match':
              this.io.to(targetRoomId).emit('game:no-match', payload);
              break;
            case 'game_finished':
              this.io.to(targetRoomId).emit('game:finished', payload);
              this.log(`Partida finalizada en sala ${targetRoomId}. Guardando estadísticas...`);
              void this.handleMultiplayerGameFinished(outcome);
              break;
            default:
              this.log(`Outcome de sala ${targetRoomId}: ${type}`);
          }
        }
      } else if (type) {
        this.log(`Outcome interno: ${type}`);
      }
    } catch (error: any) {
      this.logError('applyOutcome', error);
    }
  }

  /**
   * Guarda de forma autoritativa en la base de datos el resultado de la partida multijugador,
   * asignando XP, monedas y actualizando estadísticas para todos los participantes.
   */
  private async handleMultiplayerGameFinished(outcome: ICommandOutcome): Promise<void> {
    try {
      const room = outcome.room;
      if (!room) return;

      const { winnerId, scores } = outcome.payload || {};
      const players = room.getPlayers();
      const prisma = Container.getInstance().prisma;

      for (const player of players) {
        const playerScore = Number(scores?.[player.id]) || player.score || 0;
        const won = player.id === winnerId;
        const xpGained = won ? 150 : 50;
        const coinsGained = Math.min(Math.floor(playerScore / 10) + (won ? 50 : 10), 2000);
        const matchKey = `mp-${room.id}-${player.id}-${Date.now()}`;

        await prisma.$transaction(async (tx) => {
          await tx.match.create({
            data: {
              userId: player.id,
              mode: 'multiplayer',
              score: playerScore,
              won,
              matchKey,
            },
          });

          await tx.playerStats.upsert({
            where: { userId: player.id },
            create: {
              userId: player.id,
              gamesPlayed: 1,
              gamesWon: won ? 1 : 0,
              totalScore: playerScore,
              bestScore: playerScore,
              totalMatches: 1,
            },
            update: {
              gamesPlayed: { increment: 1 },
              gamesWon: { increment: won ? 1 : 0 },
              totalScore: { increment: playerScore },
              totalMatches: { increment: 1 },
            },
          });

          await tx.$executeRaw`
            UPDATE "player_stats"
            SET "bestScore" = GREATEST("bestScore", ${playerScore})
            WHERE "userId" = ${player.id}
          `;

          await tx.$executeRaw`
            UPDATE "users"
            SET xp = xp + ${xpGained},
                "level" = (xp + ${xpGained}) / 1000 + 1,
                coins = coins + ${coinsGained},
                "updatedAt" = NOW()
            WHERE id = ${player.id}
          `;
        });

        if (player.socketId) {
          this.io.to(player.socketId).emit('game:rewards', {
            xpGained,
            coinsGained,
            won,
            score: playerScore,
          });
        }
      }
    } catch (err) {
      this.logError('handleMultiplayerGameFinished', err);
    }
  }

  /**
   * Registrar eventos de chat
   */
  private registerChatEvents(socket: Socket): void {
    socket.on('chat:message', ({ roomId, message }) => {
      try {
        // Identidad desde el token; nunca del payload del cliente.
        const userId = socket.data.user.userId;
        const userName = socket.data.user.username || socket.data.user.email;
        const safeMessage = typeof message === 'string' ? message.slice(0, 500) : '';

        if (!roomId || !safeMessage.trim()) return;

        this.io.to(roomId).emit('chat:message', {
          userId,
          userName,
          message: safeMessage,
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
    socket.on('room:reconnect', ({ roomId }) => {
      try {
        const userId = socket.data.user.userId;
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
