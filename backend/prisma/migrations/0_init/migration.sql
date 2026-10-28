-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'player',
    "banReason" TEXT,
    "bannedUntil" TIMESTAMP(3),
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "passwordHash" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "totalScore" BIGINT NOT NULL DEFAULT 0,
    "bestScore" INTEGER NOT NULL DEFAULT 0,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "perfectMatches" INTEGER NOT NULL DEFAULT 0,
    "maxCombo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownedPacks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownedFrames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownedSkins" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownedBoards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equippedPack" TEXT NOT NULL DEFAULT 'frutas',
    "equippedFrame" TEXT NOT NULL DEFAULT 'basic',
    "equippedSkin" TEXT NOT NULL DEFAULT 'classic',
    "equippedBoard" TEXT NOT NULL DEFAULT 'default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "level" INTEGER,
    "score" INTEGER NOT NULL,
    "accuracy" INTEGER,
    "combo" INTEGER,
    "timeLeft" INTEGER,
    "won" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "achievementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "xpReward" INTEGER DEFAULT 0,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boss_defeats" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "bossType" TEXT NOT NULL,
    "universe" TEXT NOT NULL,
    "timeTaken" INTEGER NOT NULL,
    "attempts" INTEGER DEFAULT 1,
    "xpGained" INTEGER DEFAULT 200,
    "defeatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boss_defeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_missions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "missionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "missionType" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "xpReward" INTEGER DEFAULT 0,
    "coinReward" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "gameMode" TEXT NOT NULL,
    "universe" TEXT,
    "levelReached" INTEGER,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxCombo" INTEGER DEFAULT 0,
    "timePlayed" INTEGER NOT NULL,
    "xpGained" INTEGER DEFAULT 0,
    "result" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "leaderboardType" TEXT NOT NULL,
    "score" BIGINT NOT NULL,
    "rank" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_players" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    "score" INTEGER DEFAULT 0,
    "isReady" BOOLEAN DEFAULT false,
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "room_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "maxPlayers" INTEGER DEFAULT 10,
    "isStarted" BOOLEAN DEFAULT false,
    "isFinished" BOOLEAN DEFAULT false,
    "currentRound" INTEGER DEFAULT 1,
    "currentTeam" INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_items" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "priceCoins" INTEGER DEFAULT 0,
    "priceGems" INTEGER DEFAULT 0,
    "isAvailable" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlocked_items" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unlocked_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER DEFAULT 0,
    "target" INTEGER NOT NULL,
    "isCompleted" BOOLEAN DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_currency" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "coins" INTEGER DEFAULT 0,
    "gems" INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_missions" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "progress" INTEGER DEFAULT 0,
    "isCompleted" BOOLEAN DEFAULT false,
    "isClaimed" BOOLEAN DEFAULT false,
    "assignedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "user_daily_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_purchases" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "currencyType" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "soundEnabled" BOOLEAN DEFAULT true,
    "musicEnabled" BOOLEAN DEFAULT true,
    "soundVolume" INTEGER DEFAULT 50,
    "musicVolume" INTEGER DEFAULT 50,
    "notificationsEnabled" BOOLEAN DEFAULT true,
    "language" TEXT DEFAULT 'es',
    "theme" TEXT DEFAULT 'dark',
    "selectedSkin" TEXT DEFAULT 'clasico',
    "selectedEffect" TEXT DEFAULT 'basico',
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_deleted" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "player_stats_userId_key" ON "player_stats"("userId");

-- CreateIndex
CREATE INDEX "idx_player_stats_user_id" ON "player_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "inventories_userId_key" ON "inventories"("userId");

-- CreateIndex
CREATE INDEX "idx_inventories_user_id" ON "inventories"("userId");

-- CreateIndex
CREATE INDEX "matches_userId_idx" ON "matches"("userId");

-- CreateIndex
CREATE INDEX "matches_createdAt_idx" ON "matches"("createdAt");

-- CreateIndex
CREATE INDEX "idx_matches_deleted" ON "matches"("deletedAt");

-- CreateIndex
CREATE INDEX "idx_matches_user_date" ON "matches"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "announcements_isActive_idx" ON "announcements"("isActive");

-- CreateIndex
CREATE INDEX "admin_logs_adminId_idx" ON "admin_logs"("adminId");

-- CreateIndex
CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");

-- CreateIndex
CREATE INDEX "promotions_isActive_idx" ON "promotions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_achievementId_key" ON "achievements"("achievementId");

-- CreateIndex
CREATE INDEX "idx_achievements_category" ON "achievements"("category");

-- CreateIndex
CREATE INDEX "idx_boss_defeats_boss" ON "boss_defeats"("bossType");

-- CreateIndex
CREATE INDEX "idx_boss_defeats_boss_universe" ON "boss_defeats"("bossType", "universe");

