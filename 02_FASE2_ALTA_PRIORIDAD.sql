-- ==================================================================
-- FASE 2: TABLAS DE ALTA PRIORIDAD
-- ==================================================================
-- Base de Datos: memorize (PostgreSQL 18)
-- Prioridad: P1 - ALTA
-- Tiempo estimado: 4-6 horas (implementación backend)
-- Autor: Plan de Mejora Arquitectura Senior
-- Fecha: 2026-10-06
--
-- REQUISITO PREVIO: Haber ejecutado 01_FASE1_CRITICO.sql
--
-- Esta fase agrega 6 tablas críticas para funcionalidad completa:
-- 1. game_sessions - Historial avanzado de partidas
-- 2. achievements - Sistema de logros
-- 3. user_achievements - Progreso de logros
-- 4. leaderboard_entries - Rankings
-- 5. unlocked_items - Inventario normalizado
-- 6. boss_defeats - Registro de bosses
-- ==================================================================

-- Verificar prerequisitos
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'FASE 2: INICIANDO CREACIÓN DE TABLAS DE ALTA PRIORIDAD';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    
    -- Verificar que FASE 1 fue ejecutada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'player_stats'
          AND column_name = 'totalScore'
          AND data_type = 'bigint'
    ) THEN
        RAISE EXCEPTION 'FASE 1 no ejecutada: totalScore no es BIGINT. Ejecutar 01_FASE1_CRITICO.sql primero';
    END IF;
    
    RAISE NOTICE '✅ Prerequisitos verificados - Continuando...';
    RAISE NOTICE '';
END;
$$;

