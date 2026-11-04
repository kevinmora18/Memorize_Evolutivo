import { Request, Response, NextFunction } from 'express';
import { RoomManager } from '../managers/RoomManager';
import { GameStatus } from '../models/domain/GameRoom.model';
import { UserRepository } from '../repositories/UserRepository';

/**
 * RoomController - Controlador para rutas de salas
 * 
 * EXPLICACIÓN POO:
 * - SRP: Solo maneja peticiones HTTP de salas
 * - DEPENDENCY INJECTION: Recibe dependencias necesarias
 * - SEPARACIÓN DE RESPONSABILIDADES: No contiene lógica de negocio compleja
 * 
 * SEGURIDAD:
 * - La identidad del host o jugador SIEMPRE se deriva de req.auth!.userId (JWT).
 * - Nunca se confía en hostId o userId enviados en el body.
 * - Solo el host puede iniciar o eliminar una sala.
 */
export class RoomController {
  private roomManager: RoomManager;
  private userRepository: UserRepository;

  constructor(roomManager: RoomManager, userRepository: UserRepository) {
    this.roomManager = roomManager;
    this.userRepository = userRepository;
  }

  /**
   * GET /api/rooms
   * Listar salas disponibles
   */
  listRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mode, status } = req.query;

      const rooms = this.roomManager.getAvailableRooms({
        mode: mode as string,
        status: status as GameStatus,
      });

      res.json(rooms.map(room => room.toJSON()));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/rooms/:roomId
   * Obtener información de una sala específica
   */
  getRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;

      const room = this.roomManager.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      res.json(room.toJSON());
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/rooms
   * Crear nueva sala (requiere autenticación; hostId se toma del token)
   */
  createRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hostId = req.auth!.userId;
      const { name, maxPlayers, mode, difficulty, isPrivate, password } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ error: 'El nombre de la sala es requerido' });
        return;
      }

      const parsedMaxPlayers = Number(maxPlayers) || 4;
      if (parsedMaxPlayers < 2 || parsedMaxPlayers > 8) {
        res.status(400).json({ error: 'Número de jugadores debe estar entre 2 y 8' });
        return;
      }

      const user = await this.userRepository.findById(hostId);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const room = this.roomManager.createRoom({
        name: name.trim().slice(0, 50),
        hostId,
        hostName: user.username || user.email,
        hostLevel: user.level,
        maxPlayers: parsedMaxPlayers,
        mode: mode || 'classic',
        difficulty: difficulty || 'normal',
        isPrivate: Boolean(isPrivate),
        password: isPrivate && typeof password === 'string' ? password : undefined,
      });

      res.status(201).json(room.toJSON());
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/rooms/:roomId/join
   * Unirse a una sala (requiere autenticación; userId se toma del token)
   */
  joinRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const userId = req.auth!.userId;
      const { password } = req.body;

      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const room = this.roomManager.joinRoom(
        roomId,
        {
          id: userId,
          socketId: '',
          name: user.username || user.email,
          level: user.level,
          isReady: false,
          score: 0,
          matches: 0,
          isConnected: true,
        },
        password
      );

      res.json(room.toJSON());
    } catch (error: any) {
      if (error.message.includes('no encontrada')) {
        res.status(404).json({ error: error.message });
      } else if (error.message.includes('Contraseña')) {
        res.status(403).json({ error: error.message });
      } else if (error.message.includes('llena') || error.message.includes('ya está')) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * POST /api/rooms/:roomId/leave
   * Salir de una sala (requiere autenticación; userId se toma del token)
   */
  leaveRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const userId = req.auth!.userId;

      this.roomManager.leaveRoom(roomId, userId);

      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        res.json({ message: 'Sala eliminada' });
        return;
      }

      res.json(room.toJSON());
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/rooms/:roomId/ready
   * Marcar jugador como listo (requiere autenticación; userId se toma del token)
   */
  setReady = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const userId = req.auth!.userId;
      const { isReady } = req.body;

      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      room.setPlayerReady(userId, Boolean(isReady));

      res.json(room.toJSON());
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * PUT /api/rooms/:roomId/start
   * Iniciar partida (requiere autenticación; solo el host autenticado)
   */
  startGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const hostId = req.auth!.userId;
      const { cards } = req.body;

      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      if (room.hostId !== hostId) {
        res.status(403).json({ error: 'Solo el host puede iniciar la partida' });
        return;
      }

      room.startGame(cards);

      res.json(room.toJSON());
    } catch (error: any) {
      if (error.message.includes('listos') || error.message.includes('jugadores')) {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * DELETE /api/rooms/:roomId
   * Eliminar sala (requiere autenticación; solo el host autenticado)
   */
  deleteRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const hostId = req.auth!.userId;

      const room = this.roomManager.getRoom(roomId);
      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      if (room.hostId !== hostId) {
        res.status(403).json({ error: 'Solo el host puede eliminar la sala' });
        return;
      }

      this.roomManager.deleteRoom(roomId);

      res.json({ message: 'Sala eliminada correctamente' });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/rooms/stats
   * Obtener estadísticas de salas
   */
  getStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = this.roomManager.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };
}
