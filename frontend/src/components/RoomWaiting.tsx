import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Crown, Users, Play, Copy, Check, Send,
  MessageCircle, Swords, CheckCircle2, Clock, ShieldCheck, Globe, QrCode, Bot
} from 'lucide-react';
import type { Room, Player } from '../App';
import socket, { connectSocket } from '../lib/socket';
import { apiFetch } from '../lib/api';
import { useEquippedRoomTheme, type RoomThemeDef } from '../lib/roomTheme';
import { QRCodeModal } from './QRCodeModal';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number | string | Date;
}

interface RoomWaitingProps {
  room: Room;
  currentUser: Player;
  onChangeTeam?: (teamId: number) => void;
  onBackToLobby: () => void;
  onUpdateRoom?: (room: Room) => void;
  onStartRoomGame?: (room: Room) => void;
}

export function RoomWaiting({
  room,
  currentUser,
  onChangeTeam,
  onBackToLobby,
  onUpdateRoom,
  onStartRoomGame,
}: RoomWaitingProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const roomTheme = useEquippedRoomTheme();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const playersList = room.players || [];
  const hostId = room.hostId || room.creatorId || (playersList[0]?.id ?? '');
  const isHost = currentUser.id === hostId;

  // Encontrar al oponente (en modo 1v1)
  const opponent = playersList.find((p) => p.id !== currentUser.id);

  // Verificar si se puede iniciar la partida (mínimo 2 jugadores)
  // El host no necesita marcarse listo; los invitados sí.
  const guestPlayers = playersList.filter((p) => p.id !== hostId);
  const allGuestsReady = guestPlayers.length > 0 && guestPlayers.every((p: any) => p.isReady);
  const canStart = playersList.length >= 2 && allGuestsReady;

  // Sincronización Socket.IO + Polling HTTP de respaldo de la sala
  useEffect(() => {
    connectSocket();

    const joinSocketRoom = () => {
      socket.emit('room:join', {
        roomId: room.id,
        userName: currentUser.name || currentUser.email.split('@')[0],
        userLevel: currentUser.level || 1,
      });
    };

    joinSocketRoom();
    socket.on('connect', joinSocketRoom);

    const handleChatMessage = (msg: any) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          userId: msg.userId,
          userName: msg.userName || 'Operador',
          message: msg.message,
          timestamp: msg.timestamp || Date.now(),
        },
      ]);
    };

    socket.on('chat:message', handleChatMessage);

    // Polling HTTP cada 2.2s como respaldo para mantener jugadores, estado de "Listo" e inicio sincronizados
    const pollInterval = setInterval(async () => {
      try {
        const latestRoom = await apiFetch<any>(`/api/rooms/${room.id}`);
        if (!latestRoom) return;
        if (onUpdateRoom) {
          onUpdateRoom(latestRoom);
        }
        const meInRoom = (latestRoom.players || []).find((p: any) => p.id === currentUser.id);
        if (meInRoom && typeof meInRoom.isReady === 'boolean') {
          setIsReady(meInRoom.isReady);
        }
        if (latestRoom.status === 'playing' || latestRoom.gameState?.status === 'playing') {
          if (onStartRoomGame) {
            onStartRoomGame({ ...latestRoom, isStarted: true });
          }
        }
      } catch {
        /* silencioso en caso de red intermitente */
      }
    }, 2200);

    return () => {
      clearInterval(pollInterval);
      socket.off('connect', joinSocketRoom);
      socket.off('chat:message', handleChatMessage);
    };
  }, [room.id, currentUser, onUpdateRoom, onStartRoomGame]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const copyRoomCode = () => {
    const code = room.code || room.id;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const toggleReady = async () => {
    const nextState = !isReady;
    setIsReady(nextState);
    socket.emit('room:ready', {
      roomId: room.id,
      isReady: nextState,
    });
    try {
      const updated = await apiFetch<any>(`/api/rooms/${room.id}/ready`, {
        method: 'PUT',
        body: JSON.stringify({ isReady: nextState }),
      });
      if (updated && onUpdateRoom) {
        onUpdateRoom(updated);
      }
    } catch {
      /* fallback socket ya enviado */
    }
  };

  const handleStartGame = async () => {
    if (!isHost || !canStart) return;
    socket.emit('game:start', { roomId: room.id });
    // Respaldo HTTP si el evento de socket tarda en propagarse
    setTimeout(async () => {
      try {
        const latest = await apiFetch<any>(`/api/rooms/${room.id}`);
        if (latest && latest.status !== 'playing') {
          const started = await apiFetch<any>(`/api/rooms/${room.id}/start`, {
            method: 'PUT',
            body: JSON.stringify({}),
          });
          if (started && onStartRoomGame) {
            onStartRoomGame({ ...started, isStarted: true });
          }
        } else if (latest && latest.status === 'playing' && onStartRoomGame) {
          onStartRoomGame({ ...latest, isStarted: true });
        }
      } catch {
        /* ya iniciado por socket */
      }
    }, 900);
  };

  // Permite iniciar un duelo 1v1 de inmediato contra un Rival IA si no hay un segundo jugador conectado
  const handleStartWithBotRival = () => {
    const botPlayer: Player = {
      id: 'bot-rival-1v1',
      name: 'Nexus-IV (IA)',
      email: 'nexus@memorize.ai',
      teamId: 2,
      level: currentUser.level || 3,
      isReady: true,
      score: 0,
    };

    const updatedRoom: Room & { isBotMatch?: boolean } = {
      ...room,
      isStarted: true,
      status: 'playing',
      isBotMatch: true,
      players: [currentUser, botPlayer],
    };

    if (onStartRoomGame) {
      onStartRoomGame(updatedRoom);
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const text = messageInput.trim();
    const userName = currentUser.name || currentUser.email.split('@')[0];

    socket.emit('chat:message', {
      roomId: room.id,
      userId: currentUser.id,
      userName,
      message: text,
    });

    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeave = () => {
    socket.emit('room:leave', { roomId: room.id });
    onBackToLobby();
  };

  return (
    <div
      className="min-h-screen text-[#E8E6DF] flex flex-col relative overflow-hidden select-none transition-all duration-700"
      style={{
        backgroundImage: `url('${roomTheme.image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-[#07090F]/80 backdrop-blur-[2px]" />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[130px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
      />
      {/* Resplandores de duelo lateral en la sala de espera */}
      <div
        className="absolute top-1/2 -left-20 -translate-y-1/2 w-[350px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
      />
      <div
        className="absolute top-1/2 -right-20 -translate-y-1/2 w-[350px] h-[500px] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
      />
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* Header */}
      <header className="relative z-20 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 border-b border-[#1E2836]/70 backdrop-blur-md bg-[#07090F]/80">
        <button
          onClick={handleLeave}
          className="an-focusable self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119]/80 text-[#9AA3B2] hover:text-[#E8E6DF] hover:border-[#FF4D5E]/50 transition-all group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-mono text-xs uppercase tracking-widest">Abandonar Sala</span>
        </button>

        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#35E0C8]">
            SALA MULTIJUGADOR 1V1
          </div>
          <h1 className="font-serif text-xl sm:text-2xl text-white font-bold tracking-tight">
            {room.name || 'Sala de Duelo'}
          </h1>
        </div>

        {/* Código de Sala y Entorno Vinculado */}
        <div className="flex items-center gap-2 self-center sm:self-auto">
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs"
            style={{
              borderColor: `${roomTheme.accent}40`,
              background: `${roomTheme.accent}15`,
              color: roomTheme.accent,
            }}
            title="Entorno vinculado con tu Perfil"
          >
            <span>{roomTheme.icon}</span>
            <span>{roomTheme.name}</span>
          </div>

          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#35E0C8]/40 bg-[#35E0C8]/10 text-[#35E0C8] hover:bg-[#35E0C8]/20 transition-all font-mono text-xs cursor-pointer shadow-[0_0_15px_rgba(53,224,200,0.15)]"
            title="Escanear Código QR para unirse a la sala"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">QR INVITAR</span>
          </button>

          <button
            onClick={copyRoomCode}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#35E0C8]/40 bg-[#0D1119] text-[#35E0C8] hover:border-[#35E0C8] hover:bg-[#35E0C8]/10 transition-all font-mono text-xs cursor-pointer shadow-[0_0_15px_rgba(53,224,200,0.15)]"
            title="Copiar código para compartir"
          >
            <span>CÓDIGO: {room.code || room.id.slice(0, 6).toUpperCase()}</span>
            {copiedCode ? <Check className="w-3.5 h-3.5 text-[#35E0C8]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 px-4 py-8 max-w-6xl mx-auto w-full flex flex-col justify-between gap-6 overflow-y-auto an-scroll">
        
        {/* Banner de Estado */}
        <div className="p-4 rounded-2xl border border-[#1E2836] bg-[#0D1119]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#35E0C8]/10 border border-[#35E0C8]/40 flex items-center justify-center text-[#35E0C8]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono text-[#9AA3B2] uppercase">Capacidad de Sala</div>
              <div className="text-base font-bold text-white font-mono">
                {playersList.length} / {room.maxPlayers || 2} Jugadores Conectados
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#35E0C8] animate-pulse" />
            <span className="text-[#9AA3B2]">
              {playersList.length < 2
                ? 'Esperando al segundo jugador (1v1)...'
                : allGuestsReady
                ? '¡Ambos jugadores listos para el duelo!'
                : 'Esperando que el jugador invitado confirme "Listo"'}
            </span>
          </div>

          {/* Selector de equipo (solo salas de más de 2 jugadores) */}
          {onChangeTeam && (room.maxPlayers || 2) > 2 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9AA3B2]">
                Tu equipo
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((team) => {
                  const selected = currentUser.teamId === team;
                  return (
                    <button
                      key={team}
                      onClick={() => onChangeTeam(team)}
                      className={`w-7 h-7 rounded-md border font-mono text-xs font-bold transition-all cursor-pointer ${
                        selected
                          ? 'border-[#35E0C8] bg-[#35E0C8]/20 text-[#35E0C8]'
                          : 'border-[#1E2836] bg-[#0D1119] text-[#9AA3B2] hover:border-[#35E0C8]/50'
                      }`}
                      title={`Unirse al equipo ${team}`}
                    >
                      {team}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sección Central: Duelo 1v1 (Jugador 1 vs Jugador 2) + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
          
          {/* Tarjetas de Jugadores (1v1 Arenas) */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-4">
            
            {/* Jugador 1 (Anfitrión) */}
            {(() => {
              const hostPlayer = playersList.find((p) => p.id === hostId) || playersList[0];
              const isMe = hostPlayer?.id === currentUser.id;

              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-5 rounded-2xl border transition-all ${
                    isMe
                      ? 'border-[#35E0C8]/50 bg-[#131A26]/90 shadow-[0_0_20px_rgba(53,224,200,0.15)]'
                      : 'border-[#1E2836] bg-[#0D1119]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8B54A] to-[#D49A24] text-[#07090F] flex items-center justify-center font-bold text-lg font-mono shadow-md relative">
                        {hostPlayer ? (hostPlayer.name || hostPlayer.email)[0].toUpperCase() : 'H'}
                        <Crown className="w-4 h-4 text-[#E8B54A] fill-[#E8B54A] absolute -top-2 -right-2 drop-shadow" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-bold text-white">
                            {hostPlayer ? hostPlayer.name || hostPlayer.email.split('@')[0] : 'Anfitrión'}
                          </span>
                          {isMe && (
                            <span className="font-mono text-[10px] bg-[#35E0C8]/15 text-[#35E0C8] px-2 py-0.5 rounded border border-[#35E0C8]/30">
                              TÚ
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-[#9AA3B2]">
                          Creador de la Sala · Nivel {hostPlayer?.level || 1}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8B54A]/10 border border-[#E8B54A]/40 text-[#E8B54A] font-mono text-xs font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ANFITRIÓN</span>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Divisor VS */}
            <div className="flex items-center justify-center gap-4 py-1">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1E2836] to-transparent" />
              <div className="w-10 h-10 rounded-full border border-[#FF6B35]/40 bg-[#0D1119] flex items-center justify-center text-[#FF6B35] font-bold font-mono shadow-[0_0_15px_rgba(255,107,53,0.2)]">
                <Swords className="w-4 h-4" />
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#1E2836] to-transparent" />
            </div>

            {/* Jugador 2 (Rival / Invitado) */}
            {(() => {
              const guestPlayer = opponent || (playersList.length > 1 ? playersList[1] : null);
              const isMe = guestPlayer?.id === currentUser.id;
              const guestReady = (guestPlayer as any)?.isReady;

              return guestPlayer ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-5 rounded-2xl border transition-all ${
                    guestReady
                      ? 'border-[#2BE08F]/50 bg-[#131A26]/90 shadow-[0_0_20px_rgba(43,224,143,0.15)]'
                      : 'border-[#1E2836] bg-[#0D1119]/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B79CFF] to-[#8A63D2] text-[#07090F] flex items-center justify-center font-bold text-lg font-mono shadow-md">
                        {(guestPlayer.name || guestPlayer.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-lg font-bold text-white">
                            {guestPlayer.name || guestPlayer.email.split('@')[0]}
                          </span>
                          {isMe && (
                            <span className="font-mono text-[10px] bg-[#35E0C8]/15 text-[#35E0C8] px-2 py-0.5 rounded border border-[#35E0C8]/30">
                              TÚ
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs text-[#9AA3B2]">
                          Rival en Duelo · Nivel {guestPlayer.level || 1}
                        </span>
                      </div>
                    </div>

                    {guestReady ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2BE08F]/15 border border-[#2BE08F]/40 text-[#2BE08F] font-mono text-xs font-bold animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>¡LISTO!</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8B54A]/10 border border-[#E8B54A]/40 text-[#E8B54A] font-mono text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>PREPARÁNDOSE...</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Ranura Vacía esperando rival */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 rounded-2xl border-2 border-dashed border-[#1E2836] bg-[#07090F]/50 flex flex-col items-center justify-center text-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl border border-[#1E2836] bg-[#0D1119] flex items-center justify-center text-[#5C6675]">
                    <Users className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base text-white">Esperando al Rival (1v1)</h4>
                    <p className="text-xs text-[#9AA3B2] mt-0.5 max-w-xs">
                      Pásale el código <span className="font-mono text-[#35E0C8] font-bold">{room.code || room.id.slice(0, 6)}</span> a tu compañero para comenzar.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <button
                      onClick={copyRoomCode}
                      className="px-4 py-1.5 rounded-lg border border-[#35E0C8]/40 bg-[#35E0C8]/10 text-[#35E0C8] hover:bg-[#35E0C8]/20 transition-all font-mono text-xs font-semibold cursor-pointer"
                    >
                      {copiedCode ? '¡Código Copiado!' : 'Copiar Código de Sala'}
                    </button>
                    <button
                      onClick={handleStartWithBotRival}
                      className="px-4 py-1.5 rounded-lg border border-[#B79CFF]/50 bg-[#B79CFF]/15 text-[#B79CFF] hover:bg-[#B79CFF]/25 transition-all font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(183,156,255,0.2)]"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Jugar 1v1 con Rival IA</span>
                    </button>
                  </div>
                </motion.div>
              );
            })()}

          </div>

          {/* Columna Derecha: Chat en Vivo */}
          <div className="lg:col-span-5 flex flex-col rounded-2xl border border-[#1E2836] bg-[#0D1119]/80 backdrop-blur-md overflow-hidden min-h-[360px]">
            <div className="p-3.5 border-b border-[#1E2836] bg-[#131A26]/60 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white">
                <MessageCircle className="w-4 h-4 text-[#35E0C8]" />
                <span>Chat de la Sala</span>
              </div>
              <span className="font-mono text-[10px] text-[#9AA3B2]">
                {chatMessages.length} mensajes
              </span>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[300px] an-scroll">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-[#5C6675] py-8">
                  <MessageCircle className="w-8 h-8 opacity-40 mb-1" />
                  <p className="text-xs font-mono">No hay mensajes aún.</p>
                  <p className="text-[11px] text-[#5C6675]">¡Saluda a tu rival antes de jugar!</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.userId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9AA3B2] mb-0.5">
                        <span>{msg.userName}</span>
                        {isMe && <span className="text-[#35E0C8]">(Tú)</span>}
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words ${
                          isMe
                            ? 'bg-[#35E0C8]/20 border border-[#35E0C8]/40 text-white rounded-tr-none'
                            : 'bg-[#131A26] border border-[#1E2836] text-[#E8E6DF] rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input de Chat */}
            <div className="p-3 border-t border-[#1E2836] bg-[#07090F]/60 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe un mensaje..."
                maxLength={180}
                className="flex-1 px-3 py-2 rounded-xl bg-[#0D1119] border border-[#1E2836] text-white text-xs placeholder-[#5C6675] focus:outline-none focus:border-[#35E0C8]"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  messageInput.trim()
                    ? 'bg-[#35E0C8] text-[#07090F] hover:bg-[#2BE08F]'
                    : 'bg-[#131A26] text-[#5C6675] cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Inferiores */}
        <div className="p-4 rounded-2xl border border-[#1E2836] bg-[#0D1119]/90 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#9AA3B2] font-mono">
            {isHost
              ? 'Eres el anfitrión de la sala. Puedes iniciar cuando ambos jugadores estén preparados.'
              : 'Confirma que estás preparado con el botón "Listo" para que el anfitrión comience.'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Si no eres el host: botón de "Preparado / Listo" */}
            {!isHost && (
              <button
                onClick={toggleReady}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isReady
                    ? 'bg-[#2BE08F]/20 border border-[#2BE08F] text-[#2BE08F]'
                    : 'bg-[#35E0C8] text-[#07090F] hover:bg-[#2BE08F] shadow-[0_0_20px_rgba(53,224,200,0.3)]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isReady ? 'CANCELAR LISTO' : '¡ESTOY LISTO!'}</span>
              </button>
            )}

            {/* Si eres el host y aún no hay segundo jugador, permitir iniciar con Rival IA */}
            {isHost && playersList.length < 2 && (
              <button
                onClick={handleStartWithBotRival}
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl border border-[#B79CFF] bg-[#B79CFF]/20 hover:bg-[#B79CFF]/30 text-[#E8E6DF] font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(183,156,255,0.25)]"
              >
                <Bot className="w-4 h-4 text-[#B79CFF]" />
                <span>Duelo vs IA (1v1)</span>
              </button>
            )}

            {/* Si eres el host: botón de Iniciar Partida */}
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`flex-1 sm:flex-none px-8 py-3 rounded-xl font-mono text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all ${
                  canStart
                    ? 'bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] shadow-[0_0_25px_rgba(53,224,200,0.4)] hover:shadow-[0_0_35px_rgba(53,224,200,0.6)] cursor-pointer'
                    : 'bg-[#131A26] border border-[#1E2836] text-[#5C6675] cursor-not-allowed'
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {playersList.length < 2
                    ? 'FALTA RIVAL (1V1)'
                    : allGuestsReady
                    ? '¡COMENZAR PARTIDA!'
                    : 'ESPERANDO QUE ESTÉ LISTO'}
                </span>
              </button>
            )}
          </div>
        </div>

      </main>

      {/* Modal QR para unirse a la sala */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        roomCode={room.code || room.id}
        title="Invitar a tu Compañero (1v1)"
        subtitle="Que tu amigo escanee este código con su celular para unirse directamente como Rival"
      />
    </div>
  );
}
