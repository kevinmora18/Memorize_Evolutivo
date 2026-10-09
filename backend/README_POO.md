# 🎯 Backend Memorize - Arquitectura POO

## 📋 Resumen Ejecutivo

Tu backend ha sido refactorizado usando **Programación Orientada a Objetos (POO)** con patrones de diseño profesionales. Ahora tienes una arquitectura **escalable, testeable y mantenible**.

---

## 🗂️ Estructura del Proyecto

```
backend/src/
├── 📁 core/                    # Clases base abstractas
│   ├── BaseService.ts          # Clase base para servicios
│   └── BaseRepository.ts       # Clase base para repositorios
│
├── 📁 models/domain/           # Modelos de dominio (entidades con lógica)
│   ├── User.model.ts           # Usuario con métodos de negocio
│   ├── PlayerStats.model.ts    # Estadísticas con cálculos
│   └── GameRoom.model.ts       # Sala de juego con gestión
│
├── 📁 repositories/            # Acceso a datos (Prisma)
│   ├── UserRepository.ts       # CRUD de usuarios
│   └── PlayerStatsRepository.ts # CRUD de estadísticas
│
├── 📁 services/                # Lógica de negocio
│   ├── AuthService.ts          # Autenticación
│   └── UserService.ts          # Gestión de usuarios
│
├── 📁 controllers/             # Manejo de peticiones HTTP
│   ├── AuthController.ts       # Endpoints de auth
│   ├── UserController.ts       # Endpoints de users
│   └── RoomController.ts       # Endpoints de rooms
│
├── 📁 managers/                # Gestores de estado en memoria
│   └── RoomManager.ts          # Gestión de salas (Singleton)
│
├── 📁 socket/                  # WebSocket handlers
│   ├── SocketManager.ts        # Gestor de Socket.IO (POO)
│   └── handlers.ts             # Handlers originales
│
├── 📁 routes/                  # Definición de rutas
│   ├── auth.v2.ts              # Rutas de autenticación (POO)
│   ├── users.v2.ts             # Rutas de usuarios (POO)
│   ├── rooms.v2.ts             # Rutas de salas (POO)
│   └── [originales].ts         # Rutas antiguas (mantener compatibilidad)
│
├── 📄 Container.ts             # Dependency Injection Container
├── 📄 index.ts                 # Servidor original
└── 📄 index.v2.ts              # Servidor con arquitectura POO
```

---

## 🎨 Conceptos POO Implementados

### 1️⃣ **ABSTRACCIÓN**
Ocultamos complejidad exponiendo solo lo necesario.

```typescript
// Clase abstracta define la estructura
abstract class BaseService {
  abstract initialize(): Promise<void>;
}

// Cada servicio implementa su inicialización
class AuthService extends BaseService {
  async initialize() {
    // Lógica específica
  }
}
```

**Beneficio:** Estructura consistente en todos los servicios.

---

### 2️⃣ **ENCAPSULACIÓN**
Protegemos datos y exponemos métodos seguros.

```typescript
class User {
  readonly id: string;        // No modificable
  private xp: number;         // Acceso controlado
  
  // Método público seguro
  addXp(amount: number): number {
    this.xp += amount;
    return this.checkLevelUp();
  }
}
```

**Beneficio:** Imposible modificar datos de forma insegura.

---

### 3️⃣ **HERENCIA**
Reutilizamos código de clases padre.

```typescript
// Todos los repositorios heredan funcionalidad común
class UserRepository extends BaseRepository<User> {
  // Ya tiene métodos: log(), findById(), create(), etc.
}
```

**Beneficio:** Evitamos duplicar código.

---

### 4️⃣ **POLIMORFISMO**
Diferentes clases implementan el mismo método de manera distinta.

```typescript
abstract class BaseRepository {
  abstract findById(id: string): Promise<T>;
}

class UserRepository extends BaseRepository<User> {
  async findById(id: string) {
    return await this.prisma.user.findUnique({ where: { id } });
  }
}

class StatsRepository extends BaseRepository<Stats> {
  async findById(id: string) {
    return await this.prisma.playerStats.findUnique({ where: { id } });
  }
}
```

