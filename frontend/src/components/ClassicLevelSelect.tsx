import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Play, Lock, Star, Sparkles, Award, Zap,
  Compass, Flame, Shield, Clock, Layers, ArrowRight
} from 'lucide-react';
import {
  LEVELS, WINGS, WING_BY_ID, TOTAL_LEVELS, MAX_STARS,
  loadClassicProgress, isLevelUnlocked, totalStars, highestUnlocked,
  getLevel, levelMechanics, MECHANICS, POWERS, type LevelDef, type WingDef
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
  const [selectedLevel, setSelectedLevel] = useState<number>(highest);

  useEffect(() => {
    const updated = loadClassicProgress();
    setProgress(updated);
    setSelectedLevel(highestUnlocked(updated));
  }, []);

  const currentLevelDef = getLevel(selectedLevel);
  const currentWing = WING_BY_ID[currentLevelDef.wing];
  const unlocked = isLevelUnlocked(progress, selectedLevel);
  const record = progress.levels[selectedLevel];
  const relicCard = getCardById(currentLevelDef.relicId);
  const unlockedStarsCount = totalStars(progress);
  const mechanicsList = levelMechanics(currentLevelDef);

  const playSound = (src: string, vol = 0.3) => {
    try {
      const audio = new Audio(src);
      audio.volume = vol;
      audio.play().catch(() => {});
    } catch {
      /* audio no disponible */
    }
  };

  const handleSelectLevel = (lvl: number) => {
    playSound('https://actions.google.com/sounds/v1/foley/swoosh.ogg', 0.25);
    setSelectedLevel(lvl);
  };

  const handleStartGame = () => {
    if (!unlocked) return;
    playSound('https://actions.google.com/sounds/v1/scifi/sci_fi_pulse.ogg', 0.4);
    onSelectLevel(selectedLevel);
  };

  return (
    <div
      className="min-h-screen text-[#E8E6DF] flex flex-col relative overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% -10%, rgba(53,224,200,0.06), transparent 50%), linear-gradient(180deg, #07090F 0%, #0A0E16 50%, #05070A 100%)',
      }}
    >
      {/* Background Hero Illustration with soft zoom */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 mix-blend-screen">
        <picture>
          <source type="image/avif" srcSet="/classic/map-hero-960.avif 960w, /classic/map-hero-1920.avif 1920w" sizes="100vw" />
          <source type="image/webp" srcSet="/classic/map-hero-960.webp 960w, /classic/map-hero-1920.webp 1920w" sizes="100vw" />
          <img
            src="/classic/map-hero-1920.webp"
            alt="Expedición del Archivo"
            className="w-full h-full object-cover filter brightness-[0.7] contrast-[1.1]"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#07090F] via-transparent to-[#07090F]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07090F] via-transparent to-[#07090F]" />
      </div>

      {/* Grain and Vignette */}
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* Top Header */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between border-b border-[#1E2836]/60 backdrop-blur-md bg-[#07090F]/70">
        <button
          onClick={onBack}
          className="an-focusable flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119]/80 text-[#9AA3B2] hover:text-[#E8E6DF] hover:border-[#35E0C8]/50 transition-all group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-mono text-xs uppercase tracking-widest">Lobby</span>
        </button>

        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#35E0C8] flex items-center justify-center gap-2">
            <span>ALA DE CUSTODIA</span>
            <span>//</span>
            <span>EXPEDICIÓN DEL ARCHIVO</span>
          </div>
          <h1 className="font-serif text-2xl tracking-wide text-white drop-shadow-md">
            Ruta de los 5 Reinos
          </h1>
        </div>

        {/* Campaign Stats Badge */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E8B54A]/40 bg-[#0D1119]/80"
            title={`${unlockedStarsCount} de ${MAX_STARS} estrellas conseguidas`}
          >
            <Star className="w-4 h-4 text-[#E8B54A] fill-[#E8B54A]" />
            <span className="font-mono text-xs font-semibold text-[#E8B54A]">
              {unlockedStarsCount} / {MAX_STARS}
            </span>
          </div>

          {progress.crown && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8B54A] bg-[#E8B54A]/10 text-[#E8B54A]"
              title="Corona del Archivo: ¡Campaña Clásica completada!"
            >
              <Award className="w-4 h-4" />
              <span className="font-mono text-xs font-bold tracking-wider hidden sm:inline">CORONADO</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Campaign Selector */}
      <main className="relative z-10 flex-1 px-4 py-6 max-w-7xl mx-auto w-full flex flex-col justify-between gap-6 overflow-y-auto an-scroll">

        {/* Wings Progress Bar */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 px-1">
          {WINGS.map((wing) => {
            const wingLevels = LEVELS.filter((l) => l.wing === wing.id);
            const isWingActive = currentWing.id === wing.id;
            const wingUnlocked = wingLevels.some((l) => isLevelUnlocked(progress, l.level));
            const wingCompleted = wingLevels.every((l) => (progress.levels[l.level]?.clears ?? 0) > 0);

            return (
              <button
                key={wing.id}
                onClick={() => handleSelectLevel(wingLevels[0].level)}
                className={`flex-1 min-w-[130px] p-2.5 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group ${
                  isWingActive
                    ? 'border-[color:var(--wing-accent)] bg-[#131A26]/90 shadow-lg'
                    : wingUnlocked
                    ? 'border-[#1E2836] bg-[#0D1119]/70 hover:border-[#2C3A4E]'
                    : 'border-[#1E2836]/40 bg-[#07090F]/50 opacity-50 cursor-not-allowed'
                }`}
                style={{ '--wing-accent': wing.accent } as any}
              >
                {/* Active glow */}
                {isWingActive && (
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ background: `radial-gradient(circle at center, ${wing.accent}, transparent 75%)` }}
                  />
                )}

                <div className="flex items-center justify-between mb-1 relative z-10">
                  <span className="font-mono text-[10px] tracking-widest text-[#9AA3B2]">
                    ALA {wing.roman}
                  </span>
                  {wingCompleted ? (
                    <Award className="w-3.5 h-3.5 text-[#E8B54A]" />
                  ) : !wingUnlocked ? (
                    <Lock className="w-3 h-3 text-[#5C6675]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full" style={{ background: wing.accent }} />
                  )}
                </div>

                <div className="font-serif text-base text-white truncate relative z-10">
                  {wing.name}
                </div>

                <div className="flex items-center gap-1.5 mt-2 relative z-10">
                  {wingLevels.map((lvl) => {
                    const starsEarned = progress.levels[lvl.level]?.stars ?? 0;
                    const isSelected = selectedLevel === lvl.level;
                    return (
                      <div
                        key={lvl.level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          isSelected
                            ? 'bg-white shadow-[0_0_8px_white]'
                            : starsEarned > 0
                            ? 'bg-[#E8B54A]'
                            : isLevelUnlocked(progress, lvl.level)
                            ? 'bg-[#2C3A4E]'
                            : 'bg-[#1E2836]/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Central Stage: Level Node Cards + Detailed Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">

          {/* Left Column: Interactive Level Journey (1 to 10 nodes) */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-2.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="font-mono text-xs tracking-widest uppercase text-[#9AA3B2]">
                Registros de Custodia (10 Niveles)
              </span>
              <span className="font-mono text-xs text-[#35E0C8]">
                {highest} / {TOTAL_LEVELS} desbloqueados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl.level;
                const isUnlockedLvl = isLevelUnlocked(progress, lvl.level);
                const lvlRecord = progress.levels[lvl.level];
                const stars = lvlRecord?.stars ?? 0;
                const wing = WING_BY_ID[lvl.wing];

                return (
                  <motion.button
                    key={lvl.level}
                    whileHover={isUnlockedLvl ? { scale: 1.02 } : {}}
                    whileTap={isUnlockedLvl ? { scale: 0.98 } : {}}
                    onClick={() => isUnlockedLvl && handleSelectLevel(lvl.level)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between h-[86px] ${
                      isSelected
                        ? 'border-white bg-[#1A2230] shadow-[0_0_20px_rgba(53,224,200,0.2)]'
                        : isUnlockedLvl
                        ? 'border-[#1E2836] bg-[#0D1119]/80 hover:border-[#2C3A4E]'
                        : 'border-[#1E2836]/30 bg-[#07090F]/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {/* Level Number & Wing badge */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: isSelected ? 'white' : '#131A26',
                            color: isSelected ? '#07090F' : wing.accent,
                          }}
                        >
                          {String(lvl.level).padStart(2, '0')}
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-[#9AA3B2] truncate max-w-[90px]">
                          {wing.name}
                        </span>
                      </div>

                      {/* Status / Stars */}
                      {!isUnlockedLvl ? (
                        <Lock className="w-3.5 h-3.5 text-[#5C6675]" />
                      ) : stars > 0 ? (
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= stars ? 'text-[#E8B54A] fill-[#E8B54A]' : 'text-[#2C3A4E]'}`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="font-mono text-[8px] uppercase tracking-widest text-[#35E0C8] bg-[#35E0C8]/10 px-1.5 py-0.5 rounded">
                          NUEVO
                        </span>
                      )}
                    </div>

                    {/* Level Name */}
                    <div className="font-serif text-sm text-white truncate font-medium">
                      {lvl.title}
                    </div>

                    {/* Quick tag: pairs vs triads */}
                    <div className="flex items-center justify-between text-[10px] text-[#9AA3B2] font-mono">
                      <span>{lvl.useTriads ? `${lvl.groups} Tríadas` : `${lvl.groups} Pares`}</span>
                      <span>{lvl.time}s</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mission Dossier for Selected Level */}
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
                {/* Wing Accent Light Glow */}
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none blur-3xl"
                  style={{ background: currentWing.accent }}
                />

                {/* Top Dossier Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs uppercase px-2.5 py-0.5 rounded border"
                        style={{
                          borderColor: `${currentWing.accent}66`,
                          color: currentWing.accent,
                          background: `${currentWing.accent}14`,
                        }}
                      >
                        ALA {currentWing.roman} // {currentWing.name}
                      </span>
                      <span className="font-mono text-xs text-[#5C6675]">
                        Nivel {selectedLevel} de {TOTAL_LEVELS}
                      </span>
                    </div>

                    {/* Unlock status */}
                    <div className="flex items-center gap-2">
                      {unlocked ? (
                        record?.clears ? (
                          <span className="font-mono text-xs text-[#35E0C8] bg-[#35E0C8]/10 px-2 py-0.5 rounded border border-[#35E0C8]/30 flex items-center gap-1">
                            <Award className="w-3 h-3" /> COMPLETADO
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-[#E8B54A] bg-[#E8B54A]/10 px-2 py-0.5 rounded border border-[#E8B54A]/30">
                            DISPONIBLE
                          </span>
                        )
                      ) : (
                        <span className="font-mono text-xs text-[#FF4D5E] bg-[#FF4D5E]/10 px-2 py-0.5 rounded border border-[#FF4D5E]/30 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> BLOQUEADO
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

                  {/* Level Specs Grid */}
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
                          {record?.bestScore ? `${record.bestScore.toLocaleString()} pts` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mechanics & Anomalies Encountered */}
                  <div className="mb-6">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-[#9AA3B2] mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#35E0C8]" />
                      Mecánicas y Peligros del Archivo
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

                  {/* Rewards Preview Section */}
                  <div className="p-4 rounded-xl border border-[#1E2836] bg-[#07090F]/70 flex items-center gap-4">
                    {/* Relic Art Card Thumbnail */}
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

                {/* Big Action Button */}
                <div className="pt-6 border-t border-[#1E2836]/60 flex items-center gap-4">
                  <motion.button
                    whileHover={unlocked ? { scale: 1.02 } : {}}
                    whileTap={unlocked ? { scale: 0.98 } : {}}
                    onClick={handleStartGame}
                    disabled={!unlocked}
                    className={`flex-1 py-4 px-6 rounded-xl font-mono text-sm uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-3 transition-all ${
                      unlocked
                        ? 'bg-gradient-to-r from-[#35E0C8] to-[#2BE08F] text-[#07090F] shadow-[0_0_30px_rgba(53,224,200,0.4)] hover:shadow-[0_0_40px_rgba(53,224,200,0.6)] cursor-pointer'
                        : 'bg-[#131A26] text-[#5C6675] border border-[#1E2836] cursor-not-allowed'
                    }`}
                  >
                    {unlocked ? (
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

        {/* Powers Showcase Bar */}
        <div className="border-t border-[#1E2836]/60 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#9AA3B2]">
          <div className="flex items-center gap-2 font-mono">
            <Compass className="w-4 h-4 text-[#35E0C8]" />
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
                      ? 'border-[#2C3A4E] bg-[#131A26] text-white'
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
                  {!hasPower && (
                    <span className="text-[10px] text-[#5C6675]">
                      (Niv. {p.unlockLevel})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
