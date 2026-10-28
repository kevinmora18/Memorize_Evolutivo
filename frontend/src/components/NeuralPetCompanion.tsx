import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, ArrowRightLeft, Heart, Award, Shield } from 'lucide-react';
import {
  type PetState,
  PETS,
  getPetStage,
  getXpForNextLevel,
  feedPet,
  switchPetType,
} from '../lib/petSystem';

interface NeuralPetCompanionProps {
  petState: PetState;
  onUpdatePet: (newState: PetState) => void;
  onShowNotification?: (msg: string) => void;
}

export function NeuralPetCompanion({
  petState,
  onUpdatePet,
  onShowNotification,
}: NeuralPetCompanionProps) {
  const [isInteracting, setIsInteracting] = useState(false);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolvedStage, setEvolvedStage] = useState<1 | 2 | 3>(1);

  const petDef = PETS[petState.type];
  const stage = getPetStage(petState.level);
  const stageInfo = petDef.stages[stage - 1];
  const xpNeeded = getXpForNextLevel(petState.level);
  const xpProgress = Math.min(100, Math.round((petState.xp / xpNeeded) * 100));

  const handlePetClick = () => {
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 800);

    // Seleccionar frase aleatoria
    const randomQuote = petDef.quotes[Math.floor(Math.random() * petDef.quotes.length)];
    setSpeechBubble(randomQuote);
    setTimeout(() => setSpeechBubble(null), 3500);

    // Sonido procedural simpático
    try {
      const isMuted = localStorage.getItem('memorize_sound_muted') === 'true';
      if (!isMuted) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const baseFreq = petState.type === 'fox' ? 620 : 740;
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, now + 0.08);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.12);
        }
      }
    } catch {
      // Audio seguro
    }
  };

  const handleFeed = (amount: number = 10) => {
    if (petState.brains < amount) {
      if (onShowNotification) {
        onShowNotification('¡Necesitas al menos 10 cerebritos 🧠! Juega partidas para conseguir más.');
      }
      return;
    }

    const res = feedPet(amount);
    if (!res) return;

    onUpdatePet(res.newState);
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 900);

    // Sonido de alimentación
    try {
      const isMuted = localStorage.getItem('memorize_sound_muted') === 'true';
      if (!isMuted) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          [587.33, 739.99, 880.00].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);
            gain.gain.setValueAtTime(0.1, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.06 + 0.1);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.1);
          });
        }
      }
    } catch {
      // Ignorar error de audio
    }

    if (res.evolved) {
      setEvolvedStage(res.newStage);
      setShowEvolutionModal(true);
    } else if (res.leveledUp) {
      if (onShowNotification) {
        onShowNotification(`¡${res.newState.nickname} ha subido al Nivel ${res.newLevel}! 🎉`);
      }
    }
  };

  const handleSwitchPet = () => {
    const nextType = petState.type === 'fox' ? 'cat' : 'fox';
    const nextState = switchPetType(nextType);
    onUpdatePet(nextState);
    if (onShowNotification) {
      onShowNotification(`¡Compañero cambiado a ${PETS[nextType].name}! 🐾`);
    }
  };

  return (
    <div
      className="rounded-2xl p-4 border backdrop-blur-xl relative overflow-hidden transition-all duration-300"
      style={{
        borderColor: `${petDef.themeColor}44`,
        background: 'linear-gradient(135deg, rgba(14, 20, 32, 0.75) 0%, rgba(8, 12, 20, 0.85) 100%)',
        boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${petDef.glowColor}`,
      }}
    >
      {/* Cabecera del Compañero */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{petState.type === 'fox' ? '🦊' : '🐱'}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white tracking-wide">
                {petState.nickname}
              </h4>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                style={{
                  color: petDef.themeColor,
                  borderColor: `${petDef.themeColor}55`,
                  background: `${petDef.themeColor}15`,
                }}
              >
                Fase {stage}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              {stageInfo.title}
            </p>
          </div>
        </div>

        {/* Botón de Alternar Mascota */}
        <button
          onClick={handleSwitchPet}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/10 hover:border-white/20 bg-white/[0.04] text-[10px] font-mono text-slate-300 hover:text-white transition-all"
          title="Cambiar entre Zorro y Gatito"
        >
          <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
          <span>Cambiar</span>
        </button>
      </div>

      {/* Avatar Animado Central de la Mascota */}
      <div className="relative my-2 flex items-center justify-center min-h-[110px]">
        {/* Globo de diálogo flotante */}
        <AnimatePresence>
          {speechBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute -top-7 z-30 px-3 py-1.5 rounded-xl border text-[11px] font-medium text-white shadow-xl max-w-[200px] text-center"
              style={{
                borderColor: petDef.themeColor,
                background: 'rgba(8, 12, 20, 0.95)',
                boxShadow: `0 0 15px ${petDef.glowColor}`,
              }}
            >
              {speechBubble}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resplandor ambiental de fondo */}
        <div
          className="absolute w-28 h-28 rounded-full blur-2xl pointer-events-none transition-colors duration-500"
          style={{ background: petDef.themeColor, opacity: 0.2 }}
        />

        {/* Criatura interactiva con Framer Motion */}
        <motion.div
          onClick={handlePetClick}
          className="relative cursor-pointer z-10 select-none group"
          animate={
            isInteracting
              ? { scale: [1, 1.15, 0.95, 1], rotate: [0, -6, 6, 0] }
              : { y: [0, -5, 0] }
          }
          transition={
            isInteracting
              ? { duration: 0.45 }
              : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
          }
          whileHover={{ scale: 1.06 }}
        >
          {/* Ilustración Vectorial estilizada de la Mascota */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center relative border border-white/10 shadow-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(18,24,38,0.9) 0%, rgba(9,13,22,0.95) 100%)',
            }}
          >
            {/* Partículas de chispas alrededor si es fase avanzada */}
            {stage >= 2 && (
              <motion.div
                className="absolute inset-0 rounded-2xl border border-dashed"
                style={{ borderColor: petDef.themeColor }}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
            )}

            {/* Ilustración de la Mascota */}
            {petState.type === 'fox' ? (
              <div className="relative flex flex-col items-center">
                {/* Orejitas */}
                <div className="flex gap-4 -mb-1">
                  <div
                    className="w-3.5 h-5 rounded-t-full rotate-[-22deg]"
                    style={{ background: petDef.themeColor }}
                  />
                  <div
                    className="w-3.5 h-5 rounded-t-full rotate-[22deg]"
                    style={{ background: petDef.themeColor }}
                  />
                </div>
                {/* Cabecita */}
                <div
                  className="w-12 h-10 rounded-2xl flex items-center justify-center relative shadow-inner"
                  style={{ background: 'linear-gradient(135deg, #FFA040 0%, #E66000 100%)' }}
                >
                  {/* Ojos cian */}
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_6px_#00F0FF]" />
                    <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_6px_#00F0FF]" />
                  </div>
                  {/* Hocico */}
                  <div className="absolute bottom-1 w-2.5 h-1.5 rounded-full bg-slate-900" />
                </div>
                {/* Colitas según la fase */}
                <div className="flex gap-1.5 mt-0.5">
                  <div
                    className="w-2.5 h-3.5 rounded-b-full shadow-sm"
                    style={{ background: petDef.themeColor }}
                  />
                  {stage >= 2 && (
                    <div
                      className="w-2.5 h-3.5 rounded-b-full shadow-sm bg-cyan-400"
                    />
                  )}
                  {stage >= 3 && (
                    <div
                      className="w-2.5 h-3.5 rounded-b-full shadow-sm"
                      style={{ background: '#FFD700' }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col items-center">
                {/* Orejitas de gato */}
                <div className="flex gap-4 -mb-1">
                  <div
                    className="w-4 h-4 rotate-45 rounded-sm"
                    style={{ background: petDef.themeColor }}
                  />
                  <div
                    className="w-4 h-4 rotate-45 rounded-sm"
                    style={{ background: petDef.themeColor }}
                  />
                </div>
                {/* Cabecita cósmica */}
                <div
                  className="w-12 h-10 rounded-full flex items-center justify-center relative shadow-inner"
                  style={{ background: 'linear-gradient(135deg, #B79CFF 0%, #6E45E2 100%)' }}
                >
                  {/* Ojos esmeralda */}
                  <div className="flex gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_6px_#00FF9D]" />
                    <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_6px_#00FF9D]" />
                  </div>
                  {/* Naricita */}
                  <div className="absolute bottom-1.5 w-1.5 h-1 rounded-full bg-pink-300" />
                </div>
                {/* Cola curvada */}
                <div
                  className="w-2.5 h-4 rounded-full mt-0.5"
                  style={{ background: petDef.themeColor }}
                />
              </div>
            )}

            {/* Efecto de corazón o chispas al interactuar */}
            {isInteracting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1.2, y: -25 }}
                className="absolute top-1 right-2 text-rose-400 pointer-events-none"
              >
                <Heart className="w-4 h-4 fill-rose-400" />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Barra de Nivel y XP */}
      <div className="my-2.5">
        <div className="flex justify-between items-center text-[11px] font-mono mb-1">
          <span className="text-white font-bold flex items-center gap-1">
            <Award className="w-3.5 h-3.5" style={{ color: petDef.themeColor }} />
            Nivel {petState.level}
          </span>
          <span className="text-slate-400">
            {petState.xp} / {xpNeeded} XP
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
          <motion.div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${xpProgress}%`,
              background: `linear-gradient(90deg, ${petDef.themeColor}, #00F0FF)`,
            }}
          />
        </div>
      </div>

      {/* Moneda de Cerebritos y Botón de Alimentar */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-950/40 border border-cyan-400/30 text-cyan-300">
            <Brain className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-white block leading-none">
              {petState.brains}
            </span>
            <span className="text-[9px] font-mono text-slate-400">Cerebritos</span>
          </div>
        </div>

        <button
          onClick={() => handleFeed(10)}
          className="flex-1 py-1.5 px-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background:
              petState.brains >= 10
                ? `linear-gradient(135deg, ${petDef.themeColor} 0%, #FFFFFF 100%)`
                : 'rgba(255, 255, 255, 0.08)',
            color: petState.brains >= 10 ? '#000000' : '#64748b',
            boxShadow: petState.brains >= 10 ? `0 0 14px ${petDef.glowColor}` : 'none',
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Alimentar (-10 🧠)</span>
        </button>
      </div>

      {/* Poder Pasivo activo */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
        <Shield className="w-3 h-3 text-cyan-400 shrink-0" />
        <span className="truncate">
          <strong className="text-slate-300">{petDef.perkName}:</strong> {petDef.perkDesc}
        </span>
      </div>

      {/* ──────────────── Modal de Celebración de Evolución ──────────────── */}
      {showEvolutionModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowEvolutionModal(false)}
        >
          <div
            className="rounded-3xl p-6 max-w-sm w-full border text-center shadow-2xl relative"
            style={{
              borderColor: petDef.themeColor,
              background: '#090D16',
              boxShadow: `0 0 40px ${petDef.glowColor}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center border text-3xl shadow-xl"
              style={{
                borderColor: petDef.themeColor,
                background: 'rgba(255,255,255,0.05)',
                boxShadow: `0 0 25px ${petDef.glowColor}`,
              }}
            >
              {petState.type === 'fox' ? '🦊' : '🐱'}
            </div>

            <span className="text-[10px] font-mono tracking-widest uppercase text-cyan-300 font-bold">
              ¡METAMORFOSIS NEURAL!
            </span>
            <h3 className="text-2xl font-serif font-bold text-white mt-1">
              {petState.nickname} ha evolucionado
            </h3>
            <p className="text-xs font-mono mt-1" style={{ color: petDef.themeColor }}>
              Fase {evolvedStage}: {petDef.stages[evolvedStage - 1].title}
            </p>
            <p className="text-xs text-slate-300 my-3 leading-relaxed">
              {petDef.stages[evolvedStage - 1].description}
            </p>

            <button
              onClick={() => setShowEvolutionModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-mono font-bold text-black uppercase tracking-wider"
              style={{ background: petDef.themeColor }}
            >
              ¡Increíble! Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
