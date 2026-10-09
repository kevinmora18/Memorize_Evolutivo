/**
 * BaseEntity - Clase base abstracta para todas las entidades del dominio
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Clase base para GameRoom, User, Match
 * - ABSTRACCIÓN: Define comportamiento común para todas las entidades
 * - ENCAPSULACIÓN: Propiedades protegidas, acceso controlado vía métodos
 * - POLIMORFISMO: toJSON() debe ser implementado por cada subclase
 * 
 * PRINCIPIOS SOLID:
 * - SRP: Solo maneja el ciclo de vida básico de entidades
 * - LSP: Subclases pueden sustituir a BaseEntity sin problemas
 * - DIP: Depende de abstracciones, no de implementaciones concretas
 */
export abstract class BaseEntity<T = any> {
  public readonly id: string;
  public readonly createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: string, createdAt: Date = new Date(), updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt || createdAt;
  }

  /**
   * Getter para updatedAt (inmutable desde afuera)
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Marcar entidad como modificada
   * Debe ser llamado por todos los métodos que mutan el estado
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Serializar a JSON (debe ser implementado por cada subclase)
   */
  abstract toJSON(): T;

  /**
   * Verificar si la entidad existe (útil para validaciones)
   */
  exists(): boolean {
    return !!this.id;
  }

  /**
   * Obtener edad de la entidad
   */
  getAge(): number {
    return Date.now() - this.createdAt.getTime();
  }

  /**
   * Verificar si fue modificada desde la creación
   */
  wasModified(): boolean {
    return this._updatedAt.getTime() > this.createdAt.getTime();
  }
}
