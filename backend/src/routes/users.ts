import { Router } from 'express';
import { Container } from '../Container';

/**
 * User Routes - Usando arquitectura POO
 * 
 * EXPLICACIÓN:
 * - Rutas limpias que delegan al controlador
 * - El controlador maneja HTTP
 * - El servicio maneja lógica de negocio
 * - Los repositorios manejan datos
 */

const router = Router();
const container = Container.getInstance();
const userController = container.userController;

// GET /api/users/top - Top jugadores (debe ir antes de /:userId)
router.get('/top', userController.getTopPlayers);

// GET /api/users/banned - Usuarios baneados (solo admin)
router.get('/banned', userController.getBannedUsers);

// GET /api/users/:userId - Obtener perfil
router.get('/:userId', userController.getProfile);

// POST /api/users/:userId/xp - Añadir XP
router.post('/:userId/xp', userController.addXp);

// PUT /api/users/:userId/currency - Actualizar monedas/gemas
router.put('/:userId/currency', userController.updateCurrency);

// POST /api/users/:userId/reward - Dar recompensa
router.post('/:userId/reward', userController.rewardCoins);

// POST /api/users/:userId/game-result - Registrar resultado de partida
router.post('/:userId/game-result', userController.recordGame);

// GET /api/users/:userId/achievements - Obtener logros
router.get('/:userId/achievements', userController.getAchievements);

// GET /api/users/:userId/ranking - Obtener ranking
router.get('/:userId/ranking', userController.getRanking);

// POST /api/users/:userId/ban - Banear usuario (admin)
router.post('/:userId/ban', userController.banUser);

// POST /api/users/:userId/unban - Desbanear usuario (admin)
router.post('/:userId/unban', userController.unbanUser);

export default router;
