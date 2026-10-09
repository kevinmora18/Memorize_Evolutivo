import { BaseService } from '../core/BaseService';
import { IUserService } from '../core/interfaces/IServices';
import { UserRepository } from '../repositories/UserRepository';
import { PlayerStatsRepository } from '../repositories/PlayerStatsRepository';
import { User } from '../models/domain/User.model';
import { PlayerStats } from '../models/domain/PlayerStats.model';

/**
 * UserService - Servicio para gestión de usuarios
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseService
 * - SRP: Solo maneja lógica de usuarios
 * - DEPENDENCY INJECTION: Recibe repositorios como dependencias
 * - COMPOSICIÓN: Usa múltiples repositorios para operaciones complejas
 * - ISP: Implementa únicamente IUserService
 */
export class UserService extends BaseService implements IUserService {
  private userRepository: UserRepository;
  private statsRepository: PlayerStatsRepository;

  constructor(
    userRepository: UserRepository,
    statsRepository: PlayerStatsRepository
  ) {
    super('UserService');
    this.userRepository = userRepository;
    this.statsRepository = statsRepository;
  }

  async initialize(): Promise<void> {
    this.log('Servicio de usuarios inicializado');
  }

  /**
   * Obtener perfil completo de usuario (con estadísticas)
   */
  async getUserProfile(userId: string): Promise<{
    user: User;
    stats: PlayerStats | null;
  }> {
    try {
      this.log(`Obteniendo perfil completo de usuario: ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const stats = await this.statsRepository.findByUserId(userId);

      return { user, stats };
    } catch (error: any) {
      this.handleError(error, 'getUserProfile');
    }
  }

  /**
   * Actualizar XP y nivel del usuario
   */
  async addXpToUser(userId: string, xpAmount: number): Promise<{
    user: User;
    levelsGained: number;
  }> {
    try {
      this.log(`Añadiendo ${xpAmount} XP al usuario: ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Usar método del modelo de dominio
      const levelsGained = user.addXp(xpAmount);

      // Guardar cambios
      const updatedUser = await this.userRepository.update(userId, {
        xp: user.xp,
        level: user.level,
      });

      this.log(`Usuario ${userId} subió ${levelsGained} niveles`);

      return { user: updatedUser, levelsGained };
    } catch (error: any) {
      this.handleError(error, 'addXpToUser');
    }
  }

  /**
   * Actualizar monedas del usuario
   */
  async updateCurrency(
    userId: string,
    coins?: number,
    gems?: number
  ): Promise<User> {
    try {
      this.log(`Actualizando monedas del usuario: ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (coins !== undefined) user.coins = coins;
      if (gems !== undefined) user.gems = gems;

      return await this.userRepository.update(userId, {
        coins: user.coins,
        gems: user.gems,
      });
    } catch (error: any) {
      this.handleError(error, 'updateCurrency');
    }
  }

  /**
   * Añadir monedas como recompensa
   */
  async rewardCoins(userId: string, amount: number): Promise<User> {
    try {
      this.log(`Recompensando ${amount} monedas al usuario: ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      user.addCoins(amount);

      return await this.userRepository.update(userId, {
        coins: user.coins,
      });
    } catch (error: any) {
      this.handleError(error, 'rewardCoins');
    }
  }

  /**
   * Registrar partida jugada y actualizar estadísticas
   */
  async recordGamePlayed(
    userId: string,
    gameData: {
      score: number;
      won: boolean;
      matches: number;
      perfectMatches: number;
      combo: number;
      xpEarned: number;
      coinsEarned: number;
    }
  ): Promise<{
    user: User;
    stats: PlayerStats;
    levelsGained: number;
  }> {
    try {
      this.log(`Registrando partida para usuario: ${userId}`);

      // Obtener usuario y estadísticas
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      let stats = await this.statsRepository.findByUserId(userId);
      if (!stats) {
        // Crear estadísticas si no existen
        stats = await this.statsRepository.create({ userId });
      }

      // Actualizar estadísticas usando método del modelo
      stats.recordGame(
        gameData.score,
        gameData.won,
        gameData.matches,
        gameData.perfectMatches,
        gameData.combo
      );

      // Actualizar XP y monedas
      const levelsGained = user.addXp(gameData.xpEarned);
      user.addCoins(gameData.coinsEarned);

      // Guardar cambios
      const [updatedUser, updatedStats] = await Promise.all([
        this.userRepository.update(userId, {
          xp: user.xp,
          level: user.level,
          coins: user.coins,
        }),
        this.statsRepository.update(stats.id, stats.toJSON()),
      ]);

      this.log(`Partida registrada. Niveles ganados: ${levelsGained}`);

      return {
        user: updatedUser,
        stats: updatedStats,
        levelsGained,
      };
    } catch (error: any) {
      this.handleError(error, 'recordGamePlayed');
    }
  }

  /**
   * Obtener logros del usuario
   */
  async getUserAchievements(userId: string): Promise<string[]> {
    try {
      const stats = await this.statsRepository.findByUserId(userId);
      if (!stats) {
        return [];
      }

      return stats.checkAchievements();
    } catch (error: any) {
      this.log(`Error obteniendo logros: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Obtener clasificación del jugador
   */
  async getPlayerRanking(userId: string): Promise<{
    rank: number;
    totalPlayers: number;
    percentile: number;
  }> {
    try {
      const stats = await this.statsRepository.findByUserId(userId);
      if (!stats) {
        throw new Error('Estadísticas no encontradas');
      }

      // Obtener todos los jugadores ordenados por mejor puntuación
      const allStats = await this.statsRepository.findAll({
        orderBy: 'bestScore',
      });

      const rank = allStats.findIndex(s => s.userId === userId) + 1;
      const totalPlayers = allStats.length;
      const percentile = ((totalPlayers - rank) / totalPlayers) * 100;

      return { rank, totalPlayers, percentile };
    } catch (error: any) {
      this.handleError(error, 'getPlayerRanking');
    }
  }

  /**
   * Banear usuario
   */
  async banUser(
    userId: string,
    reason: string,
    duration?: number // minutos, undefined = permanente
  ): Promise<User> {
    try {
      this.log(`Baneando usuario: ${userId}. Razón: ${reason}`);

      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const bannedUntil = duration
        ? new Date(Date.now() + duration * 60 * 1000)
        : null;

      return await this.userRepository.update(userId, {
        isBanned: true,
        bannedUntil,
        banReason: reason,
      });
    } catch (error: any) {
      this.handleError(error, 'banUser');
    }
  }

  /**
   * Desbanear usuario
   */
  async unbanUser(userId: string): Promise<User> {
    try {
      this.log(`Desbaneando usuario: ${userId}`);

      return await this.userRepository.update(userId, {
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      });
    } catch (error: any) {
      this.handleError(error, 'unbanUser');
    }
  }

  /**
   * Obtener usuarios baneados
   */
  async getBannedUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findBannedUsers();
    } catch (error: any) {
      this.handleError(error, 'getBannedUsers');
    }
  }

  /**
   * Obtener top jugadores
   */
  async getTopPlayers(limit: number = 10): Promise<Array<{
    user: User;
    stats: PlayerStats;
  }>> {
    try {
      const topStats = await this.statsRepository.getTopPlayers('bestScore', limit);

      const results = await Promise.all(
        topStats.map(async (stats) => {
          const user = await this.userRepository.findById(stats.userId);
          return { user: user!, stats };
        })
      );

      return results.filter(r => r.user !== null);
    } catch (error: any) {
      this.handleError(error, 'getTopPlayers');
    }
  }
}
