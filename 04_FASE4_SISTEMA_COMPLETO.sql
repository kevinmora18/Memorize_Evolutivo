-- FASE 4: SISTEMA COMPLETO (11 tablas)
-- Social, Multijugador, Economía

-- MULTIJUGADOR
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    "creatorId" TEXT NOT NULL,
    "maxPlayers" INTEGER DEFAULT 10,
    "isStarted" BOOLEAN DEFAULT FALSE,
    "isFinished" BOOLEAN DEFAULT FALSE,
    "currentRound" INTEGER DEFAULT 1,
    "currentTeam" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT fk_rooms_creator FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms (code);
CREATE INDEX IF NOT EXISTS idx_rooms_creator ON public.rooms ("creatorId");
CREATE INDEX IF NOT EXISTS idx_rooms_started ON public.rooms ("isStarted");

CREATE TABLE IF NOT EXISTS public.room_players (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL CHECK ("teamId" IN (1, 2)),
    score INTEGER DEFAULT 0,
    "isReady" BOOLEAN DEFAULT FALSE,
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    CONSTRAINT fk_room_players_room FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_players_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players ("roomId");
CREATE INDEX IF NOT EXISTS idx_room_players_user ON public.room_players ("userId");
CREATE INDEX IF NOT EXISTS idx_room_players_room_team ON public.room_players ("roomId", "teamId");

-- SOCIAL
CREATE TABLE IF NOT EXISTS public.friendships (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    CONSTRAINT fk_friendships_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_friend FOREIGN KEY ("friendId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_friendship UNIQUE ("userId", "friendId")
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships ("userId");
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON public.friendships ("friendId");

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT fk_friend_requests_sender FOREIGN KEY ("senderId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friend_requests_receiver FOREIGN KEY ("receiverId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_friend_request UNIQUE ("senderId", "receiverId")
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests ("senderId");
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests ("receiverId");

-- NOTIFICACIONES
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    CONSTRAINT fk_notifications_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications ("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications ("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications ("createdAt" DESC);

-- ECONOMÍA
CREATE TABLE IF NOT EXISTS public.user_currency (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT UNIQUE NOT NULL,
    coins INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_currency_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_currency_user ON public.user_currency ("userId");

CREATE TABLE IF NOT EXISTS public.shop_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "itemId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "priceCoins" INTEGER DEFAULT 0,
    "priceGems" INTEGER DEFAULT 0,
    "isAvailable" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_items_item_id ON public.shop_items ("itemId");
CREATE INDEX IF NOT EXISTS idx_shop_items_available ON public.shop_items ("isAvailable");

CREATE TABLE IF NOT EXISTS public.user_purchases (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "currencyType" TEXT NOT NULL CHECK ("currencyType" IN ('coins', 'gems')),
    "purchasedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_purchases_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_purchases_item FOREIGN KEY ("itemId") REFERENCES public.shop_items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON public.user_purchases ("userId");
CREATE INDEX IF NOT EXISTS idx_user_purchases_item ON public.user_purchases ("itemId");

-- MISIONES DIARIAS
CREATE TABLE IF NOT EXISTS public.daily_missions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "missionId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    "missionType" TEXT NOT NULL,
    target INTEGER NOT NULL,
    "xpReward" INTEGER DEFAULT 0,
    "coinReward" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_missions_mission_id ON public.daily_missions ("missionId");
CREATE INDEX IF NOT EXISTS idx_daily_missions_active ON public.daily_missions ("isActive");

CREATE TABLE IF NOT EXISTS public.user_daily_missions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    "isCompleted" BOOLEAN DEFAULT FALSE,
    "isClaimed" BOOLEAN DEFAULT FALSE,
    "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),
    CONSTRAINT fk_user_daily_missions_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_daily_missions_mission FOREIGN KEY ("missionId") REFERENCES public.daily_missions(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_mission_date UNIQUE ("userId", "missionId", "assignedAt")
);

CREATE INDEX IF NOT EXISTS idx_user_daily_missions_user ON public.user_daily_missions ("userId");
CREATE INDEX IF NOT EXISTS idx_user_daily_missions_mission ON public.user_daily_missions ("missionId");

DO $$ BEGIN RAISE NOTICE 'FASE 4 COMPLETADA - Sistema completo implementado'; END $$;
