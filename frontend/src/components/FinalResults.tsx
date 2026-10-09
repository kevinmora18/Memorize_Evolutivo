import { motion } from 'framer-motion';
import { Trophy, Home, Star, Zap } from 'lucide-react';
import type { Room } from '../App';

interface FinalResultsProps {
  room: Room;
  onBackToLobby: () => void;
}

const teamColors = [
  { bg: 'from-red-600 to-orange-600', glow: '#ff4500' },
  { bg: 'from-blue-600 to-cyan-600', glow: '#00d4ff' },
  { bg: 'from-green-600 to-emerald-600', glow: '#00ff88' },
  { bg: 'from-purple-600 to-pink-600', glow: '#b19cd9' },
  { bg: 'from-yellow-600 to-amber-600', glow: '#ffd700' },
];

export function FinalResults({ room, onBackToLobby }: FinalResultsProps) {
  const teams = [1,2,3,4,5].filter(teamId => room.players.filter((p: any) => p.teamId === teamId).length === 2).map(teamId => ({ teamId, players: room.players.filter((p: any) => p.teamId === teamId), score: Math.floor(Math.random() * 300) + 200, matches: Math.floor(Math.random() * 30) + 20, bestStreak: Math.floor(Math.random() * 8) + 3 })).sort((a,b) => b.score - a.score);

  const winner = teams[0];
  const loser = teams[teams.length - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-black relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0">
        <motion.div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-purple-600/20 to-pink-600/20" animate={{ scale: [1,1.3,1], rotate: [0,180,360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
        {[...Array(50)].map((_, i) => (
          <motion.div key={i} className="absolute w-2 h-2 rounded-full" style={{ left: `${Math.random() * 100}%`, top: `-5%`, backgroundColor: ['#ffd700','#ff4500','#00d4ff','#00ff88','#b19cd9'][Math.floor(Math.random()*5)] }} animate={{ y: [0, window.innerHeight + 100], rotate: [0,360], opacity: [1,0] }} transition={{ duration: 3 + Math.random()*2, repeat: Infinity, delay: Math.random()*2 }} />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 150 }} className="max-w-5xl mx-auto">
          <motion.div animate={{ scale: [1,1.05,1] }} transition={{ duration: 2, repeat: Infinity }} className="text-center mb-12">
            <h1 className="text-7xl mb-4">¡PARTIDA FINALIZADA!</h1>
            <p className="text-2xl text-gray-400">5 Rondas Completadas</p>
          </motion.div>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className={`mb-12 p-8 bg-gradient-to-r ${teamColors[winner.teamId - 1].bg} rounded-3xl relative overflow-hidden`}>
            <motion.div className="absolute inset-0" animate={{ backgroundPosition: ['0% 0%','100% 100%'] }} transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }} style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
            <div className="relative z-10 text-center">
              <motion.div animate={{ rotate: [0,10,-10,0] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block mb-4"><Trophy className="w-24 h-24 text-yellow-300" /></motion.div>
              <h2 className="text-5xl mb-4">¡EQUIPO {winner.teamId} CAMPEÓN!</h2>
              <div className="text-6xl mb-4">{winner.score} Puntos</div>
              <div className="flex items-center justify-center gap-8 text-xl"><div className="flex items-center gap-2"><Star className="w-6 h-6" /><span>{winner.matches} Aciertos</span></div><div className="flex items-center gap-2"><Zap className="w-6 h-6" /><span>Mejor Racha: x{winner.bestStreak}</span></div></div>
              <div className="mt-6 space-y-2">{winner.players.map((player: any, idx: number) => (<div key={idx} className="text-lg opacity-90">👤 {player.email}</div>))}</div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {teams.map((team, index) => {
              const color = teamColors[team.teamId - 1];
              const isWinner = index === 0;
              const isLoser = index === teams.length - 1;

              return (
                <motion.div key={team.teamId} initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + index * 0.1 }} className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border-2 ${isWinner ? 'border-yellow-500' : isLoser ? 'border-red-500' : 'border-gray-700'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-full bg-gradient-to-r ${color.bg} flex items-center justify-center text-2xl`}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div><div><h3 className="text-2xl">Equipo {team.teamId}</h3></div></div>
                    <div className="text-right"><div className="text-3xl">{team.score}</div><div className="text-sm text-gray-400">puntos</div></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4"><div className="p-3 bg-gray-700/30 rounded-lg text-center"><div className="text-xl">{team.matches}</div><div className="text-xs text-gray-400">Aciertos</div></div><div className="p-3 bg-gray-700/30 rounded-lg text-center"><div className="text-xl">x{team.bestStreak}</div><div className="text-xs text-gray-400">Mejor Racha</div></div></div>

                  <div className="space-y-2">{team.players.map((player: any, idx: number) => (<div key={idx} className="flex items-center gap-2 p-2 bg-gray-700/20 rounded-lg"><div className={`w-6 h-6 rounded-full bg-gradient-to-r ${color.bg} flex items-center justify-center text-xs`}>{player.email[0].toUpperCase()}</div><span className="text-sm truncate">{player.email}</span></div>))}</div>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} className="mb-8 p-6 bg-red-900/20 border-2 border-red-500 rounded-2xl text-center">
            <h3 className="text-2xl mb-2 text-red-400">Equipo {loser.teamId} - Último Lugar</h3>
            <p className="text-gray-400">¡No se desanimen! La práctica hace al maestro. ¡Inténtenlo de nuevo!</p>
          </motion.div>

          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.2 }} className="text-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onBackToLobby} className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-2xl text-xl flex items-center gap-3 mx-auto shadow-lg"><Home className="w-6 h-6" /><span>Volver al Lobby</span></motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
