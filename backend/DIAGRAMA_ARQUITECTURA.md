# 📐 Diagrama de Arquitectura POO

## 🎯 Vista General del Sistema

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Frontend)                             │
│                         React + Socket.IO Client                            │
└───────────────────┬───────────────────────────┬────────────────────────────┘
                    │                           │
          HTTP Requests                  WebSocket Events
                    │                           │
                    ▼                           ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                                 │
│  ┌─────────────────────┐              ┌───────────────────────┐          │
│  │   Express Routes    │              │   Socket.IO Events    │          │
│  │  auth.v2.ts         │              │   SocketManager       │          │
│  │  rooms.v2.ts        │              │                       │          │
│  └──────────┬──────────┘              └───────────┬───────────┘          │
└─────────────┼──────────────────────────────────────┼────────────────────────┘
              │                                      │
              ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER LAYER                                   │
│  ┌─────────────────────┐              ┌───────────────────────┐          │
│  │  AuthController     │              │   RoomManager         │          │
│  │  RoomController     │              │   (Singleton)         │          │
│  │                     │              │                       │          │
│  │  - login()          │              │  - createRoom()       │          │
│  │  - validateAccess() │              │  - joinRoom()         │          │
│  └──────────┬──────────┘              └───────────┬───────────┘          │
└─────────────┼──────────────────────────────────────┼────────────────────────┘
              │                                      │
              ▼                                      │
┌───────────────────────────────────────────────────┼────────────────────────┐
│                         SERVICE LAYER             │                        │
│  ┌─────────────────────┐                          │                        │
│  │   AuthService       │                          │                        │
│  │   (extends          │                          │                        │
│  │    BaseService)     │                          │                        │
│  │                     │                          │                        │
│  │  - loginOrRegister()│                          │                        │
│  │  - validateAccess() │                          │                        │
│  └──────────┬──────────┘                          │                        │
└─────────────┼──────────────────────────────────────┼────────────────────────┘
              │                                      │
              ▼                                      │
┌───────────────────────────────────────────────────┼────────────────────────┐
│                       REPOSITORY LAYER            │                        │
│  ┌─────────────────────┐                          │                        │
│  │  UserRepository     │                          │                        │
│  │  (extends           │                          │                        │
│  │   BaseRepository)   │                          │                        │
│  │                     │                          │                        │
│  │  - findById()       │                          │                        │
│  │  - findByEmail()    │                          │                        │
│  │  - create()         │                          │                        │
│  └──────────┬──────────┘                          │                        │
└─────────────┼──────────────────────────────────────┼────────────────────────┘
              │                                      │
              ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN LAYER                                       │
│  ┌─────────────────────┐              ┌───────────────────────┐          │
│  │   User Model        │              │   GameRoom Model      │          │
│  │                     │              │                       │          │
│  │  Properties:        │              │  Properties:          │          │
│  │  - id               │              │  - id                 │          │
│  │  - email            │              │  - players[]          │          │
│  │  - level            │              │  - gameState          │          │
│  │                     │              │                       │          │
│  │  Methods:           │              │  Methods:             │          │
│  │  - canLevelUp()     │              │  - addPlayer()        │          │
│  │  - levelUp()        │              │  - startGame()        │          │
│  │  - isAdmin()        │              │  - flipCard()         │          │
│  └──────────┬──────────┘              └───────────┬───────────┘          │
└─────────────┼──────────────────────────────────────┼────────────────────────┘
              │                                      │
              ▼                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                      DATA ACCESS LAYER                                     │
