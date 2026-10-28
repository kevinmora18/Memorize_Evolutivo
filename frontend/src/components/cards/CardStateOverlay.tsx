import { motion } from 'framer-motion';
import { AN } from '../../lib/archivoTokens';

interface CardStateOverlayProps {
  revealed: boolean;
  isMatched?: boolean;
  isBomb?: boolean;
  isExploding?: boolean;
  isGlitch?: boolean;
  isDark?: boolean;
  isBroken?: boolean;
  accent: string;
  reduced?: boolean;
}

export function CardStateOverlay({
  revealed,
  isMatched,
  isBomb,
  isExploding,
  isGlitch,
  isDark,
  isBroken,
  accent,
  reduced,
}: CardStateOverlayProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20" style={{ borderRadius: 'var(--an-radius-card)' }}>
      {isDark && !revealed && (
        <div
          className="absolute inset-0"
          style={{ borderRadius: 'var(--an-radius-card)', background: 'rgba(3,1,10,0.82)' }}
        >
          <div
            className="absolute inset-2"
            style={{
              border: '1px dashed rgba(92,102,117,0.28)',
              borderRadius: 'var(--an-radius-card)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)',
            }}
          />
        </div>
      )}

      {isBroken && (
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'var(--an-radius-card)' }}>
          <div
            className="absolute left-0 right-0 top-1/2 h-[2px] origin-center -translate-y-1/2"
            style={{ transform: 'rotate(28deg) scaleX(1.4)', background: 'linear-gradient(90deg, transparent, rgba(232,230,223,0.5), transparent)' }}
          />
          <div
            className="absolute left-0 right-0 top-1/2 h-[2px] origin-center -translate-y-1/2"
            style={{ transform: 'rotate(-24deg) scaleX(1.4)', background: 'linear-gradient(90deg, transparent, rgba(232,230,223,0.35), transparent)' }}
          />
          <div className="absolute inset-x-0 bottom-2 flex justify-center">
            <span className="an-seal" style={{ color: AN.danger }}>
              CONTENCIÓN ROTA
            </span>
          </div>
        </div>
      )}

      {isBomb && revealed && !isBroken && (
        <div className="absolute inset-0" style={{ borderRadius: 'var(--an-radius-card)' }}>
          <div
            className="absolute top-0 inset-x-0 h-[3px]"
            style={{
              background: `repeating-linear-gradient(45deg, ${AN.danger} 0 6px, transparent 6px 12px)`,
              opacity: isExploding ? 1 : 0.85,
            }}
          />
          <div
            className="absolute bottom-0 inset-x-0 h-[3px]"
            style={{
              background: `repeating-linear-gradient(45deg, ${AN.danger} 0 6px, transparent 6px 12px)`,
              opacity: isExploding ? 1 : 0.85,
            }}
          />
          <div
            className="absolute inset-0"
            style={{ boxShadow: `inset 0 0 24px ${AN.danger}55`, borderRadius: 'var(--an-radius-card)' }}
          />
        </div>
      )}

      {isGlitch && revealed && !reduced && (
        <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 'var(--an-radius-card)' }}>
          <div
            className="an-scanline absolute inset-x-0 h-10"
            style={{
              background: 'linear-gradient(180deg, transparent, rgba(194,75,255,0.28), transparent)',
            }}
          />
          <div className="absolute top-0 inset-x-0 h-px" style={{ background: 'rgba(53,224,200,0.5)' }} />
          <div className="absolute bottom-0 inset-x-0 h-px" style={{ background: 'rgba(255,77,94,0.4)' }} />
        </div>
      )}

      {isGlitch && revealed && reduced && (
        <div
          className="absolute inset-0"
          style={{ borderRadius: 'var(--an-radius-card)', boxShadow: `inset 0 0 0 1px rgba(194,75,255,0.5)` }}
        />
      )}

      {isMatched && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {!reduced && (
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle, ${accent}38 0%, transparent 70%)`,
                borderRadius: 'var(--an-radius-card)',
              }}
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          )}
          {!isBomb && (
            <div className="an-seal an-stamp" style={{ color: accent, background: 'rgba(5,7,12,0.55)' }}>
              CAPTURADO
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
