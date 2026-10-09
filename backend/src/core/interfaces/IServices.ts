/**
 * Interfaces de Servicios - Contrato de la capa de negocio
 * 
 * PRINCIPIO SOLID - Interface Segregation Principle (ISP):
 * - Cada servicio tiene su propia interfaz específica
 * - Los clientes solo dependen de los métodos que realmente usan
 * 
 * PRINCIPIO SOLID - Dependency Inversion Principle (DIP):
 * - Los controladores dependen de estas interfaces, no de implementaciones concretas
 */

import { User } from '../../models/domain/User.model';
import { PlayerStats } from '../../models/domain/PlayerStats.model';

// ============================================
// SERVICIOS ADMINISTRATIVOS
// ============================================

/**
 * Servicio de Administración de Usuarios
 */
export interface IAdminUserService {
  initialize(): Promise<void>;
  verifyAdmin(adminId: string): Promise<boolean>;
  listUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    banned?: boolean;
  }): Promise<{ users: any[]; total: number; totalPages: number }>;
  getUserDetail(userId: string): Promise<any>;
  banUser(
    userId: string,
    reason: string,
    durationMinutes: number | undefined,
    adminId: string
  ): Promise<User>;
  unbanUser(userId: string, adminId: string): Promise<User>;
  getBannedUsers(): Promise<User[]>;
  changeUserRole(userId: string, newRole: string, adminId: string): Promise<User>;
  updateUserCurrency(
    userId: string,
    coins: number | undefined,
    gems: number | undefined,
    adminId: string
  ): Promise<User>;
  deleteUser(userId: string, adminId: string): Promise<void>;
}

/**
 * Servicio de Analíticas Administrativas
 */
export interface IAdminAnalyticsService {
  initialize(): Promise<void>;
  getAllMatches(options?: {
    page?: number;
    limit?: number;
    mode?: string;
    userId?: string;
  }): Promise<{ matches: any[]; total: number }>;
  getGeneralStats(): Promise<any>;
  getAnalytics(period: string): Promise<any>;
  giveCurrencyToAll(
    coins: number | undefined,
    gems: number | undefined,
    adminId: string
  ): Promise<{ affectedUsers: number }>;
}

/**
 * Servicio de Contenido Administrativo (Anuncios y Promociones)
 */
export interface IAdminContentService {
  initialize(): Promise<void>;
  listAnnouncements(): Promise<any[]>;
  createAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    expiresAt?: string;
    adminId: string;
  }): Promise<any>;
  toggleAnnouncement(id: string, isActive: boolean): Promise<any>;
  deleteAnnouncement(id: string): Promise<void>;
  listPromotions(): Promise<any[]>;
  createPromotion(data: {
    name: string;
    description?: string;
    type: string;
    value: number;
    startDate?: string;
    endDate: string;
    adminId: string;
  }): Promise<any>;
  deletePromotion(id: string): Promise<void>;
}

/**
 * Servicio de Logs de Auditoría
 */
export interface IAuditLogService {
  initialize(): Promise<void>;
  getLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    adminId?: string;
  }): Promise<{ logs: any[]; total: number; totalPages: number }>;
}

// ============================================
// SERVICIOS DE USUARIO
// ============================================

/**
 * Servicio de Autenticación
 */
export interface IAuthService {
  initialize(): Promise<void>;
  loginOrRegister(email: string): Promise<User>;
  validateAccess(userId: string): Promise<boolean>;
  isAdmin(userId: string): Promise<boolean>;
}

/**
 * Servicio de Gestión de Usuarios
 */
export interface IUserService {
  initialize(): Promise<void>;
  getUserProfile(userId: string): Promise<{
    user: User;
    stats: PlayerStats | null;
  }>;
  addXpToUser(userId: string, xpAmount: number): Promise<{
    user: User;
    levelsGained: number;
  }>;
  updateCurrency(userId: string, coins?: number, gems?: number): Promise<User>;
  rewardCoins(userId: string, amount: number): Promise<User>;
  recordGamePlayed(
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
  }>;
  getUserAchievements(userId: string): Promise<string[]>;
  getPlayerRanking(userId: string): Promise<{
    rank: number;
    totalPlayers: number;
    percentile: number;
  }>;
  getTopPlayers(limit?: number): Promise<Array<{
    user: User;
    stats: PlayerStats;
  }>>;
}
