-- ============================================================
-- MEMORIZE EVOLUTIVO - Objetos de BD para SENA
-- BD: memorize (PostgreSQL 18, localhost:5432)
-- Contiene: 2 TRIGGERS + 2 PROCEDIMIENTOS (SP) + 4 VISTAS
-- Autor: Kevin Mora / Jose David - Ficha 3172526
-- Fecha: 2026-10-06
-- Idempotente: se puede ejecutar varias veces en pgAdmin o psql
-- ============================================================

-- ------------------------------------------------------------
-- TRIGGER 1: auto-crear stats + inventario al crear usuario
-- Problema que resuelve: hay 3 users pero solo 2 player_stats/inventories
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_users_auto_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.player_stats (id, "userId", "updatedAt")
  VALUES (gen_random_uuid()::TEXT, NEW.id, NOW())
  ON CONFLICT ("userId") DO NOTHING;

  INSERT INTO public.inventories (id, "userId", "updatedAt")
  VALUES (gen_random_uuid()::TEXT, NEW.id, NOW())
  ON CONFLICT ("userId") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_auto_create ON public.users;
CREATE TRIGGER trg_users_auto_create
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_users_auto_create();

-- ------------------------------------------------------------
-- TRIGGER 2: actualizar stats + XP/nivel/monedas al registrar partida
-- Se dispara con INSERT en matches (incluso via sp_register_match)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_matches_update_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_xp_gain INT;
  v_coins_gain INT;
BEGIN
  -- Asegurar que el jugador tenga stats (corrige datos viejos sin stats)
  INSERT INTO public.player_stats (id, "userId", "updatedAt")
  VALUES (gen_random_uuid()::TEXT, NEW."userId", NOW())
  ON CONFLICT ("userId") DO NOTHING;

  v_xp_gain := COALESCE(NEW.score, 0) / 10;
  IF NEW.won THEN
    v_coins_gain := 10;
  ELSE
    v_coins_gain := 2;
  END IF;

  UPDATE public.player_stats
  SET "gamesPlayed" = "gamesPlayed" + 1,
      "gamesWon" = "gamesWon" + CASE WHEN NEW.won THEN 1 ELSE 0 END,
      "totalScore" = "totalScore" + COALESCE(NEW.score, 0),
      "bestScore" = GREATEST("bestScore", COALESCE(NEW.score, 0)),
      "totalMatches" = "totalMatches" + 1,
      "maxCombo" = GREATEST("maxCombo", COALESCE(NEW.combo, 0)),
      "updatedAt" = NOW()
  WHERE "userId" = NEW."userId";

  UPDATE public.users
  SET xp = xp + v_xp_gain,
      coins = coins + v_coins_gain,
      "level" = (xp + v_xp_gain) / 1000 + 1,
      "updatedAt" = NOW()
  WHERE id = NEW."userId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_matches_update_stats ON public.matches;
CREATE TRIGGER trg_matches_update_stats
AFTER INSERT ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_matches_update_stats();

-- ------------------------------------------------------------
-- SP 1: registrar partida (inserta en matches, el trigger actualiza stats)
-- Uso: CALL public.sp_register_match('user-id','classic',150,true,1,95,5,120);
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS public.sp_register_match(TEXT, TEXT, INTEGER, BOOLEAN, INTEGER, INTEGER, INTEGER, INTEGER);
CREATE PROCEDURE public.sp_register_match(
  p_user_id TEXT,
  p_mode TEXT,
  p_score INTEGER,
  p_won BOOLEAN,
  p_level INTEGER DEFAULT NULL,
  p_accuracy INTEGER DEFAULT NULL,
  p_combo INTEGER DEFAULT NULL,
  p_timeleft INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'sp_register_match: usuario % no existe', p_user_id;
  END IF;

  INSERT INTO public.matches (id, "userId", mode, level, score, accuracy, combo, "timeLeft", won)
  VALUES (gen_random_uuid()::TEXT, p_user_id, p_mode, p_level, p_score, p_accuracy, p_combo, p_timeleft, COALESCE(p_won, false));
END;
$$;

-- ------------------------------------------------------------
-- SP 2: dar monedas/gemas con auditoria (actualiza users + admin_logs)
-- Uso: CALL public.sp_give_currency('admin-id','user-id',100,5,'bono evento');
-- ------------------------------------------------------------
DROP PROCEDURE IF EXISTS public.sp_give_currency(TEXT, TEXT, INTEGER, INTEGER, TEXT);
CREATE PROCEDURE public.sp_give_currency(
  p_admin_id TEXT,
  p_target_id TEXT,
  p_coins INTEGER DEFAULT 0,
  p_gems INTEGER DEFAULT 0,
  p_detail TEXT DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_id) THEN
    RAISE EXCEPTION 'sp_give_currency: admin % no existe', p_admin_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_target_id) THEN
    RAISE EXCEPTION 'sp_give_currency: destino % no existe', p_target_id;
  END IF;

  UPDATE public.users
  SET coins = coins + COALESCE(p_coins, 0),
      gems = gems + COALESCE(p_gems, 0),
      "updatedAt" = NOW()
  WHERE id = p_target_id;

  INSERT INTO public.admin_logs (id, "adminId", action, "targetId", details)
  VALUES (
    gen_random_uuid()::TEXT,
    p_admin_id,
    'give_currency',
    p_target_id,
    COALESCE(p_detail, 'coins=' || COALESCE(p_coins,0)::TEXT || ' gems=' || COALESCE(p_gems,0)::TEXT)
  );
