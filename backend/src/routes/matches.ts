import { Router } from 'express';
import { prisma } from '../index';
import { requireAuth } from '../core/middleware/auth';

const router = Router();

const ALLOWED_MODES = ['classic', 'infinite', 'challenge', 'boss', 'multiplayer', 'ai-friends'];

/**
 * Topes de puntuación por modo. El cliente sigue reportando el score (los
 * modos single-player se ejecutan en el navegador), pero el servidor impone
 * un máximo plausible y calcula TODAS las recompensas.
 */
const MAX_SCORE_BY_MODE: Record<string, number> = {
  classic: 50_000,
  infinite: 100_000,
  challenge: 50_000,
  boss: 50_000,
  multiplayer: 50_000,
  'ai-friends': 50_000,
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Ventana mínima entre partidas distintas (anti-spam de resultados). */
const MIN_MS_BETWEEN_MATCHES = 3_000;
/** Máximo de partidas distintas por minuto. */
const MAX_MATCHES_PER_MINUTE = 20;

function parseInteger(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

/**
 * POST /api/matches - Guardar resultado de partida
 *
 * SEGURIDAD:
 * - Requiere JWT; el userId SIEMPRE se toma del token.
 * - `matchKey` (UUID generado por el cliente) es la clave de idempotencia:
 *   reenviar la misma partida no vuelve a acreditar XP/monedas. Esto también
 *   neutraliza el doble envío de React StrictMode.
 * - XP/monedas/nivel se calculan exclusivamente en el servidor.
 * - Límites por modo y rate limit por usuario reducen el abuso automatizado.
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth!.userId;
    const { mode, level, score, accuracy, combo, timeLeft, won, matchKey } = req.body;

    if (!ALLOWED_MODES.includes(mode)) {
      return res.status(400).json({ error: 'Modo de juego inválido' });
    }

    if (typeof matchKey !== 'string' || !UUID_RE.test(matchKey)) {
      return res.status(400).json({ error: 'matchKey inválido (se requiere UUID)' });
    }

    if (typeof won !== 'boolean') {
      return res.status(400).json({ error: 'El campo won debe ser booleano' });
    }

    const maxScore = MAX_SCORE_BY_MODE[mode];
    const safeScore = parseInteger(score, 0, maxScore);
    if (safeScore === null) {
      return res.status(400).json({ error: 'Puntuación inválida' });
    }

    const safeLevel = parseInteger(level ?? 1, 1, 9999) ?? 1;
    const safeAccuracy = parseInteger(accuracy ?? 0, 0, 100) ?? 0;
    const safeCombo = parseInteger(combo ?? 0, 0, 1000) ?? 0;
    const safeTimeLeft = parseInteger(timeLeft ?? 0, 0, 60 * 60 * 24) ?? 0;

    // Idempotencia: si esta partida ya se registró, no volver a premiar.
    const alreadySaved = await prisma.match.findFirst({
      where: { userId, matchKey },
    });
    if (alreadySaved) {
      return res.json({
        match: alreadySaved,
        xpGained: 0,
        coinsGained: 0,
        duplicate: true,
      });
    }

    // Anti-spam: una partida distinta cada 3s y máximo 20/minuto.
    const now = Date.now();
    const [recentCount, minuteCount] = await Promise.all([
      prisma.match.count({
        where: { userId, createdAt: { gte: new Date(now - MIN_MS_BETWEEN_MATCHES) } },
      }),
      prisma.match.count({
        where: { userId, createdAt: { gte: new Date(now - 60_000) } },
      }),
    ]);

    if (recentCount > 0) {
      return res.status(429).json({ error: 'Espera unos segundos antes de registrar otra partida' });
    }
    if (minuteCount >= MAX_MATCHES_PER_MINUTE) {
      return res.status(429).json({ error: 'Demasiadas partidas registradas. Intenta más tarde.' });
    }

    // Recompensas calculadas en servidor
    const xpGained = calculateXP(mode, safeScore, won);
    const coinsGained = calculateCoins(mode, safeScore, won);

    // Partida + estadísticas + XP/monedas/nivel en UNA transacción ACID.
    const match = await prisma.$transaction(async (tx) => {
      const createdMatch = await tx.match.create({
        data: {
          userId,
          mode,
          level: safeLevel,
          score: safeScore,
          accuracy: safeAccuracy,
          combo: safeCombo,
          timeLeft: safeTimeLeft,
          won,
          matchKey,
        },
      });

      // Upsert atómico evita race conditions si el usuario aún no tiene stats.
      await tx.playerStats.upsert({
        where: { userId },
        create: {
          userId,
          gamesPlayed: 1,
          gamesWon: won ? 1 : 0,
          totalScore: safeScore,
          bestScore: safeScore,
          totalMatches: 1,
          maxCombo: safeCombo,
        },
        update: {
          gamesPlayed: { increment: 1 },
          gamesWon: { increment: won ? 1 : 0 },
          totalScore: { increment: safeScore },
          totalMatches: { increment: 1 },
        },
      });

      // bestScore y maxCombo solo pueden subir (GREATEST atómico en la BD)
      await tx.$executeRaw`
        UPDATE "player_stats"
        SET "bestScore" = GREATEST("bestScore", ${safeScore}),
            "maxCombo" = GREATEST("maxCombo", ${safeCombo})
        WHERE "userId" = ${userId}
      `;

      // XP, monedas y nivel en una sola sentencia atómica.
      // Fórmula única: nivel = floor(xp / 1000) + 1.
      await tx.$executeRaw`
        UPDATE "users"
        SET xp = xp + ${xpGained},
            "level" = (xp + ${xpGained}) / 1000 + 1,
            coins = coins + ${coinsGained},
            "updatedAt" = NOW()
        WHERE id = ${userId}
      `;

      return createdMatch;
    });

    res.json({
      match,
      xpGained,
      coinsGained,
      duplicate: false,
    });
  } catch (error: any) {
    // Carrera de dos peticiones con la misma matchKey: la segunda recibe P2002.
    if (error?.code === 'P2002') {
      try {
        const existing = await prisma.match.findFirst({
          where: { userId: req.auth!.userId, matchKey: req.body.matchKey },
        });
        if (existing) {
          return res.json({
            match: existing,
            xpGained: 0,
            coinsGained: 0,
            duplicate: true,
          });
        }
      } catch {
        // Continuar al error genérico
      }
    }

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

  return Math.min(Math.floor(xp), 1000);
}

function calculateCoins(mode: string, score: number, won: boolean): number {
  let coins = Math.floor(score / 10);

  if (won) coins *= 1.5;

  return Math.min(Math.floor(coins), 5000);
}

export default router;
