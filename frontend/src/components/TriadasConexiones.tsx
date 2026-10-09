import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Zap, Target, Award } from "lucide-react";
import type { Universe } from '../App';

type ModoTriada = 'ecosistema' | 'tecnologia';

interface TriadasConexionesProps {
  universe: Universe;
  modo: ModoTriada;
  onComplete: () => void;
  onBackToMenu: () => void;
  level?: number;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  triadId: number;
  relation: string;
}

interface TriadGroup {
  id: number;
  symbols: [string, string, string];
  relation: string;
}

// 🧠 SISTEMA DE TRÍADAS POR MODO
const TRIADS_BY_MODE: Record<ModoTriada, TriadGroup[]> = {
  ecosistema: [
    { id: 1, symbols: ['🌞', '🌱', '🌳'], relation: 'Sol → Semilla → Árbol' },
    { id: 2, symbols: ['🐝', '🌸', '🍯'], relation: 'Abeja → Flor → Miel' },
    { id: 3, symbols: ['☁️', '💧', '🌊'], relation: 'Nube → Lluvia → Océano' },
    { id: 4, symbols: ['🥚', '🐛', '🦋'], relation: 'Huevo → Oruga → Mariposa' },
    { id: 5, symbols: ['🌋', '🪨', '🏔️'], relation: 'Volcán → Roca → Montaña' },
  ],
  tecnologia: [
    { id: 1, symbols: ['💡', '🔋', '⚡'], relation: 'Idea → Batería → Energía' },
    { id: 2, symbols: ['🧠', '💻', '🤖'], relation: 'Cerebro → Computadora → Robot' },
    { id: 3, symbols: ['📡', '🛰️', '🌐'], relation: 'Antena → Satélite → Internet' },
    { id: 4, symbols: ['🔬', '🧪', '💊'], relation: 'Microscopio → Tubo → Medicina' },
    { id: 5, symbols: ['🎮', '📱', '🖥️'], relation: 'Juego → Móvil → PC' },
  ],
};

const MODE_CONFIG: Record<ModoTriada, { name: string; gradient: string; glowColor: string; emoji: string }> = {
  ecosistema: { name: 'ECOSISTEMA', gradient: 'from-purple-500 via-violet-500 to-purple-600', glowColor: '#8b5cf6', emoji: '🌍' },
  tecnologia: { name: 'TECNOLOGÍA', gradient: 'from-pink-500 via-rose-500 to-red-500', glowColor: '#ec4899', emoji: '⚡' },
};

