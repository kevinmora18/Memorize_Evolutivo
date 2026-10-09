/**
 * Índice de estrategias de modos de juego
 * Exporta todas las estrategias y el factory desde un solo lugar
 */

// Exportar la interfaz y clase base
export { IGameModeStrategy, ICard, IMatchResult } from '../../core/interfaces/IGameModeStrategy';
export { BaseGameModeStrategy } from './BaseGameModeStrategy';

// Exportar estrategias concretas
export { PairsModeStrategy } from './PairsModeStrategy';
export { TriadsModeStrategy } from './TriadsModeStrategy';
export { BossModeStrategy } from './BossModeStrategy';

// Exportar el factory
export { GameModeFactory } from './GameModeFactory';
