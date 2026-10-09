import { useState, useEffect } from 'react';
import {
  Hexagon, Mail, Users, Boxes, InfinityIcon, Settings,
  Target, Skull, Gamepad2, Zap, LogOut, X, TrendingUp
} from 'lucide-react';
import { loadPlayerStats, getRankByXP, getProgressToNextRank, getNextRank, type PlayerStats, RANKS } from '../lib/playerEvolution';

interface LobbyScreenProps {
  onStartMode: (mode: string) => void;
  onLogout: () => void;
  userRole?: string;
  userId?: string;
}

export function LobbyScreen({ onStartMode, onLogout, userRole, userId }: LobbyScreenProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5175';
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);

  useEffect(() => {
    const stats = loadPlayerStats();
    setPlayerStats(stats);
    
    // Cargar monedas y gemas del usuario desde la API
    if (userId) {
      fetch(`${API_BASE}/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setCoins(data.coins || 0);
          setGems(data.gems || 0);
        })
        .catch(err => console.error('Error loading currency:', err));
    }
  }, [userId]);

  if (!playerStats) return null;

  const currentRank = getRankByXP(playerStats.xp);
  const nextRank = getNextRank(currentRank.id);
  const progress = getProgressToNextRank(playerStats.xp);

  return (
    <div 
      className="font-rajdhani h-screen text-gray-300 flex flex-col overflow-hidden relative"
      style={{
        backgroundImage: "url('/fonlobby.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');
        
        .font-rajdhani {
          font-family: 'Rajdhani', sans-serif;
        }

        .glass-panel {
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(0, 255, 255, 0.1);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }

        .neon-border-cyan {
          border-color: #00ffff;
          box-shadow: inset 0 0 10px rgba(0, 255, 255, 0.2), 0 0 10px rgba(0, 255, 255, 0.2);
        }

        .progress-bar {
          background: linear-gradient(90deg, #b026ff 0%, #00ffff 100%);
        }

        .mode-card {
          background: rgba(10, 15, 30, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
        }

        .mode-card:hover {
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          transform: translateY(-5px);
        }

        .mode-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: rgba(139, 92, 246, 0.2);
          border: 2px solid rgba(139, 92, 246, 0.4);
        }
      `}</style>

      {/* Top Navigation */}
      <header className="flex justify-between items-center px-8 py-4 z-10 glass-panel border-b-0">
        <h1 className="text-3xl font-bold tracking-[0.3em] uppercase text-white">M E M O R I Z E</h1>
        
        <nav className="flex gap-8 text-sm font-semibold tracking-wider uppercase">
          <a className="text-white hover:text-cyan-400 transition-colors cursor-pointer border-b-2 border-purple-500">LOBBY</a>
          <a
            className="flex items-center gap-1.5 cursor-pointer transition-all group"
            onClick={() => setShowRanksModal(true)}
            title={`${currentRank.name} — ${currentRank.description}`}
          >
            {/* Rank badge */}
            <span
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all group-hover:scale-105"
              style={{
                borderColor: currentRank.color + '99',
                background: currentRank.color + '22',
                color: currentRank.color,
                boxShadow: `0 0 8px ${currentRank.color}55`,
              }}
            >
              <span className="text-base leading-none">{currentRank.icon}</span>
              <span>{currentRank.name}</span>
            </span>
          </a>
          <a className="text-gray-400 hover:text-white transition-colors cursor-pointer" onClick={() => onStartMode('tienda')}>TIENDA</a>
          <a className="text-gray-400 hover:text-white transition-colors cursor-pointer" onClick={() => onStartMode('ranked')}>RANKED</a>
          <a className="text-gray-400 hover:text-white transition-colors cursor-pointer" onClick={() => onStartMode('profile')}>PERFIL</a>
          {userRole === 'admin' && (
            <a className="text-red-400 hover:text-red-300 transition-colors cursor-pointer font-bold" onClick={() => onStartMode('admin')}>
              🛡️ ADMIN
            </a>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-sm font-semibold">
            {/* Monedas */}
            <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/50">
              <span className="text-xl">💰</span>
              <span className="text-white font-bold">{coins.toLocaleString()}</span>
            </div>
            {/* Diamantes/Gemas */}
            <div className="flex items-center gap-1 px-3 py-1 bg-cyan-500/20 rounded-full border border-cyan-500/50">
              <span className="text-xl">💎</span>
              <span className="text-white font-bold">{gems.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-400">
            <button onClick={() => setShowMessages(true)}>
              <Mail className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </button>
            <div className="relative">
              <Users className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border border-black"></span>
            </div>
            <button onClick={() => setShowSettings(true)}>
              <Settings className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col p-6 relative overflow-hidden">
        {/* Top Section */}
        <div className="grid grid-cols-12 gap-4 mb-4 z-10 flex-grow">
          {/* Left - User Profile with Rank */}
          <div className="col-span-3 flex flex-col gap-3">
            <div className="glass-panel rounded-lg p-3 border border-purple-500/30 cursor-pointer hover:border-purple-500/50 transition-all" onClick={() => onStartMode('profile')}>
              <div className="flex items-start gap-2">
                <div className="relative w-14 h-14 rounded-full border-2 neon-border-cyan p-1">
                  <img alt="Avatar" className="w-full h-full rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8M7nQSaF3HtkRN8jafA06uJgrZKNZj4q3CZ-dBiKt4Pmzk7NUjmRvd_eyuvBz5eP1QCfNpQQ_RHP5Q42sVghfZBdMkHT5FIdqV937sW5zf8A3v944vCBuTIdUTehcAQ0FXl5s_ErQoA9mm3VataX_FodvyVHTm0zO4irf1bUPbfNxVfrVOZfS2mHzy3_NCuQoNz9FSHRjjhpMlYFF5MbOGTvQQf-DjzCWtIX9zTGE8FNDdP_GMUns3_m4FB1YmoCMl3Tqo_ywupE" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-[#1a1a2e] border-2 border-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-cyan-400 font-bold text-xs">{playerStats.level}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <p className="text-xs text-gray-400 uppercase">USER ID</p>
                  <h2 className="text-base font-bold text-white">NeuroLinker</h2>
                  <p className="text-xs text-gray-500">ID: MNZ-7845</p>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full progress-bar" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-cyan-400 text-center">Ver perfil completo</div>
            </div>

            {/* Rank Display */}
            <div className="glass-panel rounded-lg p-4 border border-purple-500/30 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${currentRank.color}, transparent)` }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase text-gray-300 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Rango Actual
                  </h3>
                  <span className="text-2xl">{currentRank.icon}</span>
                </div>
                <h2 className={`text-xl font-bold bg-gradient-to-r ${currentRank.gradient} bg-clip-text text-transparent mb-1`}>
                  {currentRank.name}
                </h2>
                <p className="text-xs text-gray-400 mb-3">{currentRank.description}</p>
                
                {nextRank && (
                  <>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Progreso</span>
                      <span className="text-white">{playerStats.xp} / {nextRank.minXP} XP</span>
                    </div>
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full bg-gradient-to-r ${currentRank.gradient}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Siguiente: <span className={`bg-gradient-to-r ${nextRank.gradient} bg-clip-text text-transparent font-bold`}>
                        {nextRank.name}
                      </span>
                    </p>
                  </>
                )}
                {!nextRank && (
                  <p className="text-xs text-yellow-400 font-bold">¡RANGO MÁXIMO ALCANZADO!</p>
                )}
              </div>
            </div>

            <div className="glass-panel rounded-lg p-3 border border-purple-500/30">
              <h3 className="text-xs font-semibold uppercase mb-2 text-gray-300">ESTADÍSTICAS</h3>
              <div className="space-y-2">
                {['Memoria 92%', 'Velocidad 88%', 'Precisión 95%'].map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{stat.split(' ')[0]}</span>
                      <span className="text-white">{stat.split(' ')[1]}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{width: stat.split(' ')[1]}}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Empty Space */}
          <div className="col-span-6 flex items-center justify-center">
            {/* Espacio vacío - sin contenido */}
          </div>

          {/* Right - Missions */}
          <div className="col-span-3 flex flex-col gap-3">
            <div className="glass-panel rounded-lg p-3 border border-purple-500/30">
              <h3 className="text-xs font-semibold uppercase mb-2 text-gray-300">MISIONES DIARIAS</h3>
              <div className="space-y-2">
                {[{icon: Gamepad2, text: 'Juega 3 partidas', progress: 66}, {icon: Zap, text: '10 combos', progress: 20}].map((mission, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-800 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                      <mission.icon className="w-3 h-3" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs text-gray-300">{mission.text}</p>
                      <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{width: `${mission.progress}%`}}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-lg p-3 border border-purple-500/30">
              <h3 className="text-xs font-semibold uppercase mb-2 text-gray-300">TOP RANK</h3>
              <div className="space-y-1 text-xs">
                {['NeuroKing 12,540', 'MemoryGod 11,200', 'BrainStorm 10,870'].map((player, i) => (
                  <div key={i} className="flex justify-between p-1 rounded hover:bg-white/5">
                    <span className="text-gray-300">{i+1}. {player.split(' ')[0]}</span>
                    <span className="text-gray-400">{player.split(' ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Game Modes */}
        <div className="z-10 pb-4">
          <h2 className="text-xl font-bold uppercase text-center text-white mb-3">MODO DE JUEGO</h2>
          <div className="grid grid-cols-5 gap-3 max-w-5xl mx-auto">
            {[
              {mode: 'classic', icon: Boxes, title: 'CLÁSICO', desc: 'Encuentra pares', color: 'purple'},
              {mode: 'infinite', icon: InfinityIcon, title: 'INFINITO', desc: 'Aguanta tiempo', color: 'cyan'},
              {mode: 'challenge', icon: Target, title: 'DESAFÍO', desc: 'Misiones', color: 'orange'},
              {mode: 'boss', icon: Skull, title: 'BOSS', desc: 'Enfrenta IA', color: 'red'},
              {mode: 'ai-friends', icon: Users, title: 'AMIGOS IA', desc: 'Por turnos', color: 'green'}
            ].map((item) => (
              <div key={item.mode} onClick={() => onStartMode(item.mode)} className="mode-card rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer">
                <div className="mode-icon">
                  <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                </div>
                <div className="text-center">
                  <h4 className="text-white font-bold text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Messages Modal */}
      {showMessages && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowMessages(false)}>
          <div className="glass-panel rounded-xl p-6 max-w-md w-full mx-4 border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">MENSAJES</h3>
              <button onClick={() => setShowMessages(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-300">No tienes mensajes nuevos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="glass-panel rounded-xl p-6 max-w-md w-full mx-4 border border-purple-500/30" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">AJUSTES</h3>
              <button onClick={() => setShowSettings(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Volumen de Música</label>
                <input type="range" min="0" max="100" className="w-full" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Volumen de Efectos</label>
                <input type="range" min="0" max="100" className="w-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Notificaciones</span>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranks Modal */}
      {showRanksModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRanksModal(false)}>
          <div className="glass-panel rounded-xl p-6 max-w-2xl w-full border border-cyan-500/30 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#0a0f1e]/90 backdrop-blur-md pb-4 border-b border-white/10 z-10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-cyan-400" />
                CAMINO DE LA EVOLUCIÓN
              </h3>
              <button onClick={() => setShowRanksModal(false)} className="hover:text-white transition-colors p-1"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="space-y-4 relative">
              {RANKS.map((rank, index) => {
                const isCurrentRank = currentRank.id === rank.id;
                const isPassedRank = playerStats.xp >= rank.minXP;
                
                return (
                  <div 
                    key={rank.id} 
                    className={`relative p-4 rounded-xl border flex gap-4 transition-all ${
                      isCurrentRank 
                        ? 'border-cyan-400 bg-cyan-900/20 shadow-[0_0_15px_rgba(0,255,255,0.15)] transform scale-[1.02] z-10' 
                        : isPassedRank
                          ? 'border-purple-500/30 bg-purple-900/10 opacity-80'
                          : 'border-gray-800 bg-gray-900/30 opacity-50 grayscale'
                    }`}
                  >
                    {/* Connection Line */}
                    {index < RANKS.length - 1 && (
                      <div className={`absolute left-10 top-14 w-0.5 h-8 ${isPassedRank ? 'bg-cyan-500/50' : 'bg-gray-800'}`} style={{ zIndex: -1 }}></div>
                    )}
                    
                    <div className="flex flex-col items-center justify-start z-10 bg-transparent">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${
                          isCurrentRank ? 'border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : isPassedRank ? 'border-purple-500/50' : 'border-gray-700'
                        } bg-[#0a0f1e]`}
                      >
                        {rank.icon}
                      </div>
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-xl font-bold ${isCurrentRank ? 'text-cyan-400' : isPassedRank ? 'text-white' : 'text-gray-500'}`}>
                          {rank.name}
                        </h4>
                        <span className="text-xs font-mono text-gray-400 bg-black/40 px-2 py-1 rounded">
                          {rank.minXP === 0 ? 'Inicio' : `${rank.minXP} XP`}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${isCurrentRank ? 'text-cyan-100' : 'text-gray-400'}`}>
                        {rank.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {rank.rewards.map((reward, i) => (
                          <span 
                            key={i} 
                            className={`text-xs px-2 py-1 rounded-md border ${
                              isCurrentRank 
                                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' 
                                : isPassedRank
                                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                                  : 'border-gray-700 bg-gray-800 text-gray-500'
                            }`}
                          >
                            {reward}
                          </span>
                        ))}
                      </div>
                      
                      {isCurrentRank && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-cyan-400">Progreso actual</span>
                            <span className="text-white font-mono">{playerStats.xp} / {rank.maxXP === Infinity ? 'MÁX' : rank.maxXP} XP</span>
                          </div>
                          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-cyan-400"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {isCurrentRank && (
                      <div className="absolute top-4 right-4 animate-pulse">
                        <div className="text-[10px] font-bold text-black bg-cyan-400 px-2 py-0.5 rounded uppercase tracking-wider">
                          Tú estás aquí
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
