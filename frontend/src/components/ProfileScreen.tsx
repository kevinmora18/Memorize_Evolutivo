import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Trophy, Zap, Award, Calendar, Star, Crown,
  Coins, Gem, Shield, Swords, Sparkles, Check, Edit2,
  RefreshCw, CheckCircle2, Flame, Bot, Layers, Globe
} from 'lucide-react';
import type { Player, Room } from '../App';
import { loadPlayerStats, getRankByXP, getNextRank, getProgressToNextRank, type PlayerStats } from '../lib/playerEvolution';
import { loadClassicProgress, totalStars, highestUnlocked, MAX_STARS, TOTAL_LEVELS } from '../lib/classicCampaign';
import { loadPetState, PETS, getPetStage } from '../lib/petSystem';
import { ROOM_THEMES, THEME_LIST, getEquippedRoomTheme, setEquippedRoomTheme, type RoomThemeDef } from '../lib/roomTheme';
import { apiFetch, getStoredUser } from '../lib/api';

interface ProfileScreenProps {
  onBack: () => void;
  currentUser?: Player | null;
  currentRoom?: Room | null;
  userId?: string;
}

const AVATARS = ['🧠', '⚡', '🦊', '🐱', '👑', '🐉', '🤖', '🔮', '🌟', '⚔️', '🛡️', '🌙'];

