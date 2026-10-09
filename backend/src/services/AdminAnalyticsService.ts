import { BaseService } from '../core/BaseService';
import { IAnalyticsRepository, IMatchRepository, IAdminLogRepository } from '../core/interfaces/IRepository';
import { IAdminAnalyticsService } from '../core/interfaces/IServices';
import { AdminAction } from '../core/enums/AdminAction';

/**
 * AdminAnalyticsService - Responsabilidad única: métricas, analítica y listado de partidas.
 *
 * EXPLICACIÓN POO Y SOLID:
 * - SRP: Solo produce reportes/estadísticas y expone el listado administrativo de partidas.
 * - DIP: Depende de IAnalyticsRepository / IMatchRepository / IAdminLogRepository;
 *   ninguna referencia a PrismaClient concreto.
 * - HERENCIA: Extiende BaseService.
 * - ISP: Implementa únicamente IAdminAnalyticsService.
 */
export class AdminAnalyticsService extends BaseService implements IAdminAnalyticsService {
  private analyticsRepository: IAnalyticsRepository;
  private matchRepository: IMatchRepository;
  private adminLogRepository: IAdminLogRepository;

  constructor(
    analyticsRepository: IAnalyticsRepository,
    matchRepository: IMatchRepository,
    adminLogRepository: IAdminLogRepository
  ) {
    super('AdminAnalyticsService');
    this.analyticsRepository = analyticsRepository;
    this.matchRepository = matchRepository;
    this.adminLogRepository = adminLogRepository;
  }

  async initialize(): Promise<void> {
    this.log('Servicio de analítica administrativa inicializado');
  }

  async getAllMatches(options?: {
    page?: number;
    limit?: number;
    mode?: string;
    userId?: string;
  }): Promise<{ matches: any[]; total: number }> {
    try {
      this.log('Listando todas las partidas (admin)');

      const page = options?.page ?? 1;
      const limit = options?.limit ?? 20;
      const skip = (page - 1) * limit;

      const [matches, total] = await Promise.all([
        this.matchRepository.findAll({
          userId: options?.userId,
          mode: options?.mode,
          skip,
          take: limit,
        }),
        this.matchRepository.count({
          userId: options?.userId,
          mode: options?.mode,
        }),
      ]);

      return { matches, total };
    } catch (error: any) {
      this.handleError(error, 'getAllMatches');
    }
  }

  async getGeneralStats(): Promise<any> {
    try {
      this.log('Obteniendo estadísticas generales');
      return await this.analyticsRepository.getOverview();
    } catch (error: any) {
      this.handleError(error, 'getGeneralStats');
    }
  }

  async getAnalytics(period: string): Promise<any> {
    try {
      this.log(`Obteniendo analíticas para período: ${period}`);

      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case '24h': startDate.setHours(now.getHours() - 24); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '90d': startDate.setDate(now.getDate() - 90); break;
        default: startDate.setDate(now.getDate() - 7); break;
      }

      const window = await this.analyticsRepository.getWindowMetrics(startDate, now);

      return {
        period,
        startDate,
        endDate: now,
        metrics: {
          newUsers: window.newUsers,
          matchesPlayed: window.matchesPlayed,
          activeUsers: window.activeUsers,
          retentionRate: window.retentionRate,
          avgMatchesPerUser:
            Math.round((window.matchesPlayed / (window.activeUsers || 1)) * 100) / 100,
        },
        modeDistribution: window.modeDistribution,
      };
    } catch (error: any) {
      this.handleError(error, 'getAnalytics');
    }
  }

  async giveCurrencyToAll(
    coins: number | undefined,
    gems: number | undefined,
    adminId: string
  ): Promise<{ affectedUsers: number }> {
    try {
      this.log('Dando monedas/gemas a todos los usuarios');

      const affectedUsers = await this.analyticsRepository.giveCurrencyToAll(coins, gems);

      await this.adminLogRepository.createLog({
        adminId,
        action: AdminAction.GIVE_CURRENCY_ALL,
        details: JSON.stringify({ coins, gems, affectedUsers }),
      });

      return { affectedUsers };
    } catch (error: any) {
      this.handleError(error, 'giveCurrencyToAll');
    }
  }
}