**Beneficio:** Misma interfaz, diferentes implementaciones.

---

## 🏗️ Patrones de Diseño

### 🔷 **Singleton Pattern**
Una sola instancia global.

```typescript
class RoomManager {
  private static instance: RoomManager;
  
  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }
}
```

**Usado en:** `RoomManager`, `Container`

---

### 🔷 **Dependency Injection**
Las clases reciben sus dependencias.

```typescript
class UserService {
  constructor(
    userRepo: UserRepository,      // ✅ Inyectado
    statsRepo: PlayerStatsRepository // ✅ Inyectado
  ) { }
}

// En lugar de:
class UserService {
  constructor() {
    this.userRepo = new UserRepository(); // ❌ Acoplado
  }
}
```

**Beneficio:** Fácil de testear y cambiar implementaciones.

---

### 🔷 **Repository Pattern**
Separa lógica de datos del resto.

```typescript
// Antes: Prisma directamente en rutas
const user = await prisma.user.findUnique({ where: { id } });

// Después: Abstracción con repositorio
const user = await userRepository.findById(id);
```

**Beneficio:** Si cambias de BD, solo modificas repositorios.

---

### 🔷 **Service Layer Pattern**
Lógica de negocio centralizada.

```typescript
// Lógica compleja en el servicio
class UserService {
  async recordGamePlayed(userId, gameData) {
    // 1. Obtener datos
    // 2. Aplicar lógica de negocio
    // 3. Actualizar múltiples entidades
    // 4. Devolver resultado
  }
}

// Controlador simple
class UserController {
  recordGame = async (req, res) => {
    const result = await this.userService.recordGamePlayed(userId, data);
    res.json(result);
  }
}
```

**Beneficio:** Controladores limpios, lógica reutilizable.

---

## 📊 Flujo de Datos (Capas)

```
┌─────────────────┐
│   HTTP Request  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Route         │  ← Define endpoint
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Controller    │  ← Valida HTTP, maneja respuestas
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Service       │  ← Lógica de negocio
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Repository    │  ← Acceso a datos
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Domain Model  │  ← Entidad con comportamiento
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │  ← PostgreSQL
└─────────────────┘
```

---

## 🚀 Cómo Usar

### Opción 1: Usar servidor nuevo (recomendado)

```bash
# Modificar package.json
"scripts": {
  "dev": "ts-node-dev --respawn --transpile-only src/index.v2.ts",
  "start": "node dist/index.v2.js"
}

# Ejecutar
npm run dev
```

### Opción 2: Migración gradual

Mantén ambos servidores y migra endpoints paulatinamente:

```typescript
// index.ts (original)
app.use('/api/auth', oldAuthRoutes);      // Rutas antiguas
app.use('/api/v2/auth', newAuthRoutes);   // Rutas nuevas POO
```

---

## 📝 Comparación Antes/Después

### ❌ ANTES (Sin POO)

```typescript
// routes/auth.ts
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      const newUser = await prisma.user.create({
        data: { email, username: email.split('@')[0], level: 1 }
      });
      return res.json(newUser);
    }
    
    if (user.isBanned) {
      if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
        return res.status(403).json({ error: 'Usuario baneado' });
      }
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});
```

**Problemas:**
- ❌ Todo mezclado
- ❌ Difícil de testear
- ❌ Código duplicado
- ❌ Acoplado a Prisma
- ❌ Lógica de negocio en ruta

---

### ✅ DESPUÉS (Con POO)

