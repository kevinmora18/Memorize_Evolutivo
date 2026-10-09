import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Trophy, BarChart3, Trash2, Shield, Coins, Gem, Ban, Megaphone, TrendingUp, Gift } from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
  currentUserId: string;
}

interface User {
  id: string;
  email: string;
  username: string | null;
  role: string;
  level: number;
  coins: number;
  gems: number;
  isBanned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  createdAt: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    bestScore: number;
  };
  _count: {
    matches: number;
  };
}

interface Match {
  id: string;
  mode: string;
  level: number | null;
  score: number;
  won: boolean;
  createdAt: string;
  user: {
    email: string;
    username: string | null;
  };
}

interface Stats {
  totalUsers: number;
  totalMatches: number;
  totalGamesWon: number;
  avgScore: number;
  topScores: Array<{
    score: number;
    mode: string;
    user: {
      email: string;
      username: string | null;
    };
  }>;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
}

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: string;
  value: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface Analytics {
  usersPerDay: Array<{ date: string; count: number }>;
  modeStats: Array<{ mode: string; _count: { mode: number } }>;
  activeUsersCount: number;
}

export function AdminPanel({ onBack, currentUserId }: AdminPanelProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5175';
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'matches' | 'bans' | 'announcements' | 'economy' | 'analytics'>('stats');
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await fetch(`${API_BASE}/api/admin/users`);
        if (res.ok) setUsers(await res.json());
      } else if (activeTab === 'matches') {
        const res = await fetch(`${API_BASE}/api/admin/matches`);
        if (res.ok) setMatches(await res.json());
      } else if (activeTab === 'stats') {
        const res = await fetch(`${API_BASE}/api/admin/stats`);
        if (res.ok) setStats(await res.json());
      } else if (activeTab === 'bans') {
        const res = await fetch(`${API_BASE}/api/admin/banned-users`);
        if (res.ok) setBannedUsers(await res.json());
      } else if (activeTab === 'announcements') {
        const res = await fetch(`${API_BASE}/api/admin/announcements`);
        if (res.ok) setAnnouncements(await res.json());
      } else if (activeTab === 'economy') {
        const res = await fetch(`${API_BASE}/api/admin/promotions`);
        if (res.ok) setPromotions(await res.json());
      } else if (activeTab === 'analytics') {
        const res = await fetch(`${API_BASE}/api/admin/analytics`);
        if (res.ok) setAnalytics(await res.json());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Usuario eliminado');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'player' : 'admin';
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        alert(`Rol actualizado a ${newRole}`);
        loadData();
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleUpdateCurrency = async (userId: string) => {
    const coins = prompt('Ingresa la cantidad de monedas:');
    const gems = prompt('Ingresa la cantidad de gemas:');
    
    if (coins === null && gems === null) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/currency`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coins: coins ? parseInt(coins) : undefined,
          gems: gems ? parseInt(gems) : undefined
        })
      });
      if (res.ok) {
        alert('Monedas actualizadas');
        loadData();
      }
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  const handleBanUser = async (userId: string) => {
    const reason = prompt('Razón del baneo:');
    if (!reason) return;
    
    const duration = prompt('Duración en días (dejar vacío para permanente):');
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason,
          duration: duration ? parseInt(duration) : null
        })
      });
      if (res.ok) {
        alert('Usuario baneado');
        loadData();
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!confirm('¿Desbanear este usuario?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}/unban`, {
        method: 'PUT'
      });
      if (res.ok) {
        alert('Usuario desbaneado');
        loadData();
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
    }
  };

  const handleCreateAnnouncement = async () => {
    const title = prompt('Título del anuncio:');
    if (!title) return;
    
    const message = prompt('Mensaje:');
    if (!message) return;
    
    const type = prompt('Tipo (info/warning/success/error):', 'info');
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type })
      });
      if (res.ok) {
        alert('Anuncio creado');
        loadData();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Anuncio eliminado');
        loadData();
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleToggleAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcements/${id}/toggle`, {
        method: 'PUT'
      });
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const handleGiveCurrencyAll = async () => {
    const coins = prompt('Monedas a regalar a TODOS los usuarios:');
    const gems = prompt('Gemas a regalar a TODOS los usuarios:');
    
    if (!coins && !gems) return;
    
    if (!confirm(`¿Regalar ${coins || 0} monedas y ${gems || 0} gemas a TODOS los usuarios?`)) return;
    
    try {
      const res = await fetch(`${API_BASE}/api/admin/give-currency-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coins: coins ? parseInt(coins) : undefined,
          gems: gems ? parseInt(gems) : undefined
        })
      });
      if (res.ok) {
        alert('¡Monedas regaladas a todos!');
      }
    } catch (error) {
      console.error('Error giving currency:', error);
    }
  };

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
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent flex items-center gap-3">
          <Shield className="w-10 h-10 text-red-400" />
          PANEL DE ADMINISTRACIÓN
        </h1>
        <div className="w-32"></div>
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex gap-2 mb-8 justify-center flex-wrap">
        <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<BarChart3 className="w-5 h-5" />} label="Estadísticas" />
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-5 h-5" />} label="Usuarios" />
        <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Trophy className="w-5 h-5" />} label="Partidas" />
        <TabButton active={activeTab === 'bans'} onClick={() => setActiveTab('bans')} icon={<Ban className="w-5 h-5" />} label="Baneos" />
        <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={<Megaphone className="w-5 h-5" />} label="Anuncios" />
        <TabButton active={activeTab === 'economy'} onClick={() => setActiveTab('economy')} icon={<Gift className="w-5 h-5" />} label="Economía" />
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<TrendingUp className="w-5 h-5" />} label="Analíticas" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-2xl">Cargando...</div>
          </div>
        ) : (
          <>
            {activeTab === 'stats' && stats && <StatsTab stats={stats} />}
            {activeTab === 'users' && <UsersTab users={users} currentUserId={currentUserId} onDelete={handleDeleteUser} onToggleRole={handleToggleRole} onUpdateCurrency={handleUpdateCurrency} onBan={handleBanUser} />}
            {activeTab === 'matches' && <MatchesTab matches={matches} />}
            {activeTab === 'bans' && <BansTab bannedUsers={bannedUsers} onUnban={handleUnbanUser} />}
            {activeTab === 'announcements' && <AnnouncementsTab announcements={announcements} onCreate={handleCreateAnnouncement} onDelete={handleDeleteAnnouncement} onToggle={handleToggleAnnouncement} />}
            {activeTab === 'economy' && <EconomyTab promotions={promotions} onGiveCurrencyAll={handleGiveCurrencyAll} />}
            {activeTab === 'analytics' && analytics && <AnalyticsTab analytics={analytics} />}
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
        active
          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
          : 'bg-gray-800/50 text-gray-400 hover:text-white backdrop-blur-sm border border-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatsTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-2 border-blue-400 rounded-xl">
          <Users className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-sm text-gray-300">Total Usuarios</p>
          <p className="text-4xl font-bold text-blue-400">{stats.totalUsers}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-2 border-purple-400 rounded-xl">
          <Trophy className="w-8 h-8 text-purple-400 mb-2" />
          <p className="text-sm text-gray-300">Total Partidas</p>
          <p className="text-4xl font-bold text-purple-400">{stats.totalMatches}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 border-2 border-green-400 rounded-xl">
          <Trophy className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-sm text-gray-300">Partidas Ganadas</p>
          <p className="text-4xl font-bold text-green-400">{stats.totalGamesWon}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-2 border-orange-400 rounded-xl">
          <BarChart3 className="w-8 h-8 text-orange-400 mb-2" />
          <p className="text-sm text-gray-300">Puntuación Promedio</p>
          <p className="text-4xl font-bold text-orange-400">{Math.round(stats.avgScore)}</p>
        </motion.div>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">🏆 Top 10 Mejores Puntuaciones</h2>
        <div className="space-y-2">
          {stats.topScores.map((score: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-yellow-400">#{index + 1}</span>
                <div>
                  <p className="font-bold">{score.user.username || score.user.email}</p>
                  <p className="text-sm text-gray-400">{score.mode}</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-400">{score.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users, currentUserId, onDelete, onToggleRole, onUpdateCurrency, onBan }: any) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">👥 Gestión de Usuarios</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Rol</th>
              <th className="text-left p-3">Nivel</th>
              <th className="text-left p-3">Monedas</th>
              <th className="text-left p-3">Gemas</th>
              <th className="text-left p-3">Partidas</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.username || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3">{user.level}</td>
                <td className="p-3">{user.coins} 💰</td>
                <td className="p-3">{user.gems} 💎</td>
                <td className="p-3">{user._count.matches}</td>
                <td className="p-3">
                  {user.isBanned ? (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-red-500/20 text-red-400">BANEADO</span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">ACTIVO</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {user.id !== currentUserId && (
                      <>
                        <button onClick={() => onToggleRole(user.id, user.role)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded" title="Cambiar rol">
                          <Shield className="w-4 h-4" />
                        </button>
                        <button onClick={() => onUpdateCurrency(user.id)} className="p-2 bg-green-600 hover:bg-green-700 rounded" title="Editar monedas">
                          <Coins className="w-4 h-4" />
                        </button>
                        <button onClick={() => onBan(user.id)} className="p-2 bg-orange-600 hover:bg-orange-700 rounded" title="Banear usuario">
                          <Ban className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(user.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded" title="Eliminar usuario">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchesTab({ matches }: any) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4">🎮 Historial de Partidas</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left p-3">Jugador</th>
              <th className="text-left p-3">Modo</th>
              <th className="text-left p-3">Nivel</th>
              <th className="text-left p-3">Puntuación</th>
              <th className="text-left p-3">Resultado</th>
              <th className="text-left p-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match: any) => (
              <tr key={match.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="p-3">{match.user.username || match.user.email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400">{match.mode}</span>
                </td>
                <td className="p-3">{match.level || '-'}</td>
                <td className="p-3 font-bold text-yellow-400">{match.score}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${match.won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {match.won ? 'Victoria' : 'Derrota'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-400">{new Date(match.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BansTab({ bannedUsers, onUnban }: any) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Ban className="w-6 h-6 text-red-400" />
        Usuarios Baneados
      </h2>
      {bannedUsers.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No hay usuarios baneados</p>
      ) : (
        <div className="space-y-3">
          {bannedUsers.map((user: any) => (
            <div key={user.id} className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg">{user.username || user.email}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <p className="text-sm text-red-400 mt-2">Razón: {user.banReason}</p>
                  {user.bannedUntil && (
                    <p className="text-sm text-gray-400">Hasta: {new Date(user.bannedUntil).toLocaleString()}</p>
                  )}
                </div>
                <button
                  onClick={() => onUnban(user.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold"
                >
                  Desbanear
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementsTab({ announcements, onCreate, onDelete, onToggle }: any) {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-blue-400" />
          Anuncios Globales
        </h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
        >
          + Crear Anuncio
        </button>
      </div>
      <div className="space-y-3">
        {announcements.map((announcement: any) => (
          <div key={announcement.id} className={`p-4 rounded-lg border ${
            announcement.type === 'error' ? 'bg-red-900/20 border-red-500/30' :
            announcement.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30' :
            announcement.type === 'success' ? 'bg-green-900/20 border-green-500/30' :
            'bg-blue-900/20 border-blue-500/30'
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{announcement.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    announcement.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {announcement.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <p className="text-gray-300">{announcement.message}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Creado: {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onToggle(announcement.id)}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded"
                >
                  {announcement.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => onDelete(announcement.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EconomyTab({ promotions, onGiveCurrencyAll }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Gift className="w-6 h-6 text-green-400" />
          Regalar Monedas/Gemas
        </h2>
        <p className="text-gray-300 mb-4">Regala monedas o gemas a TODOS los usuarios registrados</p>
        <button
          onClick={onGiveCurrencyAll}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-bold text-lg"
        >
          🎁 Regalar a Todos
        </button>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold mb-4">💰 Promociones Activas</h2>
        {promotions.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No hay promociones activas</p>
        ) : (
          <div className="space-y-3">
            {promotions.map((promo: any) => (
              <div key={promo.id} className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <h3 className="font-bold text-lg">{promo.name}</h3>
                <p className="text-gray-300">{promo.description}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>Tipo: {promo.type}</span>
                  <span>Valor: {promo.value}x</span>
                  <span>Termina: {new Date(promo.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsTab({ analytics }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Usuarios Activos (7 días)
          </h3>
          <p className="text-4xl font-bold text-green-400">{analytics.activeUsersCount}</p>
        </div>

        <div className="col-span-2 bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-4">📊 Modos Más Populares</h3>
          <div className="space-y-2">
            {analytics.modeStats.map((stat: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
                <span className="font-bold">{stat.mode}</span>
                <span className="text-purple-400">{stat._count.mode} partidas</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold mb-4">📈 Registros por Día (Últimos 7 días)</h3>
        <div className="space-y-2">
          {analytics.usersPerDay.map((day: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-900/50 rounded">
              <span>{new Date(day.date).toLocaleDateString()}</span>
              <span className="text-blue-400">{day.count} usuarios</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
