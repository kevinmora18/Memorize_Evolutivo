import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Bot, Trophy, Zap, Brain, Sparkles, Layers } from 'lucide-react';

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

export interface AICardMeta {
  title: string;
  image: string;
  category: string;
  color: string;
}

export const AI_GAME_CARDS_META: Record<string, AICardMeta> = {
  // Tríada 1: Ciclo Vital Vegetal
  '🌞': { title: 'Sol Primigenio', image: '/cards/triads/eco-sol.webp', category: 'Ecosistema', color: '#FFB800' },
  '🌱': { title: 'Semilla Lumínica', image: '/cards/triads/eco-semilla.webp', category: 'Ecosistema', color: '#2BE08F' },
  '🌳': { title: 'Árbol Ancestral', image: '/cards/triads/eco-arbol.webp', category: 'Ecosistema', color: '#2BE08F' },

  // Tríada 2: Polinización y Producción
  '🐝': { title: 'Abeja Centinela', image: '/cards/triads/eco-abeja.webp', category: 'Ecosistema', color: '#E8B54A' },
  '🌸': { title: 'Flor de Loto', image: '/cards/triads/eco-flor.webp', category: 'Ecosistema', color: '#FF6B8B' },
  '🍯': { title: 'Néctar Dorado', image: '/cards/triads/eco-miel.webp', category: 'Ecosistema', color: '#E8B54A' },

  // Tríada 3: Ciclo del Agua
  '☁️': { title: 'Vapor Celeste', image: '/cards/triads/eco-nube.webp', category: 'Ecosistema', color: '#35E0C8' },
  '💧': { title: 'Gota de Cristal', image: '/cards/triads/eco-gota.webp', category: 'Ecosistema', color: '#35E0C8' },
  '🌊': { title: 'Masa Oceánica', image: '/cards/triads/eco-oceano.webp', category: 'Ecosistema', color: '#35E0C8' },

  // Tríada 4: Metamorfosis
  '🥚': { title: 'Génesis Vital', image: '/cards/triads/eco-huevo.webp', category: 'Ecosistema', color: '#2BE08F' },
  '🐛': { title: 'Oruga Primordial', image: '/cards/triads/eco-oruga.webp', category: 'Ecosistema', color: '#2BE08F' },
  '🦋': { title: 'Mariposa Astral', image: '/cards/triads/eco-mariposa.webp', category: 'Ecosistema', color: '#B79CFF' },

  // Tríada 5: Elementos - Fuego
  '🔥': { title: 'Chispa Ancestral', image: '/cards/triads/ele-chispa.webp', category: 'Elementos', color: '#FF6B35' },
  '🌋': { title: 'Llama Sagrada', image: '/cards/triads/ele-llama.webp', category: 'Elementos', color: '#FF4D5E' },
  '🪨': { title: 'Magma Viviente', image: '/cards/triads/ele-inferno.webp', category: 'Elementos', color: '#E8B54A' },

  // Tríada 6: Tecnología - Inteligencia
  '💾': { title: 'Microchip Cuántico', image: '/cards/triads/tec-chip.webp', category: 'Tecnología', color: '#2BE08F' },
  '🧠': { title: 'Matriz de IA', image: '/cards/triads/tec-ia.webp', category: 'Tecnología', color: '#35E0C8' },
  '🤖': { title: 'Androide Centinela', image: '/cards/triads/tec-androide.webp', category: 'Tecnología', color: '#B79CFF' },

  // Tríada 7: Ciencia - Materia y Reacción
  '⚛️': { title: 'Átomo Cuántico', image: '/cards/triads/cie-atomo.webp', category: 'Ciencia', color: '#35E0C8' },
  '🔬': { title: 'Molécula Primaria', image: '/cards/triads/cie-molecula.webp', category: 'Ciencia', color: '#35E0C8' },
  '✨': { title: 'Reacción Nuclear', image: '/cards/triads/cie-reaccion.webp', category: 'Ciencia', color: '#FFB800' },

  // Tríada 8: Humanidad y Progreso
  '📜': { title: 'Papiro del Saber', image: '/cards/triads/hum-papiro.webp', category: 'Humanidad', color: '#E8B54A' },
  '⚙️': { title: 'Engranaje Industrial', image: '/cards/triads/hum-engranaje.webp', category: 'Humanidad', color: '#9AA3B2' },
  '🚀': { title: 'Cohete Astral', image: '/cards/triads/hum-cohete.webp', category: 'Humanidad', color: '#35E0C8' },

  // Parejas / Símbolos de Conexiones
  '🐟': { title: 'Organismo Marino', image: '/cards/triads/cie-organismo.webp', category: 'Ecosistema', color: '#35E0C8' },
  '🍃': { title: 'Brisa de Follaje', image: '/cards/triads/ele-brisa.webp', category: 'Ecosistema', color: '#2BE08F' },
  '🌻': { title: 'Espiga Dorada', image: '/cards/triads/hum-espiga.webp', category: 'Ecosistema', color: '#FFB800' },
  '🍂': { title: 'Hoz de Cosecha', image: '/cards/triads/hum-hoz.webp', category: 'Humanidad', color: '#E8B54A' },
  '🌧️': { title: 'Tempestad Glacial', image: '/cards/triads/ele-tempestad-hielo.webp', category: 'Elementos', color: '#35E0C8' },

  // Clásico (Pares)
  '🌟': { title: 'Estrella Naciente', image: '/cards/triads/cie-estrella.webp', category: 'Ciencia', color: '#FFB800' },
  '🎮': { title: 'Microchip Cuántico', image: '/cards/triads/tec-chip.webp', category: 'Tecnología', color: '#2BE08F' },
  '💎': { title: 'Glaciar Eterno', image: '/cards/triads/ele-glaciar.webp', category: 'Elementos', color: '#35E0C8' },
  '⚡': { title: 'Centella Espectral', image: '/cards/triads/ele-centella.webp', category: 'Elementos', color: '#B79CFF' },
  '🌈': { title: 'Supernova Astral', image: '/cards/triads/cie-supernova.webp', category: 'Ciencia', color: '#FF4D5E' },
  '🎯': { title: 'Red de Enlace', image: '/cards/triads/tec-red.webp', category: 'Tecnología', color: '#35E0C8' },
};

