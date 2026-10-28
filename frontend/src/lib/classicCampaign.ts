/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MODO CLÁSICO — "Expedición del Archivo"
 * Fuente única de verdad para niveles, alas, recompensas y progreso.
 * La selección de nivel, el tablero y la pantalla de resultados leen de aquí,
 * así lo que se muestra al jugador es SIEMPRE lo que se juega.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { CARD_CATALOG, getCardById, type CardDef, type GameUniverse } from './cardCatalog';
export type { GameUniverse };
import { UNIVERSE_TOKENS } from './archivoTokens';
import { getStoredUser } from './api';
import { addXP, loadPlayerStats, savePlayerStats } from './playerEvolution';
import { addBrains } from './petSystem';

// ── Tipos ────────────────────────────────────────────────────────────────────

export type PowerId = 'reveal' | 'freeze' | 'hint';
export type MechanicId = 'glitch' | 'bomb' | 'shuffle' | 'dark' | 'triads';

export interface WingDef {
  id: GameUniverse;
  index: number;
  roman: string;
  name: string;
  epithet: string;
  lore: string;
  accent: string;
  art: string; // ruta base sin sufijo: /classic/wing-x  → -960/-1920 .avif/.webp
}

export interface LevelDef {
  level: number;
  wing: GameUniverse;
  title: string;
  lore: string;
  groups: number;
  useTriads: boolean;
  time: number;
  previewMs: number;
  cols: number;
  glitchRatio: number;
  bombs: number;
  shuffleEvery: number | null;
  dark: boolean;
  relicId: string;
  unlocksPower?: PowerId;
}

export interface PowerDef {
  id: PowerId;
  name: string;
  verb: string;
  description: string;
  hotkey: string;
  color: string;
  unlockLevel: number;
}

export interface MechanicDef {
  id: MechanicId;
  name: string;
  description: string;
  color: string;
}

export interface LevelRecord {
  stars: number;
  bestScore: number;
  bestAccuracy: number;
  clears: number;
  plays: number;
}

export interface ClassicProgress {
  version: 2;
  levels: Record<number, LevelRecord>;
  relics: string[];
  powers: PowerId[];
  crown: boolean;
}

export interface LevelOutcome {
  won: boolean;
  score: number;
  accuracy: number;
  maxCombo: number;
  timeLeft: number;
  stars: number;
}

export interface LevelRewards {
  firstClear: boolean;
  newRecord: boolean;
  previousBest: number;
  starsBefore: number;
  starsGained: number;
  relic?: CardDef;
  power?: PowerDef;
  crown: boolean;
  localXp: number;
}

// ── Alas (los 5 universos del juego) ────────────────────────────────────────

export const WINGS: WingDef[] = [
  {
    id: 'verdalis',
    index: 1,
    roman: 'I',
    name: 'Verdalis',
    epithet: 'El Bosque que Recuerda',
    lore: 'Ruinas cubiertas de musgo donde cada espora guarda un recuerdo.',
    accent: UNIVERSE_TOKENS.verdalis.accent,
    art: '/classic/wing-verdalis',
  },
  {
    id: 'frostheim',
    index: 2,
    roman: 'II',
    name: 'Frostheim',
    epithet: 'La Catedral de Hielo',
    lore: 'La escarcha distorsiona las reliquias. Confía en tu memoria, no en tus ojos.',
    accent: UNIVERSE_TOKENS.frostheim.accent,
    art: '/classic/wing-frostheim',
  },
  {
    id: 'volcania',
    index: 3,
    roman: 'III',
    name: 'Volcania',
    epithet: 'La Forja Viva',
    lore: 'El magma desplaza el tablero y las anomalías esperan a los descuidados.',
    accent: UNIVERSE_TOKENS.volcania.accent,
    art: '/classic/wing-volcania',
  },
  {
    id: 'neural',
    index: 4,
    roman: 'IV',
    name: 'Neural Nexus',
    epithet: 'El Núcleo Sináptico',
    lore: 'La señal se apaga poco a poco. Aquí las memorias se agrupan de tres en tres.',
    accent: UNIVERSE_TOKENS.neural.accent,
    art: '/classic/wing-neural',
  },
  {
    id: 'lunaris',
    index: 5,
    roman: 'V',
    name: 'Lunaris',
    epithet: 'El Observatorio del Eclipse',
    lore: 'Bajo el eclipse total se custodia la Corona del Archivo.',
    accent: UNIVERSE_TOKENS.lunaris.accent,
    art: '/classic/wing-lunaris',
  },
];

