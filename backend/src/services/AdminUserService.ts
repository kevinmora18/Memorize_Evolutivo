import { BaseService } from '../core/BaseService';
import { IUserRepository, IAdminLogRepository } from '../core/interfaces/IRepository';
import { IAdminUserService } from '../core/interfaces/IServices';
import { User, UserRole } from '../models/domain/User.model';
import { AdminAction } from '../core/enums/AdminAction';

/**
 * AdminUserService - Responsabilidad única: gestión administrativa de usuarios.
 *
 * EXPLICACIÓN POO Y SOLID:
 * - SRP: Solo administra usuarios (listado, roles, baneos, moneda), nada de contenido ni analítica.
 * - DIP: Depende de abstracciones IUserRepository / IAdminLogRepository inyectadas por constructor.
 * - HERENCIA: Extiende BaseService para logging y manejo de errores homogéneos.
 * - ISP: Implementa únicamente el contrato IAdminUserService.
 */
export class AdminUserService extends BaseService implements IAdminUserService {
  private userRepository: IUserRepository;
  private adminLogRepository: IAdminLogRepository;

  constructor(userRepository: IUserRepository, adminLogRepository: IAdminLogRepository) {
    super('AdminUserService');
    this.userRepository = userRepository;
    this.adminLogRepository = adminLogRepository;
  }

  async initialize(): Promise<void> {
    this.log('Servicio de administración de usuarios inicializado');
  }

  async verifyAdmin(adminId: string): Promise<boolean> {
    const user = await this.userRepository.findById(adminId);
    return user ? user.isAdmin() : false;
  }

  async listUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    banned?: boolean;
  }): Promise<{ users: any[]; total: number; totalPages: number }> {
    try {
      this.log('Listando usuarios');
      const page = options.page ?? 1;
      const limit = options.limit ?? 50;
      const skip = (page - 1) * limit;

      const { users, total } = await this.userRepository.findWithFilters({
        skip,
        take: limit,
        search: options.search,
        role: options.role,
        banned: options.banned,
      });

      return { users, total, totalPages: Math.ceil(total / limit) };
    } catch (error: any) {
      this.handleError(error, 'listUsers');
    }
  }

  async getUserDetail(userId: string): Promise<any> {
    try {
      this.log(`Obteniendo detalle del usuario: ${userId}`);
      const user = await this.userRepository.findDetail(userId);
      if (!user) throw new Error('Usuario no encontrado');
      return user;
    } catch (error: any) {
      this.handleError(error, 'getUserDetail');
    }
  }

  async banUser(
    userId: string,
    reason: string,
    durationMinutes: number | undefined,
    adminId: string
  ): Promise<User> {
    try {
      this.log(`Baneando usuario: ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      user.applyBan(reason, durationMinutes);
      const updatedUser = await this.userRepository.update(userId, {
        isBanned: user.isBanned,
        bannedUntil: user.bannedUntil,
        banReason: user.banReason,
      });

      await this.adminLogRepository.createLog({
        adminId,
        action: AdminAction.BAN_USER,
        targetId: userId,
        details: JSON.stringify({ reason, durationMinutes }),
      });

      return updatedUser;
    } catch (error: any) {
      this.handleError(error, 'banUser');
    }
  }

  async unbanUser(userId: string, adminId: string): Promise<User> {
    try {
      this.log(`Desbaneando usuario: ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      user.removeBan();
      const updatedUser = await this.userRepository.update(userId, {
        isBanned: false,
        bannedUntil: null,
        banReason: null,
      });

      await this.adminLogRepository.createLog({
        adminId,
        action: AdminAction.UNBAN_USER,
        targetId: userId,
      });

      return updatedUser;
    } catch (error: any) {
      this.handleError(error, 'unbanUser');
    }
  }

  async getBannedUsers(): Promise<User[]> {
    try {
      this.log('Obteniendo usuarios baneados');
      return await this.userRepository.findBannedUsers();
    } catch (error: any) {
      this.handleError(error, 'getBannedUsers');
    }
  }

  async changeUserRole(userId: string, newRole: string, adminId: string): Promise<User> {
    try {
      this.log(`Cambiando rol del usuario ${userId} a ${newRole}`);

      if (!['player', 'admin'].includes(newRole)) {
        throw new Error('Rol inválido');
      }

      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      const updatedUser = await this.userRepository.update(userId, { role: newRole as UserRole });

      await this.adminLogRepository.createLog({
        adminId,
        action: AdminAction.CHANGE_ROLE,
        targetId: userId,
        details: JSON.stringify({ oldRole: user.role, newRole }),
      });

      return updatedUser;
    } catch (error: any) {
      this.handleError(error, 'changeUserRole');
    }
  }

  async updateUserCurrency(
    userId: string,
    coins: number | undefined,
    gems: number | undefined,
    adminId: string
  ): Promise<User> {
    try {
      this.log(`Actualizando monedas del usuario ${userId}`);

      const user = await this.userRepository.findById(userId);
      if (!user) throw new Error('Usuario no encontrado');

      user.setCurrency(coins, gems);

      const updatedUser = await this.userRepository.update(userId, {
        ...(coins !== undefined && { coins }),
        ...(gems !== undefined && { gems }),
      });

      await this.adminLogRepository.createLog({
        adminId,
        action: AdminAction.GIVE_CURRENCY,
        targetId: userId,
        details: JSON.stringify({ coins, gems }),
      });

      return updatedUser;
    } catch (error: any) {
      this.handleError(error, 'updateUserCurrency');
    }
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    try {
      this.log(`Eliminando usuario: ${userId}`);

      await this.userRepository.delete(userId);

      await this.adminLogRepository.createLog({
        adminId,
        action: AdminAction.DELETE_USER,
        targetId: userId,
        details: JSON.stringify({ deletedAt: new Date() }),
      });
    } catch (error: any) {
      this.handleError(error, 'deleteUser');
    }
  }
}
