import { Router } from 'express';
import { prisma } from '../index';
import { clampLimit } from '../core/validation/schemas';

const router = Router();

// NOTA DE SEGURIDAD: las respuestas del leaderboard son públicas y NO deben
// incluir email u otros datos personales de los jugadores (solo username).

// GET /api/leaderboard - Obtener ranking global
router.get('/', async (req, res) => {
  try {
    const { 
      type = 'xp', 
      mode,
      period = 'all' 
    } = req.query;
    const limit = clampLimit(req.query.limit, 100, 100);

    let orderBy: any = {};
    const baseUserWhere = {
      deletedAt: null,
      isBanned: false,
    };

    // Determinar ordenamiento según tipo de ranking
    switch (type) {
      case 'xp':
        orderBy = { xp: 'desc' };
        break;
      case 'level':
        orderBy = { level: 'desc' };
        break;
      case 'coins':
        orderBy = { coins: 'desc' };
        break;
      case 'wins':
      case 'score':
        break;
      default:
        orderBy = { xp: 'desc' };
    }

    // Si es ranking por wins o score, consultar playerStats directamente con ORDER BY en BD
    if (type === 'wins' || type === 'score') {
      const statsList = await prisma.playerStats.findMany({
        where: {
          user: baseUserWhere,
        },
        orderBy: type === 'wins' ? { gamesWon: 'desc' } : { bestScore: 'desc' },
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
        leaderboard,
        total: leaderboard.length,
      });
    }

    // Para xp, level y coins: consulta a users ordenada en BD y filtrando baneados/eliminados
    const users = await prisma.user.findMany({
      where: baseUserWhere,
      orderBy,
      take: limit,
      include: {
        stats: true,
      },
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
    const { type = 'xp' } = req.query;

    // Obtener el usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Calcular posición según el tipo
    let rank = 0;
    let value = 0;

    const activeFilter = { deletedAt: null, isBanned: false };

    switch (type) {
      case 'xp':
        value = user.xp;
        rank = await prisma.user.count({
          where: { xp: { gt: user.xp }, ...activeFilter },
        }) + 1;
        break;
      case 'level':
        value = user.level;
        rank = await prisma.user.count({
          where: { level: { gt: user.level }, ...activeFilter },
        }) + 1;
        break;
      case 'coins':
        value = user.coins;
        rank = await prisma.user.count({
          where: { coins: { gt: user.coins }, ...activeFilter },
        }) + 1;
        break;
      case 'wins':
        value = user.stats?.gamesWon || 0;
        rank = await prisma.playerStats.count({
          where: {
            gamesWon: { gt: user.stats?.gamesWon || 0 },
            user: activeFilter,
          },
        }) + 1;
        break;
      case 'score':
        value = user.stats?.bestScore || 0;
        rank = await prisma.playerStats.count({
          where: {
            bestScore: { gt: user.stats?.bestScore || 0 },
            user: activeFilter,
          },
        }) + 1;
        break;
      default:
        value = user.xp;
        rank = await prisma.user.count({
          where: { xp: { gt: user.xp }, ...activeFilter },
        }) + 1;
    }

    res.json({
      userId: user.id,
      username: user.username,
      rank,
      value,
      type,
    });
  } catch (error) {
    console.error('Error obteniendo posición:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/leaderboard/mode/:mode - Ranking por modo de juego
router.get('/mode/:mode', async (req, res) => {
  try {
    const { mode } = req.params;
    const limit = clampLimit(req.query.limit, 100, 100);

    // Obtener mejores puntuaciones por modo
    const matches = await prisma.match.findMany({
      where: { mode },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
          },
        },
      },
    });

    // Agrupar por usuario (solo mejor puntuación de cada uno)
    const userBestScores = new Map();
    
    matches.forEach(match => {
      if (!userBestScores.has(match.userId) || 
          match.score > userBestScores.get(match.userId).score) {
        userBestScores.set(match.userId, {
          userId: match.userId,
          username: match.user.username,
          level: match.user.level,
          score: match.score,
          accuracy: match.accuracy,
          combo: match.combo,
          timeLeft: match.timeLeft,
          createdAt: match.createdAt,
        });
      }
    });

    const leaderboard = Array.from(userBestScores.values())
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    res.json({
      mode,
      leaderboard,
      total: leaderboard.length,
    });
  } catch (error) {
    console.error('Error obteniendo ranking por modo:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /api/leaderboard/weekly - Ranking semanal
router.get('/weekly', async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit, 100, 100);

    // Calcular inicio de la semana
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener partidas de la semana
    const matches = await prisma.match.findMany({
      where: {
        createdAt: { gte: startOfWeek },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
          },
        },
      },
    });

    // Agrupar por usuario y sumar puntuaciones
    const userScores = new Map();

    matches.forEach(match => {
      if (!userScores.has(match.userId)) {
        userScores.set(match.userId, {
          userId: match.userId,
          username: match.user.username,
          level: match.user.level,
          totalScore: 0,
          gamesPlayed: 0,
          gamesWon: 0,
        });
      }

      const userData = userScores.get(match.userId);
      userData.totalScore += match.score;
      userData.gamesPlayed++;
      if (match.won) userData.gamesWon++;
    });

    const leaderboard = Array.from(userScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    res.json({
      period: 'weekly',
      startDate: startOfWeek,
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
    const limit = clampLimit(req.query.limit, 100, 100);

    // Calcular inicio del mes
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Obtener partidas del mes
    const matches = await prisma.match.findMany({
      where: {
        createdAt: { gte: startOfMonth },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            level: true,
          },
        },
      },
    });

    // Agrupar por usuario y sumar puntuaciones
    const userScores = new Map();

    matches.forEach(match => {
      if (!userScores.has(match.userId)) {
        userScores.set(match.userId, {
          userId: match.userId,
          username: match.user.username,
          level: match.user.level,
          totalScore: 0,
          gamesPlayed: 0,
          gamesWon: 0,
        });
      }

      const userData = userScores.get(match.userId);
      userData.totalScore += match.score;
      userData.gamesPlayed++;
      if (match.won) userData.gamesWon++;
    });

    const leaderboard = Array.from(userScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    res.json({
      period: 'monthly',
      startDate: startOfMonth,
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
