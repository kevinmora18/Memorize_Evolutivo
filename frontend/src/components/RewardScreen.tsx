import { motion } from 'framer-motion';
import { Home, RotateCcw, Crown, Sparkles } from 'lucide-react';
import type { Universe } from '../App';

interface RewardScreenProps {
  universe: Universe;
  onBackToMenu: () => void;
  onReplay: () => void;
}

const rewardConfig = {
  volcania: { name: 'Volcania', power: 'Furia de Magma', description: 'Desbloquea la habilidad de recordar patrones ardientes con precisión infernal', gradient: 'from-orange-600 via-red-600 to-amber-600', bgGradient: 'from-orange-950 via-red-950 to-black', glowColor: '#ff4500', emoji: '🔥', particles: ['🔥','💥','⚡'] },
  frostheim: { name: 'Frostheim', power: 'Mente Cristalina', description: 'Tu memoria se vuelve perfecta y clara como el hielo eterno', gradient: 'from-cyan-400 via-blue-500 to-indigo-500', bgGradient: 'from-cyan-950 via-blue-950 to-black', glowColor: '#00d4ff', emoji: '❄️', particles: ['❄️','💎','✨'] },
  neural: { name: 'Neural Nexus', power: 'Sinapsis Aumentada', description: 'Conexiones neuronales potenciadas para memoria instantánea', gradient: 'from-emerald-400 via-teal-500 to-cyan-500', bgGradient: 'from-emerald-950 via-teal-950 to-black', glowColor: '#00ff88', emoji: '🧠', particles: ['⚛️','🌐','✨'] },
  verdalis: { name: 'Verdalis', power: 'Sabiduría Ancestral', description: 'La memoria de mil años fluye a través de ti', gradient: 'from-lime-500 via-green-500 to-emerald-600', bgGradient: 'from-lime-950 via-green-950 to-black', glowColor: '#7fff00', emoji: '🌿', particles: ['🍃','🌱','✨'] },
  lunaris: { name: 'Lunaris', power: 'Eclipse Mental', description: 'Dominas la oscuridad y la luz del subconsciente', gradient: 'from-purple-400 via-violet-500 to-purple-600', bgGradient: 'from-purple-950 via-violet-950 to-black', glowColor: '#b19cd9', emoji: '🌙', particles: ['⭐','✨','🌟'] },
};

export function RewardScreen({ universe, onBackToMenu, onReplay }: RewardScreenProps) {
  const reward = rewardConfig[universe];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${reward.bgGradient} relative overflow-hidden flex items-center justify-center`}>
      <div className="absolute inset-0"><motion.div className={`absolute inset-0 bg-gradient-to-br ${reward.gradient} opacity-30`} animate={{ scale: [1,1.3,1], rotate: [0,180,360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} /></div>

      <div className="relative z-10 container mx-auto px-4">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150, damping: 15 }} className="max-w-3xl mx-auto text-center">
          <motion.div animate={{ scale: [1,1.05,1] }} transition={{ duration: 2, repeat: Infinity }} className="mb-8"><h2 className="text-6xl mb-4">¡PODER DESBLOQUEADO!</h2></motion.div>

          <motion.div className={`w-64 h-64 mx-auto rounded-full bg-gradient-to-br ${reward.gradient} flex items-center justify-center mb-8 relative`} animate={{ boxShadow: [`0 0 60px ${reward.glowColor}`, `0 0 120px ${reward.glowColor}`, `0 0 60px ${reward.glowColor}`], rotate: [0,360] }} transition={{ boxShadow: { duration: 2, repeat: Infinity }, rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}>
            <motion.span className="text-9xl z-10" animate={{ scale: [1,1.1,1] }} transition={{ duration: 1.5, repeat: Infinity }}>{reward.emoji}</motion.span>
          </motion.div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-full border-2 mb-4" style={{ borderColor: reward.glowColor }}>
              <Crown className="w-6 h-6" style={{ color: reward.glowColor }} />
              <h3 className="text-3xl">{reward.power}</h3>
              <Crown className="w-6 h-6" style={{ color: reward.glowColor }} />
            </div>
            <p className="text-xl text-gray-300 max-w-xl mx-auto flex items-center justify-center gap-2"><Sparkles className="w-5 h-5" style={{ color: reward.glowColor }} />{reward.description}<Sparkles className="w-5 h-5" style={{ color: reward.glowColor }} /></p>
          </motion.div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-12">
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700"><div className="text-4xl mb-2" style={{ color: reward.glowColor }}>100%</div><div className="text-sm text-gray-400">Completado</div></div>
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700"><div className="text-4xl mb-2" style={{ color: reward.glowColor }}>⭐⭐⭐</div><div className="text-sm text-gray-400">Maestría</div></div>
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700"><div className="text-4xl mb-2" style={{ color: reward.glowColor }}>+50</div><div className="text-sm text-gray-400">Puntos XP</div></div>
          </motion.div>

          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="flex gap-4 justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBackToMenu} className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-xl flex items-center gap-3 border-2 border-gray-600 transition-colors"><Home className="w-6 h-6" /><span>Volver al Menú</span></motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onReplay} className={`px-8 py-4 bg-gradient-to-r ${reward.gradient} hover:brightness-110 rounded-xl text-xl flex items-center gap-3 border-2 border-white/20 transition-all`} style={{ boxShadow: `0 0 20px ${reward.glowColor}` }}><RotateCcw className="w-6 h-6" /><span>Jugar de Nuevo</span></motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
