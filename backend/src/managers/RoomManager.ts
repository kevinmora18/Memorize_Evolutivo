import { GameRoom, IPlayer, GameStatus } from '../models/domain/GameRoom.model';

/**
 * RoomManager - Gestor de salas (Patrón Singleton)
 * 
 * EXPLICACIÓN POO:
 * - SINGLETON: Solo existe una instancia del gestor de salas
 * - ENCAPSULACIÓN: Oculta el Map de salas y expone métodos seguros
 * - SRP: Solo maneja la creación y gestión de salas
 */
export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, GameRoom>;

  /**
   * Constructor privado (Patrón Singleton)
   */
  private constructor() {
    this.rooms = new Map();
    this.startCleanupTask();
  }

  /**
   * Obtener la instancia única (Singleton)
   */
  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  /**
   * Crear una nueva sala
   */
  createRoom(data: {
    name: string;
    hostId: string;
    hostName: string;
    hostLevel: number;
    maxPlayers: number;
    mode: string;
    difficulty: string;
    isPrivate: boolean;
    password?: string;
  }): GameRoom {
    const roomId = this.generateRoomId();

    const room = new GameRoom({
      id: roomId,
      name: data.name,
      hostId: data.hostId,
      hostName: data.hostName,
      maxPlayers: data.maxPlayers,
      mode: data.mode,
      difficulty: data.difficulty,
      isPrivate: data.isPrivate,
      password: data.password,
      createdAt: new Date(),
    });

    // Añadir el host como primer jugador
    room.addPlayer({
      id: data.hostId,
      socketId: '', // Se actualizará cuando se conecte por socket
      name: data.hostName,
      level: data.hostLevel,
      isReady: false,
      score: 0,
      matches: 0,
      isConnected: true,
    });

    this.rooms.set(roomId, room);
    console.log(`🏠 Sala creada: ${roomId} (${data.name})`);

    return room;
  }

  /**
   * Obtener una sala por ID
   */
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Verificar si una sala existe
   */
  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Eliminar una sala
   */
  deleteRoom(roomId: string): boolean {
    const deleted = this.rooms.delete(roomId);
    if (deleted) {
      console.log(`🗑️  Sala eliminada: ${roomId}`);
    }
    return deleted;
  }

  /**
   * Obtener todas las salas disponibles (públicas y en espera)
   */
  getAvailableRooms(filters?: {
    mode?: string;
    status?: GameStatus;
  }): GameRoom[] {
    let rooms = Array.from(this.rooms.values());

    // Filtrar salas privadas
    rooms = rooms.filter(room => !room.isPrivate);

    // Filtrar por modo
    if (filters?.mode) {
      rooms = rooms.filter(room => room.mode === filters.mode);
    }

    // Filtrar por estado
    if (filters?.status) {
      rooms = rooms.filter(room => room.getGameState().status === filters.status);
    } else {
      // Por defecto, solo salas en espera
      rooms = rooms.filter(room => room.getGameState().status === GameStatus.WAITING);
    }

    // Filtrar salas llenas
    rooms = rooms.filter(room => !room.isFull());

    // Ordenar por fecha de creación (más recientes primero)
    rooms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return rooms;
  }

  /**
   * Unir un jugador a una sala
   */
  joinRoom(roomId: string, playerData: IPlayer, password?: string): GameRoom {
    const room = this.getRoom(roomId);

    if (!room) {
      throw new Error('Sala no encontrada');
    }

    // Validar contraseña si es privada
    if (room.isPrivate && !room.validatePassword(password || '')) {
      throw new Error('Contraseña incorrecta');
    }

    // Añadir jugador
    room.addPlayer(playerData);

    console.log(`👤 ${playerData.name} se unió a la sala ${roomId}`);

    return room;
  }

  /**
   * Sacar a un jugador de una sala
   */
  leaveRoom(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);

    if (!room) {
      return;
    }

    room.removePlayer(playerId);
    console.log(`👋 Jugador ${playerId} salió de la sala ${roomId}`);

    // Si la sala quedó vacía, eliminarla
    if (room.isEmpty()) {
      this.deleteRoom(roomId);
    }
  }

  /**
   * Limpiar salas antiguas (ejecutar periódicamente)
   */
  private cleanupOldRooms(): void {
    const now = new Date();
    const maxAge = 60 * 60 * 1000; // 1 hora

    this.rooms.forEach((room, roomId) => {
      const age = now.getTime() - room.createdAt.getTime();
      const status = room.getGameState().status;

      // Eliminar salas en espera que tengan más de 1 hora
      if (age > maxAge && status === GameStatus.WAITING) {
        this.deleteRoom(roomId);
      }

      // Eliminar salas vacías
      if (room.isEmpty()) {
        this.deleteRoom(roomId);
      }
    });
  }

  /**
   * Iniciar tarea de limpieza periódica
   */
  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanupOldRooms();
    }, 10 * 60 * 1000); // Cada 10 minutos

    console.log('🧹 Tarea de limpieza de salas iniciada');
  }

  /**
   * Generar ID único para sala
   */
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtener estadísticas del gestor
   */
  getStats() {
    return {
      totalRooms: this.rooms.size,
      waitingRooms: Array.from(this.rooms.values()).filter(
        r => r.getGameState().status === GameStatus.WAITING
      ).length,
      playingRooms: Array.from(this.rooms.values()).filter(
        r => r.getGameState().status === GameStatus.PLAYING
      ).length,
      totalPlayers: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.getPlayerCount(),
        0
      ),
    };
  }
}
