/**
 * Archivo índice de interfaces - Exporta todas las interfaces desde un solo lugar
 * 
 * VENTAJAS:
 * - Import limpio: import { IUserService, IUserRepository } from '../core/interfaces'
 * - Fácil de mantener: todas las interfaces en un solo lugar
 * - Evita imports relativos complejos: ../../core/interfaces/IServices
 */

// ============================================
// REPOSITORIOS
// ============================================
export {
  IUserRepository,
  IAdminLogRepository,
  IAnalyticsRepository,
  IMatchRepository,
  IAnnouncementRepository,
  IPromotionRepository,
} from './IRepository';

// ============================================
// SERVICIOS
// ============================================
export {
  IAdminUserService,
  IAdminAnalyticsService,
  IAdminContentService,
  IAuditLogService,
  IAuthService,
  IUserService,
} from './IServices';
