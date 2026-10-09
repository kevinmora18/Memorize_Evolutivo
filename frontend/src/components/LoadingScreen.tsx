import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress === 100) {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: "url('/fondosin.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay for better visibility */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Starfield Background */}
      <div className="absolute inset-0">
        {[...Array(150)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.9, 0.1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Brain Container */}
      <div className="relative mb-8 z-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{
              textShadow: [
                '0 0 30px rgba(139,92,246,0.8)',
                '0 0 50px rgba(168,85,247,0.8)',
                '0 0 30px rgba(139,92,246,0.8)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <h1 className="text-7xl mb-3 font-black tracking-[0.3em] text-white" style={{ 
              textShadow: '0 0 40px rgba(139,92,246,0.9), 0 0 80px rgba(168,85,247,0.6)'
            }}>
              MEMORIZE
            </h1>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-purple-400 to-purple-400"></div>
              <h2 className="text-2xl font-light tracking-[0.4em] text-purple-200">
                EVOLUTIVO
              </h2>
              <div className="h-px w-24 bg-gradient-to-l from-transparent via-purple-400 to-purple-400"></div>
            </div>
          </motion.div>
        </motion.div>

        <svg viewBox="0 0 240 180" className="w-[500px] h-[400px] drop-shadow-[0_0_60px_rgba(139,92,246,1)]">
          <defs>
            {/* Liquid Fill Gradient */}
            <linearGradient id="liquidGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset={`${100 - progress}%`} stopColor="transparent" />
              <stop offset={`${100 - progress}%`} stopColor="#6b21a8" stopOpacity="0.4" />
              <stop offset={`${100 - progress + 5}%`} stopColor="#7c3aed" stopOpacity="0.7" />
              <stop offset={`${100 - progress + 10}%`} stopColor="#8b5cf6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
            </linearGradient>

            {/* Glow Filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Strong Glow Filter */}
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            {/* Brain Clip Path */}
            <clipPath id="brainClip">
              <path d="M60,80 C60,65 65,52 75,42 C85,32 98,25 115,22 C125,20 135,20 145,23 C155,26 163,32 169,40 C175,48 179,58 180,70 C181,82 179,94 175,105 C171,116 165,125 157,132 C149,139 139,143 128,145 L125,148 C120,152 115,155 110,157 L105,160 C100,162 95,163 90,163 C85,163 80,162 75,160 L70,157 C65,154 61,150 58,145 L55,140 C52,135 50,130 49,125 L48,120 C47,110 48,100 51,90 C54,80 58,72 60,80 Z" />
            </clipPath>
          </defs>

          <g transform="translate(20, 10)">
            {/* Main Brain Outline */}
            <path
              d="M60,80 C60,65 65,52 75,42 C85,32 98,25 115,22 C125,20 135,20 145,23 C155,26 163,32 169,40 C175,48 179,58 180,70 C181,82 179,94 175,105 C171,116 165,125 157,132 C149,139 139,143 128,145 L125,148 C120,152 115,155 110,157 L105,160 C100,162 95,163 90,163 C85,163 80,162 75,160 L70,157 C65,154 61,150 58,145 L55,140 C52,135 50,130 49,125 L48,120 C47,110 48,100 51,90 C54,80 58,72 60,80 Z"
              fill="rgba(10, 5, 25, 0.98)"
              stroke="#a855f7"
              strokeWidth="2.5"
              filter="url(#strongGlow)"
            />

            {/* Liquid Fill */}
            <path
              d="M60,80 C60,65 65,52 75,42 C85,32 98,25 115,22 C125,20 135,20 145,23 C155,26 163,32 169,40 C175,48 179,58 180,70 C181,82 179,94 175,105 C171,116 165,125 157,132 C149,139 139,143 128,145 L125,148 C120,152 115,155 110,157 L105,160 C100,162 95,163 90,163 C85,163 80,162 75,160 L70,157 C65,154 61,150 58,145 L55,140 C52,135 50,130 49,125 L48,120 C47,110 48,100 51,90 C54,80 58,72 60,80 Z"
              fill="url(#liquidGradient)"
            />

            {/* Frontal Lobe Gyri */}
            <path d="M85,35 Q88,38 90,35 Q92,32 95,35" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M95,38 Q98,41 100,38 Q102,35 105,38" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M105,41 Q108,44 110,41 Q112,38 115,41" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M115,44 Q118,47 120,44 Q122,41 125,44" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M125,47 Q128,50 130,47 Q132,44 135,47" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M135,50 Q138,53 140,50 Q142,47 145,50" stroke="#d8b4fe" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            
            {/* Middle Gyri */}
            <path d="M75,50 Q78,53 80,50 Q82,47 85,50" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M85,53 Q88,56 90,53 Q92,50 95,53" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M95,56 Q98,59 100,56 Q102,53 105,56" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M105,59 Q108,62 110,59 Q112,56 115,59" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M115,62 Q118,65 120,62 Q122,59 125,62" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M125,65 Q128,68 130,65 Q132,62 135,65" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M135,68 Q138,71 140,68 Q142,65 145,68" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M145,71 Q148,74 150,71 Q152,68 155,71" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M155,74 Q158,77 160,74 Q162,71 165,74" stroke="#c4b5fd" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            
            {/* Parietal Lobe Gyri */}
            <path d="M70,70 Q73,73 75,70 Q77,67 80,70" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M80,73 Q83,76 85,73 Q87,70 90,73" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M90,76 Q93,79 95,76 Q97,73 100,76" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M100,79 Q103,82 105,79 Q107,76 110,79" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M110,82 Q113,85 115,82 Q117,79 120,82" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M120,85 Q123,88 125,85 Q127,82 130,85" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M130,88 Q133,91 135,88 Q137,85 140,88" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M140,91 Q143,94 145,91 Q147,88 150,91" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M150,94 Q153,97 155,94 Q157,91 160,94" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M160,97 Q163,100 165,97 Q167,94 170,97" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M165,100 Q168,103 170,100 Q172,97 175,100" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            
            {/* Temporal Lobe Gyri */}
            <path d="M65,90 Q68,93 70,90 Q72,87 75,90" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M75,93 Q78,96 80,93 Q82,90 85,93" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M85,96 Q88,99 90,96 Q92,93 95,96" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M95,99 Q98,102 100,99 Q102,96 105,99" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M105,102 Q108,105 110,102 Q112,99 115,102" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M115,105 Q118,108 120,105 Q122,102 125,105" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M125,108 Q128,111 130,108 Q132,105 135,108" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M135,111 Q138,114 140,111 Q142,108 145,111" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M145,114 Q148,117 150,114 Q152,111 155,114" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M155,117 Q158,120 160,117 Q162,114 165,117" stroke="#8b5cf6" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            
            {/* Occipital Lobe Gyri */}
            <path d="M160,120 Q163,123 165,120 Q167,117 170,120" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M155,123 Q158,126 160,123 Q162,120 165,123" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M150,126 Q153,129 155,126 Q157,123 160,126" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M145,129 Q148,132 150,129 Q152,126 155,129" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            <path d="M140,132 Q143,135 145,132 Q147,129 150,132" stroke="#7c3aed" strokeWidth="2" fill="none" opacity="0.8" filter="url(#glow)"/>
            
            {/* Cerebellum */}
            <path d="M95,148 L120,148" stroke="#a855f7" strokeWidth="2" opacity="0.9" filter="url(#glow)"/>
            <path d="M93,151 L118,151" stroke="#a855f7" strokeWidth="2" opacity="0.9" filter="url(#glow)"/>
            <path d="M91,154 L116,154" stroke="#a855f7" strokeWidth="2" opacity="0.9" filter="url(#glow)"/>
            <path d="M89,157 L114,157" stroke="#a855f7" strokeWidth="2" opacity="0.9" filter="url(#glow)"/>
            <path d="M87,160 L112,160" stroke="#a855f7" strokeWidth="2" opacity="0.9" filter="url(#glow)"/>
            
            {/* Brain Stem */}
            <path d="M105,160 L105,168" stroke="#a855f7" strokeWidth="3.5" opacity="0.9" filter="url(#glow)"/>
            <path d="M100,165 L110,165" stroke="#a855f7" strokeWidth="2.5" opacity="0.8" filter="url(#glow)"/>

            {/* Wave Effect */}
            <motion.path
              d={`M48,${163 - progress * 1.41} Q80,${158 - progress * 1.41} 120,${163 - progress * 1.41} Q160,${168 - progress * 1.41} 180,${163 - progress * 1.41}`}
              stroke="#c084fc"
              strokeWidth="3"
              fill="none"
              opacity="0.9"
              clipPath="url(#brainClip)"
              filter="url(#strongGlow)"
              animate={{
                d: [
                  `M48,${163 - progress * 1.41} Q80,${158 - progress * 1.41} 120,${163 - progress * 1.41} Q160,${168 - progress * 1.41} 180,${163 - progress * 1.41}`,
                  `M48,${163 - progress * 1.41} Q80,${168 - progress * 1.41} 120,${163 - progress * 1.41} Q160,${158 - progress * 1.41} 180,${163 - progress * 1.41}`,
                  `M48,${163 - progress * 1.41} Q80,${158 - progress * 1.41} 120,${163 - progress * 1.41} Q160,${168 - progress * 1.41} 180,${163 - progress * 1.41}`,
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Glow effect on liquid */}
            <motion.ellipse
              cx="120"
              cy={163 - progress * 1.41}
              rx="60"
              ry="30"
              fill="rgba(168, 85, 247, 0.2)"
              filter="url(#strongGlow)"
              clipPath="url(#brainClip)"
            />
          </g>
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="w-[500px] px-8 z-10">
        <div className="mb-4">
          <div className="flex justify-center items-center mb-4">
            <span className="text-sm font-light tracking-[0.3em] text-purple-200 uppercase">
              CARGANDO...
            </span>
          </div>
          <div className="relative">
            <div className="h-3 bg-gray-900/80 rounded-full overflow-hidden border-2 border-purple-500/50 shadow-lg">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-full relative"
                style={{
                  width: `${progress}%`,
                  boxShadow: "0 0 25px rgba(139,92,246,1), 0 0 50px rgba(168,85,247,0.8)",
                }}
                transition={{ duration: 0.1 }}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            </div>
            {/* Percentage Display */}
            <div className="flex justify-center mt-3">
              <motion.span 
                className="text-3xl font-bold text-white"
                style={{
                  textShadow: '0 0 20px rgba(139,92,246,0.9), 0 0 40px rgba(168,85,247,0.6)',
                }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                }}
              >
                {Math.floor(progress)}%
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
