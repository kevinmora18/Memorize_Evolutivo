export type UniverseId = 'archivo' | 'volcania' | 'frostheim' | 'neural' | 'verdalis' | 'lunaris';

export interface UniverseToken {
  id: UniverseId;
  name: string;
  code: string;
  wing: string;
  tagline: string;
  accent: string;
  deep: string;
  deep2: string;
}

export const UNIVERSE_TOKENS: Record<UniverseId, UniverseToken> = {
  archivo: {
    id: 'archivo',
    name: 'Archivo Central',
    code: 'ACN',
    wing: 'ALA 00',
    tagline: 'Custodia de memorias codificadas',
    accent: '#35E0C8',
    deep: '#0D1119',
    deep2: '#131A26',
  },
  volcania: {
    id: 'volcania',
    name: 'Volcania',
    code: 'VLC',
    wing: 'ALA 01',
    tagline: 'Obsidiana, magma y brasas vivas',
    accent: '#FF6B35',
    deep: '#150A06',
    deep2: '#1F0D07',
  },
  frostheim: {
    id: 'frostheim',
    name: 'Frostheim',
    code: 'FRS',
    wing: 'ALA 02',
    tagline: 'Hielo cristalino y reliquias glaciales',
    accent: '#6EE7F5',
    deep: '#061119',
    deep2: '#0A1C28',
  },
  neural: {
    id: 'neural',
    name: 'Neural Nexus',
    code: 'NRL',
    wing: 'ALA 03',
    tagline: 'Sinapsis, hologramas y mentes sintéticas',
    accent: '#2BE08F',
    deep: '#04130D',
    deep2: '#082019',
  },
  verdalis: {
    id: 'verdalis',
    name: 'Verdalis',
    code: 'VRD',
    wing: 'ALA 04',
    tagline: 'Ruinas vivas y bioluminiscencia',
    accent: '#8FE04A',
    deep: '#0A1206',
    deep2: '#13210C',
  },
  lunaris: {
    id: 'lunaris',
    name: 'Lunaris',
    code: 'LNR',
    wing: 'ALA 05',
    tagline: 'Constelaciones, magia violeta y sueños',
    accent: '#B79CFF',
    deep: '#0C0918',
    deep2: '#16102A',
  },
};

export type Rarity = 'comun' | 'rara' | 'epica' | 'legendaria' | 'anomalia';

export interface RarityToken {
  id: Rarity;
  label: string;
  color: string;
  pips: number;
}

export const RARITY_TOKENS: Record<Rarity, RarityToken> = {
  comun: { id: 'comun', label: 'Común', color: '#8C97A8', pips: 1 },
  rara: { id: 'rara', label: 'Rara', color: '#35E0C8', pips: 2 },
  epica: { id: 'epica', label: 'Épica', color: '#A78BFA', pips: 3 },
  legendaria: { id: 'legendaria', label: 'Legendaria', color: '#E8B54A', pips: 4 },
  anomalia: { id: 'anomalia', label: 'Anomalía', color: '#C24BFF', pips: 0 },
};

export const AN = {
  void: '#07090F',
  panel: '#0D1119',
  surface: '#131A26',
  surface2: '#1A2230',
  line: '#1E2836',
  lineStrong: '#2C3A4E',
  ink: '#E8E6DF',
  inkDim: '#9AA3B2',
  inkFaint: '#5C6675',
  signal: '#35E0C8',
  gold: '#E8B54A',
  danger: '#FF4D5E',
  anomaly: '#C24BFF',
} as const;

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_FLIP: [number, number, number, number] = [0.23, 1, 0.32, 1];
