import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// POST /api/matches - Guardar resultado de partida
router.post('/', async (req, res) => {
  try {
    const { userId, mode, level, score, accuracy, combo, timeLeft, won } = req.body;

    // Crear partida
    const match = await prisma.match.create({
      data: {
        userId,
        mode,
        level,
        score,
        accuracy,
        combo,
        timeLeft,
        won,
      },
    });

    // Actualizar estadísticas del usuario
    const stats = await prisma.playerStats.findUnique({
      where: { userId },
    });

    if (stats) {
      await prisma.playerStats.update({
        where: { userId },
        data: {
          gamesPlayed: stats.gamesPlayed + 1,
          gamesWon: won ? stats.gamesWon + 1 : stats.gamesWon,
          totalScore: stats.totalScore + score,
          bestScore: score > stats.bestScore ? score : stats.bestScore,
          totalMatches: stats.totalMatches + 1,
          maxCombo: combo && combo > stats.maxCombo ? combo : stats.maxCombo,
        },
      });
    }

    // Calcular recompensas
    const xpGained = calculateXP(mode, score, won);
    const coinsGained = calculateCoins(mode, score, won);

    // Actualizar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      const newXP = user.xp + xpGained;
      const newLevel = Math.floor(Math.sqrt(newXP / 100));
      const newCoins = user.coins + coinsGained;

      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: newXP,
          level: newLevel,
          coins: newCoins,
        },
      });
    }

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
