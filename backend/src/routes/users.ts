import { Router } from 'express';
import { Container } from '../Container';
import { optionalAuth, requireAdmin, requireSelfOrAdmin } from '../core/middleware/auth';

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
 * - Mutaciones de economía/XP globales solo para admin
 * - Inventario, tienda y bonos requieren requireSelfOrAdmin
 * - El registro de partidas vive únicamente en POST /api/matches
 *   (recompensas calculadas en servidor); no existe endpoint de auto-recompensa.
 * - Los endpoints públicos solo exponen datos públicos.
 */

const router = Router();
const container = Container.getInstance();
const userController = container.userController;

// GET /api/users/top - Top jugadores (debe ir antes de /:userId)
router.get('/top', optionalAuth, userController.getTopPlayers);

// GET /api/users/banned - Usuarios baneados (solo admin)
router.get('/banned', requireAdmin, userController.getBannedUsers);

// GET /api/users/:userId - Obtener perfil (privado solo para el dueño/admin)
router.get('/:userId', optionalAuth, userController.getProfile);

// GET /api/users/:userId/inventory - Obtener inventario
router.get('/:userId/inventory', requireSelfOrAdmin, userController.getInventory);

// POST /api/users/:userId/inventory/buy - Comprar item en la tienda
router.post('/:userId/inventory/buy', requireSelfOrAdmin, userController.buyItem);

// POST /api/users/:userId/inventory/equip - Equipar item
router.post('/:userId/inventory/equip', requireSelfOrAdmin, userController.equipItem);

// POST /api/users/:userId/daily-bonus - Reclamar bono diario
router.post('/:userId/daily-bonus', requireSelfOrAdmin, userController.claimDailyBonus);

// POST /api/users/:userId/claim-mission - Reclamar recompensa de misión
router.post('/:userId/claim-mission', requireSelfOrAdmin, userController.claimMission);

// POST /api/users/:userId/xp - Añadir XP (solo admin)
router.post('/:userId/xp', requireAdmin, userController.addXp);

// PUT /api/users/:userId/currency - Actualizar monedas/gemas (solo admin)
router.put('/:userId/currency', requireAdmin, userController.updateCurrency);

// POST /api/users/:userId/reward - Dar recompensa (solo admin)
router.post('/:userId/reward', requireAdmin, userController.rewardCoins);

// GET /api/users/:userId/achievements - Obtener logros
router.get('/:userId/achievements', optionalAuth, userController.getAchievements);

// GET /api/users/:userId/ranking - Obtener ranking
router.get('/:userId/ranking', optionalAuth, userController.getRanking);

// POST /api/users/:userId/ban - Banear usuario (admin)
router.post('/:userId/ban', requireAdmin, userController.banUser);

// POST /api/users/:userId/unban - Desbanear usuario (admin)
router.post('/:userId/unban', requireAdmin, userController.unbanUser);

export default router;