export const WING_BY_ID = Object.fromEntries(WINGS.map((w) => [w.id, w])) as Record<GameUniverse, WingDef>;

// ── Niveles ─────────────────────────────────────────────────────────────────

export const LEVELS: LevelDef[] = [
  {
    level: 1, wing: 'verdalis', title: 'Claro de las Esporas',
    lore: 'Tu primera custodia. Observa, recuerda, captura.',
    groups: 4, useTriads: false, time: 75, previewMs: 3500, cols: 4,
    glitchRatio: 0, bombs: 0, shuffleEvery: null, dark: false,
    relicId: 'vrd-03',
  },
  {
    level: 2, wing: 'verdalis', title: 'Raíces Antiguas',
    lore: 'Más reliquias, la misma calma. El bosque te pone a prueba.',
    groups: 6, useTriads: false, time: 80, previewMs: 3500, cols: 4,
    glitchRatio: 0, bombs: 0, shuffleEvery: null, dark: false,
    relicId: 'vrd-08', unlocksPower: 'reveal',
  },
  {
    level: 3, wing: 'frostheim', title: 'Galería de Escarcha',
    lore: 'Algunas reliquias se muestran distorsionadas por el hielo.',
    groups: 6, useTriads: false, time: 75, previewMs: 3500, cols: 4,
    glitchRatio: 0.3, bombs: 0, shuffleEvery: null, dark: false,
    relicId: 'frs-04',
  },
  {
    level: 4, wing: 'frostheim', title: 'Corazón Glacial',
    lore: 'Aparecen las primeras anomalías. No todas las cartas son reliquias.',
    groups: 8, useTriads: false, time: 90, previewMs: 4000, cols: 4,
    glitchRatio: 0.25, bombs: 2, shuffleEvery: null, dark: false,
    relicId: 'frs-08', unlocksPower: 'freeze',
  },
  {
    level: 5, wing: 'volcania', title: 'Forja Dormida',
    lore: 'El magma despierta: el tablero se reordena cada cierto tiempo.',
    groups: 8, useTriads: false, time: 85, previewMs: 4000, cols: 4,
    glitchRatio: 0, bombs: 2, shuffleEvery: 16000, dark: false,
    relicId: 'vlc-06',
  },
  {
    level: 6, wing: 'volcania', title: 'Erupción',
    lore: 'Diez reliquias, tres anomalías y un suelo que no deja de moverse.',
    groups: 10, useTriads: false, time: 100, previewMs: 4500, cols: 5,
    glitchRatio: 0, bombs: 3, shuffleEvery: 13000, dark: false,
    relicId: 'vlc-08', unlocksPower: 'hint',
  },
  {
    level: 7, wing: 'neural', title: 'Señal Menguante',
    lore: 'La luz del núcleo se apaga. Memoriza antes de que llegue la oscuridad.',
    groups: 10, useTriads: false, time: 100, previewMs: 4500, cols: 5,
    glitchRatio: 0.2, bombs: 2, shuffleEvery: null, dark: true,
    relicId: 'nrl-07',
  },
  {
    level: 8, wing: 'neural', title: 'Mente Colmena',
    lore: 'Las memorias ahora existen en tríadas. Encuentra las tres.',
    groups: 4, useTriads: true, time: 75, previewMs: 4000, cols: 4,
    glitchRatio: 0, bombs: 0, shuffleEvery: null, dark: false,
    relicId: 'nrl-08',
  },
  {
    level: 9, wing: 'lunaris', title: 'Observatorio Roto',
    lore: 'Tríadas bajo un cielo que se oscurece.',
    groups: 5, useTriads: true, time: 85, previewMs: 4500, cols: 5,
    glitchRatio: 0, bombs: 0, shuffleEvery: null, dark: true,
    relicId: 'lnr-05',
  },
  {
    level: 10, wing: 'lunaris', title: 'Eclipse Total',
    lore: 'La prueba final del Archivo. Quien la supere, portará la Corona.',
    groups: 6, useTriads: true, time: 100, previewMs: 5000, cols: 6,
    glitchRatio: 0, bombs: 0, shuffleEvery: 15000, dark: true,
    relicId: 'lnr-08',
  },
];

