import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, Lock, Star, Sparkles, Award, Zap,
  Clock, Layers, ArrowRight, Shield, Crown, Globe,
  CheckCircle2
} from 'lucide-react';
import {
  LEVELS, WINGS, WING_BY_ID, TOTAL_LEVELS, MAX_STARS,
  loadClassicProgress, isLevelUnlocked, totalStars, highestUnlocked,
  getLevel, levelMechanics, MECHANICS, POWERS, type LevelDef, type WingDef, type GameUniverse
} from '../lib/classicCampaign';
import { getCardById } from '../lib/cardCatalog';
import { CardArt } from './cards/CardArt';

interface ClassicLevelSelectProps {
  onSelectLevel: (level: number) => void;
  onBack: () => void;
  unlockedLevels?: number;
}

export function ClassicLevelSelect({ onSelectLevel, onBack }: ClassicLevelSelectProps) {
  const [progress, setProgress] = useState(loadClassicProgress);
  const highest = highestUnlocked(progress);
  const highestLevelDef = getLevel(highest);

  // Vista: 'worlds' (Selector de Mundos) o 'path' (Mapa de Niveles del Mundo)
  const [viewMode, setViewMode] = useState<'worlds' | 'path'>('worlds');
  const [activeWingId, setActiveWingId] = useState<GameUniverse>(highestLevelDef.wing);
  const [selectedLevel, setSelectedLevel] = useState<number>(highest);

  useEffect(() => {
    const updated = loadClassicProgress();
    setProgress(updated);
    const h = highestUnlocked(updated);
    const def = getLevel(h);
    setActiveWingId(def.wing);
    setSelectedLevel(h);
  }, []);

  const activeWing = WING_BY_ID[activeWingId];
  const activeWingLevels = LEVELS.filter((lvl) => lvl.wing === activeWingId);
  const currentLevelDef = getLevel(selectedLevel);
  const isSelectedUnlocked = isLevelUnlocked(progress, selectedLevel);
  const selectedRecord = progress.levels[selectedLevel];
  const relicCard = getCardById(currentLevelDef.relicId);
  const totalStarsCount = totalStars(progress);
  const mechanicsList = levelMechanics(currentLevelDef);

  const playSound = (src: string, vol = 0.3) => {
    try {
      const audio = new Audio(src);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch {
      /* Audio no disponible */
    }
  };

  const handleOpenWorld = (wing: WingDef) => {
    const wingLevels = LEVELS.filter((l) => l.wing === wing.id);
    const isUnlocked = wingLevels.some((l) => isLevelUnlocked(progress, l.level));
    if (!isUnlocked) return;

    playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.3);
    setActiveWingId(wing.id);

    // Seleccionar el nivel más alto desbloqueado de este mundo
    const unlockedInWing = wingLevels.filter((l) => isLevelUnlocked(progress, l.level));
    const targetLvl = unlockedInWing.length > 0 ? unlockedInWing[unlockedInWing.length - 1].level : wingLevels[0].level;
    setSelectedLevel(targetLvl);
    setViewMode('path');
  };

  const handleSelectLevel = (lvl: number) => {
    playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.25);
    setSelectedLevel(lvl);
  };

  const handleStartGame = () => {
    if (!isSelectedUnlocked) return;
    playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_pulse.ogg', 0.4);
    onSelectLevel(selectedLevel);
  };

  // Calcula estadísticas por mundo
  const getWingStats = (wing: WingDef) => {
    const wingLevels = LEVELS.filter((l) => l.wing === wing.id);
    const unlocked = wingLevels.some((l) => isLevelUnlocked(progress, l.level));
    const completed = wingLevels.every((l) => (progress.levels[l.level]?.clears ?? 0) > 0);
    const earnedStars = wingLevels.reduce((sum, l) => sum + (progress.levels[l.level]?.stars ?? 0), 0);
    const maxWingStars = wingLevels.length * 3;
    const minLevel = wingLevels[0]?.level ?? 1;
    const maxLevel = wingLevels[wingLevels.length - 1]?.level ?? 1;

    return { unlocked, completed, earnedStars, maxWingStars, minLevel, maxLevel, wingLevels };
  };

  return (
    <div
      className="min-h-screen text-[#E8E6DF] flex flex-col relative overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% -10%, rgba(53,224,200,0.08), transparent 50%), linear-gradient(180deg, #07090F 0%, #0A0E16 50%, #05070A 100%)',
      }}
    >
      {/* Fondo dinámico según la vista activa */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 mix-blend-screen transition-opacity duration-700">
        <picture>
          {viewMode === 'worlds' ? (
            <>
              <source type="image/avif" srcSet="/classic/map-hero-960.avif 960w, /classic/map-hero-1920.avif 1920w" sizes="100vw" />
              <source type="image/webp" srcSet="/classic/map-hero-960.webp 960w, /classic/map-hero-1920.webp 1920w" sizes="100vw" />
              <img
                src="/classic/map-hero-1920.webp"
                alt="Atlas del Archivo"
                className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.1]"
              />
            </>
          ) : (
            <>
              <source type="image/avif" srcSet={`${activeWing.art}-960.avif 960w, ${activeWing.art}-1920.avif 1920w`} sizes="100vw" />
              <source type="image/webp" srcSet={`${activeWing.art}-960.webp 960w, ${activeWing.art}-1920.webp 1920w`} sizes="100vw" />
              <img
                src={`${activeWing.art}-1920.webp`}
                alt={activeWing.name}
                className="w-full h-full object-cover filter brightness-[0.6] contrast-[1.15]"
              />
            </>
          )}
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-transparent to-[#07090F]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090F] via-transparent to-[#07090F]" />
      </div>

      {/* Efectos de viñeta y textura */}
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* Resplandor radial de color del mundo activo en modo sendero */}
      {viewMode === 'path' && (
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[120px] opacity-25 pointer-events-none transition-all duration-700"
          style={{ background: activeWing.accent }}
        />
      )}

      {/* HEADER SUPERIOR RESPONSIVE */}
      <header className="relative z-20 px-3 sm:px-6 py-2.5 sm:py-4 border-b border-[#1E2836]/70 backdrop-blur-md bg-[#07090F]/85">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          
          {/* Fila superior en móvil: Botón Volver + Badges de Progreso */}
          <div className="w-full sm:w-auto flex items-center justify-between gap-3">
            {viewMode === 'worlds' ? (
              <button
                onClick={onBack}
                className="an-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119]/80 text-[#9AA3B2] hover:text-[#E8E6DF] hover:border-[#35E0C8]/50 transition-all group cursor-pointer text-xs"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest font-semibold">Lobby</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.2);
                  setViewMode('worlds');
                }}
                className="an-focusable flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#35E0C8]/40 bg-[#0D1119]/90 text-[#35E0C8] hover:bg-[#35E0C8]/10 hover:border-[#35E0C8] transition-all group cursor-pointer text-xs shadow-[0_0_15px_rgba(53,224,200,0.15)]"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-mono text-[11px] sm:text-xs uppercase tracking-widest font-bold">Atlas de Mundos</span>
              </button>
            )}

            {viewMode === 'path' && (
              <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[#9AA3B2]">
                <span>/</span>
                <span className="text-white font-medium">{activeWing.name}</span>
              </div>
            )}

            {/* En móvil: badge de estrellas a la derecha de la fila superior para evitar colisión */}
            <div className="flex sm:hidden items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E8B54A]/40 bg-[#0D1119]/90 shadow-[0_0_12px_rgba(232,181,74,0.15)]"
                title={`${totalStarsCount} de ${MAX_STARS} estrellas`}
              >
                <Star className="w-3.5 h-3.5 text-[#E8B54A] fill-[#E8B54A]" />
                <span className="font-mono text-[11px] font-semibold text-[#E8B54A]">
                  {totalStarsCount} / {MAX_STARS}
                </span>
              </div>
              {progress.crown && (
                <div className="p-1 rounded-lg border border-[#E8B54A] bg-[#E8B54A]/10 text-[#E8B54A]">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          {/* Título Central */}
          <div className="text-center w-full sm:w-auto">
            <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] uppercase text-[#35E0C8] flex items-center justify-center gap-1.5 sm:gap-2">
              <span>EXPEDICIÓN DEL ARCHIVO</span>
              <span>//</span>
              <span>{viewMode === 'worlds' ? 'LOS 5 REINOS' : `ALA ${activeWing.roman}`}</span>
            </div>
            <h1 className="font-serif text-base sm:text-2xl tracking-wide text-white drop-shadow-md leading-tight mt-0.5">
              {viewMode === 'worlds' ? 'Selector de Mundos' : activeWing.name}
            </h1>
          </div>

          {/* Badges de progreso (Versión Desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#E8B54A]/40 bg-[#0D1119]/80 shadow-[0_0_15px_rgba(232,181,74,0.1)]"
              title={`${totalStarsCount} de ${MAX_STARS} estrellas conseguidas`}
            >
              <Star className="w-4 h-4 text-[#E8B54A] fill-[#E8B54A]" />
              <span className="font-mono text-xs font-semibold text-[#E8B54A]">
                {totalStarsCount} / {MAX_STARS}
              </span>
            </div>

            {progress.crown && (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8B54A] bg-[#E8B54A]/10 text-[#E8B54A]"
                title="¡Corona del Archivo conseguida!"
              >
                <Crown className="w-4 h-4" />
                <span className="font-mono text-xs font-bold tracking-wider hidden sm:inline">CORONADO</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 flex-1 px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full flex flex-col justify-between overflow-y-auto an-scroll">
        <AnimatePresence mode="wait">
          {/* ==================================================================== */}
          {/* VISTA 1: SELECTOR DE MUNDOS (ATLAS DE LOS 5 REINOS)                 */}
          {/* ==================================================================== */}
          {viewMode === 'worlds' ? (
            <motion.div
              key="worlds-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-between gap-4 sm:gap-6"
            >
              {/* Encabezado descriptivo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#1E2836]/50 pb-3 sm:pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-2xl text-white">
                    Elige un Reino para tu Incursión
                  </h2>
                  <p className="text-xs sm:text-sm text-[#9AA3B2] mt-0.5">
                    Cada mundo custodia reliquias únicas y anomalías que desafiarán tu memoria.
                  </p>
                </div>

                {/* Acceso rápido al nivel más alto disponible */}
                <button
                  onClick={() => handleOpenWorld(WING_BY_ID[highestLevelDef.wing])}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#35E0C8]/20 to-[#2BE08F]/20 border border-[#35E0C8]/50 text-[#35E0C8] hover:border-[#35E0C8] hover:shadow-[0_0_20px_rgba(53,224,200,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer font-mono text-xs uppercase tracking-wider font-semibold shrink-0"
                >
                  <span>Continuar Nivel {highest} ({highestLevelDef.title})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid de Mundos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch flex-1">
                {WINGS.map((wing, index) => {
                  const stats = getWingStats(wing);
                  const isCurrentWorld = highestLevelDef.wing === wing.id;

                  return (
                    <motion.div
                      key={wing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.4 }}
                      whileHover={stats.unlocked ? { y: -4, scale: 1.01 } : {}}
                      onClick={() => stats.unlocked && handleOpenWorld(wing)}
                      className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                        stats.unlocked
                          ? 'border-[#1E2836] hover:border-[color:var(--wing-accent)] bg-[#0D1119]/80 cursor-pointer shadow-lg hover:shadow-2xl'
                          : 'border-[#1E2836]/40 bg-[#07090F]/60 opacity-60 cursor-not-allowed'
                      }`}
                      style={{
                        '--wing-accent': wing.accent,
                        boxShadow: stats.unlocked && isCurrentWorld ? `0 0 25px ${wing.accent}22` : undefined,
                      } as any}
                    >
                      {/* Imagen de Fondo del Mundo con Zoom en Hover */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <picture>
                          <source type="image/avif" srcSet={`${wing.art}-960.avif`} />
                          <source type="image/webp" srcSet={`${wing.art}-960.webp`} />
                          <img
                            src={`${wing.art}-960.webp`}
                            alt={wing.name}
                            className={`w-full h-full object-cover transition-transform duration-700 ${
                              stats.unlocked
                                ? 'group-hover:scale-105 filter brightness-[0.4] group-hover:brightness-[0.55] contrast-[1.1]'
                                : 'filter grayscale brightness-[0.25]'
                            }`}
                          />
                        </picture>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E16] via-[#0A0E16]/80 to-transparent" />
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity duration-500 pointer-events-none"
                          style={{ background: wing.accent }}
                        />
                      </div>

                      {/* Header de la Tarjeta del Mundo */}
                      <div className="relative z-10 p-5 pb-2">
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-0.5 rounded-full border"
                            style={{
                              borderColor: stats.unlocked ? `${wing.accent}66` : '#2C3A4E',
                              background: stats.unlocked ? `${wing.accent}18` : '#131A26',
                              color: stats.unlocked ? wing.accent : '#5C6675',
                            }}
                          >
                            REINO {wing.roman}
                          </span>

                          {/* Estado del Mundo */}
                          {stats.completed ? (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#E8B54A] bg-[#E8B54A]/10 border border-[#E8B54A]/30 px-2 py-0.5 rounded-full">
                              <Crown className="w-3 h-3" /> DOMINADO
                            </span>
                          ) : !stats.unlocked ? (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#5C6675] bg-[#07090F]/80 border border-[#1E2836] px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" /> BLOQUEADO
                            </span>
                          ) : isCurrentWorld ? (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-[#35E0C8] bg-[#35E0C8]/10 border border-[#35E0C8]/30 px-2 py-0.5 rounded-full animate-pulse">
                              <Sparkles className="w-3 h-3" /> EN CURSO
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-mono text-[10px] text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                              <Globe className="w-3 h-3" /> DISPONIBLE
                            </span>
                          )}
                        </div>

                        <h3 className="font-serif text-2xl text-white group-hover:text-[color:var(--wing-accent)] transition-colors">
                          {wing.name}
                        </h3>
                        <p className="font-mono text-xs italic text-[#9AA3B2] mt-0.5" style={{ color: stats.unlocked ? `${wing.accent}CC` : undefined }}>
                          {wing.epithet}
                        </p>
                        <p className="text-xs text-[#9AA3B2] leading-relaxed mt-2.5 line-clamp-2">
                          {wing.lore}
                        </p>
                      </div>

                      {/* Footer de la Tarjeta del Mundo: Estrellas y Botón */}
                      <div className="relative z-10 p-5 pt-3 border-t border-[#1E2836]/60 bg-[#07090F]/40 backdrop-blur-sm">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono text-[11px] text-[#9AA3B2]">
                            Niveles {String(stats.minLevel).padStart(2, '0')} - {String(stats.maxLevel).padStart(2, '0')}
                          </span>
                          <div className="flex items-center gap-1 text-[#E8B54A] font-mono text-xs font-semibold">
                            <Star className="w-3.5 h-3.5 fill-[#E8B54A]" />
                            <span>{stats.earnedStars} / {stats.maxWingStars}</span>
                          </div>
                        </div>

                        {/* Barra de progreso de estrellas del mundo */}
                        <div className="w-full h-1.5 bg-[#131A26] rounded-full overflow-hidden mb-3">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(stats.earnedStars / stats.maxWingStars) * 100}%`,
                              background: stats.completed ? '#E8B54A' : wing.accent,
                            }}
                          />
                        </div>

                        {/* Botón de acción del mundo */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#9AA3B2]">
                            {stats.unlocked ? `${stats.wingLevels.length} Fases disponibles` : 'Custodia sellada'}
                          </span>
                          <div
                            className={`flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-transform ${
                              stats.unlocked
                                ? 'text-white group-hover:translate-x-1'
                                : 'text-[#5C6675]'
                            }`}
                            style={{ color: stats.unlocked ? wing.accent : undefined }}
                          >
                            <span>{stats.unlocked ? 'Explorar' : 'Cerrado'}</span>
                            {stats.unlocked ? <ArrowRight className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Barra de Poderes del Operador */}
              <div className="border-t border-[#1E2836]/60 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#9AA3B2]">
                <div className="flex items-center gap-2 font-mono">
                  <Zap className="w-4 h-4 text-[#35E0C8]" />
                  <span className="uppercase tracking-wider">Poderes del Operador:</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {Object.values(POWERS).map((p) => {
                    const hasPower = progress.powers.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors ${
                          hasPower
                            ? 'border-[#2C3A4E] bg-[#131A26] text-white shadow-sm'
                            : 'border-[#1E2836]/40 bg-[#07090F]/40 text-[#5C6675]'
                        }`}
                        title={`${p.name}: ${p.description} (Se desbloquea en Nivel ${p.unlockLevel})`}
                      >
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px]"
                          style={{
                            background: hasPower ? p.color : '#1E2836',
                            color: hasPower ? '#07090F' : '#5C6675',
                          }}
                        >
                          {p.hotkey}
                        </span>
                        <span>{p.name}</span>
                        {!hasPower && <span className="text-[10px] text-[#5C6675]">(Niv. {p.unlockLevel})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ==================================================================== */
            /* VISTA 2: MAPA DEL SENDERO DE NIVELES DEL MUNDO ACTIVO               */
            /* ==================================================================== */
            <motion.div
              key="path-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col justify-between gap-6"
            >
              {/* Barra de navegación de mundos horizontal (para saltar entre mundos fácilmente) */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                {WINGS.map((wing) => {
                  const stats = getWingStats(wing);
                  const isCurrent = activeWing.id === wing.id;

                  return (
                    <button
                      key={wing.id}
                      onClick={() => stats.unlocked && handleOpenWorld(wing)}
                      disabled={!stats.unlocked}
                      className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                        isCurrent
                          ? 'border-[color:var(--wing-accent)] bg-[#131A26]/90 shadow-md'
                          : stats.unlocked
                          ? 'border-[#1E2836] bg-[#0D1119]/60 hover:border-[#2C3A4E]'
                          : 'border-[#1E2836]/30 bg-[#07090F]/30 opacity-40 cursor-not-allowed'
                      }`}
                      style={{ '--wing-accent': wing.accent } as any}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">
                          ALA {wing.roman}
                        </span>
                        {stats.completed ? (
                          <Award className="w-3 h-3 text-[#E8B54A]" />
                        ) : !stats.unlocked ? (
                          <Lock className="w-3 h-3 text-[#5C6675]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full" style={{ background: wing.accent }} />
                        )}
                      </div>
                      <div className="font-serif text-sm text-white truncate font-medium mt-0.5">
                        {wing.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Escenario Central: Sendero de Niveles (Izquierda) + Dossier de Misión (Derecha) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
                {/* Columna Izquierda: Camino de Nodos de Niveles */}
                <div className="lg:col-span-5 flex flex-col justify-center gap-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="font-mono text-xs tracking-widest uppercase text-[#9AA3B2]">
                      Sendero de {activeWing.name}
                    </span>
                    <span className="font-mono text-xs text-[#35E0C8]">
                      {activeWingLevels.filter((l) => isLevelUnlocked(progress, l.level)).length} de {activeWingLevels.length} Desbloqueados
                    </span>
                  </div>

                  {/* Sendero con Nodos Interconectados */}
                  <div className="relative p-6 rounded-2xl border border-[#1E2836] bg-[#0D1119]/80 backdrop-blur-md flex flex-col gap-6">
                    {activeWingLevels.map((lvl, idx) => {
                      const isSelected = selectedLevel === lvl.level;
                      const isUnlockedLvl = isLevelUnlocked(progress, lvl.level);
                      const lvlRecord = progress.levels[lvl.level];
                      const stars = lvlRecord?.stars ?? 0;
                      const isLast = idx === activeWingLevels.length - 1;

                      return (
                        <div key={lvl.level} className="relative">
                          {/* Línea conectora entre nodos */}
                          {!isLast && (
                            <div className="absolute left-6 top-14 bottom-[-24px] w-0.5 bg-gradient-to-b from-[color:var(--wing-accent)] to-[#1E2836] opacity-60 z-0"
                              style={{ '--wing-accent': activeWing.accent } as any}
                            />
                          )}

                          <motion.div
                            whileHover={isUnlockedLvl ? { scale: 1.02 } : {}}
                            whileTap={isUnlockedLvl ? { scale: 0.98 } : {}}
                            onClick={() => isUnlockedLvl && handleSelectLevel(lvl.level)}
                            className={`p-4 rounded-xl border text-left transition-all duration-200 relative z-10 flex items-center justify-between gap-4 cursor-pointer ${
                              isSelected
                                ? 'border-white bg-[#1A2230] shadow-[0_0_20px_rgba(53,224,200,0.25)]'
                                : isUnlockedLvl
                                ? 'border-[#1E2836] bg-[#131A26]/70 hover:border-[#2C3A4E]'
                                : 'border-[#1E2836]/30 bg-[#07090F]/50 opacity-40 cursor-not-allowed'
                            }`}
                          >
                            {/* Nodo circular con número de nivel */}
                            <div className="flex items-center gap-3.5">
                              <div
                                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-bold shrink-0 shadow-md transition-all ${
                                  isSelected
                                    ? 'bg-white text-[#07090F] shadow-[0_0_15px_white]'
                                    : isUnlockedLvl
                                    ? 'border border-[color:var(--wing-accent)] text-white'
                                    : 'border border-[#1E2836] text-[#5C6675] bg-[#07090F]'
                                }`}
                                style={{
                                  background: isSelected ? 'white' : isUnlockedLvl ? `${activeWing.accent}22` : undefined,
                                  borderColor: isSelected ? 'white' : isUnlockedLvl ? activeWing.accent : undefined,
                                }}
                              >
                                <span className="text-[10px] uppercase text-[#9AA3B2] leading-none mb-0.5">NIV</span>
                                <span className="text-base leading-none">{String(lvl.level).padStart(2, '0')}</span>
                              </div>

                              <div>
                                <div className="font-serif text-base text-white font-medium flex items-center gap-2">
                                  <span>{lvl.title}</span>
                                  {isLast && (
                                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#E8B54A]/20 text-[#E8B54A] border border-[#E8B54A]/40 flex items-center gap-1">
                                      <Crown className="w-2.5 h-2.5" /> JEFE
                                    </span>
                                  )}
                                </div>
                                <div className="font-mono text-xs text-[#9AA3B2] mt-0.5 flex items-center gap-2">
                                  <span>{lvl.useTriads ? `${lvl.groups} Tríadas` : `${lvl.groups} Pares`}</span>
                                  <span>·</span>
                                  <span>{lvl.time}s</span>
                                </div>
                              </div>
                            </div>

                            {/* Estado y Estrellas */}
                            <div className="shrink-0 flex flex-col items-end gap-1">
                              {!isUnlockedLvl ? (
                                <Lock className="w-4 h-4 text-[#5C6675]" />
                              ) : stars > 0 ? (
                                <div className="flex gap-1">
                                  {[1, 2, 3].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${s <= stars ? 'text-[#E8B54A] fill-[#E8B54A]' : 'text-[#2C3A4E]'}`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="font-mono text-[9px] uppercase tracking-wider text-[#35E0C8] bg-[#35E0C8]/10 px-2 py-0.5 rounded border border-[#35E0C8]/30">
                                  DISPONIBLE
                                </span>
                              )}

                              {lvlRecord?.bestScore ? (
                                <span className="font-mono text-[10px] text-[#9AA3B2]">
                                  {lvlRecord.bestScore.toLocaleString()} pts
                                </span>
                              ) : null}
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Columna Derecha: Dossier de Misión para el Nivel Seleccionado */}
                <div className="lg:col-span-7 flex flex-col">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedLevel}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.25 }}
                      className="h-full flex flex-col justify-between rounded-2xl border border-[#1E2836] bg-[#0D1119]/90 backdrop-blur-xl p-6 relative overflow-hidden shadow-2xl"
                    >
                      {/* Resplandor de acento */}
                      <div
                        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none blur-3xl"
                        style={{ background: activeWing.accent }}
                      />

                      <div>
                        {/* Cabecera del Dossier */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-xs uppercase px-2.5 py-0.5 rounded border font-semibold"
                              style={{
                                borderColor: `${activeWing.accent}66`,
                                color: activeWing.accent,
                                background: `${activeWing.accent}14`,
                              }}
                            >
                              ALA {activeWing.roman} // {activeWing.name}
                            </span>
                            <span className="font-mono text-xs text-[#5C6675]">
                              Nivel {selectedLevel} de {TOTAL_LEVELS}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelectedUnlocked ? (
                              selectedRecord?.clears ? (
                                <span className="font-mono text-xs text-[#35E0C8] bg-[#35E0C8]/10 px-2.5 py-0.5 rounded border border-[#35E0C8]/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETADO
                                </span>
                              ) : (
                                <span className="font-mono text-xs text-[#E8B54A] bg-[#E8B54A]/10 px-2.5 py-0.5 rounded border border-[#E8B54A]/30">
                                  DISPONIBLE
                                </span>
                              )
                            ) : (
                              <span className="font-mono text-xs text-[#FF4D5E] bg-[#FF4D5E]/10 px-2.5 py-0.5 rounded border border-[#FF4D5E]/30 flex items-center gap-1">
                                <Lock className="w-3.5 h-3.5" /> BLOQUEADO
                              </span>
                            )}
                          </div>
                        </div>

                        <h2 className="font-serif text-3xl sm:text-4xl text-white mb-2 tracking-tight">
                          {currentLevelDef.title}
                        </h2>
                        <p className="text-sm text-[#9AA3B2] italic leading-relaxed mb-6">
                          "{currentLevelDef.lore}"
                        </p>

                        {/* Ficha técnica del Nivel */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                          <div className="p-3 rounded-xl border border-[#1E2836] bg-[#131A26]/60 flex items-center gap-3">
                            <Layers className="w-5 h-5 text-[#35E0C8]" />
                            <div>
                              <div className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">Objetivo</div>
                              <div className="font-mono text-sm font-bold text-white">
                                {currentLevelDef.useTriads ? `${currentLevelDef.groups} Tríadas` : `${currentLevelDef.groups} Pares`}
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-[#1E2836] bg-[#131A26]/60 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-[#E8B54A]" />
                            <div>
                              <div className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">Tiempo</div>
                              <div className="font-mono text-sm font-bold text-white">
                                {currentLevelDef.time}s
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-[#1E2836] bg-[#131A26]/60 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-[#B79CFF]" />
                            <div>
                              <div className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">Cuadrícula</div>
                              <div className="font-mono text-sm font-bold text-white">
                                {currentLevelDef.cols} Columnas
                              </div>
                            </div>
                          </div>

                          <div className="p-3 rounded-xl border border-[#1E2836] bg-[#131A26]/60 flex items-center gap-3">
                            <Star className="w-5 h-5 text-[#E8B54A]" />
                            <div>
                              <div className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2]">Récord</div>
                              <div className="font-mono text-sm font-bold text-white">
                                {selectedRecord?.bestScore ? `${selectedRecord.bestScore.toLocaleString()} pts` : '—'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Mecánicas y Peligros */}
                        <div className="mb-6">
                          <div className="font-mono text-[10px] uppercase tracking-widest text-[#9AA3B2] mb-2 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-[#35E0C8]" />
                            Mecánicas del Entorno
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {mechanicsList.length === 0 ? (
                              <span className="font-mono text-xs text-[#9AA3B2] bg-[#131A26] px-3 py-1.5 rounded-lg border border-[#1E2836]">
                                Custodia estándar · Sin anomalías
                              </span>
                            ) : (
                              mechanicsList.map((mId) => {
                                const mech = MECHANICS[mId];
                                return (
                                  <span
                                    key={mId}
                                    className="font-mono text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5"
                                    style={{
                                      borderColor: `${mech.color}55`,
                                      background: `${mech.color}15`,
                                      color: mech.color,
                                    }}
                                    title={mech.description}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: mech.color }} />
                                    {mech.name}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* Vista previa de Reliquia y Recompensas */}
                        <div className="p-4 rounded-xl border border-[#1E2836] bg-[#07090F]/70 flex items-center gap-4">
                          {relicCard && (
                            <div className="w-16 h-20 shrink-0 rounded-lg overflow-hidden border border-[#2C3A4E] shadow-md relative">
                              <CardArt artId={relicCard.id} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                              <span className="absolute bottom-1 left-1 right-1 font-mono text-[7px] text-white truncate text-center block">
                                {relicCard.name}
                              </span>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-[9px] uppercase tracking-wider text-[#E8B54A] flex items-center gap-1 mb-1">
                              <Sparkles className="w-3 h-3" />
                              Recompensa por 1ª Victoria
                            </div>
                            <div className="text-sm font-semibold text-white truncate">
                              {relicCard ? `Reliquia: ${relicCard.name}` : 'Custodia de Memoria'}
                            </div>
                            <div className="text-xs text-[#9AA3B2] truncate mt-0.5">
                              {currentLevelDef.unlocksPower ? (
                                <span className="text-[#35E0C8] font-mono font-medium">
                                  + Poder desbloqueado: {POWERS[currentLevelDef.unlocksPower].name}
                                </span>
                              ) : selectedLevel === TOTAL_LEVELS ? (
                                <span className="text-[#E8B54A] font-mono font-medium">
                                  + Corona del Archivo (Campaña Completa)
                                </span>
                              ) : (
                                <span>+ XP y Monedas acreditadas en tu perfil</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Botón Principal de Iniciar Nivel */}
                      <div className="pt-6 border-t border-[#1E2836]/60 flex items-center gap-4">
                        <motion.button
                          whileHover={isSelectedUnlocked ? { scale: 1.02 } : {}}
                          whileTap={isSelectedUnlocked ? { scale: 0.98 } : {}}
                          onClick={handleStartGame}
                          disabled={!isSelectedUnlocked}
                          className={`flex-1 py-4 px-6 rounded-xl font-mono text-sm uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-3 transition-all ${
                            isSelectedUnlocked
                              ? 'bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] shadow-[0_0_30px_rgba(53,224,200,0.4)] hover:shadow-[0_0_40px_rgba(53,224,200,0.6)] cursor-pointer'
                              : 'bg-[#131A26] text-[#5C6675] border border-[#1E2836] cursor-not-allowed'
                          }`}
                        >
                          {isSelectedUnlocked ? (
                            <>
                              <span>INICIAR CUSTODIA · NIVEL {selectedLevel}</span>
                              <Play className="w-4 h-4 fill-current" />
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4" />
                              <span>COMPLETA EL NIVEL {selectedLevel - 1} PARA DESBLOQUEAR</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
