import { BaseGameModeStrategy } from './BaseGameModeStrategy';
import { ICard, IMatchResult } from '../../core/interfaces/IGameModeStrategy';

/**
 * TriadsModeStrategy - Modo de tríadas (3 cartas iguales)
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseGameModeStrategy reutilizando lógica común
 * - POLIMORFISMO: Implementa checkMatch() de forma específica para tríadas
 * - ENCAPSULACIÓN: Lógica específica de tríadas encapsulada en esta clase
 * 
 * PRINCIPIOS SOLID:
 * - SRP: Solo maneja la lógica del modo tríadas
 * - OCP: Extiende BaseGameModeStrategy sin modificarla
 * - LSP: Puede sustituir a cualquier IGameModeStrategy
 * 
 * REGLAS DEL MODO:
 * - Se voltean 3 cartas por turno
 * - Match = las 3 cartas tienen el mismo id
 * - XP base: 75 puntos (más difícil que pares)
 * - Puntos: 150 por match (más que pares)
 */
export class TriadsModeStrategy extends BaseGameModeStrategy {
  readonly name = 'triads';
  readonly requiredFlips = 3;
  readonly description = 'Modo tríadas: encuentra tríos de cartas idénticas';

  /**
   * Constructor: configura valores base para el modo tríadas
   */
  constructor() {
    super();
    this.baseXp = 75;        // 50% más XP que el modo clásico
    this.baseCoins = 15;     // 50% más monedas
    this.comboMultiplier = 1.8; // Mayor multiplicador de combo
  }

  /**
   * Verifica si tres cartas forman una tríada
   * @param cards Todas las cartas del tablero
   * @param flippedIndexes Índices de las 3 cartas volteadas
   * @returns Resultado del match
   */
  checkMatch(cards: ICard[], flippedIndexes: number[]): IMatchResult {
    // Validar que hay exactamente 3 cartas
    if (flippedIndexes.length !== this.requiredFlips) {
      return {
        isMatch: false,
        cardIndexes: flippedIndexes,
        points: 0,
      };
    }

    // Obtener las cartas por sus índices
    const flippedCards = this.getCardsByIndexes(cards, flippedIndexes);

    // Verificar que las 3 cartas existen
    if (flippedCards.length !== 3 || flippedCards.some(card => !card)) {
      return {
        isMatch: false,
        cardIndexes: flippedIndexes,
        points: 0,
      };
    }

    // Verificar si las 3 cartas son idénticas (mismo id)
    const isMatch = this.areCardsIdentical(flippedCards);

    // Calcular puntos si hay match
    const points = isMatch ? this.calculateBasePoints() : 0;

    return {
      isMatch,
      cardIndexes: flippedIndexes,
      points,
    };
  }

  /**
   * Sobrescribe el tamaño del tablero para tríadas
   * En modo tríadas: número múltiplo de 3
   */
  getBoardSize(difficulty: 'easy' | 'medium' | 'hard'): number {
    const sizes = {
      easy: 12,    // 4 tríadas (3x4)
      medium: 18,  // 6 tríadas (3x6)
      hard: 27,    // 9 tríadas (3x9)
    };
    return sizes[difficulty];
  }

  /**
   * Validación específica para tríadas: debe haber un número múltiplo de 3
   */
  validateBoard(cards: ICard[]): boolean {
    if (!super.validateBoard(cards)) return false;

    // Verificar que hay un número múltiplo de 3 de cartas
    if (cards.length % 3 !== 0) return false;

    // Verificar que cada carta aparece exactamente 3 veces
    const cardCounts = new Map<string, number>();
    cards.forEach(card => {
      cardCounts.set(card.id, (cardCounts.get(card.id) || 0) + 1);
    });

    // Todas las cartas deben aparecer exactamente 3 veces
    return Array.from(cardCounts.values()).every(count => count === 3);
  }

  /**
   * Puntos base para el modo tríadas (más que pares)
   */
  protected calculateBasePoints(): number {
    return 150;
  }

  /**
   * Cálculo de XP con bonus adicional por dificultad
   */
  calculateXp(matchCount: number, combo: number): number {
    const baseXp = super.calculateXp(matchCount, combo);
    
    // Bonus adicional por hacer tríadas (10% más)
    const triadBonus = Math.floor(baseXp * 0.1);
    
    return baseXp + triadBonus;
  }
}
