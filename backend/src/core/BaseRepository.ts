import { PrismaClient, Prisma } from '@prisma/client';

/**
 * BaseRepository - Clase abstracta base para repositorios de datos
 * 
 * EXPLICACIÓN POO:
 * - ABSTRACCIÓN: Separa la lógica de acceso a datos del resto de la aplicación
 * - ENCAPSULACIÓN: Oculta los detalles de Prisma detrás de métodos simples
 * - GENÉRICOS: Usa TypeScript generics para reutilizar código (T, ID)
 */
export abstract class BaseRepository<T, ID = string> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Método abstracto - cada repositorio define cómo buscar por ID
   */
  abstract findById(id: ID): Promise<T | null>;

  /**
   * Método abstracto - cada repositorio define cómo crear entidades
   */
  abstract create(data: Partial<T>): Promise<T>;

  /**
   * Método abstracto - cada repositorio define cómo actualizar entidades
   */
  abstract update(id: ID, data: Partial<T>): Promise<T>;

  /**
   * Método abstracto - cada repositorio define cómo eliminar entidades
   */
  abstract delete(id: ID): Promise<void>;

  /**
   * Método abstracto - cada repositorio define cómo listar entidades
   */
  abstract findAll(options?: any): Promise<T[]>;

  /**
   * Ejecuta un callback dentro de una transacción ACID (todo o nada).
   * Si el callback lanza un error, Prisma hace ROLLBACK automático.
   */
  public async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  /**
   * Método protegido para logging
   */
  protected log(message: string): void {
    console.log(`[${this.modelName}Repository] ${message}`);
  }
}
