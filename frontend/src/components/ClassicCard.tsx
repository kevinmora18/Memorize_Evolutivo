
import { motion } from 'framer-motion';
import { Bomb, Zap } from 'lucide-react';
import { getEquippedSkinStyle } from '../lib/shopSystem';

export interface CardData {
  id: string;
  symbol: string;
  emoji: string;
  color: string;
  isFlipped: boolean;
  isMatched: boolean;
  isGlitch: boolean;
  isBomb: boolean;
  isDark: boolean;
}

interface ClassicCardProps {
  card: CardData;
  index: number;
  onClick: () => void;
  isShaking: boolean;
  isBouncing: boolean;
  isExploding: boolean;
  gamePhase: string;
}

export function ClassicCard({ card, onClick, isShaking, isBouncing, isExploding, gamePhase }: ClassicCardProps) {
  const isVisible = card.isFlipped || card.isMatched;
  const equippedSkinStyle = getEquippedSkinStyle();

  return (
    <motion.div
      className="relative cursor-pointer w-full h-full"
      style={{ perspective: 600 }}
      animate={
        isShaking
          ? { x: [0, -8, 8, -6, 6, -4, 4, 0], rotate: [0, -3, 3, -2, 2, 0] }
          : isBouncing
          ? { scale: [1, 1.2, 0.9, 1.05, 1], y: [0, -12, 0] }
          : isExploding
          ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
          : { scale: 1, x: 0, rotate: 0, opacity: card.isMatched ? 0.4 : 1 }
      }
      transition={{ duration: isShaking ? 0.5 : isBouncing ? 0.5 : 0.3 }}
      onClick={onClick}
      whileTap={!card.isMatched && gamePhase === 'playing' ? { scale: 0.9 } : {}}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isVisible ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Card Back - Con skin equipado */}
        <div
          className={`absolute inset-0 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${equippedSkinStyle}`}
          style={{
            backfaceVisibility: 'hidden',
            borderColor: card.isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.6)',
            boxShadow: card.isDark
              ? '0 0 8px rgba(139,92,246,0.2), inset 0 0 20px rgba(0,0,0,0.8)'
              : '0 0 15px rgba(139,92,246,0.3), inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        >
          {!card.isDark && (
            <>
              <div className="absolute inset-0 opacity-20"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent 60%)' }} />
              <div className="text-2xl opacity-30 select-none">✦</div>
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white opacity-40" />
              <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-white opacity-40" />
            </>
          )}
          {card.isDark && (
            <div className="w-3 h-3 rounded-full border border-purple-500 opacity-50 animate-pulse" />
          )}
        </div>

        {/* Card Front */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-2"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: card.isBomb
              ? 'linear-gradient(135deg, #1a0505 0%, #3d0a0a 100%)'
              : card.isGlitch
              ? 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3d 100%)'
              : `linear-gradient(135deg, ${card.color}22 0%, rgba(0,0,0,0.9) 100%)`,
            borderColor: card.isBomb ? '#ef4444' : card.isGlitch ? '#a855f7' : card.color,
            boxShadow: `0 0 20px ${card.isBomb ? 'rgba(239,68,68,0.5)' : card.isGlitch ? 'rgba(168,85,247,0.5)' : card.color + '44'}, inset 0 0 30px rgba(0,0,0,0.6)`,
          }}
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: `radial-gradient(circle at center, ${card.isBomb ? '#ef4444' : card.color}33, transparent 70%)` }} />

          {card.isBomb ? (
            <div className="flex flex-col items-center gap-1 relative z-10">
              <Bomb size={40} className="text-red-500" style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.8))' }} />
              <span className="text-red-400 text-xs font-bold uppercase tracking-wider">BOMBA</span>
            </div>
          ) : (
            <div className="text-6xl select-none relative z-10" style={{ textShadow: `0 0 15px ${card.color}` }}>
              {card.emoji}
            </div>
          )}

          {card.isGlitch && (
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{ background: 'linear-gradient(0deg, transparent 48%, rgba(168,85,247,0.8) 50%, transparent 52%)' }}
                animate={{ y: ['-100%', '100%'] }}
                transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5 }}
              />
            </div>
          )}

          {card.isMatched && (
            <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
              style={{ background: `${card.color}22` }}>
              <Zap size={20} className="text-yellow-400" />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-px opacity-50"
            style={{ background: `linear-gradient(90deg, transparent, ${card.isBomb ? '#ef4444' : card.color}, transparent)` }} />
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full opacity-60"
            style={{ background: card.isBomb ? '#ef4444' : card.color }} />
        </div>
      </motion.div>
    </motion.div>
  );
}
