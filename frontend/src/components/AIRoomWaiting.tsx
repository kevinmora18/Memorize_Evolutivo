import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Play, Bot, MessageCircle, Send, Sparkles } from 'lucide-react';

interface AIRoomWaitingProps {
  onStartGame: () => void;
  onBack: () => void;
}

interface AIPlayer {
  id: number;
  name: string;
  avatar: string;
  color: string;
  isReady: boolean;
}

export function AIRoomWaiting({ onStartGame, onBack }: AIRoomWaitingProps) {
  const roomName = localStorage.getItem('aiFriendsRoomName') || 'Sala de IA';
  const gameMode = localStorage.getItem('aiFriendsMode') || 'pairs';
  
  const modeNames: Record<string, string> = {
    pairs: 'Parejas',
    connections: 'Conexiones',
    triads: 'Tríadas'
  };

  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([
    { id: 2, name: 'NeuroBot Alpha', avatar: '🤖', color: 'purple', isReady: false },
    { id: 3, name: 'SynapticAI', avatar: '🧠', color: 'green', isReady: false },
    { id: 4, name: 'MemoryCore', avatar: '⚡', color: 'orange', isReady: false },
  ]);

  const [chatMessages, setChatMessages] = useState<Array<{ player: string; message: string; avatar: string }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [allReady, setAllReady] = useState(false);

  // Simular que los bots se unen progresivamente
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    aiPlayers.forEach((player, index) => {
      const timer = setTimeout(() => {
        setAiPlayers(prev => 
          prev.map(p => p.id === player.id ? { ...p, isReady: true } : p)
        );
        
        // Mensaje de bienvenida del bot
        const welcomeMessages = [
          '¡Hola! Listo para jugar 🎮',
          'Sistema iniciado. Preparado para la partida 🚀',
          'Conexión establecida. ¡A jugar! ⚡',
        ];
        
        setChatMessages(prev => [...prev, {
          player: player.name,
          message: welcomeMessages[index],
          avatar: player.avatar
        }]);
      }, (index + 1) * 1500);

      timers.push(timer);
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  // Verificar si todos están listos
  useEffect(() => {
    if (aiPlayers.every(p => p.isReady)) {
      setTimeout(() => setAllReady(true), 1000);
    }
  }, [aiPlayers]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    setChatMessages(prev => [...prev, {
      player: 'Tú',
      message: messageInput,
      avatar: '👤'
    }]);
    
    setMessageInput('');

    // Respuesta aleatoria de un bot
    setTimeout(() => {
      const randomBot = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
      const responses = [
        '¡Buena suerte! 🍀',
        'Que gane el mejor 💪',
        'Esto será interesante 🤔',
        'Preparado para el desafío 🎯',
      ];
      
      setChatMessages(prev => [...prev, {
        player: randomBot.name,
        message: responses[Math.floor(Math.random() * responses.length)],
        avatar: randomBot.avatar
      }]);
    }, 1000);
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      cyan: 'border-cyan-400 bg-cyan-500/20',
      purple: 'border-purple-400 bg-purple-500/20',
      green: 'border-green-400 bg-green-500/20',
      orange: 'border-orange-400 bg-orange-500/20',
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 opacity-30"
          style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.4) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver</span>
        </button>

        <div className="text-center">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {roomName}
          </h2>
          <p className="text-gray-400 text-sm mt-1">Modo: {modeNames[gameMode]}</p>
        </div>

        <div className="w-32"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Human player */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border-2 border-cyan-400 rounded-xl"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">👤</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-cyan-300">Tú</h3>
                <p className="text-sm text-gray-400">Jugador Humano</p>
              </div>
              <div className="px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                <span className="text-green-400 font-bold">✓ Listo</span>
              </div>
            </div>
          </motion.div>

          {/* AI players */}
          {aiPlayers.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (index + 1) * 0.5 }}
              className={`p-6 rounded-xl border-2 ${getColorClass(player.color)}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-5xl">{player.avatar}</div>
                <div className="flex-1">
                  <h3 className={`text-xl font-bold text-${player.color}-300`}>{player.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Bot className="w-4 h-4" />
                    <span>Inteligencia Artificial</span>
                  </div>
                </div>
                {player.isReady ? (
                  <div className="px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
                    <span className="text-green-400 font-bold">✓ Listo</span>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <span className="text-gray-400">Conectando...</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chat section */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 flex flex-col h-[600px]">
          {/* Chat header */}
          <div className="p-4 border-b border-gray-700 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold">Chat de Sala</h3>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Esperando mensajes...</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <div className="text-2xl">{msg.avatar}</div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">{msg.player}</div>
                    <div className="bg-gray-700/50 rounded-lg p-2">
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-500 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className={`px-4 py-2 rounded-lg transition-all ${
                  messageInput.trim()
                    ? 'bg-cyan-500 hover:bg-cyan-600'
                    : 'bg-gray-700/50 cursor-not-allowed opacity-50'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="relative z-10 text-center mt-8">
        {allReady ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartGame}
            className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl flex items-center gap-3 mx-auto text-xl font-bold shadow-lg shadow-green-500/50"
          >
            <Play className="w-6 h-6" />
            <span>¡Comenzar Partida!</span>
            <Sparkles className="w-6 h-6" />
          </motion.button>
        ) : (
          <div className="px-12 py-4 bg-gray-800/50 rounded-2xl border border-gray-700 inline-flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-400 animate-pulse" />
            <span className="text-gray-400">Esperando que todos estén listos...</span>
          </div>
        )}
      </div>
    </div>
  );
}
