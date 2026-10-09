import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';

/**
 * UserController - Controlador para rutas de usuarios
 * 
 * EXPLICACIÓN POO:
 * - SRP: Solo maneja peticiones HTTP de usuarios
 * - DEPENDENCY INJECTION: Recibe el servicio como dependencia
 * - THIN CONTROLLERS: Delega toda la lógica al servicio
 */
export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * GET /api/users/:userId
   * Obtener perfil de usuario
   */
  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const profile = await this.userService.getUserProfile(userId);

      res.json(profile);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * POST /api/users/:userId/xp
   * Añadir XP al usuario
   */
  addXp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { xpAmount } = req.body;

      if (!xpAmount || xpAmount <= 0) {
        res.status(400).json({ error: 'XP amount debe ser positivo' });
        return;
      }

      const result = await this.userService.addXpToUser(userId, xpAmount);

      res.json(result);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * PUT /api/users/:userId/currency
   * Actualizar monedas/gemas
   */
  updateCurrency = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { coins, gems } = req.body;

      const user = await this.userService.updateCurrency(userId, coins, gems);

      res.json(user.toJSON());
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * POST /api/users/:userId/reward
   * Dar recompensa de monedas
   */
  rewardCoins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Amount debe ser positivo' });
        return;
      }

      const user = await this.userService.rewardCoins(userId, amount);

      res.json(user.toJSON());
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * POST /api/users/:userId/game-result
   * Registrar resultado de partida
   */
  recordGame = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { score, won, matches, perfectMatches, combo, xpEarned, coinsEarned } = req.body;

      // Validaciones
      if (score === undefined || won === undefined) {
        res.status(400).json({ error: 'Datos incompletos' });
        return;
      }

      const result = await this.userService.recordGamePlayed(userId, {
        score,
        won,
        matches: matches || 0,
        perfectMatches: perfectMatches || 0,
        combo: combo || 0,
        xpEarned: xpEarned || 0,
        coinsEarned: coinsEarned || 0,
      });

      res.json(result);
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * GET /api/users/:userId/achievements
   * Obtener logros del usuario
   */
  getAchievements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const achievements = await this.userService.getUserAchievements(userId);

      res.json({ achievements });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/users/:userId/ranking
   * Obtener ranking del jugador
   */
  getRanking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const ranking = await this.userService.getPlayerRanking(userId);

      res.json(ranking);
    } catch (error: any) {
      if (error.message.includes('no encontrada')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * GET /api/users/top
   * Obtener top jugadores
   */
  getTopPlayers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;

      const topPlayers = await this.userService.getTopPlayers(parseInt(limit as string));

      res.json(topPlayers.map(p => ({
        user: p.user.toJSON(),
        stats: p.stats.toJSON(),
      })));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/:userId/ban
   * Banear usuario (solo admin)
   */
  banUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { reason, duration } = req.body;

      if (!reason) {
        res.status(400).json({ error: 'Razón de baneo requerida' });
        return;
      }

      const user = await this.userService.banUser(userId, reason, duration);

      res.json(user.toJSON());
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * POST /api/users/:userId/unban
   * Desbanear usuario (solo admin)
   */
  unbanUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const user = await this.userService.unbanUser(userId);

      res.json(user.toJSON());
    } catch (error: any) {
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    }
  };

  /**
   * GET /api/users/banned
   * Obtener usuarios baneados (solo admin)
   */
  getBannedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bannedUsers = await this.userService.getBannedUsers();

      res.json(bannedUsers.map(u => u.toJSON()));
    } catch (error) {
      next(error);
    }
  };
}
