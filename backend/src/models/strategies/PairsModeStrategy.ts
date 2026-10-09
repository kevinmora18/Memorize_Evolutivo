import { BaseGameModeStrategy } from './BaseGameModeStrategy';
import { ICard, IMatchResult } from '../../core/interfaces/IGameModeStrategy';

/**
 * PairsModeStrategy - Modo clásico de juego (2 cartas iguales)
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseGameModeStrategy reutilizando lógica común
 * - POLIMORFISMO: Implementa checkMatch() de forma específica para pares
 * - ENCAPSULACIÓN: Lógica específica de pares encapsulada en esta clase
 * 
 * PRINCIPIOS SOLID:
 * - SRP: Solo maneja la lógica del modo clásico (pares)
 * - OCP: Extiende BaseGameModeStrategy sin modificarla
 * - LSP: Puede sustituir a cualquier IGameModeStrategy
 * 
 * REGLAS DEL MODO:
 * - Se voltean 2 cartas por turno
 * - Match = ambas cartas tienen el mismo id
 * - XP base: 50 puntos
 * - Puntos: 100 por match
 */
export class PairsModeStrategy extends BaseGameModeStrategy {
  readonly name = 'classic';
  readonly requiredFlips = 2;
  readonly description = 'Modo clásico: encuentra pares de cartas idénticas';

  /**
   * Constructor: configura valores base para el modo clásico
   */
  constructor() {
    super();
    this.baseXp = 50;
    this.baseCoins = 10;
    this.comboMultiplier = 1.5;
  }

  /**
   * Verifica si dos cartas forman un par
   * @param cards Todas las cartas del tablero
   * @param flippedIndexes Índices de las 2 cartas volteadas
   * @returns Resultado del match
   */
  checkMatch(cards: ICard[], flippedIndexes: number[]): IMatchResult {
    // Validar que hay exactamente 2 cartas
    if (flippedIndexes.length !== this.requiredFlips) {
      return {
        isMatch: false,
        cardIndexes: flippedIndexes,
        points: 0,
      };
    }

    // Obtener las cartas por sus índices
    const flippedCards = this.getCardsByIndexes(cards, flippedIndexes);

    // Verificar que ambas cartas existen
    if (flippedCards.length !== 2 || flippedCards.some(card => !card)) {
      return {
        isMatch: false,
        cardIndexes: flippedIndexes,
        points: 0,
      };
    }

    // Verificar si las cartas son idénticas (mismo id)
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
   * Sobrescribe el tamaño del tablero para pares
   * En modo clásico: número par de cartas
   */
  getBoardSize(difficulty: 'easy' | 'medium' | 'hard'): number {
    const sizes = {
      easy: 12,    // 6 pares (3x4)
      medium: 20,  // 10 pares (4x5)
      hard: 30,    // 15 pares (5x6)
    };
    return sizes[difficulty];
  }

  /**
   * Validación específica para pares: debe haber un número par de cartas
   */
  validateBoard(cards: ICard[]): boolean {
    if (!super.validateBoard(cards)) return false;

    // Verificar que hay un número par de cartas
    if (cards.length % 2 !== 0) return false;

    // Verificar que cada carta tiene exactamente un par
    const cardCounts = new Map<string, number>();
    cards.forEach(card => {
      cardCounts.set(card.id, (cardCounts.get(card.id) || 0) + 1);
    });

    // Todas las cartas deben aparecer exactamente 2 veces
    return Array.from(cardCounts.values()).every(count => count === 2);
  }

  /**
   * Puntos base para el modo clásico
   */
  protected calculateBasePoints(): number {
    return 100;
  }
}
