import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Bot, Trophy, Zap, Brain } from 'lucide-react';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
  groupId?: number;
  relation?: string;
}

interface Player {
  id: number;
  name: string;
  isAI: boolean;
  score: number;
  avatar: string;
  color: string;
}

interface AIFriendsGameProps {
  onBackToLobby: () => void;
}

const GAME_MODES = {
  classic: {
    name: 'Clásico',
    emojis: ['🌟', '🎮', '🚀', '💎', '🔥', '⚡', '🌈', '🎯'],
    description: 'Encuentra pares iguales',
    cardsPerMatch: 2,
    icon: '🎮',
  },
  connections: {
    name: 'Conexiones',
    pairs: [
      { id: 1, symbols: ['🐝', '🍯'], relation: 'Abeja produce miel' },
      { id: 2, symbols: ['🐟', '🌊'], relation: 'Pez vive en océano' },
      { id: 3, symbols: ['🌳', '🍃'], relation: 'Árbol tiene hojas' },
      { id: 4, symbols: ['☁️', '💧'], relation: 'Nube trae lluvia' },
      { id: 5, symbols: ['🌸', '🦋'], relation: 'Flor atrae mariposa' },
      { id: 6, symbols: ['🌞', '🌻'], relation: 'Sol nutre girasol' },
      { id: 7, symbols: ['🐛', '🍂'], relation: 'Oruga come hoja' },
      { id: 8, symbols: ['🌱', '🌧️'], relation: 'Semilla necesita lluvia' },
    ],
    description: 'Encuentra parejas relacionadas',
    cardsPerMatch: 2,
    icon: '🧠',
    emojis: [],
  },
  triads: {
    name: 'Tríadas',
    triads: [
      { id: 1, symbols: ['🌞', '🌱', '🌳'], relation: 'Sol → Semilla → Árbol' },
      { id: 2, symbols: ['🐝', '🌸', '🍯'], relation: 'Abeja → Flor → Miel' },
      { id: 3, symbols: ['☁️', '💧', '🌊'], relation: 'Nube → Lluvia → Océano' },
      { id: 4, symbols: ['🥚', '🐛', '🦋'], relation: 'Huevo → Oruga → Mariposa' },
    ],
    description: 'Encuentra tríos conectados',
    cardsPerMatch: 3,
    icon: '⚡',
    emojis: [],
  },
} as const;

