# Plan de Seguridad — Fase 1 (IMPLEMENTADO)

> **Fecha:** Octubre 2026
> **Alcance:** Backend (Express + Socket.IO + Prisma) y Frontend (React) de Memorize Evolutivo.
> **Estado:** Implementado y verificado con pruebas end-to-end.
> **Objetivo:** Cerrar las vulnerabilidades críticas que impedían considerar el proyecto como "profesional": autenticación falsa, suplantación de admin, trampas de puntaje y sockets sin control.

---

## 1. Resumen ejecutivo

Antes de esta fase, el sistema **no tenía autenticación real**:

| # | Vulnerabilidad | Antes | Después |
|---|----------------|-------|---------|
| 1 | Login falso: código fijo `'000000'` mostrado en `alert` (`LoginScreen.tsx:26`) | Cualquiera "iniciaba sesión" con cualquier email | Login real con email + contraseña (bcrypt, 12 rondas) y token JWT |
| 2 | Fallback de frontend que **fabricaba un usuario local** si el login fallaba (`App.tsx:128-140`) | Bypass total de autenticación | Eliminado: la app solo entra con credenciales válidas del backend |
| 3 | Admin suplantable: `requireAdmin` leía `adminId` del **body** (`routes/admin.ts:9`) | Cualquiera con un UUID de admin entraba al panel | JWT firmado; el rol se lee del token, nunca del cliente |
| 4 | Rutas admin GET sin protección (9 endpoints) | Datos de usuarios, emails, analytics públicos | `router.use(requireAdmin)` protege las 24 rutas |
| 5 | El cliente **autodeclaraba** coins/XP/score (`/game-result`, `game:update-score`, `/xp`) | Trampas triviales (XP y monedas infinitas) | Rutas requieren token + límites de rango (clamp); `game:update-score` eliminado |
| 6 | `room:join` por socket no validaba contraseña de salas privadas | Bypass de salas privadas por WebSocket | Validación de contraseña igual que la vía HTTP |
| 7 | Sockets sin autenticación alguna | Cualquiera se conectaba y se identificaba con cualquier `userId` | Handshake JWT obligatorio; identidad SIEMPRE desde el token |
| 8 | Leaderboard público exponía **emails** | PII de todos los jugadores | Solo `username` (dato público del juego) |
| 9 | Errores internos filtrados al cliente (`err.message` de Prisma) | Fuga de detalles de infraestructura | `AppError` tipados; en producción solo mensajes genéricos |
| 10 | Sin rate limiting, sin helmet, CORS con fallback abierto | Fuerza bruta y abuse fáciles | `express-rate-limit` (global + estricto en auth), `helmet`, whitelist CORS |
| 11 | `GameEngine.evaluating` quedaba bloqueado si una evaluación fallaba | Sala "congelada" para siempre | Bloque `try/finally` que siempre libera el flag |

**Además:** validación de entorno fail-fast (el servidor no arranca sin `DATABASE_URL`/`JWT_SECRET`), validación de entrada con zod, paginación acotada (anti-DoS) y script operativo para migrar cuentas antiguas.

---

## 2. Cambios implementados (archivo por archivo)

### 2.1 Nuevos archivos (backend)

