import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Target, Brain, Network } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (roomName: string, gameMode: 'pairs' | 'connections' | 'triads') => void;
}

export function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [selectedMode, setSelectedMode] = useState<'pairs' | 'connections' | 'triads'>('pairs');

  const gameModes = [
    {
      id: 'pairs' as const,
      name: 'Parejas',
      icon: Users,
      description: 'Encuentra pares de cartas iguales',
      color: 'from-blue-500 to-cyan-500',
      difficulty: 'Fácil',
    },
    {
      id: 'connections' as const,
      name: 'Conexiones',
      icon: Network,
      description: 'Encuentra parejas de elementos relacionados',
      color: 'from-purple-500 to-pink-500',
      difficulty: 'Medio',
    },
    {
      id: 'triads' as const,
      name: 'Tríadas',
      icon: Brain,
      description: 'Encuentra tríos de elementos conectados',
      color: 'from-orange-500 to-red-500',
      difficulty: 'Difícil',
    },
  ];

  const handleCreate = () => {
    if (roomName.trim()) {
      onCreate(roomName.trim(), selectedMode);
      setRoomName('');
      setSelectedMode('pairs');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-purple-500/50 max-w-2xl w-full p-8 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Effects */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <Users className="w-16 h-16 text-purple-400" />
                </motion.div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Crear Sala de Amigos IA
                </h2>
                <p className="text-gray-400">Juega por turnos con 3 amigos IA</p>
              </div>

              {/* Room Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nombre de la Sala
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ej: Sala de Kevin"
                  maxLength={30}
                  className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">{roomName.length}/30 caracteres</p>
              </div>

              {/* Game Mode Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Modo de Juego
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gameModes.map((mode) => (
                    <motion.div
                      key={mode.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedMode === mode.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center`}>
                          <mode.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-white">{mode.name}</h3>
                        <p className="text-xs text-gray-400">{mode.description}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          mode.difficulty === 'Fácil' ? 'bg-green-500/20 text-green-400' :
                          mode.difficulty === 'Medio' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {mode.difficulty}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">ℹ️ Información</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Jugarás con 3 amigos IA inteligentes</li>
                  <li>• Cada jugador juega por turnos</li>
                  <li>• Gana quien encuentre más parejas/conexiones</li>
                  <li>• El modo seleccionado define el tipo de cartas</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!roomName.trim()}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                    roomName.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
                      : 'bg-gray-700/50 cursor-not-allowed opacity-50'
                  }`}
                >
                  Crear Sala
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
