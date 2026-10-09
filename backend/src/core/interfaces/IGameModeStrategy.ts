
/**
 * IGameModeStrategy - Contrato para estrategias de modo de juego
 * 
 * PATRÓN STRATEGY:
 * - Define una familia de algoritmos (modos de juego)
 * - Los encapsula y los hace intercambiables
 * - El algoritmo varía independientemente de los clientes que lo usan
 * 
 * PRINCIPIOS SOLID:
 * - ISP: Interfaz pequeña y específica para modos de juego
 * - OCP: Abierto a extensión (nuevos modos), cerrado a modificación
 * - LSP: Cualquier implementación puede sustituir a otra sin romper el motor
 */

/**
 * Representa una carta en el juego
 */
export interface ICard {
  id: string;
  value: string;
  category?: string;
  isFlipped?: boolean;
  isMatched?: boolean;
}

/**
 * Resultado de evaluar un match
 */
export interface IMatchResult {
  isMatch: boolean;
  cardIndexes: number[];
  points: number;
  bonus?: number;
}

/**
 * Interfaz para estrategias de modo de juego
 */
export interface IGameModeStrategy {
  /**
   * Nombre del modo de juego
   */
  readonly name: string;

  /**
   * Número de cartas que deben voltearse en cada turno
   */
  readonly requiredFlips: number;

  /**
   * Descripción del modo de juego
   */
  readonly description: string;

  /**
   * Verifica si las cartas volteadas forman un match
   * @param cards Todas las cartas del tablero
   * @param flippedIndexes Índices de las cartas volteadas
   * @returns Resultado del match con puntos y bonus
   */
  checkMatch(cards: ICard[], flippedIndexes: number[]): IMatchResult;

  /**
   * Calcula el XP ganado por un match exitoso
   * @param matchCount Número de matches realizados
   * @param combo Combo actual del jugador
   * @returns XP a otorgar
   */
  calculateXp(matchCount: number, combo: number): number;

  /**
   * Calcula las monedas ganadas por un match exitoso
   * @param matchCount Número de matches realizados
   * @param combo Combo actual del jugador
   * @returns Monedas a otorgar
   */
  calculateCoins(matchCount: number, combo: number): number;

  /**
   * Genera el tamaño del tablero recomendado para este modo
   * @param difficulty Dificultad del juego
   * @returns Número total de cartas (pares, tríos, etc.)
   */
  getBoardSize(difficulty: 'easy' | 'medium' | 'hard'): number;

  /**
   * Valida si el tablero es válido para este modo de juego
   * @param cards Cartas del tablero
   * @returns true si es válido
   */
  validateBoard(cards: ICard[]): boolean;
}
