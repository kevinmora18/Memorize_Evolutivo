import { PrismaClient, PlayerStats as PrismaPlayerStats } from '@prisma/client';
import { BaseRepository } from '../core/BaseRepository';
import { PlayerStats, IPlayerStats } from '../models/domain/PlayerStats.model';

/**
 * PlayerStatsRepository - Repositorio para estadísticas de jugadores
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseRepository
 * - SRP: Solo maneja acceso a datos de estadísticas
 * - ABSTRACCIÓN: Oculta Prisma detrás de métodos simples
 */
export class PlayerStatsRepository extends BaseRepository<PlayerStats, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'PlayerStats');
  }

  /**
   * Convierte registro de Prisma a modelo de dominio
   */
  private toDomain(prismaStats: PrismaPlayerStats): PlayerStats {
    return new PlayerStats({
      id: prismaStats.id,
      userId: prismaStats.userId,
      gamesPlayed: prismaStats.gamesPlayed,
      gamesWon: prismaStats.gamesWon,
      totalScore: prismaStats.totalScore,
      bestScore: prismaStats.bestScore,
      totalMatches: prismaStats.totalMatches,
      perfectMatches: prismaStats.perfectMatches,
      maxCombo: prismaStats.maxCombo,
      createdAt: prismaStats.createdAt,
      updatedAt: prismaStats.updatedAt,
    });
  }

  /**
   * Buscar estadísticas por ID
   */
  async findById(id: string): Promise<PlayerStats | null> {
    this.log(`Buscando estadísticas por ID: ${id}`);
    const stats = await this.prisma.playerStats.findUnique({
      where: { id },
    });
    return stats ? this.toDomain(stats) : null;
  }

  /**
   * Buscar estadísticas por userId
   */
  async findByUserId(userId: string): Promise<PlayerStats | null> {
    this.log(`Buscando estadísticas del usuario: ${userId}`);
    const stats = await this.prisma.playerStats.findUnique({
      where: { userId },
    });
    return stats ? this.toDomain(stats) : null;
  }

  /**
   * Crear nuevas estadísticas
   */
  async create(data: Partial<IPlayerStats>): Promise<PlayerStats> {
    this.log(`Creando estadísticas para usuario: ${data.userId}`);
    const stats = await this.prisma.playerStats.create({
      data: {
        userId: data.userId!,
        gamesPlayed: data.gamesPlayed || 0,
        gamesWon: data.gamesWon || 0,
        totalScore: data.totalScore || 0,
        bestScore: data.bestScore || 0,
        totalMatches: data.totalMatches || 0,
        perfectMatches: data.perfectMatches || 0,
        maxCombo: data.maxCombo || 0,
      },
    });
    return this.toDomain(stats);
  }

  /**
   * Actualizar estadísticas
   */
  async update(id: string, data: Partial<IPlayerStats>): Promise<PlayerStats> {
    this.log(`Actualizando estadísticas: ${id}`);
    const stats = await this.prisma.playerStats.update({
      where: { id },
      data: {
        gamesPlayed: data.gamesPlayed,
        gamesWon: data.gamesWon,
        totalScore: data.totalScore,
        bestScore: data.bestScore,
        totalMatches: data.totalMatches,
        perfectMatches: data.perfectMatches,
        maxCombo: data.maxCombo,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(stats);
  }

  /**
   * Eliminar estadísticas
   */
  async delete(id: string): Promise<void> {
    this.log(`Eliminando estadísticas: ${id}`);
    await this.prisma.playerStats.delete({
      where: { id },
    });
  }

  /**
   * Listar todas las estadísticas
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: 'gamesPlayed' | 'gamesWon' | 'bestScore' | 'totalScore';
  }): Promise<PlayerStats[]> {
    this.log('Listando estadísticas');
    const statsList = await this.prisma.playerStats.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy ? { [options.orderBy]: 'desc' } : undefined,
    });
    return statsList.map(stats => this.toDomain(stats));
  }

  /**
   * Obtener top jugadores por criterio
   */
  async getTopPlayers(
    criteria: 'bestScore' | 'gamesWon' | 'totalScore',
    limit: number = 10
  ): Promise<PlayerStats[]> {
    this.log(`Obteniendo top ${limit} jugadores por ${criteria}`);
    const statsList = await this.prisma.playerStats.findMany({
      orderBy: { [criteria]: 'desc' },
      take: limit,
    });
    return statsList.map(stats => this.toDomain(stats));
  }

  /**
   * Crear o actualizar estadísticas (upsert)
   */
  async upsert(userId: string, data: Partial<IPlayerStats>): Promise<PlayerStats> {
    this.log(`Upsert estadísticas para usuario: ${userId}`);
    const stats = await this.prisma.playerStats.upsert({
      where: { userId },
      update: {
        gamesPlayed: data.gamesPlayed,
        gamesWon: data.gamesWon,
        totalScore: data.totalScore,
        bestScore: data.bestScore,
        totalMatches: data.totalMatches,
        perfectMatches: data.perfectMatches,
        maxCombo: data.maxCombo,
        updatedAt: new Date(),
      },
      create: {
        userId,
        gamesPlayed: data.gamesPlayed || 0,
        gamesWon: data.gamesWon || 0,
        totalScore: data.totalScore || 0,
        bestScore: data.bestScore || 0,
        totalMatches: data.totalMatches || 0,
        perfectMatches: data.perfectMatches || 0,
        maxCombo: data.maxCombo || 0,
      },
    });
    return this.toDomain(stats);
  }
}