│  ┌────────────────────────────────────────────────────────────┐          │
│  │                    Prisma ORM                               │          │
│  └─────────────────────────┬──────────────────────────────────┘          │
└────────────────────────────┼───────────────────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                           │
│                    PostgreSQL Database                                     │
│                                                                            │
│  Tables: users, player_stats, matches, inventories, etc.                  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos: Ejemplo de Login

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CLIENTE                                                               │
│    POST /api/v2/auth/login                                              │
│    Body: { "email": "user@example.com" }                                │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. EXPRESS ROUTE (auth.v2.ts)                                           │
│    router.post('/login', authController.login)                          │
│    → Delega al controlador                                              │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. CONTROLLER (AuthController.ts)                                       │
│    login = async (req, res, next) => {                                  │
│      const { email } = req.body;                                        │
│      ✓ Valida el email                                                  │
│      ✓ Llama al servicio                                                │
│      const user = await this.authService.loginOrRegister(email);        │
│      res.json(user.toJSON());                                           │
│    }                                                                     │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. SERVICE (AuthService.ts)                                             │
│    async loginOrRegister(email: string): Promise<User> {                │
│      ✓ Buscar usuario existente                                         │
│      let user = await this.userRepository.findByEmail(email);           │
│      if (!user) {                                                       │
│        ✓ Crear nuevo usuario                                            │
│        user = await this.userRepository.create({ email });              │
│      }                                                                   │
│      ✓ Validar si está baneado                                          │
│      if (user.isCurrentlyBanned()) throw new Error();                   │
│      return user;                                                       │
│    }                                                                     │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. REPOSITORY (UserRepository.ts)                                       │
│    async findByEmail(email: string): Promise<User | null> {             │
│      ✓ Consultar base de datos                                          │
│      const prismaUser = await this.prisma.user.findUnique({             │
│        where: { email }                                                 │
│      });                                                                 │
│      ✓ Convertir a modelo de dominio                                    │
│      return prismaUser ? this.toDomain(prismaUser) : null;              │
│    }                                                                     │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 6. PRISMA ORM                                                            │
│    SELECT * FROM users WHERE email = 'user@example.com';                │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 7. POSTGRESQL DATABASE                                                   │
│    Ejecuta query y devuelve resultado                                   │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             │ (Respuesta sube por las mismas capas)
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 8. DOMAIN MODEL (User.model.ts)                                         │
│    new User({                                                            │
│      id: "abc123",                                                       │
│      email: "user@example.com",                                         │
│      level: 5,                                                          │
│      xp: 450,                                                           │
│      ...                                                                 │
│    })                                                                    │
│    ✓ Objeto User con métodos de negocio                                 │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 9. HTTP RESPONSE                                                         │
│    Status: 200 OK                                                        │
│    Body: {                                                               │
│      "id": "abc123",                                                     │
│      "email": "user@example.com",                                       │
│      "level": 5,                                                        │
│      "xp": 450,                                                         │
│      ...                                                                 │
│    }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎮 Flujo de Socket.IO: Crear y Unirse a Sala

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENTE 1 (Host)                                                         │
│ Emite: room:create                                                       │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ HTTP POST /api/v2/rooms                                                  │
│ → RoomController.createRoom()                                            │
│ → RoomManager.createRoom()                                               │
│ → Crea GameRoom en memoria                                               │
│ Respuesta: { roomId: "room_123", ... }                                  │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENTE 1 conecta por Socket.IO                                         │
│ Emite: room:join { roomId: "room_123", userId: "user1" }                │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SocketManager.registerRoomEvents()                                      │
│ socket.on('room:join', handler)                                         │
│ → RoomManager.getRoom(roomId)                                            │
│ → room.addPlayer(playerData)                                             │
│ → socket.join(roomId) // Unirse a room de Socket.IO                     │
│ → io.to(roomId).emit('room:player-joined', {...})                       │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────────────────┐
             │                                                             │
             ▼                                                             ▼
┌──────────────────────────┐                            ┌──────────────────────────┐
│ CLIENTE 1 recibe:        │                            │ TODOS EN SALA reciben:   │
│ room:joined              │                            │ room:player-joined       │
│ { roomId, players, ... } │                            │ { player, players }      │
└──────────────────────────┘                            └──────────────────────────┘
             │
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENTE 2 quiere unirse                                                  │
│ HTTP POST /api/v2/rooms/room_123/join                                   │
│ → RoomController.joinRoom()                                              │
│ → RoomManager.joinRoom()                                                 │
│ → room.addPlayer(player2Data)                                            │
│ Respuesta: { roomId, players: [player1, player2], ... }                 │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ CLIENTE 2 conecta por Socket.IO                                         │
│ Emite: room:join { roomId: "room_123", userId: "user2" }                │
│ → SocketManager procesa                                                  │
│ → io.to(roomId).emit('room:player-joined', player2)                     │
└────────────┬────────────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ TODOS los clientes en sala reciben:                                     │
│ room:player-joined                                                       │
│ { player: { id: "user2", name: "Player2", ... }, players: [...] }       │
│                                                                          │
│ → Frontend actualiza UI mostrando ambos jugadores                       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependency Injection Container

```
                    ┌─────────────────┐
                    │   Container     │
                    │   (Singleton)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
  ┌────────────┐      ┌────────────┐     ┌──────────────┐
  │  Prisma    │      │ RoomManager│     │ Repositories │
  │  Client    │      │ (Singleton)│     │              │
  └─────┬──────┘      └────────────┘     └──────┬───────┘
        │                                        │
        │ inyecta                                │ inyecta
        ▼                                        ▼
  ┌────────────┐                         ┌──────────────┐
  │UserRepo    │                         │   Services   │
  │MatchRepo  │                         │              │
  │ ...        │                         └──────┬───────┘
  └─────┬──────┘                                │
        │                                       │ inyecta
        │                                       ▼
        │                                ┌──────────────┐
        │                                │ Controllers  │
        │                                │              │
        └────────────────────────────────┤ AuthCtrl    │
                                         │ RoomCtrl    │
                                         └──────────────┘
```

