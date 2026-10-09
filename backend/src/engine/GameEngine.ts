import { GameRoom } from '../models/domain/GameRoom.model';
import { RoomCommandHandler } from './RoomCommandHandler';
import { TurnTimer } from './TurnTimer';
import { IGameCommand, ICommandOutcome, IEvaluationResult } from './types';
import { GameModeFactory } from '../models/strategies/GameModeFactory';

/**
 * GameEngine - Motor autoritativo del juego
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Encapsula toda la lógica del juego (turnos, matches, timers)
 * - COMPOSICIÓN: Usa RoomCommandHandler, TurnTimer y estrategias de modo
 * - ABSTRACCIÓN: El exterior solo ve comandos y resultados, no la implementación
 * - SRP: Solo gestiona el flujo del juego, no se comunica con sockets ni BD
 * 
 * SERVIDOR AUTORITATIVO:
 * - El servidor es la única fuente de verdad
 * - Todas las validaciones y reglas se ejecutan aquí
 * - El cliente solo envía intenciones, el servidor decide si son válidas
 * 
 * ARQUITECTURA:
 * - Motor desacoplado del transporte (Socket.IO, HTTP, etc.)
 * - Usa callbacks para notificar eventos sin conocer quién escucha
 * - Testeable sin levantar servidor ni conectar a BD
 */
export class GameEngine {
  /**
   * Handler de comandos
   */
  private commandHandler: RoomCommandHandler;

  /**
   * Mapa de timers por sala
   */
  private turnTimers: Map<string, TurnTimer>;

  /**
   * Indica si se está evaluando una mano (evita race conditions)
   */
  private evaluating: Map<string, boolean>;

  /**
   * Callback para notificar resultados al exterior (ej: SocketManager)
   */
  private onOutcome: (outcome: ICommandOutcome) => void;

  /**
   * Duración del turno en milisegundos (configurable)
   */
  private turnDuration: number = 30000; // 30 segundos

  /**
   * Delay antes de resolver una mano (para que los jugadores vean las cartas)
   */
  private resolveDelay: number = 1500; // 1.5 segundos

  /**
   * Constructor
   * @param onOutcome Callback para notificar eventos del motor
   */
  constructor(onOutcome: (outcome: ICommandOutcome) => void) {
    this.commandHandler = new RoomCommandHandler();
    this.turnTimers = new Map();
    this.evaluating = new Map();
    this.onOutcome = onOutcome;
  }

  /**
   * Procesa un comando de juego
   * @param command Comando a ejecutar
   * @param room Sala donde ejecutar el comando
   */
  async processCommand(command: IGameCommand, room: GameRoom): Promise<void> {
    // Validar el comando
    const validation = this.commandHandler.validateCommand(command);
    if (!validation.valid) {
      this.onOutcome({
        type: 'command_invalid',
        success: false,
        error: validation.error,
      });
      return;
    }

    // Procesar el comando
    const outcome = this.commandHandler.processCommand(command, room);

    // Manejar resultados especiales
    if (outcome.success) {
      switch (outcome.type) {
        case 'game_started':
          this.startTurnTimer(room);
          break;

        case 'card_flipped':
          await this.handleCardFlipped(room, command.userId);
          break;

        case 'game_finished':
          this.stopTurnTimer(room.id);
          break;
      }
    }

    // Notificar el resultado
    this.onOutcome(outcome);
  }

  /**
   * Maneja cuando se voltea una carta
   * Verifica si se alcanzó el número requerido para evaluar
   */
  private async handleCardFlipped(room: GameRoom, userId: string): Promise<void> {
    const gameState = room.getGameState();
    const strategy = GameModeFactory.getStrategy(room.mode);

    // Verificar si se voltearon suficientes cartas
    const requiredFlips = strategy.requiredFlips;
    
    if (gameState.flippedCards.length >= requiredFlips) {
      // Programar la evaluación después de un delay
      await this.scheduleEvaluate(room, userId);
    }
  }

