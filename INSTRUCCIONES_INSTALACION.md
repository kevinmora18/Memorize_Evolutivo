# INSTRUCCIONES DE INSTALACIÓN - MEMORIZE EVOLUTIVO

**Fecha:** 1 de Junio de 2026  
**Estado:** Backend implementado, listo para configurar base de datos

---

## 📋 ESTADO ACTUAL

✅ **Backend implementado al 100%**
- 40+ endpoints REST
- 20+ eventos Socket.IO
- 7 tablas de base de datos
- Sistema completo de autenticación
- Sistema de progresión
- Panel de administración

✅ **Frontend implementado al 100%**
- 40+ componentes
- 6 modos de juego
- Sistema de personalización
- Panel de administración

✅ **Dependencias instaladas**
- Backend: ✅ Instalado
- Frontend: ✅ Instalado
- Prisma Client: ✅ Generado

⚠️ **Pendiente: Configurar PostgreSQL**

---

## 🔧 PASO 1: INSTALAR POSTGRESQL

### Opción A: Descargar desde el sitio oficial

1. Ir a: https://www.postgresql.org/download/windows/
2. Descargar PostgreSQL 14 o superior
3. Ejecutar el instalador
4. Durante la instalación:
   - **Puerto:** 5432 (por defecto)
   - **Contraseña del superusuario (postgres):** `<TU_PASSWORD_LOCAL>` (úsala solo en local, no la subas al repo)
   - **Locale:** Spanish, Spain
5. Completar la instalación

### Opción B: Usar Chocolatey (si lo tienes instalado)

```powershell
choco install postgresql
```

### Opción C: Usar Scoop (si lo tienes instalado)

```powershell
scoop install postgresql
```

---

## 🗄️ PASO 2: CONFIGURAR BASE DE DATOS

### 2.1 Verificar que PostgreSQL está corriendo

**Opción 1: Servicios de Windows**
1. Presionar `Win + R`
2. Escribir `services.msc`
3. Buscar "postgresql-x64-14" o similar
4. Verificar que el estado sea "En ejecución"
5. Si no está corriendo, hacer clic derecho → Iniciar

**Opción 2: Línea de comandos**
```powershell
# Verificar servicio
Get-Service -Name postgresql*

# Iniciar servicio si está detenido
Start-Service -Name postgresql-x64-14
```

### 2.2 Crear la base de datos

**Opción 1: pgAdmin (Interfaz gráfica)**
1. Abrir pgAdmin (instalado con PostgreSQL)
2. Conectar al servidor local
3. Clic derecho en "Databases" → Create → Database
4. Nombre: `memorize`
5. Owner: `postgres`
6. Guardar

**Opción 2: Línea de comandos**

Primero, agregar PostgreSQL al PATH:
```powershell
# Agregar al PATH (ajustar versión si es necesario)
$env:Path += ";C:\Program Files\PostgreSQL\14\bin"
```

Luego crear la base de datos:
```powershell
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE memorize;
\l  # Listar bases de datos para verificar
\q  # Salir
```

### 2.3 Verificar la conexión

El archivo `backend/.env` (local, no se sube al repo) ya está configurado:
```
DATABASE_URL="postgresql://postgres:<TU_PASSWORD_LOCAL>@localhost:5432/memorize"
PORT=5175
```

**Si tu contraseña de PostgreSQL es diferente:**
1. Abrir `backend\.env`
2. Cambiar `<TU_PASSWORD_LOCAL>` por tu contraseña
3. Guardar el archivo

---

## 🚀 PASO 3: EJECUTAR MIGRACIONES

Una vez que PostgreSQL esté corriendo y la base de datos creada:

```powershell
# Navegar al backend
cd backend

# Sincronizar el schema con la base de datos
npx prisma db push

# Verificar que las tablas se crearon correctamente
npx prisma studio
```

Esto creará las 7 tablas:
- ✅ users
- ✅ player_stats
- ✅ inventories
- ✅ matches
- ✅ announcements
- ✅ admin_logs
- ✅ promotions

---

## 🎮 PASO 4: INICIAR EL SISTEMA

### Terminal 1: Backend
```powershell
cd backend
npm run dev
```

Deberías ver:
```
🚀 Server running on port 5175
📡 Socket.IO ready
🗄️  Database connected
```

### Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```

