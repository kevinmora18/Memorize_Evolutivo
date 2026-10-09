import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Plus, Play, Crown, Bot, Copy, Check, Send, MessageCircle } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  code: string;
  host: string;
  players: string[];
  maxPlayers: number;
  gameMode: 'classic' | 'connections' | 'triads';
  cardCount: number; // Cantidad de pares/grupos
}

interface ChatMessage {
  id: string;
  playerName: string;
  message: string;
  timestamp: number;
}

interface AIRoomLobbyProps {
  onBackToLobby: () => void;
  onStartGame: () => void;
}

export function AIRoomLobby({ onBackToLobby, onStartGame }: AIRoomLobbyProps) {
  const [view, setView] = useState<'list' | 'create' | 'room'>('list');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [selectedGameMode, setSelectedGameMode] = useState<'classic' | 'connections' | 'triads'>('classic');
  const [selectedCardCount, setSelectedCardCount] = useState(4); // Cantidad de pares/grupos
  const [playerName, setPlayerName] = useState('Jugador');
  const [copiedCode, setCopiedCode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug
  useEffect(() => {
    console.log('AIRoomLobby montado');
  }, []);

  const gameModes = [
    { id: 'classic' as const, name: 'Clásico', desc: 'Encuentra pares iguales', icon: '🎮', color: 'from-purple-500 to-pink-500' },
    { id: 'connections' as const, name: 'Conexiones', desc: 'Parejas relacionadas', icon: '🧠', color: 'from-blue-500 to-cyan-500' },
    { id: 'triads' as const, name: 'Tríadas', desc: 'Tríos conectados', icon: '⚡', color: 'from-orange-500 to-red-500' },
  ];

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;

    const botNames = ['NeuroBot Alpha', 'SynapticAI', 'MemoryCore'];
    const newRoom: Room = {
      id: Date.now().toString(),
      name: roomName,
      code: generateRoomCode(),
      host: playerName,
      players: [playerName, ...botNames],
      maxPlayers: 4,
      gameMode: selectedGameMode,
      cardCount: selectedCardCount,
    };

    setRooms([...rooms, newRoom]);
    setCurrentRoom(newRoom);
    setView('room');
    
    // Guardar el modo de juego, nombre de sala y cantidad de cartas para usarlo en AIFriendsGame
    localStorage.setItem('aiFriendsMode', selectedGameMode);
    localStorage.setItem('aiFriendsRoomName', roomName);
    localStorage.setItem('aiFriendsCardCount', selectedCardCount.toString());
    setRoomName('');
  };

  const handleJoinRoom = (room: Room) => {
    if (room.players.length >= room.maxPlayers) return;
    
    const updatedRoom = {
      ...room,
      players: [...room.players, playerName],
    };

    setRooms(rooms.map(r => r.id === room.id ? updatedRoom : r));
    setCurrentRoom(updatedRoom);
    setView('room');
  };

  const handleLeaveRoom = () => {
    if (!currentRoom) return;

    const updatedRoom = {
      ...currentRoom,
      players: currentRoom.players.filter(p => p !== playerName),
    };

    if (updatedRoom.players.length === 0) {
      setRooms(rooms.filter(r => r.id !== currentRoom.id));
    } else {
      setRooms(rooms.map(r => r.id === currentRoom.id ? updatedRoom : r));
    }

    setCurrentRoom(null);
    setView('list');
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    onStartGame();
  };

  const copyRoomCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const isHost = currentRoom?.host === playerName;

  // Auto-scroll al final del chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentRoom) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerName,
      message: messageInput.trim(),
      timestamp: Date.now(),
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

  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #050214 0%, #0a0520 40%, #07031a 100%)' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.5), transparent)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.5), transparent)', filter: 'blur(40px)' }} />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <button
          onClick={view === 'room' ? handleLeaveRoom : onBackToLobby}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{view === 'room' ? 'Salir de la Sala' : 'Volver al Lobby'}</span>
        </button>

        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-green-400" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
            SALAS MULTIJUGADOR
          </h1>
        </div>

        <div className="w-48"></div>
      </div>

      <AnimatePresence mode="wait">
        {/* Lista de Salas */}
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto relative z-10"
          >
            {/* Nombre del jugador */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <label className="block text-sm text-gray-400 mb-2">Tu nombre:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="Ingresa tu nombre"
              />
            </div>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setView('create')}
                className="flex-1 py-4 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
              >
                <Plus className="w-5 h-5" />
                Crear Sala
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-300">Salas Disponibles</h2>
              {rooms.length === 0 ? (
                <div className="p-8 bg-gray-800/30 rounded-xl border border-gray-700 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-400">No hay salas disponibles</p>
                  <p className="text-sm text-gray-500 mt-2">Crea una nueva sala para empezar</p>
                </div>
              ) : (
                rooms.map(room => (
                  <motion.div
                    key={room.id}
                    className="p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-green-500/50 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold">{room.name}</h3>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                            {room.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-yellow-400" />
                            {room.host}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.players.length}/{room.maxPlayers}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room)}
                        disabled={room.players.length >= room.maxPlayers}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${
                          room.players.length >= room.maxPlayers
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        }`}
                      >
                        {room.players.length >= room.maxPlayers ? 'Llena' : 'Unirse'}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Crear Sala */}
        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto relative z-10"
          >
            <div className="p-8 bg-gray-800/50 rounded-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Crear Nueva Sala</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre de la sala:</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="Mi Sala Épica"
                  />
                </div>

                {/* Selección de Modo de Juego */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Modo de Juego:</label>
                  <div className="grid grid-cols-3 gap-4">
                    {gameModes.map((mode) => (
                      <motion.div
                        key={mode.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedGameMode(mode.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedGameMode === mode.id
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-2">{mode.icon}</div>
                          <h3 className="font-bold text-white mb-1">{mode.name}</h3>
                          <p className="text-xs text-gray-400">{mode.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Selección de Cantidad de Cartas */}
                <div>
                  <label className="block text-sm text-gray-400 mb-3">
                    Cantidad de {selectedGameMode === 'triads' ? 'Tríadas' : 'Pares'}: {selectedCardCount}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="3"
                      max={selectedGameMode === 'triads' ? '6' : '8'}
                      value={selectedCardCount}
                      onChange={(e) => setSelectedCardCount(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="text-center min-w-[80px] px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg">
                      <span className="text-2xl font-bold text-green-400">{selectedCardCount}</span>
                      <p className="text-xs text-gray-400">
                        {selectedGameMode === 'triads' ? selectedCardCount * 3 : selectedCardCount * 2} cartas
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateRoom}
                    disabled={!roomName.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Crear Sala
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sala Actual */}
        {view === 'room' && currentRoom && (
          <motion.div
            key="room"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto relative z-10 grid grid-cols-3 gap-6"
          >
            {/* Columna Izquierda - Info y Jugadores */}
            <div className="col-span-2 space-y-6">
              {/* Info de la sala */}
              <div className="p-6 bg-gray-800/50 rounded-xl border border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{currentRoom.name}</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full">
                        <span className="text-sm text-gray-400">Código:</span>
                        <span className="text-lg font-mono font-bold text-green-400">{currentRoom.code}</span>
                        <button
                          onClick={copyRoomCode}
                          className="ml-1 p-1 hover:bg-green-500/30 rounded transition-colors"
                        >
                          {copiedCode ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-green-400" />
                          )}
                        </button>
                      </div>
                      <div className="px-3 py-1 bg-purple-500/20 rounded-full">
                        <span className="text-sm text-purple-300">
                          {gameModes.find(m => m.id === currentRoom.gameMode)?.icon} {gameModes.find(m => m.id === currentRoom.gameMode)?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isHost && (
                    <button
                      onClick={handleStartGame}
                      disabled={currentRoom.players.length < 2}
                      className="px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 rounded-xl font-bold text-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-5 h-5" />
                      Iniciar Juego
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de jugadores */}
              <div>
                <h3 className="text-lg font-bold mb-3 text-gray-300">Jugadores ({currentRoom.players.length}/{currentRoom.maxPlayers})</h3>
                <div className="grid grid-cols-2 gap-4">
                  {currentRoom.players.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 ${
                        player === currentRoom.host
                          ? 'bg-yellow-500/10 border-yellow-500/50'
                          : 'bg-gray-800/50 border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-2xl">
                          👤
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{player}</h3>
                            {player === currentRoom.host && (
                              <Crown className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            {player === currentRoom.host ? 'Anfitrión' : 'Jugador'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Slots vacíos */}
                  {Array.from({ length: currentRoom.maxPlayers - currentRoom.players.length }).map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="p-4 rounded-xl border-2 border-dashed border-gray-700 bg-gray-800/20 flex items-center justify-center"
                    >
                      <div className="text-center text-gray-600">
                        <Bot className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Esperando jugador...</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!isHost && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center">
                  <p className="text-blue-300">Esperando a que el anfitrión inicie el juego...</p>
                </div>
              )}
            </div>

            {/* Columna Derecha - Chat */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-700 overflow-hidden flex flex-col"
              style={{ height: '600px' }}
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gradient-to-r from-green-900/30 to-cyan-900/30">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
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
                    const isOwnMessage = msg.playerName === playerName;
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center text-xs">
                              {msg.playerName[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-400">
                              {msg.playerName}
                              {isOwnMessage && <span className="ml-1 text-green-400">(Tú)</span>}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={`px-4 py-2 rounded-2xl ${
                            isOwnMessage 
                              ? 'bg-gradient-to-r from-green-600 to-cyan-600 text-white' 
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
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:border-green-500 text-sm placeholder-gray-500"
                    maxLength={200}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                      messageInput.trim()
                        ? 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600'
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
