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

    // Suscribirse a cambios en RoomManager para propagar salas en tiempo real
    this.roomManager.onRoomsChange(() => {
      this.broadcastRooms();
    });

    this.io.on('connection', (socket: Socket) => {
      this.log(`Usuario conectado: ${socket.id}`);

      // Enviar lista actualizada de salas inmediatamente
      try {
        const availableRooms = this.roomManager.getAvailableRooms({}).map(r => r.toJSON());
        socket.emit('rooms:update', availableRooms);
      } catch {}

      // Registrar todos los eventos
      this.registerRoomEvents(socket);
      this.registerGameEvents(socket);
      this.registerChatEvents(socket);
      this.registerConnectionEvents(socket);
    });

    this.log('Socket.IO handlers configurados');
  }

  /**
   * Notificar lista actualizada de salas a todos los usuarios conectados
   */
  public broadcastRooms(): void {
    try {
      const availableRooms = this.roomManager.getAvailableRooms({}).map(r => r.toJSON());
      this.io.emit('rooms:update', availableRooms);
    } catch (err: any) {
      this.logError('broadcastRooms', err);
    }
  }

  /**
   * Registrar eventos de sala
   */
  private registerRoomEvents(socket: Socket): void {
    // Unirse a una sala
    socket.on('room:join', async ({ roomId, roomCode, password }: any) => {
      try {
        // Identidad SIEMPRE desde el token (nunca desde el cliente)
        const userId = socket.data.user.userId;
        const userName = socket.data.user.username || socket.data.user.email;
        const userLevel = socket.data.user.level;
        const targetId = roomId || roomCode;

        let room = this.roomManager.getRoom(targetId);
        if (!room) {
          room = this.roomManager.getRoomByCode(targetId);
        }
        
        if (!room) {
          socket.emit('room:error', { message: 'Sala no encontrada' });
          return;
        }

        const realRoomId = room.id;

        // Salas privadas: validar contraseña igual que en la vía HTTP
        if (!room.validatePassword(password || '')) {
          socket.emit('room:error', { message: 'Contraseña de sala incorrecta' });
          return;
        }

        socket.join(realRoomId);

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
            teamId: 0,
          });
        }

        // Notificar a todos en la sala
        this.io.to(realRoomId).emit('room:player-joined', {
          player: room.getPlayer(userId)?.toJSON(),
          players: room.getPlayers().map(p => p.toJSON()),
        });

        // Enviar estado actual al jugador
        socket.emit('room:joined', {
          roomId: realRoomId,
          room: room.toJSON(),
          players: room.getPlayers().map(p => p.toJSON()),
          gameState: room.getGameState(),
        });

        this.broadcastRooms();
        this.log(`${userName} se unió a la sala ${realRoomId}`);
      } catch (error: any) {
        this.logError('room:join', error);
        socket.emit('room:error', { message: error.message });
      }
    });

    // Salir de una sala
    socket.on('room:leave', ({ roomId }: any) => {
      try {
        const userId = socket.data.user.userId;
        let room = this.roomManager.getRoom(roomId);
        if (!room) room = this.roomManager.getRoomByCode(roomId);
        if (!room) return;

        const player = room.getPlayer(userId);
        room.removePlayer(userId);
        socket.leave(room.id);

        this.io.to(room.id).emit('room:player-left', {
          playerId: userId,
          playerName: player?.name,
          players: room.getPlayers().map(p => p.toJSON()),
        });

        if (room.isEmpty()) {
          this.roomManager.deleteRoom(room.id);
        }

        this.broadcastRooms();
        this.log(`${player?.name} salió de la sala ${room.id}`);
      } catch (error: any) {
        this.logError('room:leave', error);
      }
    });

    // Marcar como listo
    socket.on('room:ready', ({ roomId, isReady }: any) => {
      try {
        const userId = socket.data.user.userId;
        let room = this.roomManager.getRoom(roomId);
        if (!room) room = this.roomManager.getRoomByCode(roomId);
        if (!room) return;

        room.setPlayerReady(userId, isReady);

        this.io.to(room.id).emit('room:player-ready', {
          playerId: userId,
          isReady,
          players: room.getPlayers().map(p => p.toJSON()),
        });

        this.broadcastRooms();
        this.log(`Jugador ${userId} está ${isReady ? 'listo' : 'no listo'} en sala ${room.id}`);
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
    socket.on('game:start', async ({ roomId }: any) => {
      try {
        const userId = socket.data.user.userId;
        let room = this.roomManager.getRoom(roomId);
        if (!room) room = this.roomManager.getRoomByCode(roomId);
        
        if (!room) {
          socket.emit('game:error', { message: 'Sala no encontrada' });
          return;
        }

        // Crear comando para el motor
        const command: IGameCommand = {
          type: 'start',
          roomId: room.id,
          userId,
        };

        // Procesar comando a través del motor (autoritativo)
        await this.gameEngine.processCommand(command, room);

        this.log(`Partida iniciada en sala ${room.id} vía motor`);
      } catch (error: any) {
        this.logError('game:start', error);
        socket.emit('game:error', { message: error.message });
      }
    });

    // Voltear carta
    socket.on('game:flip-card', async ({ roomId, cardIndex }: any) => {
      try {
        const userId = socket.data.user.userId;
        let room = this.roomManager.getRoom(roomId);
        if (!room) room = this.roomManager.getRoomByCode(roomId);
        if (!room) return;

        // Crear comando para el motor
        const command: IGameCommand = {
          type: 'flip',
          roomId: room.id,
          userId,
          payload: { cardIndex },
        };

        // Procesar comando a través del motor (autoritativo)
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
      const roomId = outcome.roomId || outcome.room?.id;
      const type = outcome.type;

      if (!roomId) {
        if (type) this.log(`Outcome interno: ${type}`);
        return;
      }

      // Mapeo exhaustivo de resultados del motor a eventos Socket.IO
      const eventMap: Record<string, string> = {
        game_started: 'game:started',
        card_flipped: 'game:card-flipped',
        match_found: 'game:match-found',
        no_match: 'game:no-match',
        game_finished: 'game:finished',
        turn_timeout: 'game:turn-timeout',
        turn_tick: 'game:turn-tick',
        turn_ended: 'game:turn-ended',
      };

      const event = outcome.event || (type ? eventMap[type] : undefined);

      if (event) {
        const fullPayload = {
          ...outcome.payload,
          gameState: outcome.room?.getGameState ? outcome.room.getGameState() : undefined,
          players: outcome.room?.getPlayers ? outcome.room.getPlayers().map(p => p.toJSON()) : undefined,
        };
        this.io.to(roomId).emit(event, fullPayload);
        if (event === 'game:started') {
          this.io.to(roomId).emit('room:started', fullPayload);
        }
        this.log(`Evento ${event} enviado a sala ${roomId}`);

        if (event === 'game:finished') {
          this.log(`Partida finalizada en sala ${roomId}. Guardando estadísticas...`);
          void this.handleMultiplayerGameFinished(outcome);
        }

        if (event === 'game:started' || event === 'game:finished') {
          this.broadcastRooms();
        }
      } else if (type) {
        this.log(`Outcome no mapeado: ${type}`);
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
