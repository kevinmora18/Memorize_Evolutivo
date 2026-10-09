/**
 * User Domain Model - Modelo de dominio para Usuario
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Agrupa todos los datos relacionados con un usuario
 * - ABSTRACCIÓN: Representa el concepto de "Usuario" en el dominio del negocio
 * - INMUTABILIDAD: Usa readonly para proteger datos críticos
 */

export interface IUser {
  id: string;
  email: string;
  username: string | null;
  role: UserRole;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  isBanned: boolean;
  bannedUntil: Date | null;
  banReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin'
}

/**
 * Clase User - Representa un usuario con comportamiento
 */
export class User implements IUser {
  readonly id: string;
  readonly email: string;
  username: string | null;
  role: UserRole;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  isBanned: boolean;
  bannedUntil: Date | null;
  banReason: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(data: IUser) {
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.role = data.role;
    this.level = data.level;
    this.xp = data.xp;
    this.coins = data.coins;
    this.gems = data.gems;
    this.isBanned = data.isBanned;
    this.bannedUntil = data.bannedUntil;
    this.banReason = data.banReason;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * MÉTODOS DE NEGOCIO - Lógica relacionada con el usuario
   */

  /**
   * Verifica si el usuario está actualmente baneado
   */
  isCurrentlyBanned(): boolean {
    if (!this.isBanned) return false;
    
    // Baneo permanente
    if (!this.bannedUntil) return true;
    
    // Baneo temporal - verificar si expiró
    return new Date() < this.bannedUntil;
  }

  /**
   * Calcula el XP necesario para el siguiente nivel
   */
  getXpForNextLevel(): number {
    return this.level * 100;
  }

  /**
   * Verifica si puede subir de nivel
   */
  canLevelUp(): boolean {
    return this.xp >= this.getXpForNextLevel();
  }

  /**
   * Sube de nivel y ajusta el XP
   */
  levelUp(): void {
    if (!this.canLevelUp()) {
      throw new Error('No hay suficiente XP para subir de nivel');
    }
    
    this.xp -= this.getXpForNextLevel();
    this.level++;
    this.updatedAt = new Date();
  }

  /**
   * Añade XP y sube de nivel automáticamente si es posible
   */
  addXp(amount: number): number {
    this.xp += amount;
    let levelsGained = 0;
    
    while (this.canLevelUp()) {
      this.levelUp();
      levelsGained++;
    }
    
    return levelsGained;
  }

  /**
   * Verifica si puede comprar algo
   */
  canAfford(coinsRequired: number, gemsRequired: number = 0): boolean {
    return this.coins >= coinsRequired && this.gems >= gemsRequired;
  }

  /**
   * Realiza una compra
   */
  purchase(coinsRequired: number, gemsRequired: number = 0): void {
    if (!this.canAfford(coinsRequired, gemsRequired)) {
      throw new Error('No tienes suficientes monedas o gemas');
    }
    
    this.coins -= coinsRequired;
    this.gems -= gemsRequired;
    this.updatedAt = new Date();
  }

  /**
   * Añade monedas
   */
  addCoins(amount: number): void {
    this.coins += amount;
    this.updatedAt = new Date();
  }

  /**
   * Añade gemas
   */
  addGems(amount: number): void {
    this.gems += amount;
    this.updatedAt = new Date();
  }

  /**
   * Verifica si es administrador
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Aplica un baneo al usuario
   * @param reason Razón del baneo
   * @param durationMinutes Duración en minutos (undefined para permanente)
   */
  applyBan(reason: string, durationMinutes?: number): void {
    this.isBanned = true;
    this.banReason = reason;
    
    if (durationMinutes !== undefined) {
      const bannedUntil = new Date();
      bannedUntil.setMinutes(bannedUntil.getMinutes() + durationMinutes);
      this.bannedUntil = bannedUntil;
    } else {
      // Baneo permanente
      this.bannedUntil = null;
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Remueve el baneo del usuario
   */
  removeBan(): void {
    this.isBanned = false;
    this.bannedUntil = null;
    this.banReason = null;
    this.updatedAt = new Date();
  }

  /**
   * Establece la moneda del usuario (setter administrativo)
   * @param coins Nueva cantidad de monedas (opcional)
   * @param gems Nueva cantidad de gemas (opcional)
   */
  setCurrency(coins?: number, gems?: number): void {
    if (coins !== undefined) {
      if (coins < 0) throw new Error('Las monedas no pueden ser negativas');
      this.coins = coins;
    }
    
    if (gems !== undefined) {
      if (gems < 0) throw new Error('Las gemas no pueden ser negativas');
      this.gems = gems;
    }
    
    this.updatedAt = new Date();
  }

  /**
   * Convierte a objeto plano (para enviar en respuestas)
   */
  toJSON(): IUser {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      role: this.role,
      level: this.level,
      xp: this.xp,
      coins: this.coins,
      gems: this.gems,
      isBanned: this.isBanned,
      bannedUntil: this.bannedUntil,
      banReason: this.banReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
