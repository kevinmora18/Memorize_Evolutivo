import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Zap, Target, Award } from "lucide-react";
import type { Universe } from '../App';

type ModoConexion = 'naturaleza' | 'ciencia' | 'humano';

interface ParejasConexionesProps {
  universe: Universe;
  modo: ModoConexion;
  onComplete: () => void;
  onBackToMenu: () => void;
  level?: number; // Nivel opcional, por defecto 1
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  pairId: number;
  relation: string;
}

interface PairGroup {
  id: number;
  symbols: [string, string];
  relation: string;
}

// 🧠 SISTEMA DE PAREJAS POR MODO
const PAIRS_BY_MODE: Record<ModoConexion, PairGroup[]> = {
  naturaleza: [
    { id: 1, symbols: ['🐝', '🍯'], relation: 'Abeja produce miel' },
    { id: 2, symbols: ['🐟', '🌊'], relation: 'Pez vive en océano' },
    { id: 3, symbols: ['🌳', '🍃'], relation: 'Árbol tiene hojas' },
    { id: 4, symbols: ['☁️', '💧'], relation: 'Nube trae lluvia' },
    { id: 5, symbols: ['🌸', '🦋'], relation: 'Flor atrae mariposa' },
    { id: 6, symbols: ['🌞', '🌻'], relation: 'Sol nutre girasol' },
    { id: 7, symbols: ['🐛', '🍂'], relation: 'Oruga come hoja' },
    { id: 8, symbols: ['🌱', '🌧️'], relation: 'Semilla necesita lluvia' },
  ],
  ciencia: [
    { id: 1, symbols: ['🤖', '💻'], relation: 'Robot usa computadora' },
    { id: 2, symbols: ['🔬', '🧪'], relation: 'Microscopio analiza tubo' },
    { id: 3, symbols: ['⚡', '🔋'], relation: 'Electricidad carga batería' },
    { id: 4, symbols: ['🛰️', '📡'], relation: 'Satélite envía señal' },
    { id: 5, symbols: ['🧬', '💉'], relation: 'ADN en inyección' },
    { id: 6, symbols: ['🔭', '⭐'], relation: 'Telescopio ve estrellas' },
    { id: 7, symbols: ['💡', '🧠'], relation: 'Idea del cerebro' },
    { id: 8, symbols: ['🌐', '📱'], relation: 'Internet en móvil' },
  ],
  humano: [
    { id: 1, symbols: ['👑', '🏰'], relation: 'Rey vive en castillo' },
    { id: 2, symbols: ['⚔️', '🛡️'], relation: 'Espada y escudo' },
    { id: 3, symbols: ['🍳', '👨‍🍳'], relation: 'Chef cocina comida' },
    { id: 4, symbols: ['🎸', '🎵'], relation: 'Guitarra hace música' },
    { id: 5, symbols: ['📚', '🎓'], relation: 'Libros dan educación' },
    { id: 6, symbols: ['🎨', '🖼️'], relation: 'Arte crea cuadro' },
    { id: 7, symbols: ['⚽', '🥅'], relation: 'Balón entra en portería' },
    { id: 8, symbols: ['💍', '💒'], relation: 'Anillo en boda' },
  ],
};

const MODE_CONFIG: Record<ModoConexion, { name: string; gradient: string; glowColor: string; emoji: string }> = {
  naturaleza: { name: 'NATURALEZA', gradient: 'from-green-500 via-emerald-500 to-teal-500', glowColor: '#10b981', emoji: '🌿' },
  ciencia: { name: 'CIENCIA', gradient: 'from-blue-500 via-cyan-500 to-sky-500', glowColor: '#3b82f6', emoji: '🔬' },
  humano: { name: 'HUMANO', gradient: 'from-amber-500 via-orange-500 to-yellow-500', glowColor: '#f59e0b', emoji: '👑' },
};

const UNIVERSE_CONFIG: Record<Universe, { name: string; bgGradient: string }> = {
  volcania: { name: 'Volcania', bgGradient: 'from-orange-950 via-red-950 to-black' },
  frostheim: { name: 'Frostheim', bgGradient: 'from-cyan-950 via-blue-950 to-black' },
  neural: { name: 'Neural', bgGradient: 'from-emerald-950 via-teal-950 to-black' },
  verdalis: { name: 'Verdalis', bgGradient: 'from-lime-950 via-green-950 to-black' },
  lunaris: { name: 'Lunaris', bgGradient: 'from-purple-950 via-violet-950 to-black' },
};

