import { Router } from 'express';
import { prisma } from '../index';
import { requireAuth } from '../core/middleware/auth';

const router = Router();

const ALLOWED_MODES = ['classic', 'infinite', 'challenge', 'boss', 'multiplayer', 'ai-friends'];

/**
 * POST /api/matches - Guardar resultado de partida
 * SEGURIDAD: requiere token; el userId SIEMPRE se toma del token (no del body)
 * y los valores numéricos se limitan a rangos razonables.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { mode, level, score, accuracy, combo, timeLeft, won } = req.body;

    if (!ALLOWED_MODES.includes(mode)) {
      return res.status(400).json({ error: 'Modo de juego inválido' });
    }

    const asNumber = (value: unknown, min: number, max: number): number => {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return min;
      return Math.min(Math.max(parsed, min), max);
    };

    const safeScore = asNumber(score, 0, 100_000);
    const safeLevel = asNumber(level, 1, 9999);
    const safeAccuracy = asNumber(accuracy, 0, 100);
    const safeCombo = asNumber(combo, 0, 1000);
    const safeTimeLeft = asNumber(timeLeft, 0, 60 * 60 * 24);
    const safeWon = won === true;

    // Crear partida
    const match = await prisma.match.create({
      data: {
        userId,
        mode,
        level: safeLevel,
        score: safeScore,
        accuracy: safeAccuracy,
        combo: safeCombo,
        timeLeft: safeTimeLeft,
        won: safeWon,
      },
    });

    // Actualizar estadísticas del usuario (upsert atómico evita race conditions)
    await prisma.playerStats.upsert({
      where: { userId },
      create: {
        userId,
        gamesPlayed: 1,
        gamesWon: safeWon ? 1 : 0,
        totalScore: safeScore,
        bestScore: safeScore,
        totalMatches: 1,
        maxCombo: safeCombo,
      },
      update: {
        gamesPlayed: { increment: 1 },
        gamesWon: { increment: safeWon ? 1 : 0 },
        totalScore: { increment: safeScore },
        totalMatches: { increment: 1 },
      },
    });

    // bestScore y maxCombo solo pueden subir (GREATEST atómico en la BD)
    await prisma.$executeRaw`
      UPDATE "player_stats"
      SET "bestScore" = GREATEST("bestScore", ${safeScore}),
          "maxCombo" = GREATEST("maxCombo", ${safeCombo})
      WHERE "userId" = ${userId}
    `;

    // Recompensas calculadas en servidor
    const xpGained = calculateXP(mode, safeScore, safeWon);
    const coinsGained = calculateCoins(mode, safeScore, safeWon);

    // Acreditar XP/monedas de forma atómica
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpGained },
        coins: { increment: coinsGained },
      },
    });

    res.json({
      match,
      xpGained,
      coinsGained,
    });
  } catch (error) {
    console.error('Error guardando partida:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

function calculateXP(mode: string, score: number, won: boolean): number {
  const baseXP = {
    classic: 50,
    infinite: 100,
    challenge: 75,
    boss: 250,
    multiplayer: 100,
    'ai-friends': 50,
  };

  let xp = baseXP[mode as keyof typeof baseXP] || 50;
  
  if (won) xp *= 1.5;
  if (score > 1000) xp += 50;
  if (score > 2000) xp += 100;

  return Math.floor(xp);
}

function calculateCoins(mode: string, score: number, won: boolean): number {
  let coins = Math.floor(score / 10);
  
  if (won) coins *= 1.5;
  
  return Math.floor(coins);
}

export default router;
