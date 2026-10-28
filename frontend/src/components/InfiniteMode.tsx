import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Zap, Trophy, Infinity as InfinityIcon,
  Sparkles, Volume2, VolumeX, Eye, Snowflake, Flame, Play,
  RotateCcw, Home, Award, Coins, Star
} from 'lucide-react';
import { MemoryCard, type MemoryCardData } from './MemoryCard';
import { CARD_CATALOG, getCardsForUniverse, type CardDef, type GameUniverse } from '../lib/cardCatalog';
import { UNIVERSE_TOKENS, type UniverseId } from '../lib/archivoTokens';
import { ParticleExplosion, ComboPopup, FreezeOverlay } from './ClassicEffects';
import { InGameCompanionWidget } from './InGameCompanionWidget';
import { apiFetch } from '../lib/api';

interface InfiniteModeProps {
  onBackToLobby: () => void;
}

interface InfiniteCard extends MemoryCardData {
  cardDef: CardDef;
  isHinted?: boolean;
}

interface SectorConfig {
  sectorNumber: number;
  name: string;
  subtitle: string;
  universe: UniverseId;
  accent: string;
  glow: string;
  pairCount: number;
  cols: number;
  timeBonus: number;
  previewSeconds: number;
}

/* ──────────────────────────────────────────────────────────────────────────
   Audio Synthesizer Engine (Web Audio API - Cero lag, sonido arcade puro)
   ────────────────────────────────────────────────────────────────────────── */
class InfiniteAudio {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private isMuted(): boolean {
    return localStorage.getItem('memorize_sound_muted') === 'true';
  }

  playFlip() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  playMatch(combo: number) {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Escala pentatónica que se eleva musicalmente con cada combo
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      const baseFreq = notes[Math.min(combo - 1, notes.length - 1)] || 523.25;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);
      gain1.gain.setValueAtTime(0.14, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.03);
      gain2.gain.setValueAtTime(0.09, now + 0.03);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.03);
      osc2.stop(now + 0.32);
    } catch {}
  }

  playMismatch() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  playFever() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.035);
        gain.gain.setValueAtTime(0.1, now + idx * 0.035);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.035);
        osc.stop(now + idx * 0.035 + 0.25);
      });
    } catch {}
  }

  playTimeBonus() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(1840, now + 0.14);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  playWaveClear() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.13, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.45);
      });
    } catch {}
  }

  playPower() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  playGameOver() {
    if (this.isMuted()) return;
    try {
      const ctx = this.initCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.65);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  }
}

const audio = new InfiniteAudio();

/* ──────────────────────────────────────────────────────────────────────────
   Configurador Progresivo de Sectores y Universos
   ────────────────────────────────────────────────────────────────────────── */
function getSectorForWave(wave: number): SectorConfig {
  const configs: Omit<SectorConfig, 'sectorNumber'>[] = [
    {
      name: 'Sector Neural: Enlace Sináptico',
      subtitle: 'Red Primaria · Transmisión Inicial',
      universe: 'neural',
      accent: '#2BE08F',
      glow: 'rgba(43, 224, 143, 0.45)',
      pairCount: 3, // 6 cartas (3x2)
      cols: 3,
      timeBonus: 10,
      previewSeconds: 2.2,
    },
    {
      name: 'Sector Frostheim: Cúpula Glacial',
      subtitle: 'Cripta Boreal · Reliquias Subcero',
      universe: 'frostheim',
      accent: '#6EE7F5',
      glow: 'rgba(110, 231, 245, 0.45)',
      pairCount: 4, // 8 cartas (4x2)
      cols: 4,
      timeBonus: 12,
      previewSeconds: 2.3,
    },
    {
      name: 'Sector Volcania: Yunque de Magma',
      subtitle: 'Caldera de Obsidiana y Brasas',
      universe: 'volcania',
      accent: '#FF6B35',
      glow: 'rgba(255, 107, 53, 0.45)',
      pairCount: 6, // 12 cartas (4x3)
      cols: 4,
      timeBonus: 14,
      previewSeconds: 2.5,
    },
    {
      name: 'Sector Verdalis: Selva Biolumínica',
      subtitle: 'Raíces Ancestrales y Esporas Vivas',
      universe: 'verdalis',
      accent: '#35E0C8',
      glow: 'rgba(53, 224, 200, 0.45)',
      pairCount: 8, // 16 cartas (4x4)
      cols: 4,
      timeBonus: 16,
      previewSeconds: 2.6,
    },
    {
      name: 'Sector Lunaris: Velo Astral',
      subtitle: 'Eclipse Lunar y Constelaciones',
      universe: 'lunaris',
      accent: '#B37BF2',
      glow: 'rgba(179, 123, 242, 0.45)',
      pairCount: 8, // 16 cartas (4x4)
      cols: 4,
      timeBonus: 16,
      previewSeconds: 2.6,
    },
  ];

  if (wave <= configs.length) {
    return { ...configs[wave - 1], sectorNumber: wave };
  }

  // Ola 6 en adelante: Convergencia Multiversal Cuántica!
  const universes: UniverseId[] = ['neural', 'frostheim', 'volcania', 'verdalis', 'lunaris'];
  const u = universes[(wave - 1) % universes.length];
  const token = UNIVERSE_TOKENS[u];
  const pairCount = wave % 2 === 0 ? 10 : 8; // 20 ó 16 cartas
  const cols = pairCount === 10 ? 5 : 4;

  return {
    sectorNumber: wave,
    name: `Sector Cuántico: Fila ${wave - 5}`,
    subtitle: `Convergencia Multiversal · Ola ${wave}`,
    universe: u,
    accent: token.accent,
    glow: `${token.accent}77`,
    pairCount,
    cols,
    timeBonus: 18 + Math.min(10, Math.floor((wave - 6) * 2)),
    previewSeconds: Math.max(1.8, 2.6 - (wave - 5) * 0.1),
  };
}

