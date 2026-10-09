# 🎮 MEMORIZE EVOLUTIVO

**Juego web multijugador de memoria con sistema de progresión avanzado**

[![Estado](https://img.shields.io/badge/Estado-Producción%20Ready-success)]()
[![Implementación](https://img.shields.io/badge/Implementación-100%25-brightgreen)]()
[![Backend](https://img.shields.io/badge/Backend-Express%20%2B%20Socket.IO-blue)]()
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)]()
[![Base de Datos](https://img.shields.io/badge/Base%20de%20Datos-PostgreSQL-blue)]()

---

## 📖 Descripción

Memorize Evolutivo es un juego web multijugador en tiempo real que combina el clásico juego de memoria con un sistema de progresión avanzado, múltiples modos de juego, personalización completa y panel de administración.

### ✨ Características Principales

- 🎯 **6 Modos de Juego:** Clásico, Infinito, Desafío, Boss Fight, Multijugador, IA Friends
- 📈 **Sistema de Progresión:** 10 rangos desde Novato hasta Leyenda Eterna
- 💰 **Economía Completa:** Monedas, gemas y tienda con items desbloqueables
- 🎨 **Personalización Total:** 8 packs, 6 skins, 6 marcos, 6 tableros
- 👥 **Multijugador en Tiempo Real:** Hasta 4 jugadores con Socket.IO
- 🏆 **Rankings:** Global, por modo, semanal y mensual
- 🛡️ **Panel de Administración:** Gestión completa del sistema

---

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Instalación

1. **Instalar PostgreSQL** (si no lo tienes)
   - Descargar de: https://www.postgresql.org/download/
   - Usa tu contraseña local de PostgreSQL (no la subas al repo, va en `backend/.env`)

2. **Crear base de datos**
   ```bash
   psql -U postgres
   CREATE DATABASE memorize;
   \q
   ```

3. **Configurar backend**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   ```

4. **Configurar frontend**
   ```bash
   cd frontend
   npm install
   ```

5. **Iniciar servidores**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Acceder a la aplicación**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5175

---

## 📚 Documentación

- 📄 [SRS Completo](./SRS_MEMORIZE_EVOLUTIVO_ACTUALIZADO.md) - Especificación de requisitos
- 🔧 [Guía de Instalación](./INSTRUCCIONES_INSTALACION.md) - Instalación paso a paso
- ✅ [Verificación](./VERIFICACION_IMPLEMENTACION.md) - Estado de implementación
- 📊 [Resumen Final](./RESUMEN_FINAL.md) - Resumen ejecutivo
- ☑️ [Checklist](./CHECKLIST_COMPLETO.md) - Checklist de verificación

---

## 🎮 Modos de Juego

### 1. Modo Clásico
10 niveles progresivos con dificultad creciente (4-24 cartas)

### 2. Modo Infinito
Juego sin límites con ranking global

### 3. Modo Desafío
Cartas especiales: bombas, glitch y congeladas

### 4. Boss Fight
5 tipos de jefes con mecánicas únicas

### 5. Multijugador
Salas de 2-4 jugadores en tiempo real

### 6. IA Friends
Juego por turnos contra inteligencia artificial

---

## 🏗️ Arquitectura

### Backend
- **Express 5.2.1** - Servidor HTTP
- **Socket.IO 4.8.3** - WebSocket en tiempo real
- **Prisma 5.22.0** - ORM
- **PostgreSQL 14+** - Base de datos
- **TypeScript 6.0.3** - Lenguaje

### Frontend
- **React 18.2.0** - Framework UI
- **TypeScript 5.9.3** - Lenguaje
- **Vite 7.2.2** - Build tool
- **Tailwind CSS 3.4.8** - Estilos
- **Framer Motion 10.18.0** - Animaciones
- **Socket.IO Client 4.7.2** - WebSocket

---

## 📊 Estadísticas

- ✅ **125 Requisitos Funcionales** implementados
- ✅ **43 Requisitos No Funcionales** implementados
- ✅ **25 Reglas de Negocio** implementadas
- ✅ **37 Historias de Usuario** implementadas
- ✅ **40+ Endpoints REST** implementados
- ✅ **20+ Eventos Socket.IO** implementados
- ✅ **40+ Componentes React** implementados

---

## 🛠️ Comandos Útiles

### Backend
```bash
npm run dev          # Desarrollo
npm run build        # Build
npm start            # Producción
npx prisma studio    # Interfaz visual DB
npx prisma db push   # Sincronizar schema
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Build
npm run preview      # Preview build
```

---

## 📝 Licencia

Este proyecto fue desarrollado como parte de un proyecto académico.

---

## 👥 Autores

- Jose David Sandoval Caceres
- Kevin Gregorio Mora
- Axel Santiago Ballesteros

**Ficha:** 3172526  
**Fecha:** Junio 2026

---

## 🎯 Estado del Proyecto

✅ **Implementación:** 100% completa  
✅ **Backend:** Funcional  
✅ **Frontend:** Funcional  
✅ **Base de Datos:** Configurada  
✅ **Documentación:** Completa  

**Próximo paso:** Instalar PostgreSQL y ejecutar migraciones

---

**¡Listo para jugar! 🎮**
