# 🏗️ Arquitectura POO - Backend Memorize

## 📚 Índice
1. [Conceptos POO Implementados](#conceptos-poo)
2. [Estructura de Capas](#estructura-de-capas)
3. [Patrones de Diseño](#patrones-de-diseño)
4. [Flujo de Datos](#flujo-de-datos)
5. [Explicación Detallada](#explicación-detallada)

---

## 🎯 Conceptos POO Implementados

### 1. **ABSTRACCIÓN**
Ocultamos la complejidad y exponemos solo lo necesario.

**Ejemplo:**
```typescript
// BaseService.ts - Clase abstracta
export abstract class BaseService {
  protected serviceName: string;
  
  // Método abstracto que cada servicio debe implementar
  abstract initialize(): Promise<void>;
}
```

**¿Por qué?**
- Los servicios hijos (AuthService, UserService) solo deben preocuparse por su lógica específica
- Los detalles de logging y manejo de errores están en la clase base

---

### 2. **ENCAPSULACIÓN**
Protegemos los datos y exponemos solo métodos públicos.

**Ejemplo:**
```typescript
// User.model.ts
export class User {
  readonly id: string;        // No se puede modificar
  private bannedUntil: Date;  // Solo accesible internamente
  
  // Método público que usa datos privados
  public isCurrentlyBanned(): boolean {
    return this.isBanned && new Date() < this.bannedUntil;
  }
}
```

**¿Por qué?**
- Los datos sensibles están protegidos
- La lógica de validación está centralizada
- Imposible modificar el ID del usuario por accidente

---

### 3. **HERENCIA**
Reutilizamos código de clases padre.

**Ejemplo:**
```typescript
// BaseRepository es la clase padre
export class UserRepository extends BaseRepository<User, string> {
  // Hereda métodos como log()
  async findById(id: string): Promise<User | null> {
    this.log(`Buscando usuario por ID: ${id}`); // Método heredado
    // ...
  }
}
```

**¿Por qué?**
- Evitamos duplicar código de logging
- Todos los repositorios tienen la misma estructura
- Fácil agregar nuevos repositorios

---

### 4. **POLIMORFISMO**
Diferentes clases implementan el mismo método de manera distinta.

**Ejemplo:**
```typescript
// BaseRepository define findById() como abstracto
abstract class BaseRepository<T> {
  abstract findById(id: string): Promise<T | null>;
}

// Cada repositorio lo implementa a su manera
class UserRepository extends BaseRepository<User> {
  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { id } });
  }
}

class MatchRepository extends BaseRepository<Match> {
  async findById(id: string): Promise<Match | null> {
    return await this.prisma.match.findUnique({ where: { id } });
  }
}
```

**¿Por qué?**
- Podemos tratar todos los repositorios igual
- Cada uno implementa su lógica específica
- Fácil agregar nuevos tipos de repositorios

---

## 🏢 Estructura de Capas

```
┌─────────────────────────────────────┐
│         PRESENTATION LAYER          │
│  (Routes - HTTP Endpoints)          │
│  auth.v2.ts, rooms.v2.ts            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         CONTROLLER LAYER            │
│  (HTTP Handlers)                    │
│  AuthController, RoomController     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          SERVICE LAYER              │
│  (Business Logic)                   │
│  AuthService, GameService           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         REPOSITORY LAYER            │
│  (Data Access)                      │
│  UserRepository, MatchRepository    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│          DATABASE LAYER             │
│  (Prisma + PostgreSQL)              │
└─────────────────────────────────────┘
```

---

## 🎨 Patrones de Diseño Implementados

### 1. **Singleton Pattern**
Una sola instancia global.

**Implementación:**
```typescript
export class RoomManager {
  private static instance: RoomManager;
  
  private constructor() { }  // Constructor privado
  
  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }
}
```

**¿Dónde se usa?**
- `RoomManager` - Solo una instancia maneja todas las salas
- `Container` - Un solo contenedor de dependencias

**¿Por qué?**
- Evita crear múltiples instancias del gestor de salas
- Estado centralizado y consistente

---

### 2. **Dependency Injection (DI)**
Las clases reciben sus dependencias en lugar de crearlas.

**❌ SIN Dependency Injection:**
```typescript
class AuthService {
  constructor() {
    this.userRepository = new UserRepository(new PrismaClient()); // ❌ Acoplado
  }
}
```

**✅ CON Dependency Injection:**
```typescript
class AuthService {
  constructor(userRepository: UserRepository) {  // ✅ Inyectado
    this.userRepository = userRepository;
  }
}
```

**¿Dónde se usa?**
- Todo el sistema usa DI a través del `Container`

**¿Por qué?**
- Facilita testing (podemos inyectar mocks)
- Desacopla componentes
- Facilita cambios de implementación

---

### 3. **Repository Pattern**
Separa la lógica de acceso a datos.

**Implementación:**
```typescript
// En lugar de usar Prisma directamente:
const user = await prisma.user.findUnique({ where: { id } }); // ❌

// Usamos el repositorio:
const user = await userRepository.findById(id); // ✅
```

**¿Por qué?**
- Si cambiamos de Prisma a otro ORM, solo modificamos el repositorio
- La lógica de negocio no conoce la base de datos
- Fácil mockear en tests

---

### 4. **Factory Pattern** (Implícito en Container)
El Container crea todas las instancias.

```typescript
export class Container {
  constructor() {
    this.prisma = new PrismaClient();
    this.userRepository = new UserRepository(this.prisma);
    this.authService = new AuthService(this.userRepository);
    // ...
  }
}
```

**¿Por qué?**
- Centraliza la creación de objetos
- Maneja dependencias complejas automáticamente

---

## 🔄 Flujo de Datos Completo

### Ejemplo: Login de Usuario

```
1. HTTP Request
   POST /api/auth/login { email: "user@example.com" }
   │
   ▼
2. Route (auth.v2.ts)
   router.post('/login', authController.login)
   │
   ▼
3. Controller (AuthController.ts)
   login = async (req, res, next) => {
     const user = await this.authService.loginOrRegister(email);
     res.json(user.toJSON());
   }
   │
   ▼
4. Service (AuthService.ts)
   loginOrRegister(email) {
     let user = await this.userRepository.findByEmail(email);
     if (!user) {
       user = await this.userRepository.create({ email });
     }
     return user;
   }
   │
   ▼
5. Repository (UserRepository.ts)
   findByEmail(email) {
     const prismaUser = await this.prisma.user.findUnique({ where: { email } });
     return this.toDomain(prismaUser);  // Convierte a modelo de dominio
   }
   │
   ▼
6. Database (Prisma + PostgreSQL)
   SELECT * FROM users WHERE email = 'user@example.com'
   │
   ▼
7. Domain Model (User.model.ts)
   new User({ id, email, level, xp, ... })
   │
   ▼
8. HTTP Response
   { id: "123", email: "user@example.com", level: 5, ... }
```

---

## 📖 Explicación Detallada de Cada Componente

### 🗂️ **1. Models/Domain (models/domain/)**

**Propósito:** Representan entidades del negocio con comportamiento.

**User.model.ts:**
```typescript
export class User {
  // Propiedades del usuario
  id: string;
  level: number;
  xp: number;
  
  // Métodos de negocio
  canLevelUp(): boolean {
    return this.xp >= this.getXpForNextLevel();
  }
  
  levelUp(): void {
    this.xp -= this.getXpForNextLevel();
    this.level++;
  }
}
```

**Ventajas:**
- La lógica de "subir de nivel" está en el modelo `User`
- No se repite en servicios o controladores
- Fácil de testear y mantener

---

### 🏪 **2. Repositories (repositories/)**

**Propósito:** Manejan operaciones de base de datos.

**UserRepository.ts:**
```typescript
export class UserRepository extends BaseRepository<User, string> {
  async findById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { id } });
    return prismaUser ? this.toDomain(prismaUser) : null;
  }
  
  private toDomain(prismaUser: PrismaUser): User {
    return new User({ ...prismaUser });
  }
}
```

**Responsabilidades:**
- Convertir entre Prisma y modelos de dominio
- Ejecutar queries
- Logging de operaciones

---

### ⚙️ **3. Services (services/)**

**Propósito:** Contienen la lógica de negocio.

**AuthService.ts:**
```typescript
export class AuthService extends BaseService {
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
}
```

**Responsabilidades:**
- Orquestar operaciones
- Aplicar reglas de negocio
- Validaciones complejas

---

### 🎮 **4. Controllers (controllers/)**

**Propósito:** Manejan requests HTTP.

**AuthController.ts:**
```typescript
export class AuthController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Email inválido' });
        return;
      }
      
      const user = await this.authService.loginOrRegister(email);
      res.json(user.toJSON());
      
    } catch (error) {
      next(error);
    }
  };
}
```

**Responsabilidades:**
- Validar inputs HTTP
- Llamar servicios
- Enviar respuestas HTTP
- Manejo de errores

---

### 🎯 **5. Managers (managers/)**

**Propósito:** Gestores de estado en memoria.

**RoomManager.ts:**
```typescript
export class RoomManager {
  private rooms: Map<string, GameRoom>;
  
  createRoom(data): GameRoom {
    const room = new GameRoom(data);
    this.rooms.set(room.id, room);
    return room;
  }
  
  getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }
}
```

**Responsabilidades:**
- Manejar colecciones en memoria
- Operaciones CRUD sobre entidades
- Limpieza periódica

---

### 📦 **6. Container (Container.ts)**

**Propósito:** Inyección de dependencias centralizada.

```typescript
export class Container {
  constructor() {
    // Crear todas las instancias con sus dependencias
    this.prisma = new PrismaClient();
    this.userRepository = new UserRepository(this.prisma);
    this.authService = new AuthService(this.userRepository);
    this.authController = new AuthController(this.authService);
  }
}
```

**Ventajas:**
- Un solo lugar para crear instancias
- Maneja dependencias automáticamente
- Facilita testing

---

## 🚀 Ventajas de Esta Arquitectura

### ✅ **Testeable**
```typescript
// Podemos testear el servicio con un repositorio mock
const mockRepo = new MockUserRepository();
const authService = new AuthService(mockRepo);
```

### ✅ **Mantenible**
- Cada clase tiene una responsabilidad clara
- Cambios localizados (cambiar BD solo afecta repositorios)

### ✅ **Escalable**
- Fácil agregar nuevas features
- Patrones consistentes en todo el código

### ✅ **Desacoplado**
- Los componentes no se conocen directamente
- Comunicación a través de interfaces

---

## 📝 Comparación: Antes vs Después

### ❌ **ANTES (Sin POO)**
```typescript
// auth.ts
router.post('/login', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const newUser = await prisma.user.create({ data: { email } });
    return res.json(newUser);
  }
  // Lógica duplicada en múltiples rutas
});
```

**Problemas:**
- Lógica mezclada con HTTP
- Difícil de testear
- Código duplicado
- Acoplado a Prisma

### ✅ **DESPUÉS (Con POO)**
```typescript
// Route
router.post('/login', authController.login);

// Controller
login = async (req, res) => {
  const user = await this.authService.loginOrRegister(req.body.email);
  res.json(user.toJSON());
};

// Service
async loginOrRegister(email: string): Promise<User> {
  let user = await this.userRepository.findByEmail(email);
  if (!user) user = await this.userRepository.create({ email });
  return user;
}
```

**Ventajas:**
- Separación clara de responsabilidades
- Cada pieza es testeable
- Código reutilizable
- Desacoplado de la BD

---

## 🎓 Resumen de Principios SOLID

### **S - Single Responsibility Principle**
Cada clase tiene una responsabilidad:
- `UserRepository` → Solo acceso a datos de usuarios
- `AuthService` → Solo lógica de autenticación
- `AuthController` → Solo manejo de requests HTTP

### **O - Open/Closed Principle**
Abierto a extensión, cerrado a modificación:
- Nuevos repositorios extienden `BaseRepository` sin modificarlo

### **L - Liskov Substitution Principle**
Podemos reemplazar una clase por su subclase:
- Cualquier `BaseRepository` puede usarse donde se espera un repositorio

### **I - Interface Segregation Principle**
Interfaces específicas:
- `IUser`, `IPlayer` - Solo los métodos necesarios

### **D - Dependency Inversion Principle**
Dependemos de abstracciones:
- `AuthService` depende de `UserRepository` (abstracción), no de Prisma (implementación)

---

## 🏁 Conclusión

Esta arquitectura POO proporciona:

1. **Código limpio y organizado**
2. **Fácil de entender y mantener**
3. **Preparado para crecer**
4. **Testeable desde el inicio**
5. **Sigue mejores prácticas de la industria**

¡Tu backend ahora es profesional, escalable y robusto! 🚀
