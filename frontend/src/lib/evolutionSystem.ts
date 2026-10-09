// Sistema de Evolución del Jugador

export type PlayerRank = 
  | 'mente-basica'
  | 'sinapsis-activa'
  | 'neuro-maestro'
  | 'cerebro-evolutivo'
  | 'memoria-suprema';

export type BossType = 
  | 'caos'
  | 'congelante'
  | 'ilusion'
  | 'neural'
  | 'parasito';

export interface RankInfo {
  id: PlayerRank;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  gradient: string;
  icon: string;
  description: string;
  unlocks: string[];
}

export interface BossInfo {
  id: BossType;
  name: string;
  emoji: string;
  description: string;
  gradient: string;
  bgGradient: string;
  glowColor: string;
  abilities: string[];
  difficulty: number;
  requiredRank: PlayerRank;
}

export interface PlayerProgress {
  xp: number;
  rank: PlayerRank;
  level: number;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestCombo: number;
  defeatedBosses: BossType[];
  unlockedSkins: string[];
  unlockedEffects: string[];
  unlockedPowers: string[];
}

// Definición de rangos
export const RANKS: Record<PlayerRank, RankInfo> = {
  'mente-basica': {
    id: 'mente-basica',
    name: 'Mente Básica',
    minXP: 0,
    maxXP: 1000,
    color: '#9ca3af',
    gradient: 'from-gray-500 to-gray-600',
    icon: '🧠',
    description: 'Iniciando el camino de la evolución mental',
    unlocks: ['Skin Básico', 'Efecto Chispa']
  },
  'sinapsis-activa': {
    id: 'sinapsis-activa',
    name: 'Sinapsis Activa',
    minXP: 1000,
    maxXP: 3000,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '⚡',
    description: 'Las conexiones neuronales se fortalecen',
    unlocks: ['Boss Caos', 'Skin Eléctrico', 'Efecto Rayo', 'Poder: Tiempo Extra']
  },
  'neuro-maestro': {
    id: 'neuro-maestro',
    name: 'Neuro Maestro',
    minXP: 3000,
    maxXP: 7000,
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-pink-500',
    icon: '🎯',
    description: 'Dominio avanzado de la memoria',
    unlocks: ['Boss Congelante', 'Boss Ilusión', 'Skin Místico', 'Efecto Aura', 'Poder: Visión']
  },
  'cerebro-evolutivo': {
    id: 'cerebro-evolutivo',
    name: 'Cerebro Evolutivo',
    minXP: 7000,
    maxXP: 15000,
    color: '#f59e0b',
    gradient: 'from-orange-500 to-red-500',
    icon: '🔥',
    description: 'Evolución cerebral en su máximo esplendor',
    unlocks: ['Boss Neural', 'Skin Legendario', 'Efecto Explosión', 'Poder: Escudo Mental']
  },
  'memoria-suprema': {
    id: 'memoria-suprema',
    name: 'Memoria Suprema',
    minXP: 15000,
    maxXP: Infinity,
    color: '#fbbf24',
    gradient: 'from-yellow-400 via-amber-500 to-orange-600',
    icon: '👑',
    description: 'El pináculo de la evolución mental',
    unlocks: ['Boss Parásito', 'Skin Supremo', 'Efecto Divino', 'Poder: Omnisciencia', 'Todos los Bosses']
  }
};

