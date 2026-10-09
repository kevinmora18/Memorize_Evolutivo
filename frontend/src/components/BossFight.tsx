import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Flame,
  Snowflake,
  Eye,
  Brain,
  Skull,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Universe } from '../App';

type BossType = 'conexiones' | 'caos' | 'congelante' | 'ilusion' | 'neural' | 'parasito';

interface BossFightProps {
  universe: Universe;
  bossType: BossType;
  onBossDefeated: () => void;
  onBackToMenu: () => void;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  isFake?: boolean;
  isFrozen?: boolean;
}

const bossConfig: Record<Universe, { name: string; emoji: string; gradient: string; bgGradient: string; glowColor: string; symbols: string[] }> = {
  volcania: { name: 'Ignis el Destructor', emoji: '🐉', gradient: 'from-orange-600 via-red-600 to-amber-600', bgGradient: 'from-orange-950 via-red-950 to-black', glowColor: '#ff4500', symbols: ['🍎', '🍓', '🍒', '🍅', '🍉', '🌶️', '🍄', '🎈'] },
  frostheim: { name: 'Glacius el Eterno', emoji: '🧊', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', bgGradient: 'from-cyan-950 via-blue-950 to-black', glowColor: '#00d4ff', symbols: ['🫐', '🍇', '🍆', '🍬', '🪁', '💎', '🐟', '🧊'] },
  neural: { name: 'Synapse la Mente', emoji: '🤖', gradient: 'from-emerald-400 via-teal-500 to-cyan-500', bgGradient: 'from-emerald-950 via-teal-950 to-black', glowColor: '#00ff88', symbols: ['🍏', '🍐', '🥝', '🍈', '🥒', '🥦', '🔋', '🧩'] },
  verdalis: { name: 'Gaia la Ancestral', emoji: '🌳', gradient: 'from-lime-500 via-green-500 to-emerald-600', bgGradient: 'from-lime-950 via-green-950 to-black', glowColor: '#7fff00', symbols: ['🍋', '🍌', '🍍', '🌻', '🧀', '🌽', '🚕', '☀️'] },
  lunaris: { name: 'Noctis el Oscuro', emoji: '🌑', gradient: 'from-purple-400 via-violet-500 to-purple-600', bgGradient: 'from-purple-950 via-violet-950 to-black', glowColor: '#b19cd9', symbols: ['🍑', '🍊', '🥭', '🥕', '🎃', '🏀', '🦊', '🐅'] },
};

const bossAbilities: Record<BossType, { name: string; description: string; icon: any; color: string }> = {
  conexiones: { name: 'Conexiones', description: 'Encuentra relaciones mentales', icon: Brain, color: '#a855f7' },
  caos: { name: 'Caos', description: 'Mezcla cartas constantemente', icon: Flame, color: '#ff4500' },
  congelante: { name: 'Congelante', description: 'Bloquea cartas temporalmente', icon: Snowflake, color: '#00d4ff' },
  ilusion: { name: 'Ilusión', description: 'Crea cartas falsas', icon: Eye, color: '#b19cd9' },
  neural: { name: 'Neural', description: 'Aumenta velocidad del juego', icon: Brain, color: '#00ff88' },
  parasito: { name: 'Parásito', description: 'Roba tiempo al fallar', icon: Skull, color: '#ef4444' },
};

export function BossFight({ universe, bossType, onBossDefeated, onBackToMenu }: BossFightProps) {
  const boss = bossConfig[universe];
  const ability = bossAbilities[bossType];
  const AbilityIcon = ability.icon;

  const [bossHealth, setBossHealth] = useState(100);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [gamePhase, setGamePhase] = useState<"preview" | "playing" | "victory" | "defeat">("preview");
  const [combo, setCombo] = useState(0);
  const [bossRage, setBossRage] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentAttack, setCurrentAttack] = useState("");
  const [bossLaughing, setBossLaughing] = useState(false);
  const [screenPulse, setScreenPulse] = useState(false);
  const rageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  // Timer
  useEffect(() => {
    if (gamePhase !== "playing" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGamePhase("defeat");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, timeLeft]);

  // Boss Rage Timer
  useEffect(() => {
    if (gamePhase !== "playing") return;

    rageIntervalRef.current = setInterval(() => {
      activateBossAbility();
    }, 20000);

    return () => {
      if (rageIntervalRef.current) clearInterval(rageIntervalRef.current);
    };
  }, [gamePhase, bossType]);

  const initializeGame = () => {
    const pairCount = 8;
    const selectedSymbols = boss.symbols.slice(0, pairCount);
    const gameSymbols = [...selectedSymbols, ...selectedSymbols];
    const shuffled = gameSymbols
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false,
        isFake: false,
        isFrozen: false,
      }));
    
    setCards(shuffled);
    setGamePhase("preview");
    
    // Show cards for 3 seconds
    const visible = shuffled.map(c => ({ ...c, isFlipped: true }));
    setCards(visible);
    
    setTimeout(() => {
      setCards(shuffled);
      setGamePhase("playing");
    }, 3000);
  };

  const activateBossAbility = () => {
    const newRage = Math.min(bossRage + 20, 100);
    setBossRage(newRage);

    setScreenPulse(true);
    setTimeout(() => setScreenPulse(false), 500);

    setBossLaughing(true);
    playSound('laugh');
    setTimeout(() => setBossLaughing(false), 1000);

    switch (bossType) {
      case 'caos':
        setCards(prev => [...prev].sort(() => Math.random() - 0.5));
        setCurrentAttack("¡CAOS! Las cartas se mezclan");
        break;

      case 'congelante':
        setCards(prev => {
          const unfrozen = prev.filter(c => !c.isFrozen);
          const toFreeze = unfrozen.slice(0, 2);
          return prev.map(c => 
            toFreeze.includes(c) ? { ...c, isFrozen: true } : c
          );
        });
        setCurrentAttack("¡CONGELACIÓN! Cartas bloqueadas");
        setTimeout(() => {
          setCards(prev => prev.map(c => ({ ...c, isFrozen: false })));
        }, 5000);
        break;

      case 'ilusion':
        setCards(prev => {
          const fakeCard: Card = {
            id: Math.max(...prev.map(c => c.id)) + 1,
            symbol: '❌',
            isFlipped: false,
            isMatched: false,
            isFake: true,
            isFrozen: false,
          };
          return [...prev, fakeCard];
        });
        setCurrentAttack("¡ILUSIÓN! Aparece una carta falsa");
        break;

      case 'neural':
        setTimeLeft(prev => Math.max(prev - 10, 5));
        setCurrentAttack("¡VELOCIDAD! Tiempo reducido");
        break;

      case 'parasito':
        setTimeLeft(prev => Math.max(prev - 10, 5));
        setCurrentAttack("¡PARÁSITO! Tiempo robado");
        break;
    }

    setTimeout(() => setCurrentAttack(""), 2000);
  };

  const handleCardClick = (index: number) => {
    if (gamePhase !== "playing") return;
    if (flippedCards.length === 2) return;

    const card = cards[index];
    if (card.isFlipped || card.isMatched || card.isFrozen) return;

    playSound('flip');

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const firstCard = cards[first];
      const secondCard = cards[second];

      if (firstCard.isFake || secondCard.isFake) {
        playSound('error');
        setFailCount(prev => prev + 1);
        setBossRage(prev => Math.min(prev + 10, 100));
        setCombo(0);

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          setCards(updated);
          setFlippedCards([]);
        }, 1000);
      } else if (firstCard.symbol === secondCard.symbol) {
        playSound('match');
        const newCombo = combo + 1;
        setCombo(newCombo);

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isMatched = true;
          updated[second].isMatched = true;
          setCards(updated);
          setFlippedCards([]);

          const damage = 25 + newCombo * 5;
          const newHealth = Math.max(0, bossHealth - damage);
          setBossHealth(newHealth);

          if (newHealth === 0 || updated.filter(c => !c.isFake).every(c => c.isMatched)) {
            setGamePhase("victory");
          }
        }, 500);
      } else {
        playSound('error');
        setFailCount(prev => prev + 1);
        setBossRage(prev => Math.min(prev + 15, 100));
        setCombo(0);

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          setCards(updated);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const playSound = (type: string) => {
    if (!soundEnabled) return;

    const sounds: Record<string, string> = {
      flip: 'https://actions.google.com/sounds/v1/foley/swoosh.ogg',
      match: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg',
      error: 'https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg',
      laugh: 'https://actions.google.com/sounds/v1/cartoon/cartoon_laugh.ogg',
    };

    const audio = new Audio(sounds[type] || sounds.flip);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden transition-all duration-300"
      style={{ 
        background: `linear-gradient(180deg, ${boss.bgGradient})`,
      }}
      animate={screenPulse ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {/* Rage Effect */}
      <AnimatePresence>
        {bossRage > 60 && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: bossRage / 200 }}
            exit={{ opacity: 0 }}
            style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.3), transparent)' }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <button 
          onClick={onBackToMenu}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Salir</span>
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-red-500">¡JEFE FINAL!</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <AbilityIcon className="w-5 h-5" style={{ color: ability.color }} />
            <span className="text-sm text-gray-300">{ability.name}: {ability.description}</span>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 h-[calc(100vh-120px)] flex flex-col">
        {/* Boss Section */}
        <div className="flex-1 flex flex-col items-center justify-start mb-8">
          {/* Boss Health */}
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }}
            className="w-96 mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-2xl font-bold" style={{ textShadow: `0 0 20px ${boss.glowColor}` }}>
                {boss.name}
              </h3>
              <div className="text-4xl">{boss.emoji}</div>
            </div>
            <div className="w-full h-8 bg-gray-800 rounded-full border-2 border-gray-700 overflow-hidden">
              <motion.div 
                className={`h-full bg-gradient-to-r ${boss.gradient}`}
                initial={{ width: '100%' }}
                animate={{ width: `${bossHealth}%` }}
                transition={{ duration: 0.5 }}
                style={{ boxShadow: `0 0 20px ${boss.glowColor}` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span className="text-gray-400">Salud del Boss</span>
              <span className="text-white font-bold">{bossHealth} / 100</span>
            </div>
          </motion.div>

          {/* Rage Meter */}
          <motion.div 
            className="w-96 mb-8"
            animate={bossRage > 60 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: bossRage > 60 ? Infinity : 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <Flame className="w-4 h-4" />
                IRA DEL BOSS
              </h4>
              <span className="text-sm text-red-400">{Math.floor(bossRage)}%</span>
            </div>
            <div className="w-full h-6 bg-gray-800 rounded-full border-2 border-red-500 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-500 via-red-500 to-red-600"
                animate={{ width: `${bossRage}%` }}
                transition={{ duration: 0.3 }}
                style={{ boxShadow: `0 0 15px rgba(239,68,68,0.8)` }}
              />
            </div>
          </motion.div>

          {/* Boss Laughing */}
          <AnimatePresence>
            {bossLaughing && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                className="absolute text-6xl"
              >
                😈
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Attack */}
          <AnimatePresence>
            {currentAttack && (
              <motion.div
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className="mt-8 px-8 py-4 bg-red-900/80 rounded-xl border-2 border-red-500 text-center"
              >
                <p className="text-2xl font-bold text-red-300">{currentAttack}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Board */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className={`w-20 h-20 rounded-xl cursor-pointer flex items-center justify-center text-4xl transition-all ${
                  card.isMatched
                    ? 'bg-green-500/20 border-2 border-green-400'
                    : card.isFlipped
                    ? `bg-gradient-to-br ${boss.gradient} border-2 border-white/30`
                    : card.isFrozen
                    ? 'bg-blue-500/30 border-2 border-blue-400'
                    : 'bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => handleCardClick(index)}
                whileHover={!card.isFlipped && !card.isMatched && !card.isFrozen ? { scale: 1.05 } : {}}
                whileTap={!card.isFlipped && !card.isMatched && !card.isFrozen ? { scale: 0.95 } : {}}
                animate={card.isFrozen ? { opacity: [0.5, 1, 0.5] } : {}}
                transition={{ duration: 1, repeat: card.isFrozen ? Infinity : 0 }}
              >
                {card.isFrozen && <Snowflake className="w-6 h-6 text-blue-400" />}
                {card.isFlipped || card.isMatched ? card.symbol : '?'}
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 w-full max-w-md">
            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
              <p className="text-xs text-gray-400">Combo</p>
              <p className="text-2xl font-bold text-cyan-400">x{combo}</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
              <p className="text-xs text-gray-400">Tiempo</p>
              <p className="text-2xl font-bold text-yellow-400">{timeLeft}s</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
              <p className="text-xs text-gray-400">Fallos</p>
              <p className="text-2xl font-bold text-red-400">{failCount}</p>
            </div>
            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
              <p className="text-xs text-gray-400">Tu Salud</p>
              <p className="text-2xl font-bold text-green-400">100</p>
            </div>
          </div>
        </div>
      </div>

      {/* Victory Screen */}
      <AnimatePresence>
        {gamePhase === "victory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-9xl mb-6"
              >
                🏆
              </motion.div>
              <h2 className="text-5xl font-bold mb-4" style={{ textShadow: `0 0 40px ${boss.glowColor}` }}>
                ¡VICTORIA!
              </h2>
              <p className="text-2xl text-gray-300 mb-6">
                Has derrotado a {boss.name}
              </p>
              <p className="text-lg text-yellow-400 mb-8">
                +200 XP ganados
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBossDefeated}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 rounded-xl font-bold text-lg"
              >
                Continuar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defeat Screen */}
      <AnimatePresence>
        {gamePhase === "defeat" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-9xl mb-6"
              >
                💀
              </motion.div>
              <h2 className="text-5xl font-bold mb-4 text-red-500">
                ¡DERROTA!
              </h2>
              <p className="text-2xl text-gray-300 mb-6">
                {boss.name} te ha vencido
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl font-bold text-lg"
                >
                  Reintentar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToMenu}
                  className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg"
                >
                  Salir
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
