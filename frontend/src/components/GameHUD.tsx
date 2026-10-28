import { motion } from 'framer-motion';
import { ChevronLeft, Flame, Sparkles, Clock, Compass, Eye } from 'lucide-react';
import { AN, UNIVERSE_TOKENS } from '../lib/archivoTokens';
import { useEffectsLevel, setEffectsLevel } from '../lib/effects';
import { POWERS, WING_BY_ID, type PowerId, type GameUniverse } from '../lib/classicCampaign';

interface GameHUDProps {
  level: number;
  wing: GameUniverse;
  title: string;
  score: number;
  combo: number;
  timer: number;
  maxTime: number;
  isFrozen: boolean;
  energy: number;
  matchedPairs: number;
  totalPairs: number;
  useTriads: boolean;
  unlockedPowers: PowerId[];
  usedPowers: PowerId[];
  onUsePower: (powerId: PowerId) => void;
  onBack: () => void;
  showPowers?: boolean;
}

function TimerRing({
  timer,
  maxTime,
  isFrozen,
  reduced,
}: {
  timer: number;
  maxTime: number;
  isFrozen: boolean;
  reduced: boolean;
}) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const ratio = Math.max(0, Math.min(1, timer / maxTime));
  const color = isFrozen ? '#6EE7F5' : timer <= 10 ? AN.danger : timer <= 20 ? AN.gold : AN.signal;
  const urgent = timer <= 10 && !isFrozen;

  return (
    <div className="relative w-[72px] h-[72px]">
      <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
        <circle cx="36" cy="36" r={r} fill="rgba(5,7,12,0.7)" stroke="#1E2836" strokeWidth="3" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono font-bold text-lg leading-none"
          style={{ color }}
          animate={urgent && !reduced ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={urgent && !reduced ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
        >
          {Math.ceil(timer)}
        </motion.span>
        <span className="font-mono text-[7px] uppercase tracking-widest text-[#9AA3B2] mt-0.5">
          {isFrozen ? 'CONGELADO' : 'TIEMPO'}
        </span>
      </div>
    </div>
  );
}

export function GameHUD({
  level,
  wing,
  title,
  score,
  combo,
  timer,
  maxTime,
  isFrozen,
  energy,
  matchedPairs,
  totalPairs,
  useTriads,
  unlockedPowers,
  usedPowers,
  onUsePower,
  onBack,
  showPowers = true,
}: GameHUDProps) {
  const effectsLevel = useEffectsLevel();
  const reduced = effectsLevel === 'reduced';
  const wingDef = WING_BY_ID[wing];
  const progress = totalPairs > 0 ? matchedPairs / totalPairs : 0;

  const powerIcons = {
    reveal: Eye,
    freeze: Clock,
    hint: Compass,
  };

  return (
    <div
      className="w-full z-30 relative px-4 pt-2.5 pb-3 border-b border-[#1E2836] shadow-lg"
      style={{
        background: 'linear-gradient(180deg, rgba(7,9,15,0.96) 0%, rgba(10,14,22,0.92) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Top Bar: Nav, Wing/Level Breadcrumb, FX Toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onBack}
          className="an-focusable flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1E2836] bg-[#0D1119] text-[#9AA3B2] hover:text-white hover:border-[#35E0C8]/40 transition-colors"
          aria-label="Volver a selección de nivel"
        >
          <ChevronLeft size={14} />
          <span className="font-mono text-[10px] tracking-widest uppercase">SALIR</span>
        </button>

        {/* Center Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border"
            style={{
              borderColor: `${wingDef.accent}55`,
              color: wingDef.accent,
              background: `${wingDef.accent}14`,
            }}
          >
            ALA {wingDef.roman} · {wingDef.name}
          </span>
          <span className="text-[#5C6675]">//</span>
          <span className="font-serif text-white tracking-wide font-medium">
            Nivel {level}: "{title}"
          </span>
        </div>

        {/* FX Toggle */}
        <button
          onClick={() => setEffectsLevel(reduced ? 'full' : 'reduced')}
          className="an-focusable font-mono text-[9px] tracking-wider px-2 py-1 rounded border transition-colors"
          style={{
            color: reduced ? AN.gold : AN.inkFaint,
            borderColor: reduced ? 'rgba(232,181,74,0.4)' : '#1E2836',
          }}
          aria-pressed={reduced}
          title={reduced ? 'Activar efectos visuales completos' : 'Reducir efectos visuales'}
        >
          FX {reduced ? 'REDUCIDOS' : 'ALTOS'}
        </button>
      </div>

      {/* Main HUD Row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left: Score & Combos */}
        <div className="flex items-center gap-4">
          <div>
            <div className="font-mono text-[8px] uppercase tracking-widest text-[#9AA3B2]">PUNTOS</div>
            <motion.div
              key={score}
              className="font-mono font-bold text-xl sm:text-2xl text-white leading-none"
              initial={reduced ? false : { scale: 1.15 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {score.toLocaleString()}
            </motion.div>
          </div>

          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all"
            style={{
              borderColor: combo >= 2 ? 'rgba(232,181,74,0.5)' : '#1E2836',
              background: combo >= 2 ? 'rgba(232,181,74,0.1)' : 'transparent',
            }}
          >
            <Flame size={13} color={combo >= 2 ? AN.gold : '#5C6675'} />
            <span
              className="font-mono text-xs font-bold"
              style={{ color: combo >= 2 ? AN.gold : '#5C6675' }}
            >
              x{combo}
            </span>
          </div>
        </div>

        {/* Center: Timer Ring */}
        <div className="flex justify-center">
          <TimerRing timer={timer} maxTime={maxTime} isFrozen={isFrozen} reduced={reduced} />
        </div>

        {/* Right: In-Game Powers Bar / Status */}
        <div className="flex items-center justify-end gap-2">
          {showPowers ? (
            Object.values(POWERS).map((p) => {
              const isUnlocked = unlockedPowers.includes(p.id);
              const isUsed = usedPowers.includes(p.id);
              const Icon = powerIcons[p.id] || Sparkles;
              const canUse = isUnlocked && !isUsed;

              return (
                <button
                  key={p.id}
                  onClick={() => canUse && onUsePower(p.id)}
                  disabled={!canUse}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-[11px] transition-all relative ${
                    canUse
                      ? 'border-[#35E0C8]/60 bg-[#131A26] text-white hover:scale-105 hover:border-[#35E0C8] shadow-[0_0_12px_rgba(53,224,200,0.2)] cursor-pointer'
                      : isUsed
                      ? 'border-[#1E2836] bg-[#07090F]/60 text-[#5C6675] opacity-50 cursor-not-allowed'
                      : 'border-[#1E2836]/30 bg-[#07090F]/30 text-[#5C6675]/40 opacity-40 cursor-not-allowed'
                  }`}
                  title={
                    !isUnlocked
                      ? `Poder bloqueado (Desbloquéalo en Nivel ${p.unlockLevel})`
                      : isUsed
                      ? `Poder ya utilizado en este nivel`
                      : `Activar ${p.name} (Tecla ${p.hotkey})`
                  }
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: canUse ? p.color : undefined }} />
                  <span className="hidden sm:inline font-semibold">{p.verb}</span>
                  <span
                    className="w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center"
                    style={{
                      background: canUse ? p.color : '#1E2836',
                      color: canUse ? '#07090F' : '#5C6675',
                    }}
                  >
                    {p.hotkey}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-[#0D1119]/80 shadow-inner">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">
                Restantes
              </span>
              <span className="font-mono font-bold text-sm text-[#35E0C8]">
                {Math.max(0, totalPairs - matchedPairs)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Progress Tracker */}
      <div className="flex items-center gap-3 mt-2">
        <span className="font-mono text-[9px] text-[#9AA3B2] uppercase tracking-wider shrink-0">
          {useTriads ? 'Tríadas' : 'Pares'}: {matchedPairs} / {totalPairs}
        </span>

        {/* Diamond Pips */}
        <div className="flex-1 flex items-center justify-center gap-1.5 overflow-hidden">
          {Array.from({ length: totalPairs }, (_, i) => {
            const filled = i < matchedPairs;
            return (
              <span
                key={i}
                className="w-2 h-2 rotate-45 transition-all duration-300 rounded-[1px]"
                style={{
                  background: filled ? wingDef.accent : 'transparent',
                  border: `1px solid ${filled ? wingDef.accent : 'rgba(92,102,117,0.4)'}`,
                  boxShadow: filled ? `0 0 8px ${wingDef.accent}88` : 'none',
                }}
              />
            );
          })}
        </div>

        <span className="font-mono text-[9px] text-[#9AA3B2] shrink-0">
          {Math.round(progress * 100)}%
        </span>
      </div>
    </div>
  );
}
