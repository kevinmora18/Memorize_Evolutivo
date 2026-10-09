import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClassicCard } from './ClassicCard';
import type { CardData } from './ClassicCard';
import { ClassicHUD } from './ClassicHUD';
import { ClassicResults } from './ClassicResults';
import { ParticleExplosion, ComboPopup, BombAlert, LevelUpBanner } from './ClassicEffects';
import { getEquippedPackCards, getEquippedSkinStyle } from '../lib/shopSystem';

// ── Emoji symbol sets ──────────────────────────────────────────────────────────
// Obtener cartas del pack equipado
const getSymbolSets = () => {
  const equippedCards = getEquippedPackCards();
  const colors = ['#ef4444', '#facc15', '#a855f7', '#f43f5e', '#fb7185', '#e11d48', '#fb923c', '#fcd34d'];
  
  return equippedCards.map((emoji, i) => ({
    emoji,
    color: colors[i % colors.length],
  }));
};

const SYMBOL_SETS = getSymbolSets();

// ── Level config ──────────────────────────────────────────────────────────────
function getLevelConfig(level: number) {
  // Niveles 8, 9, 10 usan TRÍADAS (grupos de 3)
  const useTriads = level >= 8;
  
  // Progresión más agresiva de pares/tríadas de cartas
  let groups: number;
  if (level <= 2) groups = 4;           // Niveles 1-2: 4 pares (8 cartas)
  else if (level <= 4) groups = 6;      // Niveles 3-4: 6 pares (12 cartas)
  else if (level <= 6) groups = 8;      // Niveles 5-6: 8 pares (16 cartas)
  else if (level === 7) groups = 10;    // Nivel 7: 10 pares (20 cartas)
  else if (level === 8) groups = 4;     // Nivel 8: 4 tríadas (12 cartas)
  else if (level === 9) groups = 5;     // Nivel 9: 5 tríadas (15 cartas)
  else groups = 6;                      // Nivel 10: 6 tríadas (18 cartas)
  
  // Tiempo más reducido por nivel
  let time: number;
  if (level === 1) time = 90;          // Nivel 1: 90 segundos
  else if (level === 2) time = 80;     // Nivel 2: 80 segundos
  else if (level === 3) time = 70;     // Nivel 3: 70 segundos
  else if (level === 4) time = 65;     // Nivel 4: 65 segundos
  else if (level === 5) time = 60;     // Nivel 5: 60 segundos
  else if (level === 6) time = 55;     // Nivel 6: 55 segundos
  else if (level === 7) time = 50;     // Nivel 7: 50 segundos
  else if (level === 8) time = 60;     // Nivel 8: 60 segundos (tríadas)
  else if (level === 9) time = 55;     // Nivel 9: 55 segundos (tríadas)
  else time = 50;                      // Nivel 10: 50 segundos (tríadas)
  
  // Mecánicas especiales por nivel
  const glitch = level >= 3 && level < 8;  // Cartas glitch desde nivel 3 hasta 7
  const bomb = level >= 4 && level < 8;    // Bombas desde nivel 4 hasta 7
  const dark = level >= 7 && level < 8;    // Oscuridad solo nivel 7
  const shuffle = level >= 5 && level < 8; // Tablero vivo desde nivel 5 hasta 7
  
  // Intervalo de mezcla (más frecuente en niveles altos)
  let shuffleInterval: number;
  if (level >= 8) shuffleInterval = 10000;      // Niveles 8-10: cada 10 segundos
  else if (level >= 6) shuffleInterval = 12000; // Niveles 6-7: cada 12 segundos
  else shuffleInterval = 15000;                 // Nivel 5: cada 15 segundos
  
  // Columnas según cantidad de grupos - MÁS ANCHO
  const cols = useTriads ? 4 : (groups <= 4 ? 4 : groups <= 6 ? 4 : groups <= 8 ? 5 : groups <= 10 ? 5 : 6);
  
  return { groups, time, glitch, bomb, dark, shuffle, shuffleInterval, cols, useTriads };
}

