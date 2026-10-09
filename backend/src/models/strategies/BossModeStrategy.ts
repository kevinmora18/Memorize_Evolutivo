import { BaseGameModeStrategy } from './BaseGameModeStrategy';
import { ICard, IMatchResult } from '../../core/interfaces/IGameModeStrategy';

/**
 * BossModeStrategy - Modo Boss con mecánicas especiales
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseGameModeStrategy reutilizando lógica común
 * - POLIMORFISMO: Implementa checkMatch() con mecánicas especiales (bonus por categoría)
 * - ENCAPSULACIÓN: Lógica específica del modo boss encapsulada
 * 
 * PRINCIPIOS SOLID:
 * - SRP: Solo maneja la lógica del modo boss
 * - OCP: Extiende BaseGameModeStrategy sin modificarla
 * - LSP: Puede sustituir a cualquier IGameModeStrategy
 * 
 * REGLAS DEL MODO:
 * - Se voltean 2 cartas por turno (como clásico)
 * - Match normal = cartas con mismo id → 100 puntos
 * - Match especial = cartas con misma categoría → 150 puntos + bonus
 * - XP base: 60 puntos
 * - Tiene "cartas boss" que otorgan bonus extra
 */
export class BossModeStrategy extends BaseGameModeStrategy {
  readonly name = 'boss';
  readonly requiredFlips = 2;
  readonly description = 'Modo Boss: encuentra pares y desbloquea bonus por categoría';

  /**
   * Categorías especiales que otorgan bonus
   */
  private readonly bossCategories = ['legendary', 'epic', 'rare'];

  /**
   * Constructor: configura valores base para el modo boss
   */
  constructor() {
    super();
    this.baseXp = 60;
    this.baseCoins = 12;
    this.comboMultiplier = 2.0; // Mayor multiplicador
  }

  /**
   * Verifica si dos cartas forman un match (con mecánicas especiales)
   * @param cards Todas las cartas del tablero
   * @param flippedIndexes Índices de las 2 cartas volteadas
   * @returns Resultado del match con posible bonus
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

    const [card1, card2] = flippedCards;

    // Tipo 1: Match perfecto (mismo id) → puntos base
    const isPerfectMatch = this.areCardsIdentical(flippedCards);
    
    // Tipo 2: Match por categoría (categoría especial) → puntos + bonus
    const isCategoryMatch = this.areCardsInSameCategory(flippedCards);
    const isBossCategory = card1.category && this.bossCategories.includes(card1.category);

    let isMatch = false;
    let points = 0;
    let bonus = 0;

    if (isPerfectMatch) {
      // Match perfecto
      isMatch = true;
      points = this.calculateBasePoints();

      // Bonus adicional si es de categoría boss
      if (isBossCategory) {
        bonus = this.calculateBossBonus(card1.category!);
        points += bonus;
      }
    } else if (isCategoryMatch && isBossCategory) {
      // Match especial por categoría boss
      isMatch = true;
      points = Math.floor(this.calculateBasePoints() * 1.5); // 50% más puntos
      bonus = this.calculateBossBonus(card1.category!);
      points += bonus;
    }

    return {
      isMatch,
      cardIndexes: flippedIndexes,
      points,
      bonus, // ← Incluye el bonus si existe
    };
  }

  /**
   * Calcula el bonus según la categoría boss
   * @param category Categoría de la carta
   * @returns Puntos de bonus
   */
  private calculateBossBonus(category: string): number {
    const bonusMap: Record<string, number> = {
      legendary: 100, // +100 puntos
      epic: 50,       // +50 puntos
      rare: 25,       // +25 puntos
    };
    return bonusMap[category] || 0;
  }

  /**
   * Sobrescribe el tamaño del tablero para modo boss
   */
  getBoardSize(difficulty: 'easy' | 'medium' | 'hard'): number {
    const sizes = {
      easy: 16,    // 8 pares (4x4)
      medium: 24,  // 12 pares (4x6)
      hard: 36,    // 18 pares (6x6)
    };
    return sizes[difficulty];
  }

  /**
   * Validación específica para boss mode
   */
  validateBoard(cards: ICard[]): boolean {
    if (!super.validateBoard(cards)) return false;

    // Verificar que hay al menos algunas cartas con categoría
    const cardsWithCategory = cards.filter(card => card.category);
    if (cardsWithCategory.length === 0) return false;

    // Verificar que hay al menos una carta boss
    const bossCards = cards.filter(card => 
      card.category && this.bossCategories.includes(card.category)
    );
    
    return bossCards.length >= 2; // Al menos 1 par de cartas boss
  }

  /**
   * Puntos base para el modo boss
   */
  protected calculateBasePoints(): number {
    return 100;
  }

  /**
   * Cálculo de XP con sistema de bonus por categoría
   */
  calculateXp(matchCount: number, combo: number): number {
    const baseXp = super.calculateXp(matchCount, combo);
    
    // Bonus progresivo por número de matches
    const progressBonus = Math.floor(matchCount * 5);
    
    return baseXp + progressBonus;
  }

  /**
   * Cálculo de monedas con bonus por combo
   */
  calculateCoins(matchCount: number, combo: number): number {
    const baseCoins = super.calculateCoins(matchCount, combo);
    
    // Bonus extra si el combo es alto (3+)
    const highComboBonus = combo >= 3 ? Math.floor(baseCoins * 0.5) : 0;
    
    return baseCoins + highComboBonus;
  }
}
