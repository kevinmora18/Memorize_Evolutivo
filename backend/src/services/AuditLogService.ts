import { BaseService } from '../core/BaseService';
import { IAdminLogRepository } from '../core/interfaces/IRepository';
import { IAuditLogService } from '../core/interfaces/IServices';

/**
 * AuditLogService - Responsabilidad única: consulta de auditoría administrativa.
 *
 * EXPLICACIÓN POO Y SOLID:
 * - SRP: Solo lee/expone los logs de auditoría.
 * - DIP: Depende de la abstracción IAdminLogRepository.
 * - HERENCIA: Extiende BaseService.
 * - ISP: Implementa únicamente IAuditLogService.
 */
export class AuditLogService extends BaseService implements IAuditLogService {
  private adminLogRepository: IAdminLogRepository;

  constructor(adminLogRepository: IAdminLogRepository) {
    super('AuditLogService');
    this.adminLogRepository = adminLogRepository;
  }

  async initialize(): Promise<void> {
    this.log('Servicio de auditoría inicializado');
  }

  async getLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    adminId?: string;
  }): Promise<{ logs: any[]; total: number; totalPages: number }> {
    try {
      this.log('Obteniendo logs administrativos');
      const logs = await this.adminLogRepository.findAll(options);
      
      // Envolver el resultado para cumplir con el contrato esperado
      return {
        logs,
        total: logs.length,
        totalPages: Math.ceil(logs.length / (options.limit || 10)),
      };
    } catch (error: any) {
      this.handleError(error, 'getLogs');
    }
  }
}