// ── Build card deck ───────────────────────────────────────────────────────────
function buildDeck(level: number): CardData[] {
  const cfg = getLevelConfig(level);
  const symbols = [...SYMBOL_SETS].sort(() => Math.random() - 0.5).slice(0, cfg.groups);

  const cards: CardData[] = [];
  
  if (cfg.useTriads) {
    // Niveles 8, 9, 10: Crear TRÍADAS (3 cartas iguales)
    symbols.forEach((sym, i) => {
      for (let copy = 0; copy < 3; copy++) {
        cards.push({
          id: `${i}-${copy}-${Date.now()}`,
          symbol: sym.emoji,
          emoji: sym.emoji,
          color: sym.color,
          isFlipped: false,
          isMatched: false,
          isGlitch: false,
          isBomb: false,
          isDark: false,
        });
      }
    });
  } else {
    // Niveles 1-7: Crear PAREJAS (2 cartas iguales)
    symbols.forEach((sym, i) => {
      for (let side = 0; side < 2; side++) {
        cards.push({
          id: `${i}-${side}-${Date.now()}`,
          symbol: sym.emoji,
          emoji: sym.emoji,
          color: sym.color,
          isFlipped: false,
          isMatched: false,
          isGlitch: false,
          isBomb: false,
          isDark: false,
        });
      }
    });
  }

  // Shuffle
  cards.sort(() => Math.random() - 0.5);

  // Assign glitch / bomb cards (solo en niveles 3-7)
  if (cfg.glitch) {
    const unmatched = cards.filter(c => !c.isBomb);
    // Más cartas glitch en niveles avanzados
    const glitchPercent = level >= 7 ? 0.25 : level >= 5 ? 0.20 : 0.15;
    const count = Math.max(2, Math.floor(cards.length * glitchPercent));
    const chosen = unmatched.sort(() => Math.random() - 0.5).slice(0, count);
    chosen.forEach(c => { c.isGlitch = true; });
  }
  if (cfg.bomb) {
    // Más bombas en niveles avanzados
    const bombCount = level >= 6 ? 3 : 2;
    for (let i = 0; i < bombCount; i++) {
      cards.push({
        id: `bomb-${i + 1}-${Date.now()}`,
        symbol: `BOMB-${i + 1}`,
        emoji: '💣',
        color: '#ef4444',
        isFlipped: false,
        isMatched: false,
        isGlitch: false,
        isBomb: true,
        isDark: false,
      });
    }
    cards.sort(() => Math.random() - 0.5);
  }

  return cards;
}

// ── Floating particle background ──────────────────────────────────────────────
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 3,
    duration: 6 + Math.random() * 10,
    delay: Math.random() * 8,
    color: ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 4)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: p.size, height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Scanning phase overlay ────────────────────────────────────────────────────