### Ejemplo de Creación:

```typescript
class Container {
  constructor() {
    // 1. Crear cliente de BD
    this.prisma = new PrismaClient();
    
    // 2. Crear repositorios (inyectar prisma)
    this.userRepository = new UserRepository(this.prisma);
    
    // 3. Crear servicios (inyectar repos)
    this.authService = new AuthService(this.userRepository);
    
    // 4. Crear controladores (inyectar servicios)
    this.authController = new AuthController(this.authService);
  }
}
```

---

## 🏗️ Jerarquía de Clases

### Repositories

```
     BaseRepository<T, ID>
     (clase abstracta)
            │
            ├─── UserRepository
            │
            ├─── MatchRepository
            │
            └─── StatsRepository
```

### Services

```
     BaseService
     (clase abstracta)
            │
            ├─── AuthService
            │
            ├─── UserService
            │
            └─── GameService
```

### Domain Models

```
     User
     ├─── id: string
     ├─── email: string
     ├─── level: number
     └─── Methods:
          ├─── canLevelUp()
          ├─── levelUp()
          ├─── addXp()
          └─── isAdmin()

     GameRoom
     ├─── id: string
     ├─── players: Map<string, Player>
     ├─── gameState: IGameState
     └─── Methods:
          ├─── addPlayer()
          ├─── startGame()
          ├─── flipCard()
          └─── checkMatch()
```

---

## 🔐 Principios SOLID Aplicados

```
┌──────────────────────────────────────────────────────────────────┐
│ S - Single Responsibility Principle                              │
│ Cada clase tiene UNA responsabilidad                             │
│                                                                   │
│ ✓ UserRepository  → Solo acceso a datos de usuarios             │
│ ✓ AuthService     → Solo lógica de autenticación                │
│ ✓ AuthController  → Solo manejo de HTTP requests                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ O - Open/Closed Principle                                        │
│ Abierto a extensión, cerrado a modificación                      │
│                                                                   │
│ ✓ Podemos crear MatchRepository sin modificar BaseRepository    │
│ ✓ Podemos agregar métodos a User sin romper código existente    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ L - Liskov Substitution Principle                                │
│ Subclases pueden reemplazar a clases padre                       │
│                                                                   │
│ ✓ Cualquier BaseRepository puede usarse donde se espera repo    │
│ ✓ UserRepository puede usarse donde se espera BaseRepository    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ I - Interface Segregation Principle                              │
│ Interfaces específicas para cada necesidad                       │
│                                                                   │
│ ✓ IUser solo tiene propiedades de usuario                       │
│ ✓ IPlayer solo tiene propiedades de jugador en sala             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ D - Dependency Inversion Principle                               │
│ Depender de abstracciones, no de implementaciones                │
│                                                                   │
│ ✓ AuthService depende de UserRepository (abstracción)           │
│ ✓ No depende directamente de Prisma (implementación)            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Comparación Visual

### ❌ Arquitectura Anterior (Sin POO)

```
┌─────────────────────────────────────────────┐
│              routes/auth.ts                 │
│  ┌───────────────────────────────────────┐ │
│  │ router.post('/login', async (req) =>  │ │
│  │   const user = await prisma.user...   │ │ ← Todo mezclado
│  │   if (!user) { await prisma.user...   │ │
│  │   if (user.isBanned) { return...      │ │
│  │   res.json(user);                     │ │
│  │ });                                    │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### ✅ Arquitectura Nueva (Con POO)

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   Route     │  →    │ Controller   │  →    │   Service    │
│ auth.v2.ts  │       │ AuthCtrl     │       │ AuthService  │
│             │       │              │       │              │
│ .post(      │       │ login() {    │       │ loginOr      │
│  ctrl.login │       │   service... │       │ Register() { │
│ )           │       │ }            │       │   repo...    │
└─────────────┘       └──────────────┘       └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │  Repository  │
                                              │  UserRepo    │
                                              │              │
                                              │ findByEmail()│
                                              │ create()     │
                                              └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │   Prisma     │
                                              └──────────────┘
```

---

Esta arquitectura POO te da:
- ✅ Código organizado y mantenible
- ✅ Fácil de testear
- ✅ Preparado para escalar
- ✅ Siguiendo mejores prácticas