| Archivo | Propósito |
|---------|-----------|
| `backend/src/core/JwtUtil.ts` | Firma y verificación de JWT. Exige `JWT_SECRET` (mín. 16 caracteres). El payload solo lleva `userId`, `email`, `role` (nada sensible). |
| `backend/src/core/errors/AppError.ts` | Jerarquía de errores tipados: `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409). |
| `backend/src/core/middleware/auth.ts` | Middlewares `requireAuth`, `requireAdmin` y `requireSelfOrAdmin`. Extiende `Express.Request` con `req.auth`. |
| `backend/src/core/validation/schemas.ts` | Esquemas zod (`registerSchema`, `loginSchema`, `emailSchema`, `passwordSchema`) + helpers `clampLimit`/`clampPage` para paginación segura. |
| `backend/scripts/set-password.ts` | Script de operador para asignar contraseña a cuentas antiguas sin `passwordHash`. Uso: `npm run user:set-password -- <email> <password>`. |

### 2.2 Autenticación (backend)

- **`prisma/schema.prisma`**: campo nuevo `passwordHash String?` en `model User` (aplicado con `prisma db push`; las contraseñas existentes se conservan porque el campo es nullable).
- **`models/domain/User.model.ts`**: `User` ahora maneja `passwordHash` pero **`toJSON()` lo excluye** (`Omit<IUser, 'passwordHash'>`) y se agregó `hasPassword()`.
- **`repositories/UserRepository.ts`**: `create()` persiste `passwordHash`; `toDomain()` lo carga.
- **`services/AuthService.ts`** (reescrito):
  - `register(email, password, username)` → hash con `bcrypt` (12 rondas), error `ConflictError` si el email ya existe.
  - `login(email, password)` → `bcrypt.compare`; respuesta **genérica** "Credenciales inválidas" (evita enumeración de usuarios); baneo responde 403.
  - `issueToken()` firma el JWT con `JwtUtil`.
  - **Eliminado `loginOrRegister`**: antes cualquiera creaba/entraba a una cuenta con solo escribir un email.
- **`controllers/AuthController.ts`**: valida body con zod, responde `{ token, user }` (201 en register).
- **`routes/auth.ts`**: nuevos endpoints `POST /api/auth/register` y `POST /api/auth/login` con *rate limit* estricto (20 intentos/15 min por IP). `validate` y `is-admin` requieren token.
- **`index.ts`**: `validateEnv()` falla al arrancar si faltan `DATABASE_URL` o `JWT_SECRET` (o si el secret es corto).

### 2.3 Autorización y anti-trampas (backend)

- **`routes/admin.ts`**:
  - `router.use(requireAdmin)` protege **todas** las rutas (antes los GET eran públicos).
  - `adminId` ya no se lee del body: los logs de auditoría usan `req.auth.userId` (`getAdminId()`).
  - Paginación con `clampPage`/`clampLimit` (máx. 100, evita `take: 0` y DoS).
- **`routes/users.ts`**:
  - `ban`, `unban`, `xp`, `currency`, `reward`, `banned` → `requireAdmin`.
  - `game-result` → `requireSelfOrAdmin` (solo el dueño del perfil o un admin).
- **`controllers/UserController.ts`**: `recordGame` valida tipos y **limita (clamp)** los valores: `score ≤ 100000`, `xpEarned ≤ 500`, `coinsEarned ≤ 2000`, `perfectMatches ≤ matches`, etc.
- **`routes/matches.ts`**: requiere token; `userId` se toma del token (ignora el body); modo en whitelist; valores con clamp; estadísticas con `upsert` atómico y `GREATEST()` en SQL para `bestScore`/`maxCombo` (evita el read-modify-write con condiciones de carrera). Se eliminó la fórmula de nivel inconsistente (queda pendiente unificar, ver §6).
- **`routes/leaderboard.ts`**: eliminado `email` de las 5 respuestas (global, modo, weekly, monthly y por usuario); límites con `clampLimit`.

### 2.4 Socket.IO (backend)

- **`socket/SocketManager.ts`**:
  - `io.use(...)`: handshake exige `socket.handshake.auth.token` válido; si no, la conexión se rechaza con "Token requerido/inválido".
  - `room:join` valida contraseña de salas privadas (`room.validatePassword`), igual que la vía HTTP.
  - **La identidad (`userId`) ya no se acepta del cliente** en `room:join`, `room:leave`, `room:ready`, `game:start`, `game:flip-card` ni `room:reconnect`: siempre `socket.data.user.userId` (del JWT).
  - **Eliminado `game:update-score`**: el puntaje lo calcula únicamente el `GameEngine` (servidor autoritativo).

### 2.5 Robustez (backend)

- **`engine/GameEngine.ts`**: `scheduleEvaluate` envuelto en `try/finally`; el flag `evaluating` siempre se libera (antes, un error dejaba la sala sin evaluar manos para siempre).
- **`index.ts`**: `helmet()`, límite de body `100kb`, rate limit global (300 req/15 min) y estricto en auth, CORS con whitelist (`FRONTEND_URL` admite lista separada por comas; en desarrollo se agregan localhost), 404 JSON para `/api/*`, y manejador de errores que **solo expone mensajes de `AppError`** (en producción, todo lo demás es "Error interno del servidor").

### 2.6 Frontend

| Archivo | Cambio |
|---------|--------|
| `src/lib/api.ts` (nuevo) | Cliente HTTP centralizado: inyecta `Authorization: Bearer`, normaliza errores (`ApiError`), y gestiona la sesión (`saveSession`, `getStoredUser`, `clearSession`). |
| `src/lib/socket.ts` | `autoConnect: false`; `connectSocket()` conecta con el token tras el login; `disconnectSocket()` limpia al salir. |
| `src/components/LoginScreen.tsx` | Reescrito: email + contraseña, sin código falso ni `alert`; muestra errores del servidor y estado de carga. |
| `src/components/RegisterScreen.tsx` | Reescrito: envía `username`, `email` y contraseña (mín. 8) al backend; la contraseña **ya no se descarta**. |
| `src/App.tsx` | Eliminado el fallback que fabricaba usuarios; guarda/restaura sesión (token + usuario) y valida el token contra `/api/auth/validate/:id` al recargar; `logout` limpia sesión y socket. |
| `src/components/AdminPanel.tsx` | Las 15 llamadas `fetch` migradas a `apiFetch` (token automático); ya no envía `adminId` en los bodies. |

---

## 3. Pruebas de verificación (ejecutadas)

Servidor: `npm run build && node dist/index.js` (backend), base `memorize` local.

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | `POST /api/auth/register` | `201` + token; `passwordHash` **no** aparece en la respuesta |
| 2 | Login con contraseña incorrecta | `401 Credenciales inválidas` |
| 3 | `GET /api/admin/users` sin token | `401` |
| 4 | `GET /api/admin/users` con token de jugador | `403` |
| 5 | `POST /api/users/:id/game-result` sin token | `401` |
| 6 | `game-result` sobre **otro** usuario (IDOR) | `403` |
| 7 | `game-result` propio con `xpEarned: 99999` | Clamp aplicado (recibió ≤500 XP) |
| 8 | `POST /api/users/:id/xp` con token propio | `403` (ahora es solo-admin) |
| 9 | `GET /api/leaderboard` | Sin campo `email` |
| 10 | 22 intentos de login fallidos | Bloqueo `429` (rate limit) |
| 11 | Socket con token inválido / sin token | Rechazado; con token válido → conecta |

Comandos de ejemplo:

```bash
# Registro
curl -X POST http://localhost:5175/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"Segura12345","username":"hero"}'

# Login
curl -X POST http://localhost:5175/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tu@email.com","password":"Segura12345"}'

# Ruta protegida (usar el token del login)
curl http://localhost:5175/api/admin/users -H "Authorization: Bearer <TOKEN>"
```

---

## 4. Operación: cuentas antiguas y secretos

### Cuentas creadas antes de esta fase (sin contraseña)

Las cuentas antiguas no tienen `passwordHash` y **no pueden iniciar sesión** (por diseño: no se permite "reclamar" cuentas ajenas). Para reactivar una cuenta (por ejemplo, tu admin de pruebas):

```bash
cd backend
npm run user:set-password -- admin@tudominio.com "NuevaClaveSegura123"
```

### Rotación de secretos

- `JWT_SECRET` en `backend/.env` debe ser largo y aleatorio:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Nunca commitear `backend/.env` (ya está en `.gitignore` ✓).
- En Render (`render.yaml`) aún hay que declarar `DATABASE_URL` y `JWT_SECRET` en el dashboard o en el blueprint; si faltan, el backend **no arranca** (fail-fast intencional).

---

## 5. Flujo nuevo de autenticación (para el equipo)

```
Registro:  Frontend → POST /api/auth/register {email, password, username}
           ← 201 { token, user }        (password → bcrypt en BD)

Login:     Frontend → POST /api/auth/login {email, password}
           ← 200 { token, user }        (token JWT, expira en 7 días)

Sesión:    localStorage: memorize_token + memorize_user
           Recarga → GET /api/auth/validate/:id (con Bearer) → decide entrar o limpiar sesión

Sockets:   conecta con handshake.auth.token; el server deriva el userId del JWT

Rutas admin: el token debe llevar role "admin"; el body jamás decide el rol
```

---

## 6. Pendientes (fases posteriores)

Estos puntos quedaron **fuera del alcance** de la Fase 1 y se documentan para las siguientes fases:

1. **Puntaje verdaderamente autoritativo en partidas single-player**: hoy el cliente reporta `score` y el servidor lo limita, pero no lo recalcula. Fase 3 debería mover la validación de partidas al servidor (o firmar sesiones de juego).
2. **`POST /api/rooms` y compañía sin autenticación**: la REST de salas (`/api/rooms/*`) aún no exige token. Añadir `requireAuth` + validar que quien inicia/cierra la sala sea el host.
3. **Refresh tokens / expiración corta**: hoy el token dura 7 días sin revocación. Considerar refresh tokens y blacklist.
4. **Migraciones formales de Prisma**: seguir usando `db push` no es reproducible. Ver Fase 2 del plan general (`.gitignore` ignora `prisma/migrations/`, hay que quitarlo).
5. **Tests automatizados**: todo lo verificado aquí fue manual. Fase 4: Jest/Vitest + Supertest con estos 11 casos como suite de regresión.
6. **Unificar fórmulas de nivel**: `User.addXp()` (bucle) y la fórmula `sqrt` eliminada de `matches.ts` eran incompatibles; elegir una sola.
7. **Contraseñas en memoria de salas**: `GameRoom.password` se guarda en texto plano en memoria (efímero). Aceptable para salas de juego, pero puede hashearse si se persisten.
8. **`strict: true` en TypeScript** y reducción de `any` (127 en backend) — Fase 4.

---

## 7. Dependencias añadidas

**Backend** (`backend/package.json`):

| Paquete | Uso |
|---------|-----|
| `bcryptjs` | Hash de contraseñas (12 rondas) |
| `jsonwebtoken` | Firma/verificación de JWT |
| `zod` | Validación de entrada |
| `helmet` | Cabeceras HTTP de seguridad |
| `express-rate-limit` | Rate limiting (global y en auth) |

---

*Documento generado como parte de la Fase 1 del proceso de profesionalización. Las Fases 2 (limpieza del repositorio), 3 (refactor frontend/arquitectura) y 4 (calidad, tests, CI) están descritas en el plan general.*
