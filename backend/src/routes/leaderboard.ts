import { Router } from 'express';
import { prisma } from '../index';
import { clampLimit } from '../core/validation/schemas';

const router = Router();

// NOTA DE SEGURIDAD: las respuestas del leaderboard son públicas y NO deben
// incluir email u otros datos personales de los jugadores (solo username).
// Tampoco deben listar cuentas eliminadas (soft-delete) ni baneadas.

const ACTIVE_USER = { deletedAt: null, isBanned: false } as const;

const VALID_TYPES = ['xp', 'level', 'coins', 'wins', 'score'] as const;
type LeaderboardType = (typeof VALID_TYPES)[number];

const VALID_PERIODS = ['all', 'weekly', 'monthly'] as const;
type LeaderboardPeriod = (typeof VALID_PERIODS)[number];

const VALID_MODES = ['classic', 'infinite', 'challenge', 'boss', 'multiplayer', 'ai-friends'];

function parseType(raw: unknown): LeaderboardType {
  return VALID_TYPES.includes(raw as LeaderboardType) ? (raw as LeaderboardType) : 'xp';
}

function parsePeriod(raw: unknown): LeaderboardPeriod {
  return VALID_PERIODS.includes(raw as LeaderboardPeriod) ? (raw as LeaderboardPeriod) : 'all';
}

function parseMode(raw: unknown): string | undefined {
  return typeof raw === 'string' && VALID_MODES.includes(raw) ? raw : undefined;
}

/** Inicio del periodo solicitado (null = histórico completo). */
function periodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  if (period === 'weekly') {
    const start = new Date(now);
    const dayFromMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayFromMonday);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return null;
}

interface AggregatedEntry {
  rank: number;
  id: string;
  username: string | null;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  totalScore: number;
  maxCombo: number;
}

type RankBy = 'wins' | 'score' | 'total';

/**
 * Agrega partidas por usuario. Se usa para rankings por modo y por periodo,
 * donde `player_stats` (acumulado global) no puede responder la consulta.
 */
async function aggregateMatches(options: {
  mode?: string;
  since?: Date;
  limit?: number;
  rankBy: RankBy;
}): Promise<AggregatedEntry[]> {
  const matches = await prisma.match.findMany({
    where: {
      ...(options.mode ? { mode: options.mode } : {}),
      ...(options.since ? { createdAt: { gte: options.since } } : {}),
      user: ACTIVE_USER,
    },
    select: {
      userId: true,
      score: true,
      won: true,
      combo: true,
      user: {
        select: {
          id: true,
          username: true,
          level: true,
          xp: true,
          coins: true,
          gems: true,
        },
      },
    },
  });

  const byUser = new Map<string, Omit<AggregatedEntry, 'rank'>>();

  for (const match of matches) {
    let entry = byUser.get(match.userId);
    if (!entry) {
      entry = {
        id: match.userId,
        username: match.user.username,
        level: match.user.level,
        xp: match.user.xp,
        coins: match.user.coins,
        gems: match.user.gems,
        gamesPlayed: 0,
        gamesWon: 0,
        bestScore: 0,
        totalScore: 0,
        maxCombo: 0,
      };
      byUser.set(match.userId, entry);
    }

    entry.gamesPlayed += 1;
    entry.totalScore += match.score;
    if (match.won) entry.gamesWon += 1;
    if (match.score > entry.bestScore) entry.bestScore = match.score;
    if (match.combo > entry.maxCombo) entry.maxCombo = match.combo;
  }

  const sorted = Array.from(byUser.values()).sort((a, b) => {
    if (options.rankBy === 'wins') {
      return b.gamesWon - a.gamesWon || b.totalScore - a.totalScore;
    }
    if (options.rankBy === 'score') {
      return b.bestScore - a.bestScore || b.totalScore - a.totalScore;
    }
    return b.totalScore - a.totalScore || b.gamesWon - a.gamesWon;
  });

  const limited = typeof options.limit === 'number' ? sorted.slice(0, options.limit) : sorted;

  return limited.map((entry, index) => ({ rank: index + 1, ...entry }));
}

function rankByFor(type: LeaderboardType): RankBy {
  if (type === 'wins') return 'wins';
  if (type === 'score') return 'score';
  return 'total';
}

