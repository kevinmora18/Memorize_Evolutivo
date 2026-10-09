import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryCard } from './MemoryCard';
import { ArrowLeft, Star, Zap } from 'lucide-react';
import type { Universe } from '../App';

interface GameBoardProps {
  universe: Universe;
  level: number;
  onLevelComplete: () => void;
  onBackToMenu: () => void;
}

const universeConfig: Record<Universe, { name: string; gradient: string; bgGradient: string; glowColor: string; symbols: string[] }> = {
  volcania: { name: 'Volcania', gradient: 'from-orange-600/20 via-red-600/20 to-amber-600/20', bgGradient: 'from-orange-950 via-red-950 to-black', glowColor: '#ff4500', symbols: ['🍎', '🍓', '🍒', '🍅', '🍉', '🌶️', '🍄', '🎈'] },
  frostheim: { name: 'Frostheim', gradient: 'from-cyan-400/20 via-blue-500/20 to-indigo-500/20', bgGradient: 'from-cyan-950 via-blue-950 to-black', glowColor: '#00d4ff', symbols: ['🫐', '🍇', '🍆', '🍬', '🪁', '💎', '🐟', '🧊'] },
  neural: { name: 'Neural Nexus', gradient: 'from-emerald-400/20 via-teal-500/20 to-cyan-500/20', bgGradient: 'from-emerald-950 via-teal-950 to-black', glowColor: '#00ff88', symbols: ['🍏', '🍐', '🥝', '🍈', '🥒', '🥦', '🔋', '🧩'] },
  verdalis: { name: 'Verdalis', gradient: 'from-lime-500/20 via-green-500/20 to-emerald-600/20', bgGradient: 'from-lime-950 via-green-950 to-black', glowColor: '#7fff00', symbols: ['🍋', '🍌', '🍍', '🌻', '🧀', '🌽', '🚕', '☀️'] },
  lunaris: { name: 'Lunaris', gradient: 'from-purple-400/20 via-violet-500/20 to-purple-600/20', bgGradient: 'from-purple-950 via-violet-950 to-black', glowColor: '#b19cd9', symbols: ['🍑', '🍊', '🥭', '🥕', '🎃', '🏀', '🦊', '🐅'] },
};

type CardType = { id: number; symbol: string; isFlipped: boolean; isMatched: boolean; isBomb?: boolean; isBroken?: boolean };

export function GameBoard({ universe, level, onLevelComplete, onBackToMenu }: GameBoardProps) {
  const config = universeConfig[universe];
  let cardCount = 8 + (level - 1) * 4;
  const totalSlots = level === 1 ? cardCount + 1 : cardCount; // 9 cartas en nivel 1
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    const symbols = [...config.symbols].slice(0, cardCount / 2);
    const duplicatedSymbols = [...symbols, ...symbols];

    if (level === 1) {
      duplicatedSymbols.push('💣');
    }

    const shuffled = duplicatedSymbols.sort(() => Math.random() - 0.5).map((symbol, index) => ({
      id: index,
      symbol,
      isFlipped: false,
      isMatched: false,
      isBomb: symbol === '💣',
      isBroken: false
    }));
    setCards(shuffled);
    setMatchedPairs(0);
    setMoves(0);
    setFlippedCards([]);
  }, [level, universe, cardCount, config.symbols]);

  const handleCardClick = (id: number) => {
    const cardIndex = cards.findIndex(c => c.id === id);
    if (cardIndex === -1) return;
    const clickedCard = cards[cardIndex];

    if (flippedCards.length >= 2 || flippedCards.includes(id)) return;
    if (clickedCard.isMatched || clickedCard.isBroken) return;

    if (clickedCard.isBomb) {
      const newCards = [...cards];
      newCards[cardIndex] = { ...clickedCard, isFlipped: true, isMatched: true }; // Lo marcamos temporalmente como matched para evitar clics dobles
      setCards(newCards);

      setTimeout(() => {
        setCards(prevCards => {
          const afterExplosion = prevCards.map(c => c.id === id ? { ...c, isBroken: true, symbol: '💥' } : c);

          const toShuffle = afterExplosion.filter(c => !c.isMatched && !c.isBroken);
          const fixed = afterExplosion.filter(c => c.isMatched || c.isBroken);

          toShuffle.sort(() => Math.random() - 0.5);

          return [...fixed, ...toShuffle].sort(() => Math.random() - 0.5); // Revolvemos todo para que cambien de posición visualmente en la cuadrícula
        });

        setFlippedCards([]);
      }, 1000); // Explotará después de 1 segundo
      return;
    }

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    const newCards = [...cards];
    newCards[cardIndex].isFlipped = true;
    setCards(newCards);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const firstIndex = cards.findIndex(c => c.id === newFlipped[0]);
      const secondIndex = cards.findIndex(c => c.id === newFlipped[1]);

      if (cards[firstIndex].symbol === cards[secondIndex].symbol) {
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c =>
            (c.id === newFlipped[0] || c.id === newFlipped[1]) ? { ...c, isMatched: true } : c
          ));
          setFlippedCards([]);
          setMatchedPairs(prev => {
            const newPairs = prev + 1;
            if (newPairs === cardCount / 2) setTimeout(() => onLevelComplete(), 1000);
            return newPairs;
          });
        }, 800);
      } else {
        setTimeout(() => {
          setCards(prevCards => prevCards.map(c =>
            (c.id === newFlipped[0] || c.id === newFlipped[1]) ? { ...c, isFlipped: false } : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgGradient} relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-30"><motion.div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} /></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBackToMenu} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"><ArrowLeft className="w-5 h-5" /><span>Menú</span></button>

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center"><h2 className="text-4xl mb-1" style={{ textShadow: `0 0 20px ${config.glowColor}` }}>{config.name}</h2><p className="text-gray-400">Nivel {level}</p></motion.div>

          <div className="flex items-center gap-4"><div className="px-4 py-2 bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700"><div className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" /><span>Movimientos: {moves}</span></div></div><div className="px-4 py-2 bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700"><div className="flex items-center gap-2"><Star className="w-5 h-5 text-purple-400" /><span>{matchedPairs}/{cardCount / 2}</span></div></div></div>
        </div>

        <div className="grid gap-2 max-w-2xl mx-auto" style={{ gridTemplateColumns: `repeat(${Math.min(6, Math.ceil(Math.sqrt(totalSlots)))}, minmax(0, 1fr))` }}>
          <AnimatePresence>{cards.map((card, index) => (<MemoryCard key={card.id} card={card} index={index} glowColor={config.glowColor} gradient={config.gradient} onClick={() => handleCardClick(card.id)} />))}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