// Definición de jefes
export const BOSSES: Record<BossType, BossInfo> = {
  'caos': {
    id: 'caos',
    name: 'Caos el Desordenado',
    emoji: '🌀',
    description: 'Mezcla las cartas constantemente',
    gradient: 'from-red-600 via-orange-600 to-yellow-600',
    bgGradient: 'from-red-950 via-orange-950 to-black',
    glowColor: '#ff4500',
    abilities: ['Mezcla cartas cada 15s', 'Aumenta velocidad', 'Crea distorsión visual'],
    difficulty: 2,
    requiredRank: 'sinapsis-activa'
  },
  'congelante': {
    id: 'congelante',
    name: 'Glacius el Congelante',
    emoji: '❄️',
    description: 'Congela cartas temporalmente',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    bgGradient: 'from-cyan-950 via-blue-950 to-black',
    glowColor: '#00d4ff',
    abilities: ['Congela cartas 5s', 'Ralentiza tiempo', 'Crea niebla helada'],
    difficulty: 3,
    requiredRank: 'neuro-maestro'
  },
  'ilusion': {
    id: 'ilusion',
    name: 'Mirage el Ilusionista',
    emoji: '👁️',
    description: 'Crea cartas falsas y duplicados',
    gradient: 'from-purple-500 via-pink-500 to-purple-600',
    bgGradient: 'from-purple-950 via-pink-950 to-black',
    glowColor: '#b19cd9',
    abilities: ['Crea cartas falsas', 'Duplica símbolos', 'Distorsiona colores'],
    difficulty: 4,
    requiredRank: 'neuro-maestro'
  },
  'neural': {
    id: 'neural',
    name: 'Synapse el Neural',
    emoji: '⚡',
    description: 'Aumenta la velocidad del juego',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    bgGradient: 'from-emerald-950 via-teal-950 to-black',
    glowColor: '#00ff88',
    abilities: ['Acelera el tiempo', 'Pulsos eléctricos', 'Sobrecarga neural'],
    difficulty: 5,
    requiredRank: 'cerebro-evolutivo'
  },
  'parasito': {
    id: 'parasito',
    name: 'Vortex el Parásito',
    emoji: '☠️',
    description: 'Roba tiempo con cada error',
    gradient: 'from-gray-700 via-purple-900 to-black',
    bgGradient: 'from-gray-950 via-purple-950 to-black',
    glowColor: '#8b5cf6',
    abilities: ['Roba 5s por error', 'Drena energía', 'Corrupción mental'],
    difficulty: 6,
    requiredRank: 'memoria-suprema'
  }
};

// Funciones del sistema
export function calculateRank(xp: number): PlayerRank {
  if (xp >= RANKS['memoria-suprema'].minXP) return 'memoria-suprema';
  if (xp >= RANKS['cerebro-evolutivo'].minXP) return 'cerebro-evolutivo';
  if (xp >= RANKS['neuro-maestro'].minXP) return 'neuro-maestro';
  if (xp >= RANKS['sinapsis-activa'].minXP) return 'sinapsis-activa';
  return 'mente-basica';
}

export function getXPForAction(action: string, value?: number): number {
  const xpTable: Record<string, number> = {
    'match': 10,
    'combo': 25,
    'level-complete': 100,
    'boss-defeat': 500,
    'perfect-game': 200,
    'no-errors': 150,
    'speed-bonus': 50,
  };
  
  return (xpTable[action] || 0) * (value || 1);
}

export function getProgressToNextRank(xp: number): number {
  const currentRank = calculateRank(xp);
  const rankInfo = RANKS[currentRank];
  
  if (rankInfo.maxXP === Infinity) return 100;
  
  const progress = ((xp - rankInfo.minXP) / (rankInfo.maxXP - rankInfo.minXP)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function getAvailableBosses(rank: PlayerRank): BossType[] {
  const rankOrder: PlayerRank[] = ['mente-basica', 'sinapsis-activa', 'neuro-maestro', 'cerebro-evolutivo', 'memoria-suprema'];
  const currentRankIndex = rankOrder.indexOf(rank);
  
  return Object.values(BOSSES)
    .filter(boss => {
      const requiredRankIndex = rankOrder.indexOf(boss.requiredRank);
      return requiredRankIndex <= currentRankIndex;
    })
    .map(boss => boss.id);
}

export function initializePlayerProgress(): PlayerProgress {
  return {
    xp: 0,
    rank: 'mente-basica',
    level: 1,
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    highestCombo: 0,
    defeatedBosses: [],
    unlockedSkins: ['default'],
    unlockedEffects: ['none'],
    unlockedPowers: []
  };
}

export function savePlayerProgress(progress: PlayerProgress): void {
  localStorage.setItem('memorize_player_progress', JSON.stringify(progress));
}

export function loadPlayerProgress(): PlayerProgress {
  const saved = localStorage.getItem('memorize_player_progress');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return initializePlayerProgress();
    }
  }
  return initializePlayerProgress();
}
