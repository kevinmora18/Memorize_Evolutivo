import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award, TrendingUp, Zap, X, Star, Target, Clock } from 'lucide-react';
import { loadPlayerStats, getRankByXP } from '../lib/playerEvolution';
import { useState, useEffect } from 'react';

interface RankedScreenProps {
  onBack: () => void;
}

// Datos de ejemplo del ranking
const RANKING_DATA = [
  { rank: 1, username: 'NeuroKing', xp: 12540, level: 45, wins: 892, icon: '👑', color: 'from-yellow-400 to-orange-500' },
  { rank: 2, username: 'MemoryGod', xp: 11200, level: 42, wins: 756, icon: '🏆', color: 'from-gray-300 to-gray-400' },
  { rank: 3, username: 'BrainStorm', xp: 10870, level: 40, wins: 689, icon: '🥉', color: 'from-orange-400 to-orange-600' },
  { rank: 4, username: 'NeuroLinker', xp: 8450, level: 37, wins: 534, icon: '⭐', color: 'from-purple-400 to-purple-600' },
  { rank: 5, username: 'MindMaster', xp: 7890, level: 35, wins: 498, icon: '💎', color: 'from-cyan-400 to-blue-500' },
  { rank: 6, username: 'SynapseX', xp: 7234, level: 33, wins: 445, icon: '🔥', color: 'from-red-400 to-red-600' },
  { rank: 7, username: 'CognitoElite', xp: 6789, level: 31, wins: 412, icon: '⚡', color: 'from-yellow-400 to-yellow-600' },
  { rank: 8, username: 'MemoryAce', xp: 6234, level: 29, wins: 389, icon: '🎯', color: 'from-green-400 to-green-600' },
  { rank: 9, username: 'NeuralNet', xp: 5890, level: 27, wins: 356, icon: '🧠', color: 'from-pink-400 to-pink-600' },
  { rank: 10, username: 'BrainWave', xp: 5456, level: 25, wins: 334, icon: '🌟', color: 'from-indigo-400 to-indigo-600' },
];

