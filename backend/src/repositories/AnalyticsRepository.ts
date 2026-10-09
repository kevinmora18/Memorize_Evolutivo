import { PrismaClient } from '@prisma/client';
import {
  IAnalyticsRepository,
  IAnalyticsOverview,
  IAnalyticsWindow,
} from '../core/interfaces/IRepository';

/**
 * AnalyticsRepository - Repositorio de consultas agregadas (solo lectura) y acciones masivas.
 *
 * EXPLICACIÓN POO Y SOLID:
 * - SRP: Es la única clase responsable de las consultas agregadas de analítica administrativa.
 * - DIP: El servicio de mayor nivel (AdminAnalyticsService) depende de IAnalyticsRepository,
 *   nunca de PrismaClient concreto.
 * - ENCAPSULACIÓN: PrismaClient queda oculto tras la abstracción del repositorio.
 */
export class AnalyticsRepository implements IAnalyticsRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getOverview(): Promise<{
    overview: IAnalyticsOverview;
    matchesByMode: any[];
    topPlayers: any[];
  }> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalMatches,
      activeUsers,
      bannedUsers,
      coinsAgg,
      gemsAgg,
      matchesByMode,
      topPlayers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.user.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { isBanned: true } }),
      this.prisma.user.aggregate({ _sum: { coins: true } }),
      this.prisma.user.aggregate({ _sum: { gems: true } }),
      this.prisma.match.groupBy({ by: ['mode'], _count: { mode: true } }),
      this.prisma.user.findMany({
        orderBy: { xp: 'desc' },
        take: 10,
        include: { stats: true },
      }),
    ]);

    return {
      overview: {
        totalUsers,
        totalMatches,
        activeUsers,
        bannedUsers,
        totalCoins: coinsAgg._sum.coins ?? 0,
        totalGems: gemsAgg._sum.gems ?? 0,
      },
      matchesByMode,
      topPlayers,
    };
  }

  async getWindowMetrics(startDate: Date, endDate: Date): Promise<IAnalyticsWindow> {
    const [newUsers, matchesPlayed, activeUsers, modeDistribution, usersWithMatches] =
      await Promise.all([
        this.prisma.user.count({ where: { createdAt: { gte: startDate } } }),
        this.prisma.match.count({ where: { createdAt: { gte: startDate } } }),
        this.prisma.user.count({ where: { updatedAt: { gte: startDate } } }),
        this.prisma.match.groupBy({
          by: ['mode'],
          where: { createdAt: { gte: startDate } },
          _count: { mode: true },
        }),
        this.prisma.user.findMany({
          where: { matches: { some: { createdAt: { gte: startDate } } } },
          include: { _count: { select: { matches: true } } },
        }),
      ]);

    const retentionRate =
      (usersWithMatches.filter(u => u._count.matches > 1).length /
        (usersWithMatches.length || 1)) *
      100;

    return {
      newUsers,
      matchesPlayed,
      activeUsers,
      modeDistribution,
      retentionRate: Math.round(retentionRate * 100) / 100,
    };
  }

  async giveCurrencyToAll(coins?: number, gems?: number): Promise<number> {
    const updateData: any = {};
    if (coins) updateData.coins = { increment: coins };
    if (gems) updateData.gems = { increment: gems };

    const result = await this.prisma.user.updateMany({ data: updateData });
    return result.count;
  }
}