Deberías ver:
```
VITE v5.4.2  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## ✅ PASO 5: PROBAR EL SISTEMA

### 5.1 Acceder a la aplicación
1. Abrir navegador en: `http://localhost:5173`
2. Deberías ver la pantalla de login

### 5.2 Crear cuenta
1. Ingresar un email (ejemplo: `admin@test.com`)
2. El sistema creará automáticamente:
   - Usuario con 500 monedas y 50 gemas
   - Estadísticas iniciales
   - Inventario con items básicos

### 5.3 Probar modos de juego
- ✅ Modo Clásico (10 niveles)
- ✅ Modo Infinito
- ✅ Modo Desafío
- ✅ Boss Fight
- ✅ Multijugador (abrir en 2 pestañas)
- ✅ IA Friends

### 5.4 Probar panel de administración

**Cambiar rol a admin:**

**Opción 1: Prisma Studio**
```powershell
cd backend
npx prisma studio
```
1. Abrir `http://localhost:5555`
2. Ir a tabla "User"
3. Buscar tu usuario
4. Cambiar campo `role` de `player` a `admin`
5. Guardar
6. Recargar la aplicación

**Opción 2: SQL directo**
```sql
-- Conectar a la base de datos
psql -U postgres -d memorize

-- Cambiar rol
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';

-- Verificar
SELECT id, email, role FROM users;
```

**Acceder al panel:**
1. En el lobby, hacer clic en "Panel Admin"
2. Deberías ver 7 pestañas:
   - Dashboard
   - Usuarios
   - Partidas
   - Baneos
   - Anuncios
   - Promociones
   - Analíticas

---

## 🔍 VERIFICACIÓN DE FUNCIONALIDADES

### Backend
- [ ] Servidor corriendo en puerto 5175
- [ ] Endpoint `/health` responde OK
- [ ] Login/registro funciona
- [ ] Endpoints de usuarios funcionan
- [ ] Endpoints de partidas funcionan
- [ ] Endpoints de salas funcionan
- [ ] Endpoints de admin funcionan
- [ ] Socket.IO conectado

### Frontend
- [ ] Aplicación carga en puerto 5173
- [ ] Login funciona
- [ ] Lobby se muestra correctamente
- [ ] Modos de juego funcionan
- [ ] Sistema de progresión funciona
- [ ] Tienda funciona
- [ ] Rankings funcionan
- [ ] Panel admin funciona (con rol admin)

### Base de Datos
- [ ] PostgreSQL corriendo
- [ ] Base de datos `memorize` creada
- [ ] 7 tablas creadas
- [ ] Datos se guardan correctamente
- [ ] Relaciones funcionan

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to database"
**Solución:**
1. Verificar que PostgreSQL esté corriendo
2. Verificar que la base de datos `memorize` exista
3. Verificar credenciales en `backend\.env`
4. Verificar puerto 5432 no esté bloqueado

### Error: "Port 5175 already in use"
**Solución:**
```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :5175

# Matar el proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar el puerto en backend\.env
PORT=5176
```

### Error: "Port 5173 already in use"
**Solución:**
```powershell
# Encontrar proceso usando el puerto
netstat -ano | findstr :5173

# Matar el proceso
taskkill /PID <PID> /F
```

### Error: "Prisma Client not generated"
**Solución:**
```powershell
cd backend
npx prisma generate
```

### Error: "Module not found"
**Solución:**
```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Error: "CORS policy"
**Solución:**
Verificar que el frontend esté en `http://localhost:5173` y el backend en `http://localhost:5175`. El CORS ya está configurado para estos puertos.

---

## 📊 ENDPOINTS DISPONIBLES

### Autenticación
- `POST /api/auth/login` - Login/registro

### Usuarios
- `GET /api/users/:userId` - Obtener perfil
- `PUT /api/users/:userId/stats` - Actualizar estadísticas
- `GET /api/users/:userId/inventory` - Obtener inventario
- `PUT /api/users/:userId/inventory` - Actualizar inventario
- `GET /api/users/:userId/matches` - Historial
- `PUT /api/users/:userId/xp` - Agregar XP
- `PUT /api/users/:userId/currency` - Actualizar monedas

### Partidas
- `POST /api/matches` - Guardar resultado

### Salas
- `GET /api/rooms` - Listar salas
- `POST /api/rooms` - Crear sala
- `GET /api/rooms/:roomId` - Obtener sala
- `POST /api/rooms/:roomId/join` - Unirse
- `PUT /api/rooms/:roomId/start` - Iniciar
- `POST /api/rooms/:roomId/leave` - Salir
- `PUT /api/rooms/:roomId/team` - Cambiar equipo
- `DELETE /api/rooms/:roomId` - Eliminar

