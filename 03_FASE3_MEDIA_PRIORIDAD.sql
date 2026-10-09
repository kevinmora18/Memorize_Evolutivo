-- FASE 3: TABLAS DE PRIORIDAD MEDIA
-- 2 tablas: user_settings, game_events

CREATE TABLE IF NOT EXISTS public.user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT UNIQUE NOT NULL,
    "soundEnabled" BOOLEAN DEFAULT TRUE,
    "musicEnabled" BOOLEAN DEFAULT TRUE,
    "soundVolume" INTEGER DEFAULT 50 CHECK ("soundVolume" BETWEEN 0 AND 100),
    "musicVolume" INTEGER DEFAULT 50 CHECK ("musicVolume" BETWEEN 0 AND 100),
    "notificationsEnabled" BOOLEAN DEFAULT TRUE,
    language TEXT DEFAULT 'es' CHECK (language IN ('es', 'en', 'pt')),
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
    "selectedSkin" TEXT DEFAULT 'clasico',
    "selectedEffect" TEXT DEFAULT 'basico',
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_user_settings_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings ("userId");

CREATE TABLE IF NOT EXISTS public.game_events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_game_events_user FOREIGN KEY ("userId") 
        REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_game_events_session FOREIGN KEY ("sessionId") 
        REFERENCES public.game_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_game_events_user ON public.game_events ("userId");
CREATE INDEX IF NOT EXISTS idx_game_events_session ON public.game_events ("sessionId");
CREATE INDEX IF NOT EXISTS idx_game_events_type ON public.game_events ("eventType");
CREATE INDEX IF NOT EXISTS idx_game_events_created ON public.game_events ("createdAt" DESC);

-- Agregar soft delete a users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON public.users ("deletedAt");

-- Agregar soft delete a matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS idx_matches_deleted ON public.matches ("deletedAt");

DO $$ BEGIN RAISE NOTICE 'FASE 3 COMPLETADA'; END $$;
