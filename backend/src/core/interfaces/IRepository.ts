/**
 * Interfaces de Repositorios - Abstracción de la capa de datos
 * 
 * PRINCIPIO SOLID - Dependency Inversion Principle (DIP):
 * - Las capas de alto nivel (servicios) dependen de estas abstracciones
 * - No dependen de implementaciones concretas (Prisma, MongoDB, etc.)
 * 
 * PRINCIPIO SOLID - Interface Segregation Principle (ISP):
 * - Interfaces pequeñas y específicas en lugar de una interfaz monolítica
 */

import { User } from '../../models/domain/User.model';

/**
 * Tipos para Analytics
 */
export interface IAnalyticsOverview {
  totalUsers: number;
  totalMatches: number;
  activeUsers: number;
  bannedUsers: number;
  totalCoins: number;
  totalGems: number;
}

export interface IAnalyticsWindow {
  newUsers: number;
  matchesPlayed: number;
  activeUsers: number;
  retentionRate: number;
  modeDistribution: any;
}

/**
 * Repositorio de Usuarios
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findWithFilters(options: {
    skip: number;
    take: number;
    search?: string;
    role?: string;
    banned?: boolean;
  }): Promise<{ users: User[]; total: number }>;
  findDetail(userId: string): Promise<any>;
  findBannedUsers(): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  create(data: any): Promise<User>;
}

/**
 * Repositorio de Logs Administrativos
 */
export interface IAdminLogRepository {
  createLog(data: {
    adminId: string;
    action: string;
    targetId?: string;
    details?: string;
  }): Promise<void>;
  findLogs(options?: {
    adminId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]>;
  findAll(options?: {
    adminId?: string;
    action?: string;
    skip?: number;
    take?: number;
  }): Promise<any[]>;
}

/**
 * Repositorio de Analíticas
 */
export interface IAnalyticsRepository {
  getOverview(): Promise<{
    overview: IAnalyticsOverview;
    matchesByMode: any[];
    topPlayers: any[];
  }>;
  getWindowMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<IAnalyticsWindow>;
  giveCurrencyToAll(coins?: number, gems?: number): Promise<number>;
}

/**
 * Repositorio de Partidas
 */
export interface IMatchRepository {
  findAll(options: {
    userId?: string;
    mode?: string;
    skip: number;
    take: number;
  }): Promise<any[]>;
  count(options: {
    userId?: string;
    mode?: string;
  }): Promise<number>;
  findById(matchId: string): Promise<any | null>;
  create(data: any): Promise<any>;
  update(matchId: string, data: any): Promise<any>;
  delete(matchId: string): Promise<void>;
}

/**
 * Repositorio de Anuncios
 */
export interface IAnnouncementRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findActive(): Promise<any[]>;
  create(data: {
    title: string;
    message: string;
    type: string;
    expiresAt: Date | null;
    isActive: boolean;
  }): Promise<any>;
  update(id: string, data: any): Promise<any>;
  toggleActive(id: string, isActive: boolean): Promise<any>;
  delete(id: string): Promise<void>;
}

/**
 * Repositorio de Promociones
 */
export interface IPromotionRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findActive(): Promise<any[]>;
  create(data: {
    name: string;
    description: string;
    type: string;
    value: number;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
  }): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}