export const TOTAL_LEVELS = LEVELS.length;
export const MAX_STARS = TOTAL_LEVELS * 3;

export function getLevel(level: number): LevelDef {
  return LEVELS[Math.min(Math.max(level, 1), TOTAL_LEVELS) - 1];
}

export function levelMechanics(def: LevelDef): MechanicId[] {
  const m: MechanicId[] = [];
  if (def.useTriads) m.push('triads');
  if (def.glitchRatio > 0) m.push('glitch');
  if (def.bombs > 0) m.push('bomb');
  if (def.shuffleEvery) m.push('shuffle');
  if (def.dark) m.push('dark');
  return m;
}

// ── Mecánicas y poderes ─────────────────────────────────────────────────────

export const MECHANICS: Record<MechanicId, MechanicDef> = {
  triads: { id: 'triads', name: 'Tríadas', description: 'Cada reliquia aparece 3 veces. Voltea las tres para capturarla.', color: '#B79CFF' },
  glitch: { id: 'glitch', name: 'Interferencia', description: 'Algunas cartas se ven distorsionadas al revelarse.', color: '#6EE7F5' },
  bomb: { id: 'bomb', name: 'Anomalías', description: 'Cartas trampa: restan tiempo y puntos y reordenan el tablero.', color: '#FF4D5E' },
  shuffle: { id: 'shuffle', name: 'Tablero vivo', description: 'Las cartas ocultas cambian de lugar periódicamente.', color: '#FF6B35' },
  dark: { id: 'dark', name: 'Oscuridad', description: 'El tablero se oscurece progresivamente durante la partida.', color: '#9AA3B2' },
};

export const POWERS: Record<PowerId, PowerDef> = {
  reveal: {
    id: 'reveal', name: 'Destello', verb: 'Revelar',
    description: 'Muestra todas las cartas ocultas durante 1,5 segundos.',
    hotkey: '1', color: '#E8B54A', unlockLevel: 2,
  },
  freeze: {
    id: 'freeze', name: 'Escarcha Temporal', verb: 'Congelar',
    description: 'Detiene el reloj durante 8 segundos.',
    hotkey: '2', color: '#6EE7F5', unlockLevel: 4,
  },
  hint: {
    id: 'hint', name: 'Brújula del Archivo', verb: 'Señalar',
    description: 'Señala una reliquia completa durante 2,5 segundos.',
    hotkey: '3', color: '#8FE04A', unlockLevel: 6,
  },
};

export const POWER_ORDER: PowerId[] = ['reveal', 'freeze', 'hint'];

// ── Estrellas y puntuación ──────────────────────────────────────────────────

export const STAR_RULES = {
  accuracy: 70,
  timeRatio: 0.3,
};

export function computeStars(won: boolean, accuracy: number, timeLeft: number, maxTime: number): number {
  if (!won) return 0;
  let stars = 1;
  if (accuracy >= STAR_RULES.accuracy) stars += 1;
  if (maxTime > 0 && timeLeft / maxTime >= STAR_RULES.timeRatio) stars += 1;
  return stars;
}

export function matchPoints(useTriads: boolean, combo: number): number {
  return useTriads ? 150 + combo * 75 : 100 + combo * 50;
}

export const TIME_BONUS_PER_SECOND = 10;
export const BOMB_PENALTY = { points: 150, seconds: 8 };

// ── Mazo por nivel ──────────────────────────────────────────────────────────

/** Reliquias del ala; si faltan, se completan con las del ala anterior (y luego del resto del catálogo). */
export function cardPoolFor(def: LevelDef): CardDef[] {
  const wingIdx = WINGS.findIndex((w) => w.id === def.wing);
  const order = [WINGS[wingIdx], ...WINGS.slice(0, wingIdx).reverse(), ...WINGS.slice(wingIdx + 1)];
  const pool: CardDef[] = [];
  for (const wing of order) {
    pool.push(...CARD_CATALOG.filter((c) => c.universe === wing.id));
  }
  return pool;
}

