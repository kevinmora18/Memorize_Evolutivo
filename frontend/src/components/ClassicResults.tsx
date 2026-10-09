
import { motion } from 'framer-motion';
import { Award, Star, Zap, Target, Flame, RotateCcw, Home, TrendingUp } from 'lucide-react';

interface ClassicResultsProps {
  level: number;
  score: number;
  aiScore: number;
  accuracy: number;
  maxCombo: number;
  matchedPairs: number;
  totalPairs: number;
  timeLeft: number;
  won: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onBackToLobby: () => void;
}

export function ClassicResults({
  level, score, aiScore, accuracy, maxCombo, matchedPairs, totalPairs,
  timeLeft, won, onNextLevel, onRetry, onBackToLobby
}: ClassicResultsProps) {
  const xpGained = won
    ? Math.floor(score * 0.1 + maxCombo * 50 + timeLeft * 10)
    : Math.floor(score * 0.05);

  const stars = won
    ? (accuracy >= 90 && maxCombo >= 5 ? 3 : accuracy >= 70 ? 2 : 1)
    : 0;

  const getRank = () => {
    if (!won) return { label: 'FALLO NEURAL', color: '#ef4444' };
    if (accuracy >= 95 && maxCombo >= 10) return { label: 'MAESTRO CUÁNTICO', color: '#facc15' };
    if (accuracy >= 85 && maxCombo >= 5) return { label: 'NEURO EXPERTO', color: '#a855f7' };
    if (accuracy >= 70) return { label: 'LINKER NEURAL', color: '#22d3ee' };
    return { label: 'NOVATO SINÁPTICO', color: '#6b7280' };
  };

  const rank = getRank();

  const stats = [
    { icon: Target, label: 'Precisión', value: `${accuracy}%`, color: '#22d3ee' },
    { icon: Flame, label: 'Mejor Combo', value: `x${maxCombo}`, color: '#f97316' },
    { icon: Zap, label: 'Pares', value: `${matchedPairs}/${totalPairs}`, color: '#a855f7' },
    { icon: TrendingUp, label: 'Tiempo', value: `${Math.ceil(timeLeft)}s`, color: '#4ade80' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20"
          style={{ background: `radial-gradient(circle, ${won ? '#7c3aed' : '#ef4444'}, transparent)`, filter: 'blur(60px)' }} />
      </div>

      <motion.div
        className="w-full max-w-sm relative"
        initial={{ scale: 0.7, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.1 }}
      >
        <div className="rounded-3xl overflow-hidden border"
          style={{
            background: 'linear-gradient(180deg, rgba(15,5,40,0.98) 0%, rgba(5,2,20,0.98) 100%)',
            borderColor: won ? 'rgba(139,92,246,0.6)' : 'rgba(239,68,68,0.6)',
            boxShadow: `0 0 60px ${won ? 'rgba(139,92,246,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>

          {/* Header */}
          <div className="relative px-6 pt-8 pb-4 text-center"
            style={{ background: `linear-gradient(180deg, ${won ? 'rgba(139,92,246,0.15)' : 'rgba(239,68,68,0.1)'} 0%, transparent 100%)` }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.3, stiffness: 200 }}
              className="flex justify-center mb-3"
            >
              {won
                ? <Award size={56} className="text-yellow-400" style={{ filter: 'drop-shadow(0 0 20px rgba(250,204,21,0.6))' }} />
                : <div className="text-5xl">💀</div>
              }
            </motion.div>

            <div className="font-black text-2xl text-white mb-1" style={{ textShadow: `0 0 20px ${rank.color}` }}>
              {won ? '¡SECUENCIA SINCRONIZADA!' : 'CONEXIÓN PERDIDA'}
            </div>
            <div className="font-bold text-sm uppercase tracking-widest" style={{ color: rank.color }}>
              {rank.label}
            </div>

            {/* Stars */}
            {won && (
              <div className="flex justify-center gap-3 mt-4">
                {[1, 2, 3].map(s => (
                  <motion.div key={s}
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: 0.4 + s * 0.15, type: 'spring' }}>
                    <Star
                      size={32}
                      className={s <= stars ? 'text-yellow-400' : 'text-gray-700'}
                      fill={s <= stars ? '#facc15' : 'none'}
                      style={s <= stars ? { filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.8))' } : {}}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* VS Score */}
          <div className="px-6 py-3 flex items-center gap-4 border-y border-white/5">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Tu Puntuación</div>
              <motion.div
                className="text-2xl font-black text-cyan-400"
                style={{ textShadow: '0 0 15px rgba(34,211,238,0.6)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {score.toLocaleString()}
              </motion.div>
            </div>
            <div className="text-gray-600 font-black text-lg">VS</div>
            <div className="flex-1 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">IA Rival</div>
              <div className="text-2xl font-black text-red-400"
                style={{ textShadow: '0 0 15px rgba(248,113,113,0.6)' }}>
                {aiScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="px-6 py-4 grid grid-cols-2 gap-3">
            {stats.map((stat, i) => (
              <motion.div key={stat.label}
                className="rounded-2xl p-3 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                <stat.icon size={18} style={{ color: stat.color }} />
                <div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
                  <div className="font-black text-base text-white">{stat.value}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* XP Bar */}
          <div className="px-6 pb-4">
            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              <span className="flex items-center gap-1"><Zap size={9} />XP Ganado</span>
              <span className="text-purple-400 font-bold">+{xpGained} XP</span>
            </div>
            <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #c084fc)', boxShadow: '0 0 8px rgba(168,85,247,0.7)' }}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min((xpGained / 500) * 100, 100)}%` }}
                transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 flex flex-col gap-2">
            {won && level < 15 && (
              <motion.button
                onClick={onNextLevel}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  boxShadow: '0 0 25px rgba(139,92,246,0.5)',
                }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 35px rgba(139,92,246,0.7)' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Zap size={16} /> Siguiente Nivel
              </motion.button>
            )}

            <div className="flex gap-2">
              <motion.button
                onClick={onRetry}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                whileHover={{ background: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <RotateCcw size={14} /> Reintentar
              </motion.button>
              <motion.button
                onClick={onBackToLobby}
                className="flex-1 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest text-gray-400 flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                whileHover={{ background: 'rgba(255,255,255,0.07)' }}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.05 }}
              >
                <Home size={14} /> Lobby
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
