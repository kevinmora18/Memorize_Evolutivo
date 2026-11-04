import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Award, TrendingUp, Zap, X, Star, Target, Clock, Shield } from 'lucide-react';
import { useEquippedRoomTheme } from '../lib/roomTheme';
import { useState, useEffect } from 'react';
import { apiFetch, getStoredUser } from '../lib/api';
import { getRankByXP, calculateLevelFromXP } from '../lib/playerEvolution';

interface RankedScreenProps {
  onBack: () => void;
}

interface LeaderboardPlayer {
  rank: number;
  id: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  totalScore: number;
  maxCombo: number;
  icon?: string;
  color?: string;
}

const RANK_COLORS = [
  'from-yellow-400 to-orange-500',
  'from-gray-300 to-gray-400',
  'from-orange-400 to-orange-600',
  'from-purple-400 to-purple-600',
  'from-cyan-400 to-blue-500',
  'from-red-400 to-red-600',
  'from-yellow-400 to-yellow-600',
  'from-green-400 to-green-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
];

const ICONS = ['👑', '🏆', '🥉', '⭐', '💎', '🔥', '⚡', '🎯', '🧠', '🌟'];

export function RankedScreen({ onBack }: RankedScreenProps) {
  const [selectedTab, setSelectedTab] = useState<'xp' | 'wins' | 'score' | 'level'>('xp');
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardPlayer | null>(null);
  const [myRank, setMyRank] = useState<{ rank: number; value: number } | null>(null);
  const roomTheme = useEquippedRoomTheme();

  const storedUser = getStoredUser();

  useEffect(() => {
    setLoading(true);
    apiFetch<{ leaderboard: LeaderboardPlayer[]; total: number }>(`/api/leaderboard?type=${selectedTab}&limit=50`)
      .then((data) => {
        const list = (data.leaderboard || []).map((p, idx) => ({
          ...p,
          icon: ICONS[idx] || '🎮',
          color: RANK_COLORS[idx % RANK_COLORS.length],
        }));
        setLeaderboard(list);
      })
      .catch((err) => {
        console.error('Error cargando leaderboard:', err);
      })
      .finally(() => setLoading(false));

    if (storedUser?.id) {
      apiFetch<{ rank: number; value: number }>(`/api/leaderboard/user/${storedUser.id}?type=${selectedTab}`)
        .then((res) => setMyRank(res))
        .catch(() => setMyRank(null));
    }
  }, [selectedTab, storedUser?.id]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden transition-all duration-700"
      style={{
        backgroundImage: `url('${roomTheme.image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay adaptado */}
      <div className="absolute inset-0 bg-black/75"></div>
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[130px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
      />

      {/* Starfield Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(60)].map((_, i) => (
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
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Lobby</span>
        </button>
        <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
          🏆 RANKING GLOBAL
        </h1>
        <div className="w-32 text-right">
          {myRank && (
            <div className="px-3 py-1.5 bg-purple-900/60 border border-purple-500/40 rounded-xl text-xs inline-block">
              <span className="text-gray-400">Tu posición: </span>
              <span className="font-bold text-yellow-400 font-mono">#{myRank.rank}</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'xp', label: 'Experiencia (XP)', icon: Trophy },
            { id: 'wins', label: 'Victorias', icon: Award },
            { id: 'score', label: 'Mejor Score', icon: Target },
            { id: 'level', label: 'Nivel', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-gray-800/60 text-gray-400 hover:text-white backdrop-blur-sm border border-gray-700/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center text-cyan-400">Cargando clasificación desde el servidor...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-16 text-center text-gray-400 bg-gray-800/40 rounded-2xl border border-gray-700">
            Aún no hay jugadores registrados en esta categoría. ¡Sé el primero en jugar!
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
                {/* 2nd place */}
                {top3[1] && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => setSelectedPlayer(top3[1])}
                    className="p-6 rounded-2xl backdrop-blur-xl border-2 border-gray-400 bg-gradient-to-br from-gray-700/70 to-gray-800/70 cursor-pointer hover:scale-105 transition-all text-center order-2 md:order-1"
                  >
                    <div className="text-5xl mb-2">{top3[1].icon}</div>
                    <h3 className="text-xl font-bold text-white mb-1 truncate">{top3[1].username || 'Jugador'}</h3>
                    <p className="text-sm font-mono text-gray-300 font-bold mb-3">#2 PLATA</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-300">
                        <span>XP:</span>
                        <span className="text-white font-mono font-bold">{top3[1].xp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Nivel:</span>
                        <span className="text-cyan-400 font-mono font-bold">{top3[1].level}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Victorias:</span>
                        <span className="text-green-400 font-mono font-bold">{top3[1].gamesWon}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 1st place */}
                {top3[0] && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={() => setSelectedPlayer(top3[0])}
                    className="p-8 rounded-2xl backdrop-blur-xl border-2 border-yellow-400 bg-gradient-to-br from-yellow-900/70 to-amber-900/70 cursor-pointer hover:scale-105 transition-all text-center shadow-xl shadow-yellow-500/20 order-1 md:order-2"
                  >
                    <div className="text-6xl mb-2">{top3[0].icon}</div>
                    <h3 className="text-2xl font-black text-white mb-1 truncate">{top3[0].username || 'Jugador'}</h3>
                    <p className="text-sm font-mono text-yellow-300 font-extrabold mb-3">👑 CAMPEÓN #1</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-yellow-100">
                        <span>XP:</span>
                        <span className="text-white font-mono font-bold">{top3[0].xp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-yellow-100">
                        <span>Nivel:</span>
                        <span className="text-cyan-300 font-mono font-bold">{top3[0].level}</span>
                      </div>
                      <div className="flex justify-between text-yellow-100">
                        <span>Victorias:</span>
                        <span className="text-green-300 font-mono font-bold">{top3[0].gamesWon}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3rd place */}
                {top3[2] && (
                  <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setSelectedPlayer(top3[2])}
                    className="p-6 rounded-2xl backdrop-blur-xl border-2 border-orange-600 bg-gradient-to-br from-orange-900/70 to-red-900/70 cursor-pointer hover:scale-105 transition-all text-center order-3"
                  >
                    <div className="text-5xl mb-2">{top3[2].icon}</div>
                    <h3 className="text-xl font-bold text-white mb-1 truncate">{top3[2].username || 'Jugador'}</h3>
                    <p className="text-sm font-mono text-orange-300 font-bold mb-3">#3 BRONCE</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-300">
                        <span>XP:</span>
                        <span className="text-white font-mono font-bold">{top3[2].xp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Nivel:</span>
                        <span className="text-cyan-400 font-mono font-bold">{top3[2].level}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Victorias:</span>
                        <span className="text-green-400 font-mono font-bold">{top3[2].gamesWon}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Rest of Rankings Table */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((player) => {
                  const isMe = player.id === storedUser?.id;
                  return (
                    <motion.div
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`p-4 rounded-xl backdrop-blur-md border transition-all cursor-pointer flex items-center justify-between ${
                        isMe
                          ? 'bg-purple-900/50 border-purple-400 shadow-md shadow-purple-500/20'
                          : 'bg-gray-800/50 border-gray-700/60 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center font-mono font-bold text-sm text-yellow-400">
                          #{player.rank}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{player.username || 'Jugador'}</span>
                            {isMe && <span className="text-[10px] bg-purple-600 px-2 py-0.5 rounded-full font-bold">TÚ</span>}
                          </h4>
                          <p className="text-xs text-gray-400">Nivel {player.level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-[10px] text-gray-400">XP</p>
                          <p className="text-sm font-mono font-bold text-white">{player.xp.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Victorias</p>
                          <p className="text-sm font-mono font-bold text-green-400">{player.gamesWon}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400">Mejor Score</p>
                          <p className="text-sm font-mono font-bold text-cyan-400">{player.bestScore}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Player Modal */}
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full bg-gray-900 border border-purple-500/40 rounded-2xl p-6 relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-3xl font-bold mb-3 border-2 border-cyan-400">
                  {selectedPlayer.username ? selectedPlayer.username.slice(0, 2).toUpperCase() : 'ME'}
                </div>
                <h3 className="text-2xl font-black text-white">{selectedPlayer.username || 'Jugador'}</h3>
                <p className="text-xs text-purple-400 font-mono mt-0.5">Rango #{selectedPlayer.rank} en el Ranking</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-center">
                <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                  <p className="text-xs text-gray-400">Nivel</p>
                  <p className="text-lg font-bold text-cyan-400 font-mono">{selectedPlayer.level}</p>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                  <p className="text-xs text-gray-400">XP Total</p>
                  <p className="text-lg font-bold text-white font-mono">{selectedPlayer.xp.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                  <p className="text-xs text-gray-400">Victorias</p>
                  <p className="text-lg font-bold text-green-400 font-mono">{selectedPlayer.gamesWon}</p>
                </div>
                <div className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/60">
                  <p className="text-xs text-gray-400">Mejor Puntuación</p>
                  <p className="text-lg font-bold text-yellow-400 font-mono">{selectedPlayer.bestScore}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/40 flex justify-between text-xs text-gray-300">
                <span>Partidas jugadas: <strong>{selectedPlayer.gamesPlayed}</strong></span>
                <span>Combo máx: <strong>x{selectedPlayer.maxCombo}</strong></span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