```typescript
// routes/auth.v2.ts
router.post('/login', authController.login);

// controllers/AuthController.ts
class AuthController {
  login = async (req, res, next) => {
    const { email } = req.body;
    const user = await this.authService.loginOrRegister(email);
    res.json(user.toJSON());
  }
}

// services/AuthService.ts
class AuthService {
  async loginOrRegister(email: string): Promise<User> {
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
}

// repositories/UserRepository.ts
class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { email } });
    return prismaUser ? this.toDomain(prismaUser) : null;
  }
}

// models/User.model.ts
class User {
  isCurrentlyBanned(): boolean {
    if (!this.isBanned) return false;
    return this.bannedUntil ? new Date() < this.bannedUntil : true;
  }
}
```

**Ventajas:**
- ✅ Separación clara de responsabilidades
- ✅ Fácil de testear cada pieza
- ✅ Código reutilizable
- ✅ Desacoplado de la BD
- ✅ Lógica en el lugar correcto

---

## 🧪 Testing

Ahora puedes testear fácilmente:

```typescript
// Test de servicio con mock
const mockRepo = {
  findByEmail: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue(newUser)
};

const authService = new AuthService(mockRepo);
const result = await authService.loginOrRegister('test@example.com');

expect(mockRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
expect(result.email).toBe('test@example.com');
```

---

## 📚 Documentación Adicional

- 📖 **[ARQUITECTURA_POO.md](./ARQUITECTURA_POO.md)** - Explicación detallada de conceptos
- 📐 **[DIAGRAMA_ARQUITECTURA.md](./DIAGRAMA_ARQUITECTURA.md)** - Diagramas visuales
- 📝 **[EJEMPLO_USO_POO.md](./EJEMPLO_USO_POO.md)** - Ejemplos prácticos de uso

---

## ✅ Ventajas de Esta Arquitectura

### 🎯 **Mantenibilidad**
- Cada clase tiene una responsabilidad clara
- Fácil localizar y arreglar bugs
- Cambios localizados no afectan otras partes

### 🧪 **Testabilidad**
- Puedes testear cada capa independientemente
- Fácil crear mocks para dependencias
- Tests rápidos y confiables

### 📈 **Escalabilidad**
- Agregar features es simple (ver ejemplos)
- Patrones consistentes en todo el código
- Fácil agregar nuevos miembros al equipo

### 🔧 **Flexibilidad**
- Cambiar BD solo afecta repositorios
- Cambiar lógica solo afecta servicios
- Fácil extender funcionalidad

### 🏗️ **Profesional**
- Sigue mejores prácticas de la industria
- Principios SOLID aplicados
- Patrones de diseño reconocidos

---

## 🎓 Principios SOLID

✅ **S** - Single Responsibility: Cada clase hace una cosa  
✅ **O** - Open/Closed: Abierto a extensión, cerrado a modificación  
✅ **L** - Liskov Substitution: Subclases reemplazan a clases padre  
✅ **I** - Interface Segregation: Interfaces específicas  
✅ **D** - Dependency Inversion: Depender de abstracciones  

---

## 🚦 Próximos Pasos

1. **Revisar documentación** en los archivos `.md`
2. **Testear endpoints** con Postman o similar
3. **Migrar rutas antiguas** a la nueva arquitectura
4. **Agregar tests unitarios** usando los ejemplos
5. **Extender funcionalidad** siguiendo los patrones

---

## 💡 Tips

- Usa `Container.getInstance()` para acceder a cualquier componente
- Sigue el patrón de capas para nuevos features
- Mantén los controladores delgados (thin controllers)
- Pon lógica de negocio en servicios y modelos
- Usa los modelos de dominio para cálculos y validaciones

---

## 🎉 Conclusión

Tu backend ahora es:
- 🏗️ **Bien estructurado** - Arquitectura en capas
- 🧩 **Modular** - Piezas independientes y reutilizables
- 🧪 **Testeable** - Fácil escribir tests
- 📈 **Escalable** - Listo para crecer
- 💼 **Profesional** - Estándares de la industria

¡Felicidades! Ahora tienes un backend de nivel empresarial 🚀

---

**Autor:** Arquitectura POO implementada  
**Fecha:** 2026  
**Versión:** 2.0.0
