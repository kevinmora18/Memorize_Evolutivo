/**
 * Tipos y interfaces para el motor de juego
 */

import { GameRoom } from '../models/domain/GameRoom.model';

/**
 * Comando que el motor puede ejecutar
 */
export interface IGameCommand {
  type: 'start' | 'flip' | 'end_turn' | 'finish';
  roomId: string;
  userId: string;
  payload?: any;
}

/**
 * Resultado de ejecutar un comando
 */
export interface ICommandOutcome {
  roomId?: string;
  event?: string;
  payload?: any;
  type?: string;
  room?: GameRoom;
  success: boolean;
  error?: string;
}

/**
 * Evento del motor que debe propagarse a los clientes
 */
export interface IGameEvent {
  type: string;
  roomId: string;
  data: any;
  timestamp: Date;
}

/**
 * Estado de evaluación de una mano
 */
export interface IEvaluationResult {
  isMatch: boolean;
  points: number;
  bonus?: number;
  cardIndexes: number[];
  playerId: string;
}
