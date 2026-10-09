import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Brain, Zap, Target, Award } from "lucide-react";
import type { Universe } from '../App';

interface ConexionesMentalesProps {
  universe: Universe;
  onComplete: () => void;
  onBackToMenu: () => void;
}

interface Card {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  groupId: number;
  relation: string;
}

interface TriadGroup {
  id: number;
  symbols: string[];
  relation: string;
  theme: string;
}

// 🧠 SISTEMA DE TRÍADAS POR UNIVERSO
const TRIADS_BY_UNIVERSE: Record<Universe, TriadGroup[]> = {
  volcania: [
    { id: 1, symbols: ['🔥', '🌋', '🪨'], relation: 'Ecosistema volcánico', theme: 'Fuego crea lava, lava crea roca' },
    { id: 2, symbols: ['☀️', '🌡️', '💧'], relation: 'Ciclo del calor', theme: 'Sol calienta, calor evapora agua' },
    { id: 3, symbols: ['🐉', '🔥', '💎'], relation: 'Leyenda del dragón', theme: 'Dragón escupe fuego, fuego forja gemas' },
    { id: 4, symbols: ['🌶️', '🔥', '😰'], relation: 'Reacción picante', theme: 'Chile tiene fuego, fuego causa sudor' },
  ],
  frostheim: [
    { id: 1, symbols: ['❄️', '🧊', '💎'], relation: 'Cristalización', theme: 'Nieve se congela, hielo forma cristales' },
    { id: 2, symbols: ['🐧', '🐟', '🌊'], relation: 'Cadena alimenticia', theme: 'Pingüino caza pez en océano' },
    { id: 3, symbols: ['🌨️', '⛄', '🎿'], relation: 'Diversión invernal', theme: 'Nieve crea muñeco, nieve permite esquiar' },
    { id: 4, symbols: ['🌙', '🌌', '⭐'], relation: 'Noche polar', theme: 'Luna ilumina galaxia llena de estrellas' },
  ],
  neural: [
    { id: 1, symbols: ['🤖', '💻', '⚡'], relation: 'IA y energía', theme: 'Robot usa computadora con electricidad' },
    { id: 2, symbols: ['🧠', '💡', '🔬'], relation: 'Innovación', theme: 'Cerebro tiene idea, ciencia la desarrolla' },
    { id: 3, symbols: ['📡', '🛰️', '🌐'], relation: 'Comunicación global', theme: 'Antena conecta satélite a internet' },
    { id: 4, symbols: ['🔋', '⚡', '💾'], relation: 'Almacenamiento', theme: 'Batería da energía para guardar datos' },
  ],
  verdalis: [
    { id: 1, symbols: ['🌳', '🍃', '🌿'], relation: 'Crecimiento vegetal', theme: 'Árbol tiene hojas y plantas' },
    { id: 2, symbols: ['🐝', '🌸', '🍯'], relation: 'Polinización', theme: 'Abeja poliniza flor, produce miel' },
    { id: 3, symbols: ['🌧️', '🌱', '🌻'], relation: 'Ciclo de vida', theme: 'Lluvia nutre semilla, crece girasol' },
    { id: 4, symbols: ['🦋', '🥚', '🐛'], relation: 'Metamorfosis', theme: 'Mariposa pone huevo, nace oruga' },
  ],
  lunaris: [
    { id: 1, symbols: ['🌑', '🌊', '🌕'], relation: 'Mareas lunares', theme: 'Luna oscura mueve océano, luna llena lo eleva' },
    { id: 2, symbols: ['🦇', '🌙', '🏰'], relation: 'Noche misteriosa', theme: 'Murciélago vuela bajo luna cerca del castillo' },
    { id: 3, symbols: ['⭐', '🔭', '👁️'], relation: 'Observación', theme: 'Estrella vista por telescopio y ojo' },
    { id: 4, symbols: ['🌌', '🪐', '🚀'], relation: 'Exploración espacial', theme: 'Galaxia contiene planetas, cohete los explora' },
  ],
};

