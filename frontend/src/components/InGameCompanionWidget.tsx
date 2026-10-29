import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Clock, Sparkles, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { loadPetState, PETS, getPetStage, type PetState } from '../lib/petSystem';
import { PetCanvas3D } from './PetCanvas3D';

interface InGameCompanionWidgetProps {
  onRevealPair: () => void;
  onFreezeTime?: () => void;
  combo?: number;
  matchedCount?: number;
  isGameActive?: boolean;
}

export function InGameCompanionWidget({
  onRevealPair,
  onFreezeTime,
  combo = 0,
  matchedCount = 0,
  isGameActive = true,
}: InGameCompanionWidgetProps) {
  const [petState] = useState<PetState>(() => loadPetState());
  const [charge, setCharge] = useState(100); // Comienza al 100% para poder probarla de inmediato
  const [isInteracting, setIsInteracting] = useState(false);
  const [speech, setSpeech] = useState<string | null>('¡Estoy aquí para ayudarte con mi visión astral! ✨');
  const [isCollapsed, setIsCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [cooldown, setCooldown] = useState(false);

  const petDef = PETS[petState.type] || PETS.fox;
  const stage = getPetStage(petState.level);

  // Reaccionar a combos y aciertos
  useEffect(() => {
    if (combo >= 2) {
      setSpeech(combo >= 4 ? '¡Racha legendaria! ¡Eres un genio! 🔥' : '¡Excelente combo! ⚡');
      setIsInteracting(true);
      setTimeout(() => setIsInteracting(false), 800);
      setTimeout(() => setSpeech(null), 3000);
    }
  }, [combo]);

  // Recargar la habilidad con cada acierto de pareja (+35%)
  useEffect(() => {
    if (matchedCount > 0) {
      setCharge((prev) => {
        const next = Math.min(100, prev + 35);
        if (next === 100 && prev < 100) {
          setSpeech('¡Habilidad cargada! Presiona [E] o haz clic para ver cartas 👁️');
          setTimeout(() => setSpeech(null), 3500);
        }
        return next;
      });
    }
  }, [matchedCount]);

  // Ejecutar Habilidad de Revelar Cartas
  const handleActivateReveal = useCallback(() => {
    if (charge < 100 || cooldown || !isGameActive) return;

    setCharge(0);
    setCooldown(true);
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 900);

    const message = petState.type === 'cat'
      ? '¡Mirada Astral activada! Te muestro un par oculto 🐱✨'
      : '¡Ojo de Lince Kitsune activado! Mira las cartas reveladas 🦊⚡';
    setSpeech(message);
    setTimeout(() => setSpeech(null), 3500);

    onRevealPair();

    setTimeout(() => setCooldown(false), 3000);
  }, [charge, cooldown, isGameActive, onRevealPair, petState.type]);

  // Ejecutar Habilidad de Congelar Tiempo
  const handleActivateFreeze = useCallback(() => {
    if (!onFreezeTime || charge < 80 || cooldown || !isGameActive) return;

    setCharge((c) => Math.max(0, c - 80));
    setCooldown(true);
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 900);

    setSpeech('¡Tiempo congelado durante 6 segundos! Piensa con calma ⏳❄️');
    setTimeout(() => setSpeech(null), 3500);

    onFreezeTime();

    setTimeout(() => setCooldown(false), 3000);
  }, [charge, cooldown, isGameActive, onFreezeTime]);

  // Atajos de teclado: [E] o [1] para Revelar Cartas, [Q] o [2] para Congelar Tiempo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGameActive) return;
      const key = e.key.toLowerCase();
      if (key === 'e' || key === '1') {
        handleActivateReveal();
      } else if (key === 'q' || key === '2') {
        handleActivateFreeze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleActivateReveal, handleActivateFreeze, isGameActive]);

  // Clic en el animalito para animarlo y hablar
  const handleMascotClick = () => {
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 800);
    const quotes = [
      '¡Concéntrate, vamos a ganar!',
      '¡Usa mi habilidad para ver cartas ocultas!',
      '¡Mis sentidos captan las posiciones correctas!',
      '¡Juntos somos invencibles!',
    ];
    setSpeech(quotes[Math.floor(Math.random() * quotes.length)]);
    setTimeout(() => setSpeech(null), 3000);
  };

  const isReady = charge >= 100;

  return (
    <div className="fixed top-12 left-1.5 sm:top-18 sm:left-3 z-40 select-none pointer-events-auto">
      {/* Globo de diálogo flotante del compañero */}
      <AnimatePresence>
        {speech && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.9 }}
            className="absolute -top-13 left-0 z-50 px-3.5 py-1.5 rounded-2xl border text-[11px] font-semibold text-white shadow-2xl backdrop-blur-xl whitespace-nowrap"
            style={{
              borderColor: petDef.themeColor,
              background: 'rgba(8, 12, 22, 0.95)',
              boxShadow: `0 0 16px ${petDef.glowColor}`,
            }}
          >
            <span>{speech}</span>
            {/* Triangulito de bocadillo */}
            <div
              className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45 border-r border-b"
              style={{
                borderColor: petDef.themeColor,
                background: 'rgba(8, 12, 22, 0.95)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tarjeta Principal del Compañero en Juego */}
      <motion.div
        layout
        className="rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
        style={{
          borderColor: isReady ? petDef.themeColor : 'rgba(255, 255, 255, 0.14)',
          background: 'linear-gradient(135deg, rgba(12, 17, 28, 0.94) 0%, rgba(6, 9, 16, 0.97) 100%)',
          boxShadow: isReady
            ? `0 10px 32px rgba(0,0,0,0.5), 0 0 25px ${petDef.glowColor}`
            : '0 8px 24px rgba(0,0,0,0.4)',
          width: isCollapsed ? '72px' : '260px',
        }}
      >
        {isCollapsed ? (
          // Vista minimizada compacta
          <div
            onClick={() => setIsCollapsed(false)}
            className="w-18 h-18 p-1 relative flex flex-col items-center justify-center cursor-pointer group"
            title="Haz clic para desplegar compañero y habilidades"
          >
            <div className="w-16 h-16 pointer-events-none">
              <PetCanvas3D
                petType={petState.type}
                level={petState.level}
                isInteracting={isInteracting}
                mode="ingame"
              />
            </div>
            <div
              className="absolute bottom-0.5 px-1 rounded text-[8px] font-mono font-bold"
              style={{ color: isReady ? petDef.themeColor : '#94a3b8' }}
            >
              {charge}%
            </div>
          </div>
        ) : (
          // Vista expandida con COMPAÑERO 3D EN TAMAÑO GRANDE
          <>
            {/* Cabecera: Nombre + Nivel + Botón Minimizar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm">{petState.type === 'cat' ? '🐱' : '🦊'}</span>
                <span className="text-xs font-bold text-white truncate max-w-[130px]">
                  {petState.nickname}
                </span>
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                  style={{
                    color: petDef.themeColor,
                    borderColor: `${petDef.themeColor}55`,
                    background: `${petDef.themeColor}15`,
                  }}
                >
                  Fase {stage}
                </span>
              </div>

              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Minimizar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Escenario 3D Grande y Destacado del Compañero en Partida (Espacioso y sin desbordes) */}
            <div className="p-2 pb-1.5">
              <div
                onClick={handleMascotClick}
                className="w-full h-48 sm:h-52 rounded-xl border relative flex items-center justify-center overflow-hidden cursor-pointer group transition-all"
                style={{
                  borderColor: `${petDef.themeColor}44`,
                  background: 'radial-gradient(ellipse at 50% 65%, rgba(26,38,65,0.95) 0%, rgba(8,11,18,0.98) 100%)',
                  boxShadow: isReady ? `inset 0 0 20px ${petDef.glowColor}` : 'none',
                }}
                title="Haz clic en tu compañero para interactuar"
              >
                <div className="w-full h-full pointer-events-none flex items-center justify-center">
                  <PetCanvas3D
                    petType={petState.type}
                    level={petState.level}
                    isInteracting={isInteracting}
                    mode="ingame"
                  />
                </div>

                <div className="absolute bottom-1.5 text-[8px] font-mono text-slate-400/50 group-hover:text-white/80 transition-colors">
                  Toca para animar
                </div>
              </div>
            </div>

            {/* Barra de Carga de Sinapsis */}
            <div className="px-3 pb-2">
              <div className="flex justify-between items-center text-[9px] font-mono mb-1">
                <span className="text-slate-400 flex items-center gap-1 font-semibold">
                  <Zap className="w-3 h-3" style={{ color: petDef.themeColor }} />
                  Sinapsis
                </span>
                <span
                  className="font-bold"
                  style={{ color: isReady ? petDef.themeColor : '#94a3b8' }}
                >
                  {charge}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full overflow-hidden bg-white/10 relative">
                <motion.div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${charge}%`,
                    background: isReady
                      ? `linear-gradient(90deg, ${petDef.themeColor}, #00F0FF)`
                      : petDef.themeColor,
                    boxShadow: isReady ? `0 0 10px ${petDef.themeColor}` : 'none',
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Panel de Habilidades Desplegable */}
        {!isCollapsed && (
          <div className="px-2 pb-2 pt-0.5 flex flex-col gap-1.5 border-t border-white/5">
            {/* Botón de Habilidad 1: Revelar Cartas (Ojo de Lince) */}
            <button
              onClick={handleActivateReveal}
              disabled={!isReady || cooldown}
              className="w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-left transition-all group cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                borderColor: isReady ? `${petDef.themeColor}88` : 'rgba(255,255,255,0.08)',
                background: isReady
                  ? `linear-gradient(135deg, ${petDef.themeColor}22 0%, rgba(20,28,45,0.6) 100%)`
                  : 'rgba(255,255,255,0.02)',
                boxShadow: isReady ? `0 0 12px ${petDef.glowColor}` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    borderColor: `${petDef.themeColor}55`,
                    background: `${petDef.themeColor}22`,
                    color: petDef.themeColor,
                  }}
                >
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-white leading-tight">
                    {petState.type === 'cat' ? 'Mirada Astral' : 'Ojo de Lince'}
                  </div>
                  <div className="text-[8px] font-mono text-slate-400">
                    Revela un par oculto
                  </div>
                </div>
              </div>

              {/* Atajo de teclado */}
              <kbd
                className="px-1.5 py-0.5 rounded text-[8px] font-mono border font-bold"
                style={{
                  borderColor: isReady ? `${petDef.themeColor}66` : 'rgba(255,255,255,0.1)',
                  color: isReady ? '#ffffff' : '#64748b',
                  background: isReady ? petDef.themeColor : 'rgba(255,255,255,0.04)',
                }}
              >
                [E / 1]
              </kbd>
            </button>

            {/* Botón de Habilidad 2: Pausa Temporal */}
            {onFreezeTime && (
              <button
                onClick={handleActivateFreeze}
                disabled={charge < 80 || cooldown}
                className="w-full px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-left transition-all group cursor-pointer disabled:cursor-not-allowed disabled:opacity-45"
                style={{
                  borderColor: charge >= 80 ? 'rgba(0,240,255,0.5)' : 'rgba(255,255,255,0.08)',
                  background: charge >= 80
                    ? 'linear-gradient(135deg, rgba(0,240,255,0.15) 0%, rgba(20,28,45,0.6) 100%)'
                    : 'rgba(255,255,255,0.02)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border border-cyan-400/40 bg-cyan-400/15 text-cyan-300">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-white leading-tight">
                      Pausa Temporal
                    </div>
                    <div className="text-[8px] font-mono text-slate-400">
                      Congela 6s de reloj
                    </div>
                  </div>
                </div>

                <kbd className="px-1.5 py-0.5 rounded text-[8px] font-mono border border-cyan-400/30 text-cyan-200 bg-cyan-400/20 font-bold">
                  [Q / 2]
                </kbd>
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
