# 📖 Ejemplos de Uso - Arquitectura POO

Este documento muestra ejemplos prácticos de cómo usar la nueva arquitectura POO.

---

## 🎯 Ejemplo 1: Login de Usuario

### Flujo Completo

```typescript
// 1. CLIENTE hace request
POST /api/v2/auth/login
Body: { "email": "jugador@example.com" }

// 2. ROUTE recibe y delega (routes/auth.v2.ts)
router.post('/login', authController.login)

// 3. CONTROLLER valida y llama al servicio (AuthController.ts)
login = async (req, res) => {
  const { email } = req.body;
  const user = await this.authService.loginOrRegister(email);
  res.json(user.toJSON());
}

// 4. SERVICE implementa lógica de negocio (AuthService.ts)
async loginOrRegister(email: string): Promise<User> {
  let user = await this.userRepository.findByEmail(email);
  if (!user) {
    user = await this.userRepository.create({ email });
  }
  if (user.isCurrentlyBanned()) {
    throw new Error('Usuario baneado');
  }
  return user;
}

// 5. REPOSITORY accede a la BD (UserRepository.ts)
async findByEmail(email: string): Promise<User | null> {
  const prismaUser = await this.prisma.user.findUnique({ where: { email } });
  return prismaUser ? this.toDomain(prismaUser) : null;
}

// 6. DOMAIN MODEL representa la entidad (User.model.ts)
class User {
  isCurrentlyBanned(): boolean {
    if (!this.isBanned) return false;
    return this.bannedUntil ? new Date() < this.bannedUntil : true;
  }
}
```

---

## 🎮 Ejemplo 2: Registrar Resultado de Partida

### Código del Cliente

```typescript
// Cliente envía resultado de partida
const gameResult = {
  userId: "user123",
  score: 1850,
  won: true,
  matches: 12,
  perfectMatches: 3,
  combo: 8,
  xpEarned: 150,
  coinsEarned: 200
};

const response = await fetch('/api/v2/users/user123/game-result', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(gameResult)
});

const result = await response.json();
console.log('Niveles ganados:', result.levelsGained);
console.log('Usuario actualizado:', result.user);
console.log('Estadísticas:', result.stats);
```

### Flujo en el Backend

```typescript
// 1. UserController recibe la petición
recordGame = async (req, res) => {
  const { userId } = req.params;
  const gameData = req.body;
  
  const result = await this.userService.recordGamePlayed(userId, gameData);
  res.json(result);
}

// 2. UserService orquesta la operación
async recordGamePlayed(userId, gameData) {
  // Obtener usuario
  const user = await this.userRepository.findById(userId);
  
  // Obtener estadísticas
  let stats = await this.statsRepository.findByUserId(userId);
  if (!stats) {
    stats = await this.statsRepository.create({ userId });
  }
  
  // Usar métodos del DOMINIO para actualizar
  stats.recordGame(
    gameData.score,
    gameData.won,
    gameData.matches,
    gameData.perfectMatches,
    gameData.combo
  );
  
  const levelsGained = user.addXp(gameData.xpEarned);
  user.addCoins(gameData.coinsEarned);
  
  // Guardar cambios
  const [updatedUser, updatedStats] = await Promise.all([
    this.userRepository.update(userId, user.toJSON()),
    this.statsRepository.update(stats.id, stats.toJSON())
  ]);
  
  return { user: updatedUser, stats: updatedStats, levelsGained };
}

// 3. User Model maneja la lógica de XP
class User {
  addXp(amount: number): number {
    this.xp += amount;
    let levelsGained = 0;
    
    while (this.canLevelUp()) {
      this.levelUp();
      levelsGained++;
    }
    
    return levelsGained;
  }
  
  canLevelUp(): boolean {
    return this.xp >= this.getXpForNextLevel();
  }
  
  levelUp(): void {
    this.xp -= this.getXpForNextLevel();
    this.level++;
  }
  
  getXpForNextLevel(): number {
    return this.level * 100;
  }
}

// 4. PlayerStats Model registra la partida
class PlayerStats {
  recordGame(score, won, matches, perfectMatches, combo) {
    this.gamesPlayed++;
    if (won) this.gamesWon++;
    
    this.totalScore += score;
    if (score > this.bestScore) {
      this.bestScore = score;
    }
    
    this.totalMatches += matches;
    this.perfectMatches += perfectMatches;
    
    if (combo > this.maxCombo) {
      this.maxCombo = combo;
    }
  }
}
```

**Resultado:**

```json
{
  "user": {
    "id": "user123",
    "level": 6,
    "xp": 50,
    "coins": 1200
  },
  "stats": {
    "gamesPlayed": 25,
    "gamesWon": 18,
    "bestScore": 1850,
    "totalScore": 32000
  },
  "levelsGained": 1
}
```

---

## 🏠 Ejemplo 3: Crear y Gestionar Sala Multijugador

### Crear Sala

