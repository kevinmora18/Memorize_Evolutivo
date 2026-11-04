import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { User } from '../models/domain/User.model';
import { Container } from '../Container';

/**
 * Datos de usuario seguros para endpoints públicos.
 * Nunca expone email, hash, motivo de baneo ni estado de moderación.
 */
function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    level: user.level,
    xp: user.xp,
    coins: user.coins,
    gems: user.gems,
    createdAt: user.createdAt,
  };
}

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

      // Solo el propio usuario o un admin pueden ver datos privados
      // (email, estado de baneo, etc.).
      const canSeePrivate = req.auth?.role === 'admin' || req.auth?.userId === userId;

      res.json({
        user: canSeePrivate ? profile.user.toJSON() : toPublicUser(profile.user),
        stats: profile.stats ? profile.stats.toJSON() : null,
      });
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
        user: toPublicUser(p.user),
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

  /**
   * GET /api/users/:userId/inventory
   * Obtener inventario del usuario
   */
  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const prisma = Container.getInstance().prisma;
      let inventory = await prisma.inventory.findUnique({
        where: { userId },
      });

      if (!inventory) {
        inventory = await prisma.inventory.create({
          data: {
            userId,
            ownedPacks: ['frutas'],
            ownedFrames: ['basic'],
            ownedSkins: ['classic'],
            ownedBoards: ['default'],
            equippedPack: 'frutas',
            equippedFrame: 'basic',
            equippedSkin: 'classic',
            equippedBoard: 'default',
          },
        });
      }

      res.json(inventory);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/:userId/inventory/buy
   * Comprar item de la tienda (descuenta saldo y agrega al inventario)
   */
  buyItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { itemType, itemId, price, currency } = req.body;

      if (!itemType || !itemId || typeof price !== 'number' || price <= 0) {
        res.status(400).json({ error: 'Datos de compra inválidos' });
        return;
      }

      const prisma = Container.getInstance().prisma;
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('Usuario no encontrado');

        const useCoins = currency !== 'gems';
        if (useCoins && user.coins < price) {
          throw new Error('No tienes suficientes monedas');
        }
        if (!useCoins && user.gems < price) {
          throw new Error('No tienes suficientes gemas');
        }

        let inv = await tx.inventory.findUnique({ where: { userId } });
        if (!inv) {
          inv = await tx.inventory.create({
            data: {
              userId,
              ownedPacks: ['frutas'],
              ownedFrames: ['basic'],
              ownedSkins: ['classic'],
              ownedBoards: ['default'],
            },
          });
        }

        const fieldMap: Record<string, 'ownedPacks' | 'ownedFrames' | 'ownedSkins' | 'ownedBoards'> = {
          pack: 'ownedPacks',
          frame: 'ownedFrames',
          skin: 'ownedSkins',
          board: 'ownedBoards',
        };

        const field = fieldMap[itemType];
        if (!field) throw new Error('Tipo de item inválido');

        const ownedList = (inv[field] as string[]) || [];
        if (ownedList.includes(itemId)) {
          throw new Error('Ya posees este artículo');
        }

        const updatedInv = await tx.inventory.update({
          where: { userId },
          data: {
            [field]: [...ownedList, itemId],
          },
        });

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            coins: useCoins ? { decrement: price } : undefined,
            gems: !useCoins ? { decrement: price } : undefined,
          },
        });

        return { inventory: updatedInv, coins: updatedUser.coins, gems: updatedUser.gems };
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al procesar compra' });
    }
  };

  /**
   * POST /api/users/:userId/inventory/equip
   * Equipar item
   */
  equipItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { itemType, itemId } = req.body;

      const fieldMap: Record<string, string> = {
        pack: 'equippedPack',
        frame: 'equippedFrame',
        skin: 'equippedSkin',
        board: 'equippedBoard',
      };

      const field = fieldMap[itemType];
      if (!field || typeof itemId !== 'string') {
        res.status(400).json({ error: 'Tipo de item o itemId inválido' });
        return;
      }

      const prisma = Container.getInstance().prisma;
      const updated = await prisma.inventory.upsert({
        where: { userId },
        create: {
          userId,
          [field]: itemId,
        },
        update: {
          [field]: itemId,
        },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/:userId/daily-bonus
   * Reclamar bono diario (+150 monedas, +1 gema, +50 XP)
   */
  claimDailyBonus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const prisma = Container.getInstance().prisma;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const existingClaim = await prisma.user_daily_missions.findFirst({
        where: {
          userId,
          missionId: 'daily_login_bonus',
          claimedAt: { gte: startOfDay },
        },
      });

      if (existingClaim) {
        res.status(400).json({ error: 'Bono diario ya reclamado hoy' });
        return;
      }

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            coins: { increment: 150 },
            gems: { increment: 1 },
            xp: { increment: 50 },
          },
        }),
        prisma.user_daily_missions.create({
          data: {
            userId,
            missionId: 'daily_login_bonus',
            isCompleted: true,
            isClaimed: true,
            claimedAt: now,
          },
        }),
      ]);

      res.json({
        success: true,
        coinsGained: 150,
        gemsGained: 1,
        xpGained: 50,
        coins: updatedUser.coins,
        gems: updatedUser.gems,
        xp: updatedUser.xp,
        level: updatedUser.level,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/users/:userId/claim-mission
   * Reclamar recompensa de misión diaria
   */
  claimMission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;
      const { missionId, rewardCoins = 50, rewardGems = 0, rewardXP = 50 } = req.body;

      if (!missionId) {
        res.status(400).json({ error: 'missionId requerido' });
        return;
      }

      const safeCoins = Math.min(Math.max(Number(rewardCoins) || 0, 0), 500);
      const safeGems = Math.min(Math.max(Number(rewardGems) || 0, 0), 10);
      const safeXP = Math.min(Math.max(Number(rewardXP) || 0, 0), 250);

      const prisma = Container.getInstance().prisma;
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const existingClaim = await prisma.user_daily_missions.findFirst({
        where: {
          userId,
          missionId: String(missionId),
          claimedAt: { gte: startOfDay },
        },
      });

      if (existingClaim) {
        res.status(400).json({ error: 'Misión ya reclamada hoy' });
        return;
      }

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            coins: { increment: safeCoins },
            gems: { increment: safeGems },
            xp: { increment: safeXP },
          },
        }),
        prisma.user_daily_missions.create({
          data: {
            userId,
            missionId: String(missionId),
            isCompleted: true,
            isClaimed: true,
            claimedAt: now,
          },
        }),
      ]);

      res.json({
        success: true,
        coinsGained: safeCoins,
        gemsGained: safeGems,
        xpGained: safeXP,
        coins: updatedUser.coins,
        gems: updatedUser.gems,
        xp: updatedUser.xp,
        level: updatedUser.level,
      });
    } catch (error) {
      next(error);
    }
  };
}
