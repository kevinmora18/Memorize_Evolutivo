# 🔍 AUDITORÍA DE BASE DE DATOS — Memorize Evolutivo

**BD:** memorize · PostgreSQL 18 (localhost:5432) · **Fecha:** 2026-10-12
**Autores:** Kevin Mora / Jose David Sandoval — Ficha 3172526

---

## 1. Inventario verificado en vivo

| Tabla | Filas | Tabla | Filas |
|---|---|---|---|
| users | 8 | player_stats | 8 |
| inventories | 8 | matches | 7 |
| achievements | 8 | unlocked_items | 5 |
| user_settings | 8 | user_currency | 8 |
| admin_logs | 4 | announcements | 1 |
| promotions | 1 | notifications | 1 |
| *14 tablas de módulos nuevos* | 0 | | |

**Estructura:** 25 tablas · 25 PK · 11 UNIQUE · 26 FK · 149 CHECK · 96 índices · `totalScore BIGINT` ✅

## 2. Veredicto por requisito (5/5 ✅)

| # | Requisito | Estado | Evidencia |
|---|---|---|---|
| 1 | ACID | ✅ | `read committed` · `wal_level=replica` · `fsync=on` · 211 constraints · demo ROLLBACK total (0 filas parciales) |
| 2 | CAP | ✅ | Sistema **CA**: 0 réplicas (`pg_stat_replication` vacío), 1 solo nodo, 1 sola `DATABASE_URL` |
| 3 | 4 vistas | ✅ | `v_ranking_global` (8), `v_historial_partidas` (7), `v_inventario_jugador` (8), `v_auditoria_admin` (4) |
| 4 | 2 SP | ✅ 4/4 | `sp_register_match`, `sp_give_currency`, `sp_registrar_partida` (versión simple), `sp_resumen_jugador` (didáctico, solo lectura; probado: NOTICE + excepción) |
| 5 | 1 trigger | ✅ | `trg_users_auto_create` en `users`, **habilitado** (auto-crea stats + inventario) |

## 3. Integridad: 9/10 chequeos limpios

✅ Sin emails duplicados ni nulos · ✅ sin partidas sin puntaje · ✅ sin partidas huérfanas ·
✅ sin monedas/gemas/XP negativos · ✅ settings y currency completos (8/8).
⚠️ **Hallazgo (corregido):** `kevin` no tenía `player_stats` ni `inventories` (nació antes del trigger).
**Acción aplicada:** backfill de ambas filas en ceros con `ON CONFLICT DO NOTHING` → ahora 8/8 en todo.

## 4. Recomendaciones — estado 2026-10-12

1. ✅ **Aplicado:** CHECK `chk_users_coins_nonneg/gems/xp_nonneg` en `users` (probado: rechaza -5, saldo intacto).
2. ✅ **Aplicado:** regenerado `memorize_para_enviar.sql` (61 KB, formato INSERT compatible pgAdmin, sin `\restrict`; restauración probada idéntica 25/8/7/4) + `backups/memorize_backup_2026-10-12.dump` (80 KB).
3. ✅ **Rastreado:** la notificación es prueba manual (`INFO/"Notificación de sistema"/"hola"`, kevin, 2026-10-07). Se deja; borrarla es opcional.
4. ✅ **Aplicado:** `recordGamePlayed` ahora usa transacción (`BaseRepository.transaction` + `tx` en ambos `update`); `totalScore` se convierte en el borde (`Number()` al leer, `number` al escribir — el dominio sigue en `number`). `tsc` limpio + prueba viva con usuario temporal (xp 50, stats 1/1/500, limpieza total).

## 5. Conclusión

La BD **cumple los 5 requisitos con evidencia en vivo** y quedó sin inconsistencias tras el backfill.
Cambios aplicados hoy: backfill de kevin (2 filas), 3 CHECKs anti-negativos, evidencias regeneradas y probadas,
notificación rastreada, transacción ACID en `recordGamePlayed` y corrección BigInt (`tsc` limpio).
