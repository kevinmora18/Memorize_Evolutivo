import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import type { Universe } from '../App';

interface UniversePortalProps {
  universe: {
    id: Universe;
    name: string;
    color: string;
    gradient: string;
    icon: string;
  };
  index: number;
  isUnlocked: boolean;
  onSelect: (universe: Universe) => void;
}

export function UniversePortal({ universe, index, isUnlocked, onSelect }: UniversePortalProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{
        delay: index * 0.15,
        type: 'spring',
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="relative group cursor-pointer"
      onClick={() => onSelect(universe.id)}
    >
      {/* Glow Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${universe.gradient} rounded-3xl blur-xl opacity-0 group-hover:opacity-60`}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />

      {/* Portal Card */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-1 overflow-hidden">
        {/* Animated Border */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${universe.gradient} opacity-50`}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            background: `conic-gradient(from 0deg, ${universe.color}, transparent, ${universe.color})`,
          }}
        />

        {/* Content */}
        <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 h-64 flex flex-col items-center justify-center">
          {/* Icon Circle */}
          <motion.div
            className={`w-24 h-24 rounded-full bg-gradient-to-br ${universe.gradient} flex items-center justify-center mb-4 relative`}
            animate={{
              boxShadow: [
                `0 0 20px ${universe.color}40`,
                `0 0 40px ${universe.color}80`,
                `0 0 20px ${universe.color}40`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <span className="text-5xl">{universe.icon}</span>
            
            {/* Lock/Check Badge */}
            {isUnlocked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900"
              >
                <Check className="w-5 h-5 text-white" />
              </motion.div>
            )}
          </motion.div>

          {/* Name */}
          <h3 className="text-2xl mb-2 text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400">
            {universe.name}
          </h3>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {isUnlocked ? (
              <span className="text-green-400">✦ Poder Desbloqueado</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Bloqueado</span>
              </>
            )}
          </div>

          {/* Particles */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: universe.color,
                  left: `${10 + i * 12}%`,
                  bottom: 0,
                }}
                animate={{
                  y: [-300, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
