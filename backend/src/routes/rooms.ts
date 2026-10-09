import { Router } from 'express';
import { Container } from '../Container';

/**
 * Room Routes - Usando arquitectura POO
 * 
 * EXPLICACIÓN:
 * - Las rutas solo definen endpoints y delegan al controlador
 * - El controlador maneja toda la lógica HTTP
 * - El RoomManager maneja la lógica de negocio de salas
 */

const router = Router();
const container = Container.getInstance();
const roomController = container.roomController;

// GET /api/rooms - Listar salas disponibles
router.get('/', roomController.listRooms);

// GET /api/rooms/stats - Estadísticas de salas
router.get('/stats', roomController.getStats);

// GET /api/rooms/:roomId - Obtener información de una sala
router.get('/:roomId', roomController.getRoom);

// POST /api/rooms - Crear nueva sala
router.post('/', roomController.createRoom);

// POST /api/rooms/:roomId/join - Unirse a una sala
router.post('/:roomId/join', roomController.joinRoom);

// POST /api/rooms/:roomId/leave - Salir de una sala
router.post('/:roomId/leave', roomController.leaveRoom);

// PUT /api/rooms/:roomId/ready - Marcar como listo
router.put('/:roomId/ready', roomController.setReady);

// PUT /api/rooms/:roomId/start - Iniciar partida
router.put('/:roomId/start', roomController.startGame);

// DELETE /api/rooms/:roomId - Eliminar sala
router.delete('/:roomId', roomController.deleteRoom);

// Exportar para compatibilidad con socket handlers antiguos
// TODO: Migrar handlers.ts para usar RoomManager en lugar del Map
export const rooms = new Map();

export default router;
