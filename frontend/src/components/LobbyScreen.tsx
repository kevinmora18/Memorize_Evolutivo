import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Users, Boxes, Infinity as InfinityIcon, Settings,
  Target, Skull, Gamepad2, LogOut, X, TrendingUp, Coins, Gem,
  Volume2, VolumeX, Play, Award, CheckCircle2, ChevronRight,
  Sparkles, Brain, Gift, Trophy, Star, ArrowRightLeft, Heart, Shield
} from 'lucide-react';
import {
  loadPlayerStats, savePlayerStats, getRankByXP, getProgressToNextRank,
  getNextRank, type PlayerStats, RANKS
} from '../lib/playerEvolution';
import {
  loadClassicProgress, highestUnlocked, totalStars, getLevel
} from '../lib/classicCampaign';
import {
  loadPetState, addBrains, feedPet, switchPetType, type PetState,
  PETS, getPetStage, getXpForNextLevel
} from '../lib/petSystem';
import { PetCanvas3D } from './PetCanvas3D';
import { AN } from '../lib/archivoTokens';
import type { Player } from '../App';

interface LobbyScreenProps {
  onStartMode: (mode: string) => void;
  onLogout: () => void;
  userRole?: string;
  userId?: string;
  currentUser?: Player | null;
}

interface GameModeItem {
  mode: string;
  code: string;
  title: string;
  icon: typeof Boxes;
  color: string;
  glowColor: string;
}

const MODES: GameModeItem[] = [
  {
    mode: 'classic',
    code: '01',
    title: 'Expedición Clásica',
    icon: Boxes,
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.4)',
  },
  {
    mode: 'infinite',
    code: '02',
    title: 'Infinito Neuronal',
    icon: InfinityIcon,
    color: '#FFD700',
    glowColor: 'rgba(255, 215, 0, 0.4)',
  },
  {
    mode: 'challenge',
    code: '03',
    title: 'Desafíos de Archivo',
    icon: Target,
    color: '#FF7A00',
    glowColor: 'rgba(255, 122, 0, 0.4)',
  },
  {
    mode: 'boss',
    code: '04',
    title: 'Modo Tríadas',
    icon: Sparkles,
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
  },
  {
    mode: 'ai-friends',
    code: '05',
    title: 'Salas & Amigos IA',
    icon: Users,
    color: '#00FF9D',
    glowColor: 'rgba(0, 255, 157, 0.4)',
  },
];

function playSfx(type: 'hover' | 'click' | 'claim' | 'launch') {
  try {
    const isMuted = localStorage.getItem('memorize_sound_muted') === 'true';
    if (isMuted) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'hover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.03);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'claim') {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.1, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.1);
      });
    } else if (type === 'launch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch {
    // Audio context seguro
  }
}

