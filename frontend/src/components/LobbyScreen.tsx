import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Users, Boxes, Infinity as InfinityIcon, Settings,
  Target, Skull, Gamepad2, LogOut, X, TrendingUp, Coins, Gem,
  Volume2, VolumeX, Play, Award, ChevronRight,
  Sparkles, Brain, Gift, Trophy, ArrowRightLeft, Shield, QrCode, Smartphone
} from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';
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
import { useEquippedRoomTheme } from '../lib/roomTheme';
import type { Player } from '../App';
import { apiFetch, getStoredUser } from '../lib/api';

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
    title: 'Modo Relaciones',
    icon: Sparkles,
    color: '#A855F7',
    glowColor: 'rgba(168, 85, 247, 0.4)',
  },
  {
    mode: 'ai-friends',
    code: '05',
    title: 'Multijugador en Línea (1v1)',
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
  const roomTheme = useEquippedRoomTheme();

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
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRanksModal, setShowRanksModal] = useState(false);
  const [showOperationsDrawer, setShowOperationsDrawer] = useState(false);
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

    const effectiveId = userId || getStoredUser()?.id;
    if (effectiveId) {
      apiFetch<{ user: any; stats: any }>(`/api/users/${effectiveId}`)
        .then(data => {
          const u = data.user || data;
          if (u.coins !== undefined) setCoins(u.coins);
          if (u.gems !== undefined) setGems(u.gems);
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

  const handleClaimDailyBonus = async () => {
    if (claimedBonus) return;
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('memorize_daily_bonus_date', today);
    setClaimedBonus(true);

    const effectiveId = userId || getStoredUser()?.id;
    if (effectiveId) {
      try {
        const res = await apiFetch<any>(`/api/users/${effectiveId}/daily-bonus`, { method: 'POST' });
        if (res.coins !== undefined) setCoins(res.coins);
        if (res.gems !== undefined) setGems(res.gems);
      } catch (err) {
        console.warn('Error persistiendo bono en BD:', err);
        setCoins(prev => prev + 150);
        setGems(prev => prev + 1);
      }
    } else {
      setCoins(prev => prev + 150);
      setGems(prev => prev + 1);
    }

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

  const handleClaimMission = async (missionId: string, rewardCoins: number, rewardGems = 0, rewardXP = 50) => {
    if (claimedMissions[missionId]) return;
    const nextClaims = { ...claimedMissions, [missionId]: true };
    setClaimedMissions(nextClaims);
    localStorage.setItem('memorize_daily_claims', JSON.stringify(nextClaims));

    const effectiveId = userId || getStoredUser()?.id;
    if (effectiveId) {
      try {
        const res = await apiFetch<any>(`/api/users/${effectiveId}/claim-mission`, {
          method: 'POST',
          body: JSON.stringify({ missionId, rewardCoins, rewardGems, rewardXP }),
        });
        if (res.coins !== undefined) setCoins(res.coins);
        if (res.gems !== undefined) setGems(res.gems);
      } catch (err) {
        console.warn('Error persistiendo misión en BD:', err);
        setCoins(prev => prev + rewardCoins);
        if (rewardGems > 0) setGems(prev => prev + rewardGems);
      }
    } else {
      setCoins(prev => prev + rewardCoins);
      if (rewardGems > 0) setGems(prev => prev + rewardGems);
    }

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
      className="h-[100dvh] w-full text-slate-200 flex flex-col overflow-hidden relative select-none font-sans transition-all duration-700"
      style={{
        backgroundImage: `url('${roomTheme.image}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Fondo adaptado al entorno equipado con resplandor cinematográfico */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${roomTheme.accent}14 0%, rgba(10, 16, 28, 0.72) 50%, #030508 100%)`,
        }}
      />
      {/* Resplandor focal sutil tras la mascota 3D en el Lobby */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[140px] opacity-25 pointer-events-none transition-all duration-700"
        style={{ background: roomTheme.accent }}
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
      <header className="h-14 sm:h-16 px-3 sm:px-8 flex items-center justify-between z-20 backdrop-blur-xl border-b border-white/5 bg-slate-950/60 shrink-0">
        {/* Logo del Juego */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border border-cyan-400/40 bg-cyan-950/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <span className="text-base sm:text-xl font-bold tracking-wider font-serif text-white">
              MEMORIZE
            </span>
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
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-medium tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            title={`Perfil de Usuario y Entorno Vinculado: ${roomTheme.name}`}
          >
            <span>PERFIL</span>
            <span className="text-[10px] opacity-80">{roomTheme.icon}</span>
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
        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 text-amber-200 text-xs font-mono font-bold backdrop-blur-sm" title="Monedas">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{coins.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 text-cyan-200 text-[11px] sm:text-xs font-mono font-bold backdrop-blur-sm" title="Gemas">
              <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span>{gems.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border border-purple-400/30 bg-purple-400/15 text-purple-200 text-[11px] sm:text-xs font-mono font-bold backdrop-blur-sm shadow-[0_0_12px_rgba(183,156,255,0.25)]" title="Cerebritos para tu compañero 3D">
              <Brain className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-300" />
              <span>{petState.brains}</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 pl-1.5 sm:pl-2 border-l border-white/10">
            <button
              onClick={() => { playSfx('click'); setShowQRModal(true); }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(53,224,200,0.2)]"
              title="Abrir juego en Celular con Código QR"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
              <span className="hidden xl:inline font-mono text-[10px] font-bold tracking-wider text-cyan-300">CELL QR</span>
            </button>
            <button
              onClick={toggleSound}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title={isMuted ? 'Habilitar sonido' : 'Silenciar sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { playSfx('click'); setShowMessages(true); }}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Buzón de transmisiones"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playSfx('click'); setShowSettings(true); }}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => { playSfx('click'); onLogout(); }}
              className="p-1.5 sm:p-2 rounded-xl text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ──────────────── 2. Escenario Heroico Abierto del Avatar 3D + HUD Flotante ──────────────── */}
      <main className="flex-grow flex flex-col justify-between relative z-10 w-full min-h-0 overflow-y-auto sm:overflow-hidden select-none">
        
        {/* ── BARRA SUPERIOR DE WIDGETS FLOTANTES (Bajo el Header) ── */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-3 flex items-start justify-between pointer-events-none z-20 shrink-0">
          
          {/* Lado Izquierdo: Expediente Rápido de Operador */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-auto flex flex-col gap-2 max-w-xs"
          >
            <div
              onClick={() => { playSfx('click'); onStartMode('profile'); }}
              className="px-3.5 py-2 rounded-2xl border border-white/10 bg-[#07090F]/70 backdrop-blur-xl flex items-center gap-3 shadow-xl hover:border-[#35E0C8]/50 hover:bg-[#0D1119]/80 transition-all cursor-pointer group"
              title="Abrir Perfil Completo"
            >
              <div className="relative w-9 h-9 rounded-xl border border-white/15 bg-slate-950 p-0.5 shrink-0">
                <img
                  alt="Avatar"
                  className="w-full h-full rounded-lg object-cover"
                  src={`https://api.dicebear.com/7.x/bottts/svg?seed=${operatorName}&backgroundColor=0d1119`}
                />
                <div className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full border border-cyan-400 bg-slate-950 text-[8px] font-mono font-bold text-cyan-300">
                  LV {playerStats.level}
                </div>
              </div>

              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white truncate">{operatorName}</h3>
                  <ChevronRight className="w-3 h-3 text-[#5C6675] group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div
                  className="text-[11px] font-mono font-semibold truncate"
                  style={{ color: currentRank.color }}
                >
                  {currentRank.name}
                </div>
                <div className="w-24 h-1 rounded-full overflow-hidden bg-white/10 mt-1">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      background: `linear-gradient(90deg, ${currentRank.color}, ${AN.signal})`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Pasiva del Compañero */}
            <div
              className="px-3 py-1.5 rounded-xl border backdrop-blur-md flex items-center gap-2 bg-[#07090F]/60 text-left"
              style={{ borderColor: `${petDef.themeColor}33` }}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: petDef.themeColor }} />
              <div className="min-w-0">
                <span className="text-[10px] font-mono font-bold block leading-none" style={{ color: petDef.themeColor }}>
                  {petDef.perkName}
                </span>
                <p className="text-[9px] text-slate-400 font-mono truncate">
                  {petDef.perkDesc}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Lado Derecho: Acciones Flotantes (Bono Diario y Misiones) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="pointer-events-auto flex items-center gap-2"
          >
            {/* Bono Diario */}
            <button
              onClick={handleClaimDailyBonus}
              className={`px-3.5 py-2 rounded-2xl border backdrop-blur-xl flex items-center gap-2 text-xs font-mono transition-all shadow-xl cursor-pointer ${
                claimedBonus
                  ? 'border-white/10 bg-[#07090F]/60 text-slate-400'
                  : 'border-amber-400/50 bg-amber-500/15 text-amber-200 shadow-[0_0_20px_rgba(255,215,0,0.25)] hover:scale-105'
              }`}
              title={claimedBonus ? 'Bono reclamado hoy' : 'Haz clic para reclamar tu bono diario'}
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="font-bold hidden sm:inline">
                {claimedBonus ? 'Bono Activo' : 'Reclamar Bono'}
              </span>
            </button>

            {/* Botón de Cajón de Misiones & Ranking */}
            <button
              onClick={() => { playSfx('click'); setShowOperationsDrawer(true); }}
              className="relative px-3.5 py-2 rounded-2xl border border-white/10 hover:border-cyan-400/50 bg-[#07090F]/70 hover:bg-[#0D1119]/90 backdrop-blur-xl flex items-center gap-2 text-xs font-mono text-white transition-all shadow-xl cursor-pointer group"
              title="Abrir Misiones y Clasificación"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold hidden sm:inline">Misiones & Ranking</span>
              {hasReadyMission && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </motion.div>
        </div>

        {/* ── ÁREA CENTRAL HEROICA: EL AVATAR 3D LIBRE EN EL ESCENARIO ── */}
        <div className="relative flex-1 w-full flex flex-col items-center justify-center my-auto min-h-0 pointer-events-auto">
          
          {/* Identidad Flotante del Compañero (posicionada arriba con holgura para no tapar orejas) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-[#07090F]/60 backdrop-blur-md shadow-lg -mt-3 sm:-mt-5 mb-4 sm:mb-6"
          >
            <span className="text-xl">{petState.type === 'cat' ? '🐱' : '🦊'}</span>
            <span className="font-serif text-sm font-bold text-white tracking-wide">
              {petState.nickname}
            </span>
            <span className="text-[#5C6675]">•</span>
            <span
              className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                color: petDef.themeColor,
                borderColor: `${petDef.themeColor}55`,
                background: `${petDef.themeColor}15`,
              }}
            >
              Fase {petStage}: {petStageInfo.title}
            </span>
            <button
              onClick={handleSwitchPet}
              className="ml-1 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={`Alternar a ${petState.type === 'fox' ? 'Gatito 🐱' : 'Zorro 🦊'}`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </motion.div>

          {/* Globo de diálogo flotante al interactuar */}
          <AnimatePresence>
            {petQuote && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                className="absolute top-12 sm:top-14 z-30 px-5 py-2.5 rounded-2xl border text-xs font-medium text-white shadow-2xl max-w-sm text-center"
                style={{
                  borderColor: petDef.themeColor,
                  background: 'rgba(8, 12, 22, 0.95)',
                  boxShadow: `0 0 25px ${petDef.glowColor}`,
                }}
              >
                {petQuote}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas 3D a tamaño heroico (100% libre, sin contenedor negro opaco) */}
          <div className="w-full flex-1 max-w-4xl min-h-[220px] sm:min-h-[340px] md:min-h-[400px] max-h-[540px] flex items-center justify-center relative select-none">
            <PetCanvas3D
              petType={petState.type}
              level={petState.level}
              isInteracting={isPetJumping}
              onPetClick={handlePetInteract}
              mode="lobby"
              accentColor={roomTheme.accent}
            />
          </div>

          {/* Pista interactiva debajo del pedestal */}
          <span className="text-[10px] font-mono text-slate-400/80 -mt-2 mb-1 pointer-events-none tracking-wider uppercase">
            Haz clic en el animal para interactuar
          </span>
        </div>

        {/* ── DOCK INFERIOR DE COMBATE (FLOTANTE ESTILO AAA) ── */}
        <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 pb-3 sm:pb-4 z-20 shrink-0">
          <div className="rounded-3xl border border-white/10 bg-[#07090F]/75 backdrop-blur-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-2.5 sm:gap-3 transition-all">
            
            {/* Fila 1: Progreso Evolutivo y Botón de Alimentar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-1">
              <div className="flex-1 w-full sm:w-auto">
                <div className="flex justify-between items-center text-[11px] font-mono mb-1">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" style={{ color: petDef.themeColor }} />
                    Progreso a Fase {petStage < 3 ? petStage + 1 : 'Máxima'}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {petState.xp} / {petXpNeeded} XP ({petXpProgress}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden bg-white/10">
                  <motion.div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${petXpProgress}%`,
                      background: `linear-gradient(90deg, ${petDef.themeColor}, #00F0FF)`,
                    }}
                  />
                </div>
              </div>

              {/* Botón de Alimentar con Cerebritos */}
              <button
                onClick={() => handleFeedPet(10)}
                className="w-full sm:w-auto px-4 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                style={{
                  background:
                    petState.brains >= 10
                      ? `linear-gradient(135deg, ${petDef.themeColor} 0%, #FFFFFF 100%)`
                      : 'rgba(255, 255, 255, 0.08)',
                  color: petState.brains >= 10 ? '#000000' : '#64748b',
                  boxShadow: petState.brains >= 10 ? `0 0 16px ${petDef.glowColor}` : 'none',
                }}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Alimentar (-10 🧠)</span>
              </button>
            </div>

            {/* Fila 2: Selector de Modos de Juego (Píldoras Flotantes) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                    className="rounded-2xl p-2 sm:p-2.5 text-center transition-all duration-200 border relative overflow-hidden group cursor-pointer last:col-span-2 sm:last:col-span-1"
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
                      className="w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 mb-1"
                      style={{
                        background: isSelected ? item.color : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#000000' : item.color,
                      }}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                    </div>

                    <h3 className="text-[11px] sm:text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
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

            {/* Fila 3: Gran Botón de Batalla "JUGAR" */}
            <button
              onClick={() => {
                playSfx('launch');
                onStartMode(activeMode.mode);
              }}
              className="w-full py-3 sm:py-3.5 px-6 rounded-2xl font-mono text-sm sm:text-base font-bold tracking-wider uppercase text-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl group cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${activeMode.color} 0%, #FFFFFF 100%)`,
                boxShadow: `0 0 30px ${activeMode.glowColor}`,
              }}
            >
              <Play className="w-5 h-5 fill-black group-hover:translate-x-0.5 transition-transform" />
              <span>JUGAR: {activeMode.title.toUpperCase()}</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

      </main>

      {/* ──────────────── Drawer Lateral: Centro de Operaciones & Misiones ──────────────── */}
      <AnimatePresence>
        {showOperationsDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop oscuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOperationsDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel lateral deslizante */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full max-w-md h-full bg-[#07090F]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto an-scroll z-10"
            >
              <div>
                {/* Header del Drawer */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white">Centro de Operaciones</h3>
                      <p className="font-mono text-[10px] text-slate-400">Misiones diarias y clasificación</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOperationsDrawer(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Bono Diario dentro del Drawer */}
                <div
                  onClick={handleClaimDailyBonus}
                  className={`p-3.5 rounded-2xl border mb-5 flex items-center justify-between transition-all ${
                    claimedBonus ? 'border-white/10 bg-white/[0.03]' : 'border-amber-400/50 bg-amber-500/10 cursor-pointer shadow-lg hover:scale-[1.02]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-serif text-xs font-bold text-white">Bono de Conexión Diario</div>
                      <div className="font-mono text-[10px] text-slate-400">+150 🪙 • +1 💎 • +25 🧠</div>
                    </div>
                  </div>
                  <button
                    disabled={claimedBonus}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                      claimedBonus
                        ? 'text-slate-500 bg-white/5'
                        : 'text-black bg-amber-400 shadow-[0_0_12px_rgba(255,215,0,0.4)] hover:brightness-110'
                    }`}
                  >
                    {claimedBonus ? 'Reclamado' : 'Reclamar'}
                  </button>
                </div>

                {/* Pestañas de Misiones / Ranking */}
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] p-1 mb-4">
                  <button
                    onClick={() => setSidebarTab('missions')}
                    className={`flex-1 py-1.5 rounded-full font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sidebarTab === 'missions'
                        ? 'bg-cyan-400 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Misiones</span>
                    {hasReadyMission && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => setSidebarTab('ranking')}
                    className={`flex-1 py-1.5 rounded-full font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      sidebarTab === 'ranking'
                        ? 'bg-cyan-400 text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Ranking</span>
                  </button>
                </div>

                {/* Contenido Misiones */}
                {sidebarTab === 'missions' ? (
                  <div className="space-y-3">
                    {dailyMissions.map((m) => {
                      const canClaim = m.isDone && !claimedMissions[m.id];
                      return (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-2xl border bg-black/30 backdrop-blur-md"
                          style={{
                            borderColor: canClaim ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className="text-xs font-bold text-white">{m.title}</h4>
                            <span className="font-mono text-[10px] text-amber-300">+{m.rewardCoins} 🪙</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mb-2.5 leading-snug">{m.desc}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/10">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${(m.current / m.target) * 100}%`,
                                  background: 'linear-gradient(90deg, #00F0FF, #35E0C8)',
                                }}
                              />
                            </div>
                            {canClaim && (
                              <button
                                onClick={() => handleClaimMission(m.id, m.rewardCoins, 0, 50)}
                                className="px-3 py-1 rounded-lg font-mono text-[10px] font-bold bg-cyan-400 text-black uppercase hover:scale-105 transition-transform shadow-md cursor-pointer"
                              >
                                Reclamar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[
                      { name: 'KRONOS_AI', score: '24,850', icon: '👑' },
                      { name: 'CYBER_VALKYRIE', score: '21,400', icon: '🥈' },
                      { name: 'NEURO_PHANTOM', score: '19,750', icon: '🥉' },
                      { name: operatorName, score: `${playerStats.totalScore || 3420}`, icon: '👤', isMe: true },
                    ].map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl border"
                        style={{
                          background: p.isMe ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                          borderColor: p.isMe ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{p.icon}</span>
                          <span className={`text-xs font-mono ${p.isMe ? 'text-cyan-300 font-bold' : 'text-slate-300'}`}>
                            {p.name} {p.isMe && '(Tú)'}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">{p.score} XP</span>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setShowOperationsDrawer(false);
                        playSfx('click');
                        onStartMode('ranked');
                      }}
                      className="w-full mt-3 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs font-mono text-cyan-300 hover:text-white transition-all text-center cursor-pointer"
                    >
                      Ver Clasificación Completa
                    </button>
                  </div>
                )}
              </div>

              {/* Pie del Drawer */}
              <div className="pt-4 border-t border-white/10 text-center font-mono text-[10px] text-slate-500">
                MEMORIZE ARCHIVE // SISTEMA DE OPERACIONES
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* Modal Código QR para Celular */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="Juega desde tu Celular"
        subtitle="Escanea el código con la cámara de tu teléfono para entrar a jugar"
      />
    </div>
  );
}
