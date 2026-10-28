import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { UNIVERSE_TOKENS, AN } from '../lib/archivoTokens';
import { ProceduralEmblem } from './cards/ProceduralEmblem';
import type { Universe } from '../App';

interface UniversePortalProps {
  universe: {
    id: Universe;
    name: string;
    color: string;
    gradient: string;
    icon: string;
  };
  index: number;
  isUnlocked: boolean;
  onSelect: (universe: Universe) => void;
}

export function UniversePortal({ universe, index, isUnlocked, onSelect }: UniversePortalProps) {
  const token = UNIVERSE_TOKENS[universe.id];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onClick={() => onSelect(universe.id)}
      className="an-focusable relative group cursor-pointer text-left w-full"
      aria-label={`Abrir ala ${token.name}${isUnlocked ? '' : ' (bloqueada)'}`}
    >
      <div
        className="relative an-panel rounded-2xl p-4 h-72 flex flex-col items-center overflow-hidden transition-colors duration-300"
        style={{ opacity: isUnlocked ? 1 : 0.72 }}
      >
        {/* Fuga de luz por la juntura */}
        <div
          className="absolute inset-x-0 top-0 h-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${token.accent}22, transparent 70%)` }}
        />

        <div className="an-label mb-3 w-full flex justify-between">
          <span>{token.wing}</span>
          <span>{token.code}</span>
        </div>

        {/* Puerta / ventana de bóveda */}
        <div
          className="relative w-28 h-28 shrink-0 overflow-hidden transition-all duration-300 group-hover:scale-[1.03]"
          style={{
            borderRadius: '999px 999px 14px 14px',
            border: `1px solid ${isUnlocked ? token.accent + '66' : 'var(--an-line-strong)'}`,
            boxShadow: isUnlocked ? `0 0 24px ${token.accent}22, inset 0 0 20px rgba(0,0,0,0.6)` : 'inset 0 0 20px rgba(0,0,0,0.6)',
            filter: isUnlocked ? undefined : 'grayscale(0.8) brightness(0.7)',
          }}
        >
          <ProceduralEmblem seedKey={`door-${universe.id}`} universe={universe.id} accent={token.accent} className="w-full h-full" />
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '999px 999px 14px 14px' }}>
            <div className="an-sheen" style={{ left: 0 }} />
          </div>
        </div>

        <h3 className="an-title text-2xl mt-4 leading-none">{token.name}</h3>
        <p className="an-label mt-1.5 text-center" style={{ fontSize: 9 }}>{token.tagline}</p>

        <div className="mt-auto w-full">
          <div className="h-px w-full mb-2.5" style={{ background: `linear-gradient(90deg, transparent, ${token.accent}55, transparent)` }} />
          <div className="flex items-center justify-center gap-2">
            {isUnlocked ? (
              <>
                <Check className="w-3.5 h-3.5" color={token.accent} />
                <span className="an-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: token.accent }}>
                  Sello abierto
                </span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-an-inkFaint" />
                <span className="an-mono text-[10px] tracking-[0.2em] uppercase text-an-inkFaint">
                  Sello cerrado
                </span>
              </>
            )}
          </div>
        </div>

        {!isUnlocked && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(5,7,12,0.35)' }} />
        )}
        <span className="an-corner top-2 left-2 border-l border-t" style={{ borderColor: AN.lineStrong }} />
        <span className="an-corner bottom-2 right-2 border-r border-b" style={{ borderColor: AN.lineStrong }} />
      </div>
    </motion.button>
  );
}
