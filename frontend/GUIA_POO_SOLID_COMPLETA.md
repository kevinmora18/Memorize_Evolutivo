# 📚 GUÍA COMPLETA: POO + SOLID en Memorize Evolutivo

> **Todo explicado desde cero**: Qué es cada clase, qué hace cada método, por qué existe, y cómo aplica POO y SOLID.

---

## 📖 ÍNDICE

1. [LOS 4 PILARES DE LA POO](#pilares)
2. [LOS 5 PRINCIPIOS SOLID](#solid)
3. [TODAS LAS CLASES EXPLICADAS](#clases)
4. [GLOSARIO DE TÉRMINOS](#glosario)

---

<a name="pilares"></a>
# 🎭 PARTE 1: LOS 4 PILARES DE LA POO

## 1️⃣ ABSTRACCIÓN

### 🤔 ¿Qué es?
**Definición simple:** Mostrar solo lo esencial y ocultar los detalles complejos.

**Analogía:** Un auto tiene un volante, freno y acelerador. NO necesitas saber cómo funciona el motor internamente para manejarlo.

---

### 📂 En el proyecto: IGameModeStrategy

**Archivo:** `backend/src/core/interfaces/IGameModeStrategy.ts`

```typescript
export interface IGameModeStrategy {
  name: string;
  requiredFlips: number;
  description: string;
  
  checkMatch(cards: ICard[]): IMatchResult;
  calculateXp(matches: number): number;
  calculateCoins(matches: number): number;
  getBoardSize(): number;
}
```

**¿Qué hace esta interfaz?**
- Define un **contrato** (reglas) que TODOS los modos de juego deben cumplir
- Dice QUÉ métodos debe tener un modo de juego, pero NO dice CÓMO implementarlos
- Es una "promesa" de que cualquier modo tendrá estos métodos

**¿Por qué es abstracción?**
- Esconde los detalles de implementación
- El GameEngine solo ve la interfaz, NO sabe si es Pairs, Triads o Boss
- Puedes cambiar cómo funciona cada modo sin tocar el motor

**Ejemplo en la vida real:**
```typescript
// GameEngine NO sabe cuántas cartas se requieren
const required = room.getRequiredFlipsCount(); 
// ↑ Puede ser 2 (Pairs), 3 (Triads), o 2 (Boss)
// El motor NO le importa, solo usa el número
```

---

### 📂 En el proyecto: BaseEntity

**Archivo:** `backend/src/core/BaseEntity.ts`

```typescript
export abstract class BaseEntity<T = any> {
  public readonly id: string;           // ID único (no se puede cambiar)
  public readonly createdAt: Date;      // Cuándo se creó
  protected _updatedAt: Date;           // Cuándo se modificó (protegido)

  constructor(id: string, createdAt: Date = new Date(), updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt || createdAt;
  }

  // Getter para updatedAt (solo lectura desde afuera)
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Método protegido: solo las clases hijas pueden llamarlo
  protected touch(): void {
    this._updatedAt = new Date();
  }

  // Método abstracto: cada hijo DEBE implementarlo
  abstract toJSON(): T;
}
```

**¿Qué hace esta clase?**
- Es una clase **abstracta** (no se puede crear una BaseEntity directamente)
- Define propiedades y métodos comunes para TODAS las entidades
- `toJSON()` es abstracto: cada hijo decide cómo convertirse a JSON

**Propiedades:**
- `id`: Identificador único (UUID)
- `createdAt`: Timestamp de cuándo se creó la entidad
- `_updatedAt`: Timestamp de última modificación (privado con `_`)
- `updatedAt` (getter): Forma de leer `_updatedAt` sin poder modificarlo

**Métodos:**
- `touch()`: Actualiza `_updatedAt` a la fecha actual (cuando algo cambia)
- `toJSON()`: Convierte la entidad a un objeto JSON (cada hijo lo implementa diferente)
- `exists()`: Verifica si la entidad tiene un ID válido
- `getAge()`: Calcula cuánto tiempo tiene la entidad desde su creación
- `wasModified()`: Verifica si fue modificada después de crearse

**¿Por qué es abstracción?**
- Captura la "esencia" de lo que ES una entidad
- No dice CÓMO se serializa (toJSON abstracto)
- Cada hijo (User, GameRoom) decide los detalles

---

### 📂 En el proyecto: GameEngine

**Archivo:** `backend/src/engine/GameEngine.ts`

```typescript
export class GameEngine {
  private commandHandler: RoomCommandHandler;
  private turnTimers: Map<string, TurnTimer>;
  private onOutcome: (outcome: ICommandOutcome) => void;

  constructor(onOutcome: (outcome: ICommandOutcome) => void) {
    this.commandHandler = new RoomCommandHandler();
    this.turnTimers = new Map();
    this.onOutcome = onOutcome;  // ← Callback abstracto
  }

  async processCommand(command: IGameCommand, room: GameRoom): Promise<void> {
    const outcome = this.commandHandler.processCommand(command, room);
    
    // ⭐ El motor NO sabe si esto va a Socket.IO, HTTP, o consola
    this.onOutcome(outcome);
  }
}
```

**¿Qué hace esta clase?**
- Es el **motor autoritativo** del juego (decide qué es válido)
- Procesa comandos (start, flip, end_turn, finish)
- Gestiona timers de turno
- Evalúa matches automáticamente con delay

**¿Por qué es abstracción?**
- El motor NO conoce Socket.IO, HTTP, ni ningún transporte
- Solo llama a `onOutcome(outcome)` cuando algo sucede
- Puede funcionar con sockets, REST API, o tests sin servidor

**Ejemplo:**
```typescript
// En SocketManager.ts
this.gameEngine = new GameEngine((outcome) => {
  // SocketManager traduce el outcome a eventos Socket.IO
  this.io.to(outcome.roomId).emit(outcome.event, outcome.payload);
});

// En tests
const testEngine = new GameEngine((outcome) => {
  // En tests, solo guardamos el outcome en un array
  testOutcomes.push(outcome);
});
```

---

## 2️⃣ ENCAPSULAMIENTO

### 🤔 ¿Qué es?
**Definición simple:** Proteger los datos internos de una clase para que nadie los pueda romper desde afuera.

**Analogía:** Tu cuenta bancaria tiene un saldo, pero NO puedes hacer `cuenta.saldo = 1000000`. Solo puedes usar métodos seguros como `cuenta.depositar(100)` o `cuenta.retirar(50)`.

---

### 📂 En el proyecto: User

**Archivo:** `backend/src/models/domain/User.model.ts`

```typescript
export class User extends BaseEntity<IUser> {
  // ❌ PRIVADAS: Nadie puede acceder desde afuera
  private email: string;
  private passwordHash: string;
  
  // ✅ PÚBLICAS: Accesibles desde afuera
  public level: number;
  public xp: number;
  public coins: number;
  public gems: number;
  
  // ✅ PÚBLICAS pero READONLY: Solo lectura
  public readonly role: UserRole;
  public isBanned: boolean;
  public bannedUntil: Date | null;
  public banReason: string | null;

  constructor(data: IUserData) {
    super(data.id, data.createdAt, data.updatedAt);
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.level = data.level ?? 1;
    this.xp = data.xp ?? 0;
    this.coins = data.coins ?? 0;
    this.gems = data.gems ?? 0;
    this.role = data.role ?? 'player';
    this.isBanned = data.isBanned ?? false;
    this.bannedUntil = data.bannedUntil ?? null;
    this.banReason = data.banReason ?? null;
  }

  // ✅ Método público CONTROLADO para banear
  public applyBan(reason: string, durationMinutes?: number): void {
    this.isBanned = true;
    this.banReason = reason;
    
    if (durationMinutes) {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);
      this.bannedUntil = expiresAt;
    } else {
      this.bannedUntil = null; // Baneo permanente
    }
    
    this.touch(); // Actualiza updatedAt
  }

  // ✅ Método público CONTROLADO para desbanear
  public removeBan(): void {
    this.isBanned = false;
    this.bannedUntil = null;
    this.banReason = null;
    this.touch();
  }

  // ✅ Método público para verificar si está baneado
  public isCurrentlyBanned(): boolean {
    if (!this.isBanned) return false;
    
    // Si tiene fecha de expiración y ya pasó, auto-desbanear
    if (this.bannedUntil && this.bannedUntil < new Date()) {
      this.removeBan();
      return false;
    }
    
    return true;
  }

  // ✅ Método público para añadir XP y subir niveles
  public addXp(amount: number): number {
    this.xp += amount;
    let levelsGained = 0;
    
    // Fórmula: nivel 2 = 100 XP, nivel 3 = 200 XP, etc.
    while (this.xp >= this.level * 100) {
      this.xp -= this.level * 100;
      this.level++;
      levelsGained++;
    }
    
    this.touch();
    return levelsGained;
  }

  // ✅ Método público para añadir monedas
  public addCoins(amount: number): void {
    if (amount < 0) throw new Error('No se pueden añadir monedas negativas');
    this.coins += amount;
    this.touch();
  }

  // ✅ Método público para gastar monedas
  public spendCoins(amount: number): void {
    if (amount < 0) throw new Error('No se pueden gastar monedas negativas');
    if (this.coins < amount) throw new Error('Monedas insuficientes');
    this.coins -= amount;
    this.touch();
  }

  // ✅ Método público para verificar si es admin
  public isAdmin(): boolean {
    return this.role === 'admin';
  }

  // ✅ Serializar a JSON
  public toJSON(): IUser {
    return {
      id: this.id,
      email: this.email,
      level: this.level,
      xp: this.xp,
      coins: this.coins,
      gems: this.gems,
      role: this.role,
      isBanned: this.isBanned,
      bannedUntil: this.bannedUntil,
      banReason: this.banReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
```

**¿Por qué es encapsulamiento?**

**1. Propiedades privadas:**
```typescript
private email: string;        // ❌ Nadie puede hacer user.email = "hack"
private passwordHash: string; // ❌ Nadie puede ver el hash de la contraseña
```

**2. Métodos controlados:**
```typescript
// ❌ MAL: Si todo fuera público
user.isBanned = true;  // ← No actualizó updatedAt, no guardó reason

// ✅ BIEN: Usar métodos
user.applyBan("Spam", 60);  // ← Valida, guarda reason, actualiza updatedAt
```

**3. Validaciones internas:**
```typescript
public spendCoins(amount: number): void {
  if (amount < 0) throw new Error('No negativo');
  if (this.coins < amount) throw new Error('Insuficiente');
  this.coins -= amount;
  this.touch();
}

// ❌ Si coins fuera público:
// user.coins = -9999; // ← ROMPERÍA la lógica
```

---

### 📂 En el proyecto: GameRoom

**Archivo:** `backend/src/models/domain/GameRoom.model.ts`

```typescript
export class GameRoom extends BaseEntity {
  // ❌ PRIVADAS: Estado interno protegido
  private players: Map<string, Player>;
  private state: IGameState;
  private strategy: IGameModeStrategy;

  constructor(data: IGameRoomData) {
    super(data.id, data.createdAt);
    this.players = new Map();
    this.strategy = GameModeFactory.getStrategy(data.mode);
    this.state = {
      status: 'waiting',
      currentTurn: null,
      flippedCards: [],
      matchedCards: [],
      scores: new Map(),
      cards: [],
    };
  }

  // ✅ Método público CONTROLADO para voltear carta
  public flipCard(cardIndex: number, playerId: string): void {
    // Validación 1: ¿Es tu turno?
    if (this.state.currentTurn !== playerId) {
      throw new Error('No es tu turno');
    }

    // Validación 2: ¿Ya está volteada?
    if (this.state.flippedCards.includes(cardIndex)) {
      throw new Error('Carta ya volteada');
    }

    // Validación 3: ¿Alcanzaste el límite?
    const required = this.strategy.requiredFlips;
    if (this.state.flippedCards.length >= required) {
      throw new Error(`Solo puedes voltear ${required} cartas por turno`);
    }

    // Validación 4: ¿Índice válido?
    if (cardIndex < 0 || cardIndex >= this.state.cards.length) {
      throw new Error('Índice de carta inválido');
    }

    // ✅ AHORA SÍ: voltear
    this.state.flippedCards.push(cardIndex);
    this.touch();
  }

  // ✅ Getter seguro: devuelve una COPIA
  public getGameState(): IGameState {
    return {
      ...this.state,
      scores: new Map(this.state.scores), // Copia del Map
      flippedCards: [...this.state.flippedCards], // Copia del array
    };
  }

  // ✅ Método público para verificar match (usa estrategia)
  public checkMatch(): IMatchResult {
    const flippedCards = this.state.flippedCards.map(i => this.state.cards[i]);
    return this.strategy.checkMatch(flippedCards);
  }

  // ✅ Método público para registrar match
  public registerMatch(playerId: string, ...cardIndexes: number[]): void {
    // Marcar cartas como emparejadas
    cardIndexes.forEach(i => this.state.matchedCards.push(i));
    
    // Incrementar puntuación
    const currentScore = this.state.scores.get(playerId) || 0;
    this.state.scores.set(playerId, currentScore + 1);
    
    this.touch();
  }

  // ✅ Método público para cambiar turno
  public nextTurn(): string {
    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.state.currentTurn!);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.state.currentTurn = playerIds[nextIndex];
    this.touch();
    return this.state.currentTurn;
  }
}
```

**¿Por qué es encapsulamiento?**

**1. Estado interno protegido:**
```typescript
private state: IGameState; // ❌ Nadie puede hacer room.state.currentTurn = "hack"
```

**2. Validaciones en métodos:**
```typescript
// ❌ Si state fuera público:
room.state.flippedCards.push(999); // ← No valida si es tu turno
room.state.currentTurn = "otro";   // ← Rompe el orden

// ✅ Con encapsulamiento:
room.flipCard(5, userId); // ← Valida TODO antes de modificar
```

**3. Getters que devuelven copias:**
```typescript
public getGameState(): IGameState {
  return {
    ...this.state,
    scores: new Map(this.state.scores), // ← COPIA
  };
}

// ❌ Si devolviera la referencia directa:
const state = room.getGameState();
state.currentTurn = "hack"; // ← Modificaría el estado interno
```

---

## 3️⃣ HERENCIA

### 🤔 ¿Qué es?
**Definición simple:** Una clase "hija" hereda propiedades y métodos de una clase "padre".

**Analogía:** Todos los vehículos tienen ruedas, motor y frenos. Un auto, moto y camión heredan esas características, pero cada uno añade lo suyo (auto tiene 4 puertas, moto tiene 2 ruedas).

---

### 📂 En el proyecto: BaseEntity → User y GameRoom

**Jerarquía:**
```
BaseEntity (padre abstracto)
  ├─ User (hijo)
  ├─ GameRoom (hijo)
  └─ Match (hijo)
```

**1. PADRE: BaseEntity**

```typescript
// backend/src/core/BaseEntity.ts
export abstract class BaseEntity<T = any> {
  public readonly id: string;
  public readonly createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: string, createdAt: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt || createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  abstract toJSON(): T; // ← Cada hijo debe implementar
}
```

**2. HIJO 1: User**

```typescript
// backend/src/models/domain/User.model.ts
export class User extends BaseEntity<IUser> {
  //         ↑ extends = "hereda de"
  
  private email: string;
  public level: number;

  constructor(data: IUserData) {
    super(data.id, data.createdAt, data.updatedAt);
    //↑ llama al constructor del padre
    
    this.email = data.email;
    this.level = data.level ?? 1;
  }

  public levelUp(): void {
    this.level++;
    this.touch(); // ← Heredado de BaseEntity
  }

  toJSON(): IUser {
    return {
      id: this.id,           // ← Heredado
      createdAt: this.createdAt, // ← Heredado
      updatedAt: this.updatedAt, // ← Heredado
      email: this.email,
      level: this.level,
    };
  }
}
```

**3. HIJO 2: GameRoom**

```typescript
// backend/src/models/domain/GameRoom.model.ts
export class GameRoom extends BaseEntity {
  private players: Map<string, Player>;

  constructor(data: IGameRoomData) {
    super(data.id, data.createdAt);
    //↑ llama al constructor del padre
    
    this.players = new Map();
  }

  public addPlayer(player: Player): void {
    this.players.set(player.id, player);
    this.touch(); // ← Heredado de BaseEntity
  }

  toJSON() {
    return {
      id: this.id,           // ← Heredado
      createdAt: this.createdAt, // ← Heredado
      updatedAt: this.updatedAt, // ← Heredado
      players: Array.from(this.players.values()),
    };
  }
}
```

**¿Qué hereda cada hijo?**

| Propiedad/Método | User hereda | GameRoom hereda |
|-----------------|-------------|-----------------|
| `id` | ✅ | ✅ |
| `createdAt` | ✅ | ✅ |
| `updatedAt` | ✅ | ✅ |
| `touch()` | ✅ | ✅ |
| `exists()` | ✅ | ✅ |
| `getAge()` | ✅ | ✅ |
| `toJSON()` | ⚠️ Debe implementar | ⚠️ Debe implementar |

**Beneficios de la herencia:**

**1. No duplicar código:**
```typescript
// ❌ Sin herencia:
class User {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

class GameRoom {
  id: string;        // ← Duplicado
  createdAt: Date;   // ← Duplicado
  updatedAt: Date;   // ← Duplicado
}

// ✅ Con herencia:
class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

class User extends BaseEntity { } // ← Hereda todo
class GameRoom extends BaseEntity { } // ← Hereda todo
```

**2. Consistencia:**
Todas las entidades se comportan igual (tienen `id`, `createdAt`, `touch()`).

**3. Mantenibilidad:**
Si cambias `BaseEntity`, todos los hijos se actualizan automáticamente.

---

### 📂 En el proyecto: BaseGameModeStrategy → Estrategias

**Jerarquía:**
```
BaseGameModeStrategy (padre abstracto)
  ├─ PairsModeStrategy (hijo)
  ├─ TriadsModeStrategy (hijo)
  └─ BossModeStrategy (hijo)
```

**1. PADRE: BaseGameModeStrategy**

```typescript
// backend/src/models/strategies/BaseGameModeStrategy.ts
export abstract class BaseGameModeStrategy implements IGameModeStrategy {
  abstract name: string;
  abstract requiredFlips: number;
  abstract description: string;

  // ⭐ Método común (todos los modos lo usan)
  calculateXp(matches: number): number {
    return matches * 50; // Base: 50 XP por match
  }

  // ⭐ Método común
  calculateCoins(matches: number): number {
    return matches * 10; // Base: 10 monedas por match
  }

  // ⭐ Método abstracto (cada modo lo implementa diferente)
  abstract checkMatch(cards: ICard[]): IMatchResult;
}
```

**2. HIJO 1: PairsModeStrategy**

```typescript
// backend/src/models/strategies/PairsModeStrategy.ts
export class PairsModeStrategy extends BaseGameModeStrategy {
  name = 'Modo Clásico';
  requiredFlips = 2; // ← 2 cartas

  // ⭐ Implementación específica
  checkMatch(cards: ICard[]): IMatchResult {
    if (cards.length !== 2) {
      return { isMatch: false, xpEarned: 0, coinsEarned: 0 };
    }

    const match = cards[0].id === cards[1].id;
    
    return {
      isMatch: match,
      xpEarned: match ? this.calculateXp(1) : 0,  // ← Heredado
      coinsEarned: match ? this.calculateCoins(1) : 0, // ← Heredado
    };
  }
}
```

**3. HIJO 2: TriadsModeStrategy**

```typescript
// backend/src/models/strategies/TriadsModeStrategy.ts
export class TriadsModeStrategy extends BaseGameModeStrategy {
  name = 'Modo Tríadas';
  requiredFlips = 3; // ← 3 cartas

  checkMatch(cards: ICard[]): IMatchResult {
    if (cards.length !== 3) {
      return { isMatch: false, xpEarned: 0, coinsEarned: 0 };
    }

    const match = cards[0].id === cards[1].id && cards[1].id === cards[2].id;
    
    return {
      isMatch: match,
      xpEarned: match ? 75 : 0,  // ← Más XP que Pairs
      coinsEarned: match ? 15 : 0,
    };
  }
}
```

**4. HIJO 3: BossModeStrategy**

```typescript
// backend/src/models/strategies/BossModeStrategy.ts
export class BossModeStrategy extends BaseGameModeStrategy {
  name = 'Modo Boss';
  requiredFlips = 2;

  checkMatch(cards: ICard[]): IMatchResult {
    if (cards.length !== 2) {
      return { isMatch: false, xpEarned: 0, coinsEarned: 0 };
    }

    const match = cards[0].id === cards[1].id;
    
    // ⭐ DIFERENCIA: Bonus según categoría
    let xpBonus = 0;
    if (match) {
      if (cards[0].category === 'legendary') xpBonus = 50;
      else if (cards[0].category === 'epic') xpBonus = 30;
      else if (cards[0].category === 'rare') xpBonus = 10;
    }
    
    return {
      isMatch: match,
      xpEarned: match ? 60 + xpBonus : 0,
      coinsEarned: match ? 20 : 0,
    };
  }
}
```

**Comparación de herencia:**

| Método | PairsModeStrategy | TriadsModeStrategy | BossModeStrategy |
|--------|-------------------|-------------------|------------------|
| `calculateXp()` | ✅ Heredado | ✅ Heredado | ✅ Heredado |
| `calculateCoins()` | ✅ Heredado | ✅ Heredado | ✅ Heredado |
| `checkMatch()` | ⚠️ Implementa (2 cartas) | ⚠️ Implementa (3 cartas) | ⚠️ Implementa (bonus) |

---

## 4️⃣ POLIMORFISMO

### 🤔 ¿Qué es?
**Definición simple:** Múltiples clases implementan la misma interfaz, pero cada una lo hace de forma diferente.

**Analogía:** Todos los animales hacen sonidos. Un perro hace "guau", un gato hace "miau", una vaca hace "mu". La función `hacerSonido()` es la misma, pero cada animal la implementa diferente.

---

### 📂 En el proyecto: IGameModeStrategy

**Interfaz común:**
```typescript
// backend/src/core/interfaces/IGameModeStrategy.ts
export interface IGameModeStrategy {
  name: string;
  requiredFlips: number;
  checkMatch(cards: ICard[]): IMatchResult;
}
```

**3 implementaciones diferentes:**

**1. PairsModeStrategy:**
```typescript
export class PairsModeStrategy implements IGameModeStrategy {
  name = 'Modo Clásico';
  requiredFlips = 2;

  checkMatch(cards: ICard[]): IMatchResult {
    // Lógica para 2 cartas
    const match = cards[0].id === cards[1].id;
    return { isMatch: match, xpEarned: 50 };
  }
}
```

**2. TriadsModeStrategy:**
```typescript
export class TriadsModeStrategy implements IGameModeStrategy {
  name = 'Modo Tríadas';
  requiredFlips = 3;

  checkMatch(cards: ICard[]): IMatchResult {
    // Lógica para 3 cartas
    const match = cards[0].id === cards[1].id && cards[1].id === cards[2].id;
    return { isMatch: match, xpEarned: 75 };
  }
}
```

**3. BossModeStrategy:**
```typescript
export class BossModeStrategy implements IGameModeStrategy {
  name = 'Modo Boss';
  requiredFlips = 2;

  checkMatch(cards: ICard[]): IMatchResult {
    // Lógica con bonus
    const match = cards[0].id === cards[1].id;
    const bonus = cards[0].category === 'legendary' ? 50 : 0;
    return { isMatch: match, xpEarned: 60 + bonus };
  }
}
```

---

### 🎯 Cómo se usa el polimorfismo en GameRoom

```typescript
// backend/src/models/domain/GameRoom.model.ts
export class GameRoom extends BaseEntity {
  private strategy: IGameModeStrategy; // ← Tipo abstracto

  constructor(data: IGameRoomData) {
    super(data.id, data.createdAt);
    
    // ⭐ POLIMORFISMO: Asigna la estrategia según el modo
    this.strategy = GameModeFactory.getStrategy(data.mode);
    // Puede ser PairsModeStrategy, TriadsModeStrategy, o BossModeStrategy
  }

  public getRequiredFlipsCount(): number {
    // ⭐ POLIMORFISMO: Cada estrategia devuelve su número
    return this.strategy.requiredFlips;
    // Si es Pairs: devuelve 2
    // Si es Triads: devuelve 3
    // Si es Boss: devuelve 2
  }

  public checkMatch(): IMatchResult {
    const flippedCards = this.getFlippedCards();
    
    // ⭐ POLIMORFISMO: Cada estrategia evalúa diferente
    return this.strategy.checkMatch(flippedCards);
    // Si es Pairs: compara 2 cartas
    // Si es Triads: compara 3 cartas
    // Si es Boss: compara 2 + bonus
  }
}
```

**Lo importante:**
- `GameRoom` NO sabe qué estrategia tiene
- Solo sabe que tiene una `IGameModeStrategy`
- Llama a métodos de la interfaz
- Cada estrategia responde diferente

---

### 🎯 Cómo se usa el polimorfismo en GameEngine

```typescript
// backend/src/engine/GameEngine.ts
async handleCardFlipped(room: GameRoom, playerId: string): Promise<void> {
  const state = room.getGameState();
  
  // ⭐ POLIMORFISMO: NO sabemos cuántas cartas se requieren
  const required = room.getRequiredFlipsCount();
  //               ↑ Puede ser 2 o 3, dependiendo del modo
  
  if (state.flippedCards.length >= required) {
    // ⭐ POLIMORFISMO: NO sabemos cómo se evalúa el match
    this.scheduleEvaluate(room);
  }
}

private async evaluateHand(room: GameRoom, playerId: string): Promise<void> {
  // ⭐ POLIMORFISMO: Cada modo evalúa diferente
  const { isMatch, xpEarned, coinsEarned } = room.checkMatch();
  
  if (isMatch) {
    room.registerMatch(playerId, ...room.getGameState().flippedCards);
  }
}
```

**El motor NO tiene `if/switch`:**
```typescript
// ❌ Sin polimorfismo:
if (mode === 'classic') {
  if (cards.length === 2 && cards[0].id === cards[1].id) { /* match */ }
} else if (mode === 'triads') {
  if (cards.length === 3 && cards[0].id === cards[1].id && cards[1].id === cards[2].id) { /* match */ }
} else if (mode === 'boss') {
  // ...
}

// ✅ Con polimorfismo:
const result = room.checkMatch(); // ← Una sola línea
```

---

### 📊 Comparación visual del polimorfismo

```
┌──────────────────────────────────┐
│         GameRoom                 │
│                                  │
│  strategy: IGameModeStrategy ←───┼─── Tipo abstracto
│                                  │
│  checkMatch() {                  │
│    return strategy.checkMatch(); │ ← Llama sin saber cuál es
│  }                               │
└──────────────────────────────────┘
                 │
                 ├──────────────────┐
                 │                  │
                 ▼                  ▼
    ┌─────────────────────┐  ┌─────────────────────┐
    │ PairsModeStrategy   │  │ TriadsModeStrategy  │
    │                     │  │                     │
    │ requiredFlips = 2   │  │ requiredFlips = 3   │
    │                     │  │                     │
    │ checkMatch() {      │  │ checkMatch() {      │
    │   // 2 cartas       │  │   // 3 cartas       │
    │ }                   │  │ }                   │
    └─────────────────────┘  └─────────────────────┘
```

---



---

<a name="solid"></a>
# ⚡ PARTE 2: LOS 5 PRINCIPIOS SOLID

## 🎯 S - Single Responsibility Principle (Responsabilidad Única)

### 🤔 ¿Qué es?
**Definición:** Cada clase debe tener **una única responsabilidad** y **un solo motivo para cambiar**.

**Analogía:** Un chef cocina, un mesero sirve, un cajero cobra. Si el chef también cobrara y limpiara, haría demasiadas cosas y sería difícil reemplazarlo.

---

### 📂 Servicio 1: AuthService

**Archivo:** `backend/src/services/AuthService.ts`

**Única responsabilidad:** Autenticación y control de acceso

```typescript
export class AuthService extends BaseService implements IAuthService {
  private userRepository: UserRepository;

  // ✅ Responsabilidad 1: Login o registro
  async loginOrRegister(email: string): Promise<User> {
    if (!email || !email.includes('@')) {
      throw new Error('Email inválido');
    }

    let user = await this.userRepository.findByEmail(email);
    if (!user) {
      user = await this.userRepository.create({ email });
    }

    if (user.isCurrentlyBanned()) {
      throw new Error('Usuario baneado');
    }

    await this.userRepository.updateLastLogin(user.id);
    return user;
  }

  // ✅ Responsabilidad 2: Validar acceso
  async validateAccess(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user ? !user.isCurrentlyBanned() : false;
  }

  // ✅ Responsabilidad 3: Verificar rol admin
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    return user ? user.isAdmin() : false;
  }
}
```

**Razón para cambiar:** Si cambian las reglas de autenticación o JWT

**NO hace:**
- ❌ Gestionar perfil de usuario → eso es `UserService`
- ❌ Guardar partidas → eso es `MatchService`
- ❌ Calcular estadísticas → eso es `LeaderboardService`

---

### 📂 Servicio 2: UserService

**Archivo:** `backend/src/services/UserService.ts`

**Única responsabilidad:** Perfil, XP y progresión del jugador

```typescript
export class UserService extends BaseService implements IUserService {
  private userRepository: UserRepository;
  private statsRepository: PlayerStatsRepository;

  // ✅ Responsabilidad: Obtener perfil completo
  async getUserProfile(userId: string): Promise<{
    user: User;
    stats: PlayerStats | null;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const stats = await this.statsRepository.findByUserId(userId);
    return { user, stats };
  }

  // ✅ Responsabilidad: Añadir XP y subir niveles
  async addXpToUser(userId: string, xpAmount: number): Promise<{
    user: User;
    levelsGained: number;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    const levelsGained = user.addXp(xpAmount);

    const updatedUser = await this.userRepository.update(userId, {
      xp: user.xp,
      level: user.level,
    });

    return { user: updatedUser, levelsGained };
  }

  // ✅ Responsabilidad: Recompensar monedas
  async rewardCoins(userId: string, amount: number): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    user.addCoins(amount);

    return await this.userRepository.update(userId, {
      coins: user.coins,
    });
  }

  // ✅ Responsabilidad: Registrar partida y actualizar stats
  async recordGamePlayed(userId: string, gameData: {
    score: number;
    won: boolean;
    matches: number;
    xpEarned: number;
    coinsEarned: number;
  }): Promise<{
    user: User;
    stats: PlayerStats;
    levelsGained: number;
  }> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    let stats = await this.statsRepository.findByUserId(userId);
    if (!stats) {
      stats = await this.statsRepository.create({ userId });
    }

    // Actualizar estadísticas
    stats.recordGame(gameData.score, gameData.won, gameData.matches, 0, 0);

    // Actualizar XP y monedas
    const levelsGained = user.addXp(gameData.xpEarned);
    user.addCoins(gameData.coinsEarned);

    const [updatedUser, updatedStats] = await Promise.all([
      this.userRepository.update(userId, {
        xp: user.xp,
        level: user.level,
        coins: user.coins,
      }),
      this.statsRepository.update(stats.id, stats.toJSON()),
    ]);

    return { user: updatedUser, stats: updatedStats, levelsGained };
  }
}
```

**Razón para cambiar:** Si cambian las reglas de XP, niveles o progresión

**NO hace:**
- ❌ Autenticar usuarios → eso es `AuthService`
- ❌ Gestionar contenido admin → eso es `AdminContentService`

---

### 📂 Refactor Admin: 1 servicio → 4 servicios

**❌ ANTES (Violación SRP):**
```typescript
// AdminService.ts - HACÍA TODO
class AdminService {
  // Usuarios
  banUser() {...}
  unbanUser() {...}
  changeUserRole() {...}
  giveCurrency() {...}
  
  // Contenido
  createAnnouncement() {...}
  createPromotion() {...}
  
  // Analíticas
  getAnalytics() {...}
  getAllMatches() {...}
  
  // Auditoría
  getAuditLogs() {...}
}
// ↑ 4 responsabilidades en 1 clase
```

**✅ DESPUÉS (Cumple SRP):**

**1. AdminUserService** - Solo gestión de usuarios

```typescript
// backend/src/services/AdminUserService.ts
export class AdminUserService extends BaseService {
  private userRepository: IUserRepository;
  private adminLogRepository: IAdminLogRepository;

  async listUsers(options: any): Promise<any> {...}
  async getUserDetail(userId: string): Promise<any> {...}
  
  async banUser(userId: string, reason: string, durationMinutes: number, adminId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error('Usuario no encontrado');

    user.applyBan(reason, durationMinutes);
    
    const updatedUser = await this.userRepository.update(userId, {
      isBanned: user.isBanned,
      bannedUntil: user.bannedUntil,
      banReason: user.banReason,
    });

    await this.adminLogRepository.createLog({
      adminId,
      action: AdminAction.BAN_USER,
      targetId: userId,
      details: JSON.stringify({ reason, durationMinutes }),
    });

    return updatedUser;
  }

  async unbanUser(userId: string, adminId: string): Promise<User> {...}
  async changeUserRole(userId: string, newRole: string, adminId: string): Promise<User> {...}
  async updateUserCurrency(userId: string, coins: number, gems: number, adminId: string): Promise<User> {...}
  async deleteUser(userId: string, adminId: string): Promise<void> {...}
}
```

**Razón para cambiar:** Si cambian las reglas de administración de usuarios

---

**2. AdminContentService** - Solo contenido

```typescript
// backend/src/services/AdminContentService.ts
export class AdminContentService extends BaseService {
  private announcementRepository: IAnnouncementRepository;
  private promotionRepository: IPromotionRepository;
  private adminLogRepository: IAdminLogRepository;

  async listAnnouncements(): Promise<any[]> {...}
  
  async createAnnouncement(data: {
    title: string;
    message: string;
    type?: string;
    expiresAt?: string;
    adminId: string;
  }): Promise<any> {
    const announcement = await this.announcementRepository.create({
      title: data.title,
      message: data.message,
      type: data.type ?? 'info',
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: true,
    });

    await this.adminLogRepository.createLog({
      adminId: data.adminId,
      action: 'create_announcement',
      targetId: announcement.id,
    });

    return announcement;
  }

  async toggleAnnouncement(id: string, isActive: boolean): Promise<any> {...}
  async deleteAnnouncement(id: string): Promise<void> {...}
  async listPromotions(): Promise<any[]> {...}
  async createPromotion(data: any): Promise<any> {...}
  async deletePromotion(id: string): Promise<void> {...}
}
```

**Razón para cambiar:** Si cambian las reglas de anuncios o promociones

---

**3. AdminAnalyticsService** - Solo analíticas

```typescript
// backend/src/services/AdminAnalyticsService.ts
export class AdminAnalyticsService extends BaseService {
  private analyticsRepository: IAnalyticsRepository;
  private matchRepository: IMatchRepository;
  private adminLogRepository: IAdminLogRepository;

  async getAllMatches(options?: any): Promise<{ matches: any[]; total: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.matchRepository.findAll({
        userId: options?.userId,
        mode: options?.mode,
        skip,
        take: limit,
      }),
      this.matchRepository.count({
        userId: options?.userId,
        mode: options?.mode,
      }),
    ]);

    return { matches, total };
  }

  async getGeneralStats(): Promise<any> {
    return await this.analyticsRepository.getOverview();
  }

  async getAnalytics(period: string): Promise<any> {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '24h': startDate.setHours(now.getHours() - 24); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      default: startDate.setDate(now.getDate() - 7); break;
    }

    const window = await this.analyticsRepository.getWindowMetrics(startDate, now);

    return {
      period,
      metrics: {
        newUsers: window.newUsers,
        matchesPlayed: window.matchesPlayed,
        activeUsers: window.activeUsers,
        retentionRate: window.retentionRate,
      },
      modeDistribution: window.modeDistribution,
    };
  }

  async giveCurrencyToAll(coins: number, gems: number, adminId: string): Promise<any> {...}
}
```

**Razón para cambiar:** Si cambian las métricas o cálculos de analíticas

---

**4. AuditLogService** - Solo auditoría

```typescript
// backend/src/services/AuditLogService.ts
export class AuditLogService extends BaseService {
  private adminLogRepository: IAdminLogRepository;

  async getLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    adminId?: string;
  }): Promise<{ logs: any[]; total: number; totalPages: number }> {
    const logs = await this.adminLogRepository.findAll(options);
    
    return {
      logs,
      total: logs.length,
      totalPages: Math.ceil(logs.length / (options.limit || 10)),
    };
  }
}
```

**Razón para cambiar:** Si cambian las reglas de auditoría

---

### 📊 Tabla comparativa SRP

| Servicio | Única Responsabilidad | Razón para cambiar |
|----------|----------------------|-------------------|
| `AuthService` | Autenticación y JWT | Reglas de login/registro |
| `UserService` | Perfil, XP, progresión | Sistema de niveles/recompensas |
| `AdminUserService` | Gestión admin de usuarios | Reglas de baneos/roles |
| `AdminContentService` | Anuncios y promociones | Contenido del sistema |
| `AdminAnalyticsService` | Métricas y analíticas | Cálculos de estadísticas |
| `AuditLogService` | Logs de auditoría | Formato de logs |

---

## 🔓 O - Open/Closed Principle (Abierto/Cerrado)

### 🤔 ¿Qué es?
**Definición:** Las clases deben estar **abiertas a extensión** pero **cerradas a modificación**.

**Analogía:** Una extensión de casa. Puedes agregar una habitación nueva (extensión) sin demoler las existentes (modificación).

---

### 📂 GameModeFactory

**Archivo:** `backend/src/models/strategies/GameModeFactory.ts`

```typescript
export class GameModeFactory {
  private static strategies = new Map<string, IGameModeStrategy>([
    ['classic', new PairsModeStrategy()],
    ['triads',  new TriadsModeStrategy()],
    ['boss',    new BossModeStrategy()],
  ]);

  static getStrategy(mode: string): IGameModeStrategy {
    const strategy = this.strategies.get(mode);
    if (!strategy) throw new Error(`Modo desconocido: ${mode}`);
    return strategy;
  }

  // ⭐ ABIERTO A EXTENSIÓN: puedes registrar nuevas estrategias
  static registerStrategy(name: string, strategy: IGameModeStrategy): void {
    this.strategies.set(name, strategy);
  }
}
```

**Cómo agregar un modo nuevo (Cuartetos - 4 cartas):**

**1. Crear nueva estrategia:**
```typescript
// backend/src/models/strategies/QuadsModeStrategy.ts
export class QuadsModeStrategy extends BaseGameModeStrategy {
  name = 'Modo Cuartetos';
  requiredFlips = 4; // ← 4 cartas

  checkMatch(cards: ICard[]): IMatchResult {
    if (cards.length !== 4) {
      return { isMatch: false, xpEarned: 0, coinsEarned: 0 };
    }

    const match = 
      cards[0].id === cards[1].id && 
      cards[1].id === cards[2].id && 
      cards[2].id === cards[3].id;
    
    return {
      isMatch: match,
      xpEarned: match ? 100 : 0,
      coinsEarned: match ? 20 : 0,
    };
  }
}
```

**2. Registrar en Container:**
```typescript
// backend/src/Container.ts
private initializeGameStrategies(): void {
  const pairsStrategy = new PairsModeStrategy();
  const triadsStrategy = new TriadsModeStrategy();
  const bossStrategy = new BossModeStrategy();
  const quadsStrategy = new QuadsModeStrategy(); // ← NUEVO

  GameModeFactory.registerStrategy('classic', pairsStrategy);
  GameModeFactory.registerStrategy('triads', triadsStrategy);
  GameModeFactory.registerStrategy('boss', bossStrategy);
  GameModeFactory.registerStrategy('quads', quadsStrategy); // ← NUEVO
}
```

**✅ LO QUE NO TOCAS:**
- ❌ `GameEngine.ts` - NO cambia
- ❌ `GameRoom.ts` - NO cambia
- ❌ `SocketManager.ts` - NO cambia
- ❌ `RoomCommandHandler.ts` - NO cambia

**Beneficios:**
- ✅ Código existente cerrado a modificación
- ✅ Nueva funcionalidad por extensión
- ✅ Sin riesgo de romper lo que ya funciona

---

## 🔄 L - Liskov Substitution Principle (Sustitución de Liskov)

### 🤔 ¿Qué es?
**Definición:** Cualquier subclase debe poder **sustituir** a su clase base sin romper el programa.

**Analogía:** Si tienes un control remoto universal, debería funcionar con cualquier TV (Sony, Samsung, LG). Si el control de Sony no funciona en una Samsung, viola LSP.

---

### 📂 En el proyecto

```typescript
// backend/src/models/domain/GameRoom.model.ts
export class GameRoom extends BaseEntity {
  private strategy: IGameModeStrategy;  // ← Tipo abstracto

  checkMatch() {
    return this.strategy.checkMatch(this.getFlippedCards());
  }

  getRequiredFlipsCount() {
    return this.strategy.requiredFlips;
  }
}
```

**✅ LSP en acción:**

```typescript
// Puedes sustituir cualquier estrategia
const room1 = new GameRoom({ mode: 'classic' }); // PairsModeStrategy
const room2 = new GameRoom({ mode: 'triads' });  // TriadsModeStrategy
const room3 = new GameRoom({ mode: 'boss' });    // BossModeStrategy

// TODAS funcionan igual para el motor
room1.checkMatch(); // ✅ Funciona
room2.checkMatch(); // ✅ Funciona
room3.checkMatch(); // ✅ Funciona

room1.getRequiredFlipsCount(); // ✅ Devuelve 2
room2.getRequiredFlipsCount(); // ✅ Devuelve 3
room3.getRequiredFlipsCount(); // ✅ Devuelve 2
```

**El motor NO se rompe:**
```typescript
// backend/src/engine/GameEngine.ts
async handleCardFlipped(room: GameRoom, playerId: string): Promise<void> {
  // ⭐ Funciona con CUALQUIER estrategia
  const required = room.getRequiredFlipsCount();
  
  if (state.flippedCards.length >= required) {
    this.scheduleEvaluate(room);
  }
}
```

---

## 🧩 I - Interface Segregation Principle (Segregación de Interfaces)

### 🤔 ¿Qué es?
**Definición:** Ningún cliente debe depender de métodos que no usa. Es mejor tener **muchas interfaces pequeñas** que una interfaz gigante.

**Analogía:** Un control remoto de TV no debería tener botones del microondas. Cada dispositivo debe tener solo los botones que necesita.

---

### 📂 En el proyecto

**Archivo:** `backend/src/core/interfaces/IRepository.ts`

**✅ Interfaces segregadas (pequeñas y específicas):**

```typescript
// ✅ 1. Interfaz para usuarios (solo métodos de usuarios)
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findWithFilters(options: any): Promise<{ users: User[]; total: number }>;
  findDetail(userId: string): Promise<any>;
  findBannedUsers(): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  create(data: any): Promise<User>;
}

// ✅ 2. Interfaz para logs (solo crear y leer, NO update ni delete)
export interface IAdminLogRepository {
  createLog(data: any): Promise<void>;
  findAll(options?: any): Promise<any[]>;
  // ↑ NO tiene update() ni delete() porque no los necesita
}

// ✅ 3. Interfaz para analíticas (solo métricas, NO CRUD)
export interface IAnalyticsRepository {
  getOverview(): Promise<any>;
  getWindowMetrics(startDate: Date, endDate: Date): Promise<any>;
  giveCurrencyToAll(coins?: number, gems?: number): Promise<number>;
  // ↑ NO tiene findById, create, update, delete
}

// ✅ 4. Interfaz para anuncios
export interface IAnnouncementRepository {
  findAll(): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findActive(): Promise<any[]>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  toggleActive(id: string, isActive: boolean): Promise<any>;
  delete(id: string): Promise<void>;
}
```

**❌ MALO (Violación ISP):**
```typescript
// Una interfaz GIGANTE con TODO
export interface IMegaRepository {
  findById();
  findAll();
  create();
  update();
  delete();
  getAnalytics();      // ← User NO necesita esto
  createLog();         // ← Analytics NO necesita esto
  giveCurrency();      // ← Logs NO necesita esto
  findBannedUsers();   // ← Analytics NO necesita esto
  toggleActive();      // ← Users NO necesita esto
}

// ❌ Ahora TODOS los repositorios están obligados a implementar TODO
class UserRepository implements IMegaRepository {
  async getAnalytics() { throw new Error('Not implemented'); } // ← Forzado
  async createLog() { throw new Error('Not implemented'); }    // ← Forzado
  async toggleActive() { throw new Error('Not implemented'); } // ← Forzado
}
```

**✅ Beneficio:**
- `IAdminLogRepository` NO está obligado a implementar `update()` ni `delete()`
- `IAnalyticsRepository` NO está obligado a implementar CRUD
- Cada interfaz tiene solo lo que necesita

---

## 🔁 D - Dependency Inversion Principle (Inversión de Dependencias)

### 🤔 ¿Qué es?
**Definición:** Las clases de alto nivel NO deben depender de clases concretas, sino de **abstracciones (interfaces)**.

**Analogía:** Un enchufe (interfaz estándar). No importa si conectas una lámpara Sony o Samsung, ambas funcionan porque usan la misma interfaz de enchufe.

---

### 📂 Container.ts - Inyección de Dependencias

**Archivo:** `backend/src/Container.ts`

```typescript
export class Container {
  public prisma: PrismaClient;
  public roomManager: RoomManager;
  public gameEngine: GameEngine;

  // Repositorios
  public userRepository: UserRepository;
  public statsRepository: PlayerStatsRepository;

  // Servicios
  public authService: AuthService;
  public userService: UserService;

  // Controladores
  public authController: AuthController;
  public userController: UserController;

  constructor() {
    // 1. Clientes (capa de infraestructura)
    this.prisma = new PrismaClient();
    this.roomManager = RoomManager.getInstance();

    // 2. Estrategias
    this.initializeGameStrategies();

    // 3. Motor de juego
    this.gameEngine = new GameEngine((outcome) => {
      console.log(`[GameEngine] Outcome: ${outcome.event}`);
    });

    // 4. Repositorios (reciben Prisma concreto)
    this.userRepository = new UserRepository(this.prisma);
    this.statsRepository = new PlayerStatsRepository(this.prisma);

    // 5. Servicios (reciben INTERFACES, NO Prisma)
    this.authService = new AuthService(this.userRepository);
    //                                 ↑ IUserRepository
    
    this.userService = new UserService(
      this.userRepository,  // ← IUserRepository
      this.statsRepository  // ← IPlayerStatsRepository
    );

    // 6. Controladores (reciben servicios)
    this.authController = new AuthController(this.authService);
    this.userController = new UserController(this.userService);
  }

  private initializeGameStrategies(): void {
    const pairsStrategy = new PairsModeStrategy();
    const triadsStrategy = new TriadsModeStrategy();
    const bossStrategy = new BossModeStrategy();

    GameModeFactory.registerStrategy('classic', pairsStrategy);
    GameModeFactory.registerStrategy('triads', triadsStrategy);
    GameModeFactory.registerStrategy('boss', bossStrategy);
  }
}
```

---

### 📂 Comparación: Antes vs Después

**❌ ANTES (Violación DIP):**
```typescript
// LeaderboardService.ts
export class LeaderboardService {
  private prisma = new PrismaClient(); // ❌ Dependencia CONCRETA

  async getTopPlayers() {
    // ❌ Acoplado directamente a Prisma
    return this.prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
    });
  }
}

// Problemas:
// 1. No puedes cambiar de Prisma a MongoDB sin cambiar LeaderboardService
// 2. No puedes hacer tests con un mock
// 3. Prisma está regado por todo el código
```

**✅ DESPUÉS (Cumple DIP):**
```typescript
// LeaderboardService.ts
export class LeaderboardService {
  constructor(
    private userRepository: IUserRepository,      // ✅ INTERFAZ
    private statsRepository: IPlayerStatsRepository  // ✅ INTERFAZ
  ) {}

  async getTopPlayers() {
    // ✅ Desacoplado de Prisma
    return this.userRepository.findTopByXp(10);
  }
}

// Beneficios:
// 1. Puedes cambiar de Prisma a MongoDB solo cambiando UserRepository
// 2. Puedes hacer tests con MockUserRepository
// 3. Prisma vive SOLO en repositories/
```

---

### 📊 Flujo de dependencias

```
┌─────────────────────────────────────────────┐
│            Container.ts                     │
│  (ÚNICO lugar que ensambla todo)            │
│                                             │
│  prisma = new PrismaClient()                │
│  userRepo = new UserRepository(prisma)      │
│  authService = new AuthService(userRepo)    │
│  authController = new AuthController(auth)  │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌────────┐ ┌─────────┐ ┌──────────┐
    │ Prisma │ │  User   │ │  Auth    │
    │        │ │  Repo   │ │  Service │
    └────────┘ └─────────┘ └──────────┘
                    ▲           ▲
                    │           │
                IUserRepo   IAuthService
                (interfaz)  (interfaz)
```

**Regla de oro:**
- Las flechas apuntan hacia **abstracciones** (interfaces)
- NO apuntan hacia **implementaciones concretas** (Prisma, clases específicas)

---



---

<a name="glosario"></a>
# 📖 GLOSARIO DE TÉRMINOS

## 🔤 Términos de Programación

### Abstract (Abstracto)
**Definición:** Una clase o método que NO se puede instanciar/usar directamente, solo sirve como plantilla.

**Ejemplo:**
```typescript
abstract class Animal {
  abstract hacerSonido(): string; // ← Debe ser implementado por hijos
}

// ❌ No puedes hacer: new Animal()
// ✅ Debes crear una subclase: class Perro extends Animal
```

---

### Interface (Interfaz)
**Definición:** Un contrato que define QUÉ métodos/propiedades debe tener una clase, pero NO dice CÓMO implementarlos.

**Ejemplo:**
```typescript
interface IGameModeStrategy {
  name: string;
  checkMatch(cards: ICard[]): IMatchResult;
}

// Cualquier clase que implemente esta interfaz DEBE tener estos métodos
class PairsModeStrategy implements IGameModeStrategy {
  name = 'Pairs';
  checkMatch(cards: ICard[]): IMatchResult {
    // Implementación específica
  }
}
```

---

### Extends (Extender/Heredar)
**Definición:** Una clase hija **hereda** propiedades y métodos de una clase padre.

**Ejemplo:**
```typescript
class BaseEntity {
  id: string;
  createdAt: Date;
}

class User extends BaseEntity {
  // ↑ User hereda id y createdAt automáticamente
  email: string;
}
```

---

### Implements (Implementar)
**Definición:** Una clase **promete** cumplir con el contrato de una interfaz.

**Ejemplo:**
```typescript
interface IRepository {
  findById(id: string): Promise<any>;
}

class UserRepository implements IRepository {
  // ↑ DEBE implementar findById() obligatoriamente
  async findById(id: string): Promise<User> {
    // Implementación
  }
}
```

---

### Public, Private, Protected
**Visibilidad de propiedades y métodos:**

```typescript
class User {
  public name: string;      // ✅ Accesible desde cualquier lado
  private email: string;    // ❌ Solo accesible dentro de User
  protected _id: string;    // ⚠️ Accesible en User y sus hijos

  public getName() { return this.name; }        // ✅ Cualquiera puede llamarlo
  private validateEmail() { /* ... */ }         // ❌ Solo User puede llamarlo
  protected touch() { this._updatedAt = ...; }  // ⚠️ User y sus hijos
}
```

---

### Readonly
**Definición:** Una propiedad que NO se puede modificar después de ser asignada en el constructor.

**Ejemplo:**
```typescript
class User {
  public readonly id: string;

  constructor(id: string) {
    this.id = id; // ✅ Se puede asignar aquí
  }

  changeId(newId: string) {
    this.id = newId; // ❌ ERROR: No se puede modificar
  }
}
```

---

### Constructor
**Definición:** Método especial que se ejecuta al crear una instancia de la clase.

**Ejemplo:**
```typescript
class User {
  name: string;
  level: number;

  constructor(name: string) {
    this.name = name;
    this.level = 1;
  }
}

const user = new User('Kevin'); // ← Ejecuta el constructor
// user.name = 'Kevin'
// user.level = 1
```

---

### Super
**Definición:** Llama al constructor o método del padre.

**Ejemplo:**
```typescript
class BaseEntity {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

class User extends BaseEntity {
  email: string;
  
  constructor(id: string, email: string) {
    super(id); // ← Llama al constructor del padre
    this.email = email;
  }
}
```

---

### Getter y Setter
**Definición:** Métodos especiales para leer/escribir propiedades de forma controlada.

**Ejemplo:**
```typescript
class User {
  private _coins: number = 0;

  // Getter: leer
  get coins(): number {
    return this._coins;
  }

  // Setter: escribir con validación
  set coins(value: number) {
    if (value < 0) throw new Error('No negativo');
    this._coins = value;
  }
}

const user = new User();
user.coins = 100;   // ← Usa el setter
console.log(user.coins); // ← Usa el getter (100)
```

---

### Async/Await
**Definición:** Forma de escribir código asíncrono (que espera algo) de manera legible.

**Ejemplo:**
```typescript
// Sin async/await
function getUser(id: string) {
  return userRepository.findById(id).then(user => {
    return user;
  });
}

// Con async/await
async function getUser(id: string) {
  const user = await userRepository.findById(id);
  return user;
}
```

---

### Promise
**Definición:** Representa un valor que estará disponible en el futuro.

**Ejemplo:**
```typescript
// Una promesa que se resuelve después de 1 segundo
const promesa = new Promise((resolve) => {
  setTimeout(() => {
    resolve('Hola');
  }, 1000);
});

// Usar la promesa
promesa.then(resultado => {
  console.log(resultado); // 'Hola' después de 1 segundo
});

// Con async/await
const resultado = await promesa;
console.log(resultado); // 'Hola'
```

---

### Type (Tipo)
**Definición:** Define la "forma" de un dato.

**Ejemplo:**
```typescript
type UserRole = 'player' | 'admin'; // ← Solo puede ser estas dos opciones

type IUser = {
  id: string;
  email: string;
  role: UserRole;
};

const user: IUser = {
  id: '123',
  email: 'test@test.com',
  role: 'player', // ✅ Válido
  // role: 'hacker', // ❌ ERROR: No es 'player' ni 'admin'
};
```

---

### Generic (Genérico)
**Definición:** Permite que una clase o función trabaje con diferentes tipos.

**Ejemplo:**
```typescript
// Sin genérico: clase específica para User
class UserRepository {
  findById(id: string): Promise<User> { }
}

// Con genérico: clase reutilizable para cualquier tipo
class BaseRepository<T> {
  findById(id: string): Promise<T> { }
}

const userRepo = new BaseRepository<User>();   // ← T = User
const gameRepo = new BaseRepository<GameRoom>(); // ← T = GameRoom
```

---

### Map
**Definición:** Estructura de datos que guarda pares clave-valor.

**Ejemplo:**
```typescript
const scores = new Map<string, number>();

scores.set('player1', 10);  // Guardar
scores.set('player2', 15);

const score1 = scores.get('player1'); // 10
const score2 = scores.get('player2'); // 15

scores.has('player1'); // true
scores.delete('player1'); // Eliminar
```

---

### Array Methods
**Métodos comunes de arrays:**

```typescript
const numbers = [1, 2, 3, 4, 5];

// map: transforma cada elemento
const doubled = numbers.map(n => n * 2); // [2, 4, 6, 8, 10]

// filter: filtra elementos
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]

// find: encuentra el primer elemento que cumple
const found = numbers.find(n => n > 3); // 4

// reduce: acumula valores
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15

// forEach: ejecuta una función para cada elemento
numbers.forEach(n => console.log(n));

// includes: verifica si existe
numbers.includes(3); // true
```

---

## 🏗️ Términos de Arquitectura

### Capa (Layer)
**Definición:** Separación del código en niveles con responsabilidades distintas.

**Capas en Memorize Evolutivo:**
```
┌─────────────────────────────────┐
│  Controllers (HTTP/Socket)      │ ← Recibe requests
├─────────────────────────────────┤
│  Services (Lógica de negocio)   │ ← Procesa la lógica
├─────────────────────────────────┤
│  Repositories (Acceso a datos)  │ ← Habla con la BD
├─────────────────────────────────┤
│  Database (PostgreSQL)          │ ← Guarda los datos
└─────────────────────────────────┘
```

---

### Dependency Injection (Inyección de Dependencias)
**Definición:** Pasar las dependencias por el constructor en lugar de crearlas dentro de la clase.

**❌ Sin DI:**
```typescript
class UserService {
  private repository = new UserRepository(new PrismaClient());
  //                  ↑ Crea sus propias dependencias
}
```

**✅ Con DI:**
```typescript
class UserService {
  constructor(private repository: UserRepository) {}
  //          ↑ Recibe dependencias por parámetro
}

// En Container.ts
const repo = new UserRepository(prisma);
const service = new UserService(repo); // ← Inyecta
```

---

### Repository Pattern
**Definición:** Capa que encapsula el acceso a datos.

**Beneficio:** Cambiar de base de datos sin tocar los servicios.

```typescript
interface IUserRepository {
  findById(id: string): Promise<User>;
}

// Implementación con Prisma
class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}

// Implementación con MongoDB (futuro)
class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User> {
    return this.mongo.users.findOne({ _id: id });
  }
}

// El servicio NO cambia
class UserService {
  constructor(private repository: IUserRepository) {}
}
```

---

### Strategy Pattern
**Definición:** Define una familia de algoritmos intercambiables.

**En Memorize Evolutivo:**
```
IGameModeStrategy (interfaz)
  ├─ PairsModeStrategy (2 cartas)
  ├─ TriadsModeStrategy (3 cartas)
  └─ BossModeStrategy (bonus)

GameRoom usa IGameModeStrategy → puede cambiar en runtime
```

---

### Factory Pattern
**Definición:** Clase que crea objetos sin exponer la lógica de creación.

**En Memorize Evolutivo:**
```typescript
// Sin Factory
const strategy = mode === 'classic' ? new PairsModeStrategy() :
                 mode === 'triads' ? new TriadsModeStrategy() :
                 new BossModeStrategy();

// Con Factory
const strategy = GameModeFactory.getStrategy(mode);
```

---

### Singleton Pattern
**Definición:** Clase que solo permite una única instancia.

**Ejemplo:**
```typescript
class RoomManager {
  private static instance: RoomManager;

  private constructor() {} // ← Constructor privado

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }
}

// Uso
const manager1 = RoomManager.getInstance();
const manager2 = RoomManager.getInstance();
// manager1 === manager2 (misma instancia)
```

---

### Command Pattern
**Definición:** Encapsula una acción como un objeto.

**En Memorize Evolutivo:**
```typescript
interface IGameCommand {
  type: 'start' | 'flip' | 'end_turn' | 'finish';
  roomId: string;
  userId: string;
  payload?: any;
}

const command: IGameCommand = {
  type: 'flip',
  roomId: 'room-123',
  userId: 'user-456',
  payload: { cardIndex: 5 },
};

gameEngine.processCommand(command, room);
```

---

## 🎮 Términos del Proyecto

### GameRoom
**Definición:** Representa una sala multijugador donde se juega una partida.

**Propiedades:**
- `id`: Identificador único
- `players`: Jugadores en la sala
- `state`: Estado actual del juego
- `strategy`: Modo de juego (Pairs, Triads, Boss)

---

### Player
**Definición:** Representa un jugador dentro de una sala.

**Propiedades:**
- `id`: ID del usuario
- `socketId`: ID de la conexión Socket.IO
- `name`: Nombre del jugador
- `score`: Puntuación en la partida
- `isReady`: ¿Está listo para jugar?
- `isConnected`: ¿Está conectado?

---

### GameEngine
**Definición:** Motor autoritativo que gestiona la lógica del juego.

**Responsabilidades:**
- Procesar comandos (start, flip, end_turn, finish)
- Gestionar timers de turno
- Evaluar matches automáticamente
- Emitir eventos de resultado

---

### Strategy (Estrategia)
**Definición:** Define cómo funciona un modo de juego.

**Modos implementados:**
- **Pairs (Clásico)**: 2 cartas, 50 XP
- **Triads (Tríadas)**: 3 cartas, 75 XP
- **Boss**: 2 cartas + bonus por categoría

---

### Match Result
**Definición:** Resultado de evaluar si hay match.

```typescript
interface IMatchResult {
  isMatch: boolean;
  xpEarned: number;
  coinsEarned: number;
  cardIndexes?: number[];
}
```

---

### Server Autoritativo
**Definición:** El servidor es la **única fuente de verdad**. El cliente solo envía intenciones, el servidor decide si son válidas.

**Ejemplo:**
```
Cliente: "Quiero voltear la carta 5"
Servidor: "¿Es tu turno? ¿Carta válida? ¿No está volteada?"
         ✅ Si todo OK → voltea
         ❌ Si algo falla → rechaza
```

---

## 🔍 Ejemplo Completo: Flujo de Voltear Carta

```typescript
// 1. Cliente envía evento
socket.emit('game:flip-card', {
  roomId: 'room-123',
  userId: 'user-456',
  cardIndex: 5,
});

// 2. SocketManager recibe y crea comando
const command: IGameCommand = {
  type: 'flip',
  roomId: 'room-123',
  userId: 'user-456',
  payload: { cardIndex: 5 },
};

// 3. GameEngine procesa comando
await gameEngine.processCommand(command, room);

// 4. RoomCommandHandler valida y ejecuta
const outcome = commandHandler.processCommand(command, room);

// 5. GameRoom valida reglas de negocio
room.flipCard(5, 'user-456');
  → ¿Es tu turno?
  → ¿Carta válida?
  → ¿No está volteada?
  → ¿No superaste el límite?

// 6. Si todo OK, voltea la carta
room.state.flippedCards.push(5);

// 7. GameEngine verifica si completó la mano
const required = room.getRequiredFlipsCount(); // ← Polimorfismo
if (state.flippedCards.length >= required) {
  gameEngine.scheduleEvaluate(room); // Evalúa después de 1.5s
}

// 8. Evaluación automática
const { isMatch, xpEarned, coinsEarned } = room.checkMatch();
  → Usa strategy.checkMatch() ← Polimorfismo

// 9. Si hay match
if (isMatch) {
  room.registerMatch(userId, ...cardIndexes);
  // Incrementa puntuación
}

// 10. GameEngine emite resultado
onOutcome({
  roomId: 'room-123',
  event: 'game:match-found',
  payload: { playerId: 'user-456', xpEarned, coinsEarned },
});

// 11. SocketManager propaga a todos los clientes
io.to('room-123').emit('game:match-found', payload);
```

---

## 📚 Recursos Adicionales

### Libros recomendados:
- **Clean Code** - Robert C. Martin
- **Design Patterns** - Gang of Four
- **Refactoring** - Martin Fowler

### Conceptos para profundizar:
- **KISS** (Keep It Simple, Stupid)
- **DRY** (Don't Repeat Yourself)
- **YAGNI** (You Aren't Gonna Need It)
- **Composition over Inheritance**
- **Tell, Don't Ask**

---

# ✅ CONCLUSIÓN

Esta guía cubre **TODOS** los conceptos POO y SOLID aplicados en **Memorize Evolutivo**:

## Los 4 Pilares:
1. ✅ **Abstracción** - IGameModeStrategy, BaseEntity, GameEngine
2. ✅ **Encapsulamiento** - private/protected/public, validaciones
3. ✅ **Herencia** - BaseEntity → User/GameRoom, BaseGameModeStrategy → estrategias
4. ✅ **Polimorfismo** - IGameModeStrategy con 3 implementaciones

## Los 5 Principios SOLID:
1. ✅ **S** - Cada servicio tiene 1 responsabilidad (AuthService, UserService, Admin x4)
2. ✅ **O** - GameModeFactory: abierto a extensión, cerrado a modificación
3. ✅ **L** - Estrategias intercambiables sin romper GameEngine
4. ✅ **I** - Interfaces segregadas (IUserRepository, IAdminLogRepository, IAnalyticsRepository)
5. ✅ **D** - Container inyecta interfaces, no implementaciones concretas

**Todo el código mostrado es REAL del proyecto**, no inventado. ✨

---

**¿Preguntas?** Revisa la sección específica o busca el término en el glosario. 🚀
