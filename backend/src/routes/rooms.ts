import { Router } from 'express';
import { Container } from '../Container';
import { requireAuth, optionalAuth } from '../core/middleware/auth';

/**
 * Room Routes - Usando arquitectura POO
 * 
 * SEGURIDAD:
 * - Todas las mutaciones (crear, unirse, salir, ready, iniciar, eliminar)
 *   requieren autenticación JWT válida.
 * - Iniciar y eliminar sala validan que el usuario autenticado sea el host.
 */

const router = Router();
const container = Container.getInstance();
const roomController = container.roomController;

// GET /api/rooms - Listar salas disponibles
router.get('/', optionalAuth, roomController.listRooms);

// GET /api/rooms/stats - Estadísticas de salas
router.get('/stats', optionalAuth, roomController.getStats);

// GET /api/rooms/:roomId - Obtener información de una sala
router.get('/:roomId', optionalAuth, roomController.getRoom);

// POST /api/rooms - Crear nueva sala (requiere autenticación)
router.post('/', requireAuth, roomController.createRoom);

// POST /api/rooms/:roomId/join - Unirse a una sala (requiere autenticación)
router.post('/:roomId/join', requireAuth, roomController.joinRoom);

// POST /api/rooms/:roomId/leave - Salir de una sala (requiere autenticación)
router.post('/:roomId/leave', requireAuth, roomController.leaveRoom);

// PUT /api/rooms/:roomId/ready - Marcar como listo (requiere autenticación)
router.put('/:roomId/ready', requireAuth, roomController.setReady);

// PUT /api/rooms/:roomId/team - Cambiar de equipo (requiere autenticación)
router.put('/:roomId/team', requireAuth, roomController.setTeam);

// PUT /api/rooms/:roomId/start - Iniciar partida (requiere autenticación; solo host)
router.put('/:roomId/start', requireAuth, roomController.startGame);

// DELETE /api/rooms/:roomId - Eliminar sala (requiere autenticación; solo host)
router.delete('/:roomId', requireAuth, roomController.deleteRoom);

// Exportar para compatibilidad con socket handlers antiguos
export const rooms = new Map();

export default router;
