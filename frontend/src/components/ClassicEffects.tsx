import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParticleExplosionProps {
  x: number;
  y: number;
  color: string;
  active: boolean;
  onDone: () => void;
}

export function ParticleExplosion({ x, y, color, active, onDone }: ParticleExplosionProps) {
  useEffect(() => {
    if (active) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [active, onDone]);

  if (!active) return null;

  const particles = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    return {
      id: i,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      delay: Math.random() * 0.1,
    };
  });

  return (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: color, left: 0, top: 0 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0 }}
          transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ width: 60, height: 60, background: `${color}44`, left: 0, top: 0 }}
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
    </div>
  );
}

interface ComboPopupProps {
  combo: number;
  active: boolean;
}

export function ComboPopup({ combo, active }: ComboPopupProps) {
  const label =
    combo >= 10 ? '⚡ HYPER COMBO!' :
    combo >= 5  ? '🔥 MEGA COMBO!' :
    combo >= 3  ? '✨ COMBO!' :
    combo >= 2  ? '👁 DOBLE!' : '';

  const color =
    combo >= 10 ? '#facc15' :
    combo >= 5  ? '#f97316' :
    combo >= 3  ? '#a855f7' : '#22d3ee';

  if (!label || !active) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={`combo-${combo}`}
          className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none text-center"
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1.1, opacity: 1, y: 0 }}
          exit={{ scale: 1.5, opacity: 0, y: -30 }}
          transition={{ duration: 0.4, exit: { duration: 0.5 } }}
        >
          <div
            className="font-black text-4xl tracking-wider uppercase drop-shadow-2xl"
            style={{ color, textShadow: `0 0 20px ${color}, 0 0 40px ${color}88` }}
          >
            {label}
          </div>
          <div className="text-white font-bold text-lg opacity-80">x{combo} STREAK</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BombAlertProps {
  active: boolean;
}

export function BombAlert({ active }: BombAlertProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0, 0.3, 0] }}
          transition={{ duration: 0.6, times: [0, 0.2, 0.4, 0.7, 1] }}
          style={{ background: 'radial-gradient(circle at center, rgba(239,68,68,0.6), transparent 70%)' }}
        />
      )}
    </AnimatePresence>
  );
}

interface LevelUpBannerProps {
  level: number;
  active: boolean;
}

export function LevelUpBanner({ level, active }: LevelUpBannerProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="text-center px-12 py-8 rounded-3xl border-2"
            style={{
              background: 'rgba(10,5,30,0.95)',
              borderColor: 'rgba(139,92,246,0.8)',
              boxShadow: '0 0 60px rgba(139,92,246,0.5)',
              backdropFilter: 'blur(20px)',
            }}
            initial={{ scale: 0.6, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div className="text-purple-300 text-sm font-bold uppercase tracking-widest mb-2">NIVEL COMPLETADO</div>
            <div className="text-7xl font-black text-white mb-1"
              style={{ textShadow: '0 0 30px rgba(139,92,246,0.8)' }}>
              {level}
            </div>
            <div className="text-cyan-400 font-bold tracking-wider">SIGUIENTE NIVEL →</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
