# 🚀 PLAN DE MEJORA COMPLETO - BASE DE DATOS MEMORIZE

## 📋 Resumen Ejecutivo

**Autor:** Análisis de Arquitectura Senior (29 años experiencia)  
**Fecha:** 2026-10-06  
**Base de Datos:** PostgreSQL 18, localhost:5432, DB: memorize  
**Estado Actual:** 7 tablas (MVP funcional)  
**Objetivo:** 26 tablas (Sistema completo)  

---

## 🎯 Fases del Plan

### **FASE 1: CORRECCIONES CRÍTICAS** ⚠️
**Prioridad:** P0 - Ejecutar INMEDIATAMENTE  
**Tiempo estimado:** 15 minutos  
**Impacto:** CRÍTICO - Prevenir overflow de datos

### **FASE 2: TABLAS DE ALTA PRIORIDAD** 🔥
**Prioridad:** P1 - Completar este mes  
**Tiempo estimado:** 4-6 horas  
**Impacto:** Logros, Leaderboards, Historial avanzado, Bosses

### **FASE 3: TABLAS DE PRIORIDAD MEDIA** 📊
**Prioridad:** P2 - Próximos 3 meses  
**Tiempo estimado:** 6-8 horas  
**Impacto:** Configuración, Analytics, Soft Deletes

### **FASE 4: SISTEMA COMPLETO** 🌟
**Prioridad:** P3 - Mediano/Largo plazo  
**Tiempo estimado:** 12-16 horas  
**Impacto:** Social, Multijugador, Economía completa

---

## 📂 ARCHIVOS SQL GENERADOS

Ejecutar en este orden en pgAdmin:

1. **01_FASE1_CRITICO.sql** - ⚠️ Correcciones críticas (EJECUTAR PRIMERO)
2. **02_FASE2_ALTA_PRIORIDAD.sql** - 🔥 6 tablas: game_sessions, logros, leaderboards, bosses
3. **03_FASE3_MEDIA_PRIORIDAD.sql** - 📊 2 tablas: configuración, analytics
4. **04_FASE4_SISTEMA_COMPLETO.sql** - 🌟 11 tablas: social, multiplayer, economía
5. **05_MIGRACION_DATOS.sql** - 🔄 Scripts de migración de datos existentes
6. **06_NUEVOS_TRIGGERS.sql** - ⚡ Triggers para nuevas tablas
7. **07_NUEVOS_SP.sql** - 📝 Stored Procedures adicionales
8. **08_NUEVAS_VISTAS.sql** - 👁️ Vistas para nuevas tablas

---

## 🔍 ESTADO ACTUAL Y PROBLEMAS

### Tablas Actuales (7)
✅ users, player_stats, inventories, matches, announcements, admin_logs, promotions

### ⚠️ Problemas Críticos Identificados

1. **CRÍTICO: totalScore puede hacer overflow**
   - Tipo actual: INTEGER (max: 2,147,483,647)
   - Solución: Cambiar a BIGINT

2. **ALTO: Sin índice compuesto en matches**
   - Query lenta: Historial por usuario + fecha
   - Solución: Índice (userId, createdAt)

3. **ALTO: 19 tablas faltantes del diseño completo**

---

## 📊 TABLAS A IMPLEMENTAR

### FASE 1: Correcciones (0 tablas nuevas)
- Modificar player_stats.totalScore → BIGINT
- Agregar índice compuesto en matches

### FASE 2: Alta Prioridad (6 tablas)
1. **game_sessions** - Historial avanzado de partidas
2. **achievements** - Definición de logros del sistema
3. **user_achievements** - Progreso de logros por usuario
4. **leaderboard_entries** - Rankings globales/semanales/por modo
5. **unlocked_items** - Inventario normalizado (reemplaza arrays)
6. **boss_defeats** - Registro de bosses derrotados

### FASE 3: Media Prioridad (2 tablas)
7. **user_settings** - Configuración audio/video/idioma
8. **game_events** - Analytics y debugging

### FASE 4: Sistema Completo (11 tablas)
9. **rooms** - Salas multijugador
10. **room_players** - Participantes en salas
11. **friendships** - Sistema de amigos
12. **friend_requests** - Solicitudes de amistad
13. **notifications** - Sistema de notificaciones
14. **user_currency** - Monedas y gemas (separada de users)
15. **shop_items** - Catálogo de tienda
16. **user_purchases** - Historial de compras
17. **daily_missions** - Misiones diarias del sistema
18. **user_daily_missions** - Progreso de misiones por usuario
19. **chat_messages** - Chat en salas multijugador (opcional)

