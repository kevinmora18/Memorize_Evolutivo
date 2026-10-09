import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Zap, Award, Calendar } from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{
        backgroundImage: "url('/fondosin.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      
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
        <div className="w-32"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-3 gap-6">
          {/* Left - Profile Info */}
          <div className="col-span-1 space-y-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/30"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-4">
                  <img 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover border-4 border-cyan-500"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8M7nQSaF3HtkRN8jafA06uJgrZKNZj4q3CZ-dBiKt4Pmzk7NUjmRvd_eyuvBz5eP1QCfNpQQ_RHP5Q42sVghfZBdMkHT5FIdqV937sW5zf8A3v944vCBuTIdUTehcAQ0FXl5s_ErQoA9mm3VataX_FodvyVHTm0zO4irf1bUPbfNxVfrVOZfS2mHzy3_NCuQoNz9FSHRjjhpMlYFF5MbOGTvQQf-DjzCWtIX9zTGE8FNDdP_GMUns3_m4FB1YmoCMl3Tqo_ywupE"
                  />
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded-full border-2 border-cyan-500">
                    <span className="text-white font-bold">Nivel 37</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">NeuroLinker</h2>
                <p className="text-sm text-gray-400 mb-4">ID: MNZ-7845</p>
                
                <div className="w-full mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progreso al Nivel 38</span>
                    <span className="text-cyan-400">56%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 w-[56%]"></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>8,450 XP</span>
                    <span>15,000 XP</span>
                  </div>
                </div>

                <div className="w-full p-4 bg-purple-900/30 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Rango Actual</span>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Neural Adept</h3>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <div className="p-4 bg-gray-800/50 rounded-xl border border-purple-500/30">
              <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase">Estadísticas Rápidas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Partidas Jugadas</span>
                  <span className="text-white font-bold">1,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Victorias</span>
                  <span className="text-green-400 font-bold">892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Ratio Victoria</span>
                  <span className="text-cyan-400 font-bold">71.5%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Mejor Racha</span>
                  <span className="text-yellow-400 font-bold">23</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center & Right - Detailed Stats */}
          <div className="col-span-2 space-y-4">
            {/* Neural Stats */}
            <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                ESTADÍSTICAS NEURALES
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {name: 'Memoria', value: 92, color: 'cyan'},
                  {name: 'Velocidad', value: 88, color: 'blue'},
                  {name: 'Precisión', value: 95, color: 'green'},
                  {name: 'Reflejos', value: 90, color: 'purple'},
                  {name: 'Sincronización', value: 83, color: 'pink'},
                  {name: 'Concentración', value: 87, color: 'yellow'}
                ].map((stat) => (
                  <div key={stat.name}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">{stat.name}</span>
                      <span className="text-white font-bold">{stat.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full bg-${stat.color}-400`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                LOGROS RECIENTES
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {icon: '🏆', title: 'Maestro de Memoria', desc: 'Completa 100 partidas'},
                  {icon: '⚡', title: 'Velocista', desc: 'Completa en menos de 30s'},
                  {icon: '🎯', title: 'Perfeccionista', desc: '100% de precisión'},
                  {icon: '🔥', title: 'Racha Caliente', desc: '10 victorias seguidas'},
                  {icon: '💎', title: 'Coleccionista', desc: 'Desbloquea 50 cartas'},
                  {icon: '👑', title: 'Rey Neural', desc: 'Alcanza rango máximo'}
                ].map((achievement, i) => (
                  <div key={i} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all">
                    <div className="text-3xl mb-2 text-center">{achievement.icon}</div>
                    <h4 className="text-sm font-bold text-white text-center mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-400 text-center">{achievement.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 bg-gray-800/50 rounded-xl border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                ACTIVIDAD RECIENTE
              </h3>
              <div className="space-y-3">
                {[
                  {mode: 'Clásico', result: 'Victoria', score: '+250 XP', time: 'Hace 2 horas'},
                  {mode: 'Infinito', result: 'Nivel 15', score: '+180 XP', time: 'Hace 5 horas'},
                  {mode: 'Boss Battle', result: 'Victoria', score: '+500 XP', time: 'Hace 1 día'},
                  {mode: 'Desafío', result: '3/3 Misiones', score: '+350 XP', time: 'Hace 2 días'}
                ].map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-bold text-white">{activity.mode}</h4>
                      <p className="text-xs text-gray-400">{activity.result}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-cyan-400">{activity.score}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
