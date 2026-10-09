// Sistema de Evolución del Jugador

export interface PlayerRank {
  id: number;
  name: string;
  icon: string;
  minXP: number;
  maxXP: number;
  color: string;
  gradient: string;
  description: string;
  rewards: string[];
}

export interface PlayerStats {
  xp: number;
  level: number;
  rankId: number;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestCombo: number;
  bossesDefeated: string[];
  unlockedSkins: string[];
  unlockedEffects: string[];
  unlockedPowers: string[];
}

export const RANKS: PlayerRank[] = [
  {
    id: 1,
    name: 'Mente Básica',
    icon: '🧠',
    minXP: 0,
    maxXP: 1000,
    color: '#9ca3af',
    gradient: 'from-gray-400 to-gray-600',
    description: 'Iniciando el viaje neural',
    rewards: ['Skin: Clásico', 'Efecto: Básico'],
  },
  {
    id: 2,
    name: 'Sinapsis Activa',
    icon: '⚡',
    minXP: 1000,
    maxXP: 3000,
    color: '#fbbf24',
    gradient: 'from-yellow-400 to-orange-500',
    description: 'Las conexiones comienzan a formarse',
    rewards: ['Skin: Eléctrico', 'Efecto: Chispas', 'Boss: Caos'],
  },
  {
    id: 3,
    name: 'Neuro Maestro',
    icon: '🎯',
    minXP: 3000,
    maxXP: 7000,
    color: '#3b82f6',
    gradient: 'from-blue-400 to-cyan-500',
    description: 'Dominio de patrones mentales',
    rewards: ['Skin: Maestro', 'Efecto: Aura', 'Boss: Congelante', 'Poder: Tiempo Extra'],
  },
  {
    id: 4,
    name: 'Cerebro Evolutivo',
    icon: '🧬',
    minXP: 7000,
    maxXP: 15000,
    color: '#a855f7',
    gradient: 'from-purple-400 to-pink-500',
    description: 'Evolución neural avanzada',
    rewards: ['Skin: Evolutivo', 'Efecto: Partículas', 'Boss: Ilusión', 'Boss: Neural', 'Poder: Visión'],
  },
  {
    id: 5,
    name: 'Memoria Suprema',
    icon: '👑',
    minXP: 15000,
    maxXP: 30000,
    color: '#ef4444',
    gradient: 'from-red-400 via-orange-500 to-yellow-500',
    description: 'Maestría absoluta de la mente',
    rewards: ['Skin: Supremo', 'Efecto: Legendario', 'Boss: Parásito', 'Poder: Escudo', 'Poder: Combo Infinito'],
  },
  {
    id: 6,
    name: 'Consciencia Cósmica',
    icon: '🌌',
    minXP: 30000,
    maxXP: 50000,
    color: '#8b5cf6',
    gradient: 'from-violet-500 via-purple-600 to-indigo-700',
    description: 'Trascendiendo los límites mentales',
    rewards: ['Skin: Cósmico', 'Efecto: Galaxia', 'Boss: Vacío', 'Poder: Ralentizar Tiempo', 'Pack: Universo'],
  },
  {
    id: 7,
    name: 'Mente Infinita',
    icon: '♾️',
    minXP: 50000,
    maxXP: 80000,
    color: '#06b6d4',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    description: 'Capacidad mental sin límites',
    rewards: ['Skin: Infinito', 'Efecto: Ondas Cuánticas', 'Boss: Dimensión', 'Poder: Visión Total', 'Pack: Cuántico'],
  },
  {
    id: 8,
    name: 'Guardián Neural',
    icon: '🛡️',
    minXP: 80000,
    maxXP: 120000,
    color: '#10b981',
    gradient: 'from-emerald-400 via-green-500 to-teal-600',
    description: 'Protector de la memoria universal',
    rewards: ['Skin: Guardián', 'Efecto: Escudo Energético', 'Boss: Titán', 'Poder: Inmunidad', 'Pack: Élite'],
  },
  {
    id: 9,
    name: 'Maestro Dimensional',
    icon: '🌀',
    minXP: 120000,
    maxXP: 180000,
    color: '#f59e0b',
    gradient: 'from-amber-400 via-orange-500 to-red-600',
    description: 'Dominando múltiples realidades',
    rewards: ['Skin: Dimensional', 'Efecto: Portal', 'Boss: Omnisciente', 'Poder: Multiverso', 'Pack: Legendario'],
  },
  {
    id: 10,
    name: 'Leyenda Eterna',
    icon: '✨',
    minXP: 180000,
    maxXP: Infinity,
    color: '#ec4899',
    gradient: 'from-pink-400 via-rose-500 to-purple-600',
    description: 'La perfección absoluta alcanzada',
    rewards: ['Skin: Eterno', 'Efecto: Aura Divina', 'Boss: Todos Desbloqueados', 'Poder: Omnipotencia', 'Pack: Mítico', 'Título: Leyenda'],
  },
];

export function getRankByXP(xp: number): PlayerRank {
  return RANKS.find(rank => xp >= rank.minXP && xp < rank.maxXP) || RANKS[0];
}

export function getNextRank(currentRankId: number): PlayerRank | null {
  return RANKS.find(rank => rank.id === currentRankId + 1) || null;
}

export function calculateXPForAction(action: string, value: number = 0): number {
  const xpTable: Record<string, number> = {
    'match': 10,
    'combo': 5,
    'level_complete': 50,
    'boss_defeat': 200,
    'perfect_game': 100,
    'challenge_complete': 75,
  };
  
  return (xpTable[action] || 0) + value;
}

export function getProgressToNextRank(xp: number): number {
  const currentRank = getRankByXP(xp);
  const nextRank = getNextRank(currentRank.id);
  
  if (!nextRank) return 100;
  
  const progress = ((xp - currentRank.minXP) / (nextRank.minXP - currentRank.minXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function initializePlayerStats(): PlayerStats {
  return {
    xp: 0,
    level: 1,
    rankId: 1,
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    highestCombo: 0,
    bossesDefeated: [],
    unlockedSkins: ['clasico'],
    unlockedEffects: ['basico'],
    unlockedPowers: [],
  };
}

export function savePlayerStats(stats: PlayerStats): void {
  localStorage.setItem('memorize_player_stats', JSON.stringify(stats));
}

export function loadPlayerStats(): PlayerStats {
  const saved = localStorage.getItem('memorize_player_stats');
  return saved ? JSON.parse(saved) : initializePlayerStats();
}

export function addXP(currentStats: PlayerStats, xp: number): PlayerStats {
  const newXP = currentStats.xp + xp;
  const newRank = getRankByXP(newXP);
  
  return {
    ...currentStats,
    xp: newXP,
    rankId: newRank.id,
  };
}
