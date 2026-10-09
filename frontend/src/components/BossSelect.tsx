import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Crown } from 'lucide-react';
import { loadPlayerStats, getRankByXP } from '../lib/playerEvolution';
import { useState, useEffect } from 'react';
import type { BossType } from '../App';

interface BossSelectProps {
  onSelectBoss: (bossType: BossType) => void;
  onBack: () => void;
}

interface BossInfo {
  id: BossType;
  name: string;
  icon: any;
  emoji: string;
  color: string;
  gradient: string;
  description: string;
  ability: string;
  difficulty: number;
  requiredRank: number;
  unlockMessage: string;
}

const BOSSES: BossInfo[] = [
  {
    id: 'naturaleza',
    name: 'NATURALEZA',
    icon: Brain,
    emoji: '🌿',
    color: '#10b981',
    gradient: 'from-green-500 via-emerald-500 to-teal-500',
    description: 'Relaciones naturales',
    ability: 'Parejas de 2 - Ecosistema',
    difficulty: 3,
    requiredRank: 1,
    unlockMessage: 'Modo disponible',
  },
  {
    id: 'ciencia',
    name: 'CIENCIA',
    icon: Brain,
    emoji: '🔬',
    color: '#3b82f6',
    gradient: 'from-blue-500 via-cyan-500 to-sky-500',
    description: 'Relaciones científicas',
    ability: 'Parejas de 2 - Tecnología',
    difficulty: 4,
    requiredRank: 1,
    unlockMessage: 'Modo disponible',
  },
  {
    id: 'humano',
    name: 'HUMANO',
    icon: Brain,
    emoji: '👑',
    color: '#f59e0b',
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    description: 'Relaciones humanas',
    ability: 'Parejas de 2 - Cultura',
    difficulty: 5,
    requiredRank: 1,
    unlockMessage: 'Modo disponible',
  },
  {
    id: 'ecosistema',
    name: 'ECOSISTEMA',
    icon: Brain,
    emoji: '🌍',
    color: '#8b5cf6',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    description: 'Cadenas ecológicas',
    ability: 'Tríadas de 3 - Cadena vital',
    difficulty: 6,
    requiredRank: 1,
    unlockMessage: 'Modo avanzado',
  },
  {
    id: 'tecnologia',
    name: 'TECNOLOGÍA',
    icon: Brain,
    emoji: '⚡',
    color: '#ec4899',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    description: 'Sistemas tecnológicos',
    ability: 'Tríadas de 3 - Innovación',
    difficulty: 7,
    requiredRank: 1,
    unlockMessage: 'Modo avanzado',
  },
];

export function BossSelect({ onSelectBoss, onBack }: BossSelectProps) {
  const [playerStats, setPlayerStats] = useState(loadPlayerStats());

  useEffect(() => {
    setPlayerStats(loadPlayerStats());
  }, []);

  const currentRank = getRankByXP(playerStats.xp);

  const isBossUnlocked = (boss: BossInfo) => {
    return currentRank.id >= boss.requiredRank;
  };

  return (
    <div className="min-h-screen bg-[#050214] font-rajdhani text-gray-300 flex flex-col relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
      `}</style>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/fonlobby.png')] bg-cover bg-center opacity-20 mix-blend-screen" />
      </div>

      {/* Header */}
      <div className="p-6 flex justify-between items-center z-20">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-gray-800/50 backdrop-blur-xl flex items-center justify-center group-hover:border-cyan-400/50 transition-colors border border-gray-700">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="font-bold tracking-widest uppercase text-sm">
            Volver al Lobby
          </span>
        </button>
        <div className="bg-gray-800/50 backdrop-blur-xl px-6 py-2 rounded-full border border-gray-700">
          <h1 className="text-xl font-bold tracking-[0.3em] uppercase text-cyan-400">
            SELECCIONA BOSS
          </h1>
        </div>
        <div className="w-32" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {BOSSES.map((boss, index) => {
            const unlocked = isBossUnlocked(boss);
            
            return (
              <motion.div
                key={boss.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative ${unlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => unlocked && onSelectBoss(boss.id)}
              >
                <div className={`relative rounded-2xl p-6 border-2 transition-all ${
                  unlocked
                    ? 'border-gray-700 hover:border-gray-600'
                    : 'border-gray-800 opacity-60'
                  } ${unlocked ? 'bg-gray-800/50' : 'bg-gray-900/50'} backdrop-blur-xl overflow-hidden`}>
                  
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${boss.gradient} opacity-10`} />

                  <div className="relative z-10">
                    {/* Boss Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <motion.div 
                        className={`w-16 h-16 rounded-full bg-gradient-to-br ${boss.gradient} flex items-center justify-center text-4xl shadow-lg`}
                        style={{ boxShadow: `0 0 25px ${boss.color}` }}
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {boss.emoji}
                      </motion.div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: boss.difficulty }).map((_, i) => (
                          <Crown key={i} className="w-4 h-4 text-yellow-400" />
                        ))}
                      </div>
                    </div>

                    {/* Boss Info */}
                    <h3 className={`text-2xl font-bold mb-2 bg-gradient-to-r ${boss.gradient} bg-clip-text text-transparent`}>
                      {boss.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">{boss.description}</p>

                    {/* Ability */}
                    <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <boss.icon className="w-4 h-4" style={{ color: boss.color }} />
                        <span className="text-xs font-bold uppercase text-gray-400">
                          Modo Conexiones
                        </span>
                      </div>
                      <p className="text-sm text-white">{boss.ability}</p>
                      <p className="text-xs text-purple-400 mt-2">
                        🧠 Encuentra elementos relacionados
                      </p>
                    </div>

                    {/* Select Button */}
                    {unlocked && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBoss(boss.id);
                        }}
                        className={`w-full py-3 rounded-xl font-bold tracking-widest uppercase transition-all bg-gradient-to-r ${boss.gradient} hover:brightness-110 shadow-lg`}
                        style={{ boxShadow: `0 0 20px ${boss.color}40` }}
                      >
                        🧠 ¡CONECTAR!
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info Footer */}
      <div className="p-6 text-center text-sm text-gray-500 z-10">
        <p>
          Encuentra parejas de elementos relacionados • Cada modo tiene conexiones únicas
        </p>
      </div>
    </div>
  );
}
