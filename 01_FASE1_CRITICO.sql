-- ============================================================
-- FASE 1: CORRECCIONES CRÍTICAS
-- ============================================================
-- Base de Datos: memorize (PostgreSQL 18)
-- Prioridad: P0 - CRÍTICO
-- Tiempo estimado: 15 minutos
-- Autor: Plan de Mejora Arquitectura Senior
-- Fecha: 2026-10-06
--
-- IMPORTANTE: Ejecutar PRIMERO antes que cualquier otra fase
-- Este script corrige problemas críticos que pueden causar
-- pérdida de datos o degradación de performance
-- ============================================================

-- ------------------------------------------------------------
-- CORRECCIÓN 1: Cambiar totalScore de INTEGER a BIGINT
-- ------------------------------------------------------------
-- Problema: INTEGER (32 bits) tiene max 2,147,483,647
-- Con muchas partidas, un jugador puede superar este límite
-- Solución: BIGINT (64 bits) max 9,223,372,036,854,775,807
-- ------------------------------------------------------------

BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'FASE 1 - CORRECCIÓN 1: Cambiando totalScore a BIGINT...';
    
    -- Verificar tipo actual
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'player_stats'
          AND column_name = 'totalScore'
          AND data_type = 'integer'
    ) THEN
        -- Cambiar a BIGINT
        ALTER TABLE public.player_stats 
        ALTER COLUMN "totalScore" TYPE BIGINT;
        
        RAISE NOTICE '✅ totalScore cambiado exitosamente a BIGINT';
    ELSE
        RAISE NOTICE '⚠️  totalScore ya es BIGINT o no existe';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ------------------------------------------------------------
-- CORRECCIÓN 2: Agregar índice compuesto en matches
-- ------------------------------------------------------------
-- Problema: Query lenta para historial de partidas por usuario
-- Consulta frecuente: WHERE userId = X ORDER BY createdAt DESC
-- Solución: Índice compuesto (userId, createdAt DESC)
-- ------------------------------------------------------------

BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'FASE 1 - CORRECCIÓN 2: Creando índice compuesto en matches...';
    
    -- Crear índice si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'matches'
          AND indexname = 'idx_matches_user_date'
    ) THEN
        CREATE INDEX idx_matches_user_date 
        ON public.matches ("userId", "createdAt" DESC);
        
        RAISE NOTICE '✅ Índice compuesto creado exitosamente';
    ELSE
        RAISE NOTICE '⚠️  Índice idx_matches_user_date ya existe';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ------------------------------------------------------------
-- CORRECCIÓN 3: Optimizar índice en player_stats
-- ------------------------------------------------------------
-- Agregar índice en userId para joins más rápidos
-- (Prisma no siempre genera este índice automáticamente)
-- ------------------------------------------------------------

BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'FASE 1 - CORRECCIÓN 3: Verificando índice en player_stats.userId...';
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'player_stats'
          AND indexname = 'idx_player_stats_user_id'
    ) THEN
        CREATE INDEX idx_player_stats_user_id 
        ON public.player_stats ("userId");
        
        RAISE NOTICE '✅ Índice en player_stats.userId creado';
    ELSE
        RAISE NOTICE '⚠️  Índice en player_stats.userId ya existe';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ------------------------------------------------------------
-- CORRECCIÓN 4: Optimizar índice en inventories
-- ------------------------------------------------------------

BEGIN;

DO $$
BEGIN
    RAISE NOTICE 'FASE 1 - CORRECCIÓN 4: Verificando índice en inventories.userId...';
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'inventories'
          AND indexname = 'idx_inventories_user_id'
    ) THEN
        CREATE INDEX idx_inventories_user_id 
        ON public.inventories ("userId");
        
        RAISE NOTICE '✅ Índice en inventories.userId creado';
    ELSE
        RAISE NOTICE '⚠️  Índice en inventories.userId ya existe';
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ------------------------------------------------------------
-- VALIDACIÓN: Verificar cambios aplicados
-- ------------------------------------------------------------

DO $$
DECLARE
    v_total_score_type TEXT;
    v_idx_matches INT;
    v_idx_stats INT;
    v_idx_inventory INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'VALIDACIÓN DE FASE 1: CORRECCIONES CRÍTICAS';
    RAISE NOTICE '============================================================';
    
    -- Verificar tipo de totalScore
    SELECT data_type INTO v_total_score_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'player_stats'
      AND column_name = 'totalScore';
    
    RAISE NOTICE 'totalScore tipo: %', v_total_score_type;
    
    IF v_total_score_type = 'bigint' THEN
        RAISE NOTICE '✅ totalScore es BIGINT - CORRECTO';
    ELSE
        RAISE EXCEPTION '❌ totalScore NO es BIGINT - VERIFICAR';
    END IF;
    
    -- Verificar índice en matches
    SELECT COUNT(*) INTO v_idx_matches
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'matches'
      AND indexname = 'idx_matches_user_date';
    
    IF v_idx_matches > 0 THEN
        RAISE NOTICE '✅ Índice en matches existe - CORRECTO';
    ELSE
        RAISE EXCEPTION '❌ Índice en matches NO existe - VERIFICAR';
    END IF;
    
    -- Verificar índice en player_stats
    SELECT COUNT(*) INTO v_idx_stats
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'player_stats'
      AND indexname = 'idx_player_stats_user_id';
    
    IF v_idx_stats > 0 THEN
        RAISE NOTICE '✅ Índice en player_stats existe - CORRECTO';
    ELSE
        RAISE NOTICE '⚠️  Índice en player_stats NO existe (no crítico)';
    END IF;
    
    -- Verificar índice en inventories
    SELECT COUNT(*) INTO v_idx_inventory
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'inventories'
      AND indexname = 'idx_inventories_user_id';
    
    IF v_idx_inventory > 0 THEN
        RAISE NOTICE '✅ Índice en inventories existe - CORRECTO';
    ELSE
        RAISE NOTICE '⚠️  Índice en inventories NO existe (no crítico)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '🎉 FASE 1 COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximo paso: Probar la aplicación y luego ejecutar FASE 2';
    RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- ROLLBACK: En caso de problemas, ejecutar esto
-- ------------------------------------------------------------

-- Para revertir cambios (solo si algo sale mal):
/*
BEGIN;
ALTER TABLE public.player_stats ALTER COLUMN "totalScore" TYPE INTEGER;
DROP INDEX IF EXISTS public.idx_matches_user_date;
DROP INDEX IF EXISTS public.idx_player_stats_user_id;
DROP INDEX IF EXISTS public.idx_inventories_user_id;
COMMIT;
*/

-- Fin de FASE 1