// GET /api/leaderboard - Obtener ranking global
router.get('/', async (req, res) => {
  try {
    const type = parseType(req.query.type);
    const period = parsePeriod(req.query.period);
    const mode = parseMode(req.query.mode);
    const limit = clampLimit(req.query.limit, 50, 100);

    // Rankings por modo o por periodo se calculan desde las partidas.
    if (period !== 'all' || mode) {
      const leaderboard = await aggregateMatches({
        mode,
        since: periodStart(period) ?? undefined,
        limit,
        rankBy: rankByFor(type),
      });

      return res.json({
        type,
        period,
        mode: mode ?? null,
        leaderboard,
        total: leaderboard.length,
      });
    }

    // Rankings históricos por victorias / mejor score: player_stats es la fuente.
    if (type === 'wins' || type === 'score') {
      const statsList = await prisma.playerStats.findMany({
        where: { user: ACTIVE_USER },
        orderBy:
          type === 'wins'
            ? [{ gamesWon: 'desc' }, { bestScore: 'desc' }]
            : [{ bestScore: 'desc' }, { gamesWon: 'desc' }],
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              level: true,
              xp: true,
              coins: true,
              gems: true,
            },
          },
        },
      });

      const leaderboard = statsList.map((st, index) => ({
        rank: index + 1,
        id: st.userId,
        username: st.user.username,
        level: st.user.level,
        xp: st.user.xp,
        coins: st.user.coins,
        gems: st.user.gems,
        gamesPlayed: st.gamesPlayed,
        gamesWon: st.gamesWon,
        bestScore: st.bestScore,
        totalScore: Number(st.totalScore),
        maxCombo: st.maxCombo,
      }));

      return res.json({
        type,
        period,
        mode: null,
        leaderboard,
        total: leaderboard.length,
      });
    }

    // XP, nivel y monedas: consulta directa a users.
    const orderBy =
      type === 'level' ? { level: 'desc' as const } : type === 'coins' ? { coins: 'desc' as const } : { xp: 'desc' as const };

    const users = await prisma.user.findMany({
      where: ACTIVE_USER,
      orderBy,
      take: limit,
      include: { stats: true },
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      username: user.username,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      gems: user.gems,
      gamesPlayed: user.stats?.gamesPlayed || 0,
      gamesWon: user.stats?.gamesWon || 0,
      bestScore: user.stats?.bestScore || 0,
      totalScore: Number(user.stats?.totalScore || 0),
      maxCombo: user.stats?.maxCombo || 0,
    }));

    res.json({
      type,
      period,
      mode: null,
      leaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Error obteniendo leaderboard:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/leaderboard/user/:userId - Obtener posición de un usuario específico
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const type = parseType(req.query.type);
    const period = parsePeriod(req.query.period);
    const mode = parseMode(req.query.mode);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });

    // No revelar la existencia de cuentas eliminadas o baneadas.
    if (!user || user.deletedAt || user.isBanned) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let rank = 0;
    let value = 0;

    if (period !== 'all' || mode) {
      const all = await aggregateMatches({
        mode,
        since: periodStart(period) ?? undefined,
        rankBy: rankByFor(type),
      });
      const index = all.findIndex((entry) => entry.id === user.id);
      if (index === -1) {
        return res.status(404).json({ error: 'El usuario no tiene partidas en este periodo' });
      }
      rank = all[index].rank;
      value =
        type === 'wins'
          ? all[index].gamesWon
          : type === 'score'
          ? all[index].bestScore
          : all[index].totalScore;

      return res.json({ userId: user.id, username: user.username, rank, value, type, period, mode: mode ?? null });
    }

    switch (type) {
      case 'xp':
        value = user.xp;
        rank =
          (await prisma.user.count({ where: { xp: { gt: user.xp }, ...ACTIVE_USER } })) + 1;
        break;
      case 'level':
        value = user.level;
        rank =
          (await prisma.user.count({ where: { level: { gt: user.level }, ...ACTIVE_USER } })) + 1;
        break;
      case 'coins':
        value = user.coins;
        rank =
          (await prisma.user.count({ where: { coins: { gt: user.coins }, ...ACTIVE_USER } })) + 1;
        break;
      case 'wins':
        value = user.stats?.gamesWon || 0;
        rank =
          (await prisma.playerStats.count({
            where: { gamesWon: { gt: value }, user: ACTIVE_USER },
          })) + 1;
        break;
      case 'score':
        value = user.stats?.bestScore || 0;
        rank =
          (await prisma.playerStats.count({
            where: { bestScore: { gt: value }, user: ACTIVE_USER },
          })) + 1;
        break;
    }

    res.json({ userId: user.id, username: user.username, rank, value, type, period, mode: null });
  } catch (error) {
    console.error('Error obteniendo posición:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/leaderboard/mode/:mode - Ranking por modo de juego
router.get('/mode/:mode', async (req, res) => {
  try {
    const mode = parseMode(req.params.mode);
    if (!mode) {
      return res.status(400).json({ error: 'Modo de juego inválido' });
    }

    const limit = clampLimit(req.query.limit, 50, 100);
    const type = parseType(req.query.type);
    const period = parsePeriod(req.query.period);

    const leaderboard = await aggregateMatches({
      mode,
      since: periodStart(period) ?? undefined,
      limit,
      rankBy: rankByFor(type),
    });

    res.json({ mode, type, period, leaderboard, total: leaderboard.length });
  } catch (error) {
    console.error('Error obteniendo ranking por modo:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/leaderboard/weekly - Ranking semanal
router.get('/weekly', async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit, 50, 100);
    const type = parseType(req.query.type);
    const mode = parseMode(req.query.mode);
    const start = periodStart('weekly')!;
    const now = new Date();

    const leaderboard = await aggregateMatches({
      mode,
      since: start,
      limit,
      rankBy: rankByFor(type),
    });

    res.json({
      period: 'weekly',
      type,
      mode: mode ?? null,
      startDate: start,
      endDate: now,
      leaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Error obteniendo ranking semanal:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/leaderboard/monthly - Ranking mensual
router.get('/monthly', async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit, 50, 100);
    const type = parseType(req.query.type);
    const mode = parseMode(req.query.mode);
    const start = periodStart('monthly')!;
    const now = new Date();

    const leaderboard = await aggregateMatches({
      mode,
      since: start,
      limit,
      rankBy: rankByFor(type),
    });

    res.json({
      period: 'monthly',
      type,
      mode: mode ?? null,
      startDate: start,
      endDate: now,
      leaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Error obteniendo ranking mensual:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