```typescript
// Cliente crea sala
const roomData = {
  name: "Sala de Expertos",
  hostId: "user123",
  maxPlayers: 4,
  mode: "classic",
  difficulty: "hard",
  isPrivate: false
};

const response = await fetch('/api/v2/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(roomData)
});

const room = await response.json();
console.log('Sala creada:', room.id);
```

### Backend - RoomController

```typescript
createRoom = async (req, res) => {
  const { name, hostId, maxPlayers, mode, difficulty, isPrivate } = req.body;
  
  // Validar usuario
  const user = await this.userRepository.findById(hostId);
  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  
  // Crear sala usando el manager
  const room = this.roomManager.createRoom({
    name,
    hostId,
    hostName: user.username || user.email,
    hostLevel: user.level,
    maxPlayers,
    mode,
    difficulty,
    isPrivate
  });
  
  res.json(room.toJSON());
}
```

### Backend - RoomManager

```typescript
class RoomManager {
  createRoom(data): GameRoom {
    const roomId = this.generateRoomId();
    
    // Crear instancia del modelo de dominio
    const room = new GameRoom({
      id: roomId,
      name: data.name,
      hostId: data.hostId,
      hostName: data.hostName,
      maxPlayers: data.maxPlayers,
      mode: data.mode,
      difficulty: data.difficulty,
      isPrivate: data.isPrivate,
      createdAt: new Date()
    });
    
    // Añadir host como primer jugador
    room.addPlayer({
      id: data.hostId,
      socketId: '',
      name: data.hostName,
      level: data.hostLevel,
      isReady: false,
      score: 0,
      matches: 0,
      isConnected: true
    });
    
    this.rooms.set(roomId, room);
    return room;
  }
}
```

### Backend - GameRoom Model

```typescript
class GameRoom {
  private players: Map<string, Player>;
  private gameState: IGameState;
  
  addPlayer(playerData: IPlayer): void {
    if (this.isFull()) {
      throw new Error('La sala está llena');
    }
    
    const player = new Player(playerData);
    this.players.set(player.id, player);
  }
  
  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }
  
  startGame(cards: any[]): void {
    if (!this.areAllPlayersReady()) {
      throw new Error('No todos los jugadores están listos');
    }
    
    this.gameState = {
      status: GameStatus.PLAYING,
      currentRound: 1,
      cards,
      flippedCards: [],
      matchedCards: [],
      currentTurn: Array.from(this.players.keys())[0],
      scores: new Map()
    };
  }
}
```

---

## 🧪 Ejemplo 4: Testing con la Nueva Arquitectura

### Test de AuthService

```typescript
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/domain/User.model';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  
  beforeEach(() => {
    // Crear mock del repositorio
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateLastLogin: jest.fn()
    } as any;
    
    // Inyectar el mock
    authService = new AuthService(mockUserRepository);
  });
  
  describe('loginOrRegister', () => {
    it('debe crear nuevo usuario si no existe', async () => {
      // Arrange
      const email = 'nuevo@example.com';
      const newUser = new User({
        id: 'user123',
        email,
        username: 'nuevo',
        role: 'player',
        level: 1,
        xp: 0,
        coins: 500,
        gems: 50,
        isBanned: false,
        bannedUntil: null,
        banReason: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser);
      
      // Act
      const result = await authService.loginOrRegister(email);
      
      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({ email });
      expect(result.email).toBe(email);
      expect(result.level).toBe(1);
    });
    
    it('debe lanzar error si usuario está baneado', async () => {
      // Arrange
      const email = 'banned@example.com';
      const bannedUser = new User({
        id: 'user456',
        email,
        username: 'banned',
        role: 'player',
        level: 5,
        xp: 0,
        coins: 0,
        gems: 0,
        isBanned: true,
        bannedUntil: new Date(Date.now() + 86400000), // 1 día
        banReason: 'Trampas',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      mockUserRepository.findByEmail.mockResolvedValue(bannedUser);
      
      // Act & Assert
      await expect(authService.loginOrRegister(email))
        .rejects.toThrow('baneado');
    });
  });
});
```

### Test de User Model

```typescript
import { User, UserRole } from '../models/domain/User.model';

describe('User Model', () => {
  let user: User;
  
  beforeEach(() => {
    user = new User({
      id: 'user123',
      email: 'test@example.com',
      username: 'test',
      role: UserRole.PLAYER,
      level: 5,
      xp: 450,
      coins: 1000,
      gems: 50,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  describe('addXp', () => {
    it('debe añadir XP y subir de nivel correctamente', () => {
      // Level 5 necesita 500 XP para nivel 6
      // Usuario tiene 450 XP
      const levelsGained = user.addXp(100); // Total: 550 XP
      
      expect(levelsGained).toBe(1);
      expect(user.level).toBe(6);
      expect(user.xp).toBe(50); // 550 - 500 = 50
    });
    
    it('debe subir múltiples niveles si hay suficiente XP', () => {
      const levelsGained = user.addXp(1000);
      
      expect(levelsGained).toBeGreaterThan(1);
      expect(user.level).toBeGreaterThan(5);
    });
  });
  
  describe('canAfford', () => {
    it('debe verificar si puede pagar correctamente', () => {
      expect(user.canAfford(500, 10)).toBe(true);
      expect(user.canAfford(1500, 10)).toBe(false);
      expect(user.canAfford(500, 100)).toBe(false);
    });
  });
  
  describe('purchase', () => {
    it('debe restar monedas al comprar', () => {
      user.purchase(300, 10);
      
      expect(user.coins).toBe(700);
      expect(user.gems).toBe(40);
    });
    
    it('debe lanzar error si no tiene suficientes recursos', () => {
      expect(() => user.purchase(2000, 0)).toThrow();
    });
  });
});
```

