/**
 * PlayerStats Domain Model - Modelo de dominio para Estadísticas
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Agrupa estadísticas y cálculos relacionados
 * - MÉTODOS DE NEGOCIO: Cálculos de win rate, promedio, etc.
 */

export interface IPlayerStats {
  id: string;
  userId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  bestScore: number;
  totalMatches: number;
  perfectMatches: number;
  maxCombo: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Clase PlayerStats con métodos de cálculo
 */
export class PlayerStats implements IPlayerStats {
  readonly id: string;
  readonly userId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  bestScore: number;
  totalMatches: number;
  perfectMatches: number;
  maxCombo: number;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(data: IPlayerStats) {
    this.id = data.id;
    this.userId = data.userId;
    this.gamesPlayed = data.gamesPlayed;
    this.gamesWon = data.gamesWon;
    this.totalScore = data.totalScore;
    this.bestScore = data.bestScore;
    this.totalMatches = data.totalMatches;
    this.perfectMatches = data.perfectMatches;
    this.maxCombo = data.maxCombo;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Calcula el porcentaje de victorias
   */
  getWinRate(): number {
    if (this.gamesPlayed === 0) return 0;
    return (this.gamesWon / this.gamesPlayed) * 100;
  }

  /**
   * Calcula el promedio de puntuación
   */
  getAverageScore(): number {
    if (this.gamesPlayed === 0) return 0;
    return this.totalScore / this.gamesPlayed;
  }

  /**
   * Calcula el porcentaje de matches perfectos
   */
  getPerfectMatchRate(): number {
    if (this.totalMatches === 0) return 0;
    return (this.perfectMatches / this.totalMatches) * 100;
  }

  /**
   * Registra una partida jugada
   */
  recordGame(score: number, won: boolean, matches: number, perfectMatches: number, combo: number): void {
    this.gamesPlayed++;
    if (won) this.gamesWon++;
    
    this.totalScore += score;
    if (score > this.bestScore) {
      this.bestScore = score;
    }

    this.totalMatches += matches;
    this.perfectMatches += perfectMatches;
    
    if (combo > this.maxCombo) {
      this.maxCombo = combo;
    }

    this.updatedAt = new Date();
  }

  /**
   * Obtiene nivel de experiencia basado en estadísticas
   */
  getSkillLevel(): 'Novice' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' {
    const winRate = this.getWinRate();
    const avgScore = this.getAverageScore();

    if (this.gamesPlayed < 10) return 'Novice';
    if (winRate < 40 || avgScore < 500) return 'Intermediate';
    if (winRate < 60 || avgScore < 1000) return 'Advanced';
    if (winRate < 80 || avgScore < 1500) return 'Expert';
    return 'Master';
  }

  /**
   * Verifica si hay logros nuevos
   */
  checkAchievements(): string[] {
    const achievements: string[] = [];

    if (this.gamesPlayed >= 100) achievements.push('CENTURION');
    if (this.gamesWon >= 50) achievements.push('WINNER_50');
    if (this.bestScore >= 2000) achievements.push('HIGH_SCORER');
    if (this.maxCombo >= 10) achievements.push('COMBO_MASTER');
    if (this.getWinRate() >= 80) achievements.push('CHAMPION');

    return achievements;
  }

  toJSON(): IPlayerStats {
    return {
      id: this.id,
      userId: this.userId,
      gamesPlayed: this.gamesPlayed,
      gamesWon: this.gamesWon,
      totalScore: this.totalScore,
      bestScore: this.bestScore,
      totalMatches: this.totalMatches,
      perfectMatches: this.perfectMatches,
      maxCombo: this.maxCombo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
