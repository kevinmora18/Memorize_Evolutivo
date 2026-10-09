import { BaseService } from '../core/BaseService';
import {
  IAnnouncementRepository,
  IPromotionRepository,
  IAdminLogRepository,
} from '../core/interfaces/IRepository';
import { IAdminContentService } from '../core/interfaces/IServices';

/**
 * AdminContentService - Responsabilidad única: anuncios y promociones.
 *
 * EXPLICACIÓN POO Y SOLID:
 * - SRP: Solo gestiona contenido del sistema (announcements + promotions).
 * - DIP: Depende de IAnnouncementRepository / IPromotionRepository / IAdminLogRepository.
 * - HERENCIA: Extiende BaseService.
 * - ISP: Implementa únicamente IAdminContentService.
 */
export class AdminContentService extends BaseService implements IAdminContentService {
  private announcementRepository: IAnnouncementRepository;
  private promotionRepository: IPromotionRepository;
  private adminLogRepository: IAdminLogRepository;

  constructor(
    announcementRepository: IAnnouncementRepository,
    promotionRepository: IPromotionRepository,
    adminLogRepository: IAdminLogRepository
  ) {
    super('AdminContentService');
    this.announcementRepository = announcementRepository;
    this.promotionRepository = promotionRepository;
    this.adminLogRepository = adminLogRepository;
  }

  async initialize(): Promise<void> {
    this.log('Servicio de contenido administrativo inicializado');
  }

  async listAnnouncements(): Promise<any[]> {
    return this.announcementRepository.findAll();
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    expiresAt?: string;
    adminId: string;
  }): Promise<any> {
    try {
      this.log(`Creando anuncio: ${data.title}`);

      const announcement = await this.announcementRepository.create({
        title: data.title,
        message: data.message,
        type: data.type ?? 'info',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: true,
      });

      await this.adminLogRepository.createLog({
        adminId: data.adminId,
        action: 'create_announcement',
        targetId: announcement.id,
        details: JSON.stringify({ title: data.title, type: data.type }),
      });

      return announcement;
    } catch (error: any) {
      this.handleError(error, 'createAnnouncement');
    }
  }

  async toggleAnnouncement(id: string, isActive: boolean): Promise<any> {
    return this.announcementRepository.toggleActive(id, isActive);
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.announcementRepository.delete(id);
  }

  async listPromotions(): Promise<any[]> {
    return this.promotionRepository.findAll();
  }

  async createPromotion(data: {
    name: string;
    description?: string;
    type: string;
    value: number;
    startDate?: string;
    endDate: string;
    adminId: string;
  }): Promise<any> {
    try {
      this.log(`Creando promoción: ${data.name}`);

      const promotion = await this.promotionRepository.create({
        name: data.name,
        description: data.description ?? '',
        type: data.type,
        value: data.value,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: new Date(data.endDate),
        isActive: true,
      });

      await this.adminLogRepository.createLog({
        adminId: data.adminId,
        action: 'create_promotion',
        targetId: promotion.id,
        details: JSON.stringify({ name: data.name, type: data.type, value: data.value }),
      });

      return promotion;
    } catch (error: any) {
      this.handleError(error, 'createPromotion');
    }
  }

  async deletePromotion(id: string): Promise<void> {
    await this.promotionRepository.delete(id);
  }
}