  /**
   * Programa la evaluación de una mano después de un delay
   */
  private async scheduleEvaluate(room: GameRoom, userId: string): Promise<void> {
    // Evitar evaluaciones múltiples simultáneas
    if (this.evaluating.get(room.id)) return;
    this.evaluating.set(room.id, true);

    // Pausar el timer mientras se evalúa
    const timer = this.turnTimers.get(room.id);
    if (timer) {
      timer.stop();
    }

    // Esperar el delay para que los jugadores vean las cartas
    await this.delay(this.resolveDelay);

    // Evaluar la mano
    const result = this.evaluateHand(room, userId);

    // Aplicar el resultado
    if (result.isMatch) {
      // Registrar el match
      room.registerMatch(userId, ...result.cardIndexes);

      // Notificar match encontrado
      this.onOutcome({
        type: 'match_found',
        success: true,
        room,
        payload: {
          playerId: userId,
          points: result.points,
          bonus: result.bonus,
          cardIndexes: result.cardIndexes,
        },
      });

      // Verificar si el juego terminó
      if (room.isGameFinished()) {
        const winnerId = room.finishGame();
        this.onOutcome({
          type: 'game_finished',
          success: true,
          room,
          payload: {
            winnerId,
            scores: Object.fromEntries(room.getGameState().scores),
          },
        });
        this.stopTurnTimer(room.id);
      } else {
        // Continuar jugando, reiniciar timer
        room.clearFlippedCards();
        this.startTurnTimer(room);
      }
    } else {
      // No hay match, cambiar turno
      room.clearFlippedCards();
      const nextTurn = room.nextTurn();

      this.onOutcome({
        type: 'no_match',
        success: true,
        room,
        payload: {
          cardIndexes: result.cardIndexes,
          currentTurn: nextTurn,
        },
      });

      // Reiniciar timer para el siguiente turno
      this.startTurnTimer(room);
    }

    this.evaluating.set(room.id, false);
  }

  /**
   * Evalúa una mano de cartas volteadas
   * Usa la estrategia del modo de juego
   */
  private evaluateHand(room: GameRoom, userId: string): IEvaluationResult {
    const gameState = room.getGameState();
    const strategy = GameModeFactory.getStrategy(room.mode);

    // Delegar a la estrategia para verificar el match
    const matchResult = strategy.checkMatch(
      gameState.cards,
      gameState.flippedCards
    );

    return {
      isMatch: matchResult.isMatch,
      points: matchResult.points,
      bonus: matchResult.bonus,
      cardIndexes: matchResult.cardIndexes,
      playerId: userId,
    };
  }

  /**
   * Inicia el timer de turno
   */
  private startTurnTimer(room: GameRoom): void {
    // Detener timer anterior si existe
    this.stopTurnTimer(room.id);

    // Crear nuevo timer
    const timer = new TurnTimer(this.turnDuration);

    timer.start(
      () => this.handleTurnTimeout(room),
      (remaining) => this.handleTurnTick(room, remaining)
    );

    this.turnTimers.set(room.id, timer);
  }

  /**
   * Detiene el timer de turno
   */
  private stopTurnTimer(roomId: string): void {
    const timer = this.turnTimers.get(roomId);
    if (timer) {
      timer.stop();
      this.turnTimers.delete(roomId);
    }
  }

  /**
   * Maneja cuando el tiempo de turno se agota
   */
  private handleTurnTimeout(room: GameRoom): void {
    // Limpiar cartas volteadas
    room.clearFlippedCards();

    // Cambiar al siguiente turno
    const nextTurn = room.nextTurn();

    // Notificar timeout
    this.onOutcome({
      type: 'turn_timeout',
      success: true,
      room,
      payload: {
        currentTurn: nextTurn,
      },
    });

    // Reiniciar timer para el siguiente turno
    this.startTurnTimer(room);
  }

  /**
   * Maneja cada tick del timer (cada segundo)
   */
  private handleTurnTick(room: GameRoom, remaining: number): void {
    // Notificar tiempo restante
    this.onOutcome({
      type: 'turn_tick',
      success: true,
      room,
      payload: {
        remaining: Math.ceil(remaining / 1000), // en segundos
      },
    });
  }

  /**
   * Limpia recursos de una sala
   */
  cleanupRoom(roomId: string): void {
    this.stopTurnTimer(roomId);
    this.evaluating.delete(roomId);
  }

  /**
   * Configura la duración del turno
   */
  setTurnDuration(duration: number): void {
    if (duration <= 0) {
      throw new Error('La duración debe ser mayor a 0');
    }
    this.turnDuration = duration;
  }

  /**
   * Obtiene el estado del timer de una sala
   */
  getTimerStatus(roomId: string): any {
    const timer = this.turnTimers.get(roomId);
    return timer ? timer.getStatus() : null;
  }

  /**
   * Delay auxiliar (Promise-based)
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destruye el motor y limpia todos los recursos
   */
  destroy(): void {
    // Detener todos los timers
    this.turnTimers.forEach((timer, roomId) => {
      timer.destroy();
    });
    this.turnTimers.clear();
    this.evaluating.clear();
  }
}
