import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Users, Play, Clock, Copy, Check, RefreshCw, Send, MessageCircle } from 'lucide-react';
import type { Room, Player } from '../App';
import { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  playerId: string;
  playerEmail: string;
  message: string;
  timestamp: number;
  teamId: number;
}

interface RoomWaitingProps {
  room: Room;
  currentUser: Player;
  onStartGame: () => void;
  onChangeTeam: (teamId: number) => void;
  onBackToLobby: () => void;
}

const teamColors = [
  { bg: 'from-red-600 to-orange-600', text: 'text-red-400', border: 'border-red-500' },
  { bg: 'from-blue-600 to-cyan-600', text: 'text-blue-400', border: 'border-blue-500' },
  { bg: 'from-green-600 to-emerald-600', text: 'text-green-400', border: 'border-green-500' },
  { bg: 'from-purple-600 to-pink-600', text: 'text-purple-400', border: 'border-purple-500' },
  { bg: 'from-yellow-600 to-amber-600', text: 'text-yellow-400', border: 'border-yellow-500' },
];

export function RoomWaiting({ room, currentUser, onStartGame, onChangeTeam, onBackToLobby }: RoomWaitingProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const teams = [1, 2, 3, 4, 5].map(teamId => ({
    id: teamId,
    players: room.players.filter((p: any) => p.teamId === teamId),
  })).filter(team => team.players.length === 2);

  const canStart = teams.length >= 2;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getAvailableTeams = (): number[] => {
    const teamCounts = [1, 2, 3, 4, 5].map(teamId => ({
      teamId,
      count: room.players.filter((p: any) => p.teamId === teamId).length,
    }));
    
    return teamCounts.filter(t => t.count < 2).map(t => t.teamId);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerId: currentUser.id,
      playerEmail: currentUser.email,
      message: messageInput.trim(),
      timestamp: Date.now(),
      teamId: currentUser.teamId,
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    setMessageInput('');
    
    // Sonido de envío
    const sendSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
    sendSound.volume = 0.3;
    sendSound.play().catch(() => {});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0">
        <motion.div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-cyan-900/20" animate={{ scale: [1,1.1,1], rotate: [0,90,0] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBackToLobby} className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Lobby</span>
          </button>

          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
            <h2 className="text-3xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{room.name}</h2>
            <p className="text-gray-400 text-sm mt-1">Esperando jugadores...</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500 rounded text-sm text-cyan-300 font-mono">Código: {room.code}</div>
              <button onClick={copyRoomCode} className="p-1 hover:bg-gray-700 rounded transition-colors" title="Copiar código">{copiedCode ? (<Check className="w-4 h-4 text-green-400" />) : (<Copy className="w-4 h-4 text-gray-400" />)}</button>
            </div>
          </motion.div>

          <div className="w-40" />
        </div>

        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 mb-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <Users className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <div className="text-2xl">{room.players.length}/10</div>
              <div className="text-sm text-gray-400">Jugadores</div>
            </div>
            <div>
              <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl">{teams.length}</div>
              <div className="text-sm text-gray-400">Equipos Completos</div>
            </div>
            <div>
              <Clock className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="text-2xl">5</div>
              <div className="text-sm text-gray-400">Rondas</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Teams Section */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4,5].map((teamId, index) => {
              const teamPlayers = room.players.filter((p: any) => p.teamId === teamId);
              const color = teamColors[index];
              const isCurrentUserTeam = currentUser.teamId === teamId;

              return (
                <motion.div key={teamId} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: index * 0.1, type: 'spring' }} className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border-2 ${isCurrentUserTeam ? color.border : 'border-gray-700'} ${isCurrentUserTeam ? 'ring-2 ring-white/20' : ''}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl ${color.text}`}>Equipo {teamId}</h3>
                    <div className={`px-3 py-1 rounded-full text-xs ${teamPlayers.length === 2 ? 'bg-green-500/20 text-green-400 border border-green-500' : 'bg-gray-700/50 text-gray-400 border border-gray-600'}`}>{teamPlayers.length}/2</div>
                  </div>

                  <div className="space-y-3">
                    {[0,1].map((slot) => {
                      const player = teamPlayers[slot];
                      return (
                        <div key={slot} className={`p-3 rounded-xl ${player ? `bg-gradient-to-r ${color.bg} bg-opacity-20` : 'bg-gray-700/30 border-2 border-dashed border-gray-600'}`}>
                          {player ? (
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.bg} flex items-center justify-center text-sm`}>{player.email[0].toUpperCase()}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm truncate">{player.email}{player.id === currentUser.id && (<span className="ml-2 text-xs text-cyan-400">(Tú)</span>)}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-gray-500 text-sm">Esperando jugador...</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!isCurrentUserTeam && teamPlayers.length < 2 && (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onChangeTeam(teamId)} className={`w-full mt-3 py-2 bg-gradient-to-r ${color.bg} rounded-lg text-sm flex items-center justify-center gap-2 hover:brightness-110`}>
                      <RefreshCw className="w-4 h-4" />
                      Cambiar a este equipo
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Chat Section */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700 overflow-hidden flex flex-col"
            style={{ height: '600px' }}
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-cyan-900/30 to-purple-900/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold">Chat de Sala</h3>
              </div>
              <div className="text-xs text-gray-400">{chatMessages.length} mensajes</div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay mensajes aún</p>
                  <p className="text-xs mt-1">¡Sé el primero en escribir!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwnMessage = msg.playerId === currentUser.id;
                  const color = teamColors[msg.teamId - 1];
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${color.bg} flex items-center justify-center text-xs`}>
                            {msg.playerEmail[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-gray-400">
                            {msg.playerEmail.split('@')[0]}
                            {isOwnMessage && <span className="ml-1 text-cyan-400">(Tú)</span>}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl ${
                          isOwnMessage 
                            ? 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white' 
                            : 'bg-gray-700/50 text-gray-200'
                        }`}>
                          <p className="text-sm break-words">{msg.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-900/50">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-500"
                  maxLength={200}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                    messageInput.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
                      : 'bg-gray-700/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Presiona Enter para enviar • {messageInput.length}/200
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-700 mb-8">
          <h3 className="text-xl mb-4 text-center">Cambiar de Equipo</h3>
          <div className="grid grid-cols-5 gap-3">
            {getAvailableTeams().filter(t => t !== currentUser.teamId).map((teamId) => {
              const color = teamColors[teamId - 1];
              return (
                <motion.button key={teamId} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => onChangeTeam(teamId)} className={`py-3 bg-gradient-to-r ${color.bg} rounded-xl flex items-center justify-center gap-2 hover:brightness-110`}>Equipo {teamId}</motion.button>
              );
            })}
          </div>
          {getAvailableTeams().filter(t => t !== currentUser.teamId).length === 0 && (<p className="text-center text-gray-500 text-sm">No hay equipos disponibles para cambiar</p>)}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-center">
          {canStart ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onStartGame} className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl flex items-center gap-3 mx-auto text-xl shadow-lg shadow-green-500/50">
              <Play className="w-6 h-6" />
              <span>¡Comenzar Partida!</span>
            </motion.button>
          ) : (
            <div className="px-12 py-4 bg-gray-800/50 rounded-2xl border border-gray-700 inline-flex items-center gap-3">
              <Clock className="w-6 h-6 text-gray-400" />
              <span className="text-gray-400">Se necesitan al menos 2 equipos completos para comenzar</span>
            </div>
          )}

          <p className="text-sm text-gray-500 mt-4">• Cada equipo juega por turnos<br/>• 5 rondas con dificultad creciente<br/>• El equipo con menos puntos al final pierde</p>
        </motion.div>
      </div>
    </div>
  );
}