export function TriadasConexiones({ universe, modo, onComplete, onBackToMenu, level = 1 }: TriadasConexionesProps) {
  const config = MODE_CONFIG[modo];
  const triads = TRIADS_BY_MODE[modo];

  const getTriadsCount = (lvl: number) => {
    if (lvl <= 2) return 3;
    if (lvl <= 4) return 4;
    if (lvl <= 6) return 5;
    return 6;
  };

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [completedTriads, setCompletedTriads] = useState<number[]>([]);
  const [gamePhase, setGamePhase] = useState<"preview" | "playing" | "victory">("preview");
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [currentHint, setCurrentHint] = useState("");
  const [showConnection, setShowConnection] = useState(false);
  const [connectionText, setConnectionText] = useState("");
  const [mistakes, setMistakes] = useState(0);

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
          setGamePhase("victory");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gamePhase, timeLeft]);

  const initializeGame = () => {
    const triadsCount = getTriadsCount(level);
    const selectedTriads = triads.slice(0, triadsCount);
    
    // Crear cartas de todas las tríadas
    const allCards: Card[] = [];
    selectedTriads.forEach((triad) => {
      triad.symbols.forEach((symbol) => {
        allCards.push({
          id: allCards.length,
          symbol,
          isFlipped: false,
          isMatched: false,
          triadId: triad.id,
          relation: triad.relation,
        });
      });
    });

    // Mezclar cartas
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setGamePhase("preview");

    // Mostrar cartas por 7 segundos
    const visible = shuffled.map(c => ({ ...c, isFlipped: true }));
    setCards(visible);

    setTimeout(() => {
      setCards(shuffled);
      setGamePhase("playing");
    }, 7000);
  };

  const handleCardClick = (index: number) => {
    if (gamePhase !== "playing") return;
    if (selectedCards.length === 3) return;

    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    // Voltear carta
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    // Si seleccionó 3 cartas
    if (newSelected.length === 3) {
      const [first, second, third] = newSelected;
      const firstCard = cards[first];
      const secondCard = cards[second];
      const thirdCard = cards[third];

      // Verificar si las 3 pertenecen a la misma tríada
      if (
        firstCard.triadId === secondCard.triadId &&
        secondCard.triadId === thirdCard.triadId
      ) {
        // ¡CONEXIÓN CORRECTA! 🎉
        const newCombo = combo + 1;
        setCombo(newCombo);
        const points = 100 * newCombo;
        setScore(prev => prev + points);

        // Mostrar conexión
        setConnectionText(firstCard.relation);
        setShowConnection(true);

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isMatched = true;
          updated[second].isMatched = true;
          updated[third].isMatched = true;
          setCards(updated);
          setSelectedCards([]);
          setShowConnection(false);

          // Agregar tríada completada
          setCompletedTriads(prev => [...prev, firstCard.triadId]);

          // Verificar victoria
          if (updated.every(c => c.isMatched)) {
            setTimeout(() => setGamePhase("victory"), 500);
          }
        }, 2000);
      } else {
        // ❌ Conexión incorrecta
        setCombo(0);
        setMistakes(prev => prev + 1);
        setScore(prev => Math.max(0, prev - 20));

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          updated[third].isFlipped = false;
          setCards(updated);
          setSelectedCards([]);
        }, 1200);
      }
    }
  };

  const getHint = () => {
    if (completedTriads.length >= 4) return;
    
    const remainingTriad = triads.find(t => !completedTriads.includes(t.id));
    if (remainingTriad) {
      setCurrentHint(remainingTriad.relation);
      setTimeout(() => setCurrentHint(""), 5000);
    }
  };

  return (
    <motion.div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: "url('/fonlobby.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/75"></div>

      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ background: `radial-gradient(circle at center, ${config.glowColor}60, transparent 70%)` }}
      />

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
          <motion.h2 
            className="text-5xl font-bold mb-2"
            style={{ 
              textShadow: `0 0 30px ${config.glowColor}`,
              background: `linear-gradient(to right, ${config.gradient})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {config.emoji} {config.name}
          </motion.h2>
          <p className="text-gray-300 text-sm">Encuentra las tríadas relacionadas (3 elementos)</p>
        </div>

        <div className="w-32" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-3 mb-6 max-w-5xl mx-auto">
          <motion.div 
            className="p-3 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-purple-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">PUNTOS</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{score}</p>
          </motion.div>

          <motion.div 
            className="p-3 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-cyan-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-gray-400">COMBO</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">x{combo}</p>
          </motion.div>

          <motion.div 
            className="p-3 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-yellow-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-gray-400">TIEMPO</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{timeLeft}s</p>
          </motion.div>

          <motion.div 
            className="p-3 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-green-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">TRÍADAS</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{completedTriads.length}/4</p>
          </motion.div>

          <motion.div 
            className="p-3 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-red-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400">ERRORES</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{mistakes}</p>
          </motion.div>
        </div>

        {/* Hint Button */}
        <div className="text-center mb-4">
          <motion.button
            onClick={getHint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 bg-gradient-to-r ${config.gradient} rounded-xl font-bold text-white shadow-lg`}
            style={{ boxShadow: `0 0 20px ${config.glowColor}` }}
          >
            💡 Pista
          </motion.button>
        </div>

        {/* Current Hint */}
        <AnimatePresence>
          {currentHint && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-4"
            >
              <div className="inline-block px-6 py-3 bg-purple-900/80 backdrop-blur-xl rounded-xl border-2 border-purple-500">
                <p className="text-purple-200 font-semibold">💡 {currentHint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Animation */}
        <AnimatePresence>
          {showConnection && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 2 }}
                className="text-center"
              >
                <div className="text-8xl mb-4">🧠✨🔗</div>
                <div className={`px-8 py-4 bg-gradient-to-r ${config.gradient} rounded-2xl shadow-2xl`}>
                  <h3 className="text-3xl font-bold text-white mb-2">¡TRÍADA COMPLETA!</h3>
                  <p className="text-xl text-white">{connectionText}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board - 4x3 grid */}
        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-2">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className={`w-24 h-24 rounded-2xl cursor-pointer flex items-center justify-center text-5xl transition-all relative ${
                  card.isMatched
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-4 border-green-300'
                    : card.isFlipped
                    ? `bg-gradient-to-br ${config.gradient} border-4 border-white/50 shadow-2xl`
                    : 'bg-gray-800/70 border-4 border-gray-600 hover:border-gray-500 backdrop-blur-xl'
                }`}
                onClick={() => handleCardClick(index)}
                whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.1, rotate: 5 } : {}}
                whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
                animate={card.isMatched ? { 
                  scale: [1, 1.15, 1],
                  rotate: [0, 15, -15, 0]
                } : {}}
                style={{
                  boxShadow: card.isFlipped && !card.isMatched ? `0 0 40px ${config.glowColor}` : 'none',
                }}
              >
                {card.isFlipped || card.isMatched ? (
                  <motion.span
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {card.symbol}
                  </motion.span>
                ) : (
                  <span className="text-4xl">{config.emoji}</span>
                )}
                
                {/* Selection indicator */}
                {selectedCards.includes(index) && !card.isMatched && (
                  <motion.div
                    className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {selectedCards.indexOf(index) + 1}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-gray-300 text-sm">
            Selecciona 3 cartas que formen una cadena lógica
          </p>
          <p className="text-purple-400 text-xs mt-2">
            Ejemplo: 🌞 → 🌱 → 🌳 = Sol nutre semilla que crece en árbol
          </p>
        </div>
      </div>

      {/* Victory Screen */}
      <AnimatePresence>
        {gamePhase === "victory" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 360, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-9xl mb-6"
              >
                {config.emoji}🔗✨
              </motion.div>
              <h2 
                className="text-6xl font-bold mb-4"
                style={{ 
                  textShadow: `0 0 40px ${config.glowColor}`,
                  background: `linear-gradient(to right, ${config.gradient})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                ¡MAESTRO DE TRÍADAS!
              </h2>
              <p className="text-3xl text-gray-300 mb-4">
                Todas las cadenas encontradas
              </p>
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 mb-4 inline-block">
                <p className="text-5xl font-bold text-purple-400 mb-2">{score}</p>
                <p className="text-gray-400">Puntos Totales</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4">
                  <p className="text-sm text-gray-400">Errores</p>
                  <p className="text-2xl font-bold text-red-400">{mistakes}</p>
                </div>
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl p-4">
                  <p className="text-sm text-gray-400">Tiempo usado</p>
                  <p className="text-2xl font-bold text-yellow-400">{120 - timeLeft}s</p>
                </div>
              </div>
              <p className="text-2xl text-yellow-400 mb-8">
                +350 XP ganados
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onComplete}
                className={`px-12 py-4 bg-gradient-to-r ${config.gradient} hover:brightness-110 rounded-xl font-bold text-xl text-white shadow-2xl`}
                style={{ boxShadow: `0 0 40px ${config.glowColor}` }}
              >
                Continuar
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