-- ==================================================================
-- TABLA 1: game_sessions
-- ==================================================================
-- Reemplaza/complementa la tabla 'matches' con más detalles
-- Permite analytics avanzados y seguimiento de progreso
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.game_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL,
    universe TEXT,
    "levelReached" INTEGER,
    score INTEGER NOT NULL DEFAULT 0,
    "maxCombo" INTEGER DEFAULT 0,
    "timePlayed" INTEGER NOT NULL,
    "xpGained" INTEGER DEFAULT 0,
    result TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    
    CONSTRAINT fk_game_sessions_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_game_mode CHECK ("gameMode" IN ('classic', 'infinite', 'challenge', 'boss', 'multiplayer', 'ai-friends')),
    CONSTRAINT chk_universe CHECK (universe IS NULL OR universe IN ('volcania', 'frostheim', 'neural', 'verdalis', 'lunaris')),
    CONSTRAINT chk_result CHECK (result IN ('won', 'lost', 'abandoned'))
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON public.game_sessions ("userId");
CREATE INDEX IF NOT EXISTS idx_game_sessions_mode ON public.game_sessions ("gameMode");
CREATE INDEX IF NOT EXISTS idx_game_sessions_started ON public.game_sessions ("startedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_mode ON public.game_sessions ("userId", "gameMode");

COMMENT ON TABLE public.game_sessions IS 'Historial avanzado de partidas con analytics detallados';
COMMENT ON COLUMN public.game_sessions."gameMode" IS 'classic, infinite, challenge, boss, multiplayer, ai-friends';
COMMENT ON COLUMN public.game_sessions.universe IS 'volcania, frostheim, neural, verdalis, lunaris';
COMMENT ON COLUMN public.game_sessions.result IS 'won, lost, abandoned';

-- ==================================================================
-- TABLA 2: achievements
-- ==================================================================
-- Definiciones de logros del sistema
-- Tabla de catálogo, no relacionada directamente con usuarios
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "achievementId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    "xpReward" INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_category CHECK (category IN ('progression', 'skill', 'collection', 'social'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_achievements_achievement_id ON public.achievements ("achievementId");
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements (category);

COMMENT ON TABLE public.achievements IS 'Catálogo de logros del sistema';
COMMENT ON COLUMN public.achievements.category IS 'progression, skill, collection, social';

-- ==================================================================
-- TABLA 3: user_achievements
-- ==================================================================
-- Progreso de logros por usuario (relación N:N)
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "completedAt" TIMESTAMP(3),
    
    CONSTRAINT fk_user_achievements_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement FOREIGN KEY ("achievementId") 
        REFERENCES public.achievements(id) ON DELETE CASCADE,
    
    CONSTRAINT uq_user_achievement UNIQUE ("userId", "achievementId")
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements ("userId");
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON public.user_achievements ("achievementId");
CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON public.user_achievements ("isCompleted");

COMMENT ON TABLE public.user_achievements IS 'Progreso de logros por usuario (N:N)';

-- ==================================================================
-- TABLA 4: leaderboard_entries
-- ==================================================================
-- Rankings globales, semanales, por modo, etc.
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "leaderboardType" TEXT NOT NULL,
    score BIGINT NOT NULL,
    rank INTEGER,
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_leaderboard_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON public.leaderboard_entries ("userId");
CREATE INDEX IF NOT EXISTS idx_leaderboard_type_score ON public.leaderboard_entries ("leaderboardType", score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_type_rank ON public.leaderboard_entries ("leaderboardType", rank);

COMMENT ON TABLE public.leaderboard_entries IS 'Rankings globales, semanales, por modo';
COMMENT ON COLUMN public.leaderboard_entries."leaderboardType" IS 'global_xp, classic_score, infinite_score, boss_time, weekly_xp';

-- ==================================================================
-- TABLA 5: unlocked_items
-- ==================================================================
-- Inventario normalizado - reemplaza arrays de inventories
-- Permite queries complejas y flexibilidad
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.unlocked_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_unlocked_items_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_item_type CHECK ("itemType" IN ('skin', 'effect', 'power', 'boss', 'pack', 'frame', 'board')),
    CONSTRAINT uq_user_item UNIQUE ("userId", "itemType", "itemId")
);

CREATE INDEX IF NOT EXISTS idx_unlocked_items_user ON public.unlocked_items ("userId");
CREATE INDEX IF NOT EXISTS idx_unlocked_items_type ON public.unlocked_items ("itemType");
CREATE INDEX IF NOT EXISTS idx_unlocked_items_user_type ON public.unlocked_items ("userId", "itemType");

COMMENT ON TABLE public.unlocked_items IS 'Inventario normalizado de items desbloqueados';
COMMENT ON COLUMN public.unlocked_items."itemType" IS 'skin, effect, power, boss, pack, frame, board';

-- ==================================================================
-- TABLA 6: boss_defeats
-- ==================================================================
-- Registro de derrotas de bosses por universo
-- ==================================================================

CREATE TABLE IF NOT EXISTS public.boss_defeats (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "bossType" TEXT NOT NULL,
    universe TEXT NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    attempts INTEGER DEFAULT 1,
    "xpGained" INTEGER DEFAULT 200,
    "defeatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_boss_defeats_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE CASCADE,
    
    CONSTRAINT chk_boss_type CHECK ("bossType" IN ('caos', 'congelante', 'ilusion', 'neural', 'parasito')),
    CONSTRAINT chk_boss_universe CHECK (universe IN ('volcania', 'frostheim', 'neural', 'verdalis', 'lunaris'))
);

CREATE INDEX IF NOT EXISTS idx_boss_defeats_user ON public.boss_defeats ("userId");
CREATE INDEX IF NOT EXISTS idx_boss_defeats_boss ON public.boss_defeats ("bossType");
CREATE INDEX IF NOT EXISTS idx_boss_defeats_boss_universe ON public.boss_defeats ("bossType", universe);
CREATE INDEX IF NOT EXISTS idx_boss_defeats_defeated_at ON public.boss_defeats ("defeatedAt" DESC);

COMMENT ON TABLE public.boss_defeats IS 'Registro de bosses derrotados por usuario';
COMMENT ON COLUMN public.boss_defeats."bossType" IS 'caos, congelante, ilusion, neural, parasito';
COMMENT ON COLUMN public.boss_defeats.universe IS 'volcania, frostheim, neural, verdalis, lunaris';

-- ==================================================================
-- DATOS DE EJEMPLO: Achievements predefinidos
-- ==================================================================

INSERT INTO public.achievements (id, "achievementId", name, description, icon, "xpReward", category)
VALUES
    (gen_random_uuid()::TEXT, 'first_victory', 'Primera Victoria', 'Gana tu primera partida', '🏆', 100, 'progression'),
    (gen_random_uuid()::TEXT, 'combo_master', 'Maestro de Combos', 'Alcanza un combo de 10 o más', '🔥', 150, 'skill'),
    (gen_random_uuid()::TEXT, '100_games', '100 Partidas', 'Juega 100 partidas', '🎮', 200, 'progression'),
    (gen_random_uuid()::TEXT, 'perfect_game', 'Juego Perfecto', 'Completa una partida con 100% precisión', '⭐', 300, 'skill'),
    (gen_random_uuid()::TEXT, 'boss_hunter', 'Cazador de Jefes', 'Derrota tu primer boss', '👹', 250, 'progression'),
    (gen_random_uuid()::TEXT, 'speed_demon', 'Demonio de Velocidad', 'Completa una partida en menos de 2 minutos', '⚡', 200, 'skill'),
    (gen_random_uuid()::TEXT, 'collector', 'Coleccionista', 'Desbloquea 10 items diferentes', '🎁', 150, 'collection'),
    (gen_random_uuid()::TEXT, 'social_butterfly', 'Mariposa Social', 'Agrega 5 amigos', '🦋', 100, 'social')
ON CONFLICT ("achievementId") DO NOTHING;

-- ==================================================================
-- VALIDACIÓN: Verificar tablas creadas
-- ==================================================================

DO $$
DECLARE
    v_total_tables INT;
    v_table_name TEXT;
    v_expected_tables TEXT[] := ARRAY[
        'game_sessions',
        'achievements',
        'user_achievements',
        'leaderboard_entries',
        'unlocked_items',
        'boss_defeats'
    ];
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'VALIDACIÓN DE FASE 2: TABLAS DE ALTA PRIORIDAD';
    RAISE NOTICE '================================================================';
    
    -- Verificar cada tabla
    FOREACH v_table_name IN ARRAY v_expected_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name = v_table_name
        ) THEN
            RAISE NOTICE '✅ Tabla % existe', v_table_name;
        ELSE
            RAISE EXCEPTION '❌ Tabla % NO existe - VERIFICAR', v_table_name;
        END IF;
    END LOOP;
    
    -- Contar total de tablas
    SELECT COUNT(*) INTO v_total_tables
    FROM information_schema.tables
    WHERE table_schema = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total de tablas en la BD: %', v_total_tables;
    RAISE NOTICE 'Esperado mínimo: 13 (7 anteriores + 6 nuevas)';
    
    IF v_total_tables >= 13 THEN
        RAISE NOTICE '✅ Cantidad de tablas CORRECTA';
    ELSE
        RAISE WARNING '⚠️  Tablas faltantes (esperado >= 13, actual: %)', v_total_tables;
    END IF;
    
    -- Verificar achievements insertados
    SELECT COUNT(*) INTO v_total_tables FROM public.achievements;
    RAISE NOTICE '';
    RAISE NOTICE 'Logros predefinidos insertados: %', v_total_tables;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '🎉 FASE 2 COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximo paso: Actualizar backend para usar nuevas tablas';
    RAISE NOTICE 'Luego ejecutar FASE 3 (tablas de media prioridad)';
    RAISE NOTICE '';
END;
$$;

-- ==================================================================
-- ROLLBACK: En caso de problemas
-- ==================================================================

-- Para revertir (solo si algo sale mal):
/*
BEGIN;
DROP TABLE IF EXISTS public.boss_defeats CASCADE;
DROP TABLE IF EXISTS public.unlocked_items CASCADE;
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.game_sessions CASCADE;
COMMIT;
*/

-- Fin de FASE 2
