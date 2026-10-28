import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AN } from '../lib/archivoTokens';
import { useReducedEffects } from '../lib/effects';
import { Sparkles, Clock, Compass } from 'lucide-react';

interface ParticleExplosionProps {
  x: number;
  y: number;
  color: string;
  active: boolean;
  onDone: () => void;
}

export function ParticleExplosion({ x, y, color, active, onDone }: ParticleExplosionProps) {
  const reduced = useReducedEffects();

  useEffect(() => {
    if (active) {
      const t = setTimeout(onDone, 900);
      return () => clearTimeout(t);
    }
  }, [active, onDone]);

  if (!active) return null;

  const particles = Array.from({ length: reduced ? 8 : 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const speed = 28 + (i % 5) * 14;
    return {
      id: i,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      size: 4 + (i % 3) * 2,
    };
  });

  return (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            background: color,
            rotate: 45,
            left: -p.size / 2,
            top: -p.size / 2,
            boxShadow: `0 0 10px ${color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.2 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ width: 80, height: 80, border: `2px solid ${color}`, left: 0, top: 0 }}
        initial={{ scale: 0.2, opacity: 0.9 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
    </div>
  );
}

interface ComboPopupProps {
  combo: number;
  active: boolean;
}

export function ComboPopup({ combo, active }: ComboPopupProps) {
  const reduced = useReducedEffects();
  const tier =
    combo >= 10
      ? '¡ANOMALÍA PERFECTA!'
      : combo >= 6
      ? '¡HIPER CADENA!'
      : combo >= 4
      ? '¡CADENA CRÍTICA!'
      : combo >= 2
      ? 'DOBLE CAPTURA'
      : '';
  const color = combo >= 10 ? AN.anomaly : combo >= 6 ? AN.gold : combo >= 4 ? AN.gold : AN.signal;

  if (!tier || !active) return null;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={`combo-${combo}`}
          className="fixed top-1/3 left-1/2 z-50 pointer-events-none text-center"
          style={{ x: '-50%', y: '-50%' }}
          initial={reduced ? { opacity: 1 } : { scale: 0.7, opacity: 0, y: 16 }}
          animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { scale: 1.15, opacity: 0, y: -24 }}
          transition={{ duration: 0.35 }}
        >
          <div className="an-panel-raised px-8 py-3.5 rounded-xl border-2 backdrop-blur-md shadow-2xl" style={{ borderColor: `${color}88` }}>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#9AA3B2]">
              {tier}
            </div>
            <div className="font-serif text-4xl leading-tight font-bold" style={{ color, textShadow: `0 0 16px ${color}88` }}>
              ×{combo}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BombAlertProps {
  active: boolean;
}

export function BombAlert({ active }: BombAlertProps) {
  const reduced = useReducedEffects();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-40 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.55 } : { opacity: [0, 0.7, 0.2, 0.6, 0] }}
            transition={{ duration: 0.6 }}
            style={{ background: `radial-gradient(circle at center, ${AN.danger}66, transparent 72%)` }}
          />
          <div
            className="absolute top-0 inset-x-0 h-4"
            style={{ background: `repeating-linear-gradient(45deg, ${AN.danger} 0 10px, transparent 10px 20px)` }}
          />
          <div
            className="absolute bottom-0 inset-x-0 h-4"
            style={{ background: `repeating-linear-gradient(45deg, ${AN.danger} 0 10px, transparent 10px 20px)` }}
          />
          <div className="absolute inset-x-0 top-1/2 flex justify-center -translate-y-1/2">
            <span
              className="font-mono text-sm tracking-[0.4em] uppercase px-6 py-2.5 rounded-lg border font-bold"
              style={{
                color: AN.danger,
                background: 'rgba(5,7,12,0.92)',
                borderColor: `${AN.danger}AA`,
                boxShadow: `0 0 30px ${AN.danger}88`,
              }}
            >
              ⚠ ANOMALÍA INESTABLE DETONADA ⚠
            </span>
          </div>
        </motion.div>
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
            className="text-center px-12 py-8 rounded-2xl border-2 an-panel-raised shadow-2xl backdrop-blur-xl"
            style={{ borderColor: 'rgba(232,181,74,0.6)' }}
            initial={{ scale: 0.85, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 1.08, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#E8B54A] mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>REGISTRO SINCRONIZADO</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="font-serif text-7xl leading-none mb-3 font-bold text-white drop-shadow-[0_0_20px_rgba(232,181,74,0.6)]">
              NIVEL {String(level).padStart(2, '0')}
            </div>
            <div className="font-mono text-xs tracking-widest text-[#9AA3B2]">
              CUSTODIA ASIGNADA · EXPEDICIÓN CONTINÚA →
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Nuevo: Overlay de Congelación Temporal ─────────────────────────────────────
interface FreezeOverlayProps {
  active: boolean;
}

export function FreezeOverlay({ active }: FreezeOverlayProps) {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
    >
      {/* Cyan ice border and vignette */}
      <div
        className="absolute inset-0 border-[6px] border-[#6EE7F5]/60 shadow-[inset_0_0_60px_rgba(110,231,245,0.3)]"
      />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#061119]/90 border border-[#6EE7F5] px-4 py-1.5 rounded-full text-[#6EE7F5] font-mono text-xs font-semibold shadow-lg">
        <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
        <span>TIEMPO DETENIDO (ESCARCHA TEMPORAL)</span>
      </div>
    </motion.div>
  );
}

// ── Nuevo: Banner de Poder Activado ───────────────────────────────────────────
interface PowerAlertProps {
  powerName: string | null;
  color: string;
}

export function PowerAlert({ powerName, color }: PowerAlertProps) {
  return (
    <AnimatePresence>
      {powerName && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div
            className="px-6 py-2 rounded-full border shadow-xl flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-bold"
            style={{
              background: 'rgba(7,9,15,0.92)',
              borderColor: `${color}AA`,
              color,
              boxShadow: `0 0 20px ${color}66`,
            }}
          >
            <Sparkles className="w-4 h-4" />
            <span>PODER ACTIVADO: {powerName}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
