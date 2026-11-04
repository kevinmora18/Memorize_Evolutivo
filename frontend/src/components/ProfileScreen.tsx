import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Award, Calendar, Coins, Gem, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch, getStoredUser } from '../lib/api';
import { getRankByXP, calculateLevelFromXP, getXpIntoCurrentLevel, getProgressToNextLevel } from '../lib/playerEvolution';

interface ProfileScreenProps {
  onBack: () => void;
  userId?: string;
}

export function ProfileScreen({ onBack, userId }: ProfileScreenProps) {
  const [profile, setProfile] = useState<{
    user: any;
    stats: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    const effectiveId = userId || stored?.id;

    if (effectiveId) {
      apiFetch<{ user: any; stats: any }>(`/api/users/${effectiveId}`)
        .then((data) => {
          setProfile(data);
        })
        .catch((err) => {
          console.error('Error cargando perfil:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [userId]);

  const user = profile?.user || getStoredUser() || {};
  const stats = profile?.stats || {};

  const xp = user.xp || 0;
  const level = user.level || calculateLevelFromXP(xp);
  const xpInLevel = getXpIntoCurrentLevel(xp);
  const progressPercent = getProgressToNextLevel(xp);
  const currentRank = getRankByXP(xp);

  const gamesPlayed = stats.gamesPlayed || 0;
  const gamesWon = stats.gamesWon || 0;
  const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : '0';
  const bestScore = stats.bestScore || 0;
  const maxCombo = stats.maxCombo || 0;

  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{
        backgroundImage: "url('/classic/wing-neural-1920.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60"></div>
      
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
      <div className="flex justify-between items-center mb-8 relative z-10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Lobby</span>
        </button>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          MI PERFIL
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-mono font-bold text-yellow-400">{user.coins ?? 0}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
            <Gem className="w-4 h-4 text-cyan-400" />
            <span className="font-mono font-bold text-cyan-400">{user.gems ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {loading ? (
          <div className="p-12 text-center text-cyan-400">Cargando datos del perfil...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left - Profile Info */}
            <div className="col-span-1 space-y-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-6 bg-gray-800/60 rounded-xl border border-purple-500/30 backdrop-blur-md"
              >
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28 mb-4">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-4xl font-bold border-4 border-cyan-400 shadow-lg shadow-cyan-500/20">
                      {user.username ? user.username.slice(0, 2).toUpperCase() : 'ME'}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-purple-600 rounded-full border border-cyan-400">
                      <span className="text-white text-xs font-bold whitespace-nowrap">Nivel {level}</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-1">{user.username || 'Jugador'}</h2>
                  <p className="text-xs text-gray-400 mb-4 font-mono truncate max-w-[200px]">{user.id || 'MNZ-USER'}</p>
                  
                  <div className="w-full mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400">Progreso a Nivel {level + 1}</span>
                      <span className="text-cyan-400 font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700/60 rounded-full overflow-hidden border border-gray-600">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-mono">
                      <span>{xpInLevel} XP</span>
                      <span>1,000 XP</span>
                    </div>
                  </div>

                  <div className="w-full p-3 bg-purple-900/30 rounded-lg border border-purple-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Rango Actual</span>
                      <Trophy className="w-4 h-4 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{currentRank.icon}</span>
                      <span>{currentRank.name}</span>
                    </h3>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <div className="p-4 bg-gray-800/60 rounded-xl border border-purple-500/30 backdrop-blur-md">
                <h3 className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wider">Estadísticas Reales</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Partidas Jugadas</span>
                    <span className="text-white font-mono font-bold">{gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Victorias</span>
                    <span className="text-green-400 font-mono font-bold">{gamesWon}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Ratio Victoria</span>
                    <span className="text-cyan-400 font-mono font-bold">{winRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Mejor Puntuación</span>
                    <span className="text-yellow-400 font-mono font-bold">{bestScore}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Combo Máximo</span>
                    <span className="text-purple-400 font-mono font-bold">x{maxCombo}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center & Right - Detailed Stats */}
            <div className="col-span-1 md:col-span-2 space-y-4">
              {/* Neural Stats */}
              <div className="p-6 bg-gray-800/60 rounded-xl border border-purple-500/30 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  RENDIMIENTO COGNITIVO
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'Nivel General', value: Math.min(100, level * 5), label: `Nivel ${level}`, color: 'from-purple-500 to-cyan-500' },
                    { name: 'Tasa de Éxito', value: Number(winRate), label: `${winRate}%`, color: 'from-green-500 to-emerald-400' },
                    { name: 'Mejor Puntuación', value: Math.min(100, Math.floor(bestScore / 100)), label: `${bestScore} pts`, color: 'from-yellow-400 to-amber-500' },
                    { name: 'Habilidad de Combo', value: Math.min(100, maxCombo * 10), label: `x${maxCombo}`, color: 'from-pink-500 to-rose-400' },
                  ].map((stat) => (
                    <div key={stat.name} className="p-3 bg-gray-900/40 rounded-lg border border-gray-700/50">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-300 font-medium">{stat.name}</span>
                        <span className="text-white font-mono font-bold">{stat.label}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stat.value}%` }}
                          transition={{ duration: 0.8 }}
                          className={`h-full bg-gradient-to-r ${stat.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="p-6 bg-gray-800/60 rounded-xl border border-purple-500/30 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  LOGROS Y PROGRESIÓN
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { icon: '🌱', title: 'Primera Victoria', desc: 'Gana 1 partida', achieved: gamesWon >= 1 },
                    { icon: '⚡', title: 'Velocista', desc: '10 partidas jugadas', achieved: gamesPlayed >= 10 },
                    { icon: '🎯', title: 'Experto en Combos', desc: 'Alcanza combo x5', achieved: maxCombo >= 5 },
                    { icon: '🔥', title: 'En Llamas', desc: 'Gana 5 partidas', achieved: gamesWon >= 5 },
                    { icon: '💎', title: 'Veterano', desc: 'Supera los 5,000 XP', achieved: xp >= 5000 },
                    { icon: '👑', title: 'Maestro', desc: 'Alcanza nivel 10', achieved: level >= 10 },
                  ].map((achievement, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg border transition-all ${
                        achievement.achieved 
                          ? 'bg-purple-900/20 border-purple-500/50' 
                          : 'bg-gray-900/30 border-gray-800 opacity-50'
                      }`}
                    >
                      <div className="text-2xl mb-1 text-center">{achievement.icon}</div>
                      <h4 className="text-xs font-bold text-white text-center mb-0.5">{achievement.title}</h4>
                      <p className="text-[10px] text-gray-400 text-center">{achievement.desc}</p>
                      <div className="text-center mt-1">
                        <span className={`text-[10px] font-bold ${achievement.achieved ? 'text-green-400' : 'text-gray-500'}`}>
                          {achievement.achieved ? '✓ Desbloqueado' : 'Bloqueado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