---

## 📈 DIAGRAMA DE RELACIONES FINAL

```
                         users (principal)
                            |
        +-------------------+-------------------+
        |                   |                   |
    player_stats      inventories          matches
     (1:1)              (1:1)               (1:N)
                                               |
                                         game_sessions
                                            (1:N)
                                               |
                 +-----------------------------+
                 |                             |
           game_events                    boss_defeats
             (1:N)                           (1:N)
                 
        user_achievements ← achievements
             (N:N via junction)
             
        leaderboard_entries
             (1:N)
             
        unlocked_items
             (1:N)
             
        user_settings
             (1:1)
             
        friendships, friend_requests
             (N:N self-referencing)
             
        rooms → room_players ← users
         (1:N)    (junction)   (N:N)
         
        user_currency (1:1)
        user_purchases (1:N) ← shop_items
        user_daily_missions (1:N) ← daily_missions
        
        notifications (1:N)
        admin_logs (1:N)
        
        announcements, promotions (sin relación, globales)
```

---

## ⚙️ INSTRUCCIONES DE EJECUCIÓN EN pgADMIN

### Paso 1: Preparación
1. Abrir pgAdmin
2. Conectar a localhost:5432
3. Seleccionar base de datos **memorize**
4. Hacer backup:
   ```sql
   -- Click derecho en 'memorize' → Backup
   -- Guardar como: memorize_backup_antes_mejoras.backup
   ```

### Paso 2: Ejecución Fase por Fase

#### 🚨 FASE 1: CRÍTICO (Ejecutar HOY)
```bash
1. Abrir Query Tool en pgAdmin
2. Cargar archivo: 01_FASE1_CRITICO.sql
3. Ejecutar (F5)
4. Verificar: SELECT pg_typeof("totalScore") FROM player_stats LIMIT 1;
   # Debe retornar: bigint
```

#### 🔥 FASE 2: ALTA PRIORIDAD (Esta semana)
```bash
1. Cargar archivo: 02_FASE2_ALTA_PRIORIDAD.sql
2. Ejecutar (F5)
3. Verificar: SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema='public';
   # Debe retornar: 13 (7 anteriores + 6 nuevas)
```

#### 📊 FASE 3: MEDIA PRIORIDAD (Este mes)
```bash
1. Cargar archivo: 03_FASE3_MEDIA_PRIORIDAD.sql
2. Ejecutar (F5)
3. Verificar: SELECT table_name FROM information_schema.tables 
               WHERE table_schema='public' ORDER BY table_name;
   # Debe incluir: user_settings, game_events
```

#### 🌟 FASE 4: SISTEMA COMPLETO (Próximos 3 meses)
```bash
1. Cargar archivo: 04_FASE4_SISTEMA_COMPLETO.sql
2. Ejecutar (F5)
3. Verificar: SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema='public';
   # Debe retornar: 26
```

### Paso 3: Migración de Datos
```bash
1. Cargar archivo: 05_MIGRACION_DATOS.sql
2. Revisar y ajustar según tus datos
3. Ejecutar (F5)
```

### Paso 4: Triggers y SP Adicionales
```bash
1. Cargar archivo: 06_NUEVOS_TRIGGERS.sql
2. Ejecutar (F5)
3. Cargar archivo: 07_NUEVOS_SP.sql
4. Ejecutar (F5)
5. Cargar archivo: 08_NUEVAS_VISTAS.sql
6. Ejecutar (F5)
```

---

## 🔄 ACTUALIZAR PRISMA SCHEMA

Después de ejecutar las fases en pgAdmin:

```bash
cd backend

# Opción 1: Pull desde la base de datos
npx prisma db pull

# Opción 2: Usar el schema provisto
# (Revisar y ajustar 06_ACTUALIZACION_SCHEMA_PRISMA.prisma)

# Generar cliente Prisma
npx prisma generate

# Verificar
npx prisma studio
```

---

## ✅ VALIDACIÓN POST-EJECUCIÓN

