import { BaseEntity } from '../../core/BaseEntity';
import { IGameModeStrategy, ICard } from '../../core/interfaces/IGameModeStrategy';
import { GameModeFactory } from '../strategies/GameModeFactory';

/**
 * GameRoom Domain Model - Modelo de dominio para Salas de Juego
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Agrupa todos los datos y comportamientos de una sala
 * - ABSTRACCIÓN: Representa el concepto de "Sala de Juego"
 * - HERENCIA: Extiende BaseEntity para reutilizar identidad y timestamps
 * - POLIMORFISMO: Usa IGameModeStrategy para delegar reglas del juego
 * - ESTADO: Mantiene el estado de la sala y sus jugadores
 */

export interface IPlayer {
  id: string;
  socketId: string;
  name: string;
  level: number;
  isReady: boolean;
  score: number;
  matches: number;
  isConnected: boolean;
}

export enum GameStatus {
  WAITING = 'waiting',
  PLAYING = 'playing',
  FINISHED = 'finished'
}

export interface IGameState {
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  cards: ICard[];  // ← Ahora usa ICard de la estrategia
  flippedCards: number[];
  matchedCards: number[];
  currentTurn: string | null;
  scores: Map<string, number>;
}

export interface IGameRoomData {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  maxPlayers: number;
  mode: string;
  difficulty: string;
  isPrivate: boolean;
  password?: string;
  createdAt: Date;
}

/**
 * Clase Player - Representa un jugador en la sala
 */
export class Player implements IPlayer {
  id: string;
  socketId: string;
  name: string;
  level: number;
  isReady: boolean;
  score: number;
  matches: number;
  isConnected: boolean;

  constructor(data: IPlayer) {
    this.id = data.id;
    this.socketId = data.socketId;
    this.name = data.name;
    this.level = data.level;
    this.isReady = data.isReady || false;
    this.score = data.score || 0;
    this.matches = data.matches || 0;
    this.isConnected = data.isConnected !== undefined ? data.isConnected : true;
  }

  /**
   * Marca al jugador como listo
   */
  setReady(ready: boolean): void {
    this.isReady = ready;
  }

  /**
   * Actualiza el puntaje
   */
  addScore(points: number): void {
    this.score += points;
  }

  /**
   * Incrementa matches
   */
  addMatch(): void {
    this.matches++;
  }

  /**
   * Desconecta al jugador
   */
  disconnect(): void {
    this.isConnected = false;
  }

  /**
   * Reconecta al jugador
   */
  reconnect(newSocketId: string): void {
    this.socketId = newSocketId;
    this.isConnected = true;
  }

  toJSON(): IPlayer {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      level: this.level,
      isReady: this.isReady,
      score: this.score,
      matches: this.matches,
      isConnected: this.isConnected,
    };
  }
}

/**
 * Clase GameRoom - Representa una sala de juego completa
 * Hereda de BaseEntity para reutilizar identidad y auditoría temporal
 */
export class GameRoom extends BaseEntity<any> {
  name: string;
  hostId: string;
  hostName: string;
  maxPlayers: number;
  mode: string;
  difficulty: string;
  isPrivate: boolean;
  password?: string;

  private players: Map<string, Player>;
  private gameState: IGameState;
  private strategy: IGameModeStrategy; // ← Estrategia polimórfica

  constructor(data: IGameRoomData) {
    // Llamar al constructor padre
    super(data.id, data.createdAt);
    
    this.name = data.name;
    this.hostId = data.hostId;
    this.hostName = data.hostName;
    this.maxPlayers = data.maxPlayers;
    this.mode = data.mode;
    this.difficulty = data.difficulty;
    this.isPrivate = data.isPrivate;
    this.password = data.password;

    // Inicializar estrategia según el modo
    this.strategy = GameModeFactory.getStrategy(data.mode);

    this.players = new Map();
    this.gameState = {
      status: GameStatus.WAITING,
      currentRound: 0,
      totalRounds: 1,
      cards: [],
      flippedCards: [],
      matchedCards: [],
      currentTurn: null,
      scores: new Map(),
    };
  }

  /**
   * GESTIÓN DE JUGADORES
   */

  addPlayer(playerData: IPlayer): void {
    if (this.isFull()) {
      throw new Error('La sala está llena');
    }

    if (this.hasPlayer(playerData.id)) {
      throw new Error('El jugador ya está en la sala');
    }

    const player = new Player(playerData);
    this.players.set(player.id, player);
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);

    // Si era el host, asignar nuevo host
    if (this.hostId === playerId && this.players.size > 0) {
      const newHost = Array.from(this.players.values())[0];
      this.hostId = newHost.id;
      this.hostName = newHost.name;
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  getPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  isEmpty(): boolean {
    return this.players.size === 0;
  }

  /**
   * GESTIÓN DE ESTADO DE LISTO
   */

  setPlayerReady(playerId: string, ready: boolean): void {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Jugador no encontrado');
    }
    player.setReady(ready);
  }