function ScanningOverlay({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-x-0 bottom-8 flex flex-col items-center justify-center z-30 pointer-events-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-black/80 px-8 py-4 rounded-full backdrop-blur-md flex flex-col items-center border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
        <motion.div
          className="text-xl font-black uppercase tracking-[0.2em] text-center mb-3"
          style={{ color: '#a78bfa', textShadow: '0 0 15px rgba(167,139,250,0.8)' }}
          initial={{ scale: 0.6 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          ¡MEMORIZA LAS CARTAS!
        </motion.div>
        <div className="w-56 h-1.5 bg-gray-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #c084fc)', boxShadow: '0 0 10px rgba(168,85,247,0.8)' }}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface GameScreenProps {
  initialLevel?: number;
  onBackToLobby: () => void;
}

export function GameScreen({ initialLevel = 1, onBackToLobby }: GameScreenProps) {
  const [level, setLevel] = useState(initialLevel);
  const [cards, setCards] = useState<CardData[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timer, setTimer] = useState(120);
  const [maxTime, setMaxTime] = useState(120);
  const [energy, setEnergy] = useState(60);
  const [attempts, setAttempts] = useState(0);

  type Phase = 'scanning' | 'playing' | 'levelUp' | 'results';
  const [phase, setPhase] = useState<Phase>('scanning');
  const [resultWon, setResultWon] = useState(false);

  const [shakingIdx, setShakingIdx] = useState<number[]>([]);
  const [bouncingIdx, setBouncingIdx] = useState<number[]>([]);
  const [explodingIdx] = useState<number[]>([]);
  const [explosion, setExplosion] = useState<{ x: number; y: number; color: string; id: number } | null>(null);
  const [comboActive, setComboActive] = useState(false);
  const [bombAlert, setBombAlert] = useState(false);
  const [levelUpActive, setLevelUpActive] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [darkVeil, setDarkVeil] = useState(0);
  const [shuffleWarning, setShuffleWarning] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);

  const lockRef = useRef(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ── Init / reinit ────────────────────────────────────────────────────────────
  const initLevel = useCallback((lvl: number) => {
    const cfg = getLevelConfig(lvl);
    const deck = buildDeck(lvl);
    // Show cards face-up initially
    const visible = deck.map(c => ({ ...c, isFlipped: true }));
    setCards(visible);
    setSelected([]);
    setTimer(cfg.time);
    setMaxTime(cfg.time);
    setPhase('scanning');
    setDarkVeil(0);
    lockRef.current = false;
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  // After scanning, flip all cards back
  const handleScanDone = useCallback(() => {
    setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
    setPhase('playing');
  }, []);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = setInterval(() => {
      setTimer(t => {
        if (t <= 0) {
          clearInterval(tick);
          setResultWon(false);
          setPhase('results');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase]);

  // ── Darkness veil (levels 7+) ──────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = getLevelConfig(level);
    if (!cfg.dark) return;
    const darkTick = setInterval(() => {
      setDarkVeil(v => Math.min(v + 2, 70));
    }, 2000);
    return () => clearInterval(darkTick);
  }, [phase, level]);

  // ── Tablero Vivo - Shuffle automático (levels 5+) ──────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const cfg = getLevelConfig(level);
    if (!cfg.shuffle) return;

    const shuffleTick = setInterval(() => {
      // Advertencia 2 segundos antes
      setShuffleWarning(true);
      
      // Sonido de advertencia
      const warnSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      warnSound.volume = 0.4;
      warnSound.play().catch(() => {});

      setTimeout(() => {
        setShuffleWarning(false);
        
        // Mezclar solo cartas no emparejadas y no volteadas
        setIsShuffling(true);
        
        // Sonido de mezcla
        const shuffleSound = new Audio('https://actions.google.com/sounds/v1/foley/swoosh.ogg');
        shuffleSound.volume = 0.5;
        shuffleSound.play().catch(() => {});

        setTimeout(() => {
          setCards(prev => {
            // Separar cartas emparejadas de no emparejadas
            const matched = prev.filter(c => c.isMatched);
            const unmatched = prev.filter(c => !c.isMatched);
            
            // Mezclar solo las no emparejadas
            const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
            
            // Reconstruir el array manteniendo las posiciones de las emparejadas
            const result: CardData[] = [];
            let unmatchedIndex = 0;
            
            prev.forEach(card => {
              if (card.isMatched) {
                result.push(card);
              } else {
                result.push(shuffled[unmatchedIndex++]);
              }
            });
            
            return result;
          });
          
          setIsShuffling(false);
        }, 500);
      }, 2000);
    }, cfg.shuffleInterval);

    return () => clearInterval(shuffleTick);
  }, [phase, level]);

  // ── AI score drift ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const aiTick = setInterval(() => {
      setAiScore(s => s + Math.floor(Math.random() * 80 + 20));
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(aiTick);
  }, [phase]);

  // ── Card click ────────────────────────────────────────────────────────────
  const handleCardClick = useCallback((idx: number) => {
    if (phase !== 'playing') return;
    if (lockRef.current) return;
    const card = cards[idx];
    if (card.isFlipped || card.isMatched) return;
    if (selected.includes(idx)) return;

    const cfg = getLevelConfig(level);
    const maxSelection = cfg.useTriads ? 3 : 2; // Tríadas necesitan 3 cartas

    // Sonido al voltear carta
    const flipSound = new Audio('https://actions.google.com/sounds/v1/foley/swoosh.ogg');
    flipSound.volume = 0.3;
    flipSound.play().catch(() => {});

    // Immediate bomb check
    if (card.isBomb) {
      lockRef.current = true;
      setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));
      
      // Sonido de bomba
      const bombSound = new Audio('https://actions.google.com/sounds/v1/impacts/crash.ogg');
      bombSound.volume = 0.4;
      bombSound.play().catch(() => {});
      
      setBombAlert(true);
      setTimeout(() => setBombAlert(false), 700);
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);
      setScore(s => Math.max(0, s - 200));
      setTimer(t => Math.max(0, t - 10));
      setCombo(0);
      setEnergy(e => Math.max(0, e - 20));

      const el = cardRefs.current[idx];
      if (el) {
        const rect = el.getBoundingClientRect();
        setExplosion({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color: card.color, id: Date.now() });
      }

      setTimeout(() => {
        setCards(prev => {
          let updated = prev.map((c, i) => {
             if (i === idx) return { ...c, isMatched: true };
             if (selected.includes(i)) return { ...c, isFlipped: false };
             return c;
          });
          
          const unmatched = updated.filter(c => !c.isMatched);
          unmatched.sort(() => Math.random() - 0.5);
          let unmatchedIndex = 0;
          return updated.map(c => c.isMatched ? c : unmatched[unmatchedIndex++]);
        });
        setSelected([]);
        lockRef.current = false;
      }, 1000);
      return;
    }

    // Flip
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, isFlipped: true } : c));
    const newSelected = [...selected, idx];
    setSelected(newSelected);

    if (newSelected.length < maxSelection) return;

    // Máximo de cartas seleccionadas — evaluar
    lockRef.current = true;
    setAttempts(a => a + 1);
    
    // Obtener todas las cartas seleccionadas
    const selectedCards = newSelected.map(i => cards[i]);
    const firstSymbol = selectedCards[0].symbol;
    const allMatch = selectedCards.every(c => c.symbol === firstSymbol);

    if (allMatch) {
      // Match!
      // Sonido de match exitoso
      const matchSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
      matchSound.volume = 0.5;
      matchSound.play().catch(() => {});
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(m => Math.max(m, newCombo));
      const gained = cfg.useTriads ? (150 + newCombo * 75) : (100 + newCombo * 50);
      setScore(s => s + gained);
      setEnergy(e => Math.min(100, e + (cfg.useTriads ? 12 : 8)));

      if (newCombo >= 2) {
        setComboActive(true);
        setTimeout(() => setComboActive(false), 1500);
      }

      // Bounce
      setBouncingIdx(newSelected);
      setTimeout(() => setBouncingIdx([]), 600);

      // Particle explosion at first card position
      const el = cardRefs.current[newSelected[0]];
      if (el) {
        const rect = el.getBoundingClientRect();
        setExplosion({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, color: selectedCards[0].color, id: Date.now() });
      }

      setTimeout(() => {
        setCards(prev => {
          const updated = prev.map((c, i) => newSelected.includes(i) ? { ...c, isMatched: true } : c);
          const remaining = updated.filter(c => !c.isMatched && !c.isBomb).length;
          if (remaining === 0) {
            setTimeout(() => {
              if (level < 10) {
                setLevelUpActive(true);
                setTimeout(() => {
                  setLevelUpActive(false);
                  setLevel(l => l + 1);
                  setScore(s => s + Math.ceil(timer) * 10);
                }, 2200);
              } else {
                setResultWon(true);
                setPhase('results');
              }
            }, 400);
          }
          return updated;
        });
        setSelected([]);
        lockRef.current = false;
      }, 700);
    } else {
      // Mismatch
      // Sonido de error
      const errorSound = new Audio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg');
      errorSound.volume = 0.3;
      errorSound.play().catch(() => {});
      
      setCombo(0);
      setEnergy(e => Math.max(0, e - (cfg.useTriads ? 8 : 5)));
      setShakingIdx(newSelected);
      setTimeout(() => setShakingIdx([]), 600);
      setTimeout(() => {
        setCards(prev => prev.map((c, i) => newSelected.includes(i) ? { ...c, isFlipped: false } : c));
        setSelected([]);
        lockRef.current = false;
      }, 1000);
    }
  }, [phase, cards, selected, combo, timer, level]);

  const cfg = getLevelConfig(level);
  const totalGroups = cfg.groups;
  const cardsPerGroup = cfg.useTriads ? 3 : 2;
  const matchedGroups = cards.filter(c => c.isMatched && !c.isBomb).length / cardsPerGroup;
  const accuracy = attempts > 0 ? Math.round((matchedGroups / attempts) * 100) : 100;

  // Apply dark veil to unmatched, unflipped cards
  const displayCards = cards.map(c => ({
    ...c,
    isDark: cfg.dark && !c.isFlipped && !c.isMatched && darkVeil > 0,
  }));

  return (
    <div
      className="relative flex flex-col min-h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050214 0%, #0a0520 40%, #07031a 100%)' }}
    >
      {/* Animated bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5), transparent)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.5), transparent)', filter: 'blur(40px)' }} />
      </div>
      <FloatingParticles />

      {/* Screen shake */}
      <motion.div
        className="flex flex-col flex-1 relative z-10"
        animate={screenShake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {/* HUD */}
        <ClassicHUD
          level={level}
          score={score}
          aiScore={aiScore}
          combo={combo}
          timer={timer}
          maxTime={maxTime}
          energy={energy}
          matchedPairs={matchedGroups}
          totalPairs={totalGroups}
          onBack={onBackToLobby}
        />

        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-4 relative">

          {/* Shuffle Warning */}
          <AnimatePresence>
            {shuffleWarning && (
              <motion.div
                className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
              >
                <div className="bg-orange-500/90 px-8 py-4 rounded-2xl backdrop-blur-md border-2 border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.6)]">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <span className="text-3xl">🔄</span>
                    </motion.div>
                    <div>
                      <div className="text-white font-black text-xl uppercase tracking-wider">
                        ¡TABLERO MEZCLÁNDOSE!
                      </div>
                      <div className="text-orange-100 text-sm font-semibold">
                        Las cartas cambiarán de posición...
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Darkness veil for levels 7+ */}
          {cfg.dark && darkVeil > 0 && (
            <div
              className="absolute inset-0 z-20 pointer-events-none rounded-2xl transition-all duration-1000"
              style={{ background: `rgba(2,0,10,${darkVeil / 100})` }}
            />
          )}

          <div
            className="grid gap-2 w-full max-w-6xl"
            style={{ gridTemplateColumns: `repeat(${cfg.cols}, 1fr)` }}
          >
            <AnimatePresence mode="popLayout">
              {displayCards.map((card, idx) => (
                <motion.div
                  key={card.id}
                  ref={el => { cardRefs.current[idx] = el; }}
                  style={{ aspectRatio: '3/4' }}
                  className="max-h-32"
                  layout
                  initial={isShuffling ? { scale: 0.8, opacity: 0.5 } : false}
                  animate={isShuffling ? { scale: 1, opacity: 1 } : {}}
                  transition={{ 
                    layout: { duration: 0.5, ease: "easeInOut" },
                    scale: { duration: 0.3 },
                    opacity: { duration: 0.3 }
                  }}
                >
                  <ClassicCard
                    card={card}
                    index={idx}
                    onClick={() => handleCardClick(idx)}
                    isShaking={shakingIdx.includes(idx)}
                    isBouncing={bouncingIdx.includes(idx)}
                    isExploding={explodingIdx.includes(idx)}
                    gamePhase={phase}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Scanning overlay */}
          <AnimatePresence>
            {phase === 'scanning' && <ScanningOverlay onDone={handleScanDone} />}
          </AnimatePresence>
        </div>

        {/* Bottom dark gradient */}
        <div className="h-6 w-full"
          style={{ background: 'linear-gradient(0deg, rgba(5,2,20,0.8), transparent)' }} />
      </motion.div>

      {/* Effects */}
      <BombAlert active={bombAlert} />
      <ComboPopup combo={combo} active={comboActive} />
      <LevelUpBanner level={level} active={levelUpActive} />
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

      {/* Results */}
      {phase === 'results' && (
        <ClassicResults
          level={level}
          score={score}
          aiScore={aiScore}
          accuracy={accuracy}
          maxCombo={maxCombo}
          matchedPairs={matchedGroups}
          totalPairs={totalGroups}
          timeLeft={timer}
          won={resultWon}
          onNextLevel={() => { setLevel(l => l + 1); setAttempts(0); }}
          onRetry={() => { setScore(0); setAiScore(0); setCombo(0); setMaxCombo(0); setAttempts(0); setEnergy(60); initLevel(level); }}
          onBackToLobby={onBackToLobby}
        />
      )}
    </div>
  );
}
