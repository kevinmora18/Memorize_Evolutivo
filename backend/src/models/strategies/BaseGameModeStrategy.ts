import { IGameModeStrategy, ICard, IMatchResult } from '../../core/interfaces/IGameModeStrategy';

/**
 * BaseGameModeStrategy - Clase base abstracta para todas las estrategias de modo de juego
 * 
 * EXPLICACIÓN POO:
 * - ABSTRACCIÓN: Define el contrato base que todos los modos deben seguir
 * - HERENCIA: Las estrategias concretas heredarán de esta clase
 * - ENCAPSULACIÓN: Métodos comunes protegidos para reutilización
 * - TEMPLATE METHOD: Define el esqueleto del algoritmo, delegando detalles a subclases
 * 
 * PRINCIPIOS SOLID:
 * - SRP: Solo maneja la lógica común de modos de juego
 * - OCP: Cerrado a modificación, abierto a extensión
 * - LSP: Todas las subclases son sustituibles entre sí
 */
export abstract class BaseGameModeStrategy implements IGameModeStrategy {
  /**
   * Nombre del modo de juego (cada subclase lo define)
   */
  abstract readonly name: string;

  /**
   * Número de cartas requeridas en cada turno
   */
  abstract readonly requiredFlips: number;

  /**
   * Descripción del modo
   */
  abstract readonly description: string;

  /**
   * XP base para un match
   */
  protected baseXp: number = 50;

  /**
   * Monedas base para un match
   */
  protected baseCoins: number = 10;

  /**
   * Multiplicador de combo
   */
  protected comboMultiplier: number = 1.5;

  /**
   * Método abstracto: cada modo define cómo verificar matches
   */
  abstract checkMatch(cards: ICard[], flippedIndexes: number[]): IMatchResult;

  /**
   * Calcula XP con lógica común (puede ser sobrescrito)
   * @param matchCount Número de matches realizados
   * @param combo Combo actual
   */
  calculateXp(matchCount: number, combo: number): number {
    const comboBonus = combo > 1 ? Math.floor(this.baseXp * (combo - 1) * 0.2) : 0;
    return this.baseXp + comboBonus;
  }

  /**
   * Calcula monedas con lógica común (puede ser sobrescrito)
   * @param matchCount Número de matches realizados
   * @param combo Combo actual
   */
  calculateCoins(matchCount: number, combo: number): number {
    const comboBonus = combo > 1 ? Math.floor(this.baseCoins * (combo - 1) * 0.15) : 0;
    return this.baseCoins + comboBonus;
  }

  /**
   * Tamaño del tablero según dificultad (puede ser sobrescrito)
   */
  getBoardSize(difficulty: 'easy' | 'medium' | 'hard'): number {
    const sizes = {
      easy: 12,    // 6 pares
      medium: 20,  // 10 pares
      hard: 30,    // 15 pares
    };
    return sizes[difficulty];
  }

  /**
   * Validación básica del tablero
   */
  validateBoard(cards: ICard[]): boolean {
    // Verificar que hay cartas
    if (!cards || cards.length === 0) return false;

    // Verificar que el número de cartas es par (para pares) o múltiplo de requiredFlips
    return cards.length % this.requiredFlips === 0;
  }

  /**
   * Método auxiliar protegido: verifica si todas las cartas tienen el mismo id
   */
  protected areCardsIdentical(cards: ICard[]): boolean {
    if (cards.length === 0) return false;
    const firstId = cards[0].id;
    return cards.every(card => card.id === firstId);
  }

  /**
   * Método auxiliar protegido: verifica si todas las cartas tienen la misma categoría
   */
  protected areCardsInSameCategory(cards: ICard[]): boolean {
    if (cards.length === 0) return false;
    const firstCategory = cards[0].category;
    return cards.every(card => card.category === firstCategory);
  }

  /**
   * Método auxiliar protegido: obtiene las cartas por sus índices
   */
  protected getCardsByIndexes(cards: ICard[], indexes: number[]): ICard[] {
    return indexes.map(index => cards[index]);
  }

  /**
   * Calcula puntos base (puede ser sobrescrito por modos especiales)
   */
  protected calculateBasePoints(): number {
    return 100;
  }

  /**
   * Representación en string para debugging
   */
  toString(): string {
    return `${this.name} (${this.requiredFlips} cartas)`;
  }
}