export function RankedScreen({ onBack }: RankedScreenProps) {
  const [playerStats, setPlayerStats] = useState(loadPlayerStats());
  const [selectedTab, setSelectedTab] = useState<'global' | 'friends' | 'region'>('global');
  const [selectedPlayer, setSelectedPlayer] = useState<typeof RANKING_DATA[0] | null>(null);

  useEffect(() => {
    setPlayerStats(loadPlayerStats());
  }, []);

  const currentRank = getRankByXP(playerStats.xp);
  const playerRanking = RANKING_DATA.find(p => p.username === 'NeuroLinker');

  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{
        backgroundImage: "url('/fonlobby.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Starfield Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.8, 0.1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Lobby</span>
        </button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          🏆 RANKING GLOBAL
        </h1>
        <div className="w-32" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {[
            { id: 'global', label: 'Global', icon: Trophy },
            { id: 'friends', label: 'Amigos', icon: Award },
            { id: 'region', label: 'Región', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white backdrop-blur-sm border border-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Player's Current Position */}
        {playerRanking && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-6 bg-gradient-to-r from-purple-900/80 to-pink-900/80 rounded-2xl backdrop-blur-xl border-2 border-purple-500 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">{playerRanking.icon}</div>
                <div>
                  <p className="text-sm text-purple-200">Tu Posición</p>
                  <h3 className="text-3xl font-bold text-white">#{playerRanking.rank}</h3>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm text-purple-200">XP Total</p>
                  <p className="text-2xl font-bold text-white">{playerRanking.xp.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-purple-200">Nivel</p>
                  <p className="text-2xl font-bold text-cyan-400">{playerRanking.level}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-purple-200">Victorias</p>
                  <p className="text-2xl font-bold text-green-400">{playerRanking.wins}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {RANKING_DATA.slice(0, 3).map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedPlayer(player)}
              className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                index === 0
                  ? 'bg-gradient-to-br from-yellow-900/80 to-orange-900/80 border-yellow-500 order-2'
                  : index === 1
                  ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border-gray-400 order-1'
                  : 'bg-gradient-to-br from-orange-900/80 to-red-900/80 border-orange-600 order-3'
              }`}
              style={{ marginTop: index === 0 ? '0' : index === 1 ? '20px' : '40px' }}
            >
              <div className="text-center">
                <div className="text-6xl mb-2">{player.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-1">{player.username}</h3>
                <p className="text-sm text-gray-300 mb-3">#{player.rank}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">XP:</span>
                    <span className="text-white font-bold">{player.xp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Nivel:</span>
                    <span className="text-cyan-400 font-bold">{player.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Victorias:</span>
                    <span className="text-green-400 font-bold">{player.wins}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rest of Rankings */}
        <div className="space-y-3">
          {RANKING_DATA.slice(3).map((player, index) => (
            <motion.div
              key={player.rank}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedPlayer(player)}
              className={`p-4 rounded-xl backdrop-blur-xl border transition-all cursor-pointer hover:scale-102 ${
                player.username === 'NeuroLinker'
                  ? 'bg-purple-900/50 border-purple-500 shadow-lg shadow-purple-500/20'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${player.color} flex items-center justify-center text-2xl font-bold text-white`}>
                    {player.rank}
                  </div>
                  <div className="text-3xl">{player.icon}</div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{player.username}</h4>
                    <p className="text-sm text-gray-400">Nivel {player.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">XP</p>
                    <p className="text-lg font-bold text-white">{player.xp.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Victorias</p>
                    <p className="text-lg font-bold text-green-400">{player.wins}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-lg font-bold text-yellow-400">{Math.floor(player.xp / 100)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Player Profile Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border-2 border-purple-500/50 shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Header with Rank Badge */}
              <div className={`relative p-8 bg-gradient-to-r ${selectedPlayer.color} overflow-hidden`}>
                <div className="absolute inset-0 opacity-20">
                  {[...Array(30)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      animate={{
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.5, 1],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}
                </div>

                <div className="relative flex items-center gap-6">
                  <div className="text-8xl">{selectedPlayer.icon}</div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-4xl font-bold text-white">{selectedPlayer.username}</h2>
                      {selectedPlayer.rank <= 3 && (
                        <Trophy className="w-8 h-8 text-yellow-300" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        <span className="text-white font-bold">Rank #{selectedPlayer.rank}</span>
                      </div>
                      <div className="px-4 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                        <span className="text-white font-bold">Nivel {selectedPlayer.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-8">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-xl border border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-gray-300">XP Total</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{selectedPlayer.xp.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-xl border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-gray-300">Victorias</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{selectedPlayer.wins}</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-xl border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-gray-300">Poder</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{Math.floor(selectedPlayer.xp / 100)}</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white mb-4">📊 Estadísticas Detalladas</h3>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-cyan-400" />
                      <span className="text-gray-300">Precisión</span>
                    </div>
                    <span className="text-white font-bold">{85 + selectedPlayer.rank}%</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <span className="text-gray-300">Tiempo Promedio</span>
                    </div>
                    <span className="text-white font-bold">{45 - selectedPlayer.rank}s</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Medal className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">Racha Máxima</span>
                    </div>
                    <span className="text-white font-bold">{selectedPlayer.wins / 10} victorias</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-400" />
                      <span className="text-gray-300">Logros</span>
                    </div>
                    <span className="text-white font-bold">{12 + (10 - selectedPlayer.rank)}/50</span>
                  </div>
                </div>

                {/* Achievements Preview */}
                <div className="mt-6">
                  <h3 className="text-xl font-bold text-white mb-4">🏅 Logros Destacados</h3>
                  <div className="flex gap-3">
                    {['🔥', '⚡', '💎', '👑', '🌟'].map((emoji, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border-2 border-yellow-500/50 flex items-center justify-center text-3xl cursor-pointer"
                      >
                        {emoji}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