const UNIVERSE_CONFIG: Record<Universe, { name: string; gradient: string; glowColor: string }> = {
  volcania: { name: 'Volcania', gradient: 'from-orange-600 via-red-600 to-amber-600', glowColor: '#ff4500' },
  frostheim: { name: 'Frostheim', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', glowColor: '#00d4ff' },
  neural: { name: 'Neural', gradient: 'from-emerald-400 via-teal-500 to-cyan-500', glowColor: '#00ff88' },
  verdalis: { name: 'Verdalis', gradient: 'from-lime-500 via-green-500 to-emerald-600', glowColor: '#7fff00' },
  lunaris: { name: 'Lunaris', gradient: 'from-purple-400 via-violet-500 to-purple-600', glowColor: '#b19cd9' },
};

export function ConexionesMentales({ universe, onComplete, onBackToMenu }: ConexionesMentalesProps) {
  const config = UNIVERSE_CONFIG[universe];
  const triads = TRIADS_BY_UNIVERSE[universe];

  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [completedGroups, setCompletedGroups] = useState<number[]>([]);
  const [gamePhase, setGamePhase] = useState<"preview" | "playing" | "victory">("preview");
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [score, setScore] = useState(0);
  const [currentHint, setCurrentHint] = useState("");
  const [showConnection, setShowConnection] = useState(false);
  const [connectionText, setConnectionText] = useState("");

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
    // Tomar 3 tríadas para el juego
    const selectedTriads = triads.slice(0, 3);
    
    // Crear cartas de todas las tríadas
    const allCards: Card[] = [];
    selectedTriads.forEach((triad) => {
      triad.symbols.forEach((symbol, index) => {
        allCards.push({
          id: allCards.length,
          symbol,
          isFlipped: false,
          isMatched: false,
          groupId: triad.id,
          relation: triad.relation,
        });
      });
    });

    // Mezclar cartas
    const shuffled = allCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setGamePhase("preview");

    // Mostrar cartas por 4 segundos
    const visible = shuffled.map(c => ({ ...c, isFlipped: true }));
    setCards(visible);

    setTimeout(() => {
      setCards(shuffled);
      setGamePhase("playing");
    }, 4000);
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

      // Verificar si las 3 pertenecen al mismo grupo
      if (
        firstCard.groupId === secondCard.groupId &&
        secondCard.groupId === thirdCard.groupId
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

          // Agregar grupo completado
          setCompletedGroups(prev => [...prev, firstCard.groupId]);

          // Verificar victoria
          if (updated.every(c => c.isMatched)) {
            setTimeout(() => setGamePhase("victory"), 500);
          }
        }, 2000);
      } else {
        // ❌ Conexión incorrecta
        setCombo(0);
        setScore(prev => Math.max(0, prev - 20));

        setTimeout(() => {
          const updated = [...cards];
          updated[first].isFlipped = false;
          updated[second].isFlipped = false;
          updated[third].isFlipped = false;
          setCards(updated);
          setSelectedCards([]);
        }, 1500);
      }
    }
  };

  const getHint = () => {
    if (completedGroups.length >= triads.length) return;
    
    const remainingTriad = triads.find(t => !completedGroups.includes(t.id));
    if (remainingTriad) {
      setCurrentHint(remainingTriad.theme);
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
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Gradient overlay */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ background: `radial-gradient(circle at center, ${config.glowColor}40, transparent 70%)` }}
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
            className="text-4xl font-bold mb-2"
            style={{ 
              textShadow: `0 0 30px ${config.glowColor}`,
              background: `linear-gradient(to right, ${config.gradient})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🧠 CONEXIONES MENTALES
          </motion.h2>
          <p className="text-gray-300 text-sm">Encuentra las 3 cartas relacionadas</p>
        </div>

        <div className="w-32" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
          <motion.div 
            className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-purple-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400">PUNTOS</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">{score}</p>
          </motion.div>

          <motion.div 
            className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-cyan-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-gray-400">COMBO</span>
            </div>
            <p className="text-3xl font-bold text-cyan-400">x{combo}</p>
          </motion.div>

          <motion.div 
            className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-yellow-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-yellow-400" />
              <span className="text-xs text-gray-400">TIEMPO</span>
            </div>
            <p className="text-3xl font-bold text-yellow-400">{timeLeft}s</p>
          </motion.div>

          <motion.div 
            className="p-4 bg-gray-800/50 backdrop-blur-xl rounded-xl border-2 border-green-500/30"
            whileHover={{ scale: 1.05 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">GRUPOS</span>
            </div>
            <p className="text-3xl font-bold text-green-400">{completedGroups.length}/3</p>
          </motion.div>
        </div>

        {/* Hint Button */}
        <div className="text-center mb-6">
          <motion.button
            onClick={getHint}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white shadow-lg"
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
              className="text-center mb-6"
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
                  rotate: [0, 360],
                }}
                transition={{ duration: 2 }}
                className="text-center"
              >
                <div className="text-8xl mb-4">🧠✨</div>
                <div className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-2xl">
                  <h3 className="text-3xl font-bold text-white mb-2">¡CONEXIÓN!</h3>
                  <p className="text-xl text-purple-100">{connectionText}</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Board */}
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <motion.div
                key={card.id}
                className={`w-28 h-28 rounded-2xl cursor-pointer flex items-center justify-center text-6xl transition-all relative ${
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
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0]
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
                  <span className="text-4xl">🧠</span>
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
        <div className="mt-8 text-center">
          <p className="text-gray-300 text-sm">
            Selecciona 3 cartas que estén relacionadas entre sí
          </p>
          <p className="text-purple-400 text-xs mt-2">
            Ejemplo: 🐝 + 🌸 + 🍯 = Polinización
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
                🧠✨
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
                ¡MENTE MAESTRA!
              </h2>
              <p className="text-3xl text-gray-300 mb-4">
                Todas las conexiones encontradas
              </p>
              <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl p-6 mb-8 inline-block">
                <p className="text-5xl font-bold text-purple-400 mb-2">{score}</p>
                <p className="text-gray-400">Puntos Totales</p>
              </div>
              <p className="text-2xl text-yellow-400 mb-8">
                +300 XP ganados
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
