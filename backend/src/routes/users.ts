import { Router } from 'express';
import { Container } from '../Container';
import { requireAdmin, requireSelfOrAdmin } from '../core/middleware/auth';

/**
 * User Routes - Usando arquitectura POO
 * 
 * EXPLICACIÓN:
 * - Rutas limpias que delegan al controlador
 * - El controlador maneja HTTP
 * - El servicio maneja lógica de negocio
 * - Los repositorios manejan datos
 *
 * SEGURIDAD:
 * - Mutaciones de economía/XP solo para admin
 * - game-result solo para el dueño del perfil (o admin)
 */

const router = Router();
const container = Container.getInstance();
const userController = container.userController;

// GET /api/users/top - Top jugadores (debe ir antes de /:userId)
router.get('/top', userController.getTopPlayers);

// GET /api/users/banned - Usuarios baneados (solo admin)
router.get('/banned', requireAdmin, userController.getBannedUsers);

// GET /api/users/:userId - Obtener perfil
router.get('/:userId', userController.getProfile);

// POST /api/users/:userId/xp - Añadir XP (solo admin)
router.post('/:userId/xp', requireAdmin, userController.addXp);

// PUT /api/users/:userId/currency - Actualizar monedas/gemas (solo admin)
router.put('/:userId/currency', requireAdmin, userController.updateCurrency);

// POST /api/users/:userId/reward - Dar recompensa (solo admin)
router.post('/:userId/reward', requireAdmin, userController.rewardCoins);

// POST /api/users/:userId/game-result - Registrar resultado de partida (dueño del perfil)
router.post('/:userId/game-result', requireSelfOrAdmin, userController.recordGame);

// GET /api/users/:userId/achievements - Obtener logros
router.get('/:userId/achievements', userController.getAchievements);

// GET /api/users/:userId/ranking - Obtener ranking
router.get('/:userId/ranking', userController.getRanking);

// POST /api/users/:userId/ban - Banear usuario (admin)
router.post('/:userId/ban', requireAdmin, userController.banUser);

// POST /api/users/:userId/unban - Desbanear usuario (admin)
router.post('/:userId/unban', requireAdmin, userController.unbanUser);

export default router;
