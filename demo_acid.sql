-- ============================================================
-- DEMO ACID — Memorize Evolutivo (BD memorize, PostgreSQL 18)
-- Cómo usar en pgAdmin: abre Query Tool, selecciona UN bloque
-- y presiona F5. Cada bloque es independiente.
-- ============================================================

-- ------------------------------------------------------------
-- A — ATOMICIDAD: todo o nada
-- La 1.ª llamada es válida, la 2.ª falla -> NADA se guarda,
-- ni siquiera lo válido (incluye lo que hizo el trigger).
-- ------------------------------------------------------------
BEGIN;
CALL public.sp_register_match('59f90123-c27d-4ba9-9160-5b6d5bdb0d32','classic',200,true,1,90,6,100);
CALL public.sp_register_match('USUARIO-FANTASMA','classic',100,true,1,90,5,100);
COMMIT;

-- Verificación (kevin sigue igual: 0 partidas, xp 0, coins 500):
SELECT count(*) AS partidas_kevin FROM public.matches WHERE "userId" = '59f90123-c27d-4ba9-9160-5b6d5bdb0d32';
SELECT xp, coins FROM public.users WHERE id = '59f90123-c27d-4ba9-9160-5b6d5bdb0d32';

-- ------------------------------------------------------------
-- C — CONSISTENCIA: la BD rechaza datos inválidos sola
-- Ejecuta cada INSERT por separado: los 4 deben dar ERROR.
-- ------------------------------------------------------------

-- C1. CHECK: modo de juego no permitido
INSERT INTO public.game_sessions ("userId", "gameMode", "timePlayed", result)
VALUES ('59f90123-c27d-4ba9-9160-5b6d5bdb0d32', 'modo-inventado', 60, 'won');
-- ERROR esperado: viola chk_game_mode (solo: classic, infinite,
-- challenge, boss, multiplayer, ai-friends)

-- C2. FOREIGN KEY: partida de un usuario que no existe
INSERT INTO public.matches (id, "userId", mode, score)
VALUES ('TEST-FK-1', 'USUARIO-FANTASMA', 'classic', 100);
-- ERROR esperado: viola matches_userId_fkey

-- C3. UNIQUE: email ya registrado
INSERT INTO public.users (id, email, "updatedAt")
VALUES ('TEST-UQ-1', 'kevinmora2838@gmail.com', NOW());
-- ERROR esperado: viola users_email_key

-- C4. NOT NULL: partida sin puntaje
INSERT INTO public.matches (id, "userId", mode)
VALUES ('TEST-NN-1', '59f90123-c27d-4ba9-9160-5b6d5bdb0d32', 'classic');
-- ERROR esperado: score NOT NULL

-- Conteo de reglas que te protegen (211 en total):
SELECT constraint_type, count(*) FROM information_schema.table_constraints
WHERE constraint_schema = 'public' GROUP BY 1 ORDER BY 1;

-- ------------------------------------------------------------
-- I — AISLAMIENTO: cada transacción ve solo lo confirmado
-- Demo con DOS ventanas de Query Tool en pgAdmin:
--   Ventana 1:  BEGIN;
--               UPDATE public.users SET coins = coins + 999
--               WHERE id = '59f90123-c27d-4ba9-9160-5b6d5bdb0d32';
--               -- (NO hagas COMMIT todavía)
--   Ventana 2:  SELECT coins FROM public.users
--               WHERE id = '59f90123-c27d-4ba9-9160-5b6d5bdb0d32';
--               -- Verás el valor VIEJO: lo no confirmado es invisible.
--   Ventana 1:  ROLLBACK;  -- se deshace todo, nadie vio nada
-- ------------------------------------------------------------
SHOW default_transaction_isolation;  -- read committed

-- ------------------------------------------------------------
-- D — DURABILIDAD: lo confirmado sobrevive a caídas
-- ------------------------------------------------------------
SHOW wal_level;  -- replica: cada cambio se escribe al diario WAL
SHOW fsync;      -- on: el disco confirma antes de responder "OK"

-- Prueba conceptual: todo COMMIT que pgAdmin te confirma ya está
-- en disco (WAL + fsync). Tus backups en backups/ son la 2.ª capa:
-- memorize_backup_antes_mejoras.dump / memorize_backup_despues_mejoras.dump