  areAllPlayersReady(): boolean {
    if (this.players.size < 2) return false;

    return Array.from(this.players.values())
      .filter(p => p.id !== this.hostId) // El host no necesita estar listo
      .every(p => p.isReady);
  }

  /**
   * GESTIÓN DEL JUEGO
   */

  startGame(cards: any[]): void {
    if (!this.areAllPlayersReady()) {
      throw new Error('No todos los jugadores están listos');
    }

    if (this.players.size < 2) {
      throw new Error('Se necesitan al menos 2 jugadores');
    }

    this.gameState = {
      status: GameStatus.PLAYING,
      currentRound: 1,
      totalRounds: 1,
      cards,
      flippedCards: [],
      matchedCards: [],
      currentTurn: Array.from(this.players.keys())[0],
      scores: new Map(Array.from(this.players.keys()).map(id => [id, 0])),
    };

    // Resetear estados de jugadores
    this.players.forEach(player => {
      player.score = 0;
      player.matches = 0;
      player.setReady(false);
    });
  }

  getGameState(): IGameState {
    return { ...this.gameState };
  }

  /**
   * Obtiene el número de cartas requeridas para este modo
   * Delega a la estrategia (POLIMORFISMO)
   */
  getRequiredFlipsCount(): number {
    return this.strategy.requiredFlips;
  }

  flipCard(playerId: string, cardIndex: number): void {
    if (this.gameState.currentTurn !== playerId) {
      throw new Error('No es tu turno');
    }

    // Usar la estrategia para obtener el límite (POLIMORFISMO)
    const required = this.getRequiredFlipsCount();
    
    if (this.gameState.flippedCards.length >= required) {
      throw new Error(`Ya hay ${required} cartas volteadas`);
    }

    if (this.gameState.flippedCards.includes(cardIndex) ||
        this.gameState.matchedCards.includes(cardIndex)) {
      throw new Error('Carta no disponible');
    }

    this.gameState.flippedCards.push(cardIndex);
  }

  /**
   * Verifica si las cartas volteadas forman un match
   * Delega a la estrategia (POLIMORFISMO)
   */
  checkMatch(): { isMatch: boolean; card1Index: number; card2Index: number } {
    const required = this.getRequiredFlipsCount();
    
    if (this.gameState.flippedCards.length !== required) {
      throw new Error(`No hay ${required} cartas volteadas`);
    }

    // Delegar a la estrategia para verificar el match (POLIMORFISMO)
    const result = this.strategy.checkMatch(
      this.gameState.cards,
      this.gameState.flippedCards
    );

    // Retornar en formato compatible con código existente
    return {
      isMatch: result.isMatch,
      card1Index: this.gameState.flippedCards[0],
      card2Index: this.gameState.flippedCards[1] || this.gameState.flippedCards[0],
    };
  }

  registerMatch(playerId: string, ...cardIndexes: number[]): void {
    // Agregar todas las cartas matched
    this.gameState.matchedCards.push(...cardIndexes);
    
    const currentScore = this.gameState.scores.get(playerId) || 0;
    this.gameState.scores.set(playerId, currentScore + 1);

    const player = this.players.get(playerId);
    if (player) {
      player.addMatch();
      player.addScore(1);
    }
  }

  clearFlippedCards(): void {
    this.gameState.flippedCards = [];
  }

  nextTurn(): string {
    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.gameState.currentTurn!);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.gameState.currentTurn = playerIds[nextIndex];
    return this.gameState.currentTurn;
  }

  isGameFinished(): boolean {
    return this.gameState.matchedCards.length === this.gameState.cards.length;
  }

  finishGame(): string | null {
    this.gameState.status = GameStatus.FINISHED;

    // Determinar ganador
    let winnerId: string | null = null;
    let maxScore = 0;

    this.gameState.scores.forEach((score, playerId) => {
      if (score > maxScore) {
        maxScore = score;
        winnerId = playerId;
      }
    });

    return winnerId;
  }

  /**
   * GESTIÓN DE CONEXIÓN
   */

  disconnectPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.disconnect();
    }
  }

  reconnectPlayer(playerId: string, newSocketId: string): void {
    const player = this.players.get(playerId);
    if (player) {
      player.reconnect(newSocketId);
    }
  }

  /**
   * VALIDACIÓN DE CONTRASEÑA
   */

  validatePassword(password: string): boolean {
    if (!this.isPrivate) return true;
    return this.password === password;
  }

  /**
   * CONVERSIÓN A JSON
   */

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      hostId: this.hostId,
      hostName: this.hostName,
      maxPlayers: this.maxPlayers,
      currentPlayers: this.players.size,
      mode: this.mode,
      difficulty: this.difficulty,
      isPrivate: this.isPrivate,
      status: this.gameState.status,
      createdAt: this.createdAt,
      players: Array.from(this.players.values()).map(p => p.toJSON()),
      gameState: this.gameState,
    };
  }
}