### Verificar Tablas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Debe mostrar 26 tablas después de todas las fases
```

### Verificar Relaciones (Foreign Keys)
```sql
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table,
  ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
```

### Verificar Índices
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Verificar Triggers
```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
-- Debe incluir: trg_users_auto_create, trg_matches_update_stats + nuevos
```

---

## 🎯 MÉTRICAS DE ÉXITO

### Fase 1: Correcciones Críticas ✅
- [ ] totalScore es BIGINT
- [ ] Índice compuesto en matches existe
- [ ] Queries de historial 50% más rápidas

### Fase 2: Alta Prioridad ✅
- [ ] 6 nuevas tablas creadas
- [ ] Sistema de logros funcional
- [ ] Leaderboards actualizándose
- [ ] Registro de bosses operativo

### Fase 3: Media Prioridad ✅
- [ ] 2 nuevas tablas creadas
- [ ] Configuración persistente
- [ ] Analytics capturando eventos

### Fase 4: Sistema Completo ✅
- [ ] 11 nuevas tablas creadas
- [ ] Sistema social funcional
- [ ] Multijugador operativo
- [ ] Economía completa

---

## 🔙 ESTRATEGIA DE ROLLBACK

Si algo sale mal:

```sql
-- ROLLBACK FASE 1
ALTER TABLE player_stats ALTER COLUMN "totalScore" TYPE INTEGER;
DROP INDEX IF EXISTS idx_matches_user_date;

-- ROLLBACK FASE 2
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS leaderboard_entries CASCADE;
DROP TABLE IF EXISTS unlocked_items CASCADE;
DROP TABLE IF EXISTS boss_defeats CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;

-- O restaurar backup completo:
-- En pgAdmin: Click derecho en 'memorize' → Restore
-- Seleccionar: memorize_backup_antes_mejoras.backup
```

---

## 📞 CHECKLIST DE EJECUCIÓN

### Antes de Empezar
- [ ] Hacer backup de la base de datos
- [ ] Revisar conexión a localhost:5432
- [ ] Tener todos los archivos SQL descargados
- [ ] Informar al equipo (mantenimiento programado)

### Durante la Ejecución
- [ ] Ejecutar FASE 1 y verificar
- [ ] Probar aplicación después de FASE 1
- [ ] Ejecutar FASE 2 y verificar
- [ ] Actualizar backend para usar nuevas tablas
- [ ] Ejecutar FASE 3 y 4 según cronograma

### Después de Completar
- [ ] Ejecutar todas las queries de validación
- [ ] Actualizar Prisma schema
- [ ] Actualizar documentación del proyecto
- [ ] Hacer backup de la BD actualizada
- [ ] Notificar al equipo que está completo

---

## 📄 CONTENIDO DE ARCHIVOS

Los siguientes 8 archivos SQL están listos para usar:

1. **01_FASE1_CRITICO.sql** - Corrección de totalScore + índice
2. **02_FASE2_ALTA_PRIORIDAD.sql** - 6 tablas P1
3. **03_FASE3_MEDIA_PRIORIDAD.sql** - 2 tablas P2
4. **04_FASE4_SISTEMA_COMPLETO.sql** - 11 tablas P3
5. **05_MIGRACION_DATOS.sql** - Migración de datos existentes
6. **06_NUEVOS_TRIGGERS.sql** - Triggers adicionales
7. **07_NUEVOS_SP.sql** - Stored Procedures nuevos
8. **08_NUEVAS_VISTAS.sql** - Vistas para analytics

---

## 📊 RESUMEN FINAL

| Concepto | Antes | Después | Mejora |
|----------|-------|---------|--------|
| Tablas | 7 | 26 | +271% |
| Relaciones 1:1 | 2 | 4 | +100% |
| Relaciones 1:N | 2 | 15 | +650% |
| Relaciones N:N | 0 | 5 | ∞ |
| Triggers | 2 | 6 | +200% |
| Stored Procedures | 2 | 7 | +250% |
| Vistas | 4 | 12 | +200% |
| Índices | 8 | 35+ | +337% |

**Nivel de completitud:** 27% → 100% ✅

---

**Próximo paso:** Ejecutar **01_FASE1_CRITICO.sql** en pgAdmin

**Fin del Plan de Mejora**  
Generado por Sistema de Análisis de Arquitectura Senior  
Fecha: 2026-10-06 15:18:50
