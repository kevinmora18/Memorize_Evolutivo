--
-- PostgreSQL database dump
--

\restrict 9afIrhANJzA34VZENWTsaaGopsonfZPEZpBZ3nai0mXOnYxrpGbTZ8cffPYbTNW

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: fn_trg_achievement_reward(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_trg_achievement_reward() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: fn_trg_boss_reward(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_trg_boss_reward() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: fn_trg_matches_update_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_trg_matches_update_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: fn_trg_users_auto_create(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_trg_users_auto_create() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO public.player_stats (id, "userId", "updatedAt")
  VALUES (gen_random_uuid()::TEXT, NEW.id, NOW())
  ON CONFLICT ("userId") DO NOTHING;

  INSERT INTO public.inventories (id, "userId", "updatedAt")
  VALUES (gen_random_uuid()::TEXT, NEW.id, NOW())
  ON CONFLICT ("userId") DO NOTHING;

  RETURN NEW;
END;
$$;


--
-- Name: sp_give_currency(text, text, integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.sp_give_currency(IN p_admin_id text, IN p_target_id text, IN p_coins integer DEFAULT 0, IN p_gems integer DEFAULT 0, IN p_detail text DEFAULT NULL::text)
    LANGUAGE plpgsql
    AS $$
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


--
-- Name: sp_register_match(text, text, integer, boolean, integer, integer, integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.sp_register_match(IN p_user_id text, IN p_mode text, IN p_score integer, IN p_won boolean, IN p_level integer DEFAULT NULL::integer, IN p_accuracy integer DEFAULT NULL::integer, IN p_combo integer DEFAULT NULL::integer, IN p_timeleft integer DEFAULT NULL::integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'sp_register_match: usuario % no existe', p_user_id;
  END IF;

  INSERT INTO public.matches (id, "userId", mode, level, score, accuracy, combo, "timeLeft", won)
  VALUES (gen_random_uuid()::TEXT, p_user_id, p_mode, p_level, p_score, p_accuracy, p_combo, p_timeleft, COALESCE(p_won, false));
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "achievementId" text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text NOT NULL,
    "xpReward" integer DEFAULT 0,
    category text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_category CHECK ((category = ANY (ARRAY['progression'::text, 'skill'::text, 'collection'::text, 'social'::text])))
);


--
-- Name: TABLE achievements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.achievements IS 'Catálogo de logros del sistema';


--
-- Name: COLUMN achievements.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.category IS 'progression, skill, collection, social';


--
-- Name: admin_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_logs (
    id text NOT NULL,
    "adminId" text NOT NULL,
    action text NOT NULL,
    "targetId" text,
    details text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone
);


--
-- Name: boss_defeats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boss_defeats (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "bossType" text NOT NULL,
    universe text NOT NULL,
    "timeTaken" integer NOT NULL,
    attempts integer DEFAULT 1,
    "xpGained" integer DEFAULT 200,
    "defeatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_boss_type CHECK (("bossType" = ANY (ARRAY['caos'::text, 'congelante'::text, 'ilusion'::text, 'neural'::text, 'parasito'::text]))),
    CONSTRAINT chk_boss_universe CHECK ((universe = ANY (ARRAY['volcania'::text, 'frostheim'::text, 'neural'::text, 'verdalis'::text, 'lunaris'::text])))
);


--
-- Name: TABLE boss_defeats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.boss_defeats IS 'Registro de bosses derrotados por usuario';


--
-- Name: COLUMN boss_defeats."bossType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boss_defeats."bossType" IS 'caos, congelante, ilusion, neural, parasito';


--
-- Name: COLUMN boss_defeats.universe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.boss_defeats.universe IS 'volcania, frostheim, neural, verdalis, lunaris';


--
-- Name: daily_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_missions (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "missionId" text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "missionType" text NOT NULL,
    target integer NOT NULL,
    "xpReward" integer DEFAULT 0,
    "coinReward" integer DEFAULT 0,
    "isActive" boolean DEFAULT true,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friend_requests (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "senderId" text NOT NULL,
    "receiverId" text NOT NULL,
    status text DEFAULT 'pending'::text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" timestamp(3) without time zone,
    CONSTRAINT friend_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


--
-- Name: friendships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.friendships (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "friendId" text NOT NULL,
    status text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" timestamp(3) without time zone,
    CONSTRAINT friendships_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'blocked'::text])))
);


--
-- Name: game_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_events (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text,
    "sessionId" text,
    "eventType" text NOT NULL,
    "eventData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: game_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.game_sessions (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "gameMode" text NOT NULL,
    universe text,
    "levelReached" integer,
    score integer DEFAULT 0 NOT NULL,
    "maxCombo" integer DEFAULT 0,
    "timePlayed" integer NOT NULL,
    "xpGained" integer DEFAULT 0,
    result text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endedAt" timestamp(3) without time zone,
    CONSTRAINT chk_game_mode CHECK (("gameMode" = ANY (ARRAY['classic'::text, 'infinite'::text, 'challenge'::text, 'boss'::text, 'multiplayer'::text, 'ai-friends'::text]))),
    CONSTRAINT chk_result CHECK ((result = ANY (ARRAY['won'::text, 'lost'::text, 'abandoned'::text]))),
    CONSTRAINT chk_universe CHECK (((universe IS NULL) OR (universe = ANY (ARRAY['volcania'::text, 'frostheim'::text, 'neural'::text, 'verdalis'::text, 'lunaris'::text]))))
);


--
-- Name: TABLE game_sessions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.game_sessions IS 'Historial avanzado de partidas con analytics detallados';


--
-- Name: COLUMN game_sessions."gameMode"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_sessions."gameMode" IS 'classic, infinite, challenge, boss, multiplayer, ai-friends';


--
-- Name: COLUMN game_sessions.universe; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_sessions.universe IS 'volcania, frostheim, neural, verdalis, lunaris';


--
-- Name: COLUMN game_sessions.result; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.game_sessions.result IS 'won, lost, abandoned';


--
-- Name: inventories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventories (
    id text NOT NULL,
    "userId" text NOT NULL,
    "ownedPacks" text[] DEFAULT ARRAY[]::text[],
    "ownedFrames" text[] DEFAULT ARRAY[]::text[],
    "ownedSkins" text[] DEFAULT ARRAY[]::text[],
    "ownedBoards" text[] DEFAULT ARRAY[]::text[],
    "equippedPack" text DEFAULT 'frutas'::text NOT NULL,
    "equippedFrame" text DEFAULT 'basic'::text NOT NULL,
    "equippedSkin" text DEFAULT 'classic'::text NOT NULL,
    "equippedBoard" text DEFAULT 'default'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: leaderboard_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_entries (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "leaderboardType" text NOT NULL,
    score bigint NOT NULL,
    rank integer,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE leaderboard_entries; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.leaderboard_entries IS 'Rankings globales, semanales, por modo';


--
-- Name: COLUMN leaderboard_entries."leaderboardType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.leaderboard_entries."leaderboardType" IS 'global_xp, classic_score, infinite_score, boss_time, weekly_xp';


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id text NOT NULL,
    "userId" text NOT NULL,
    mode text NOT NULL,
    level integer,
    score integer NOT NULL,
    accuracy integer,
    combo integer,
    "timeLeft" integer,
    won boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "notificationType" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    "isRead" boolean DEFAULT false,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "readAt" timestamp(3) without time zone
);


--
-- Name: player_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_stats (
    id text NOT NULL,
    "userId" text NOT NULL,
    "gamesPlayed" integer DEFAULT 0 NOT NULL,
    "gamesWon" integer DEFAULT 0 NOT NULL,
    "totalScore" bigint DEFAULT 0 NOT NULL,
    "bestScore" integer DEFAULT 0 NOT NULL,
    "totalMatches" integer DEFAULT 0 NOT NULL,
    "perfectMatches" integer DEFAULT 0 NOT NULL,
    "maxCombo" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    value double precision NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: room_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_players (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "roomId" text NOT NULL,
    "userId" text NOT NULL,
    "teamId" integer NOT NULL,
    score integer DEFAULT 0,
    "isReady" boolean DEFAULT false,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "leftAt" timestamp(3) without time zone,
    CONSTRAINT "room_players_teamId_check" CHECK (("teamId" = ANY (ARRAY[1, 2])))
);


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rooms (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "creatorId" text NOT NULL,
    "maxPlayers" integer DEFAULT 10,
    "isStarted" boolean DEFAULT false,
    "isFinished" boolean DEFAULT false,
    "currentRound" integer DEFAULT 1,
    "currentTeam" integer DEFAULT 1,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "startedAt" timestamp(3) without time zone,
    "finishedAt" timestamp(3) without time zone
);


--
-- Name: shop_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shop_items (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "itemId" text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "itemType" text NOT NULL,
    "priceCoins" integer DEFAULT 0,
    "priceGems" integer DEFAULT 0,
    "isAvailable" boolean DEFAULT true,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: unlocked_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unlocked_items (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "itemType" text NOT NULL,
    "itemId" text NOT NULL,
    "unlockedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_item_type CHECK (("itemType" = ANY (ARRAY['skin'::text, 'effect'::text, 'power'::text, 'boss'::text, 'pack'::text, 'frame'::text, 'board'::text])))
);


--
-- Name: TABLE unlocked_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.unlocked_items IS 'Inventario normalizado de items desbloqueados';


--
-- Name: COLUMN unlocked_items."itemType"; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unlocked_items."itemType" IS 'skin, effect, power, boss, pack, frame, board';


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "achievementId" text NOT NULL,
    progress integer DEFAULT 0,
    target integer NOT NULL,
    "isCompleted" boolean DEFAULT false,
    "completedAt" timestamp(3) without time zone
);


--
-- Name: TABLE user_achievements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_achievements IS 'Progreso de logros por usuario (N:N)';


--
-- Name: user_currency; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_currency (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    coins integer DEFAULT 0,
    gems integer DEFAULT 0,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: user_daily_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_daily_missions (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "missionId" text NOT NULL,
    progress integer DEFAULT 0,
    "isCompleted" boolean DEFAULT false,
    "isClaimed" boolean DEFAULT false,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    "completedAt" timestamp(3) without time zone,
    "claimedAt" timestamp(3) without time zone
);


--
-- Name: user_purchases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_purchases (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "itemId" text NOT NULL,
    "pricePaid" integer NOT NULL,
    "currencyType" text NOT NULL,
    "purchasedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_purchases_currencyType_check" CHECK (("currencyType" = ANY (ARRAY['coins'::text, 'gems'::text])))
);


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "soundEnabled" boolean DEFAULT true,
    "musicEnabled" boolean DEFAULT true,
    "soundVolume" integer DEFAULT 50,
    "musicVolume" integer DEFAULT 50,
    "notificationsEnabled" boolean DEFAULT true,
    language text DEFAULT 'es'::text,
    theme text DEFAULT 'dark'::text,
    "selectedSkin" text DEFAULT 'clasico'::text,
    "selectedEffect" text DEFAULT 'basico'::text,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_settings_language_check CHECK ((language = ANY (ARRAY['es'::text, 'en'::text, 'pt'::text]))),
    CONSTRAINT "user_settings_musicVolume_check" CHECK ((("musicVolume" >= 0) AND ("musicVolume" <= 100))),
    CONSTRAINT "user_settings_soundVolume_check" CHECK ((("soundVolume" >= 0) AND ("soundVolume" <= 100))),
    CONSTRAINT user_settings_theme_check CHECK ((theme = ANY (ARRAY['dark'::text, 'light'::text, 'auto'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    username text,
    level integer DEFAULT 1 NOT NULL,
    xp integer DEFAULT 0 NOT NULL,
    coins integer DEFAULT 0 NOT NULL,
    gems integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role text DEFAULT 'player'::text NOT NULL,
    "banReason" text,
    "bannedUntil" timestamp(3) without time zone,
    "isBanned" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


--
-- Name: v_auditoria_admin; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_auditoria_admin AS
 SELECT l.id AS log_id,
    l."createdAt" AS fecha,
    l.action AS accion,
    a.username AS admin_usuario,
    a.email AS admin_email,
    t.username AS objetivo_usuario,
    l."targetId" AS objetivo_id,
    l.details AS detalle
   FROM ((public.admin_logs l
     JOIN public.users a ON ((a.id = l."adminId")))
     LEFT JOIN public.users t ON ((t.id = l."targetId")))
  ORDER BY l."createdAt" DESC;


--
-- Name: v_historial_partidas; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_historial_partidas AS
 SELECT m.id AS match_id,
    m."createdAt" AS fecha,
    u.username,
    u.email,
    m.mode AS modo,
    m.level AS nivel,
    m.score AS puntaje,
    m.accuracy AS "precision",
    m.combo,
    m."timeLeft" AS tiempo_restante,
    m.won AS ganada,
    m."userId" AS user_id
   FROM (public.matches m
     JOIN public.users u ON ((u.id = m."userId")))
  ORDER BY m."createdAt" DESC;


--
-- Name: v_inventario_jugador; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_inventario_jugador AS
 SELECT u.id AS user_id,
    u.username,
    u.email,
    u.level,
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
   FROM ((public.users u
     LEFT JOIN public.inventories i ON ((i."userId" = u.id)))
     LEFT JOIN public.player_stats ps ON ((ps."userId" = u.id)));


--
-- Name: v_ranking_global; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_ranking_global AS
 SELECT row_number() OVER (ORDER BY COALESCE(ps."totalScore", (0)::bigint) DESC, COALESCE(u.xp, 0) DESC) AS posicion,
    u.id AS user_id,
    u.email,
    u.username,
    u.level,
    u.xp,
    u.coins,
    u.gems,
    COALESCE(ps."gamesPlayed", 0) AS partidas,
    COALESCE(ps."gamesWon", 0) AS victorias,
    COALESCE(ps."totalScore", (0)::bigint) AS puntaje_total,
    COALESCE(ps."bestScore", 0) AS mejor_puntaje,
    COALESCE(ps."maxCombo", 0) AS max_combo
   FROM (public.users u
     LEFT JOIN public.player_stats ps ON ((ps."userId" = u.id)))
  WHERE (COALESCE(u."isBanned", false) = false)
  ORDER BY COALESCE(ps."totalScore", (0)::bigint) DESC, u.xp DESC;


--
-- Data for Name: achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.achievements (id, "achievementId", name, description, icon, "xpReward", category, "createdAt") FROM stdin;
4b113541-6f41-4e86-bd31-9bde1a32f82d	first_victory	Primera Victoria	Gana tu primera partida	🏆	100	progression	2026-10-06 09:31:14.943
b8706861-71df-4208-87ee-e88fc2cca529	combo_master	Maestro de Combos	Alcanza un combo de 10 o más	🔥	150	skill	2026-10-06 09:31:14.943
1c2914d2-8d38-4768-8a4d-96095688e2af	100_games	100 Partidas	Juega 100 partidas	🎮	200	progression	2026-10-06 09:31:14.943
8ed2856d-b76a-4584-8048-d4bf6473e528	perfect_game	Juego Perfecto	Completa una partida con 100% precisión	⭐	300	skill	2026-10-06 09:31:14.943
98b992c1-c5c6-4ab8-8cdf-9143734ce4c9	boss_hunter	Cazador de Jefes	Derrota tu primer boss	👹	250	progression	2026-10-06 09:31:14.943
c111b650-d430-4e5a-8b21-94d39d29dbaa	speed_demon	Demonio de Velocidad	Completa una partida en menos de 2 minutos	⚡	200	skill	2026-10-06 09:31:14.943
969a1fdb-8d7d-4062-b509-1295a33d42b5	collector	Coleccionista	Desbloquea 10 items diferentes	🎁	150	collection	2026-10-06 09:31:14.943
47e72263-d141-476d-945f-e726a7849548	social_butterfly	Mariposa Social	Agrega 5 amigos	🦋	100	social	2026-10-06 09:31:14.943
\.


--
-- Data for Name: admin_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_logs (id, "adminId", action, "targetId", details, "createdAt") FROM stdin;
8f44722f-3d33-42d5-8d5c-368d41d50e22	e354b097-3b06-4240-9354-63aa6d3bdc9b	give_currency	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	{"coins":1000,"gems":100}	2026-10-05 14:50:33.039
d6cf8cef-f617-4886-82a8-d5f0e30bb2ff	e354b097-3b06-4240-9354-63aa6d3bdc9b	create_announcement	2580bd97-56f4-4b33-a9dd-2183e92cf2d6	{"title":"Bienvenidos a Memorize Evolutivo","type":"info"}	2026-10-05 16:01:47.884
90a0e519-18df-47c8-8446-eee906fd400f	e354b097-3b06-4240-9354-63aa6d3bdc9b	create_promotion	b35c77be-fff0-4a73-874e-06351c2972df	{"name":"Doble XP fin de semana","type":"coins_multiplier","value":2}	2026-10-05 16:02:41.174
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, message, type, "isActive", "createdAt", "expiresAt") FROM stdin;
2580bd97-56f4-4b33-a9dd-2183e92cf2d6	Bienvenidos a Memorize Evolutivo	Servidor en linea: juega, gana XP y sube de rango	info	t	2026-10-05 16:01:47.88	\N
\.


--
-- Data for Name: boss_defeats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.boss_defeats (id, "userId", "bossType", universe, "timeTaken", attempts, "xpGained", "defeatedAt") FROM stdin;
\.


--
-- Data for Name: daily_missions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_missions (id, "missionId", name, description, "missionType", target, "xpReward", "coinReward", "isActive", "createdAt") FROM stdin;
\.


--
-- Data for Name: friend_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.friend_requests (id, "senderId", "receiverId", status, "createdAt", "respondedAt") FROM stdin;
\.


--
-- Data for Name: friendships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.friendships (id, "userId", "friendId", status, "createdAt", "acceptedAt") FROM stdin;
\.


--
-- Data for Name: game_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.game_events (id, "userId", "sessionId", "eventType", "eventData", "createdAt") FROM stdin;
\.


--
-- Data for Name: game_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.game_sessions (id, "userId", "gameMode", universe, "levelReached", score, "maxCombo", "timePlayed", "xpGained", result, "startedAt", "endedAt") FROM stdin;
\.


--
-- Data for Name: inventories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventories (id, "userId", "ownedPacks", "ownedFrames", "ownedSkins", "ownedBoards", "equippedPack", "equippedFrame", "equippedSkin", "equippedBoard", "createdAt", "updatedAt") FROM stdin;
b6f521d3-0509-468d-ba8b-e8f3097ea098	e354b097-3b06-4240-9354-63aa6d3bdc9b	{frutas,animales}	{basic}	{classic}	{default}	frutas	basic	classic	default	2026-10-05 04:00:53.672	2026-10-05 04:00:53.672
d3e93fcf-f8b1-4c99-97ed-fd891a21bc95	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	{frutas}	{basic}	{classic}	{default}	frutas	basic	classic	default	2026-10-05 04:00:53.672	2026-10-05 04:00:53.672
\.


--
-- Data for Name: leaderboard_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leaderboard_entries (id, "userId", "leaderboardType", score, rank, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matches (id, "userId", mode, level, score, accuracy, combo, "timeLeft", won, "createdAt", "deletedAt") FROM stdin;
b42a216d-691e-436d-a993-cda6f287806e	e354b097-3b06-4240-9354-63aa6d3bdc9b	classic	1	1250	92	8	45	t	2026-10-05 14:45:42.35	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, "userId", "notificationType", title, message, data, "isRead", "createdAt", "readAt") FROM stdin;
\.


--
-- Data for Name: player_stats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_stats (id, "userId", "gamesPlayed", "gamesWon", "totalScore", "bestScore", "totalMatches", "perfectMatches", "maxCombo", "createdAt", "updatedAt") FROM stdin;
d1c9db5a-6ab9-48dd-b7bc-eeded0ef9660	e354b097-3b06-4240-9354-63aa6d3bdc9b	1	1	1250	1250	12	3	8	2026-10-05 15:56:21.606	2026-10-05 15:56:21.611
803d921f-6ea3-4019-a37d-5a8d30c4858a	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	1	1	1250	1250	12	3	8	2026-10-05 15:57:04.357	2026-10-05 15:57:04.359
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotions (id, name, description, type, value, "isActive", "startDate", "endDate", "createdAt") FROM stdin;
b35c77be-fff0-4a73-874e-06351c2972df	Doble XP fin de semana	Gana el doble de XP en todos los modos	coins_multiplier	2	t	2026-10-01 00:00:00	2026-10-31 23:59:59	2026-10-05 16:02:41.167
\.


--
-- Data for Name: room_players; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.room_players (id, "roomId", "userId", "teamId", score, "isReady", "joinedAt", "leftAt") FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rooms (id, name, code, "creatorId", "maxPlayers", "isStarted", "isFinished", "currentRound", "currentTeam", "createdAt", "startedAt", "finishedAt") FROM stdin;
\.


--
-- Data for Name: shop_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shop_items (id, "itemId", name, description, "itemType", "priceCoins", "priceGems", "isAvailable", "createdAt") FROM stdin;
\.


--
-- Data for Name: unlocked_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unlocked_items (id, "userId", "itemType", "itemId", "unlockedAt") FROM stdin;
41b61954-5a4b-4e1e-9e21-485b28c63b42	e354b097-3b06-4240-9354-63aa6d3bdc9b	pack	frutas	2026-10-06 09:33:38.969
da08dde8-75eb-49d9-beab-2a92f6051022	e354b097-3b06-4240-9354-63aa6d3bdc9b	pack	animales	2026-10-06 09:33:38.969
32c437e7-d69e-41b1-8324-932c2a40b518	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	pack	frutas	2026-10-06 09:33:38.969
11c6dd2f-1c58-4ddc-83f0-051487c4c89b	e354b097-3b06-4240-9354-63aa6d3bdc9b	skin	classic	2026-10-06 09:33:38.983
1250daa5-3a72-4b0d-970a-dee1945b7b76	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	skin	classic	2026-10-06 09:33:38.983
\.


--
-- Data for Name: user_achievements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_achievements (id, "userId", "achievementId", progress, target, "isCompleted", "completedAt") FROM stdin;
\.


--
-- Data for Name: user_currency; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_currency (id, "userId", coins, gems, "updatedAt") FROM stdin;
24fc14e8-8787-4bb5-b033-01dc79dbbf6c	59f90123-c27d-4ba9-9160-5b6d5bdb0d32	500	50	2026-10-06 09:33:38.989
c46c1d9d-4984-4aa2-b03c-110913027214	e354b097-3b06-4240-9354-63aa6d3bdc9b	687	50	2026-10-06 09:33:38.989
50833478-ee9f-49c4-b5c8-df4e36c9d69c	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	1000	100	2026-10-06 09:33:38.989
\.


--
-- Data for Name: user_daily_missions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_daily_missions (id, "userId", "missionId", progress, "isCompleted", "isClaimed", "assignedAt", "completedAt", "claimedAt") FROM stdin;
\.


--
-- Data for Name: user_purchases; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_purchases (id, "userId", "itemId", "pricePaid", "currencyType", "purchasedAt") FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_settings (id, "userId", "soundEnabled", "musicEnabled", "soundVolume", "musicVolume", "notificationsEnabled", language, theme, "selectedSkin", "selectedEffect", "updatedAt") FROM stdin;
169bb00d-2143-4ad3-83c0-53ce5a25ed2c	59f90123-c27d-4ba9-9160-5b6d5bdb0d32	t	t	50	50	t	es	dark	clasico	basico	2026-10-06 09:33:38.984
8b15dae5-1e9b-43fe-9c65-572e2c7916c2	e354b097-3b06-4240-9354-63aa6d3bdc9b	t	t	50	50	t	es	dark	clasico	basico	2026-10-06 09:33:38.984
872dfa4a-c6e2-4996-b05d-f4be229d18d4	6dbca2da-dcaf-4741-8efc-60de2f9eddd4	t	t	50	50	t	es	dark	clasico	basico	2026-10-06 09:33:38.984
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, username, level, xp, coins, gems, "createdAt", "updatedAt", role, "banReason", "bannedUntil", "isBanned", "deletedAt") FROM stdin;
59f90123-c27d-4ba9-9160-5b6d5bdb0d32	kevinmora2838@gmail.com	kevin	1	0	500	50	2026-09-14 02:05:17.863	2026-09-14 02:05:17.863	player	\N	\N	f	\N
e354b097-3b06-4240-9354-63aa6d3bdc9b	evidencia.backend@universidad.edu	evidencia.backend	2	25	687	50	2026-10-05 14:44:29.052	2026-10-05 15:56:21.61	admin	\N	\N	f	\N
6dbca2da-dcaf-4741-8efc-60de2f9eddd4	rival.evidencia@universidad.edu	rival.evidencia	1	0	1000	100	2026-10-05 14:45:42.112	2026-10-05 15:57:04.359	player	\N	\N	f	\N
\.


--
-- Name: achievements achievements_achievementId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT "achievements_achievementId_key" UNIQUE ("achievementId");


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: admin_logs admin_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT admin_logs_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: boss_defeats boss_defeats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boss_defeats
    ADD CONSTRAINT boss_defeats_pkey PRIMARY KEY (id);


--
-- Name: daily_missions daily_missions_missionId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT "daily_missions_missionId_key" UNIQUE ("missionId");


--
-- Name: daily_missions daily_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_missions
    ADD CONSTRAINT daily_missions_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: friendships friendships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT friendships_pkey PRIMARY KEY (id);


--
-- Name: game_events game_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT game_events_pkey PRIMARY KEY (id);


--
-- Name: game_sessions game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT game_sessions_pkey PRIMARY KEY (id);


--
-- Name: inventories inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


--
-- Name: leaderboard_entries leaderboard_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT leaderboard_entries_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: player_stats player_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT player_stats_pkey PRIMARY KEY (id);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: room_players room_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_players
    ADD CONSTRAINT room_players_pkey PRIMARY KEY (id);


--
-- Name: rooms rooms_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_code_key UNIQUE (code);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);


--
-- Name: shop_items shop_items_itemId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT "shop_items_itemId_key" UNIQUE ("itemId");


--
-- Name: shop_items shop_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shop_items
    ADD CONSTRAINT shop_items_pkey PRIMARY KEY (id);


--
-- Name: unlocked_items unlocked_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unlocked_items
    ADD CONSTRAINT unlocked_items_pkey PRIMARY KEY (id);


--
-- Name: friend_requests uq_friend_request; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT uq_friend_request UNIQUE ("senderId", "receiverId");


--
-- Name: friendships uq_friendship; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT uq_friendship UNIQUE ("userId", "friendId");


--
-- Name: user_achievements uq_user_achievement; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT uq_user_achievement UNIQUE ("userId", "achievementId");


--
-- Name: unlocked_items uq_user_item; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unlocked_items
    ADD CONSTRAINT uq_user_item UNIQUE ("userId", "itemType", "itemId");


--
-- Name: user_daily_missions uq_user_mission_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT uq_user_mission_date UNIQUE ("userId", "missionId", "assignedAt");


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_currency user_currency_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_currency
    ADD CONSTRAINT user_currency_pkey PRIMARY KEY (id);


--
-- Name: user_currency user_currency_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_currency
    ADD CONSTRAINT "user_currency_userId_key" UNIQUE ("userId");


--
-- Name: user_daily_missions user_daily_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT user_daily_missions_pkey PRIMARY KEY (id);


--
-- Name: user_purchases user_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_purchases
    ADD CONSTRAINT user_purchases_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_userId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT "user_settings_userId_key" UNIQUE ("userId");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_logs_adminId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "admin_logs_adminId_idx" ON public.admin_logs USING btree ("adminId");


--
-- Name: admin_logs_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "admin_logs_createdAt_idx" ON public.admin_logs USING btree ("createdAt");


--
-- Name: announcements_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "announcements_isActive_idx" ON public.announcements USING btree ("isActive");


--
-- Name: idx_achievements_achievement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_achievements_achievement_id ON public.achievements USING btree ("achievementId");


--
-- Name: idx_achievements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_achievements_category ON public.achievements USING btree (category);


--
-- Name: idx_boss_defeats_boss; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_defeats_boss ON public.boss_defeats USING btree ("bossType");


--
-- Name: idx_boss_defeats_boss_universe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_defeats_boss_universe ON public.boss_defeats USING btree ("bossType", universe);


--
-- Name: idx_boss_defeats_defeated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_defeats_defeated_at ON public.boss_defeats USING btree ("defeatedAt" DESC);


--
-- Name: idx_boss_defeats_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_defeats_user ON public.boss_defeats USING btree ("userId");


--
-- Name: idx_daily_missions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_missions_active ON public.daily_missions USING btree ("isActive");


--
-- Name: idx_daily_missions_mission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_missions_mission_id ON public.daily_missions USING btree ("missionId");


--
-- Name: idx_friend_requests_receiver; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests USING btree ("receiverId");


--
-- Name: idx_friend_requests_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friend_requests_sender ON public.friend_requests USING btree ("senderId");


--
-- Name: idx_friendships_friend; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendships_friend ON public.friendships USING btree ("friendId");


--
-- Name: idx_friendships_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_friendships_user ON public.friendships USING btree ("userId");


--
-- Name: idx_game_events_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_events_created ON public.game_events USING btree ("createdAt" DESC);


--
-- Name: idx_game_events_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_events_session ON public.game_events USING btree ("sessionId");


--
-- Name: idx_game_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_events_type ON public.game_events USING btree ("eventType");


--
-- Name: idx_game_events_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_events_user ON public.game_events USING btree ("userId");


--
-- Name: idx_game_sessions_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_mode ON public.game_sessions USING btree ("gameMode");


--
-- Name: idx_game_sessions_started; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_started ON public.game_sessions USING btree ("startedAt" DESC);


--
-- Name: idx_game_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_user ON public.game_sessions USING btree ("userId");


--
-- Name: idx_game_sessions_user_mode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_sessions_user_mode ON public.game_sessions USING btree ("userId", "gameMode");


--
-- Name: idx_inventories_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventories_user_id ON public.inventories USING btree ("userId");


--
-- Name: idx_leaderboard_type_rank; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_type_rank ON public.leaderboard_entries USING btree ("leaderboardType", rank);


--
-- Name: idx_leaderboard_type_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_type_score ON public.leaderboard_entries USING btree ("leaderboardType", score DESC);


--
-- Name: idx_leaderboard_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_user ON public.leaderboard_entries USING btree ("userId");


--
-- Name: idx_matches_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_deleted ON public.matches USING btree ("deletedAt");


--
-- Name: idx_matches_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_matches_user_date ON public.matches USING btree ("userId", "createdAt" DESC);


--
-- Name: idx_notifications_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created ON public.notifications USING btree ("createdAt" DESC);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree ("isRead");


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree ("userId");


--
-- Name: idx_player_stats_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_stats_user_id ON public.player_stats USING btree ("userId");


--
-- Name: idx_room_players_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_players_room ON public.room_players USING btree ("roomId");


--
-- Name: idx_room_players_room_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_players_room_team ON public.room_players USING btree ("roomId", "teamId");


--
-- Name: idx_room_players_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_room_players_user ON public.room_players USING btree ("userId");


--
-- Name: idx_rooms_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_code ON public.rooms USING btree (code);


--
-- Name: idx_rooms_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_creator ON public.rooms USING btree ("creatorId");


--
-- Name: idx_rooms_started; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rooms_started ON public.rooms USING btree ("isStarted");


--
-- Name: idx_shop_items_available; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shop_items_available ON public.shop_items USING btree ("isAvailable");


--
-- Name: idx_shop_items_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_shop_items_item_id ON public.shop_items USING btree ("itemId");


--
-- Name: idx_unlocked_items_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unlocked_items_type ON public.unlocked_items USING btree ("itemType");


--
-- Name: idx_unlocked_items_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unlocked_items_user ON public.unlocked_items USING btree ("userId");


--
-- Name: idx_unlocked_items_user_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unlocked_items_user_type ON public.unlocked_items USING btree ("userId", "itemType");


--
-- Name: idx_user_achievements_achievement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_achievements_achievement ON public.user_achievements USING btree ("achievementId");


--
-- Name: idx_user_achievements_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_achievements_completed ON public.user_achievements USING btree ("isCompleted");


--
-- Name: idx_user_achievements_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_achievements_user ON public.user_achievements USING btree ("userId");


--
-- Name: idx_user_currency_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_currency_user ON public.user_currency USING btree ("userId");


--
-- Name: idx_user_daily_missions_mission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_daily_missions_mission ON public.user_daily_missions USING btree ("missionId");


--
-- Name: idx_user_daily_missions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_daily_missions_user ON public.user_daily_missions USING btree ("userId");


--
-- Name: idx_user_purchases_item; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_purchases_item ON public.user_purchases USING btree ("itemId");


--
-- Name: idx_user_purchases_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_purchases_user ON public.user_purchases USING btree ("userId");


--
-- Name: idx_user_settings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_settings_user ON public.user_settings USING btree ("userId");


--
-- Name: idx_users_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_deleted ON public.users USING btree ("deletedAt");


--
-- Name: inventories_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "inventories_userId_key" ON public.inventories USING btree ("userId");


--
-- Name: matches_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "matches_createdAt_idx" ON public.matches USING btree ("createdAt");


--
-- Name: matches_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "matches_userId_idx" ON public.matches USING btree ("userId");


--
-- Name: player_stats_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "player_stats_userId_key" ON public.player_stats USING btree ("userId");


--
-- Name: promotions_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "promotions_isActive_idx" ON public.promotions USING btree ("isActive");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: boss_defeats trg_boss_defeats_reward; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_boss_defeats_reward AFTER INSERT ON public.boss_defeats FOR EACH ROW EXECUTE FUNCTION public.fn_trg_boss_reward();


--
-- Name: matches trg_matches_update_stats; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_matches_update_stats AFTER INSERT ON public.matches FOR EACH ROW EXECUTE FUNCTION public.fn_trg_matches_update_stats();


--
-- Name: user_achievements trg_user_achievements_reward; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_user_achievements_reward AFTER UPDATE ON public.user_achievements FOR EACH ROW EXECUTE FUNCTION public.fn_trg_achievement_reward();


--
-- Name: users trg_users_auto_create; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_users_auto_create AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.fn_trg_users_auto_create();


--
-- Name: admin_logs admin_logs_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_logs
    ADD CONSTRAINT "admin_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: boss_defeats fk_boss_defeats_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boss_defeats
    ADD CONSTRAINT fk_boss_defeats_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests fk_friend_requests_receiver; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT fk_friend_requests_receiver FOREIGN KEY ("receiverId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests fk_friend_requests_sender; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT fk_friend_requests_sender FOREIGN KEY ("senderId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships fk_friendships_friend; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT fk_friendships_friend FOREIGN KEY ("friendId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friendships fk_friendships_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.friendships
    ADD CONSTRAINT fk_friendships_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: game_events fk_game_events_session; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT fk_game_events_session FOREIGN KEY ("sessionId") REFERENCES public.game_sessions(id) ON DELETE CASCADE;


--
-- Name: game_events fk_game_events_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_events
    ADD CONSTRAINT fk_game_events_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: game_sessions fk_game_sessions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_sessions
    ADD CONSTRAINT fk_game_sessions_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leaderboard_entries fk_leaderboard_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT fk_leaderboard_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: room_players fk_room_players_room; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_players
    ADD CONSTRAINT fk_room_players_room FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON DELETE CASCADE;


--
-- Name: room_players fk_room_players_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_players
    ADD CONSTRAINT fk_room_players_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: rooms fk_rooms_creator; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT fk_rooms_creator FOREIGN KEY ("creatorId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: unlocked_items fk_unlocked_items_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unlocked_items
    ADD CONSTRAINT fk_unlocked_items_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_achievements fk_user_achievements_achievement; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT fk_user_achievements_achievement FOREIGN KEY ("achievementId") REFERENCES public.achievements(id) ON DELETE CASCADE;


--
-- Name: user_achievements fk_user_achievements_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT fk_user_achievements_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_currency fk_user_currency_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_currency
    ADD CONSTRAINT fk_user_currency_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_daily_missions fk_user_daily_missions_mission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT fk_user_daily_missions_mission FOREIGN KEY ("missionId") REFERENCES public.daily_missions(id) ON DELETE CASCADE;


--
-- Name: user_daily_missions fk_user_daily_missions_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_daily_missions
    ADD CONSTRAINT fk_user_daily_missions_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_purchases fk_user_purchases_item; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_purchases
    ADD CONSTRAINT fk_user_purchases_item FOREIGN KEY ("itemId") REFERENCES public.shop_items(id) ON DELETE CASCADE;


--
-- Name: user_purchases fk_user_purchases_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_purchases
    ADD CONSTRAINT fk_user_purchases_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings fk_user_settings_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT fk_user_settings_user FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: inventories inventories_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT "inventories_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: matches matches_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT "matches_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_stats player_stats_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_stats
    ADD CONSTRAINT "player_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9afIrhANJzA34VZENWTsaaGopsonfZPEZpBZ3nai0mXOnYxrpGbTZ8cffPYbTNW

