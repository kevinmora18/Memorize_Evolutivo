import { motion } from 'framer-motion';
import { getCardById } from '../lib/cardCatalog';
import { UNIVERSE_TOKENS, EASE_FLIP } from '../lib/archivoTokens';
import type { UniverseId } from '../lib/archivoTokens';
import { useReducedEffects } from '../lib/effects';
import { CardArt } from './cards/CardArt';
import { CardBack } from './cards/CardBack';
import { CardFrame } from './cards/CardFrame';
import { CardStateOverlay } from './cards/CardStateOverlay';

export interface MemoryCardData {
  id: string | number;
  artId?: string;
  emoji?: string;
  accent?: string;
  isFlipped: boolean;
  isMatched: boolean;
  isBomb?: boolean;
  isBroken?: boolean;
  isGlitch?: boolean;
  isDark?: boolean;
}

interface MemoryCardProps {
  card: MemoryCardData;
  index: number;
  onClick: () => void;
  backUniverse?: UniverseId;
  interactive?: boolean;
  isShaking?: boolean;
  isBouncing?: boolean;
  isExploding?: boolean;
  priority?: boolean;
}

export function MemoryCard({
  card,
  index,
  onClick,
  backUniverse = 'archivo',
  interactive = true,
  isShaking,
  isBouncing,
  isExploding,
  priority,
}: MemoryCardProps) {
  const reduced = useReducedEffects();
  const def = card.artId ? getCardById(card.artId) : undefined;
  const accent = card.accent ?? (def ? UNIVERSE_TOKENS[def.universe].accent : UNIVERSE_TOKENS.archivo.accent);
  const revealed = card.isFlipped || card.isMatched;
  const clickable = interactive && !card.isFlipped && !card.isMatched && !card.isBroken;

  const stateLabel = card.isBroken
    ? 'contención rota, fuera de juego'
    : card.isMatched
    ? card.isBomb
      ? 'anomalía contenida'
      : 'pareja capturada'
    : card.isFlipped
    ? card.isBomb
      ? 'anomalía inestable'
      : def?.name ?? 'carta revelada'
    : card.isDark
    ? 'sellada en oscuridad'
    : 'boca abajo';

  const outerAnimate =
    isExploding && !reduced
      ? { x: [0, -4, 4, -3, 3, 0], rotate: [0, -1.5, 1.5, -1, 1, 0] }
      : isShaking && !reduced
      ? { x: [0, -5, 5, -4, 4, 0], rotate: [0, -1, 1, -0.5, 0.5, 0] }
      : isBouncing && !reduced
      ? { scale: [1, 1.13, 0.97, 1.04, 1], y: [0, -10, 0] }
      : { x: 0, y: 0, rotate: 0, scale: 1 };

  return (
    <motion.div
      layout={!reduced}
      className="relative w-full h-full an-focusable"
      style={{ perspective: 900, cursor: clickable ? 'pointer' : 'default' }}
      animate={outerAnimate}
      transition={{
        duration: isExploding ? 0.26 : isShaking ? 0.38 : isBouncing ? 0.5 : 0.3,
        repeat: isExploding && !reduced ? Infinity : 0,
      }}
      whileHover={clickable && !reduced ? { y: -4, scale: 1.03 } : undefined}
      whileTap={clickable ? { scale: 0.97 } : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role="button"
      tabIndex={clickable ? 0 : -1}
      aria-label={`Carta ${index + 1} de la cuadrícula: ${stateLabel}`}
      aria-disabled={!clickable}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: reduced ? 0.15 : 0.55, ease: EASE_FLIP }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            borderRadius: 'var(--an-radius-card)',
            border: '1px solid var(--an-line-strong)',
            boxShadow: 'var(--an-shadow-card)',
            filter: card.isDark ? 'brightness(0.55) saturate(0.6)' : undefined,
          }}
        >
          <CardBack universe={backUniverse} className="w-full h-full" />
          {!reduced && (
            <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'var(--an-radius-card)' }}>
              <div className="an-sheen" style={{ left: 0 }} />
            </div>
          )}
        </div>

        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            opacity: card.isMatched ? 0.62 : card.isBroken ? 0.5 : 1,
            filter: card.isBroken ? 'grayscale(100%)' : undefined,
          }}
        >
          <CardFrame
            name={def?.name ?? undefined}
            code={def?.code ?? undefined}
            rarity={def?.rarity}
            accent={accent}
            revealed={revealed}
          >
            <CardArt
              artId={card.artId}
              fallbackEmoji={card.emoji}
              accent={accent}
              priority={priority}
              alt={def ? `Ilustración de ${def.name}` : undefined}
              className="w-full h-full"
            />
          </CardFrame>
        </div>
      </motion.div>

      <CardStateOverlay
        revealed={revealed}
        isMatched={card.isMatched}
        isBomb={card.isBomb}
        isExploding={isExploding}
        isGlitch={card.isGlitch}
        isDark={card.isDark}
        isBroken={card.isBroken}
        accent={accent}
        reduced={reduced}
      />
    </motion.div>
  );
}
