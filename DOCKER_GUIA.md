# 🐳 Guía de Conexión con Docker — Memorize Evolutivo

Esta guía explica cómo levantar la base de datos PostgreSQL (y todo el proyecto) usando **Docker** y **Docker Compose**.

---

## 🚀 Opción 1: Levantar solo PostgreSQL en Docker (Recomendado para desarrollo)

Si quieres programar y ver cambios en tiempo real en frontend y backend:

1. **Abre Docker Desktop** en tu computadora (asegúrate de que el motor de Docker esté activo).
2. En la terminal de la raíz del proyecto, ejecuta:
   ```bash
   docker compose up -d postgres
   ```
3. Verifica que la base de datos esté lista:
   ```bash
   cd backend
   node test-connection.js
   ```
4. Aplica el esquema de Prisma a la base de datos:
   ```bash
   npm run prisma:push
   ```
5. Inicia el backend y frontend en desarrollo:
   ```bash
   # En la raíz:
   npm run dev:all
   ```

---

## 📦 Opción 2: Levantar el proyecto completo en Docker

Para levantar PostgreSQL, el Backend y el Frontend simultáneamente en contenedores:

1. Ejecuta:
   ```bash
   docker compose up --build -d
   ```
2. Accede en tu navegador:
   - **Frontend:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5175](http://localhost:5175)
   - **PostgreSQL:** `localhost:5432`

---

## 🛠️ Comandos útiles

| Comando | Acción |
|---|---|
| `npm run docker:db` | Inicia únicamente el contenedor de PostgreSQL |
| `npm run docker:up` | Inicia todos los contenedores en segundo plano |
| `npm run docker:logs` | Muestra los registros (logs) de los contenedores |
| `npm run docker:down` | Detiene y apaga todos los contenedores |

---

## ⚙️ Configuración de Variables de Entorno

Las variables se configuran en tu archivo `backend/.env` (el cual nunca debe subirse al repositorio):
- **Host:** `localhost`
- **Puerto:** `5432`
- **Usuario:** `postgres`
- **Base de datos:** `memorize`
- **Cadena de conexión de ejemplo:**
  ```env
  DATABASE_URL="postgresql://postgres:<TU_PASSWORD>@localhost:5432/memorize?schema=public"
  ```
