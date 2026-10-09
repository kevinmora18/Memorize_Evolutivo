import { motion } from 'framer-motion';
import { UniversePortal } from './UniversePortal';
import { Sparkles, Trophy, ArrowLeft } from 'lucide-react';
import type { Universe } from '../App';

interface MainMenuProps {
  onUniverseSelect: (universe: Universe) => void;
  unlockedPowers: Universe[];
  onBackToLobby?: () => void;
}

const universes: Array<{ id: Universe; name: string; color: string; gradient: string; icon: string; }> = [
  { id: 'volcania', name: 'Volcania', color: '#ff4500', gradient: 'from-orange-600 via-red-600 to-amber-600', icon: '🌋' },
  { id: 'frostheim', name: 'Frostheim', color: '#00d4ff', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', icon: '❄️' },
  { id: 'neural', name: 'Neural Nexus', color: '#00ff88', gradient: 'from-emerald-400 via-teal-500 to-cyan-500', icon: '🧠' },
  { id: 'verdalis', name: 'Verdalis', color: '#7fff00', gradient: 'from-lime-500 via-green-500 to-emerald-600', icon: '🌿' },
  { id: 'lunaris', name: 'Lunaris', color: '#b19cd9', gradient: 'from-purple-400 via-violet-500 to-purple-600', icon: '🌙' },
];

export function MainMenu({ onUniverseSelect, unlockedPowers, onBackToLobby }: MainMenuProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">{[...Array(50)].map((_, i) => (<motion.div key={i} className="absolute w-1 h-1 bg-white rounded-full" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%` }} animate={{ opacity: [0.2,0.8,0.2], scale: [1,1.5,1] }} transition={{ duration: 2 + Math.random()*3, repeat: Infinity, delay: Math.random()*2 }} />))}</div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {onBackToLobby && (<motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="mb-8"><button onClick={onBackToLobby} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"><ArrowLeft className="w-5 h-5" /><span>Volver al Lobby</span></button></motion.div>)}

        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }} className="text-center mb-16">
          <motion.div animate={{ textShadow: ['0 0 20px rgba(0,255,255,0.5)','0 0 40px rgba(255,0,255,0.5)','0 0 20px rgba(0,255,255,0.5)'] }} transition={{ duration: 3, repeat: Infinity }}>
            <h1 className="text-7xl mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">MEMORIZE EVOLUTIVO</h1>
          </motion.div>
          <p className="text-xl text-gray-400 flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" />Desbloquea los Poderes de 5 Universos<Sparkles className="w-5 h-5" /></p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {universes.map((universe, index) => (<UniversePortal key={universe.id} universe={universe} index={index} isUnlocked={unlockedPowers.includes(universe.id)} onSelect={onUniverseSelect} />))}
        </div>

        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-center mt-16"><div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-full backdrop-blur-sm"><Trophy className="w-6 h-6 text-yellow-400" /><span className="text-gray-300">Poderes Desbloqueados: {unlockedPowers.length} / {universes.length}</span></div></motion.div>
      </div>
    </div>
  );
}
