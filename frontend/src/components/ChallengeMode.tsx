import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Trophy, Star, CheckCircle, Sparkles, Layers } from 'lucide-react';
import { getAICardMeta } from './AIFriendsGame';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Challenge {
  id: number;
  name: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  reward: number;
}

interface ChallengeModeProps {
  onBackToLobby: () => void;
}

const emojis = ['🌟', '🎮', '🚀', '💎', '🔥', '⚡', '🌈', '🎯'];

export function ChallengeMode({ onBackToLobby }: ChallengeModeProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [challenges, setChallenges] = useState<Challenge[]>([
    {
      id: 1,
      name: 'Maestro de la Memoria',
      description: 'Encuentra 5 pares',
      target: 5,
      current: 0,
      completed: false,
      reward: 100,
    },
    {
      id: 2,
      name: 'Eficiencia Máxima',
      description: 'Completa en menos de 20 movimientos',
      target: 20,
      current: 0,
      completed: false,
      reward: 150,
    },
    {
      id: 3,
      name: 'Perfeccionista',
      description: 'No falles más de 3 veces',
      target: 3,
      current: 0,
      completed: false,
      reward: 200,
    },
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [failures, setFailures] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const gameEmojis = [...emojis, ...emojis];
    const shuffled = gameEmojis
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    
    // Mostrar preview de las cartas al inicio
    setShowPreview(true);
    const previewCards = shuffled.map(card => ({ ...card, isFlipped: true }));
    setCards(previewCards);
    
    // Ocultar cartas después de 3 segundos
    setTimeout(() => {
      setCards(shuffled);
      setShowPreview(false);
    }, 3000);
  };

  const updateChallenge = (challengeId: number, increment: number) => {
    setChallenges(prevChallenges =>
      prevChallenges.map(challenge => {
        if (challenge.id === challengeId && !challenge.completed) {
          const newCurrent = challenge.current + increment;
          const completed =
            challengeId === 2
              ? moves < challenge.target
              : challengeId === 3
              ? failures <= challenge.target
              : newCurrent >= challenge.target;

          if (completed && !challenge.completed) {
            setScore(prevScore => prevScore + challenge.reward);
          }

          return {
            ...challenge,
            current: newCurrent,
            completed,
          };
        }
        return challenge;
      })
    );
  };

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
      setMoves(moves + 1);

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

          setScore(score + 50);
          updateChallenge(1, 1); // Actualizar desafío de pares

          // Verificar si el juego terminó
          if (updatedCards.every(card => card.isMatched)) {
            setGameOver(true);
            updateChallenge(2, 0); // Verificar desafío de movimientos
            updateChallenge(3, 0); // Verificar desafío de fallos
          }
        }, 500);
      } else {
        // No hay match
        // Sonido de error
        const errorSound = new Audio('https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg');
        errorSound.volume = 0.3;
        errorSound.play().catch(() => {});
        
        setFailures(failures + 1);
        setTimeout(() => {
          const updatedCards = [...cards];
          updatedCards[firstIndex].isFlipped = false;
          updatedCards[secondIndex].isFlipped = false;
          setCards(updatedCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const handleRestart = () => {
    setScore(0);
    setMoves(0);
    setFailures(0);
    setGameOver(false);
    setShowPreview(true);
    setChallenges(challenges.map(c => ({ ...c, current: 0, completed: false })));
    initializeGame();
  };

  const completedChallenges = challenges.filter(c => c.completed).length;
  const totalRewards = challenges
    .filter(c => c.completed)
    .reduce((sum, c) => sum + c.reward, 0);

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
          <Target className="w-8 h-8 text-orange-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            MODO DESAFÍO
          </h1>
        </div>

        <div className="w-32"></div>
      </div>

      <div className="grid grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
        {/* Challenges Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400" />
            Misiones Especiales
          </h2>
          {challenges.map(challenge => (
            <motion.div
              key={challenge.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                challenge.completed
                  ? 'bg-green-900/30 border-green-400'
                  : 'bg-gray-800/30 border-gray-700'
              }`}
              animate={
                challenge.completed
                  ? { scale: [1, 1.05, 1] }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-grow">
                  <h3 className="font-bold text-sm mb-1">{challenge.name}</h3>
                  <p className="text-xs text-gray-400">{challenge.description}</p>
                </div>
                {challenge.completed && (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                )}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progreso</span>
                  <span className="text-white">
                    {challenge.id === 2
                      ? `${moves}/${challenge.target}`
                      : challenge.id === 3
                      ? `${failures}/${challenge.target}`
                      : `${challenge.current}/${challenge.target}`}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      challenge.completed ? 'bg-green-400' : 'bg-orange-400'
                    }`}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        challenge.id === 2
                          ? Math.min((moves / challenge.target) * 100, 100)
                          : challenge.id === 3
                          ? Math.min((failures / challenge.target) * 100, 100)
                          : (challenge.current / challenge.target) * 100
                      }%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-xs text-yellow-400">+{challenge.reward} pts</span>
              </div>
            </motion.div>
          ))}

          {/* Stats */}
          <div className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-2 border-purple-400 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-bold text-gray-300">Estadísticas</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Puntuación:</span>
                <span className="font-bold text-purple-400">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Movimientos:</span>
                <span className="font-bold">{moves}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fallos:</span>
                <span className="font-bold text-red-400">{failures}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Game Board */}
        <div className="col-span-2">
          {/* Preview Message */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-4 p-4 bg-orange-900/30 border border-orange-500/50 rounded-xl flex items-center justify-center gap-3"
              >
                <span className="text-orange-300 font-semibold text-lg">
                  ¡MEMORIZA LAS CARTAS!
                </span>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Target className="w-5 h-5 text-orange-400" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-8 max-w-xl mx-auto w-full">
            {cards.map((card, index) => {
              const meta = getAICardMeta(card.value);
              const isRevealed = card.isFlipped || card.isMatched;

              return (
                <motion.div
                  key={card.id}
                  className="aspect-[3/4] rounded-xl sm:rounded-2xl cursor-pointer relative select-none transition-all duration-300"
                  onClick={() => handleCardClick(index)}
                  whileHover={!card.isFlipped && !card.isMatched ? { scale: 1.05, y: -2 } : {}}
                  whileTap={!card.isFlipped && !card.isMatched ? { scale: 0.95 } : {}}
                  style={{ perspective: 1000 }}
                >
                  <div
                    className={`w-full h-full rounded-xl sm:rounded-2xl transition-transform duration-500 relative shadow-lg ${
                      isRevealed
                        ? card.isMatched
                          ? 'border-2 border-[#2BE08F] bg-[#13221B] shadow-[0_0_15px_rgba(43,224,143,0.35)]'
                          : 'border-2 border-[#FF6B35] bg-[#1A1313] shadow-[0_0_15px_rgba(255,107,53,0.35)]'
                        : 'border border-[#1E2836] bg-gradient-to-br from-[#0D1119] to-[#151D2A] hover:border-[#FF6B35]/60 hover:shadow-[0_0_12px_rgba(255,107,53,0.2)]'
                    }`}
                  >
                    {isRevealed ? (
                      /* Cara frontal ilustrada */
                      <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-end p-1 sm:p-2 bg-slate-950">
                        <img
                          src={meta.image}
                          alt={meta.title}
                          className="absolute inset-0 w-full h-full object-cover filter brightness-[0.95] contrast-[1.08]"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                        {/* Categoría superior izquierda */}
                        <div
                          className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10 px-1 sm:px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 font-mono text-[7px] sm:text-[8px] uppercase tracking-wider font-semibold"
                          style={{ color: meta.color }}
                        >
                          {meta.category}
                        </div>

                        {/* Sparkles al emparejar */}
                        {card.isMatched && (
                          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 p-0.5 sm:p-1 rounded-full bg-[#2BE08F] text-black shadow-lg">
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                          </div>
                        )}

                        {/* Título de la carta abajo */}
                        <div className="relative z-10 text-center px-0.5">
                          <span className="font-serif text-[8px] sm:text-[11px] font-bold text-white block truncate leading-tight drop-shadow-md">
                            {meta.title}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Cara posterior */
                      <div className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 text-[#2C3A4E] relative bg-gradient-to-br from-[#0D1119] via-[#121926] to-[#0A0D14] rounded-xl sm:rounded-2xl">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center shadow-inner">
                          <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-400/60" />
                        </div>
                        <span className="font-mono text-[6px] sm:text-[8px] text-[#5C6675] mt-1 tracking-widest uppercase">
                          MEMORIZE
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
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
              className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl border-2 border-orange-400 max-w-md w-full mx-4"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-6xl mb-4"
                >
                  <Trophy className="w-20 h-20 mx-auto text-yellow-400" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  ¡Desafío Completado!
                </h2>
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-purple-900/30 rounded-xl">
                    <p className="text-sm text-gray-400">Puntuación Total</p>
                    <p className="text-4xl font-bold text-purple-400">{score}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400">Misiones Completadas</p>
                      <p className="text-2xl font-bold text-green-400">
                        {completedChallenges}/3
                      </p>
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400">Recompensas</p>
                      <p className="text-2xl font-bold text-yellow-400">+{totalRewards}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleRestart}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold transition-all"
                  >
                    Nuevo Desafío
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
