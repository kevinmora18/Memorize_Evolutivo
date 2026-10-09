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
   * Crear nueva sala
   */
  createRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, hostId, maxPlayers, mode, difficulty, isPrivate, password } = req.body;

      // Validaciones
      if (!name || !hostId) {
        res.status(400).json({ error: 'Datos incompletos' });
        return;
      }

      if (maxPlayers < 2 || maxPlayers > 8) {
        res.status(400).json({ error: 'Número de jugadores debe estar entre 2 y 8' });
        return;
      }

      // Verificar que el usuario existe
      const user = await this.userRepository.findById(hostId);

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Crear sala
      const room = this.roomManager.createRoom({
        name,
        hostId,
        hostName: user.username || user.email,
        hostLevel: user.level,
        maxPlayers: maxPlayers || 4,
        mode: mode || 'classic',
        difficulty: difficulty || 'normal',
        isPrivate: isPrivate || false,
        password: isPrivate ? password : undefined,
      });

      res.json(room.toJSON());
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/rooms/:roomId/join
   * Unirse a una sala
   */
  joinRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const { userId, password } = req.body;

      // Validaciones
      if (!userId) {
        res.status(400).json({ error: 'Datos incompletos' });
        return;
      }

      // Verificar que el usuario existe
      const user = await this.userRepository.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Unirse a la sala
      const room = this.roomManager.joinRoom(
        roomId,
        {
          id: userId,
          socketId: '', // Se actualizará por socket
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
   * Salir de una sala
   */
  leaveRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const { userId } = req.body;

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
   * Marcar jugador como listo
   */
  setReady = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const { userId, isReady } = req.body;

      const room = this.roomManager.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      room.setPlayerReady(userId, isReady);

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
   * Iniciar partida
   */
  startGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const { hostId, cards } = req.body;

      const room = this.roomManager.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      // Verificar que quien inicia es el host
      if (room.hostId !== hostId) {
        res.status(403).json({ error: 'Solo el host puede iniciar la partida' });
        return;
      }

      // Iniciar el juego
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
   * Eliminar sala (solo host)
   */
  deleteRoom = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roomId = req.params.roomId as string;
      const { hostId } = req.body;

      const room = this.roomManager.getRoom(roomId);

      if (!room) {
        res.status(404).json({ error: 'Sala no encontrada' });
        return;
      }

      // Verificar que quien elimina es el host
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
