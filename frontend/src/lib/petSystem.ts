/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SISTEMA DE COMPAÑEROS NEURALES (MASCOTAS DE MEMORIA)
 * Mascotas que crecen y evolucionan alimentándolas con Cerebritos (🧠)
 * ganados al jugar partidas en el juego.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type PetType = 'fox' | 'cat';

export interface PetDefinition {
  id: PetType;
  name: string;
  species: string;
  epithet: string;
  themeColor: string;
  glowColor: string;
  accentBg: string;
  perkName: string;
  perkDesc: string;
  stages: {
    stage: 1 | 2 | 3;
    title: string;
    minLevel: number;
    description: string;
  }[];
  quotes: string[];
}

export interface PetState {
  type: PetType;
  nickname: string;
  level: number;
  xp: number;
  brains: number; // Moneda de cerebritos acumulados
  totalFed: number;
  createdAt: number;
}

export const PETS: Record<PetType, PetDefinition> = {
  fox: {
    id: 'fox',
    name: 'Zorro Neofox',
    species: 'Zorro 3D Animado',
    epithet: 'El Centinela de los Reflejos',
    themeColor: '#FF7A00',
    glowColor: 'rgba(255, 122, 0, 0.45)',
    accentBg: 'rgba(255, 122, 0, 0.12)',
    perkName: 'Agudeza Sináptica',
    perkDesc: '+10% de probabilidad de revelar pistas y bonificación de racha.',
    stages: [
      {
        stage: 1,
        title: 'Zorro Silvestre',
        minLevel: 1,
        description: 'Un zorro ágil de pelaje dorado y mirada vivaz que acompaña tus expediciones.',
      },
      {
        stage: 2,
        title: 'Zorro de la Aurora',
        minLevel: 6,
        description: 'Pelaje resplandeciente con destellos de plasma boreal y reflejos agudizados.',
      },
      {
        stage: 3,
        title: 'Guardián Celestial',
        minLevel: 16,
        description: 'Forma suprema coronada de runas cósmicas, orbes de energía pura y visión absoluta.',
      },
    ],
    quotes: [
      '¡Mis orejitas captan nuevos patrones en el archivo!',
      '¡Qué ricos los cerebritos! ¡Dame más para evolucionar!',
      '¡Siento una sinapsis increíble contigo, Operador!',
      '¡Mis reflejos están listos para la siguiente expedición!',
      '¡Juntos no olvidaremos ninguna combinación!',
      '¡Mira cómo brilla mi pelaje con cada combo!',
    ],
  },
  cat: {
    id: 'cat',
    name: 'Gatito Cuántico',
    species: 'Neko Cósmico',
    epithet: 'El Custodio de la Concentración',
    themeColor: '#B79CFF',
    glowColor: 'rgba(183, 156, 255, 0.45)',
    accentBg: 'rgba(183, 156, 255, 0.12)',
    perkName: 'Amuleto Astral',
    perkDesc: '+15% de monedas ganadas y escudo protector contra anomalías.',
    stages: [
      {
        stage: 1,
        title: 'Gatito Estelar',
        minLevel: 1,
        description: 'Flota pacíficamente sobre una nube cuántica y ronronea al memorizar.',
      },
      {
        stage: 2,
        title: 'Felino de Constelación',
        minLevel: 6,
        description: 'Ojos como nebulosas y aura violeta que te ayuda a recordar patrones.',
      },
      {
        stage: 3,
        title: 'Pantera del Vacío',
        minLevel: 16,
        description: 'Majestuoso protector astral coronado de estrellas con visión absoluta.',
      },
    ],
    quotes: [
      '*Miau*... Tu mente brilla como una galaxia.',
      '¿Jugamos otra partida? ¡Quiero más cerebritos!',
      '*Ronroneo cuántico activado* 🎵',
      'Protejo tus recuerdos de cualquier anomalía.',
      '¡Pronto alcanzaré mi forma de Guardián!',
    ],
  },
};

const STORAGE_KEY = 'memorize_neural_pet_v1';

export function getXpForNextLevel(currentLevel: number): number {
  return currentLevel * 30;
}

export function getPetStage(level: number): 1 | 2 | 3 {
  if (level >= 16) return 3;
  if (level >= 6) return 2;
  return 1;
}

export function initializePetState(): PetState {
  return {
    type: 'fox',
    nickname: 'Kitsune',
    level: 1,
    xp: 0,
    brains: 50, // Comienza con 50 cerebritos de regalo para probar el sistema de inmediato
    totalFed: 0,
    createdAt: Date.now(),
  };
}

export function loadPetState(): PetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = initializePetState();
      savePetState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as PetState;
    const petType = (parsed.type === 'cat' ? 'cat' : 'fox') as PetType;
    return {
      ...initializePetState(),
      ...parsed,
      type: petType,
      nickname: parsed.nickname || (petType === 'cat' ? 'Neko' : 'Kitsune'),
    };
  } catch {
    return initializePetState();
  }
}

export function savePetState(state: PetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // LocalStorage no disponible
  }
}

/**
 * Añade cerebritos ganados tras partidas o misiones
 */
export function addBrains(amount: number): PetState {
  const current = loadPetState();
  const next = {
    ...current,
    brains: Math.max(0, current.brains + amount),
  };
  savePetState(next);
  return next;
}

/**
 * Alimenta a la mascota con cerebritos (gasta 'cost', da XP y puede subir de nivel)
 */
export interface FeedResult {
  newState: PetState;
  leveledUp: boolean;
  newLevel: number;
  evolved: boolean;
  newStage: 1 | 2 | 3;
}

export function feedPet(cost: number = 10): FeedResult | null {
  const state = loadPetState();
  if (state.brains < cost) return null;

  const prevStage = getPetStage(state.level);
  let remainingBrains = state.brains - cost;
  let currentXp = state.xp + cost * 2; // Cada cerebrito da 2 XP
  let currentLevel = state.level;
  let leveledUp = false;

  let needed = getXpForNextLevel(currentLevel);
  while (currentXp >= needed) {
    currentXp -= needed;
    currentLevel += 1;
    leveledUp = true;
    needed = getXpForNextLevel(currentLevel);
  }

  const nextStage = getPetStage(currentLevel);
  const evolved = nextStage > prevStage;

  const nextState: PetState = {
    ...state,
    brains: remainingBrains,
    xp: currentXp,
    level: currentLevel,
    totalFed: state.totalFed + cost,
  };

  savePetState(nextState);

  return {
    newState: nextState,
    leveledUp,
    newLevel: currentLevel,
    evolved,
    newStage: nextStage,
  };
}

/**
 * Cambia el tipo de mascota (Zorro <-> Gato)
 */
export function switchPetType(newType: PetType): PetState {
  const state = loadPetState();
  const defaultName = newType === 'fox' ? 'Kitsune' : 'Neko';
  const next: PetState = {
    ...state,
    type: newType,
    nickname: defaultName,
  };
  savePetState(next);
  return next;
}
