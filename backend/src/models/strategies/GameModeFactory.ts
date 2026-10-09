import { IGameModeStrategy } from '../../core/interfaces/IGameModeStrategy';
import { PairsModeStrategy } from './PairsModeStrategy';
import { TriadsModeStrategy } from './TriadsModeStrategy';
import { BossModeStrategy } from './BossModeStrategy';

/**
 * GameModeFactory - Factory para gestionar estrategias de modos de juego
 * 
 * PATRÓN FACTORY:
 * - Encapsula la creación de estrategias
 * - Proporciona una interfaz simple para obtener modos
 * - Permite registrar nuevos modos sin modificar código existente
 * 
 * PRINCIPIOS SOLID:
 * - SRP: Solo se encarga de crear y gestionar estrategias
 * - OCP: Abierto a extensión (registerStrategy), cerrado a modificación
 * - DIP: Retorna IGameModeStrategy (abstracción), no clases concretas
 * 
 * SINGLETON PATTERN:
 * - Usa métodos estáticos para acceso global
 * - Un solo registro de estrategias en toda la aplicación
 */
export class GameModeFactory {
  /**
   * Registro de estrategias disponibles
   * Map<nombre_del_modo, instancia_de_estrategia>
   */
  private static strategies = new Map<string, IGameModeStrategy>([
    ['classic', new PairsModeStrategy()],
    ['triads', new TriadsModeStrategy()],
    ['boss', new BossModeStrategy()],
    // Futuros modos se pueden agregar aquí sin tocar el resto del código
    // ['cuartets', new CuartetsModeStrategy()],
    // ['infinite', new InfiniteModeStrategy()],
  ]);

  /**
   * Estrategia por defecto si no se especifica modo
   */
  private static readonly DEFAULT_MODE = 'classic';

  /**
   * Obtiene una estrategia por nombre
   * @param modeName Nombre del modo ('classic', 'triads', 'boss', etc.)
   * @returns Instancia de la estrategia
   * @throws Error si el modo no existe
   */
  static getStrategy(modeName: string): IGameModeStrategy {
    const normalizedMode = modeName.toLowerCase().trim();
    
    const strategy = this.strategies.get(normalizedMode);
    
    if (!strategy) {
      throw new Error(
        `Modo de juego '${modeName}' no encontrado. ` +
        `Modos disponibles: ${this.getAvailableModes().join(', ')}`
      );
    }

    return strategy;
  }

  /**
   * Obtiene la estrategia por defecto (classic)
   * @returns Estrategia del modo clásico
   */
  static getDefaultStrategy(): IGameModeStrategy {
    return this.getStrategy(this.DEFAULT_MODE);
  }

  /**
   * Registra una nueva estrategia (extensibilidad)
   * Permite agregar modos personalizados sin modificar el factory
   * 
   * @param modeName Nombre único del modo
   * @param strategy Instancia de la estrategia
   * @throws Error si el modo ya existe
   */
  static registerStrategy(modeName: string, strategy: IGameModeStrategy): void {
    const normalizedMode = modeName.toLowerCase().trim();

    if (this.strategies.has(normalizedMode)) {
      throw new Error(`El modo '${modeName}' ya está registrado`);
    }

    this.strategies.set(normalizedMode, strategy);
    console.log(`[GameModeFactory] Modo '${modeName}' registrado exitosamente`);
  }

  /**
   * Verifica si un modo existe
   * @param modeName Nombre del modo
   * @returns true si el modo está registrado
   */
  static hasMode(modeName: string): boolean {
    const normalizedMode = modeName.toLowerCase().trim();
    return this.strategies.has(normalizedMode);
  }

  /**
   * Obtiene la lista de nombres de modos disponibles
   * @returns Array con los nombres de todos los modos
   */
  static getAvailableModes(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Obtiene todas las estrategias registradas
   * Útil para listar modos en UI o tests
   * @returns Array con todas las estrategias
   */
  static getAllStrategies(): IGameModeStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Obtiene información de un modo específico
   * @param modeName Nombre del modo
   * @returns Objeto con información del modo
   */
  static getModeInfo(modeName: string): {
    name: string;
    requiredFlips: number;
    description: string;
  } | null {
    try {
      const strategy = this.getStrategy(modeName);
      return {
        name: strategy.name,
        requiredFlips: strategy.requiredFlips,
        description: strategy.description,
      };
    } catch {
      return null;
    }
  }

  /**
   * Obtiene información de todos los modos
   * Útil para mostrar catálogo de modos al usuario
   * @returns Array con información de cada modo
   */
  static getAllModesInfo(): Array<{
    name: string;
    requiredFlips: number;
    description: string;
  }> {
    return this.getAllStrategies().map(strategy => ({
      name: strategy.name,
      requiredFlips: strategy.requiredFlips,
      description: strategy.description,
    }));
  }

  /**
   * Elimina un modo registrado (útil para tests o modos temporales)
   * @param modeName Nombre del modo a eliminar
   * @returns true si se eliminó, false si no existía
   */
  static unregisterStrategy(modeName: string): boolean {
    const normalizedMode = modeName.toLowerCase().trim();
    
    // No permitir eliminar el modo por defecto
    if (normalizedMode === this.DEFAULT_MODE) {
      throw new Error(`No se puede eliminar el modo por defecto '${this.DEFAULT_MODE}'`);
    }

    const deleted = this.strategies.delete(normalizedMode);
    
    if (deleted) {
      console.log(`[GameModeFactory] Modo '${modeName}' eliminado`);
    }
    
    return deleted;
  }

  /**
   * Reinicia el factory a su estado inicial (útil para tests)
   */
  static reset(): void {
    this.strategies.clear();
    this.strategies.set('classic', new PairsModeStrategy());
    this.strategies.set('triads', new TriadsModeStrategy());
    this.strategies.set('boss', new BossModeStrategy());
    console.log('[GameModeFactory] Factory reiniciado a estado inicial');
  }

  /**
   * Valida que una estrategia cumple el contrato mínimo
   * @param strategy Estrategia a validar
   * @returns true si es válida
   */
  private static validateStrategy(strategy: IGameModeStrategy): boolean {
    return (
      !!strategy.name &&
      typeof strategy.requiredFlips === 'number' &&
      strategy.requiredFlips > 0 &&
      typeof strategy.checkMatch === 'function' &&
      typeof strategy.calculateXp === 'function' &&
      typeof strategy.calculateCoins === 'function'
    );
  }
}
