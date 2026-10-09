-- ============================================================
-- FASE 6 (archivo 06): TRIGGERS PARA TABLAS NUEVAS
-- ============================================================
-- Base de Datos: memorize (PostgreSQL 18)
-- Requisito previo: Fases 1-5 aplicadas (tablas achievements,
--   user_achievements, boss_defeats, notifications, users)
-- Autor: Kevin Mora / Jose David - Ficha 3172526
-- Fecha: 2026-10-06
-- Idempotente: DROP IF EXISTS + CREATE OR REPLACE
-- ============================================================

-- ------------------------------------------------------------
-- TRIGGER 3: recompensa XP + notificación al completar un logro
-- Evento: AFTER UPDATE ON user_achievements
--   solo cuando isCompleted pasa de false -> true
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_achievement_reward()
RETURNS TRIGGER AS $$
DECLARE
  v_xp INT;
  v_name TEXT;
BEGIN
  -- Solo al completar (evita doble premio en updates posteriores)
  IF OLD."isCompleted" = FALSE AND NEW."isCompleted" = TRUE THEN
    SELECT "xpReward", name INTO v_xp, v_name
    FROM public.achievements
    WHERE id = NEW."achievementId";

    v_xp := COALESCE(v_xp, 0);

    UPDATE public.users
    SET xp = xp + v_xp,
        "level" = (xp + v_xp) / 1000 + 1,
        "updatedAt" = NOW()
    WHERE id = NEW."userId";

    INSERT INTO public.notifications ("userId", "notificationType", title, message, data)
    VALUES (
      NEW."userId",
      'achievement_unlocked',
      '¡Logro desbloqueado!',
      'Ganaste ' || v_xp || ' XP: ' || COALESCE(v_name, 'logro'),
      jsonb_build_object('achievementId', NEW."achievementId", 'xpReward', v_xp)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_achievements_reward ON public.user_achievements;
CREATE TRIGGER trg_user_achievements_reward
AFTER UPDATE ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_achievement_reward();

-- ------------------------------------------------------------
-- TRIGGER 4: recompensa XP + notificación al derrotar un boss
-- Evento: AFTER INSERT ON boss_defeats
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trg_boss_reward()
RETURNS TRIGGER AS $$
DECLARE
  v_xp INT;
BEGIN
  v_xp := COALESCE(NEW."xpGained", 200);

  UPDATE public.users
  SET xp = xp + v_xp,
      "level" = (xp + v_xp) / 1000 + 1,
      "updatedAt" = NOW()
  WHERE id = NEW."userId";

  INSERT INTO public.notifications ("userId", "notificationType", title, message, data)
  VALUES (
    NEW."userId",
    'boss_defeated',
    '¡Boss derrotado!',
    'Derrotaste a ' || NEW."bossType" || ' en ' || NEW.universe || ' (+' || v_xp || ' XP)',
    jsonb_build_object('bossType', NEW."bossType", 'universe', NEW.universe, 'xpGained', v_xp)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_boss_defeats_reward ON public.boss_defeats;
CREATE TRIGGER trg_boss_defeats_reward
AFTER INSERT ON public.boss_defeats
FOR EACH ROW
EXECUTE FUNCTION public.fn_trg_boss_reward();

-- ------------------------------------------------------------
-- VALIDACIÓN: 4 triggers en total (2 previos + 2 nuevos)
-- ------------------------------------------------------------
DO $$
DECLARE
  v_n INT;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'VALIDACIÓN FASE 6: TRIGGERS NUEVOS';
  RAISE NOTICE '============================================================';

  SELECT COUNT(*) INTO v_n
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal AND n.nspname = 'public';

  RAISE NOTICE 'Triggers de usuario en public: % (esperado 4)', v_n;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_achievements_reward') THEN
    RAISE EXCEPTION 'Falta trg_user_achievements_reward';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_boss_defeats_reward') THEN
    RAISE EXCEPTION 'Falta trg_boss_defeats_reward';
  END IF;

  RAISE NOTICE 'OK: trg_user_achievements_reward presente';
  RAISE NOTICE 'OK: trg_boss_defeats_reward presente';
  RAISE NOTICE 'FASE 6 COMPLETADA';
END;
$$;

-- Fin de FASE 6
