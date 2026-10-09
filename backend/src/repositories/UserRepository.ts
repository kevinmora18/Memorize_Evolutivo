import { PrismaClient, User as PrismaUser } from '@prisma/client';
import { BaseRepository } from '../core/BaseRepository';
import { User, IUser, UserRole } from '../models/domain/User.model';

/**
 * UserRepository - Repositorio para operaciones de usuario en la base de datos
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseRepository
 * - POLIMORFISMO: Implementa los métodos abstractos de BaseRepository
 * - ENCAPSULACIÓN: Oculta las operaciones de Prisma detrás de métodos simples
 * - SRP (Single Responsibility): Solo se encarga de acceso a datos de usuarios
 */
export class UserRepository extends BaseRepository<User, string> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'User');
  }

  /**
   * Convierte un registro de Prisma a nuestro modelo de dominio
   */
  private toDomain(prismaUser: PrismaUser): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username,
      role: prismaUser.role as UserRole,
      level: prismaUser.level,
      xp: prismaUser.xp,
      coins: prismaUser.coins,
      gems: prismaUser.gems,
      isBanned: prismaUser.isBanned,
      bannedUntil: prismaUser.bannedUntil,
      banReason: prismaUser.banReason,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  /**
   * Implementación: Buscar usuario por ID
   */
  async findById(id: string): Promise<User | null> {
    this.log(`Buscando usuario por ID: ${id}`);
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user ? this.toDomain(user) : null;
  }

  /**
   * Buscar usuario por email
   */
  async findByEmail(email: string): Promise<User | null> {
    this.log(`Buscando usuario por email: ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user ? this.toDomain(user) : null;
  }

  /**
   * Implementación: Crear nuevo usuario
   */
  async create(data: Partial<IUser>): Promise<User> {
    this.log(`Creando usuario: ${data.email}`);
    const user = await this.prisma.user.create({
      data: {
        email: data.email!,
        username: data.username || data.email!.split('@')[0],
        role: data.role || UserRole.PLAYER,
        level: data.level || 1,
        xp: data.xp || 0,
        coins: data.coins || 500,
        gems: data.gems || 50,
      },
    });
    return this.toDomain(user);
  }

  /**
   * Implementación: Actualizar usuario
   */
  async update(id: string, data: Partial<IUser>): Promise<User> {
    this.log(`Actualizando usuario: ${id}`);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        level: data.level,
        xp: data.xp,
        coins: data.coins,
        gems: data.gems,
        role: data.role,
        isBanned: data.isBanned,
        bannedUntil: data.bannedUntil,
        banReason: data.banReason,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(user);
  }

  /**
   * Implementación: Eliminar usuario
   */
  async delete(id: string): Promise<void> {
    this.log(`Eliminando usuario: ${id}`);
    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Implementación: Listar todos los usuarios
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: 'createdAt' | 'level' | 'xp';
  }): Promise<User[]> {
    this.log('Listando usuarios');
    const users = await this.prisma.user.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy ? { [options.orderBy]: 'desc' } : undefined,
    });
    return users.map(user => this.toDomain(user));
  }

  /**
   * Buscar usuarios baneados
   */
  async findBannedUsers(): Promise<User[]> {
    this.log('Buscando usuarios baneados');
    const users = await this.prisma.user.findMany({
      where: { isBanned: true },
    });
    return users.map(user => this.toDomain(user));
  }

  /**
   * Actualizar última conexión
   */
  async updateLastLogin(id: string): Promise<void> {
    this.log(`Actualizando última conexión: ${id}`);
    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: new Date() },
    });
  }
}
