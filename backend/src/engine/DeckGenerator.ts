import { ICard } from '../core/interfaces/IGameModeStrategy';
import { GameModeFactory } from '../models/strategies/GameModeFactory';

/**
 * DeckGenerator - Generador autoritativo de mazos en el servidor
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Encapsula la lógica de generación de mazos
 * - SRP: Solo genera mazos, no valida reglas ni gestiona turnos
 * - COMPOSICIÓN: Usa GameModeFactory para obtener configuraciones
 * 
 * SERVIDOR AUTORITATIVO:
 * - El mazo se genera en el servidor, no en el cliente
 * - Previene trampas (cliente no puede manipular las cartas)
 * - Garantiza aleatoriedad justa
 */
export class DeckGenerator {
  /**
   * Pool de valores de cartas disponibles
   * En un juego real, esto vendría de una base de datos
   */
  private static readonly CARD_POOL = [
    'apple', 'banana', 'cherry', 'dragon', 'elephant', 'fire',
    'guitar', 'house', 'ice', 'jungle', 'king', 'lion',
    'mountain', 'night', 'ocean', 'planet', 'queen', 'rainbow',
    'star', 'tree', 'universe', 'volcano', 'waterfall', 'xylophone',
    'yacht', 'zebra', 'angel', 'book', 'castle', 'diamond',
  ];

  /**
   * Categorías para el modo Boss
   */
  private static readonly CATEGORIES = ['common', 'rare', 'epic', 'legendary'];

  /**
   * Genera un mazo completo para un modo de juego
   * 
   * @param mode Modo de juego ('classic', 'triads', 'boss')
   * @param difficulty Dificultad ('easy', 'medium', 'hard')
   * @returns Array de cartas barajadas
   */
  static generate(
    mode: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): ICard[] {
    // Obtener la estrategia del modo
    const strategy = GameModeFactory.getStrategy(mode);

    // Obtener el tamaño del tablero según dificultad
    const boardSize = strategy.getBoardSize(difficulty);

    // Calcular cuántas cartas únicas necesitamos
    const uniqueCardsNeeded = Math.floor(boardSize / strategy.requiredFlips);

    // Generar las cartas
    const cards = this.generateCards(mode, uniqueCardsNeeded, strategy.requiredFlips);

    // Validar que el mazo sea válido para el modo
    if (!strategy.validateBoard(cards)) {
      throw new Error(`Mazo generado no es válido para el modo ${mode}`);
    }

    // Barajar las cartas
    return this.shuffle(cards);
  }

  /**
   * Genera las cartas según el modo
   * @param mode Modo de juego
   * @param uniqueCount Cantidad de cartas únicas
   * @param copies Cuántas copias de cada carta (2 para pares, 3 para tríadas)
   */
  private static generateCards(
    mode: string,
    uniqueCount: number,
    copies: number
  ): ICard[] {
    // Seleccionar cartas aleatorias del pool
    const selectedValues = this.selectRandomValues(uniqueCount);

    const cards: ICard[] = [];

    selectedValues.forEach((value, index) => {
      // Asignar categoría si es modo boss
      const category = mode === 'boss' 
        ? this.assignCategory(index, uniqueCount)
        : undefined;

      // Crear las copias necesarias de cada carta
      for (let i = 0; i < copies; i++) {
        cards.push({
          id: `${value}_${index}`, // ID único por valor
          value,
          category,
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    return cards;
  }

  /**
   * Selecciona valores aleatorios del pool de cartas
   * @param count Cantidad de valores a seleccionar
   * @returns Array de valores únicos
   */
  private static selectRandomValues(count: number): string[] {
    if (count > this.CARD_POOL.length) {
      throw new Error(
        `Se requieren ${count} valores únicos pero solo hay ${this.CARD_POOL.length} disponibles`
      );
    }

    // Clonar el pool y barajar
    const shuffled = this.shuffle([...this.CARD_POOL]);

    // Tomar los primeros N valores
    return shuffled.slice(0, count);
  }

  /**
   * Asigna una categoría a una carta (para modo boss)
   * @param index Índice de la carta
   * @param total Total de cartas únicas
   * @returns Categoría asignada
   */
  private static assignCategory(index: number, total: number): string {
    // Distribución de categorías:
    // - 10% legendary (últimas cartas)
    // - 20% epic
    // - 30% rare
    // - 40% common

    const position = index / total;

    if (position >= 0.9) return 'legendary'; // 10% finales
    if (position >= 0.7) return 'epic';      // 20% siguientes
    if (position >= 0.4) return 'rare';      // 30% siguientes
    return 'common';                         // 40% iniciales
  }

  /**
   * Baraja un array usando el algoritmo Fisher-Yates
   * Garantiza distribución uniforme
   * 
   * @param array Array a barajar
   * @returns Array barajado (copia)
   */
  private static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Genera un mazo personalizado con valores específicos
   * Útil para tests o eventos especiales
   * 
   * @param values Valores de las cartas
   * @param copies Cuántas copias de cada carta
   * @returns Array de cartas barajadas
   */
  static generateCustom(values: string[], copies: number): ICard[] {
    const cards: ICard[] = [];

    values.forEach((value, index) => {
      for (let i = 0; i < copies; i++) {
        cards.push({
          id: `${value}_${index}`,
          value,
          isFlipped: false,
          isMatched: false,
        });
      }
    });

    return this.shuffle(cards);
  }

  /**
   * Valida que un mazo tiene el formato correcto
   * @param cards Cartas a validar
   * @returns true si es válido
   */
  static validate(cards: ICard[]): boolean {
    if (!cards || cards.length === 0) return false;

    // Verificar que todas las cartas tienen id y value
    return cards.every(card => 
      card.id !== undefined && 
      card.value !== undefined &&
      card.isFlipped !== undefined &&
      card.isMatched !== undefined
    );
  }

  /**
   * Obtiene estadísticas del mazo generado
   * Útil para debugging y tests
   * 
   * @param cards Mazo a analizar
   * @returns Estadísticas del mazo
   */
  static getStats(cards: ICard[]): {
    total: number;
    unique: number;
    categories: Record<string, number>;
  } {
    const uniqueIds = new Set(cards.map(card => card.id));
    
    const categories: Record<string, number> = {};
    cards.forEach(card => {
      if (card.category) {
        categories[card.category] = (categories[card.category] || 0) + 1;
      }
    });

    return {
      total: cards.length,
      unique: uniqueIds.size,
      categories,
    };
  }
}