export function AIFriendsGame({ onBackToLobby }: AIFriendsGameProps) {
  const gameMode = (localStorage.getItem('aiFriendsMode') || 'classic') as
    | 'classic'
    | 'connections'
    | 'triads';
  const roomName = localStorage.getItem('aiFriendsRoomName') || 'Sala de IA';
  const cardCount = parseInt(localStorage.getItem('aiFriendsCardCount') || '4');
  const modeConfig = GAME_MODES[gameMode];

  const [players] = useState<Player[]>([
    { id: 1, name: 'Tú', isAI: false, score: 0, avatar: '👤', color: 'cyan' },
    { id: 2, name: 'NeuroBot Alpha', isAI: true, score: 0, avatar: '🤖', color: 'purple' },
    { id: 3, name: 'SynapticAI', isAI: true, score: 0, avatar: '🧠', color: 'green' },
    { id: 4, name: 'MemoryCore', isAI: true, score: 0, avatar: '⚡', color: 'orange' },
  ]);

  // ── Render state ──────────────────────────────────────────────────────────
  const [cards, setCards] = useState<Card[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState<number[]>([0, 0, 0, 0]);
  const [gameOver, setGameOver] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [showConnection, setShowConnection] = useState(false);
  const [connectionText, setConnectionText] = useState('');
  const [gamePhase, setGamePhase] = useState<'preview' | 'playing'>('preview');
  const [previewCountdown, setPreviewCountdown] = useState(5);

  // ── Refs (always up-to-date inside setTimeout callbacks) ──────────────────
  const cardsRef = useRef<Card[]>([]);
  const flippedRef = useRef<number[]>([]);
  const currentPlayerRef = useRef(0);
  const scoresRef = useRef([0, 0, 0, 0]);
  const gameOverRef = useRef(false);
  const isProcessingRef = useRef(false); // prevents double-evaluation

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeGame();
  }, []);

  // Countdown during preview
  useEffect(() => {
    if (gamePhase === 'preview' && previewCountdown > 0) {
      const timer = setTimeout(() => setPreviewCountdown((p) => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, previewCountdown]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const syncCards = (newCards: Card[]) => {
    cardsRef.current = newCards;
    setCards(newCards);
  };

  const playSound = (url: string, volume = 0.4) => {
    try {
      const audio = new Audio(url);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (_) {}
  };

  // ── Initialize ────────────────────────────────────────────────────────────
  const initializeGame = () => {
    let gameCards: Card[] = [];

    if (gameMode === 'classic') {
      const selectedEmojis = GAME_MODES.classic.emojis.slice(0, cardCount);
      gameCards = [...selectedEmojis, ...selectedEmojis]
        .sort(() => Math.random() - 0.5)
        .map((value, index) => ({ id: index, value, isFlipped: false, isMatched: false }));
    } else if (gameMode === 'connections') {
      GAME_MODES.connections.pairs.slice(0, cardCount).forEach((pair) => {
        pair.symbols.forEach((symbol) => {
          gameCards.push({
            id: gameCards.length,
            value: symbol,
            isFlipped: false,
            isMatched: false,
            groupId: pair.id,
            relation: pair.relation,
          });
        });
      });
      gameCards = gameCards.sort(() => Math.random() - 0.5);
    } else if (gameMode === 'triads') {
      GAME_MODES.triads.triads.slice(0, cardCount).forEach((triad) => {
        triad.symbols.forEach((symbol) => {
          gameCards.push({
            id: gameCards.length,
            value: symbol,
            isFlipped: false,
            isMatched: false,
            groupId: triad.id,
            relation: triad.relation,
          });
        });
      });
      gameCards = gameCards.sort(() => Math.random() - 0.5);
    }

    // Reset refs
    cardsRef.current = gameCards;
    flippedRef.current = [];
    currentPlayerRef.current = 0;
    scoresRef.current = [0, 0, 0, 0];
    gameOverRef.current = false;
    isProcessingRef.current = false;

    // Reset render state – show cards face-up during preview
    setCards(gameCards.map((c) => ({ ...c, isFlipped: true })));
    setPlayerScores([0, 0, 0, 0]);
    setCurrentPlayerIndex(0);
    setGameOver(false);
    setGamePhase('preview');
    setPreviewCountdown(5);
    setIsAIThinking(false);
    setShowConnection(false);

    // After 5 s flip down and start
    setTimeout(() => {
      const hidden = gameCards.map((c) => ({ ...c, isFlipped: false }));
      cardsRef.current = hidden;
      setCards(hidden);
      setGamePhase('playing');
    }, 5000);
  };

  // ── Core evaluation (called after all cards for a turn are flipped) ───────
  /**
   * Checks if `flippedIndices` form a valid match.
   * On match  → marks matched, adds point, same player continues.
   * No match  → flips back, advances to next player.
   */
  const evaluateFlippedCards = (flippedIndices: number[], playerIdx: number) => {
    const current = cardsRef.current;
    let isMatch = false;
    let relation: string | undefined;

    if (gameMode === 'classic') {
      const [a, b] = flippedIndices;
      isMatch = current[a].value === current[b].value;
    } else if (gameMode === 'connections') {
      const [a, b] = flippedIndices;
      isMatch = current[a].groupId === current[b].groupId;
      if (isMatch) relation = current[a].relation;
    } else if (gameMode === 'triads') {
      const [a, b, c] = flippedIndices;
      isMatch =
        current[a].groupId === current[b].groupId &&
        current[b].groupId === current[c].groupId;
      if (isMatch) relation = current[a].relation;
    }

    if (isMatch && relation) {
      setConnectionText(relation);
      setShowConnection(true);
    }

    const revealDelay = gameMode === 'classic' ? 500 : 1500;

    if (isMatch) {
      playSound('https://actions.google.com/sounds/v1/cartoon/pop.ogg', 0.5);

      setTimeout(() => {
        // Mark cards as matched
        const updated = cardsRef.current.map((card, idx) =>
          flippedIndices.includes(idx) ? { ...card, isMatched: true, isFlipped: true } : card
        );
        syncCards(updated);

        // Update score
        const newScores = [...scoresRef.current];
        newScores[playerIdx]++;
        scoresRef.current = newScores;
        setPlayerScores([...newScores]);

        flippedRef.current = [];
        setShowConnection(false);
        isProcessingRef.current = false;

        // Check game over
        if (updated.every((c) => c.isMatched)) {
          gameOverRef.current = true;
          setGameOver(true);
          return;
        }

        // Same player gets another turn (they matched!)
        if (players[playerIdx].isAI) {
          triggerAITurn(playerIdx);
        }
        // Human: nothing needed – they can click again
      }, revealDelay);
    } else {
      playSound(
        'https://actions.google.com/sounds/v1/cartoon/slide_whistle_down.ogg',
        0.3
      );

      setTimeout(() => {
        // Flip unmatched cards back
        const updated = cardsRef.current.map((card, idx) =>
          flippedIndices.includes(idx) ? { ...card, isFlipped: false } : card
        );
        syncCards(updated);
        flippedRef.current = [];
        isProcessingRef.current = false;

        // Advance to next player
        const next = (playerIdx + 1) % players.length;
        currentPlayerRef.current = next;
        setCurrentPlayerIndex(next);

        if (players[next].isAI) {
          triggerAITurn(next);
        }
      }, 1000);
    }
  };

  // ── AI helpers ────────────────────────────────────────────────────────────
  const triggerAITurn = (playerIdx: number) => {
    if (gameOverRef.current) return;
    setIsAIThinking(true);
    setTimeout(() => executeAIMove(playerIdx), 1500);
  };

  const executeAIMove = (playerIdx: number) => {
    if (gameOverRef.current) {
      setIsAIThinking(false);
      return;
    }

    const current = cardsRef.current;
    const available = current
      .map((card, idx) => ({ card, idx }))
      .filter(({ card }) => !card.isMatched && !card.isFlipped);

    if (available.length < modeConfig.cardsPerMatch) {
      setIsAIThinking(false);
      return;
    }

    // Pick random cards
    const chosen: number[] = [];
    for (let i = 0; i < modeConfig.cardsPerMatch; i++) {
      const pool = available.filter((a) => !chosen.includes(a.idx));
      const pick = pool[Math.floor(Math.random() * pool.length)];
      chosen.push(pick.idx);
    }

    // Flip each card with a visible delay
    chosen.forEach((cardIdx, i) => {
      setTimeout(() => {
        if (gameOverRef.current) return;

        const updated = cardsRef.current.map((c, idx) =>
          idx === cardIdx ? { ...c, isFlipped: true } : c
        );
        syncCards(updated);
        playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.3);

        // After the last card is flipped → evaluate
        if (i === chosen.length - 1) {
          setIsAIThinking(false);
          isProcessingRef.current = true;
          flippedRef.current = chosen;
          evaluateFlippedCards(chosen, playerIdx);
        }
      }, 700 * (i + 1));
    });
  };

  // ── Human card click ──────────────────────────────────────────────────────
  const handleCardClick = (index: number) => {
    if (
      gamePhase !== 'playing' ||
      isProcessingRef.current ||
      players[currentPlayerRef.current].isAI ||
      cardsRef.current[index].isFlipped ||
      cardsRef.current[index].isMatched ||
      isAIThinking
    )
      return;

    playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.3);

    const updated = cardsRef.current.map((c, idx) =>
      idx === index ? { ...c, isFlipped: true } : c
    );
    syncCards(updated);

    const newFlipped = [...flippedRef.current, index];
    flippedRef.current = newFlipped;

    if (newFlipped.length === modeConfig.cardsPerMatch) {
      isProcessingRef.current = true;
      evaluateFlippedCards(newFlipped, currentPlayerRef.current);
    }
  };

  // ── Styling helpers ───────────────────────────────────────────────────────
  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      cyan: 'border-cyan-400 bg-cyan-500/20 text-cyan-300',
      purple: 'border-purple-400 bg-purple-500/20 text-purple-300',
      green: 'border-green-400 bg-green-500/20 text-green-300',
      orange: 'border-orange-400 bg-orange-500/20 text-orange-300',
    };
    return colors[color] || colors.cyan;
  };

  const winner = gameOver
    ? players[playerScores.indexOf(Math.max(...playerScores))]
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050214 0%, #0a0520 40%, #07031a 100%)' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-30"
          style={{
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.5), transparent)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(244,114,182,0.5), transparent)',
            filter: 'blur(40px)',
          }}
        />
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
              background: ['#a78bfa', '#22d3ee', '#f472b6', '#fbbf24'][
                Math.floor(Math.random() * 4)
              ],
            }}
            animate={{ y: [0, -40, 0], opacity: [0, 0.8, 0], scale: [0.5, 1.5, 0.5] }}
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
          <Users className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {roomName}
            </h1>
            <p className="text-sm text-gray-400">
              {modeConfig.name} - {modeConfig.description}
            </p>
          </div>
        </div>

        <div className="w-32" />
      </div>

      {/* Players Panel */}
      <div className="grid grid-cols-4 gap-4 mb-8 relative z-10">
        {players.map((player, index) => (
          <motion.div
            key={player.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              currentPlayerIndex === index && !gameOver
                ? `${getColorClass(player.color)} scale-105 shadow-lg`
                : 'border-gray-700 bg-gray-800/30'
            }`}
            animate={currentPlayerIndex === index && !gameOver ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">{player.avatar}</div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm">{player.name}</h3>
                {player.isAI && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Bot className="w-3 h-3" /> IA
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Puntos:</span>
              <span className="text-2xl font-bold">{playerScores[index]}</span>
            </div>
            {currentPlayerIndex === index && !gameOver && (
              <motion.div
                className="mt-2 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Preview Banner */}
      <AnimatePresence>
        {gamePhase === 'preview' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="mb-4 p-6 bg-purple-900/50 border-2 border-purple-500 rounded-xl text-center"
          >
            <h3 className="text-2xl font-bold text-purple-200 mb-2">¡Memoriza las cartas!</h3>
            <p className="text-purple-300">Las cartas se voltearán en unos segundos...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Thinking Indicator */}
      <AnimatePresence>
        {isAIThinking && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 bg-purple-900/30 border border-purple-500/50 rounded-xl flex items-center justify-center gap-3"
          >
            <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            <span className="text-purple-300 font-semibold">
              {players[currentPlayerIndex].name} está pensando...
            </span>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Zap className="w-5 h-5 text-purple-400" />
            </motion.div>
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
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5 }}
              className="text-center"
            >
              <div className="text-8xl mb-4">✨🧠✨</div>
              <div className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl shadow-2xl">
                <h3 className="text-3xl font-bold text-white mb-2">¡CONEXIÓN!</h3>
                <p className="text-xl text-white">{connectionText}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board */}
      <div className="flex justify-center mb-8 relative z-10">
        <div
          className={`grid gap-2 ${
            cards.length <= 16 ? 'grid-cols-4' : 'grid-cols-6'
          }`}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={`w-24 h-24 rounded-xl cursor-pointer ${
                card.isMatched
                  ? 'bg-green-500/20 border-2 border-green-400'
                  : card.isFlipped
                  ? 'bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border-2 border-cyan-400'
                  : 'bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600'
              } flex items-center justify-center text-4xl transition-all`}
              onClick={() => handleCardClick(index)}
              whileHover={
                !card.isFlipped && !card.isMatched && !players[currentPlayerIndex].isAI && gamePhase === 'playing'
                  ? { scale: 1.05 }
                  : {}
              }
              whileTap={
                !card.isFlipped && !card.isMatched && !players[currentPlayerIndex].isAI && gamePhase === 'playing'
                  ? { scale: 0.95 }
                  : {}
              }
              animate={card.isFlipped || card.isMatched ? { rotateY: 180 } : { rotateY: 0 }}
              transition={{ duration: 0.3 }}
            >
              {card.isFlipped || card.isMatched ? card.value : '?'}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && winner && (
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
                  ¡Juego Terminado!
                </h2>
                <div className="mb-6">
                  <p className="text-xl mb-2">Ganador:</p>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="text-4xl">{winner.avatar}</span>
                    <span className="text-2xl font-bold">{winner.name}</span>
                  </div>
                  <p className="text-lg text-cyan-400">
                    Puntuación: {playerScores[players.indexOf(winner)]}{' '}
                    {gameMode === 'triads' ? 'tríadas' : 'pares'}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <h3 className="text-sm text-gray-400 mb-2">Tabla de Posiciones:</h3>
                  {players
                    .map((player, index) => ({ player, score: playerScores[index] }))
                    .sort((a, b) => b.score - a.score)
                    .map((item, position) => (
                      <div
                        key={item.player.id}
                        className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{position + 1}.</span>
                          <span className="text-xl">{item.player.avatar}</span>
                          <span>{item.player.name}</span>
                        </div>
                        <span className="font-bold">{item.score}</span>
                      </div>
                    ))}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={initializeGame}
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
