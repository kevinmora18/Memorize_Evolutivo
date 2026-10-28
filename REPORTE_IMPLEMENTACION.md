# 📋 REPORTE DE IMPLEMENTACIÓN — Base de Datos Memorize

**BD:** memorize · PostgreSQL 18 (localhost:5432)
**Fecha:** 2026-10-06
**Autores:** Kevin Mora  Ficha 3172526
**Estado verificado en vivo:** 25 tablas · 4 vistas · 1 trigger · 2 procedures · 26 FKs · 96 índices

---

## 1. Punto de partida (ya existía)
- 7 tablas: `users, player_stats, inventories, matches, announcements, admin_logs, promotions`
- 1 trigger: `trg_users_auto_create` (requisito SENA: 1)
- 2 procedures: `sp_register_match`, `sp_give_currency`
- 4 vistas: `v_ranking_global, v_historial_partidas, v_inventario_jugador, v_auditoria_admin`
- Script: `database_objetos_sena.sql`

## 2. FASE 1 — Correcciones críticas (`01_FASE1_CRITICO.sql`)
- `player_stats.totalScore`: `INTEGER → BIGINT` (evita overflow)
- 3 índices nuevos: `idx_matches_user_date (userId, createdAt DESC)`, `idx_player_stats_user_id`, `idx_inventories_user_id`
- Incidente: el `ALTER` se bloqueó por la vista `v_ranking_global` → se bajaron las 4 vistas, se aplicó la fase y se recrearon. Triggers/SPs re-validados con `BIGINT` (test con ROLLBACK, 0 basura).

## 3. FASE 2 — Alta prioridad (`02_FASE2_ALTA_PRIORIDAD.sql`)
6 tablas nuevas:
1. `game_sessions` — historial avanzado (modo, universo, puntaje, resultado)
2. `achievements` — catálogo de logros + **8 logros semilla** (`first_victory, combo_master, 100_games, perfect_game, boss_hunter, speed_demon, collector, social_butterfly`)
3. `user_achievements` — progreso por usuario (N:N)
4. `leaderboard_entries` — rankings (score BIGINT)
5. `unlocked_items` — inventario normalizado (reemplaza arrays)
6. `boss_defeats` — bosses derrotados por universo

## 4. FASE 3 — Media prioridad (`03_FASE3_MEDIA_PRIORIDAD.sql`) ⚠️ corregido
2 tablas nuevas:
7. `user_settings` — configuración (sonido, idioma, tema, skin) 1:1
8. `game_events` — analytics (eventType, eventData JSONB)
- Soft deletes: columna `deletedAt` en `users` y `matches`
- **Correcciones aplicadas:** `RAISE NOTICE` suelto → envuelto en `DO $$`; 5 `CREATE INDEX` sin `IF NOT EXISTS` → agregado.

## 5. FASE 4 — Sistema completo (`04_FASE4_SISTEMA_COMPLETO.sql`) ⚠️ corregido
10 tablas nuevas:
9. `rooms` — salas multijugador
10. `room_players` — participantes (team 1|2)
11. `friendships` — amigos (pending/accepted/blocked)
12. `friend_requests` — solicitudes (pending/accepted/rejected)
13. `notifications` — notificaciones (JSONB + lectura)
14. `user_currency` — monedas/gemas separadas 1:1
15. `shop_items` — catálogo de tienda
16. `user_purchases` — historial de compras
17. `daily_missions` — misiones del sistema
18. `user_daily_missions` — progreso por usuario
- **Correcciones aplicadas:** 22 `CREATE INDEX` sin `IF NOT EXISTS` → agregado; `RAISE NOTICE` final suelto (línea 167) → envuelto en `DO $$`. Re-ejecutado idempotente.
- **Nota:** `chat_messages` sale en el plan pero no viene en el script → total real **25 tablas, no 26**.

## 6. FASE 5 — Migración (`05_MIGRACION_DATOS.sql`) ⚠️ corregido
- Inventarios → `unlocked_items`: 3 packs + 2 skins
- `user_settings` creado para los 3 usuarios
- `user_currency` creado para los 3 usuarios (desde `users.coins/gems`)
- **Corrección aplicada:** `RAISE NOTICE` suelto → envuelto en `DO $$`.

## 7. FASE 6 — Triggers retirados (requisito: 1 solo trigger)
- Existieron `trg_matches_update_stats`, `trg_user_achievements_reward` y `trg_boss_defeats_reward` (probados con `ROLLBACK`).
- Se eliminaron junto con sus funciones (`fn_trg_matches_update_stats`, `fn_trg_achievement_reward`, `fn_trg_boss_reward`) para cumplir el requisito de 1 trigger.
- Queda `trg_users_auto_create` (AFTER INSERT en `users`): crea `player_stats` + `inventories` con `ON CONFLICT DO NOTHING`.
- Verificado en vivo: 1 trigger en `public`. Los SPs y vistas siguen operativos.

## 8. Prisma y backend
- `npx prisma db pull` → 25 modelos
- `npx prisma generate` → cliente v5.22.0 OK
- `node test-connection.js` → conexión exitosa PostgreSQL 18.6
- ⚠️ Pendiente: el código usa `totalScore: Int`, ahora es `BigInt` en BD (ajustar TS si hay aritmética).

## 9. Respaldos y evidencia
- `backups/` — dumps de respaldo locales (23 KB / 83 KB), excluidos de git (contienen datos)
- Los binarios de evidencia (PPT, imágenes) y los SQL sueltos se retiraron del repositorio en la limpieza final; quedan en el historial de git
- El esquema vigente vive en `backend/prisma/schema.prisma` + `backend/prisma/migrations/`

## 10. Conteos finales verificados
| Objeto | Cantidad |
|---|---|
| Tablas base | 25 |
| Vistas | 4 |
| Triggers | 1 |
| Procedures | 2 |
| Foreign keys | 26 |
| Índices | 96 |
| Achievements | 8 |
| Unlocked items | 5 |
