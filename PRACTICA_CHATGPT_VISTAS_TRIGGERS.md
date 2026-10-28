# 📋 CONTEXTO PARA PRACTICAR VISTAS Y TRIGGERS EN CHATGPT

> **Cómo usar:** copia el bloque CONTEXTO (entre las líneas `=====`) y pégalo
> como primer mensaje en ChatGPT. Después usa las preguntas de práctica.

```
===== COPIA DESDE AQUÍ =====
Soy aprendiz SENA de Análisis y Desarrollo de Software (ficha 3172526).
Quiero practicar VISTAS y TRIGGERS en PostgreSQL usando MI base de datos
real como ejemplo. Este es mi contexto, úsalo en tus explicaciones,
preguntas y ejercicios:

BASE DE DATOS: memorize, PostgreSQL 18, 25 tablas. Tablas clave:
- users(id PK text, email UNIQUE, username, role, level, xp, coins, gems,
  isBanned, createdAt, updatedAt, deletedAt): 8 filas
- player_stats(id PK, userId UNIQUE->users, gamesPlayed, gamesWon,
  totalScore BIGINT, bestScore, maxCombo): 8 filas
- inventories(id PK, userId UNIQUE->users, ownedPacks[]/ownedSkins[]/
  ownedFrames[]/ownedBoards[] text[], equippedPack/Skin/Frame/Board): 8 filas
- matches(id PK, userId->users, mode, level, score, accuracy, combo,
  timeLeft, won): 7 filas
- admin_logs(id PK, adminId->users, action, targetId, details): 4 filas

MIS 4 VISTAS:
1) v_ranking_global: users LEFT JOIN player_stats,
   ROW_NUMBER() OVER (ORDER BY COALESCE(totalScore,0) DESC, xp DESC)
   AS posicion; excluye baneados; columnas: posicion, user_id, email,
   username, level, xp, coins, gems, partidas, victorias, puntaje_total,
   mejor_puntaje, max_combo. Dato real: laura.gomez va 1.ª con 11000 pts.
2) v_historial_partidas: matches JOIN users, ORDER BY createdAt DESC;
   columnas: match_id, fecha, username, email, modo, nivel, puntaje,
   precision, combo, tiempo_restante, ganada, user_id.
3) v_inventario_jugador: users LEFT JOIN inventories LEFT JOIN
   player_stats; muestra equipos (pack/skin/marco/tablero), conteos con
   COALESCE(array_length(...),0) y partidas. Dato real: el usuario kevin
   salía con todo en 0 porque nació sin inventario (ya corregido).
4) v_auditoria_admin: admin_logs JOIN users a (admin, INNER) LEFT JOIN
   users t (afectado); ORDER BY fecha DESC. El afectado es LEFT porque el
   targetId a veces no es persona (ej: id de una promoción).

MI TRIGGER (solo hay 1, requisito SENA):
- trg_users_auto_create AFTER INSERT ON users FOR EACH ROW
  EXECUTE FUNCTION fn_trg_users_auto_create()
- La función (plpgsql) hace 2 INSERTs: uno en player_stats y otro en
  inventories con el NEW.id, ambos con ON CONFLICT ("userId") DO NOTHING,
  y termina con RETURN NEW.
- Efecto: al registrar un usuario nacen su stats + inventario solos.

OTROS OBJETOS: 2 procedimientos (sp_register_match inserta partidas
validando el usuario; sp_give_currency premia y audita). Reglas: 25 PK,
11 UNIQUE, 26 FK, 149 CHECK. totalScore es BIGINT.

Trátame como estudiante: explícame con ejemplos de MIS tablas, hazme
preguntas de quiz de una en una, corrígeme si me equivoco y dame
ejercicios prácticos (crear/modificar vistas y triggers similares).
===== HASTA AQUÍ =====

## 🎯 PREGUNTAS PARA PRACTICAR (pégalas una por una)

**Nivel 1 — entender:**
1. Explícame con mis tablas la diferencia entre JOIN y LEFT JOIN usando v_historial_partidas vs v_inventario_jugador.
2. ¿Por qué v_ranking_global usa COALESCE(totalScore,0)? ¿Qué pasaría sin él?
3. Explica línea por línea mi función fn_trg_users_auto_create: ¿qué es NEW? ¿y RETURN NEW?
4. ¿Por qué el afectado en v_auditoria_admin es LEFT JOIN pero el admin es JOIN normal?

**Nivel 2 — razonar:**
5. Si inserto un usuario nuevo, describe todo lo que pasa en la BD paso a paso.
6. ¿Qué pasaría si quito el ON CONFLICT DO NOTHING de mi trigger?
7. Crea conmigo una vista v_top_ganadores (username + victorias, solo con victorias > 0).
8. Modifica mi trigger para que además cree la billetera en user_currency. Guíame sin darme todo el código.

**Nivel 3 — instructor (quiz):**
9. Hazme 5 preguntas de quiz sobre vistas (una por una, con nota al final).
10. Hazme 5 preguntas de quiz sobre triggers (una por una, con nota al final).
11. Simula ser mi instructor SENA: pregúntame “¿qué es una vista?” y califica mi respuesta del 1 al 5.

## ✅ RESPUESTAS CLAVE (para verificarte solo)

- JOIN trae solo coincidencias; LEFT trae todo lo de la izquierda aunque falte la derecha (kevin salía con NULLs→0).
- Sin COALESCE, los NULL romperían el ORDER BY y mostrarían vacíos en vez de 0.
- NEW = la fila que se está insertando; RETURN NEW deja continuar el INSERT.
- Admin siempre es persona (INNER); el target a veces es un id de promoción/anuncio (LEFT).
- Nuevo usuario → INSERT users → trigger → INSERT stats + INSERT inventories.
- Sin ON CONFLICT, un reintento duplicaría y violaría el UNIQUE de userId.