END;
$$;

-- ------------------------------------------------------------
-- VISTA 1: ranking global (users + player_stats)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_ranking_global AS
SELECT
  ROW_NUMBER() OVER (ORDER BY COALESCE(ps."totalScore", 0) DESC, COALESCE(u.xp, 0) DESC) AS posicion,
  u.id AS user_id,
  u.email,
  u.username,
  u."level",
  u.xp,
  u.coins,
  u.gems,
  COALESCE(ps."gamesPlayed", 0) AS partidas,
  COALESCE(ps."gamesWon", 0) AS victorias,
  COALESCE(ps."totalScore", 0) AS puntaje_total,
  COALESCE(ps."bestScore", 0) AS mejor_puntaje,
  COALESCE(ps."maxCombo", 0) AS max_combo
FROM public.users u
LEFT JOIN public.player_stats ps ON ps."userId" = u.id
WHERE COALESCE(u."isBanned", false) = false
ORDER BY puntaje_total DESC, u.xp DESC;

-- ------------------------------------------------------------
-- VISTA 2: historial de partidas con datos del jugador
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_historial_partidas AS
SELECT
  m.id AS match_id,
  m."createdAt" AS fecha,
  u.username,
  u.email,
  m.mode AS modo,
  m.level AS nivel,
  m.score AS puntaje,
  m.accuracy AS precision,
  m.combo,
  m."timeLeft" AS tiempo_restante,
  m.won AS ganada,
  m."userId" AS user_id
FROM public.matches m
JOIN public.users u ON u.id = m."userId"
ORDER BY m."createdAt" DESC;

-- ------------------------------------------------------------
-- VISTA 3: inventario del jugador (users + inventories + stats)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_inventario_jugador AS
SELECT
  u.id AS user_id,
  u.username,
  u.email,
  u."level",
  u.coins,
  u.gems,
  i."equippedPack" AS pack_equipado,
  i."equippedSkin" AS skin_equipada,
  i."equippedFrame" AS marco_equipado,
  i."equippedBoard" AS tablero_equipado,
  COALESCE(array_length(i."ownedPacks", 1), 0) AS total_packs,
  COALESCE(array_length(i."ownedSkins", 1), 0) AS total_skins,
  COALESCE(array_length(i."ownedFrames", 1), 0) AS total_marcos,
  COALESCE(array_length(i."ownedBoards", 1), 0) AS total_tableros,
  i."ownedPacks" AS packs,
  i."ownedSkins" AS skins,
  COALESCE(ps."gamesPlayed", 0) AS partidas
FROM public.users u
LEFT JOIN public.inventories i ON i."userId" = u.id
LEFT JOIN public.player_stats ps ON ps."userId" = u.id;

-- ------------------------------------------------------------
-- VISTA 4: auditoria admin (admin_logs + nombres admin y objetivo)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_auditoria_admin AS
SELECT
  l.id AS log_id,
  l."createdAt" AS fecha,
  l.action AS accion,
  a.username AS admin_usuario,
  a.email AS admin_email,
  t.username AS objetivo_usuario,
  l."targetId" AS objetivo_id,
  l.details AS detalle
FROM public.admin_logs l
JOIN public.users a ON a.id = l."adminId"
LEFT JOIN public.users t ON t.id = l."targetId"
ORDER BY l."createdAt" DESC;

-- Fin del script: 2 triggers + 2 SP + 4 vistas