export function LobbyScreen({ onStartMode, onLogout, userRole, userId, currentUser }: LobbyScreenProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5175';

  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [classicProgress, setClassicProgress] = useState(loadClassicProgress());
  const [coins, setCoins] = useState(currentUser?.coins ?? 500);
  const [gems, setGems] = useState(currentUser?.gems ?? 10);
  const [petState, setPetState] = useState<PetState>(() => loadPetState());

  const [selectedModeKey, setSelectedModeKey] = useState<string>('classic');
  const [sidebarTab, setSidebarTab] = useState<'missions' | 'ranking'>('missions');
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('memorize_sound_muted') === 'true');
  const [showMessages, setShowMessages] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState(false);
  const [claimedMissions, setClaimedMissions] = useState<Record<string, boolean>>({});
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Estados de interacción con el animal 3D
  const [petQuote, setPetQuote] = useState<string | null>(null);
  const [isPetJumping, setIsPetJumping] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolvedStage, setEvolvedStage] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const stats = loadPlayerStats();
    setPlayerStats(stats);
    setClassicProgress(loadClassicProgress());
    setPetState(loadPetState());

    const today = new Date().toISOString().slice(0, 10);
    const lastClaim = localStorage.getItem('memorize_daily_bonus_date');
    if (lastClaim === today) {
      setClaimedBonus(true);
    }

    try {
      const savedClaims = localStorage.getItem('memorize_daily_claims');
      if (savedClaims) {
        setClaimedMissions(JSON.parse(savedClaims));
      }
    } catch {
      // Ignorar error
    }

    if (userId) {
      fetch(`${API_BASE}/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.coins !== undefined) setCoins(data.coins);
          if (data.gems !== undefined) setGems(data.gems);
        })
        .catch(err => console.error('Error sincronizando divisas:', err));
    }
  }, [userId, API_BASE]);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem('memorize_sound_muted', String(next));
    if (!next) playSfx('click');
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3200);
  };

  const handleClaimDailyBonus = () => {
    if (claimedBonus) return;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('memorize_daily_bonus_date', today);
    setClaimedBonus(true);
    setCoins(prev => prev + 150);
    setGems(prev => prev + 1);

    const updatedPet = addBrains(25);
    setPetState(updatedPet);

    playSfx('claim');
    showNotification('¡Bono Diario: +150 🪙, +1 💎 y +25 🧠 cerebritos!');

    if (playerStats) {
      const updated = { ...playerStats, xp: playerStats.xp + 50 };
      savePlayerStats(updated);
      setPlayerStats(updated);
    }
  };

  const handleClaimMission = (missionId: string, rewardCoins: number, rewardGems = 0, rewardXP = 50) => {
    if (claimedMissions[missionId]) return;
    const nextClaims = { ...claimedMissions, [missionId]: true };
    setClaimedMissions(nextClaims);
    localStorage.setItem('memorize_daily_claims', JSON.stringify(nextClaims));

    setCoins(prev => prev + rewardCoins);
    if (rewardGems > 0) setGems(prev => prev + rewardGems);

    const updatedPet = addBrains(15);
    setPetState(updatedPet);

    playSfx('claim');
    showNotification(`¡Misión cumplida! +${rewardCoins} 🪙, +15 🧠 cerebritos`);

    if (playerStats) {
      const updated = { ...playerStats, xp: playerStats.xp + rewardXP };
      savePlayerStats(updated);
      setPlayerStats(updated);
    }
  };

  // Interacción al hacer clic en el animal 3D
  const handlePetInteract = () => {
    setIsPetJumping(true);
    setTimeout(() => setIsPetJumping(false), 900);

    const petDef = PETS[petState.type];
    const randomQuote = petDef.quotes[Math.floor(Math.random() * petDef.quotes.length)];
    setPetQuote(randomQuote);
    setTimeout(() => setPetQuote(null), 3500);

    playSfx('click');
  };

  // Alimentar a la mascota 3D con cerebritos
  const handleFeedPet = (cost = 10) => {
    if (petState.brains < cost) {
      showNotification('¡Necesitas al menos 10 cerebritos 🧠! Juega partidas para conseguir más.');
      return;
    }

    const res = feedPet(cost);
    if (!res) return;

    setPetState(res.newState);
    setIsPetJumping(true);
    setTimeout(() => setIsPetJumping(false), 900);
    playSfx('claim');

    if (res.evolved) {
      setEvolvedStage(res.newStage);
      setShowEvolutionModal(true);
    } else if (res.leveledUp) {
      showNotification(`¡${res.newState.nickname} ha subido al Nivel ${res.newLevel}! 🎉`);
    } else {
      showNotification(`¡${res.newState.nickname} saboreó los cerebritos! (+20 XP)`);
    }
  };

  // Alternar entre Zorro y Gato
  const handleSwitchPet = () => {
    const nextType = petState.type === 'fox' ? 'cat' : 'fox';
    const nextState = switchPetType(nextType);
    setPetState(nextState);
    showNotification(`¡Compañero cambiado a ${PETS[nextType].name}! 🐾`);
    playSfx('click');
  };

  if (!playerStats) return null;

  const currentRank = getRankByXP(playerStats.xp);
  const nextRank = getNextRank(currentRank.id);
  const progress = getProgressToNextRank(playerStats.xp);

  const rawEmail = currentUser?.email || 'operador@archivo.io';
  const operatorName = rawEmail.includes('@')
    ? rawEmail.split('@')[0].toUpperCase()
    : rawEmail.toUpperCase();

  const unlockedLvl = highestUnlocked(classicProgress);
  const totalStarsCount = totalStars(classicProgress);
  const nextLevelDef = getLevel(unlockedLvl);
  const totalGames = playerStats.gamesPlayed || 0;
  const highestComboVal = playerStats.highestCombo || 0;

  const activeMode = MODES.find(m => m.mode === selectedModeKey) || MODES[0];
  const petDef = PETS[petState.type];
  const petStage = getPetStage(petState.level);
  const petStageInfo = petDef.stages[petStage - 1];
  const petXpNeeded = getXpForNextLevel(petState.level);
  const petXpProgress = Math.min(100, Math.round((petState.xp / petXpNeeded) * 100));

  const dailyMissions = [
    {
      id: 'm1',
      title: 'Incursión Rápida',
      desc: 'Completa 1 partida hoy',
      current: Math.min(1, totalGames),
      target: 1,
      rewardCoins: 80,
      isDone: totalGames >= 1,
    },
    {
      id: 'm2',
      title: 'Cadena Sináptica',
      desc: 'Logra combo de 3+',
      current: Math.min(3, highestComboVal),
      target: 3,
      rewardCoins: 120,
      isDone: highestComboVal >= 3,
    },
    {
      id: 'm3',
      title: 'Custodio Estelar',
      desc: 'Gana estrellas en expedición',
      current: Math.min(1, totalStarsCount),
      target: 1,
      rewardCoins: 150,
      isDone: totalStarsCount >= 1,
    },
  ];

  const hasReadyMission = dailyMissions.some(m => m.isDone && !claimedMissions[m.id]);

  return (
    <div
      className="h-screen w-screen text-slate-200 flex flex-col overflow-hidden relative select-none font-sans"
      style={{
        backgroundImage: "url('/classic/map-hero-1920.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Fondo obsidiana cinematográfico */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 25%, rgba(10, 16, 28, 0.65) 0%, rgba(6, 8, 14, 0.92) 65%, #030508 100%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none an-grain-overlay opacity-25" />

      {/* Notificación flotante emergente */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-full backdrop-blur-xl border border-cyan-400/50 bg-slate-900/90 shadow-2xl text-sm font-medium text-white"
            style={{ boxShadow: '0 0 25px rgba(0,240,255,0.25)' }}
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────────── 1. Header Minimalista y Limpio ──────────────── */}
      <header className="h-16 px-6 sm:px-8 flex items-center justify-between z-20 backdrop-blur-xl border-b border-white/5 bg-slate-950/60 shrink-0">
        {/* Logo del Juego */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-cyan-400/40 bg-cyan-950/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider font-serif text-white">
                MEMORIZE
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-semibold">
                EVOLUTIVO
              </span>
            </div>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/5 rounded-full p-1">
          <button
            onClick={() => playSfx('click')}
            className="px-4 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-cyan-300 bg-cyan-400/15 border border-cyan-400/30 shadow-sm"
          >
            LOBBY
          </button>
          <button
            onClick={() => { playSfx('click'); onStartMode('tienda'); }}
            className="px-4 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            TIENDA
          </button>
          <button
            onClick={() => { playSfx('click'); onStartMode('ranked'); }}
            className="px-4 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            RANKED
          </button>
          <button
            onClick={() => { playSfx('click'); onStartMode('profile'); }}
            className="px-4 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            PERFIL
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => { playSfx('click'); onStartMode('admin'); }}
              className="px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
            >
              ADMIN
            </button>
          )}
        </nav>

        {/* Recursos y Utilidades (Monedas, Gemas, Cerebritos) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-200 text-xs font-mono font-bold backdrop-blur-sm" title="Monedas">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 text-xs font-mono font-bold backdrop-blur-sm" title="Gemas">
              <Gem className="w-3.5 h-3.5 text-cyan-400" />
              <span>{gems.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-400/30 bg-purple-400/15 text-purple-200 text-xs font-mono font-bold backdrop-blur-sm shadow-[0_0_12px_rgba(183,156,255,0.25)]" title="Cerebritos para tu compañero 3D">
              <Brain className="w-3.5 h-3.5 text-purple-300" />
              <span>{petState.brains}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isMuted ? 'Habilitar sonido' : 'Silenciar sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { playSfx('click'); setShowMessages(true); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Buzón de transmisiones"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playSfx('click'); setShowSettings(true); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playSfx('click'); onLogout(); }}
              className="p-2 rounded-xl text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────── 2. Área Principal: Mascota 3D Central + Centro de Operaciones ──────────────── */}
      <main className="flex-grow p-5 sm:p-6 lg:p-7 flex gap-6 z-10 min-h-0 overflow-hidden max-w-7xl w-full mx-auto">

        {/* ── SECTOR CENTRAL: EL ANIMAL 3D COMO CENTRO DEL LOBBY (68% del espacio) ── */}
        <section className="flex-1 flex flex-col justify-between min-h-0 relative">

          {/* Escenario 3D Central */}
          <div
            className="flex-1 rounded-3xl p-6 border backdrop-blur-2xl relative overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300"
            style={{
              borderColor: `${petDef.themeColor}55`,
              background: 'linear-gradient(180deg, rgba(14, 20, 32, 0.75) 0%, rgba(6, 9, 16, 0.95) 100%)',
              boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 40px ${petDef.glowColor}`,
            }}
          >
            {/* Halo de luz de fondo del color del animal */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
              style={{ background: petDef.themeColor, opacity: 0.16 }}
            />

            {/* Cabecera del Compañero 3D */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{petState.type === 'cat' ? '🐱' : '🦊'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
                      {petState.nickname}
                    </h2>
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
                      style={{
                        color: petDef.themeColor,
                        borderColor: `${petDef.themeColor}66`,
                        background: `${petDef.themeColor}15`,
                      }}
                    >
                      Fase {petStage}: {petStageInfo.title}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400">
                    {petDef.epithet} • Nivel {petState.level}
                  </p>
                </div>
              </div>

              {/* Botón de Cambiar Compañero (Zorro 🦊 <-> Gatito 🐱) */}
              <button
                onClick={handleSwitchPet}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/25 bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-slate-200 hover:text-white transition-all shadow-md group cursor-pointer"
                title={`Cambiar a ${petState.type === 'fox' ? 'Gatito Cuántico 🐱' : 'Zorro Neofox 🦊'}`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
                <span>
                  {petState.type === 'fox' ? 'Cambiar a Gatito 🐱' : 'Cambiar a Zorro 🦊'}
                </span>
              </button>
            </div>

            {/* Canvas 3D Interactivo (El Animal en el centro absoluto) */}
            <div className="relative flex-1 flex items-center justify-center my-2 min-h-[220px]">
              {/* Globo de diálogo flotante */}
              <AnimatePresence>
                {petQuote && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute -top-3 z-30 px-4 py-2 rounded-2xl border text-xs font-medium text-white shadow-2xl max-w-xs text-center"
                    style={{
                      borderColor: petDef.themeColor,
                      background: 'rgba(8, 12, 22, 0.95)',
                      boxShadow: `0 0 20px ${petDef.glowColor}`,
                    }}
                  >
                    {petQuote}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Renderizador Three.js 3D */}
              <div className="w-full h-full min-h-[220px] max-h-[360px] flex items-center justify-center">
                <PetCanvas3D
                  petType={petState.type}
                  level={petState.level}
                  isInteracting={isPetJumping}
                  onPetClick={handlePetInteract}
                />
              </div>

              <span className="absolute bottom-1 text-[10px] font-mono text-slate-500 pointer-events-none">
                Haz clic en el animal para interactuar
              </span>
            </div>

            {/* Barra de Progresión y Controles de Alimentación */}
            <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col gap-3">
              {/* Barra de Experiencia */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" style={{ color: petDef.themeColor }} />
                    Progreso a Fase {petStage < 3 ? petStage + 1 : 'Máxima'}
                  </span>
                  <span className="text-slate-400">
                    {petState.xp} / {petXpNeeded} XP ({petXpProgress}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${petXpProgress}%`,
                      background: `linear-gradient(90deg, ${petDef.themeColor}, #00F0FF)`,
                    }}
                  />
                </div>
              </div>

              {/* Botón de Alimentar + Botón de Jugar */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => handleFeedPet(10)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    background:
                      petState.brains >= 10
                        ? `linear-gradient(135deg, ${petDef.themeColor} 0%, #FFFFFF 100%)`
                        : 'rgba(255, 255, 255, 0.08)',
                    color: petState.brains >= 10 ? '#000000' : '#64748b',
                    boxShadow: petState.brains >= 10 ? `0 0 16px ${petDef.glowColor}` : 'none',
                  }}
                >
                  <Brain className="w-4 h-4" />
                  <span>Alimentar (-10 🧠)</span>
                </button>

                {/* Gran Botón de Jugar con el Modo Seleccionado */}
                <button
                  onClick={() => {
                    playSfx('launch');
                    onStartMode(activeMode.mode);
                  }}
                  className="w-full sm:flex-1 py-3 px-6 rounded-2xl font-mono text-sm font-bold tracking-wider uppercase text-black flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl group cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${activeMode.color} 0%, #FFFFFF 100%)`,
                    boxShadow: `0 0 30px ${activeMode.glowColor}`,
                  }}
                >
                  <Play className="w-4 h-4 fill-black group-hover:translate-x-0.5 transition-transform" />
                  <span>JUGAR: {activeMode.title.toUpperCase()}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Modos Limpio (Píldoras Rápidas, sin especificaciones largas) */}
          <div className="grid grid-cols-5 gap-2.5 mt-3 shrink-0">
            {MODES.map((item) => {
              const isSelected = selectedModeKey === item.mode;
              const IconComp = item.icon;

              return (
                <button
                  key={item.mode}
                  onMouseEnter={() => playSfx('hover')}
                  onClick={() => {
                    playSfx('click');
                    setSelectedModeKey(item.mode);
                  }}
                  onDoubleClick={() => {
                    playSfx('launch');
                    onStartMode(item.mode);
                  }}
                  className="rounded-2xl p-2.5 text-center transition-all duration-200 border relative overflow-hidden group cursor-pointer"
                  style={{
                    background: isSelected
                      ? 'linear-gradient(180deg, rgba(20, 30, 48, 0.95) 0%, rgba(10, 15, 26, 0.95) 100%)'
                      : 'rgba(10, 15, 26, 0.65)',
                    borderColor: isSelected ? item.color : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isSelected ? `0 0 16px ${item.glowColor}` : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <div
                    className="w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 mb-1"
                    style={{
                      background: isSelected ? item.color : 'rgba(255, 255, 255, 0.05)',
                      color: isSelected ? '#000000' : item.color,
                    }}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>

                  <h3 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h3>

                  {isSelected && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ background: item.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── SECTOR DERECHO: Centro de Operaciones & Misiones (32% del espacio) ── */}
        <aside className="w-80 sm:w-84 flex flex-col gap-3 shrink-0 min-h-0 overflow-y-auto an-scroll pr-1">

          {/* Tarjeta de Perfil Compacta */}
          <div
            onClick={() => { playSfx('click'); onStartMode('profile'); }}
            className="rounded-2xl p-3 border border-white/10 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden group cursor-pointer hover:border-cyan-400/40 transition-all shrink-0"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl border border-white/15 bg-slate-950 p-1 shrink-0">
                <img
                  alt="Avatar"
                  className="w-full h-full rounded-lg object-cover"
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${operatorName}&backgroundColor=0d1119`}
                />
                <div className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full border border-cyan-400 bg-slate-950 text-[8px] font-mono font-bold text-cyan-300">
                  LV {playerStats.level}
                </div>
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white truncate">{operatorName}</h3>
                  <span className="text-xs">{currentRank.icon}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSfx('click');
                    setShowRanksModal(true);
                  }}
                  className="text-[11px] font-mono font-semibold truncate hover:underline block text-left"
                  style={{ color: currentRank.color }}
                >
                  {currentRank.name}
                </button>
                <div className="w-full h-1 rounded-full overflow-hidden bg-white/10 mt-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${AN.signal}, ${currentRank.color})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Habilidad Pasiva del Animal Activo */}
          <div
            className="rounded-2xl p-2.5 border backdrop-blur-xl flex items-center gap-2.5 shrink-0"
            style={{
              borderColor: `${petDef.themeColor}33`,
              background: 'rgba(10, 15, 26, 0.65)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
              style={{
                borderColor: petDef.themeColor,
                background: petDef.accentBg,
              }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: petDef.themeColor }} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono font-bold block leading-none" style={{ color: petDef.themeColor }}>
                {petDef.perkName}
              </span>
              <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">
                {petDef.perkDesc}
              </p>
            </div>
          </div>

          {/* Bono Diario Elegante */}
          <div
            className="rounded-2xl p-2.5 border backdrop-blur-xl flex items-center justify-between transition-all shrink-0"
            style={{
              borderColor: claimedBonus ? 'rgba(255,255,255,0.06)' : 'rgba(255, 215, 0, 0.4)',
              background: claimedBonus ? 'rgba(10, 15, 26, 0.5)' : 'linear-gradient(90deg, rgba(255,215,0,0.12) 0%, rgba(10,15,26,0.7) 100%)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                style={{
                  borderColor: claimedBonus ? 'rgba(255,255,255,0.1)' : AN.gold,
                  background: claimedBonus ? 'rgba(255,255,255,0.04)' : 'rgba(255,215,0,0.15)',
                }}
              >
                <Gift className="w-3.5 h-3.5" color={claimedBonus ? '#64748b' : AN.gold} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">Bono de Conexión</h4>
                <p className="text-[9px] text-slate-400 font-mono">
                  {claimedBonus ? 'Reclamado hoy' : '+150 🪙, +1 💎, +25 🧠'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClaimDailyBonus}
              disabled={claimedBonus}
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0"
              style={{
                background: claimedBonus ? 'rgba(255,255,255,0.05)' : AN.gold,
                color: claimedBonus ? '#64748b' : '#000000',
                cursor: claimedBonus ? 'default' : 'pointer',
                boxShadow: claimedBonus ? 'none' : '0 0 12px rgba(255,215,0,0.3)',
              }}
            >
              {claimedBonus ? 'Listo ✓' : 'RECLAMAR'}
            </button>
          </div>

          {/* Panel Unificado de Misiones / Ranking (Con Pestañas) */}
          <div className="flex-1 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col min-h-0 overflow-hidden shadow-xl">
            {/* Cabecera de Pestañas */}
            <div className="flex border-b border-white/10 p-1 bg-black/20 shrink-0">
              <button
                onClick={() => { playSfx('click'); setSidebarTab('missions'); }}
                className={`flex-1 py-1 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'missions'
                    ? 'bg-white/10 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3 h-3" />
                <span>Misiones</span>
                {hasReadyMission && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </button>

              <button
                onClick={() => { playSfx('click'); setSidebarTab('ranking'); }}
                className={`flex-1 py-1 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'ranking'
                    ? 'bg-white/10 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3 h-3" />
                <span>Ranking</span>
              </button>
            </div>

            {/* Contenido de la Pestaña */}
            <div className="p-3 flex-1 overflow-y-auto an-scroll">
              {sidebarTab === 'missions' ? (
                <div className="space-y-2">
                  {dailyMissions.map((m) => {
                    const isClaimed = claimedMissions[m.id];
                    const canClaim = m.isDone && !isClaimed;

                    return (
                      <div
                        key={m.id}
                        className="p-2 rounded-xl border bg-black/25 transition-all"
                        style={{
                          borderColor: canClaim ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="text-[11px] font-semibold text-white">{m.title}</h4>
                          <span className="text-[9px] font-mono text-amber-300 font-bold">
                            +{m.rewardCoins} 🪙 +15 🧠
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">{m.desc}</p>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="w-full h-1 rounded-full overflow-hidden bg-white/10">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(m.current / m.target) * 100}%`,
                                  background: m.isDone ? AN.signal : AN.gold,
                                }}
                              />
                            </div>
                          </div>

                          {canClaim && (
                            <button
                              onClick={() => handleClaimMission(m.id, m.rewardCoins, 0, 50)}
                              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-400 text-black uppercase hover:scale-105 transition-transform"
                            >
                              Reclamar
                            </button>
                          )}
                          {isClaimed && (
                            <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-cyan-400" /> Listo
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {[
                    { name: 'KRONOS_AI', score: '24,850', icon: '👑' },
                    { name: 'CYBER_VALKYRIE', score: '21,400', icon: '🥈' },
                    { name: 'NEURO_PHANTOM', score: '19,750', icon: '🥉' },
                    { name: operatorName, score: `${playerStats.totalScore || 3420}`, icon: '👤', isMe: true },
                  ].map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-1.5 rounded-xl border"
                      style={{
                        background: p.isMe ? 'rgba(0, 240, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                        borderColor: p.isMe ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255,255,255,0.04)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs">{p.icon}</span>
                        <span className={`text-[11px] font-mono truncate ${p.isMe ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                          {p.name} {p.isMe && '(Tú)'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{p.score} XP</span>
                    </div>
                  ))}

                  <button
                    onClick={() => { playSfx('click'); onStartMode('ranked'); }}
                    className="w-full mt-2 py-1.5 rounded-xl border border-white/10 hover:border-white/20 text-[10px] font-mono text-slate-300 hover:text-white transition-all text-center"
                  >
                    Ver Clasificación Completa
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

      </main>

      {/* ──────────────── Modal: Celebración de Evolución ──────────────── */}
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

      {/* ──────────────── Modal: Transmisiones ──────────────── */}
      {showMessages && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowMessages(false)}
        >
          <div
            className="rounded-3xl p-6 max-w-lg w-full border border-white/15 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-cyan-400" />
                Buzón del Archivo
              </h3>
              <button onClick={() => setShowMessages(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-cyan-400/30 bg-cyan-950/20">
                <div className="flex justify-between text-[10px] font-mono text-cyan-300 mb-1">
                  <span>SISTEMA // COMPAÑEROS 3D</span>
                  <span>Hoy</span>
                </div>
                <h4 className="text-sm font-bold text-white">¡Animal 3D en el Centro del Lobby!</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tu compañero ahora ocupa el escenario central en 3D interactivo. Aliméntalo con cerebritos para que evolucione y te otorgue ventajas en tus partidas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Modal: Ajustes ──────────────── */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowSettings(false)}
        >
          <div
            className="rounded-3xl p-6 max-w-md w-full border border-white/15 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                Ajustes de Sonido
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={toggleSound}
                className="w-full py-2.5 rounded-xl border text-xs font-mono font-medium transition-colors"
                style={{
                  borderColor: isMuted ? 'rgba(255,255,255,0.1)' : AN.signal,
                  background: isMuted ? 'rgba(255,255,255,0.05)' : 'rgba(0,240,255,0.12)',
                  color: isMuted ? '#94a3b8' : AN.signal,
                }}
              >
                {isMuted ? '🔊 Habilitar Sonido' : '🔇 Silenciar Efectos'}
              </button>
              <button
                onClick={() => playSfx('claim')}
                className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                🎵 Probar Sonido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Modal: Camino de la Evolución (Rangos) ──────────────── */}
      {showRanksModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowRanksModal(false)}
        >
          <div
            className="rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto an-scroll border border-white/15 bg-slate-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 sticky top-0 pb-3 border-b border-white/10 bg-slate-950 z-20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold font-serif text-white">Camino de la Evolución</h3>
              </div>
              <button onClick={() => setShowRanksModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {RANKS.map((rank) => {
                const isCurrent = currentRank.id === rank.id;
                const isPassed = playerStats.xp >= rank.minXP;

                return (
                  <div
                    key={rank.id}
                    className="p-3.5 rounded-2xl border flex gap-3.5 transition-all"
                    style={{
                      borderColor: isCurrent ? `${rank.color}AA` : 'rgba(255,255,255,0.06)',
                      background: isCurrent ? `${rank.color}15` : 'rgba(255,255,255,0.02)',
                      opacity: isCurrent ? 1 : isPassed ? 0.85 : 0.45,
                    }}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl border border-white/10 bg-slate-900 shrink-0">
                      {rank.icon}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-sm font-bold" style={{ color: isCurrent ? rank.color : '#FFFFFF' }}>
                          {rank.name}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">{rank.minXP.toLocaleString()} XP</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{rank.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {rank.rewards.map((r, idx) => (
                          <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-300">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