export function ParejasConexiones({ universe, modo, onComplete, onBackToMenu, level = 1 }: ParejasConexionesProps) {
  const config = MODE_CONFIG[modo];
  const universeConfig = UNIVERSE_CONFIG[universe];
  const pairs = PAIRS_BY_MODE[modo];

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [completedPairs, setCompletedPairs] = useState<number[]>([]);
  const [gamePhase, setGamePhase] = useState<"preview" | "playing" | "victory">("preview");
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [currentHint, setCurrentHint] = useState("");
  const [showConnection, setShowConnection] = useState(false);
  const [connectionText, setConnectionText] = useState("");
  const [mistakes, setMistakes] = useState(0);

  // Calcular cantidad de parejas según el nivel
  const getPairsCount = (lvl: number) => {
    if (lvl <= 2) return 4;      // Niveles 1-2: 4 parejas (8 cartas)
    if (lvl <= 4) return 6;      // Niveles 3-4: 6 parejas (12 cartas)
    if (lvl <= 6) return 7;      // Niveles 5-6: 7 parejas (14 cartas)
    return 8;                    // Nivel 7+: 8 parejas (16 cartas)
  };

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
    // Tomar parejas según el nivel
    const pairsCount = getPairsCount(level);
    const selectedPairs = pairs.slice(0, pairsCount);
    
    // Crear cartas de todas las parejas
    const allCards: Card[] = [];
    selectedPairs.forEach((pair) => {
      pair.symbols.forEach((symbol) => {
        allCards.push({
          id: allCards.length,
          symbol,
          isFlipped: false,
          isMatched: false,
          pairId: pair.id,
          relation: pair.relation,
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
    if (selectedCards.length === 2) return;

    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    // Voltear carta
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    // Si seleccionó 2 cartas
    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      const firstCard = cards[first];
      const secondCard = cards[second];

      // Verificar si las 2 pertenecen a la misma pareja
      if (firstCard.pairId === secondCard.pairId) {
        // ¡CONEXIÓN CORRECTA! 🎉
        const newCombo = combo + 1;
        setCombo(newCombo);
        const points = 50 * newCombo;
        setScore(prev => prev + points);

        // Mostrar conexión
        setConnectionText(firstCard.relation);
        setShowConnection(true);

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isMatched = true;
          updated[second].isMatched = true;
          setCards(updated);
          setSelectedCards([]);
          setShowConnection(false);

          // Agregar pareja completada
          setCompletedPairs(prev => [...prev, firstCard.pairId]);

          // Verificar victoria
          if (updated.every(c => c.isMatched)) {
            setTimeout(() => setGamePhase("victory"), 500);
          }
        }, 1500);
      } else {
        // ❌ Conexión incorrecta
        setCombo(0);
        setMistakes(prev => prev + 1);
        setScore(prev => Math.max(0, prev - 10));

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          setCards(updated);
          setSelectedCards([]);
        }, 1000);
      }
    }
  };

  const getHint = () => {
    if (completedPairs.length >= 6) return;
    
    const remainingPair = pairs.find(p => !completedPairs.includes(p.id));
    if (remainingPair) {
      setCurrentHint(remainingPair.relation);
      setTimeout(() => setCurrentHint(""), 4000);
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
          <p className="text-gray-300 text-sm">Encuentra las parejas relacionadas</p>
          <p className="text-purple-400 text-xs mt-1">{universeConfig.name}</p>
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
              <span className="text-xs text-gray-400">PAREJAS</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{completedPairs.length}/6</p>
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
                transition={{ duration: 1.5 }}
                className="text-center"
              >
                <div className="text-8xl mb-4">✨🧠✨</div>
                <div className={`px-8 py-4 bg-gradient-to-r ${config.gradient} rounded-2xl shadow-2xl`}>
                  <h3 className="text-3xl font-bold text-white mb-2">¡CONEXIÓN!</h3>
                  <p className="text-xl text-white">{connectionText}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board */}
        <div className="flex justify-center">
          <div className="grid grid-cols-4 gap-1">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className={`w-28 h-28 rounded-2xl cursor-pointer flex items-center justify-center text-5xl transition-all relative ${
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
            Selecciona 2 cartas que estén relacionadas entre sí
          </p>
          <p className="text-purple-400 text-xs mt-2">
            Ejemplo: 🐝 ↔ 🍯 = Abeja produce miel
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
                {config.emoji}✨
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
                ¡MAESTRO DE CONEXIONES!
              </h2>
              <p className="text-3xl text-gray-300 mb-4">
                Todas las parejas encontradas
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
                  <p className="text-2xl font-bold text-yellow-400">{90 - timeLeft}s</p>
                </div>
              </div>
              <p className="text-2xl text-yellow-400 mb-8">
                +250 XP ganados
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
