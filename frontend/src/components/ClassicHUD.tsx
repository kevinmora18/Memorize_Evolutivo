
import { motion } from 'framer-motion';
import { ChevronLeft, Zap, Clock, Flame, Target } from 'lucide-react';

interface ClassicHUDProps {
  level: number;
  score: number;
  aiScore: number;
  combo: number;
  timer: number;
  maxTime: number;
  energy: number;
  matchedPairs: number;
  totalPairs: number;
  onBack: () => void;
}

export function ClassicHUD({
  level, score, aiScore, combo, timer, maxTime, energy, matchedPairs, totalPairs, onBack
}: ClassicHUDProps) {
  const timerPct = (timer / maxTime) * 100;
  const timerColor = timer < 10 ? '#ef4444' : timer < 20 ? '#f97316' : '#22d3ee';
  const progressPct = (matchedPairs / totalPairs) * 100;

  return (
    <div className="w-full flex flex-col gap-2 px-4 pt-3 pb-2 z-20 relative"
      style={{ background: 'linear-gradient(180deg, rgba(5,2,20,0.97) 0%, rgba(5,2,20,0.85) 100%)' }}>

      {/* Top row: back + level + level badge */}
      <div className="flex items-center justify-between">
        <button onClick={onBack}
          className="flex items-center gap-1 text-purple-400 hover:text-purple-200 transition-colors">
          <ChevronLeft size={20} />
          <span className="text-xs font-bold uppercase tracking-wider">Lobby</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Modo Clásico</span>
          <div className="flex items-center gap-1">
            <span className="text-white font-black text-base tracking-wider">NIVEL {level}</span>
            {level >= 4 && level <= 6 && <span className="text-xs text-purple-400 font-bold">⚡ GLITCH</span>}
            {level >= 7 && level <= 10 && <span className="text-xs text-red-400 font-bold">💣 BOMBA</span>}
            {level >= 11 && <span className="text-xs text-indigo-400 font-bold">🌑 OSCURIDAD</span>}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Pares</div>
          <div className="text-white font-bold text-sm">{matchedPairs}/{totalPairs}</div>
        </div>
      </div>

      {/* VS Score Row */}
      <div className="flex items-center gap-3">
        {/* Player */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 overflow-hidden shadow-[0_0_12px_rgba(34,211,238,0.5)]">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=player&backgroundColor=0ea5e9"
              className="w-full h-full object-cover" alt="player" />
          </div>
          <motion.div
            key={score}
            className="text-cyan-400 font-black text-lg leading-none"
            style={{ textShadow: '0 0 10px rgba(34,211,238,0.8)' }}
            initial={{ scale: 1.4, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {score.toLocaleString()}
          </motion.div>
          <div className="text-[9px] text-gray-400 uppercase tracking-widest">Tú</div>
        </div>

        {/* VS + Timer */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xs font-black text-gray-500 tracking-widest">VS</div>
          <motion.div
            className="text-2xl font-black leading-none"
            style={{ color: timerColor, textShadow: `0 0 15px ${timerColor}88` }}
            animate={timer < 10 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: timer < 10 ? Infinity : 0 }}
          >
            {Math.ceil(timer)}
          </motion.div>
          <div className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <Clock size={9} /> seg
          </div>
        </div>

        {/* AI Opponent */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-full border-2 border-red-400 overflow-hidden shadow-[0_0_12px_rgba(248,113,113,0.5)]">
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=neural-ai&backgroundColor=dc2626"
              className="w-full h-full object-cover" alt="ai" />
          </div>
          <motion.div
            key={aiScore}
            className="text-red-400 font-black text-lg leading-none"
            style={{ textShadow: '0 0 10px rgba(248,113,113,0.8)' }}
            initial={{ scale: 1.4, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {aiScore.toLocaleString()}
          </motion.div>
          <div className="text-[9px] text-gray-400 uppercase tracking-widest">IA Rival</div>
        </div>
      </div>

      {/* Timer Bar */}
      <div className="flex items-center gap-2">
        <Clock size={10} className="text-gray-500" />
        <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${timerColor}, ${timerColor}88)`,
              boxShadow: `0 0 8px ${timerColor}` }}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Combo + Energy row */}
      <div className="flex items-center gap-3">
        {/* Combo */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: combo >= 2 ? 'rgba(168,85,247,0.2)' : 'rgba(30,30,50,0.5)',
            border: combo >= 2 ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(60,60,80,0.3)' }}>
          <Flame size={12} className={combo >= 2 ? 'text-orange-400' : 'text-gray-600'} />
          <span className={`font-black text-sm ${combo >= 2 ? 'text-orange-400' : 'text-gray-600'}`}>x{combo}</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">combo</span>
        </div>

        {/* Energy Bar */}
        <div className="flex-1 flex flex-col gap-0.5">
          <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-wider">
            <span className="flex items-center gap-1"><Zap size={9} />Energía</span>
            <span>{Math.round(energy)}%</span>
          </div>
          <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)',
                boxShadow: '0 0 8px rgba(168,85,247,0.6)' }}
              animate={{ width: `${energy}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(30,30,50,0.5)', border: '1px solid rgba(60,60,80,0.3)' }}>
          <Target size={10} className="text-green-400" />
          <span className="text-green-400 font-bold text-xs">{Math.round(progressPct)}%</span>
        </div>
      </div>

      {/* Board progress bar */}
      <div className="h-0.5 bg-gray-900 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #22d3ee, #a855f7)' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
