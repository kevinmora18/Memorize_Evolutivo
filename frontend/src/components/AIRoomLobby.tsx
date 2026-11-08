import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Plus, Play, Crown, Bot, Copy, Check,
  Send, MessageCircle, Swords, Lock, Shield, Sparkles, RefreshCw,
  Hash, KeyRound
} from 'lucide-react';
import type { Player, Room } from '../App';
import socket from '../lib/socket';
import { apiFetch } from '../lib/api';
import { useEquippedRoomTheme } from '../lib/roomTheme';

interface AIRoomLobbyProps {
  onBackToLobby: () => void;
  onStartGame: () => void;
  currentUser?: Player | null;
  onJoinRealRoom?: (room: any) => void;
}

interface AIRoom {
  id: string;
  name: string;
  code: string;
  host: string;
  players: string[];
  maxPlayers: number;
  gameMode: 'classic' | 'connections' | 'triads';
  cardCount: number;
}

export function AIRoomLobby({ onBackToLobby, onStartGame, currentUser, onJoinRealRoom }: AIRoomLobbyProps) {
  const roomTheme = useEquippedRoomTheme();

  // Pestaña principal: 'online' (Multijugador Real 1v1) o 'bots' (Práctica con IA)
  const [tab, setTab] = useState<'online' | 'bots'>('online');

  // Estado para Multijugador Real
  const [realRooms, setRealRooms] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createMode, setCreateMode] = useState<'classic' | 'triads'>('classic');
  const [createMaxPlayers, setCreateMaxPlayers] = useState<number>(2);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Estado para Bots IA
  const [aiRooms, setAiRooms] = useState<AIRoom[]>([]);
  const [aiRoomName, setAiRoomName] = useState('');
  const [aiSelectedMode, setAiSelectedMode] = useState<'classic' | 'connections' | 'triads'>('classic');
  const [aiCardCount, setAiCardCount] = useState(4);

  // Cargar salas reales desde el backend
  const fetchRealRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const data = await apiFetch<any[]>('/api/rooms');
      setRealRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando salas:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRealRooms();

    const handleRoomsUpdate = (data: any[]) => {
      if (Array.isArray(data)) {
        setRealRooms(data);
      }
    };

    socket.on('rooms:update', handleRoomsUpdate);

    return () => {
      socket.off('rooms:update', handleRoomsUpdate);
    };
  }, []);

  // Crear sala real en el servidor
  const handleCreateRealRoom = async () => {
    if (!createName.trim() || !currentUser) return;

    try {
      const createdRoom = await apiFetch<any>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: createName.trim(),
          maxPlayers: createMaxPlayers,
          mode: createMode,
          difficulty: 'easy',
          isPrivate: false,
        }),
      });

      setShowCreateModal(false);
      setCreateName('');
      if (onJoinRealRoom) {
        onJoinRealRoom(createdRoom);
      }
    } catch (err: any) {
      console.error('Error creando sala:', err);
      setJoinError(err?.message || 'Error al crear la sala');
    }
  };

  // Unirse a una sala real por ID o por Código
  const handleJoinRealRoom = async (roomIdOrCode: string) => {
    if (!currentUser || !roomIdOrCode.trim()) return;
    setJoinError(null);

    try {
      const cleanTarget = roomIdOrCode.trim();
      const room = await apiFetch<any>(`/api/rooms/${cleanTarget}/join`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (onJoinRealRoom) {
        onJoinRealRoom(room);
      }
    } catch (err: any) {
      console.error('Error uniéndose a la sala:', err);
      setJoinError(err?.message || 'No se pudo unir a la sala');
    }
  };

  // Iniciar partida con Bots IA
  const handleStartAIGame = () => {
    localStorage.setItem('aiFriendsMode', aiSelectedMode);
    localStorage.setItem('aiFriendsRoomName', aiRoomName || 'Sala de Entrenamiento');
    localStorage.setItem('aiFriendsCardCount', aiCardCount.toString());
    onStartGame();
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
      {/* Overlay táctico adaptado al entorno de sala equipado */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 15%, ${roomTheme.accent}18 0%, rgba(7, 9, 15, 0.88) 55%, #05070A 100%)`,
        }}
      />
      {/* Resplandor superior de estación táctica */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[130px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
      />
      <div className="absolute inset-0 pointer-events-none an-grain-overlay opacity-30" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* Header */}
      <header className="relative z-20 px-4 sm:px-6 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 border-b border-[#1E2836]/70 backdrop-blur-md bg-[#07090F]/80">
        <button
          onClick={onBackToLobby}
          className="an-focusable self-start md:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119]/80 text-[#9AA3B2] hover:text-[#E8E6DF] hover:border-[#35E0C8]/50 transition-all font-mono text-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-widest">Lobby Principal</span>
        </button>

        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#35E0C8] flex items-center justify-center gap-1.5">
            <span>CENTRO DE ENLACE MULTIJUGADOR</span>
            <span>•</span>
            <span style={{ color: roomTheme.accent }}>{roomTheme.name}</span>
          </div>
          <h1 className="font-serif text-xl sm:text-2xl text-white font-bold tracking-tight">
            Salas y Duelos en Línea
          </h1>
        </div>

        {/* Pestañas de Modo (Online 1v1 vs Bots IA) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-[#1E2836] bg-[#0D1119] self-center md:self-auto">
          <button
            onClick={() => setTab('online')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              tab === 'online'
                ? 'bg-[#35E0C8] text-[#07090F] shadow-[0_0_15px_rgba(53,224,200,0.3)]'
                : 'text-[#9AA3B2] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>En Línea (1v1)</span>
          </button>

          <button
            onClick={() => setTab('bots')}
            className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              tab === 'bots'
                ? 'bg-[#B79CFF] text-[#07090F] shadow-[0_0_15px_rgba(183,156,255,0.3)]'
                : 'text-[#9AA3B2] hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Entrenar con IA</span>
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 px-4 py-8 max-w-6xl mx-auto w-full flex flex-col justify-between gap-6 overflow-y-auto an-scroll">
        
        {/* ==================================================================== */}
        {/* PESTAÑA 1: MULTIJUGADOR EN LÍNEA (1V1 Y SALAS REALES)               */}
        {/* ==================================================================== */}
        {tab === 'online' ? (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Barra de Acciones: Crear Sala y Unirse por Código */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Botón Crear Sala */}
              <div className="md:col-span-5">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] font-mono text-sm uppercase font-bold tracking-wider flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(53,224,200,0.35)] hover:shadow-[0_0_35px_rgba(53,224,200,0.5)] hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>Crear Sala de Duelo (1v1)</span>
                </button>
              </div>

              {/* Input Unirse por Código */}
              <div className="md:col-span-7 flex gap-2">
                <div className="relative flex-1">
                  <Hash className="w-4 h-4 text-[#5C6675] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Código de 6 caracteres (ej: K79W2X)..."
                    maxLength={10}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-[#0D1119] border border-[#1E2836] font-mono text-xs uppercase text-white placeholder-[#5C6675] focus:outline-none focus:border-[#35E0C8] shadow-inner"
                  />
                </div>
                <button
                  onClick={() => handleJoinRealRoom(joinCodeInput)}
                  disabled={!joinCodeInput.trim()}
                  className={`px-6 py-3.5 rounded-xl font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center gap-2 ${
                    joinCodeInput.trim()
                      ? 'bg-[#131A26] border border-[#35E0C8] text-[#35E0C8] hover:bg-[#35E0C8]/10 cursor-pointer shadow-[0_0_15px_rgba(53,224,200,0.2)]'
                      : 'bg-[#0D1119] border border-[#1E2836] text-[#5C6675] cursor-not-allowed'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Unirse</span>
                </button>
              </div>
            </div>

            {/* Error si lo hay */}
            {joinError && (
              <div className="p-3 rounded-xl bg-[#FF4D5E]/15 border border-[#FF4D5E]/40 text-[#FF4D5E] font-mono text-xs text-center">
                {joinError}
              </div>
            )}

            {/* Lista de Salas Activas */}
            <div className="flex-1 flex flex-col rounded-2xl border border-[#1E2836] bg-[#0D1119]/80 backdrop-blur-md overflow-hidden">
              <div className="p-4 border-b border-[#1E2836] bg-[#131A26]/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-white">
                  <Users className="w-4 h-4 text-[#35E0C8]" />
                  <span>Salas Públicas en Vivo</span>
                </div>
                <button
                  onClick={fetchRealRooms}
                  disabled={isLoadingRooms}
                  className="flex items-center gap-1.5 font-mono text-xs text-[#9AA3B2] hover:text-[#35E0C8] transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin text-[#35E0C8]' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 max-h-[460px] an-scroll">
                {realRooms.length === 0 ? (
                  <div className="text-center py-16 text-[#5C6675]">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <h3 className="font-serif text-lg text-[#9AA3B2]">No hay salas abiertas en este momento</h3>
                    <p className="font-mono text-xs text-[#5C6675] mt-1">
                      ¡Sé el primero en crear una sala para desafiar a otro jugador!
                    </p>
                  </div>
                ) : (
                  realRooms.map((r) => {
                    const isFull = (r.currentPlayers || r.players?.length || 0) >= (r.maxPlayers || 2);
                    const isPlaying = r.status === 'playing';

                    return (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl border border-[#1E2836] bg-[#131A26]/60 hover:border-[#2C3A4E] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-serif text-base font-bold text-white">{r.name}</span>
                            <span className="font-mono text-[10px] text-[#35E0C8] bg-[#35E0C8]/10 px-2 py-0.5 rounded border border-[#35E0C8]/30">
                              CÓDIGO: {r.code || r.id.slice(0, 6)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-xs text-[#9AA3B2]">
                            <span>Host: {r.hostName || 'Operador'}</span>
                            <span>·</span>
                            <span>Modo: {r.mode === 'triads' ? 'Tríadas' : 'Pares'}</span>
                            <span>·</span>
                            <span className="text-[#E8B54A]">
                              {r.currentPlayers || r.players?.length || 1} / {r.maxPlayers || 2} Jugadores
                            </span>
                          </div>
                        </div>

                        <div>
                          {isPlaying ? (
                            <span className="px-4 py-2 rounded-xl bg-[#E8B54A]/10 border border-[#E8B54A]/30 font-mono text-xs text-[#E8B54A] font-semibold">
                              EN PARTIDA
                            </span>
                          ) : isFull ? (
                            <span className="px-4 py-2 rounded-xl bg-[#1E2836] font-mono text-xs text-[#5C6675]">
                              SALA LLENA
                            </span>
                          ) : (
                            <button
                              onClick={() => handleJoinRealRoom(r.id)}
                              className="px-5 py-2.5 rounded-xl bg-[#35E0C8] text-[#07090F] hover:bg-[#2BE08F] font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(53,224,200,0.25)] cursor-pointer"
                            >
                              Unirse al Duelo
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==================================================================== */
          /* PESTAÑA 2: ENTRENAR CON BOTS IA                                     */
          /* ==================================================================== */
          <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full gap-6">
            <div className="p-8 rounded-3xl border border-[#B79CFF]/40 bg-[#0D1119]/90 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#B79CFF]/15 border border-[#B79CFF]/40 flex items-center justify-center text-[#B79CFF]">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-bold text-white">
                    Modo Práctica con Bots IA
                  </h2>
                  <p className="font-mono text-xs text-[#9AA3B2] mt-0.5">
                    Entrena tu memoria jugando por turnos contra 3 inteligencias sintéticas.
                  </p>
                </div>
              </div>

              {/* Configuración de la partida */}
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[#9AA3B2] uppercase mb-1.5">
                    Nombre de la Sala
                  </label>
                  <input
                    type="text"
                    value={aiRoomName}
                    onChange={(e) => setAiRoomName(e.target.value)}
                    placeholder="Ej: Bóveda de Simulación..."
                    className="w-full px-4 py-3 rounded-xl bg-[#07090F] border border-[#1E2836] text-white text-sm focus:outline-none focus:border-[#B79CFF]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#9AA3B2] uppercase mb-1.5">
                    Modo de Desafío
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'classic', label: 'Pares' },
                      { id: 'connections', label: 'Conexiones' },
                      { id: 'triads', label: 'Tríadas' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setAiSelectedMode(m.id as any)}
                        className={`py-2.5 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                          aiSelectedMode === m.id
                            ? 'border-[#B79CFF] bg-[#B79CFF]/20 text-white'
                            : 'border-[#1E2836] bg-[#07090F] text-[#9AA3B2]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#9AA3B2] uppercase mb-1.5">
                    Cantidad de Pares: {aiCardCount} ({aiCardCount * 2} cartas)
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={8}
                    value={aiCardCount}
                    onChange={(e) => setAiCardCount(Number(e.target.value))}
                    className="w-full accent-[#B79CFF]"
                  />
                </div>
              </div>

              <button
                onClick={handleStartAIGame}
                className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-[#B79CFF] to-[#8A63D2] text-[#07090F] font-mono text-xs uppercase font-bold tracking-widest hover:brightness-110 shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Simulación con Bots</span>
              </button>
            </div>
          </div>
        )}

      </main>

      {/* MODAL PARA CREAR SALA REAL (1V1) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0D1119] border-2 border-[#35E0C8] rounded-3xl p-6 sm:p-8 max-w-md w-full relative overflow-hidden shadow-2xl"
            >
              <h2 className="font-serif text-2xl font-bold text-white mb-1">
                Crear Sala de Duelo
              </h2>
              <p className="font-mono text-xs text-[#9AA3B2] mb-6">
                Configura tu sala para jugar en tiempo real con otro operador (1v1).
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block font-mono text-xs text-[#9AA3B2] uppercase mb-1.5">
                    Nombre de la Sala
                  </label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Ej: Duelo de Maestros..."
                    maxLength={30}
                    className="w-full px-4 py-3 rounded-xl bg-[#07090F] border border-[#1E2836] text-white text-sm focus:outline-none focus:border-[#35E0C8]"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#9AA3B2] uppercase mb-1.5">
                    Modo de Juego
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCreateMode('classic')}
                      className={`py-2.5 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                        createMode === 'classic'
                          ? 'border-[#35E0C8] bg-[#35E0C8]/20 text-white'
                          : 'border-[#1E2836] bg-[#07090F] text-[#9AA3B2]'
                      }`}
                    >
                      Pares Clásico
                    </button>
                    <button
                      onClick={() => setCreateMode('triads')}
                      className={`py-2.5 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                        createMode === 'triads'
                          ? 'border-[#35E0C8] bg-[#35E0C8]/20 text-white'
                          : 'border-[#1E2836] bg-[#07090F] text-[#9AA3B2]'
                      }`}
                    >
                      Tríadas
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-[#9AA3B2] uppercase mb-1.5">
                    Capacidad de Jugadores
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCreateMaxPlayers(2)}
                      className={`py-2.5 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                        createMaxPlayers === 2
                          ? 'border-[#35E0C8] bg-[#35E0C8]/20 text-[#35E0C8] font-bold'
                          : 'border-[#1E2836] bg-[#07090F] text-[#9AA3B2]'
                      }`}
                    >
                      2 Jugadores (1v1)
                    </button>
                    <button
                      onClick={() => setCreateMaxPlayers(4)}
                      className={`py-2.5 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                        createMaxPlayers === 4
                          ? 'border-[#35E0C8] bg-[#35E0C8]/20 text-[#35E0C8] font-bold'
                          : 'border-[#1E2836] bg-[#07090F] text-[#9AA3B2]'
                      }`}
                    >
                      Hasta 4 Jugadores
                    </button>
                  </div>
                </div>
                {/* Entorno vinculado para la sala */}
                <div
                  className="p-3 rounded-xl border flex items-center justify-between"
                  style={{
                    borderColor: `${roomTheme.accent}40`,
                    background: `${roomTheme.accent}10`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{roomTheme.icon}</span>
                    <div>
                      <div className="font-mono text-[9px] text-[#9AA3B2] uppercase tracking-wider">Entorno Vinculado a tu Perfil</div>
                      <div className="font-serif text-xs font-bold text-white">{roomTheme.name}</div>
                    </div>
                  </div>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded border"
                    style={{ borderColor: `${roomTheme.accent}60`, color: roomTheme.accent }}
                  >
                    {roomTheme.badge}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#1E2836] text-[#9AA3B2] font-mono text-xs uppercase hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRealRoom}
                  disabled={!createName.trim()}
                  className={`flex-1 py-3 rounded-xl font-mono text-xs uppercase font-bold tracking-wider transition-all ${
                    createName.trim()
                      ? 'bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(53,224,200,0.3)]'
                      : 'bg-[#131A26] border border-[#1E2836] text-[#5C6675] cursor-not-allowed'
                  }`}
                >
                  Crear y Entrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