function buildDeck(sector: SectorConfig, wave: number): InfiniteCard[] {
  let pool: CardDef[] = [];
  if (wave <= 5 && sector.universe !== 'archivo') {
    pool = getCardsForUniverse(sector.universe as GameUniverse);
  }
  if (!pool || pool.length < sector.pairCount) {
    pool = [...CARD_CATALOG];
  }

  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const selectedCards = shuffledPool.slice(0, sector.pairCount);

  const deck: InfiniteCard[] = [];
  selectedCards.forEach((c) => {
    const accent = UNIVERSE_TOKENS[c.universe]?.accent || '#35E0C8';
    for (let copy = 0; copy < 2; copy++) {
      deck.push({
        id: `${c.id}-${copy}-${wave}-${Math.random().toString(36).substring(2, 7)}`,
        artId: c.id,
        accent,
        isFlipped: true, // Inicia boca arriba en el escaneo
        isMatched: false,
        cardDef: c,
        isHinted: false,
      });
    }
  });

  return deck.sort(() => Math.random() - 0.5);
}

/* ──────────────────────────────────────────────────────────────────────────
   Componente Principal: Modo Infinito
   ────────────────────────────────────────────────────────────────────────── */
export function InfiniteMode({ onBackToLobby }: InfiniteModeProps) {
  // Estado de juego principal
  const [wave, setWave] = useState(1);
  const [cards, setCards] = useState<InfiniteCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [errors, setErrors] = useState(0);

  // Fases: 'scanning' (escaneo inicial) | 'playing' (interactivo) | 'wave_cleared' | 'game_over'
  type Phase = 'scanning' | 'playing' | 'wave_cleared' | 'game_over';
  const [phase, setPhase] = useState<Phase>('scanning');
  const [scanSecondsLeft, setScanSecondsLeft] = useState(2.2);

  // Poderes y mejoras tácticas
  const [radarCharges, setRadarCharges] = useState(1);
  const [freezeCharges, setFreezeCharges] = useState(1);
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);

  // Récords y estadísticas guardadas
  const [bestScore, setBestScore] = useState(() => {
    return parseInt(localStorage.getItem('memorize_infinite_best_score') || '0', 10);
  });
  const [highestWave, setHighestWave] = useState(() => {
    return parseInt(localStorage.getItem('memorize_infinite_highest_wave') || '1', 10);
  });
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [serverRewards, setServerRewards] = useState<{ xpGained: number; coinsGained: number } | null>(null);

  // Sonido y efectos visuales
  const [soundMuted, setSoundMuted] = useState(() => {
    return localStorage.getItem('memorize_sound_muted') === 'true';
  });
  const [shakingIdx, setShakingIdx] = useState<number[]>([]);
  const [bouncingIdx, setBouncingIdx] = useState<number[]>([]);
  const [explosion, setExplosion] = useState<{ x: number; y: number; color: string; id: number } | null>(null);
  const [comboActive, setComboActive] = useState(false);
  const [floatingBonus, setFloatingBonus] = useState<string | null>(null);
  const [floatingBonusKey, setFloatingBonusKey] = useState(0);

  const lockRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sector = getSectorForWave(wave);
  const isFever = combo >= 3;

  // Toggle de sonido
  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    localStorage.setItem('memorize_sound_muted', String(next));
  };

  // Iniciar / resetear una oleada
  const startWave = useCallback((targetWave: number) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    lockRef.current = false;
    setFlippedIndices([]);
    setShakingIdx([]);
    setBouncingIdx([]);

    const currentSector = getSectorForWave(targetWave);
    const newDeck = buildDeck(currentSector, targetWave);
    setCards(newDeck);
    setPhase('scanning');
    setScanSecondsLeft(currentSector.previewSeconds);

    const startTime = Date.now();
    const durationMs = currentSector.previewSeconds * 1000;

    scanIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setScanSecondsLeft(remaining);

      if (remaining <= 0) {
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
        // Ocultar cartas e iniciar fase interactiva
        setCards((curr) => curr.map((c) => ({ ...c, isFlipped: false })));
        setPhase('playing');
        audio.playFlip();
      }
    }, 50);
  }, []);

  // Saltar escaneo voluntariamente (+2s bonus para jugadores veloces)
  const handleSkipScan = () => {
    if (phase !== 'scanning') return;
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    audio.playTimeBonus();
    setTimeLeft((t) => t + 2);
    setFloatingBonus('+2s SALTO');
    setFloatingBonusKey((k) => k + 1);
    setCards((curr) => curr.map((c) => ({ ...c, isFlipped: false })));
    setPhase('playing');
  };

  // Iniciar primera oleada
  useEffect(() => {
    startWave(1);
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, [startWave]);

  // Manejador del fin de partida
  const handleGameOver = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    audio.playGameOver();
    setPhase('game_over');

    const prevBest = parseInt(localStorage.getItem('memorize_infinite_best_score') || '0', 10);
    if (score > prevBest) {
      localStorage.setItem('memorize_infinite_best_score', String(score));
      setBestScore(score);
      setIsNewRecord(true);
    }

    const prevHighestWave = parseInt(localStorage.getItem('memorize_infinite_highest_wave') || '1', 10);
    if (wave > prevHighestWave) {
      localStorage.setItem('memorize_infinite_highest_wave', String(wave));
      setHighestWave(wave);
    }

    const accuracy = totalClicks > 0 ? Math.min(100, Math.round(((totalMatches * 2) / totalClicks) * 100)) : 100;

    // Enviar partida al backend para registrar XP y monedas
    apiFetch<{ xpGained: number; coinsGained: number }>('/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'infinite',
        level: wave,
        score,
        accuracy,
        combo: maxCombo,
        timeLeft: 0,
        won: wave >= 5,
      }),
    })
      .then((data) => {
        setServerRewards({
          xpGained: data.xpGained,
          coinsGained: data.coinsGained,
        });
      })
      .catch(() => {
        setServerRewards({
          xpGained: Math.min(600, 100 + wave * 35 + Math.floor(score / 40)),
          coinsGained: Math.floor(score / 12),
        });
      });
  }, [score, wave, maxCombo, totalClicks, totalMatches]);

  // Reloj de cuenta regresiva
  useEffect(() => {
    if (phase !== 'playing') return;
    if (isTimeFrozen) return;

    if (timeLeft <= 0) {
      handleGameOver();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, isTimeFrozen, timeLeft, handleGameOver]);

  // Oleada completada con éxito
  const handleWaveCompleted = useCallback(() => {
    audio.playWaveClear();
    setPhase('wave_cleared');

    const bonus = sector.timeBonus;
    setTimeLeft((t) => t + bonus);
    setFloatingBonus(`+${bonus}s ¡SECTOR LIMPIO!`);
    setFloatingBonusKey((k) => k + 1);

    // Otorgar cargas tácticas adicionales
    if (wave % 2 === 0) {
      setRadarCharges((r) => Math.min(2, r + 1));
    }
    if (wave === 4) {
      setFreezeCharges((f) => Math.min(2, f + 1));
    }

    setTimeout(() => {
      setWave((w) => {
        const nextWave = w + 1;
        startWave(nextWave);
        return nextWave;
      });
    }, 1700);
  }, [sector.timeBonus, wave, startWave]);

  // Clic en carta
  const handleCardClick = (idx: number) => {
    if (phase !== 'playing') return;
    if (lockRef.current) return;
    if (flippedIndices.length >= 2) return;
    if (cards[idx].isFlipped || cards[idx].isMatched) return;

    audio.playFlip();
    setTotalClicks((c) => c + 1);

    const newCards = [...cards];
    newCards[idx] = { ...newCards[idx], isFlipped: true };
    setCards(newCards);

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [firstIdx, secondIdx] = newFlipped;
      const card1 = newCards[firstIdx];
      const card2 = newCards[secondIdx];

      if (card1.cardDef.id === card2.cardDef.id) {
        // MATCH ENCONTRADO
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));
        setTotalMatches((m) => m + 1);

        audio.playMatch(newCombo);

        const isFeverNow = newCombo >= 3;
        if (newCombo === 3) {
          audio.playFever();
        }

        const multiplier = isFeverNow ? 2 : 1;
        const matchScore = 100 * newCombo * multiplier;
        setScore((s) => s + matchScore);

        const addedTime = isFeverNow ? 5 : 3;
        setTimeLeft((t) => t + addedTime);
        setFloatingBonus(`+${addedTime}s ${isFeverNow ? '¡FIEBRE!' : ''}`);
        setFloatingBonusKey((k) => k + 1);

        // Explosión de partículas en la posición de las cartas
        const rect1 = cardRefs.current[firstIdx]?.getBoundingClientRect();
        const rect2 = cardRefs.current[secondIdx]?.getBoundingClientRect();
        if (rect1 && rect2) {
          setExplosion({
            x: (rect1.left + rect2.left) / 2 + rect1.width / 2,
            y: (rect1.top + rect2.top) / 2 + rect1.height / 2,
            color: card1.accent || '#35E0C8',
            id: Date.now(),
          });
        } else if (rect1) {
          setExplosion({
            x: rect1.left + rect1.width / 2,
            y: rect1.top + rect1.height / 2,
            color: card1.accent || '#35E0C8',
            id: Date.now(),
          });
        }

        setBouncingIdx([firstIdx, secondIdx]);
        setComboActive(true);
        setTimeout(() => setComboActive(false), 900);

        setTimeout(() => {
          setCards((curr) => {
            const updated = [...curr];
            if (updated[firstIdx]) updated[firstIdx] = { ...updated[firstIdx], isMatched: true };
            if (updated[secondIdx]) updated[secondIdx] = { ...updated[secondIdx], isMatched: true };

            const allMatched = updated.every((c) => c.isMatched);
            if (allMatched) {
              handleWaveCompleted();
            }

            return updated;
          });

          setBouncingIdx([]);
          setFlippedIndices([]);
          lockRef.current = false;
        }, 380);
      } else {
        // ERROR / DESENCUENTRO
        audio.playMismatch();
        setErrors((e) => e + 1);
        setCombo(0); // Reiniciar combo y finalizar sobrecarga

        setShakingIdx([firstIdx, secondIdx]);

        setTimeout(() => {
          setCards((curr) => {
            const updated = [...curr];
            if (updated[firstIdx]) updated[firstIdx] = { ...updated[firstIdx], isFlipped: false };
            if (updated[secondIdx]) updated[secondIdx] = { ...updated[secondIdx], isFlipped: false };
            return updated;
          });
          setShakingIdx([]);
          setFlippedIndices([]);
          lockRef.current = false;
        }, 750);
      }
    }
  };

  // Habilidad del Compañero 3D: Revelar e iluminar temporalmente un par oculto (2.2s)
  const handleCompanionReveal = useCallback(() => {
    if (phase !== 'playing') return;
    const map = new Map<string, number[]>();
    cards.forEach((c, i) => {
      if (!c.isMatched && !c.isFlipped) {
        const arr = map.get(c.cardDef.id) || [];
        arr.push(i);
        map.set(c.cardDef.id, arr);
      }
    });

    let pairIndices: number[] | null = null;
    for (const indices of map.values()) {
      if (indices.length >= 2) {
        pairIndices = indices.slice(0, 2);
        break;
      }
    }

    if (pairIndices) {
      audio.playPower();
      setCards((curr) =>
        curr.map((c, idx) =>
          pairIndices!.includes(idx) ? { ...c, isFlipped: true, isHinted: true } : c
        )
      );
      setTimeout(() => {
        setCards((curr) =>
          curr.map((c, idx) =>
            pairIndices!.includes(idx) && !c.isMatched
              ? { ...c, isFlipped: false, isHinted: false }
              : { ...c, isHinted: false }
          )
        );
      }, 2200);
    }
  }, [phase, cards]);

  // Habilidad del Compañero 3D: Congelar tiempo durante 6 segundos
  const handleCompanionFreeze = useCallback(() => {
    if (phase !== 'playing') return;
    audio.playPower();
    setIsTimeFrozen(true);
    setTimeout(() => {
      setIsTimeFrozen(false);
    }, 6000);
  }, [phase]);

  // Poder Táctico de la barra superior: Radar Sónico
  const handleUseRadar = () => {
    if (phase !== 'playing' || radarCharges <= 0) return;
    setRadarCharges((r) => r - 1);
    handleCompanionReveal();
  };

  // Poder Táctico de la barra superior: Criostasis
  const handleUseFreeze = () => {
    if (phase !== 'playing' || freezeCharges <= 0 || isTimeFrozen) return;
    setFreezeCharges((f) => f - 1);
    handleCompanionFreeze();
  };

  // Reintentar partida desde cero
  const handleRestart = () => {
    setScore(0);
    setTimeLeft(45);
    setWave(1);
    setCombo(0);
    setMaxCombo(0);
    setTotalMatches(0);
    setTotalClicks(0);
    setErrors(0);
    setRadarCharges(1);
    setFreezeCharges(1);
    setIsTimeFrozen(false);
    setIsNewRecord(false);
    setServerRewards(null);
    setFlippedIndices([]);
    lockRef.current = false;
    startWave(1);
  };

  const matchedPairsCount = Math.floor(cards.filter((c) => c.isMatched).length / 2);
  const accuracyPercent =
    totalClicks > 0 ? Math.min(100, Math.round(((totalMatches * 2) / totalClicks) * 100)) : 100;

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden select-none flex flex-col justify-between"
      style={{
        background: `radial-gradient(circle at 50% 10%, ${sector.accent}18 0%, #060911 50%, #030408 100%)`,
      }}
    >
      {/* ── Fondo Animado & Partículas Cosmológicas ──────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Glow dinámico del sector */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[360px] rounded-full blur-[110px] opacity-35 transition-all duration-1000"
          style={{ background: sector.accent }}
        />
        {/* Luces perimetrales */}
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] opacity-20"
          style={{ background: sector.glow }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[100px] opacity-20"
          style={{ background: sector.accent }}
        />

        {/* Rejilla de circuito cuántico */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(${sector.accent} 1px, transparent 1px), linear-gradient(90deg, ${sector.accent} 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Partículas flotantes */}
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              width: 2 + (i % 3) * 1.5,
              height: 2 + (i % 3) * 1.5,
              background: i % 2 === 0 ? sector.accent : '#FFFFFF',
              boxShadow: `0 0 8px ${sector.accent}`,
            }}
            animate={{
              y: [0, -35, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 5 + (i % 4) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: (i % 5) * 0.7,
            }}
          />
        ))}
      </div>

      {/* ── Explosiones de Partículas y Popups de Efectos ────────────────────── */}
      {explosion && (
        <ParticleExplosion
          key={explosion.id}
          x={explosion.x}
          y={explosion.y}
          color={explosion.color}
          active={true}
          onDone={() => setExplosion(null)}
        />
      )}

      <ComboPopup combo={combo} active={comboActive} />
      <FreezeOverlay active={isTimeFrozen} />

      {/* ── Mascota / Compañero 3D en Vivo (Igual que en Modo Clásico) ──────── */}
      <InGameCompanionWidget
        onRevealPair={handleCompanionReveal}
        onFreezeTime={handleCompanionFreeze}
        combo={combo}
        matchedCount={totalMatches}
        isGameActive={phase === 'playing'}
      />

      {/* ── Floating Time Bonus Indicator ──────────────────────────────────── */}
      <AnimatePresence>
        {floatingBonus && (
          <motion.div
            key={`bonus-${floatingBonusKey}`}
            initial={{ opacity: 0, y: 20, scale: 0.75 }}
            animate={{ opacity: 1, y: -30, scale: 1.15 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-none z-50 px-4 py-1.5 rounded-full font-mono text-sm font-black border backdrop-blur-md shadow-2xl flex items-center gap-1.5"
            style={{
              background: 'rgba(6, 17, 25, 0.92)',
              borderColor: sector.accent,
              color: sector.accent,
              boxShadow: `0 0 25px ${sector.glow}`,
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{floatingBonus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barra Superior (Header & Navegación) ────────────────────────────── */}
      <header className="px-4 py-3 sm:px-8 sm:py-4 relative z-30 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-black/20">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-400/50 transition-all text-xs font-mono tracking-wider text-gray-200"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>LOBBY</span>
        </button>

        {/* Título Central del Sector */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <InfinityIcon className="w-5 h-5" style={{ color: sector.accent }} />
            <h1 className="font-black text-sm sm:text-base tracking-[0.2em] uppercase text-white drop-shadow">
              MODO INFINITO
            </h1>
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border"
              style={{
                color: sector.accent,
                borderColor: `${sector.accent}55`,
                background: `${sector.accent}15`,
              }}
            >
              OLA {String(wave).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-400 tracking-wider hidden sm:block">
            {sector.name} · {sector.subtitle}
          </span>
        </div>

        {/* Controles de Sonido y Ayudas Tácticas */}
        <div className="flex items-center gap-2">
          {/* Poder: Radar */}
          <button
            onClick={handleUseRadar}
            disabled={radarCharges <= 0 || phase !== 'playing'}
            title="Pulso de Radar: Revela una pareja oculta"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              radarCharges > 0 && phase === 'playing'
                ? 'bg-amber-500/10 border-amber-400/50 text-amber-300 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(232,181,74,0.25)]'
                : 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RADAR</span>
            <span className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center text-[10px]">
              {radarCharges}
            </span>
          </button>

          {/* Poder: Congelar */}
          <button
            onClick={handleUseFreeze}
            disabled={freezeCharges <= 0 || phase !== 'playing' || isTimeFrozen}
            title="Criostasis: Detiene el reloj durante 5 segundos"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              freezeCharges > 0 && phase === 'playing' && !isTimeFrozen
                ? 'bg-cyan-500/10 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/20 shadow-[0_0_15px_rgba(110,231,245,0.25)]'
                : 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CONGELAR</span>
            <span className="w-4 h-4 rounded-full bg-cyan-400/20 flex items-center justify-center text-[10px]">
              {freezeCharges}
            </span>
          </button>

          {/* Mute toggle */}
          <button
            onClick={toggleSound}
            title={soundMuted ? 'Activar audio' : 'Silenciar'}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </header>

      {/* ── Cuadro de Indicadores (Dashboard HUD) ───────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-3 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* 1. Cronómetro de Supervivencia */}
          <motion.div
            className={`px-3.5 py-2.5 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-colors ${
              timeLeft <= 10
                ? 'bg-red-950/40 border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.4)]'
                : isTimeFrozen
                ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_25px_rgba(110,231,245,0.4)]'
                : 'bg-black/40 border-white/10'
            }`}
            animate={timeLeft <= 10 ? { scale: [1, 1.03, 1] } : {}}
            transition={{ duration: 0.6, repeat: timeLeft <= 10 ? Infinity : 0 }}
          >
            <div className="flex items-center gap-2">
              <Clock
                className={`w-4 h-4 ${
                  timeLeft <= 10 ? 'text-red-400 animate-pulse' : isTimeFrozen ? 'text-cyan-300' : 'text-cyan-400'
                }`}
              />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                {isTimeFrozen ? 'CONGELADO' : 'TIEMPO'}
              </span>
            </div>
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                timeLeft <= 10 ? 'text-red-400' : isTimeFrozen ? 'text-cyan-300' : 'text-cyan-300'
              }`}
            >
              {timeLeft}s
            </span>
          </motion.div>

          {/* 2. Puntuación */}
          <div className="px-3.5 py-2.5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">PUNTOS</span>
            </div>
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-300">
              {score.toLocaleString()}
            </span>
          </div>

          {/* 3. Multiplicador de Combo & Sobrecarga */}
          <div
            className={`px-3.5 py-2.5 rounded-2xl border backdrop-blur-md flex items-center justify-between transition-all ${
              isFever
                ? 'bg-gradient-to-r from-orange-950/60 to-red-950/60 border-orange-500 shadow-[0_0_25px_rgba(255,107,53,0.35)]'
                : combo > 1
                ? 'bg-purple-950/30 border-purple-400/50'
                : 'bg-black/40 border-white/10'
            }`}
          >
            <div className="flex items-center gap-2">
              {isFever ? (
                <Flame className="w-4 h-4 text-orange-400 animate-bounce" />
              ) : (
                <Zap className="w-4 h-4 text-purple-400" />
              )}
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                {isFever ? 'FIEBRE 2×' : 'COMBO'}
              </span>
            </div>
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                isFever ? 'text-orange-400 drop-shadow-[0_0_12px_rgba(255,107,53,0.8)]' : 'text-purple-300'
              }`}
            >
              ×{combo}
            </span>
          </div>

          {/* 4. Parejas del Sector Actual */}
          <div className="px-3.5 py-2.5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" style={{ color: sector.accent }} />
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">PAREJAS</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xl sm:text-2xl font-black">
              <span style={{ color: sector.accent }}>{matchedPairsCount}</span>
              <span className="text-gray-600 text-sm">/{sector.pairCount}</span>
            </div>
          </div>
        </div>

        {/* Banner de Estado de Sobrecarga / Modo Fiebre */}
        <AnimatePresence>
          {isFever && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="mt-2.5 px-4 py-1.5 rounded-xl border border-orange-500/60 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 backdrop-blur-md flex items-center justify-center gap-2 text-orange-300 font-mono text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(255,107,53,0.25)]"
            >
              <Flame className="w-4 h-4 animate-pulse" />
              <span>¡SOBRECARGA NEURONAL ACTIVA! 2× PUNTOS · +5s POR PAREJA</span>
              <Flame className="w-4 h-4 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Tablero de Juego (Cartas Coleccionables 3D Reales) ───────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 relative z-20 w-full max-w-4xl mx-auto">
        <div
          className={`relative p-3 sm:p-5 rounded-3xl transition-all duration-500 w-full flex flex-col items-center ${
            isFever
              ? 'border border-orange-500/50 shadow-[0_0_50px_rgba(255,107,53,0.25)] bg-black/40'
              : 'border border-white/10 bg-black/30 backdrop-blur-sm'
          }`}
        >
          {/* Overlay de Fase de Escaneo Matricial */}
          <AnimatePresence>
            {phase === 'scanning' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-x-0 -top-12 z-30 flex items-center justify-between px-4 py-1.5 bg-black/75 border border-cyan-400/50 rounded-2xl backdrop-blur-md shadow-2xl"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-mono text-xs uppercase tracking-widest text-cyan-300 font-bold">
                    ESCANEO DE MATRIZ: {scanSecondsLeft.toFixed(1)}s
                  </span>
                </div>

                <button
                  onClick={handleSkipScan}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 font-mono text-[11px] font-bold tracking-wider transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>INICIAR (+2s)</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Láser de Escaneo Transversal */}
          {phase === 'scanning' && (
            <motion.div
              className="absolute inset-x-4 h-1 pointer-events-none z-20"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${sector.accent} 50%, transparent 100%)`,
                boxShadow: `0 0 16px ${sector.accent}`,
              }}
              initial={{ top: '6%' }}
              animate={{ top: '92%' }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          {/* Cuadrícula Proporcional y Dinámica de Cartas */}
          <div
            className={`grid gap-2.5 sm:gap-3.5 w-full justify-center ${
              sector.cols === 3
                ? 'grid-cols-3 max-w-sm sm:max-w-md'
                : sector.cols === 5
                ? 'grid-cols-5 max-w-2xl sm:max-w-3xl'
                : 'grid-cols-4 max-w-md sm:max-w-xl'
            }`}
          >
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                style={{
                  aspectRatio: '3/4',
                  maxWidth: sector.cols === 5 ? '105px' : sector.cols === 3 ? '140px' : '122px',
                }}
                className="w-full relative select-none"
                layout
                animate={
                  card.isHinted
                    ? { scale: [1, 1.08, 1], filter: 'drop-shadow(0 0 16px #E8B54A)' }
                    : {}
                }
                transition={{
                  layout: { duration: 0.35, ease: 'easeInOut' },
                  scale: card.isHinted ? { repeat: Infinity, duration: 0.9 } : { duration: 0.25 },
                }}
              >
                <MemoryCard
                  card={card}
                  index={idx}
                  backUniverse={sector.universe}
                  interactive={phase === 'playing'}
                  onClick={() => handleCardClick(idx)}
                  isShaking={shakingIdx.includes(idx)}
                  isBouncing={bouncingIdx.includes(idx)}
                  priority={phase === 'scanning'}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Pie de Página: Récords Rápidos ──────────────────────────────────── */}
      <footer className="px-4 py-2 relative z-20 flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-white/5 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-yellow-400" />
          <span>MEJOR PUNTUACIÓN: <strong className="text-yellow-400">{bestScore.toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span>RÉCORD DE OLA: <strong className="text-cyan-400">OLA {highestWave}</strong></span>
        </div>
      </footer>

      {/* ── Banner de Oleada Superada ────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'wave_cleared' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.08, y: -20 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
          >
            <div
              className="px-10 py-7 rounded-3xl border-2 backdrop-blur-2xl text-center shadow-2xl bg-black/85 max-w-sm w-full"
              style={{ borderColor: sector.accent, boxShadow: `0 0 60px ${sector.glow}` }}
            >
              <div
                className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-[0.3em] mb-2"
                style={{ color: sector.accent }}
              >
                <Sparkles className="w-4 h-4" />
                <span>SECTOR CONQUISTADO</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-4xl font-black text-white mb-2 tracking-wide">
                ¡OLA {wave} SUPERADA!
              </div>
              <div className="font-mono text-sm text-cyan-300 font-bold">
                +{sector.timeBonus}s Bonificación de Supervivencia
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal de Game Over / Resultados Finales ──────────────────────────── */}
      <AnimatePresence>
        {phase === 'game_over' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.88, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-gradient-to-br from-[#0c101d] via-[#090d18] to-[#04060b] p-6 sm:p-8 rounded-3xl border-2 border-cyan-400/60 max-w-md w-full shadow-[0_0_80px_rgba(34,211,238,0.25)] relative overflow-hidden"
            >
              {/* Brillo decorativo */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="text-center relative z-10">
                {isNewRecord ? (
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.6)]"
                  >
                    <Trophy className="w-9 h-9 text-black" />
                  </motion.div>
                ) : (
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-cyan-400" />
                  </div>
                )}

                {isNewRecord && (
                  <span className="inline-block px-3 py-0.5 mb-2 rounded-full text-[11px] font-mono font-bold tracking-widest uppercase bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 animate-pulse">
                    ¡NUEVO RÉCORD SUPREMO!
                  </span>
                )}

                <h2 className="text-2xl sm:text-3xl font-black mb-1 bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent">
                  {isNewRecord ? '¡HAZAÑA HISTÓRICA!' : 'TIEMPO AGOTADO'}
                </h2>
                <p className="text-xs font-mono text-gray-400 mb-6">
                  {sector.name} · Fin de la transmisión
                </p>

                {/* Puntaje Principal */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 mb-4 backdrop-blur-sm">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-gray-400 block mb-1">
                    Puntuación Final
                  </span>
                  <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400 drop-shadow">
                    {score.toLocaleString()}
                  </span>
                </div>

                {/* Desglose de Estadísticas */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block">OLA</span>
                    <strong className="text-base font-mono text-green-400">{wave}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block">COMBO</span>
                    <strong className="text-base font-mono text-orange-400">×{maxCombo}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block">PAREJAS</span>
                    <strong className="text-base font-mono text-cyan-400">{totalMatches}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block">PRECISIÓN</span>
                    <strong className="text-base font-mono text-purple-400">{accuracyPercent}%</strong>
                  </div>
                </div>

                {/* Recompensas de Servidor Acreditadas */}
                {serverRewards && (
                  <div className="p-3 mb-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 flex items-center justify-around font-mono text-xs font-bold text-yellow-300">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>+{serverRewards.xpGained} XP</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span>+{serverRewards.coinsGained} Monedas</span>
                    </div>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-3 px-4 rounded-xl font-mono text-xs font-black tracking-wider uppercase bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Jugar Otra Vez</span>
                  </button>

                  <button
                    onClick={onBackToLobby}
                    className="py-3 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Home className="w-4 h-4" />
                    <span>Lobby</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