export function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Persistencia del progreso (por usuario) ─────────────────────────────────

function storageKey(): string {
  const user = getStoredUser();
  return `memorize_classic_${user?.id ?? 'guest'}`;
}

function emptyProgress(): ClassicProgress {
  return { version: 2, levels: {}, relics: [], powers: [], crown: false };
}

export function loadClassicProgress(): ClassicProgress {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as ClassicProgress;
    if (parsed?.version !== 2) return emptyProgress();
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

function saveClassicProgress(progress: ClassicProgress): void {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(progress));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function isLevelUnlocked(progress: ClassicProgress, level: number): boolean {
  if (level <= 1) return true;
  return (progress.levels[level - 1]?.clears ?? 0) > 0;
}

export function totalStars(progress: ClassicProgress): number {
  return Object.values(progress.levels).reduce((sum, r) => sum + (r?.stars ?? 0), 0);
}

export function highestUnlocked(progress: ClassicProgress): number {
  let lvl = 1;
  for (let i = 2; i <= TOTAL_LEVELS; i++) {
    if (isLevelUnlocked(progress, i)) lvl = i;
  }
  return lvl;
}

/** XP local (rango del lobby). Las monedas y el XP de cuenta los calcula el servidor. */
export function localXpFor(def: LevelDef, outcome: LevelOutcome, firstClear: boolean): number {
  if (!outcome.won) return 10 + def.level * 2;
  return 40 + def.level * 15 + outcome.stars * 20 + (firstClear ? 100 : 0);
}

/**
 * Registra el resultado de un nivel, desbloquea recompensas y devuelve lo obtenido.
 * También actualiza las estadísticas locales del jugador (XP, partidas, combo).
 */
export function recordLevelResult(level: number, outcome: LevelOutcome): LevelRewards {
  const def = getLevel(level);
  const progress = loadClassicProgress();
  const prev: LevelRecord = progress.levels[level] ?? { stars: 0, bestScore: 0, bestAccuracy: 0, clears: 0, plays: 0 };

  const firstClear = outcome.won && prev.clears === 0;
  const newRecord = outcome.won && outcome.score > prev.bestScore;

  const next: LevelRecord = {
    plays: prev.plays + 1,
    clears: prev.clears + (outcome.won ? 1 : 0),
    stars: Math.max(prev.stars, outcome.stars),
    bestScore: outcome.won ? Math.max(prev.bestScore, outcome.score) : prev.bestScore,
    bestAccuracy: outcome.won ? Math.max(prev.bestAccuracy, outcome.accuracy) : prev.bestAccuracy,
  };
  progress.levels[level] = next;

  let relic: CardDef | undefined;
  let power: PowerDef | undefined;
  let crown = false;

  if (firstClear) {
    if (!progress.relics.includes(def.relicId)) {
      progress.relics.push(def.relicId);
      relic = getCardById(def.relicId);
    }
    if (def.unlocksPower && !progress.powers.includes(def.unlocksPower)) {
      progress.powers.push(def.unlocksPower);
      power = POWERS[def.unlocksPower];
    }
    if (level === TOTAL_LEVELS && !progress.crown) {
      progress.crown = true;
      crown = true;
    }
  }

  saveClassicProgress(progress);

  const localXp = localXpFor(def, outcome, firstClear);
  try {
    const stats = addXP(loadPlayerStats(), localXp);
    savePlayerStats({
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + (outcome.won ? 1 : 0),
      totalScore: stats.totalScore + outcome.score,
      highestCombo: Math.max(stats.highestCombo, outcome.maxCombo),
    });
    // Recompensa de cerebritos para la mascota de memoria
    addBrains(outcome.won ? 15 : 5);
  } catch {
    /* estadísticas locales no disponibles */
  }

  return {
    firstClear,
    newRecord,
    previousBest: prev.bestScore,
    starsBefore: prev.stars,
    starsGained: Math.max(0, outcome.stars - prev.stars),
    relic,
    power,
    crown,
    localXp,
  };
}

// ── Utilidades de arte ──────────────────────────────────────────────────────

export const CLASSIC_ART = {
  map: '/classic/map-hero',
  reliquary: '/classic/reward-reliquary',
  crown: '/classic/archive-crown',
};
