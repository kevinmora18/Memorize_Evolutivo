# 🚀 Guía de Despliegue en Render

Este documento explica cómo desplegar el proyecto **Memorize Evolutivo** en Render.

## 📋 Requisitos Previos

1. Cuenta en [Render](https://render.com)
2. Repositorio en GitHub
3. Git instalado localmente

## 🔧 Preparación del Proyecto

El proyecto ya está preparado para Render con:

- ✓ `render.yaml` - Configuración de despliegue
- ✓ `backend/prisma/migrations/` - Migraciones versionadas (se aplican en el build con `prisma migrate deploy`)
- ✓ Health check endpoint (`/health`)

## 📤 Pasos de Despliegue

### 1. Subir cambios a GitHub

```bash
git add .
git commit -m "Preparar para despliegue en Render"
git push origin main
```

### 2. Crear Backend en Render

1. Accede a [Render Dashboard](https://dashboard.render.com)
2. Click en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name:** `memorize-backend`
   - **Branch:** `main`
   - **Runtime:** `Node`
   - **Build Command:** `npm --prefix backend install && npm --prefix backend run build && npm --prefix backend run prisma:deploy`
   - **Start Command:** `npm --prefix backend run start`
   - **Plan:** Free (o pagado si deseas mejor rendimiento)

5. **Environment Variables:**
   ```
   PORT = 10000
   NODE_ENV = production
   FRONTEND_URL = https://memorize-evolutivo.onrender.com
   DATABASE_URL = postgresql://...   (cadena de conexión de tu PostgreSQL)
   JWT_SECRET = <cadena_larga_y_aleatoria>
   JWT_EXPIRES_IN = 7d
   ```

6. Click **"Create Web Service"**
7. Copia la URL del backend (ej: `https://memorize-backend.onrender.com`)

### 3. Crear Frontend en Render

1. Click **"New +"** → **"Static Site"**
2. Conecta tu repositorio de GitHub
3. Configura:
   - **Name:** `memorize-frontend`
   - **Branch:** `main`
   - **Build Command:** `npm --prefix frontend install && npm --prefix frontend run build`
   - **Publish Directory:** `frontend/dist`

4. **Environment Variables:**
   ```
   VITE_API_BASE = https://memorize-backend.onrender.com
   ```
   (Reemplaza con la URL del backend obtenida en el paso anterior)

5. Click **"Create Static Site"**

### 4. Verificar el Despliegue

- El backend estará en: `https://memorize-backend.onrender.com`
- El frontend estará en: `https://memorize-evolutivo.onrender.com`

Prueba el health check:
```bash
curl https://memorize-backend.onrender.com/health
```

## 🔐 Variables de Entorno en Producción

| Variable | Valor Producción |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `FRONTEND_URL` | URL del frontend en Render |
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Cadena aleatoria larga (mín. 16 caracteres) |
| `JWT_EXPIRES_IN` | `7d` |
| `VITE_API_BASE` | URL del backend en Render |

## 🐛 Troubleshooting

### El backend se reinicia constantemente
- Verifica que el `PORT` sea el correcto (10000 en Render)
- Revisa los logs en Render Dashboard

### WebSocket no conecta
- Asegúrate que CORS está configurado correctamente
- Verifica que el frontend usa la URL correcta del backend

### Build falla
- Revisa los logs en Render
- Verifica que `npm install` funciona localmente
- Comprueba que los scripts en `package.json` existen

## 📊 Monitoreo

En Render Dashboard puedes:
- Ver logs en tiempo real
- Reiniciar servicios
- Ver métricas de CPU/memoria
- Configurar alertas

## 💡 Mejoras Futuras

- [ ] Persistencia de datos de salas (hoy en memoria)
- [ ] Refresh tokens / expiración corta de sesión
- [ ] Tests automatizados + CI/CD
- [ ] CDN para assets estáticos

---

¿Necesitas ayuda? Contacta al equipo de desarrollo.