### Leaderboard
- `GET /api/leaderboard/global` - Ranking global
- `GET /api/leaderboard/mode/:mode` - Por modo
- `GET /api/leaderboard/weekly` - Semanal
- `GET /api/leaderboard/monthly` - Mensual
- `GET /api/leaderboard/user/:userId` - Posición

### Admin (requiere rol admin)
- `GET /api/admin/users` - Listar usuarios
- `GET /api/admin/users/:id` - Detalles
- `PUT /api/admin/users/:id/role` - Cambiar rol
- `PUT /api/admin/users/:id/currency` - Modificar monedas
- `PUT /api/admin/users/:id/ban` - Banear
- `PUT /api/admin/users/:id/unban` - Desbanear
- `DELETE /api/admin/users/:id` - Eliminar
- `GET /api/admin/stats` - Estadísticas
- `GET /api/admin/matches` - Listar partidas
- `GET /api/admin/announcements` - Anuncios
- `POST /api/admin/announcements` - Crear anuncio
- `GET /api/admin/promotions` - Promociones
- `POST /api/admin/promotions` - Crear promoción
- `GET /api/admin/analytics` - Analíticas
- `POST /api/admin/give-currency-all` - Dar monedas a todos
- `GET /api/admin/logs` - Logs

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE LA INSTALACIÓN

### 1. Crear usuario administrador
```sql
UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
```

### 2. Crear anuncios de bienvenida
Desde el panel admin → Anuncios → Crear nuevo

### 3. Configurar promociones
Desde el panel admin → Promociones → Crear nueva

### 4. Probar multijugador
Abrir 2 pestañas del navegador y crear una sala

### 5. Verificar sistema de progresión
Jugar varias partidas y verificar que XP, nivel y monedas aumenten

### 6. Probar todos los modos de juego
- Clásico (10 niveles)
- Infinito
- Desafío
- Boss Fight (5 jefes)
- Multijugador
- IA Friends

---

## 📝 NOTAS IMPORTANTES

1. **Primera vez:** El sistema creará automáticamente las tablas en la base de datos
2. **Usuarios:** Se crean automáticamente al hacer login por primera vez
3. **Roles:** Por defecto todos son `player`, cambiar manualmente a `admin` si es necesario
4. **Monedas iniciales:** 500 monedas y 50 gemas
5. **Items iniciales:** Pack frutas, skin classic, marco basic, tablero default
6. **XP inicial:** 0 XP, nivel 1, rango Novato
7. **Socket.IO:** Se conecta automáticamente al iniciar el frontend
8. **Reconexión:** Socket.IO reconecta automáticamente si se pierde la conexión

---

## 🔗 RECURSOS ÚTILES

- **Prisma Studio:** `http://localhost:5555` (ejecutar `npx prisma studio`)
- **Backend API:** `http://localhost:5175`
- **Frontend:** `http://localhost:5173`
- **Health Check:** `http://localhost:5175/health`
- **Documentación Prisma:** https://www.prisma.io/docs
- **Documentación Socket.IO:** https://socket.io/docs/v4/
- **Documentación Express:** https://expressjs.com/

---

## ✅ CHECKLIST FINAL

Antes de considerar el sistema completamente funcional:

### Instalación
- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `memorize` creada
- [ ] Dependencias backend instaladas
- [ ] Dependencias frontend instaladas
- [ ] Prisma Client generado
- [ ] Migraciones ejecutadas

### Configuración
- [ ] Archivo `.env` configurado correctamente
- [ ] Puerto 5432 (PostgreSQL) disponible
- [ ] Puerto 5175 (Backend) disponible
- [ ] Puerto 5173 (Frontend) disponible

### Funcionalidad
- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Login/registro funciona
- [ ] Modos de juego funcionan
- [ ] Sistema de progresión funciona
- [ ] Multijugador funciona
- [ ] Panel admin funciona
- [ ] Base de datos guarda datos correctamente

---

**¡Listo para jugar! 🎮**

Una vez completados todos los pasos, el sistema estará 100% funcional según el SRS documentado.

---

**Última actualización:** 1 de Junio de 2026  
**Autor:** Equipo Memorize Evolutivo  
**Versión:** 1.0.0
