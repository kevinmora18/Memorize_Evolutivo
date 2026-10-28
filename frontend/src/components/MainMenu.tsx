import { motion } from 'framer-motion';
import { UniversePortal } from './UniversePortal';
import { ArrowLeft } from 'lucide-react';
import { AN } from '../lib/archivoTokens';
import type { Universe } from '../App';

interface MainMenuProps {
  onUniverseSelect: (universe: Universe) => void;
  unlockedPowers: Universe[];
  onBackToLobby?: () => void;
}

const universes: Array<{ id: Universe; name: string; color: string; gradient: string; icon: string }> = [
  { id: 'volcania', name: 'Volcania', color: '#FF6B35', gradient: 'from-orange-600 via-red-600 to-amber-600', icon: '🌋' },
  { id: 'frostheim', name: 'Frostheim', color: '#6EE7F5', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', icon: '❄️' },
  { id: 'neural', name: 'Neural Nexus', color: '#2BE08F', gradient: 'from-emerald-400 via-teal-500 to-cyan-500', icon: '🧠' },
  { id: 'verdalis', name: 'Verdalis', color: '#8FE04A', gradient: 'from-lime-500 via-green-500 to-emerald-600', icon: '🌿' },
  { id: 'lunaris', name: 'Lunaris', color: '#B79CFF', gradient: 'from-purple-400 via-violet-500 to-purple-600', icon: '🌙' },
];

export function MainMenu({ onUniverseSelect, unlockedPowers, onBackToLobby }: MainMenuProps) {
  const motes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 6 + Math.random() * 88,
    y: 8 + Math.random() * 84,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 7,
  }));

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #07090F 0%, #0A0E16 55%, #07090F 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />
      {motes.map((m) => (
        <div
          key={m.id}
          className="an-mote"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.size, height: m.size, background: AN.signal, animationDelay: `${m.delay}s` }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-4 py-12">
        {onBackToLobby && (
          <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-8">
            <button
              onClick={onBackToLobby}
              className="an-focusable flex items-center gap-2 px-3 py-2 an-panel rounded-lg transition-colors hover:border-[color:var(--an-line-strong)]"
            >
              <ArrowLeft className="w-4 h-4 text-an-inkDim" />
              <span className="an-label" style={{ color: 'var(--an-ink-dim)' }}>VOLVER AL LOBBY</span>
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14"
        >
          <div className="an-label-accent mb-3">Custodia de memorias codificadas</div>
          <h1 className="an-title text-6xl sm:text-7xl mb-3">Memorize Evolutivo</h1>
          <div className="mx-auto w-56 h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, var(--an-line-strong), transparent)' }} />
          <p className="an-label">Selecciona un ala para abrir su sello</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {universes.map((universe, index) => (
            <UniversePortal
              key={universe.id}
              universe={universe}
              index={index}
              isUnlocked={unlockedPowers.includes(universe.id)}
              onSelect={onUniverseSelect}
            />
          ))}
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="mt-14 flex justify-center"
        >
          <div className="an-panel rounded-full px-6 py-3 flex items-center gap-4">
            <span className="an-label">Sellos abiertos</span>
            <div className="flex items-center gap-1.5">
              {universes.map((u, i) => (
                <span
                  key={u.id}
                  className="w-2 h-2 rotate-45"
                  style={{
                    background: i < unlockedPowers.length ? AN.gold : 'transparent',
                    border: `1px solid ${i < unlockedPowers.length ? AN.gold : 'var(--an-line-strong)'}`,
                  }}
                />
              ))}
            </div>
            <span className="an-mono text-xs text-an-inkDim">
              {unlockedPowers.length} / {universes.length}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
