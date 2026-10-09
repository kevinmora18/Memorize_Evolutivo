import { GameRoom } from '../models/domain/GameRoom.model';
import { IGameCommand, ICommandOutcome } from './types';
import { DeckGenerator } from './DeckGenerator';

/**
 * RoomCommandHandler - Procesa comandos del juego sobre las salas
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Encapsula la lógica de validación y ejecución de comandos
 * - SRP: Solo traduce comandos a acciones sobre el dominio (GameRoom)
 * - COMMAND PATTERN: Cada comando se procesa de forma uniforme
 * 
 * ARQUITECTURA:
 * - Separa el transporte (Socket.IO) del dominio (GameRoom)
 * - El handler no conoce nada de sockets ni HTTP
 * - Solo trabaja con comandos abstractos y retorna resultados
 */
export class RoomCommandHandler {
  /**
   * Procesa un comando de juego
   * @param command Comando a ejecutar
   * @param room Sala donde ejecutar el comando
   * @returns Resultado de la ejecución
   */
  processCommand(command: IGameCommand, room: GameRoom): ICommandOutcome {
    try {
      switch (command.type) {
        case 'start':
          return this.handleStart(command, room);
        
        case 'flip':
          return this.handleFlip(command, room);
        
        case 'end_turn':
          return this.handleEndTurn(command, room);
        
        case 'finish':
          return this.handleFinish(command, room);
        
        default:
          return {
            type: 'error',
            success: false,
            error: `Comando desconocido: ${command.type}`,
          };
      }
    } catch (error: any) {
      return {
        type: 'error',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Maneja el comando START: inicia una partida
   */
  private handleStart(command: IGameCommand, room: GameRoom): ICommandOutcome {
    const { userId } = command;

    // Validar que el usuario es el host
    if (room.hostId !== userId) {
      return {
        type: 'start_failed',
        success: false,
        error: 'Solo el host puede iniciar la partida',
      };
    }

    // Validar que todos los jugadores están listos
    if (!room.areAllPlayersReady()) {
      return {
        type: 'start_failed',
        success: false,
        error: 'No todos los jugadores están listos',
      };
    }

    // Generar mazo en el servidor (autoritativo)
    const cards = DeckGenerator.generate(room.mode, room.difficulty as any);

    // Iniciar el juego
    room.startGame(cards);

    return {
      type: 'game_started',
      success: true,
      room,
      payload: {
        cards,
        firstTurn: room.getGameState().currentTurn,
      },
    };
  }

  /**
   * Maneja el comando FLIP: voltea una carta
   */
  private handleFlip(command: IGameCommand, room: GameRoom): ICommandOutcome {
    const { userId, payload } = command;
    const { cardIndex } = payload;

    // Validar índice de carta
    if (typeof cardIndex !== 'number' || cardIndex < 0) {
      return {
        type: 'flip_failed',
        success: false,
        error: 'Índice de carta inválido',
      };
    }

    // Intentar voltear la carta (GameRoom valida internamente)
    room.flipCard(userId, cardIndex);

    const gameState = room.getGameState();

    return {
      type: 'card_flipped',
      success: true,
      room,
      payload: {
        playerId: userId,
        cardIndex,
        flippedCards: gameState.flippedCards,
      },
    };
  }

  /**
   * Maneja el comando END_TURN: termina el turno actual
   */
  private handleEndTurn(command: IGameCommand, room: GameRoom): ICommandOutcome {
    const { userId } = command;

    // Validar que es el turno del jugador
    const gameState = room.getGameState();
    if (gameState.currentTurn !== userId) {
      return {
        type: 'end_turn_failed',
        success: false,
        error: 'No es tu turno',
      };
    }

    // Cambiar al siguiente turno
    const nextTurn = room.nextTurn();
    room.clearFlippedCards();

    return {
      type: 'turn_ended',
      success: true,
      room,
      payload: {
        previousTurn: userId,
        currentTurn: nextTurn,
      },
    };
  }

  /**
   * Maneja el comando FINISH: termina la partida
   */
  private handleFinish(command: IGameCommand, room: GameRoom): ICommandOutcome {
    const winnerId = room.finishGame();

    return {
      type: 'game_finished',
      success: true,
      room,
      payload: {
        winnerId,
        scores: Object.fromEntries(room.getGameState().scores),
      },
    };
  }

  /**
   * Valida que un comando tiene los campos requeridos
   */
  validateCommand(command: IGameCommand): { valid: boolean; error?: string } {
    if (!command.type) {
      return { valid: false, error: 'Tipo de comando requerido' };
    }

    if (!command.roomId) {
      return { valid: false, error: 'ID de sala requerido' };
    }

    if (!command.userId) {
      return { valid: false, error: 'ID de usuario requerido' };
    }

    // Validaciones específicas por tipo
    switch (command.type) {
      case 'flip':
        if (!command.payload || typeof command.payload.cardIndex !== 'number') {
          return { valid: false, error: 'cardIndex requerido para flip' };
        }
        break;
    }

    return { valid: true };
  }
}
