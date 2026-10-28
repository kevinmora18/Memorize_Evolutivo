import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryCard, type MemoryCardData } from './MemoryCard';
import { GameHUD } from './GameHUD';
import { ClassicResults } from './ClassicResults';
import {
  ParticleExplosion, ComboPopup, BombAlert, LevelUpBanner,
  FreezeOverlay, PowerAlert
} from './ClassicEffects';
import { InGameCompanionWidget } from './InGameCompanionWidget';
import {
  getLevel, cardPoolFor, shuffleInPlace, matchPoints,
  TIME_BONUS_PER_SECOND, BOMB_PENALTY, loadClassicProgress,
  POWERS, type LevelDef, type PowerId
} from '../lib/classicCampaign';
import { BOMB_CARD } from '../lib/cardCatalog';
import { UNIVERSE_TOKENS, AN } from '../lib/archivoTokens';

interface GameScreenProps {
  initialLevel?: number;
  onBackToLobby: () => void;
}

type CardData = MemoryCardData & {
  symbol: string;
  color: string;
  isGlitch: boolean;
  isBomb: boolean;
  isDark: boolean;
  isHinted?: boolean;
};

export function GameScreen({ initialLevel = 1, onBackToLobby }: GameScreenProps) {
  const [level, setLevel] = useState(initialLevel);
  const [levelDef, setLevelDef] = useState<LevelDef>(() => getLevel(initialLevel));
  const [cards, setCards] = useState<CardData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timer, setTimer] = useState(100);
  const [maxTime, setMaxTime] = useState(100);
  const [energy, setEnergy] = useState(60);
  const [attempts, setAttempts] = useState(0);

  // Fases del juego
  type Phase = 'scanning' | 'playing' | 'results';
  const [phase, setPhase] = useState<Phase>('scanning');
  const [resultWon, setResultWon] = useState(false);

  // Poderes del jugador
  const [unlockedPowers, setUnlockedPowers] = useState<PowerId[]>([]);
  const [usedPowers, setUsedPowers] = useState<PowerId[]>([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [powerAlert, setPowerAlert] = useState<{ name: string; color: string } | null>(null);

  // Efectos visuales interactivos
  const [shakingIdx, setShakingIdx] = useState<number[]>([]);
  const [bouncingIdx, setBouncingIdx] = useState<number[]>([]);
  const [explodingIdx, setExplodingIdx] = useState<number[]>([]);
  const [explosion, setExplosion] = useState<{ x: number; y: number; color: string; id: number } | null>(null);
  const [comboActive, setComboActive] = useState(false);
  const [bombAlert, setBombAlert] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [darkVeil, setDarkVeil] = useState(0);
  const [shuffleWarning, setShuffleWarning] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const lockRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reproducir sonido con control de errores
  const playSound = useCallback((url: string, vol = 0.35) => {
    try {
      const audio = new Audio(url);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch {}
  }, []);

  // ── Construcción del mazo específico para el nivel ──────────────────────────
  const buildLevelDeck = useCallback((def: LevelDef): CardData[] => {
    const pool = cardPoolFor(def);
    const chosenCards = pool.slice(0, def.groups);
    const copiesPerCard = def.useTriads ? 3 : 2;

    const deck: CardData[] = [];

    chosenCards.forEach((c, groupIdx) => {
      const color = UNIVERSE_TOKENS[c.universe].accent;
      for (let copy = 0; copy < copiesPerCard; copy++) {
        deck.push({
          id: `${c.id}-${copy}-${Date.now()}-${Math.random()}`,
          symbol: c.id,
          artId: c.id,
          accent: color,
          color,
          isFlipped: false,
          isMatched: false,
          isGlitch: false,
          isBomb: false,
          isDark: false,
        });
      }
    });

    // Mezclar inicialmente
    shuffleInPlace(deck);

    // Asignar glitches si el nivel los tiene
    if (def.glitchRatio > 0) {
      const glitchCount = Math.max(1, Math.floor(deck.length * def.glitchRatio));
      const glitchTargets = [...deck].sort(() => Math.random() - 0.5).slice(0, glitchCount);
      glitchTargets.forEach((card) => {
        card.isGlitch = true;
      });
    }

    // Insertar bombas si el nivel las tiene
    if (def.bombs > 0) {
      for (let b = 0; b < def.bombs; b++) {
        deck.push({
          id: `bomb-${b}-${Date.now()}-${Math.random()}`,
          symbol: `BOMB-${b}`,
          artId: BOMB_CARD.id,
          accent: AN.danger,
          color: AN.danger,
          isFlipped: false,
          isMatched: false,
          isGlitch: false,
          isBomb: true,
          isDark: false,
        });
      }
      shuffleInPlace(deck);
    }

    return deck;
  }, []);

  // ── Inicializar nivel ───────────────────────────────────────────────────────
  const initLevel = useCallback(
    (lvlNum: number) => {
      const def = getLevel(lvlNum);
      setLevelDef(def);

      // Cargar poderes desbloqueados por el jugador
      const prog = loadClassicProgress();
      setUnlockedPowers(prog.powers);
      setUsedPowers([]);
      setIsFrozen(false);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);

      const deck = buildLevelDeck(def);
      // Fase de escaneo: cartas cara arriba
      const previewDeck = deck.map((c) => ({ ...c, isFlipped: true }));
      setCards(previewDeck);
      setSelected([]);
      setTimer(def.time);
      setMaxTime(def.time);
      setDarkVeil(0);
      setPhase('scanning');
      lockRef.current = false;

      // Sonido de inicio de nivel
      playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_pulse.ogg', 0.4);

      // Finalizar escaneo tras `previewMs`
      const scanTimeout = setTimeout(() => {
        setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
        setPhase('playing');
        playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.3);
      }, def.previewMs);

      return () => clearTimeout(scanTimeout);
    },
    [buildLevelDeck, playSound]
  );

  useEffect(() => {
    const cleanup = initLevel(level);
    return cleanup;
  }, [level, initLevel]);

  // ── Temporizador de la partida ──────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    if (isFrozen) return; // Si el poder de congelación está activo, el tiempo se detiene

    const tick = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(tick);
          setResultWon(false);
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, isFrozen]);

  // ── Oscuridad Progresiva (Niveles con `dark: true`) ────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || !levelDef.dark) return;

    const darkInterval = setInterval(() => {
      setDarkVeil((v) => Math.min(v + 3, 65));
    }, 2500);

    return () => clearInterval(darkInterval);
  }, [phase, levelDef.dark]);

  // ── Tablero Vivo / Reshuffle periódico ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing' || !levelDef.shuffleEvery) return;

    const shuffleInterval = setInterval(() => {
      // Advertencia 2 segundos antes
      setShuffleWarning(true);
      playSound('https://actions.google.com/sounds/v1/alarms/beep_short.ogg', 0.3);

      setTimeout(() => {
        setShuffleWarning(false);
        setIsShuffling(true);
        playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.4);

        setTimeout(() => {
          setCards((prev) => {
            const matched = prev.filter((c) => c.isMatched);
            const unmatched = prev.filter((c) => !c.isMatched);
            shuffleInPlace(unmatched);

            let unmatchedIdx = 0;
            return prev.map((c) => (c.isMatched ? c : unmatched[unmatchedIdx++]));
          });
          setIsShuffling(false);
        }, 400);
      }, 1800);
    }, levelDef.shuffleEvery);

    return () => clearInterval(shuffleInterval);
  }, [phase, levelDef.shuffleEvery, playSound]);

  // ── Activación de Poderes ──────────────────────────────────────────────────
  const handleUsePower = useCallback(
    (powerId: PowerId) => {
      if (phase !== 'playing') return;
      if (!unlockedPowers.includes(powerId) || usedPowers.includes(powerId)) return;

      const power = POWERS[powerId];
      setUsedPowers((prev) => [...prev, powerId]);
      setPowerAlert({ name: power.name, color: power.color });
      setTimeout(() => setPowerAlert(null), 2500);

      playSound('https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg', 0.5);

      if (powerId === 'reveal') {
        // Destello: revela todas las cartas ocultas durante 1.5s
        setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: true })));
        setTimeout(() => {
          setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false })));
          playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.3);
        }, 1500);
      } else if (powerId === 'freeze') {
        // Escarcha Temporal: detiene el reloj durante 8s
        setIsFrozen(true);
        if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
        freezeTimerRef.current = setTimeout(() => {
          setIsFrozen(false);
          playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_laser.ogg', 0.3);
        }, 8000);
      } else if (powerId === 'hint') {
        // Brújula: resalta un par/tríada sin emparejar durante 2.5s
        const unmatched = cards.filter((c) => !c.isMatched && !c.isBomb);
        if (unmatched.length > 0) {
          const targetSymbol = unmatched[0].symbol;
          setCards((prev) =>
            prev.map((c) => (c.symbol === targetSymbol ? { ...c, isHinted: true } : c))
          );
          setTimeout(() => {
            setCards((prev) => prev.map((c) => ({ ...c, isHinted: false })));
          }, 2500);
        }
      }
    },
    [phase, unlockedPowers, usedPowers, cards, playSound]
  );

  // ── Habilidades del Compañero 3D (Zorro / Gato) ─────────────────────────────
  // Revela e ilumina temporalmente un par oculto idéntico durante 2.2s
  const handleCompanionReveal = useCallback(() => {
    if (phase !== 'playing') return;
    const unmatched = cards.filter((c) => !c.isMatched && !c.isBomb);
    if (unmatched.length === 0) return;

    // Seleccionar un símbolo no emparejado al azar
    const uniqueSymbols = Array.from(new Set(unmatched.map((c) => c.symbol)));
    const targetSymbol = uniqueSymbols[Math.floor(Math.random() * uniqueSymbols.length)];

    // Dar la vuelta a las cartas correspondientes e iluminarlas con resplandor
    setCards((prev) =>
      prev.map((c) =>
        c.symbol === targetSymbol
          ? { ...c, isFlipped: true, isHinted: true }
          : c
      )
    );

    playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.4);

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) =>
          c.symbol === targetSymbol && !c.isMatched
            ? { ...c, isFlipped: false, isHinted: false }
            : { ...c, isHinted: false }
        )
      );
    }, 2200);
  }, [phase, cards, playSound]);

  // Congela el tiempo durante 6 segundos
  const handleCompanionFreeze = useCallback(() => {
    if (phase !== 'playing') return;
    setIsFrozen(true);
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    freezeTimerRef.current = setTimeout(() => {
      setIsFrozen(false);
      playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_laser.ogg', 0.3);
    }, 6000);
  }, [phase, playSound]);

  // ── Clic en Carta ──────────────────────────────────────────────────────────
  const handleCardClick = useCallback(
    (idx: number) => {
      if (phase !== 'playing') return;
      if (lockRef.current) return;
      const card = cards[idx];
      if (!card || card.isFlipped || card.isMatched) return;
      if (selected.includes(idx)) return;

      const requiredSelection = levelDef.useTriads ? 3 : 2;

      playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.25);

      // Si es una anomalía / bomba
      if (card.isBomb) {
        lockRef.current = true;
        setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));
        playSound('https://actions.google.com/sounds/v1/impacts/crash.ogg', 0.5);

        setBombAlert(true);
        setTimeout(() => setBombAlert(false), 800);
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);

        // Penalizaciones
        setScore((s) => Math.max(0, s - BOMB_PENALTY.points));
        setTimer((t) => Math.max(1, t - BOMB_PENALTY.seconds));
        setCombo(0);
        setEnergy((e) => Math.max(0, e - 25));

        const el = cardRefs.current[idx];
        if (el) {
          const rect = el.getBoundingClientRect();
          setExplosion({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            color: AN.danger,
            id: Date.now(),
          });
        }

        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c, i) => {
              if (i === idx) return { ...c, isMatched: true };
              if (selected.includes(i)) return { ...c, isFlipped: false };
              return c;
            });

            // Reorganizar cartas restantes por la explosión
            const unmatched = updated.filter((c) => !c.isMatched);
            shuffleInPlace(unmatched);
            let uIdx = 0;
            return updated.map((c) => (c.isMatched ? c : unmatched[uIdx++]));
          });
          setSelected([]);
          lockRef.current = false;
        }, 900);
        return;
      }

      // Voltear carta
      setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, isFlipped: true } : c)));
      const newSelected = [...selected, idx];
      setSelected(newSelected);

      if (newSelected.length < requiredSelection) return;

      // Evaluar coincidencia
      lockRef.current = true;
      setAttempts((a) => a + 1);

      const selectedCards = newSelected.map((i) => cards[i]);
      const targetSymbol = selectedCards[0].symbol;
      const isMatch = selectedCards.every((c) => c.symbol === targetSymbol);

      if (isMatch) {
        // ¡Coincidencia exitosa!
        playSound('https://actions.google.com/sounds/v1/cartoon/pop.ogg', 0.5);
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((m) => Math.max(m, newCombo));

        const pointsGained = matchPoints(levelDef.useTriads, newCombo);
        setScore((s) => s + pointsGained);
        setEnergy((e) => Math.min(100, e + (levelDef.useTriads ? 15 : 10)));

        if (newCombo >= 2) {
          setComboActive(true);
          setTimeout(() => setComboActive(false), 1400);
        }

        // Efecto de rebote
        setBouncingIdx(newSelected);
        setTimeout(() => setBouncingIdx([]), 500);

        // Partículas en la primera carta
        const firstEl = cardRefs.current[newSelected[0]];
        if (firstEl) {
          const rect = firstEl.getBoundingClientRect();
          setExplosion({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            color: selectedCards[0].color,
            id: Date.now(),
          });
        }

        setTimeout(() => {
          setCards((prev) => {
            const updated = prev.map((c, i) =>
              newSelected.includes(i) ? { ...c, isMatched: true } : c
            );
            const remaining = updated.filter((c) => !c.isMatched && !c.isBomb).length;

            if (remaining === 0) {
              // Nivel completado con éxito
              const timeBonus = Math.max(0, Math.round(timer)) * TIME_BONUS_PER_SECOND;
              setScore((s) => s + timeBonus);
              setResultWon(true);
              setPhase('results');
            }
            return updated;
          });
          setSelected([]);
          lockRef.current = false;
        }, 600);
      } else {
        // Fallo
        playSound('https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg', 0.25);
        setCombo(0);
        setEnergy((e) => Math.max(0, e - 5));
        setShakingIdx(newSelected);
        setTimeout(() => setShakingIdx([]), 500);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (newSelected.includes(i) ? { ...c, isFlipped: false } : c))
          );
          setSelected([]);
          lockRef.current = false;
        }, 850);
      }
    },
    [phase, cards, selected, levelDef, combo, timer, playSound]
  );

  // Estadísticas del juego
  const cardsPerGroup = levelDef.useTriads ? 3 : 2;
  const matchedGroups = cards.filter((c) => c.isMatched && !c.isBomb).length / cardsPerGroup;
  const accuracy = attempts > 0 ? Math.round((matchedGroups / attempts) * 100) : 100;

  // Fondo pictórico del reino actual
  const wingBgBase = `/classic/wing-${levelDef.wing}`;

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden select-none bg-[#07090F]"
    >
      {/* Dynamic Wing Background Image */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-45 mix-blend-screen transition-opacity duration-1000">
        <picture>
          <source type="image/avif" srcSet={`${wingBgBase}-960.avif 960w, ${wingBgBase}-1920.avif 1920w`} sizes="100vw" />
          <source type="image/webp" srcSet={`${wingBgBase}-960.webp 960w, ${wingBgBase}-1920.webp 1920w`} sizes="100vw" />
          <img
            src={`${wingBgBase}-1920.webp`}
            alt={levelDef.wing}
            className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.1]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-transparent to-[#07090F]/90" />
      </div>

      {/* Grain & Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* Screen Shake Container */}
      <motion.div
        className="flex flex-col flex-1 relative z-10"
        animate={screenShake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* Modernized HUD */}
        <GameHUD
          level={level}
          wing={levelDef.wing}
          title={levelDef.title}
          score={score}
          combo={combo}
          timer={timer}
          maxTime={maxTime}
          isFrozen={isFrozen}
          energy={energy}
          matchedPairs={matchedGroups}
          totalPairs={levelDef.groups}
          useTriads={levelDef.useTriads}
          unlockedPowers={unlockedPowers}
          usedPowers={usedPowers}
          onUsePower={handleUsePower}
          onBack={onBackToLobby}
          showPowers={false}
        />

        {/* Compañero 3D en miniatura en la parte superior izquierda con Habilidades Activas */}
        <InGameCompanionWidget
          onRevealPair={handleCompanionReveal}
          onFreezeTime={handleCompanionFreeze}
          combo={combo}
          matchedCount={cards.filter((c) => c.isMatched).length}
          isGameActive={phase === 'playing'}
        />

        {/* Board Playing Area */}
        <div className="flex-1 flex items-center justify-center p-4 relative">

          {/* Shuffle Warning Banner */}
          <AnimatePresence>
            {shuffleWarning && (
              <motion.div
                className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
              >
                <div
                  className="px-6 py-2.5 rounded-full border shadow-2xl flex items-center gap-3 backdrop-blur-md"
                  style={{
                    background: 'rgba(7,9,15,0.94)',
                    borderColor: 'rgba(232,181,74,0.6)',
                  }}
                >
                  <span className="font-mono text-sm text-[#E8B54A] animate-spin">⟳</span>
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#E8B54A]">
                    TABLERO VIVO · REORDENANDO EN BREVE...
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Darkness Veil Effect for Dark Levels */}
          {levelDef.dark && darkVeil > 0 && (
            <div
              className="absolute inset-0 z-20 pointer-events-none transition-all duration-1000"
              style={{ background: `rgba(2,2,8,${darkVeil / 100})` }}
            />
          )}

          {/* Cards Grid */}
          <div
            className="grid gap-2.5 w-full max-w-5xl justify-items-center"
            style={{ gridTemplateColumns: `repeat(${levelDef.cols}, minmax(0, 1fr))` }}
          >
            <AnimatePresence mode="popLayout">
              {cards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  style={{ aspectRatio: '3/4' }}
                  className="w-full max-w-[130px] max-h-36 relative"
                  layout
                  initial={isShuffling ? { scale: 0.8, opacity: 0.6 } : false}
                  animate={
                    card.isHinted
                      ? { scale: [1, 1.08, 1], filter: 'drop-shadow(0 0 15px #E8B54A)' }
                      : isShuffling
                      ? { scale: 1, opacity: 1 }
                      : {}
                  }
                  transition={{
                    layout: { duration: 0.45, ease: 'easeInOut' },
                    scale: card.isHinted ? { repeat: Infinity, duration: 1 } : { duration: 0.3 },
                  }}
                >
                  <MemoryCard
                    card={card}
                    index={idx}
                    backUniverse={levelDef.wing}
                    interactive={phase === 'playing'}
                    onClick={() => handleCardClick(idx)}
                    isShaking={shakingIdx.includes(idx)}
                    isBouncing={bouncingIdx.includes(idx)}
                    isExploding={explodingIdx.includes(idx)}
                    priority={phase === 'scanning'}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Scanning Phase Countdown Bar */}
          <AnimatePresence>
            {phase === 'scanning' && (
              <motion.div
                className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center z-30 pointer-events-none"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="an-panel-raised px-8 py-3.5 rounded-2xl backdrop-blur-md flex flex-col items-center border border-[#1E2836] shadow-2xl">
                  <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#35E0C8] mb-1">
                    FASE DE MEMORIZACIÓN
                  </div>
                  <div className="font-serif text-xl text-white mb-2 font-medium">
                    Memoriza las reliquias antes de ocultarse
                  </div>
                  <div className="w-52 h-[3px] bg-[#07090F] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#35E0C8] to-[#E8B54A]"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: levelDef.previewMs / 1000, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* Special Visual Effects */}
      <FreezeOverlay active={isFrozen} />
      <PowerAlert powerName={powerAlert?.name ?? null} color={powerAlert?.color ?? '#35E0C8'} />
      <BombAlert active={bombAlert} />
      <ComboPopup combo={combo} active={comboActive} />
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

      {/* Comprehensive Results Modal */}
      {phase === 'results' && (
        <ClassicResults
          level={level}
          score={score}
          aiScore={0}
          accuracy={accuracy}
          maxCombo={maxCombo}
          matchedPairs={matchedGroups}
          totalPairs={levelDef.groups}
          timeLeft={timer}
          maxTime={maxTime}
          won={resultWon}
          onNextLevel={() => {
            setLevel((l) => l + 1);
            setAttempts(0);
          }}
          onRetry={() => {
            setScore(0);
            setCombo(0);
            setMaxCombo(0);
            setAttempts(0);
            setEnergy(60);
            initLevel(level);
          }}
          onBackToLobby={onBackToLobby}
        />
      )}
    </div>
  );
}