export function getAICardMeta(val: string): AICardMeta {
  if (AI_GAME_CARDS_META[val]) {
    return AI_GAME_CARDS_META[val];
  }
  return {
    title: val || 'Eslabón Neural',
    image: '/cards/triads/eco-sol.webp',
    category: 'Ecosistema',
    color: '#35E0C8',
  };
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
      { id: 2, symbols: ['🐟', '🌊'], relation: 'Organismo vive en océano' },
      { id: 3, symbols: ['🌳', '🍃'], relation: 'Árbol genera hojas y sombra' },
      { id: 4, symbols: ['☁️', '💧'], relation: 'Nube condensa lluvia' },
      { id: 5, symbols: ['🌸', '🦋'], relation: 'Flor atrae mariposa' },
      { id: 6, symbols: ['🌞', '🌻'], relation: 'Sol nutre espiga' },
      { id: 7, symbols: ['🐛', '🥚'], relation: 'Huevo eclosiona en oruga' },
      { id: 8, symbols: ['🌱', '🌧️'], relation: 'Semilla brota con lluvia' },
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
      { id: 5, symbols: ['🔥', '🌋', '🪨'], relation: 'Chispa → Llama → Magma' },
      { id: 6, symbols: ['💾', '🧠', '🤖'], relation: 'Microchip → Red IA → Androide' },
      { id: 7, symbols: ['⚛️', '🔬', '✨'], relation: 'Átomo → Molécula → Reacción' },
      { id: 8, symbols: ['📜', '⚙️', '🚀'], relation: 'Papiro → Engranaje → Cohete' },
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

  const customNickname = typeof window !== 'undefined' ? localStorage.getItem('operatorNickname') : null;
  const myPlayerName = customNickname || 'Tú';

  const [players] = useState<Player[]>([
    { id: 1, name: myPlayerName, isAI: false, score: 0, avatar: '👤', color: 'cyan' },
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
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    initializeGame();
    return () => {
      gameOverRef.current = true;
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
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
    } catch {
      // audio no disponible
    }
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

    // After 4 s flip down and start
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = setTimeout(() => {
      const hidden = gameCards.map((c) => ({ ...c, isFlipped: false }));
      cardsRef.current = hidden;
      setCards(hidden);
      setGamePhase('playing');
    }, 4000);
  };

  const skipPreviewNow = () => {
    if (gamePhase !== 'preview') return;
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    const hidden = cardsRef.current.map((c) => ({ ...c, isFlipped: false }));
    cardsRef.current = hidden;
    setCards(hidden);
    setGamePhase('playing');
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
      className="min-h-screen text-white p-3 sm:p-6 md:p-8 relative overflow-hidden flex flex-col justify-start"
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

      {/* Header adaptable a móvil */}
      <header className="flex items-center justify-between gap-2 mb-3 sm:mb-6 relative z-10 pb-2 border-b border-white/10">
        <button
          onClick={onBackToLobby}
          className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl backdrop-blur-sm border border-gray-700/60 text-xs sm:text-sm font-mono text-gray-200 transition-colors shrink-0 shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden xs:inline">Volver</span>
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 text-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl font-bold font-serif bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent truncate">
              {roomName}
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-gray-400 truncate">
              {modeConfig.name} • {modeConfig.description}
            </p>
          </div>
        </div>

        {/* Badge de Turno Actual */}
        <div className="px-2 sm:px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-400/30 font-mono text-[10px] sm:text-xs text-purple-300 shrink-0">
          {players[currentPlayerIndex].isAI ? `🤖 ${players[currentPlayerIndex].name}` : '🎯 Tu Turno'}
        </div>
      </header>

      {/* Players Panel (2 columnas en celular, 4 en desktop para máxima comodidad) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3 sm:mb-5 relative z-10">
        {players.map((player, index) => {
          const isCurrent = currentPlayerIndex === index && !gameOver;
          return (
            <motion.div
              key={player.id}
              className={`p-2 sm:p-3 rounded-xl border transition-all duration-300 ${
                isCurrent
                  ? `${getColorClass(player.color)} shadow-[0_0_15px_rgba(34,211,238,0.25)] ring-1 ring-cyan-400/50`
                  : 'border-[#1E2836] bg-[#0D1119]/80 text-gray-300'
              }`}
              animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <div className="flex items-center gap-2 mb-1 min-w-0">
                <span className="text-xl sm:text-2xl shrink-0">{player.avatar}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-bold text-xs sm:text-sm text-white truncate leading-tight">
                    {player.name}
                  </h3>
                  <div className="font-mono text-[9px] text-gray-400 flex items-center gap-1">
                    {player.isAI ? (
                      <span className="text-purple-300 flex items-center gap-0.5"><Bot className="w-2.5 h-2.5" /> IA</span>
                    ) : (
                      <span className="text-cyan-300 font-semibold">TÚ</span>
                    )}
                    {isCurrent && <span className="text-green-400 animate-pulse font-bold ml-auto">• JUEGA</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-white/5 font-mono">
                <span className="text-[9px] text-gray-400 uppercase">Puntos</span>
                <span className="text-base sm:text-xl font-bold text-white">{playerScores[index]}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Banner */}
      <AnimatePresence>
        {gamePhase === 'preview' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={skipPreviewNow}
            className="mb-3 sm:mb-4 px-3 py-2 sm:py-3 bg-purple-950/70 border border-purple-500/50 hover:border-cyan-400 rounded-xl text-center backdrop-blur-sm max-w-xl mx-auto w-full shadow-lg cursor-pointer transition-all"
            title="Toca para comenzar a jugar de inmediato"
          >
            <div className="flex items-center justify-center gap-2 text-purple-200 font-bold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>¡Memoriza las cartas! ({previewCountdown}s)</span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded">
                Toca para iniciar ya
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-purple-300 font-mono mt-0.5">
              Las cartas se voltearán automáticamente para comenzar
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Thinking Indicator */}
      <AnimatePresence>
        {isAIThinking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 px-3 py-1.5 bg-purple-900/40 border border-purple-500/40 rounded-full flex items-center justify-center gap-2 max-w-xs mx-auto text-xs shadow-md"
          >
            <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-purple-300 font-mono truncate">
              {players[currentPlayerIndex].name} analizando...
            </span>
            <Zap className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />
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
      <div className="flex justify-center mb-8 relative z-10 w-full max-w-4xl mx-auto px-2">
        <div
          className={`grid gap-2 sm:gap-3 w-full ${
            cards.length <= 12
              ? 'grid-cols-3 sm:grid-cols-4 max-w-2xl'
              : cards.length <= 16
              ? 'grid-cols-4 max-w-3xl'
              : 'grid-cols-4 sm:grid-cols-6 max-w-4xl'
          }`}
        >
          {cards.map((card, index) => {
            const meta = getAICardMeta(card.value);
            const isRevealed = card.isFlipped || card.isMatched;
            const isMyTurn = !players[currentPlayerIndex].isAI && gamePhase === 'playing';

            return (
              <motion.div
                key={card.id}
                whileHover={!isRevealed && isMyTurn ? { scale: 1.04, y: -2 } : {}}
                whileTap={!isRevealed && isMyTurn ? { scale: 0.96 } : {}}
                onClick={() => handleCardClick(index)}
                className={`aspect-[3/4] rounded-xl sm:rounded-2xl relative cursor-pointer select-none transition-all duration-300 ${
                  !isMyTurn && !isRevealed ? 'opacity-85' : ''
                }`}
                style={{ perspective: 1000 }}
              >
                <div
                  className={`w-full h-full rounded-xl sm:rounded-2xl transition-transform duration-500 relative shadow-lg ${
                    isRevealed
                      ? card.isMatched
                        ? 'border-2 border-[#2BE08F] bg-[#13221B] shadow-[0_0_15px_rgba(43,224,143,0.35)]'
                        : 'border-2 border-[#35E0C8] bg-[#131A26] shadow-[0_0_15px_rgba(53,224,200,0.35)]'
                      : 'border border-[#1E2836] bg-gradient-to-br from-[#0D1119] to-[#151D2A] hover:border-[#35E0C8]/60 hover:shadow-[0_0_12px_rgba(53,224,200,0.2)]'
                  }`}
                >
                  {isRevealed ? (
                    /* Cara frontal ilustrada */
                    <div className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden flex flex-col justify-end p-1 sm:p-2 bg-slate-950">
                      <img
                        src={meta.image}
                        alt={meta.title}
                        className="absolute inset-0 w-full h-full object-cover filter brightness-[0.95] contrast-[1.08] transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Icono de Match si ya se acertó */}
                      {card.isMatched && (
                        <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 z-10 p-0.5 sm:p-1 rounded-full bg-[#2BE08F] text-black shadow-lg">
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                        </div>
                      )}

                      {gameMode !== 'classic' && (
                        <>
                          {/* Gradiente oscuro inferior para texto legible */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                          {/* Categoría superior izquierda */}
                          <div
                            className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 z-10 px-1 sm:px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10 font-mono text-[7px] sm:text-[8px] uppercase tracking-wider font-semibold"
                            style={{ color: meta.color }}
                          >
                            {meta.category}
                          </div>

                          {/* Título de la carta abajo */}
                          <div className="relative z-10 text-center px-0.5">
                            <span className="font-serif text-[8px] sm:text-[11px] font-bold text-white block truncate leading-tight drop-shadow-md">
                              {meta.title}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Cara posterior (Boca abajo) */
                    <div className="w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 text-[#2C3A4E] relative bg-gradient-to-br from-[#0D1119] via-[#121926] to-[#0A0D14] rounded-xl sm:rounded-2xl">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-center shadow-inner">
                        <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#35E0C8]/60" />
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