export function ProfileScreen({ onBack, currentUser, currentRoom, userId }: ProfileScreenProps) {
  const [dbUser, setDbUser] = useState<any>(null);
  // Cargar estadísticas reales del jugador
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());
  const [classicProgress, setClassicProgress] = useState(() => loadClassicProgress());
  const [petState, setPetState] = useState(() => loadPetState());

  // Fondo de Sala y Perfil Vinculado
  const [activeTheme, setActiveTheme] = useState<RoomThemeDef>(() => getEquippedRoomTheme());

  // Avatar y Nickname personalizables
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('operatorNickname') || (currentUser?.email ? currentUser.email.split('@')[0] : 'Operador');
  });
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(nickname);

  const [avatar, setAvatar] = useState(() => {
    return localStorage.getItem('operatorAvatar') || '🧠';
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    const s = loadPlayerStats();
    setStats(s);
    setClassicProgress(loadClassicProgress());
    setPetState(loadPetState());
    setActiveTheme(getEquippedRoomTheme());

    const stored = getStoredUser();
    const effectiveId = userId || currentUser?.id || stored?.id;
    if (effectiveId) {
      apiFetch<{ user: any; stats: any }>(`/api/users/${effectiveId}`)
        .then((data) => {
          if (data?.user) setDbUser(data.user);
          if (data?.stats) {
            setStats((prev) => ({
              ...prev,
              gamesPlayed: data.stats.gamesPlayed ?? prev.gamesPlayed,
              gamesWon: data.stats.gamesWon ?? prev.gamesWon,
              totalScore: data.stats.totalScore ?? prev.totalScore,
              highestCombo: data.stats.maxCombo ?? prev.highestCombo,
            }));
          }
        })
        .catch(() => {});
    }
  }, [userId, currentUser?.id]);

  // Escuchar cambios de tema de sala
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail) setActiveTheme(e.detail);
      else setActiveTheme(getEquippedRoomTheme());
    };
    window.addEventListener('roomThemeChanged', handleThemeChange);
    return () => window.removeEventListener('roomThemeChanged', handleThemeChange);
  }, []);

  const totalXP = dbUser?.xp ?? currentUser?.xp ?? stats.xp;
  const currentRank = getRankByXP(totalXP);
  const nextRank = getNextRank(currentRank.id);
  const progressToNext = getProgressToNextRank(totalXP);
  const calculatedLvl = Math.max(1, Math.floor(totalXP / 1000) + 1);
  const userLevel = currentUser?.level || calculatedLvl || stats.level || 1;

  const earnedStars = totalStars(classicProgress);
  const unlockedLvls = highestUnlocked(classicProgress);

  const gamesPlayed = stats.gamesPlayed || 0;
  const gamesWon = stats.gamesWon || 0;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const highestCombo = stats.highestCombo || 0;

  const petDef = PETS[petState.type];
  const petStageNum = getPetStage(petState.level);
  const petStageDef = petDef.stages[petStageNum - 1];

  const coins = dbUser?.coins ?? currentUser?.coins ?? 500;
  const gems = dbUser?.gems ?? currentUser?.gems ?? 10;

  const handleSelectTheme = (themeId: string) => {
    const updated = setEquippedRoomTheme(themeId);
    setActiveTheme(updated);
    try {
      const audio = new Audio('https://actions.google.com/sounds/v1/foley/swoosh.ogg');
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch {}
  };

  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      const clean = nicknameInput.trim().slice(0, 20);
      setNickname(clean);
      localStorage.setItem('operatorNickname', clean);
    }
    setIsEditingNickname(false);
  };

  const handleSelectAvatar = (av: string) => {
    setAvatar(av);
    localStorage.setItem('operatorAvatar', av);
    setShowAvatarPicker(false);
  };

  // Logros dinámicos basados en progreso real
  const achievements = [
    {
      icon: '🌱',
      title: 'Primeros Pasos',
      desc: 'Desbloquea el Reino de Verdalis',
      unlocked: unlockedLvls >= 1,
    },
    {
      icon: '⭐',
      title: 'Custodio Estelar',
      desc: 'Consigue al menos 10 estrellas',
      unlocked: earnedStars >= 10,
    },
    {
      icon: '⚡',
      title: 'Reflejos Sinápticos',
      desc: 'Alcanza un combo x4 o superior',
      unlocked: highestCombo >= 4,
    },
    {
      icon: '🐾',
      title: 'Vínculo Evolutivo',
      desc: 'Evoluciona a tu compañero neural',
      unlocked: petState.level >= 5,
    },
    {
      icon: '🏆',
      title: 'Veterano de Bóveda',
      desc: 'Gana 5 partidas de memoria',
      unlocked: gamesWon >= 5,
    },
    {
      icon: '👑',
      title: 'Corona del Archivo',
      desc: 'Completa los 10 niveles clásicos',
      unlocked: !!classicProgress.crown || unlockedLvls >= TOTAL_LEVELS,
    },
  ];

  return (
    <div
      className="min-h-screen text-[#E8E6DF] flex flex-col relative overflow-hidden select-none transition-all duration-700"
      style={{
        backgroundImage: `url('${activeTheme.image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay oscuro y viñeta para máxima legibilidad */}
      <div className="absolute inset-0 bg-[#07090F]/80 backdrop-blur-[2px]" />
      <div className="absolute inset-0 pointer-events-none an-grain-overlay" />
      <div className="absolute inset-0 pointer-events-none an-vignette" />

      {/* Resplandor del color de acento del tema de sala activo */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[130px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ background: activeTheme.accent }}
      />

      {/* HEADER SUPERIOR */}
      <header className="relative z-20 px-6 py-4 flex items-center justify-between border-b border-[#1E2836]/70 backdrop-blur-md bg-[#07090F]/80">
        <button
          onClick={onBack}
          className="an-focusable flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-[#1E2836] bg-[#0D1119]/80 text-[#9AA3B2] hover:text-[#E8E6DF] hover:border-[#35E0C8]/50 transition-all font-mono text-xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="uppercase tracking-widest">Volver al Lobby</span>
        </button>

        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#35E0C8] flex items-center justify-center gap-2">
            <span>EXPEDICIÓN DEL ARCHIVO</span>
            <span>//</span>
            <span>EXPEDIENTE DE OPERADOR</span>
          </div>
          <h1 className="font-serif text-2xl text-white font-bold tracking-tight">
            Perfil de Usuario
          </h1>
        </div>

        {/* Divisas del Usuario */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8B54A]/30 bg-[#0D1119]/80 font-mono text-xs text-[#E8B54A]">
            <Coins className="w-4 h-4" />
            <span className="font-bold">{coins.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#6EE7F5]/30 bg-[#0D1119]/80 font-mono text-xs text-[#6EE7F5]">
            <Gem className="w-4 h-4" />
            <span className="font-bold">{gems.toLocaleString()}</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="relative z-10 flex-1 px-4 py-6 max-w-6xl mx-auto w-full flex flex-col justify-between gap-6 overflow-y-auto an-scroll">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================================================================== */}
          {/* COLUMNA IZQUIERDA: TARJETA DE IDENTIDAD Y RANGO                   */}
          {/* ================================================================== */}
          <div className="lg:col-span-4 space-y-5">
            
            {/* Tarjeta de Identidad */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border border-[#1E2836] bg-[#0D1119]/90 backdrop-blur-xl relative overflow-hidden shadow-2xl text-center"
            >
              {/* Resplandor sutil */}
              <div
                className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: activeTheme.accent }}
              />

              {/* Avatar Selector */}
              <div className="relative inline-block mb-4">
                <button
                  onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1E2836] to-[#0D1119] border-2 flex items-center justify-center text-4xl shadow-xl hover:scale-105 transition-all cursor-pointer relative group"
                  style={{ borderColor: activeTheme.accent }}
                  title="Cambiar icono de avatar"
                >
                  <span>{avatar}</span>
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Edit2 className="w-5 h-5 text-white" />
                  </div>
                </button>

                {/* Badge de Nivel */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-mono font-bold text-[#07090F] shadow-md"
                  style={{ background: activeTheme.accent }}
                >
                  Nivel {userLevel}
                </div>

                {/* Modal selector de avatar */}
                <AnimatePresence>
                  {showAvatarPicker && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute left-1/2 -translate-x-1/2 top-28 z-50 p-3 rounded-2xl bg-[#0D1119] border border-[#35E0C8] shadow-2xl grid grid-cols-4 gap-2 w-52"
                    >
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          onClick={() => handleSelectAvatar(av)}
                          className="w-10 h-10 rounded-xl bg-[#131A26] hover:bg-[#1E2836] flex items-center justify-center text-xl transition-all cursor-pointer hover:scale-110"
                        >
                          {av}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Nombre / Nickname Editable */}
              <div className="mt-2 mb-1">
                {isEditingNickname ? (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                      maxLength={18}
                      className="px-2 py-1 rounded-lg bg-[#131A26] border border-[#35E0C8] text-white font-serif text-lg text-center focus:outline-none w-44"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveNickname}
                      className="p-1.5 rounded-lg bg-[#35E0C8] text-[#07090F] hover:bg-[#2BE08F] cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="font-serif text-2xl font-bold text-white tracking-wide">
                      {nickname}
                    </h2>
                    <button
                      onClick={() => {
                        setNicknameInput(nickname);
                        setIsEditingNickname(true);
                      }}
                      className="text-[#9AA3B2] hover:text-[#35E0C8] transition-colors cursor-pointer"
                      title="Editar apodo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="font-mono text-xs text-[#9AA3B2] mt-0.5 truncate max-w-xs mx-auto">
                  {currentUser?.email || 'operador@archivo.io'}
                </p>
                <div className="inline-block mt-1 font-mono text-[10px] text-[#5C6675] uppercase tracking-wider bg-[#07090F] px-2.5 py-0.5 rounded border border-[#1E2836]">
                  ID: {currentUser?.id ? currentUser.id.slice(0, 12).toUpperCase() : 'MNZ-OPERADOR'}
                </div>
              </div>

              {/* Rango y Progreso de XP */}
              <div className="mt-5 p-4 rounded-xl bg-[#07090F]/70 border border-[#1E2836] text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{currentRank.icon}</span>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-[#9AA3B2]">Rango Actual</div>
                      <div className="font-serif text-sm font-bold text-white">{currentRank.name}</div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold" style={{ color: currentRank.color }}>
                    {progressToNext}%
                  </span>
                </div>

                {/* Barra de progreso hacia el siguiente rango */}
                <div className="w-full h-2 bg-[#131A26] rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressToNext}%`,
                      background: `linear-gradient(90deg, #35E0C8, ${currentRank.color})`,
                    }}
                  />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-[#5C6675]">
                  <span>{totalXP.toLocaleString()} XP</span>
                  <span>{nextRank ? `${nextRank.minXP.toLocaleString()} XP (${nextRank.name})` : 'Rango Máximo'}</span>
                </div>
              </div>

              {/* Mascota Neural Vinculada */}
              <div className="mt-4 p-3.5 rounded-xl bg-[#131A26]/50 border border-[#1E2836] flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{petDef.id === 'fox' ? '🦊' : '🐱'}</span>
                  <div>
                    <div className="font-mono text-[10px] text-[#9AA3B2] uppercase">Compañero Neural</div>
                    <div className="font-serif text-xs font-bold text-white">
                      {petState.nickname || petDef.name} · Nivel {petState.level}
                    </div>
                    <div className="font-mono text-[9px] text-[#B79CFF]">{petStageDef.title}</div>
                  </div>
                </div>
                <div className="font-mono text-xs text-[#35E0C8] font-bold">
                  {petState.brains} 🧠
                </div>
              </div>
            </motion.div>

            {/* Ficha de Estadísticas de Partidas */}
            <div className="p-5 rounded-2xl border border-[#1E2836] bg-[#0D1119]/90 backdrop-blur-md">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Swords className="w-4 h-4 text-[#35E0C8]" />
                <span>Historial de Batalla</span>
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#1E2836]/50">
                  <span className="text-[#9AA3B2]">Partidas Jugadas</span>
                  <span className="font-bold text-white">{gamesPlayed}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1E2836]/50">
                  <span className="text-[#9AA3B2]">Victorias</span>
                  <span className="font-bold text-[#2BE08F]">{gamesWon}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1E2836]/50">
                  <span className="text-[#9AA3B2]">Efectividad</span>
                  <span className="font-bold text-[#35E0C8]">{winRate}%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#1E2836]/50">
                  <span className="text-[#9AA3B2]">Mejor Racha de Combo</span>
                  <span className="font-bold text-[#E8B54A]">x{highestCombo}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#9AA3B2]">Puntuación Total</span>
                  <span className="font-bold text-white">{stats.totalScore.toLocaleString()} pts</span>
                </div>
              </div>
            </div>

          </div>

          {/* ================================================================== */}
          {/* COLUMNA DERECHA: FONDO DE SALA VINCULADO + LOGROS                 */}
          {/* ================================================================== */}
          <div className="lg:col-span-8 space-y-6">

            {/* ================================================================ */}
            {/* VINCULACIÓN DE FONDO DE SALA Y PERFIL                            */}
            {/* ================================================================ */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-2xl border border-[#35E0C8]/40 bg-[#0D1119]/90 backdrop-blur-xl relative overflow-hidden shadow-2xl"
            >
              {/* Resplandor decorativo */}
              <div
                className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ background: activeTheme.accent }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 relative z-10">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-[#35E0C8] flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>ENTORNO GLOBAL Y SALAS VINCULADAS</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    Fondo de Perfil, Lobby y Salas
                  </h3>
                  <p className="font-mono text-xs text-[#9AA3B2] mt-0.5">
                    El bioma equipado aquí se sincroniza en todo el juego: adaptado con estilo único en el <span className="text-white font-bold">Lobby</span>, en tu <span className="text-white font-bold">Perfil</span>, al <span className="text-white font-bold">Crear/Explorar Salas</span> y en la <span className="text-white font-bold">Partida Multijugador</span>.
                  </p>
                </div>

                {/* Badge del tema actualmente activo */}
                <div
                  className="px-3 py-1.5 rounded-xl border flex items-center gap-2 font-mono text-xs font-bold shrink-0 self-start sm:self-auto"
                  style={{
                    borderColor: `${activeTheme.accent}80`,
                    background: `${activeTheme.accent}1A`,
                    color: activeTheme.accent,
                  }}
                >
                  <span>{activeTheme.icon}</span>
                  <span>{activeTheme.name} (Activo)</span>
                </div>
              </div>

              {/* Grid de Fondos Seleccionables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 relative z-10 mt-5">
                {THEME_LIST.map((theme) => {
                  const isSelected = activeTheme.id === theme.id;

                  return (
                    <motion.button
                      key={theme.id}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`group relative rounded-xl border p-3 text-left overflow-hidden transition-all duration-300 cursor-pointer flex flex-col justify-between h-36 ${
                        isSelected
                          ? 'border-white shadow-[0_0_20px_rgba(53,224,200,0.3)] ring-2 ring-white/50'
                          : 'border-[#1E2836] hover:border-[#35E0C8]/50 bg-[#07090F]'
                      }`}
                    >
                      {/* Miniatura de fondo */}
                      <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <img
                          src={theme.image}
                          alt={theme.name}
                          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                            isSelected ? 'brightness-[0.45] contrast-[1.1]' : 'brightness-[0.25] group-hover:brightness-[0.35]'
                          }`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E16] via-[#0A0E16]/60 to-transparent" />
                      </div>

                      {/* Header de la miniatura */}
                      <div className="relative z-10 flex items-center justify-between w-full">
                        <span className="text-xl">{theme.icon}</span>
                        {isSelected ? (
                          <span className="flex items-center gap-1 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#2BE08F] text-[#07090F] shadow-md animate-pulse">
                            <Check className="w-3 h-3 stroke-[3]" /> EQUIPADO
                          </span>
                        ) : (
                          <span className="font-mono text-[9px] text-[#9AA3B2] bg-[#07090F]/70 px-2 py-0.5 rounded border border-[#1E2836]">
                            {theme.badge}
                          </span>
                        )}
                      </div>

                      {/* Info inferior */}
                      <div className="relative z-10">
                        <div className="font-serif text-sm font-bold text-white group-hover:text-[#35E0C8] transition-colors truncate">
                          {theme.name}
                        </div>
                        <div className="font-mono text-[10px] text-[#9AA3B2] truncate">
                          {theme.subtitle}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* ================================================================ */}
            {/* PROGRESO DE CAMPAÑA Y EXPEDICIÓN                                */}
            {/* ================================================================ */}
            <div className="p-6 rounded-2xl border border-[#1E2836] bg-[#0D1119]/90 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#E8B54A]" />
                  <span>Progreso de la Campaña Clásica</span>
                </h3>
                <span className="font-mono text-xs font-bold text-[#E8B54A]">
                  {earnedStars} / {MAX_STARS} Estrellas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#07090F] border border-[#1E2836] text-center">
                  <div className="font-mono text-[10px] text-[#9AA3B2] uppercase">Fases Desbloqueadas</div>
                  <div className="font-mono text-lg font-bold text-white mt-0.5">
                    {unlockedLvls} / {TOTAL_LEVELS}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#07090F] border border-[#1E2836] text-center">
                  <div className="font-mono text-[10px] text-[#9AA3B2] uppercase">Estrellas</div>
                  <div className="font-mono text-lg font-bold text-[#E8B54A] mt-0.5">
                    {earnedStars} ⭐
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#07090F] border border-[#1E2836] text-center">
                  <div className="font-mono text-[10px] text-[#9AA3B2] uppercase">Reliquias</div>
                  <div className="font-mono text-lg font-bold text-[#35E0C8] mt-0.5">
                    {classicProgress.relics.length}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#07090F] border border-[#1E2836] text-center">
                  <div className="font-mono text-[10px] text-[#9AA3B2] uppercase">Poderes</div>
                  <div className="font-mono text-lg font-bold text-[#B79CFF] mt-0.5">
                    {classicProgress.powers.length} / 3
                  </div>
                </div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* LOGROS DE ARCHIVO                                                */}
            {/* ================================================================ */}
            <div className="p-6 rounded-2xl border border-[#1E2836] bg-[#0D1119]/90 backdrop-blur-md">
              <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#E8B54A]" />
                <span>Logros y Medallas de Archivo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {achievements.map((ach, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      ach.unlocked
                        ? 'border-[#E8B54A]/40 bg-[#131A26]/80 text-white'
                        : 'border-[#1E2836]/40 bg-[#07090F]/40 opacity-40'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{ach.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-serif text-xs font-bold text-white truncate">
                        <span>{ach.title}</span>
                        {ach.unlocked && <CheckCircle2 className="w-3 h-3 text-[#2BE08F] shrink-0" />}
                      </div>
                      <p className="font-mono text-[10px] text-[#9AA3B2] mt-0.5 line-clamp-2">
                        {ach.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
