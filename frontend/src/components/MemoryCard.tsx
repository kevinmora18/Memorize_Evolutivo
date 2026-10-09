import { motion } from 'framer-motion';
import { getEquippedSkinStyle } from '../lib/shopSystem';

interface CardType {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  isBomb?: boolean;
  isBroken?: boolean;
}

interface MemoryCardProps {
  card: CardType;
  index: number;
  glowColor: string;
  gradient: string;
  onClick: () => void;
}

export function MemoryCard({ card, index, glowColor, gradient, onClick }: MemoryCardProps) {
  const equippedSkinStyle = getEquippedSkinStyle();
  const isExploding = card.isBomb && card.isMatched && !card.isBroken;

  return (
    <motion.div layout initial={{ scale: 0, rotateY: -180 }} animate={isExploding ? { scale: [1, 1.1, 1], x: [-5, 5, -5, 5, 0] } : { scale: 1, rotateY: 0 }} exit={{ scale: 0, opacity: 0 }} transition={isExploding ? { duration: 0.2, repeat: Infinity } : { delay: index * 0.05, type: 'spring', stiffness: 200 }} whileHover={!card.isMatched && !card.isBroken ? { scale: 1.05, y: -5 } : {}} className="aspect-square cursor-pointer perspective-1000" onClick={card.isBroken ? undefined : onClick} style={{ perspective: '1000px', opacity: card.isBroken ? 0.5 : 1, filter: card.isBroken ? 'grayscale(100%)' : 'none' }}>
      <motion.div className="relative w-full h-full" animate={{ rotateY: card.isFlipped || card.isMatched || card.isBroken ? 180 : 0 }} transition={{ duration: 0.6, type: 'spring', stiffness: 200 }} style={{ transformStyle: 'preserve-3d' }}>
        {/* Card Back - Con skin equipado */}
        <div className="absolute inset-0 rounded-2xl backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
          <div className={`w-full h-full ${equippedSkinStyle} rounded-2xl border-2 border-white/10 flex items-center justify-center relative overflow-hidden`}>
            <motion.div className="absolute inset-0 opacity-20" animate={{ backgroundPosition: ['0% 0%','100% 100%'] }} transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }} style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }} className="text-6xl opacity-30">✦</motion.div>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <motion.div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 flex items-center justify-center relative overflow-hidden" style={{ borderColor: card.isBroken ? 'rgba(255,255,255,0.05)' : isExploding ? '#ff0000' : card.isMatched ? glowColor : 'rgba(255,255,255,0.1)', boxShadow: isExploding ? `0 0 40px #ff0000` : card.isMatched ? `0 0 30px ${glowColor}` : 'none' }} animate={card.isMatched && !card.isBomb ? { scale: [1,1.1,1] } : {}} transition={{ duration: 0.5 }}>
            {card.isMatched && !card.isBomb && (<motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: [0,0.5,0] }} transition={{ duration: 1, repeat: Infinity }} style={{ background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)` }} />)}

            <motion.span className="text-7xl z-10" animate={card.isMatched && !card.isBomb ? { rotate: [0,360], scale: [1,1.2,1] } : {}} transition={{ duration: 0.8 }}>{card.symbol}</motion.span>

            {card.isMatched && !card.isBomb && ([...Array(6)].map((_, i) => (<motion.div key={i} className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: glowColor }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((i * Math.PI * 2) / 6) * 100, y: Math.sin((i * Math.PI * 2) / 6) * 100, opacity: 0 }} transition={{ duration: 1, ease: 'easeOut' }} />)))}
            
            {/* Fire particles for bomb */}
            {isExploding && ([...Array(12)].map((_, i) => (<motion.div key={i + 'bomb'} className="absolute text-2xl z-20" initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, opacity: 0, scale: 0 }} transition={{ duration: 0.8, repeat: Infinity, delay: Math.random() * 0.5 }}>🔥</motion.div>)))}
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