-- CreateIndex
CREATE INDEX "idx_boss_defeats_defeated_at" ON "boss_defeats"("defeatedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_boss_defeats_user" ON "boss_defeats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_missions_missionId_key" ON "daily_missions"("missionId");

-- CreateIndex
CREATE INDEX "idx_daily_missions_active" ON "daily_missions"("isActive");

-- CreateIndex
CREATE INDEX "idx_daily_missions_mission_id" ON "daily_missions"("missionId");

-- CreateIndex
CREATE INDEX "idx_friend_requests_receiver" ON "friend_requests"("receiverId");

-- CreateIndex
CREATE INDEX "idx_friend_requests_sender" ON "friend_requests"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_friend_request" ON "friend_requests"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "idx_friendships_friend" ON "friendships"("friendId");

-- CreateIndex
CREATE INDEX "idx_friendships_user" ON "friendships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_friendship" ON "friendships"("userId", "friendId");

-- CreateIndex
CREATE INDEX "idx_game_events_created" ON "game_events"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_game_events_session" ON "game_events"("sessionId");

-- CreateIndex
CREATE INDEX "idx_game_events_type" ON "game_events"("eventType");

-- CreateIndex
CREATE INDEX "idx_game_events_user" ON "game_events"("userId");

-- CreateIndex
CREATE INDEX "idx_game_sessions_mode" ON "game_sessions"("gameMode");

-- CreateIndex
CREATE INDEX "idx_game_sessions_started" ON "game_sessions"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_game_sessions_user" ON "game_sessions"("userId");

-- CreateIndex
CREATE INDEX "idx_game_sessions_user_mode" ON "game_sessions"("userId", "gameMode");

-- CreateIndex
CREATE INDEX "idx_leaderboard_type_rank" ON "leaderboard_entries"("leaderboardType", "rank");

-- CreateIndex
CREATE INDEX "idx_leaderboard_type_score" ON "leaderboard_entries"("leaderboardType", "score" DESC);

-- CreateIndex
CREATE INDEX "idx_leaderboard_user" ON "leaderboard_entries"("userId");

-- CreateIndex
CREATE INDEX "idx_notifications_created" ON "notifications"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_notifications_read" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "idx_notifications_user" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "idx_room_players_room" ON "room_players"("roomId");

-- CreateIndex
CREATE INDEX "idx_room_players_room_team" ON "room_players"("roomId", "teamId");

-- CreateIndex
CREATE INDEX "idx_room_players_user" ON "room_players"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "idx_rooms_code" ON "rooms"("code");

-- CreateIndex
CREATE INDEX "idx_rooms_creator" ON "rooms"("creatorId");

-- CreateIndex
CREATE INDEX "idx_rooms_started" ON "rooms"("isStarted");

-- CreateIndex
CREATE UNIQUE INDEX "shop_items_itemId_key" ON "shop_items"("itemId");

-- CreateIndex
CREATE INDEX "idx_shop_items_available" ON "shop_items"("isAvailable");

-- CreateIndex
CREATE INDEX "idx_shop_items_item_id" ON "shop_items"("itemId");

-- CreateIndex
CREATE INDEX "idx_unlocked_items_type" ON "unlocked_items"("itemType");

-- CreateIndex
CREATE INDEX "idx_unlocked_items_user" ON "unlocked_items"("userId");

-- CreateIndex
CREATE INDEX "idx_unlocked_items_user_type" ON "unlocked_items"("userId", "itemType");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_item" ON "unlocked_items"("userId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "idx_user_achievements_achievement" ON "user_achievements"("achievementId");

-- CreateIndex
CREATE INDEX "idx_user_achievements_completed" ON "user_achievements"("isCompleted");

-- CreateIndex
CREATE INDEX "idx_user_achievements_user" ON "user_achievements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_achievement" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "user_currency_userId_key" ON "user_currency"("userId");

-- CreateIndex
CREATE INDEX "idx_user_currency_user" ON "user_currency"("userId");

-- CreateIndex
CREATE INDEX "idx_user_daily_missions_mission" ON "user_daily_missions"("missionId");

-- CreateIndex
CREATE INDEX "idx_user_daily_missions_user" ON "user_daily_missions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_mission_date" ON "user_daily_missions"("userId", "missionId", "assignedAt");

-- CreateIndex
CREATE INDEX "idx_user_purchases_item" ON "user_purchases"("itemId");

-- CreateIndex
CREATE INDEX "idx_user_purchases_user" ON "user_purchases"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_userId_key" ON "user_settings"("userId");

-- CreateIndex
CREATE INDEX "idx_user_settings_user" ON "user_settings"("userId");

-- AddForeignKey
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventories" ADD CONSTRAINT "inventories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boss_defeats" ADD CONSTRAINT "fk_boss_defeats_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "fk_friend_requests_receiver" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "fk_friend_requests_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "fk_friendships_friend" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "fk_friendships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "fk_game_events_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "fk_game_events_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "game_sessions" ADD CONSTRAINT "fk_game_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "fk_leaderboard_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "fk_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "fk_room_players_room" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "room_players" ADD CONSTRAINT "fk_room_players_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "fk_rooms_creator" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "unlocked_items" ADD CONSTRAINT "fk_unlocked_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "fk_user_achievements_achievement" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "fk_user_achievements_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_currency" ADD CONSTRAINT "fk_user_currency_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_daily_missions" ADD CONSTRAINT "fk_user_daily_missions_mission" FOREIGN KEY ("missionId") REFERENCES "daily_missions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_daily_missions" ADD CONSTRAINT "fk_user_daily_missions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_purchases" ADD CONSTRAINT "fk_user_purchases_item" FOREIGN KEY ("itemId") REFERENCES "shop_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_purchases" ADD CONSTRAINT "fk_user_purchases_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "fk_user_settings_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