---

## 🔧 Ejemplo 5: Extender la Arquitectura

### Agregar Nuevo Feature: Sistema de Amigos

#### 1. Crear el Modelo de Dominio

```typescript
// models/domain/Friendship.model.ts
export class Friendship {
  readonly id: string;
  readonly userId: string;
  readonly friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  readonly createdAt: Date;
  
  accept(): void {
    this.status = 'accepted';
  }
  
  reject(): void {
    this.status = 'rejected';
  }
  
  isPending(): boolean {
    return this.status === 'pending';
  }
}
```

#### 2. Crear el Repositorio

```typescript
// repositories/FriendshipRepository.ts
export class FriendshipRepository extends BaseRepository<Friendship, string> {
  async findByUserId(userId: string): Promise<Friendship[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }]
      }
    });
    return friendships.map(f => this.toDomain(f));
  }
  
  async findPendingRequests(userId: string): Promise<Friendship[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'pending'
      }
    });
    return friendships.map(f => this.toDomain(f));
  }
}
```

#### 3. Crear el Servicio

```typescript
// services/FriendshipService.ts
export class FriendshipService extends BaseService {
  constructor(
    private friendshipRepo: FriendshipRepository,
    private userRepo: UserRepository
  ) {
    super('FriendshipService');
  }
  
  async sendFriendRequest(userId: string, friendId: string): Promise<Friendship> {
    // Validar que ambos usuarios existen
    const [user, friend] = await Promise.all([
      this.userRepo.findById(userId),
      this.userRepo.findById(friendId)
    ]);
    
    if (!user || !friend) {
      throw new Error('Usuario no encontrado');
    }
    
    // Crear solicitud
    return await this.friendshipRepo.create({
      userId,
      friendId,
      status: 'pending'
    });
  }
  
  async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findById(friendshipId);
    
    if (!friendship) {
      throw new Error('Solicitud no encontrada');
    }
    
    friendship.accept();
    return await this.friendshipRepo.update(friendshipId, friendship.toJSON());
  }
}
```

#### 4. Crear el Controlador

```typescript
// controllers/FriendshipController.ts
export class FriendshipController {
  constructor(private friendshipService: FriendshipService) {}
  
  sendRequest = async (req: Request, res: Response) => {
    const { userId, friendId } = req.body;
    const friendship = await this.friendshipService.sendFriendRequest(userId, friendId);
    res.json(friendship);
  };
  
  acceptRequest = async (req: Request, res: Response) => {
    const { friendshipId } = req.params;
    const friendship = await this.friendshipService.acceptFriendRequest(friendshipId);
    res.json(friendship);
  };
}
```

#### 5. Registrar en el Container

```typescript
// Container.ts
export class Container {
  public friendshipRepository: FriendshipRepository;
  public friendshipService: FriendshipService;
  public friendshipController: FriendshipController;
  
  private constructor() {
    // ... código existente ...
    
    this.friendshipRepository = new FriendshipRepository(this.prisma);
    this.friendshipService = new FriendshipService(
      this.friendshipRepository,
      this.userRepository
    );
    this.friendshipController = new FriendshipController(
      this.friendshipService
    );
  }
}
```

#### 6. Crear las Rutas

```typescript
// routes/friendships.ts
const router = Router();
const container = Container.getInstance();
const controller = container.friendshipController;

router.post('/request', controller.sendRequest);
router.post('/:friendshipId/accept', controller.acceptRequest);

export default router;
```

---

## 📊 Resumen de Ventajas

### ✅ Antes (Sin POO)

```typescript
// Todo mezclado en una ruta
router.post('/login', async (req, res) => {
  const user = await prisma.user.findUnique(...);
  if (!user) {
    const newUser = await prisma.user.create(...);
    // Lógica de negocio mezclada
    // Difícil de testear
    // Código duplicado
  }
});
```

### ✅ Después (Con POO)

```typescript
// Separación clara
Route → Controller → Service → Repository → Model

// Fácil de testear
// Código reutilizable
// Mantenible
// Escalable
```

---

¡Con esta arquitectura POO, tu backend está listo para crecer! 🚀
