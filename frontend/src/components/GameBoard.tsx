import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MemoryCard } from './MemoryCard';
import type { MemoryCardData } from './MemoryCard';
import { ArrowLeft, Star, Zap } from 'lucide-react';
import { UniverseTheme } from './UniverseTheme';
import { getCardsForUniverse, BOMB_CARD } from '../lib/cardCatalog';
import { UNIVERSE_TOKENS, AN } from '../lib/archivoTokens';
import type { Universe } from '../App';
import { InGameCompanionWidget } from './InGameCompanionWidget';

interface GameBoardProps {
  universe: Universe;
  level: number;
  onLevelComplete: () => void;
  onBackToMenu: () => void;
}

type CardType = MemoryCardData & {
  symbol: string;
  accent: string;
  isBomb: boolean;
  isBroken: boolean;
  isHinted?: boolean;
};

export function GameBoard({ universe, level, onLevelComplete, onBackToMenu }: GameBoardProps) {
  const token = UNIVERSE_TOKENS[universe];
  const cardCount = 8 + (level - 1) * 4;
  const totalSlots = level === 1 ? cardCount + 1 : cardCount;
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);

  const lockRef = useRef(false);
  const flippedRef = useRef<number[]>([]);
  const cardsRef = useRef<CardType[]>([]);

  useEffect(() => {
    const defs = getCardsForUniverse(universe).slice(0, cardCount / 2);
    const placeholders: CardType[] = [...defs, ...defs].map((def) => ({
      id: 0,
      symbol: def.id,
      artId: def.id,
      accent: UNIVERSE_TOKENS[def.universe].accent,
      isFlipped: false,
      isMatched: false,
      isBomb: false,
      isBroken: false,
    }));

    if (level === 1) {
      placeholders.push({
        id: 0,
        symbol: 'BOMB',
        artId: BOMB_CARD.id,
        accent: AN.anomaly,
        isFlipped: false,
        isMatched: false,
        isBomb: true,
        isBroken: false,
      });
    }

    const shuffled = placeholders
      .sort(() => Math.random() - 0.5)
      .map((card, index) => ({ ...card, id: index }));

    cardsRef.current = shuffled;
    setCards(shuffled);
    setMatchedPairs(0);
    setMoves(0);
    flippedRef.current = [];
    setFlippedCards([]);
    lockRef.current = false;
  }, [level, universe, cardCount]);

  const handleCardClick = (id: number) => {
    if (lockRef.current) return;
    const cardIndex = cardsRef.current.findIndex((c) => c.id === id);
    if (cardIndex === -1) return;
    const clickedCard = cardsRef.current[cardIndex];

    if (clickedCard.isMatched || clickedCard.isBroken) return;

    // Si la carta ya está seleccionada en este turno, permitir voltearla de vuelta boca abajo
    if (flippedRef.current.includes(id)) {
      const remainingFlipped = flippedRef.current.filter((fid) => fid !== id);
      flippedRef.current = remainingFlipped;
      setFlippedCards(remainingFlipped);
      const updated = cardsRef.current.map((c) => (c.id === id ? { ...c, isFlipped: false } : c));
      cardsRef.current = updated;
      setCards(updated);
      return;
    }

    if (clickedCard.isBomb) {
      lockRef.current = true;
      const newCards = [...cardsRef.current];
      newCards[cardIndex] = { ...clickedCard, isFlipped: true };
      cardsRef.current = newCards;
      setCards(newCards);

      setTimeout(() => {
        flippedRef.current = [];
        setFlippedCards([]);
        setCards((prevCards) => {
          const closedCards = prevCards.map((c) =>
            c.isMatched && !c.isBomb
              ? c
              : { ...c, isMatched: false, isFlipped: false, isBroken: false }
          );
          cardsRef.current = closedCards;
          return closedCards;
        });

        setTimeout(() => {
          setCards((prevCards) => {
            const toShuffle = prevCards
              .filter((c) => !c.isMatched)
              .map((c) => ({ ...c, isFlipped: false }));
            toShuffle.sort(() => Math.random() - 0.5);

            let uIdx = 0;
            const finalCards = prevCards.map((c) => (c.isMatched ? c : toShuffle[uIdx++]));
            cardsRef.current = finalCards;
            return finalCards;
          });
          lockRef.current = false;
        }, 420);
      }, 700);
      return;
    }

    const newFlipped = [...flippedRef.current, id];
    flippedRef.current = newFlipped;
    setFlippedCards(newFlipped);

    const updatedCards = cardsRef.current.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    cardsRef.current = updatedCards;
    setCards(updatedCards);

    if (newFlipped.length === 2) {
      lockRef.current = true;
      setMoves((m) => m + 1);
      const firstIndex = updatedCards.findIndex((c) => c.id === newFlipped[0]);
      const secondIndex = updatedCards.findIndex((c) => c.id === newFlipped[1]);

      if (
        firstIndex !== -1 &&
        secondIndex !== -1 &&
        updatedCards[firstIndex].symbol === updatedCards[secondIndex].symbol
      ) {
        setTimeout(() => {
          setCards((prevCards) => {
            const updated = prevCards.map((c) =>
              c.id === newFlipped[0] || c.id === newFlipped[1]
                ? { ...c, isMatched: true, isFlipped: true }
                : c
            );
            cardsRef.current = updated;
            return updated;
          });
          flippedRef.current = [];
          setFlippedCards([]);
          lockRef.current = false;
          setMatchedPairs((prev) => {
            const newPairs = prev + 1;
            if (newPairs === cardCount / 2) setTimeout(() => onLevelComplete(), 1000);
            return newPairs;
          });
        }, 600);
      } else {
        setTimeout(() => {
          setCards((prevCards) => {
            // Voltear boca abajo todas las cartas no emparejadas para evitar desincronizaciones
            const updated = prevCards.map((c) => (c.isMatched ? c : { ...c, isFlipped: false }));
            cardsRef.current = updated;
            return updated;
          });
          flippedRef.current = [];
          setFlippedCards([]);
          lockRef.current = false;
        }, 850);
      }
    }
  };

  // Habilidad del Compañero: Revelar un par oculto
  const handleCompanionReveal = useCallback(() => {
    const unmatched = cards.filter((c) => !c.isMatched && !c.isBomb && !c.isBroken);
    if (unmatched.length === 0) return;
    const uniqueSymbols = Array.from(new Set(unmatched.map((c) => c.symbol)));
    const targetSymbol = uniqueSymbols[Math.floor(Math.random() * uniqueSymbols.length)];

    setCards((prev) =>
      prev.map((c) =>
        c.symbol === targetSymbol ? { ...c, isFlipped: true, isHinted: true } : c
      )
    );

    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) =>
          c.symbol === targetSymbol && !c.isMatched
            ? { ...c, isFlipped: false, isHinted: false }
            : { ...c, isHinted: false }
        )
      );
    }, 2200);
  }, [cards]);

  return (
    <UniverseTheme universe={universe}>
      <div
        className="h-[100dvh] max-h-[100dvh] w-full relative overflow-hidden flex flex-col justify-between game-screen-lock"
        style={{
          background: `radial-gradient(ellipse at 50% -12%, ${token.accent}0D, transparent 55%), linear-gradient(180deg, ${token.deep} 0%, #05070C 55%, #07090F 100%)`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
        <div className="absolute inset-0 pointer-events-none an-vignette" />

        {/* Compañero 3D en la parte superior izquierda */}
        <InGameCompanionWidget
          onRevealPair={handleCompanionReveal}
          matchedCount={matchedPairs}
          isGameActive={matchedPairs < cardCount / 2}
        />

        <div className="relative z-10 w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-2 sm:mb-8 gap-2 shrink-0">
            <button
              onClick={onBackToMenu}
              className="an-focusable flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 an-panel rounded-lg hover:border-[color:var(--an-line-strong)] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-an-inkDim" />
              <span className="an-label text-xs sm:text-sm" style={{ color: 'var(--an-ink-dim)' }}>VOLVER</span>
            </button>

            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="text-center min-w-0">
              <div className="an-label-accent mb-0.5 text-[9px] sm:text-xs">
                {token.wing} // {token.code} // REGISTRO {String(level).padStart(2, '0')}
              </div>
              <h2 className="an-title text-lg sm:text-4xl leading-none truncate" style={{ textShadow: `0 0 30px ${token.accent}33` }}>
                {token.name}
              </h2>
              <p className="an-label mt-1 hidden sm:block">{token.tagline}</p>
            </motion.div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="an-panel px-3 py-2 rounded-lg hidden sm:block">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" color={AN.gold} />
                  <span className="an-mono text-xs text-an-ink">{moves}</span>
                  <span className="an-label" style={{ fontSize: 8 }}>MOV</span>
                </div>
              </div>
              <div className="an-panel px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Star className="w-3.5 h-3.5" color={token.accent} />
                  <span className="an-mono text-xs text-an-ink">{matchedPairs}/{cardCount / 2}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center w-full overflow-hidden py-1">
            <div
              className="grid gap-1.5 sm:gap-3 max-w-2xl w-full h-full max-h-full justify-center content-center items-center justify-items-center"
              style={{ gridTemplateColumns: `repeat(${Math.min(6, Math.ceil(Math.sqrt(totalSlots)))}, minmax(0, 1fr))` }}
            >
              <AnimatePresence>
                {cards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    className="aspect-square relative w-full max-w-[95px] sm:max-w-none max-h-[16dvh] sm:max-h-none flex items-center justify-center touch-manipulation"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={
                      card.isHinted
                        ? { scale: [1, 1.08, 1], filter: 'drop-shadow(0 0 16px #E8B54A)' }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={{
                      delay: index * 0.03,
                      scale: card.isHinted ? { repeat: Infinity, duration: 1 } : { duration: 0.3 },
                    }}
                  >
                    <MemoryCard
                      card={card}
                      index={index}
                      backUniverse={universe}
                      onClick={() => handleCardClick(card.id as number)}
                      priority
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </UniverseTheme>
  );
}
