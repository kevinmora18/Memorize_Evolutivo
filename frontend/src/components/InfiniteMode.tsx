import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Zap, Trophy, InfinityIcon } from 'lucide-react';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface InfiniteModeProps {
  onBackToLobby: () => void;
}

const emojis = ['🌟', '🎮', '🚀', '💎', '🔥', '⚡', '🌈', '🎯', '🎪', '🎨', '🎭', '🎬'];

export function InfiniteMode({ onBackToLobby }: InfiniteModeProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timePerRound, setTimePerRound] = useState(1000); // Milisegundos por tick
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    initializeGame();
  }, [level]);

  useEffect(() => {
    if (timeLeft > 0 && !gameOver && !showPreview) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), timePerRound);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      if (score > bestScore) {
        setBestScore(score);
      }
    }
  }, [timeLeft, gameOver, showPreview, timePerRound]);

  const initializeGame = useCallback(() => {
    const pairCount = Math.min(4 + level, 8);
    const selectedEmojis = emojis.slice(0, pairCount);
    const gameEmojis = [...selectedEmojis, ...selectedEmojis];
    const shuffled = gameEmojis
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    
    // Mostrar preview de las cartas al inicio
    setShowPreview(true);
    const previewCards = shuffled.map(card => ({ ...card, isFlipped: true }));
    setCards(previewCards);
    
    // Ocultar cartas después de 3 segundos
    setTimeout(() => {
      setCards(shuffled);
      setShowPreview(false);
    }, 3000);
  }, [level]);

  const handleCardClick = (index: number) => {
    if (
      flippedCards.length === 2 ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      gameOver ||
      showPreview
    ) {
      return;
    }

    // Sonido al voltear carta
    const flipSound = new Audio('https://actions.google.com/sounds/v1/foley/swoosh.ogg');
    flipSound.volume = 0.3;
    flipSound.play().catch(() => {});

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = newFlippedCards;
      if (cards[firstIndex].value === cards[secondIndex].value) {
        // Match encontrado
        // Sonido de match exitoso
        const matchSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
        matchSound.volume = 0.5;
        matchSound.play().catch(() => {});
        
        setTimeout(() => {
          const updatedCards = [...cards];
          updatedCards[firstIndex].isMatched = true;
          updatedCards[secondIndex].isMatched = true;
          setCards(updatedCards);
          setFlippedCards([]);

          const newCombo = combo + 1;
          setCombo(newCombo);
          const points = 10 * newCombo;
          setScore(score + points);
          setTimeLeft(timeLeft + 3); // Bonus de tiempo

          // Verificar si completó el nivel
          if (updatedCards.every(card => card.isMatched)) {
            setLevel(level + 1);
            setTimeLeft(timeLeft + 10); // Bonus extra por completar nivel
          }
        }, 500);
      } else {
        // No hay match - incrementar errores y reducir tiempo
        // Sonido de error
        const errorSound = new Audio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg');
        errorSound.volume = 0.3;
        errorSound.play().catch(() => {});
        
        const newErrors = errors + 1;
        setErrors(newErrors);
        
        // Reducir tiempo por tick basado en errores (más errores = más rápido)
        const newTimePerRound = Math.max(400, 1000 - (newErrors * 50));
        setTimePerRound(newTimePerRound);
        
        setTimeout(() => {
          const updatedCards = [...cards];
          updatedCards[firstIndex].isFlipped = false;
          updatedCards[secondIndex].isFlipped = false;
          setCards(updatedCards);
          setFlippedCards([]);
          setCombo(0); // Resetear combo
        }, 1000);
      }
    }
  };

  const handleRestart = () => {
    setScore(0);
    setTimeLeft(60);
    setGameOver(false);
    setLevel(1);
    setCombo(0);
    setErrors(0);
    setTimePerRound(1000);
    initializeGame();
  };

  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050214 0%, #0a0520 40%, #07031a 100%)' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5), transparent)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.5), transparent)', filter: 'blur(40px)' }} />
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 1 + Math.random() * 3,
              height: 1 + Math.random() * 3,
              background: ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24'][Math.floor(Math.random() * 4)],
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 6 + Math.random() * 10,
              delay: Math.random() * 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Lobby</span>
        </button>

        <div className="flex items-center gap-3">
          <InfinityIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            MODO INFINITO
          </h1>
        </div>

        <div className="w-32"></div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-6 gap-4 mb-8 max-w-5xl mx-auto relative z-10">
        <motion.div
          className="p-4 bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border-2 border-cyan-400 rounded-xl"
          animate={{ scale: timeLeft < 10 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: timeLeft < 10 ? Infinity : 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-gray-300">Tiempo</span>
          </div>
          <p className={`text-3xl font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-cyan-400'}`}>
            {timeLeft}s
          </p>
        </motion.div>

        <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-2 border-purple-400 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-300">Puntos</span>
          </div>
          <p className="text-3xl font-bold text-purple-400">{score}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-2 border-orange-400 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-300">Combo</span>
          </div>
          <p className="text-3xl font-bold text-orange-400">x{combo}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/30 border-2 border-green-400 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <InfinityIcon className="w-5 h-5 text-green-400" />
            <span className="text-sm text-gray-300">Nivel</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{level}</p>
        </div>

        <motion.div 
          className="p-4 bg-gradient-to-br from-red-900/30 to-red-800/30 border-2 border-red-400 rounded-xl"
          animate={{ scale: errors > 5 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: errors > 5 ? Infinity : 0 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-300">Errores</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{errors}</p>
        </motion.div>

        <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-2 border-yellow-400 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-300">Mejor</span>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{bestScore}</p>
        </div>
      </div>
      
      {/* Difficulty Indicator */}
      {errors > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 relative z-10"
        >
          <p className="text-sm text-gray-400">
            Velocidad: <span className={`font-bold ${timePerRound < 600 ? 'text-red-400' : timePerRound < 800 ? 'text-orange-400' : 'text-yellow-400'}`}>
              {timePerRound < 600 ? 'MUY RÁPIDO' : timePerRound < 800 ? 'RÁPIDO' : 'NORMAL'}
            </span>
          </p>
        </motion.div>
      )}

      {/* Game Board */}
      <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-8 relative z-10">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`aspect-square rounded-xl cursor-pointer ${
              card.isMatched
                ? 'bg-green-500/20 border-2 border-green-400'
                : card.isFlipped
                ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-cyan-400'
                : 'bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600'
            } flex items-center justify-center text-5xl transition-all`}
            onClick={() => handleCardClick(index)}
            whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05 } : {}}
            whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
            animate={
              card.isFlipped || card.isMatched
                ? { rotateY: 180 }
                : { rotateY: 0 }
            }
            transition={{ duration: 0.3 }}
          >
            {card.isFlipped || card.isMatched ? card.value : '?'}
          </motion.div>
        ))}
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-cyan-400 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-6xl mb-4"
                >
                  <Trophy className="w-20 h-20 mx-auto text-yellow-400" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  ¡Tiempo Agotado!
                </h2>
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-purple-900/30 rounded-xl">
                    <p className="text-sm text-gray-400">Puntuación Final</p>
                    <p className="text-4xl font-bold text-purple-400">{score}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400">Nivel Alcanzado</p>
                      <p className="text-2xl font-bold text-green-400">{level}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400">Errores</p>
                      <p className="text-2xl font-bold text-red-400">{errors}</p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400">Mejor Puntuación</p>
                      <p className="text-2xl font-bold text-yellow-400">{bestScore}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 rounded-xl font-bold transition-all"
                  >
                    Jugar de Nuevo
                  </button>
                  <button
                    onClick={onBackToLobby}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all"
                  >
                    Salir
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
