import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Star, Zap, Target, Flame, RotateCcw,
  Home, Clock, ArrowRight, Sparkles, Coins, Gem, ShieldAlert
} from 'lucide-react';
import {
  getLevel, recordLevelResult, computeStars, STAR_RULES, TOTAL_LEVELS,
  type LevelRewards, type LevelOutcome
} from '../lib/classicCampaign';
import { apiFetch } from '../lib/api';
import { CardArt } from './cards/CardArt';

interface ClassicResultsProps {
  level: number;
  score: number;
  aiScore: number;
  accuracy: number;
  maxCombo: number;
  matchedPairs: number;
  totalPairs: number;
  timeLeft: number;
  maxTime: number;
  won: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onBackToLobby: () => void;
}

export function ClassicResults({
  level,
  score,
  aiScore,
  accuracy,
  maxCombo,
  matchedPairs,
  totalPairs,
  timeLeft,
  maxTime,
  won,
  onNextLevel,
  onRetry,
  onBackToLobby,
}: ClassicResultsProps) {
  const levelDef = getLevel(level);
  const calculatedStars = computeStars(won, accuracy, timeLeft, maxTime);

  const [rewards, setRewards] = useState<LevelRewards | null>(null);
  const [serverRewards, setServerRewards] = useState<{ xpGained: number; coinsGained: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Guardar y procesar recompensas locales (estrellas, reliquia, poder, corona)
    const outcome: LevelOutcome = {
      won,
      score,
      accuracy,
      maxCombo,
      timeLeft,
      stars: calculatedStars,
    };
    const local = recordLevelResult(level, outcome);
    setRewards(local);

    // 2. Enviar resultado al servidor para acreditar XP y Monedas oficiales
    setIsSubmitting(true);
    apiFetch<{ xpGained: number; coinsGained: number }>('/api/matches', {
      method: 'POST',
      body: JSON.stringify({
        mode: 'classic',
        level,
        score,
        accuracy,
        combo: maxCombo,
        timeLeft: Math.round(timeLeft),
        won,
      }),
    })
      .then((data) => {
        setServerRewards({
          xpGained: data.xpGained,
          coinsGained: data.coinsGained,
        });
      })
      .catch(() => {
        // Modo offline / sin sesión: fallback visual
        setServerRewards({
          xpGained: local.localXp,
          coinsGained: won ? Math.floor(score / 10) : 10,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }, [level, won, score, accuracy, maxCombo, timeLeft, calculatedStars]);

  // Sonidos de victoria o derrota
  useEffect(() => {
    const audioUrl = won
      ? 'https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg'
      : 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';
    try {
      const audio = new Audio(audioUrl);
      audio.volume = 0.4;
      audio.play().catch(() => {});
    } catch {}
  }, [won]);

  const stats = [
    { icon: Target, label: 'Precisión', value: `${accuracy}%`, color: '#22d3ee' },
    { icon: Flame, label: 'Mayor Cadena', value: `x${maxCombo}`, color: '#f97316' },
    { icon: Zap, label: 'Memorias', value: `${matchedPairs}/${totalPairs}`, color: '#a855f7' },
    { icon: Clock, label: 'Tiempo Libre', value: `${Math.ceil(timeLeft)}s`, color: '#4ade80' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto select-none"
      style={{ background: 'rgba(5,7,12,0.92)', backdropFilter: 'blur(16px)' }}
    >
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: won ? 'radial-gradient(circle, #35E0C8, #E8B54A, transparent)' : 'radial-gradient(circle, #FF4D5E, transparent)' }}
        />
      </div>

      <motion.div
        className="w-full max-w-lg relative my-auto"
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div
          className="rounded-3xl border overflow-hidden shadow-2xl relative"
          style={{
            background: 'linear-gradient(180deg, #0D1119 0%, #07090F 100%)',
            borderColor: won ? 'rgba(53,224,200,0.4)' : 'rgba(255,77,94,0.4)',
            boxShadow: won ? '0 0 50px rgba(53,224,200,0.15)' : '0 0 50px rgba(255,77,94,0.15)',
          }}
        >
          {/* Header Banner */}
          <div
            className="p-6 text-center relative"
            style={{
              background: won
                ? 'linear-gradient(180deg, rgba(53,224,200,0.12) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(255,77,94,0.12) 0%, transparent 100%)',
            }}
          >
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#9AA3B2] mb-1">
              REGISTRO DE CUSTODIA · NIVEL {level}
            </div>

            <h2
              className="font-serif text-3xl sm:text-4xl font-bold tracking-wide text-white drop-shadow-md mb-2"
              style={{
                color: won ? '#35E0C8' : '#FF4D5E',
                textShadow: won ? '0 0 20px rgba(53,224,200,0.5)' : '0 0 20px rgba(255,77,94,0.5)',
              }}
            >
              {won ? (level === TOTAL_LEVELS ? '¡CAMPAÑA CONQUISTADA!' : '¡SECUENCIA CAPTURADA!') : 'ANOMALÍA NO RESUELTA'}
            </h2>

            <p className="text-xs text-[#9AA3B2]">
              {won
                ? `Has completado el Nivel ${level}: "${levelDef.title}"`
                : 'Se agotó el tiempo de contención. El Archivo ha restablecido el registro.'}
            </p>

            {/* Stars Animation */}
            {won && (
              <div className="flex items-center justify-center gap-3 mt-4">
                {[1, 2, 3].map((starIdx) => {
                  const isEarned = starIdx <= calculatedStars;
                  return (
                    <motion.div
                      key={starIdx}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2 + starIdx * 0.15, type: 'spring' }}
                      className="relative"
                    >
                      <Star
                        className={`w-9 h-9 ${
                          isEarned
                            ? 'text-[#E8B54A] fill-[#E8B54A] filter drop-shadow-[0_0_12px_rgba(232,181,74,0.8)]'
                            : 'text-[#1E2836] fill-[#131A26]'
                        }`}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Score & Server Rewards Banner */}
          <div className="px-6 py-3 border-y border-[#1E2836] bg-[#07090F]/60 flex items-center justify-around">
            <div className="text-center">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">Puntuación</span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-white">
                {score.toLocaleString()}
              </div>
            </div>

            <div className="h-8 w-px bg-[#1E2836]" />

            <div className="text-center">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2] flex items-center justify-center gap-1">
                <Coins className="w-3 h-3 text-[#E8B54A]" /> Monedas
              </span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#E8B54A]">
                +{serverRewards?.coinsGained ?? Math.floor(score / 10)}
              </div>
            </div>

            <div className="h-8 w-px bg-[#1E2836]" />

            <div className="text-center">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2] flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-[#35E0C8]" /> XP Ganado
              </span>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#35E0C8]">
                +{serverRewards?.xpGained ?? rewards?.localXp ?? 50}
              </div>
            </div>
          </div>

          {/* Stats 4-Grid */}
          <div className="p-6 grid grid-cols-2 gap-3">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="p-3 rounded-xl border border-[#1E2836] bg-[#131A26]/50 flex items-center gap-3"
              >
                <s.icon className="w-5 h-5 shrink-0" style={{ color: s.color }} />
                <div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">{s.label}</div>
                  <div className="font-mono text-base font-bold text-white">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Special Unlocks Box (Relic, Power, Crown) */}
          {won && rewards?.firstClear && (
            <div className="px-6 pb-4">
              <div className="p-4 rounded-2xl border border-[#E8B54A]/40 bg-[#E8B54A]/10 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="w-4 h-4 text-[#E8B54A]" />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-[#E8B54A]">
                    ¡Desbloqueo de 1ª Victoria!
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {rewards.relic && (
                    <div className="w-14 h-18 rounded-lg border border-[#E8B54A]/60 overflow-hidden shrink-0 shadow-md">
                      <CardArt artId={rewards.relic.id} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {rewards.relic && (
                      <div className="text-sm font-bold text-white truncate">
                        Reliquia: {rewards.relic.name}
                      </div>
                    )}
                    {rewards.power && (
                      <div className="text-xs text-[#35E0C8] font-mono font-medium mt-0.5">
                        Nuevo Poder: {rewards.power.name} ({rewards.power.verb})
                      </div>
                    )}
                    {rewards.crown && (
                      <div className="text-xs text-[#E8B54A] font-mono font-bold mt-0.5">
                        ★ Has obtenido la Corona del Archivo ★
                      </div>
                    )}
                    <div className="text-[11px] text-[#9AA3B2] mt-1">
                      Añadida a tu colección permanente del Archivo.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Star Criteria Info (If won) */}
          {won && (
            <div className="px-6 pb-4 text-[10px] font-mono text-[#9AA3B2] flex flex-col gap-1 border-t border-[#1E2836]/40 pt-3">
              <div className="flex items-center justify-between">
                <span>★ Superar el Nivel:</span>
                <span className="text-white">Concedida</span>
              </div>
              <div className="flex items-center justify-between">
                <span>★ Precisión ≥ {STAR_RULES.accuracy}% ({accuracy}%):</span>
                <span className={accuracy >= STAR_RULES.accuracy ? 'text-[#35E0C8]' : 'text-[#5C6675]'}>
                  {accuracy >= STAR_RULES.accuracy ? 'Conseguida' : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>★ Tiempo restante ≥ {Math.round(STAR_RULES.timeRatio * 100)}% ({Math.round((timeLeft / maxTime) * 100)}%):</span>
                <span className={timeLeft / maxTime >= STAR_RULES.timeRatio ? 'text-[#35E0C8]' : 'text-[#5C6675]'}>
                  {timeLeft / maxTime >= STAR_RULES.timeRatio ? 'Conseguida' : 'Pendiente'}
                </span>
              </div>
            </div>
          )}

          {/* Buttons Footer */}
          <div className="p-6 border-t border-[#1E2836] bg-[#07090F] flex flex-col gap-2.5">
            {won && level < TOTAL_LEVELS && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNextLevel}
                className="w-full py-3.5 px-4 rounded-xl font-mono text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] shadow-[0_0_20px_rgba(53,224,200,0.3)] hover:shadow-[0_0_30px_rgba(53,224,200,0.5)] cursor-pointer"
              >
                <span>Siguiente Nivel ({level + 1})</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={onRetry}
                className="flex-1 py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold border border-[#1E2836] bg-[#131A26] text-[#E8E6DF] hover:border-[#35E0C8]/50 hover:bg-[#1A2230] transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>

              <button
                onClick={onBackToLobby}
                className="flex-1 py-3 px-4 rounded-xl font-mono text-xs uppercase tracking-wider font-semibold border border-[#1E2836] bg-[#0D1119] text-[#9AA3B2] hover:text-white hover:border-[#2C3A4E] transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Expedición / Mapa</span>
              </button>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
