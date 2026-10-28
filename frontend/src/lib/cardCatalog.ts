import type { UniverseId, Rarity } from './archivoTokens';

export type GameUniverse = Exclude<UniverseId, 'archivo'>;

export interface CardDef {
  id: string;
  code: string;
  name: string;
  universe: GameUniverse;
  slug: string;
  rarity: Rarity;
}

export const BOMB_CARD: CardDef = {
  id: 'spc-bomb-01',
  code: 'SPC-01',
  name: 'Anomalía Inestable',
  universe: 'volcania',
  slug: 'spc-bomb-01-anomalia-inestable',
  rarity: 'anomalia',
};

export const CARD_CATALOG: CardDef[] = [
  { id: 'vlc-01', code: 'VLC-01', name: 'Núcleo de Obsidiana', universe: 'volcania', slug: 'vlc-01-nucleo-de-obsidiana', rarity: 'comun' },
  { id: 'vlc-02', code: 'VLC-02', name: 'Yunque Primigenio', universe: 'volcania', slug: 'vlc-02-yunque-primigenio', rarity: 'comun' },
  { id: 'vlc-03', code: 'VLC-03', name: 'Hacha del Magma', universe: 'volcania', slug: 'vlc-03-hacha-del-magma', rarity: 'comun' },
  { id: 'vlc-04', code: 'VLC-04', name: 'Salamandra de Brasas', universe: 'volcania', slug: 'vlc-04-salamandra-de-brasas', rarity: 'rara' },
  { id: 'vlc-05', code: 'VLC-05', name: 'Golem de Escoria', universe: 'volcania', slug: 'vlc-05-golem-de-escoria', rarity: 'rara' },
  { id: 'vlc-06', code: 'VLC-06', name: 'Fénix de Ceniza', universe: 'volcania', slug: 'vlc-06-fenix-de-ceniza', rarity: 'epica' },
  { id: 'vlc-07', code: 'VLC-07', name: 'Corazón del Volcán', universe: 'volcania', slug: 'vlc-07-corazon-del-volcan', rarity: 'epica' },
  { id: 'vlc-08', code: 'VLC-08', name: 'Señor de la Forja', universe: 'volcania', slug: 'vlc-08-senor-de-la-forja', rarity: 'legendaria' },

  { id: 'frs-01', code: 'FRS-01', name: 'Cristal de Escarcha', universe: 'frostheim', slug: 'frs-01-cristal-de-escarcha', rarity: 'comun' },
  { id: 'frs-02', code: 'FRS-02', name: 'Reliquia Glacial', universe: 'frostheim', slug: 'frs-02-reliquia-glacial', rarity: 'comun' },
  { id: 'frs-03', code: 'FRS-03', name: 'Báculo del Invierno', universe: 'frostheim', slug: 'frs-03-baculo-del-invierno', rarity: 'comun' },
  { id: 'frs-04', code: 'FRS-04', name: 'Zorro de Aurora', universe: 'frostheim', slug: 'frs-04-zorro-de-aurora', rarity: 'rara' },
  { id: 'frs-05', code: 'FRS-05', name: 'Faro de Hielo', universe: 'frostheim', slug: 'frs-05-faro-de-hielo', rarity: 'rara' },
  { id: 'frs-06', code: 'FRS-06', name: 'Lobo Boreal', universe: 'frostheim', slug: 'frs-06-lobo-boreal', rarity: 'epica' },
  { id: 'frs-07', code: 'FRS-07', name: 'Corazón del Glaciar', universe: 'frostheim', slug: 'frs-07-corazon-del-glaciar', rarity: 'epica' },
  { id: 'frs-08', code: 'FRS-08', name: 'Titán de Aurora', universe: 'frostheim', slug: 'frs-08-titan-de-aurora', rarity: 'legendaria' },

  { id: 'nrl-01', code: 'NRL-01', name: 'Sinapsis Primaria', universe: 'neural', slug: 'nrl-01-sinapsis-primaria', rarity: 'comun' },
  { id: 'nrl-02', code: 'NRL-02', name: 'Dron de Datos', universe: 'neural', slug: 'nrl-02-dron-de-datos', rarity: 'comun' },
  { id: 'nrl-03', code: 'NRL-03', name: 'Llave de Encriptación', universe: 'neural', slug: 'nrl-03-llave-de-encriptacion', rarity: 'comun' },
  { id: 'nrl-04', code: 'NRL-04', name: 'Núcleo Holográfico', universe: 'neural', slug: 'nrl-04-nucleo-holografico', rarity: 'rara' },
  { id: 'nrl-05', code: 'NRL-05', name: 'Bibliotecario IA', universe: 'neural', slug: 'nrl-05-bibliotecario-ia', rarity: 'rara' },
  { id: 'nrl-06', code: 'NRL-06', name: 'Red Neuronal Viva', universe: 'neural', slug: 'nrl-06-red-neuronal-viva', rarity: 'epica' },
  { id: 'nrl-07', code: 'NRL-07', name: 'Oráculo Cuántico', universe: 'neural', slug: 'nrl-07-oraculo-cuantico', rarity: 'epica' },
  { id: 'nrl-08', code: 'NRL-08', name: 'Mente Colmena', universe: 'neural', slug: 'nrl-08-mente-colmena', rarity: 'legendaria' },

  { id: 'vrd-01', code: 'VRD-01', name: 'Semilla Lumínica', universe: 'verdalis', slug: 'vrd-01-semilla-luminica', rarity: 'comun' },
  { id: 'vrd-02', code: 'VRD-02', name: 'Ruina de Musgo', universe: 'verdalis', slug: 'vrd-02-ruina-de-musgo', rarity: 'comun' },
  { id: 'vrd-03', code: 'VRD-03', name: 'Flor de Cristal', universe: 'verdalis', slug: 'vrd-03-flor-de-cristal', rarity: 'comun' },
  { id: 'vrd-04', code: 'VRD-04', name: 'Zorro de Hojas Esmeralda', universe: 'verdalis', slug: 'vrd-04-zorro-de-hojas-esmeralda', rarity: 'rara' },
  { id: 'vrd-05', code: 'VRD-05', name: 'Guardián de Raíces', universe: 'verdalis', slug: 'vrd-05-guardian-de-raices', rarity: 'rara' },
  { id: 'vrd-06', code: 'VRD-06', name: 'Espectro Bioluminiscente', universe: 'verdalis', slug: 'vrd-06-espectro-bioluminiscente', rarity: 'epica' },
  { id: 'vrd-07', code: 'VRD-07', name: 'Árbol Ancestral', universe: 'verdalis', slug: 'vrd-07-arbol-ancestral', rarity: 'epica' },
  { id: 'vrd-08', code: 'VRD-08', name: 'Espíritu del Bosque', universe: 'verdalis', slug: 'vrd-08-espiritu-del-bosque', rarity: 'legendaria' },

  { id: 'lnr-01', code: 'LNR-01', name: 'Fragmento de Luna', universe: 'lunaris', slug: 'lnr-01-fragmento-de-luna', rarity: 'comun' },
  { id: 'lnr-02', code: 'LNR-02', name: 'Reloj de Constelaciones', universe: 'lunaris', slug: 'lnr-02-reloj-de-constelaciones', rarity: 'comun' },
  { id: 'lnr-03', code: 'LNR-03', name: 'Astrolabio Roto', universe: 'lunaris', slug: 'lnr-03-astrolabio-roto', rarity: 'comun' },
  { id: 'lnr-04', code: 'LNR-04', name: 'Polilla Onírica', universe: 'lunaris', slug: 'lnr-04-polilla-onirica', rarity: 'rara' },
  { id: 'lnr-05', code: 'LNR-05', name: 'Gato Estelar', universe: 'lunaris', slug: 'lnr-05-gato-estelar', rarity: 'rara' },
  { id: 'lnr-06', code: 'LNR-06', name: 'Orbe de Ensueño', universe: 'lunaris', slug: 'lnr-06-orbe-de-ensueno', rarity: 'epica' },
  { id: 'lnr-07', code: 'LNR-07', name: 'Guardiana del Eclipse', universe: 'lunaris', slug: 'lnr-07-guardiana-del-eclipse', rarity: 'epica' },
  { id: 'lnr-08', code: 'LNR-08', name: 'Devorador de Sueños', universe: 'lunaris', slug: 'lnr-08-devorador-de-suenos', rarity: 'legendaria' },
];

export const ALL_CARDS: CardDef[] = [...CARD_CATALOG, BOMB_CARD];

const CARD_INDEX = new Map(ALL_CARDS.map((card) => [card.id, card]));

export function getCardById(id: string): CardDef | undefined {
  return CARD_INDEX.get(id);
}

export function getCardsForUniverse(universe: GameUniverse): CardDef[] {
  return CARD_CATALOG.filter((card) => card.universe === universe);
}

export const BASE_PACK_ID = 'archivo';

export const BASE_PACK_CARDS: CardDef[] = [
  'vlc-03',
  'vlc-06',
  'vlc-08',
  'frs-01',
  'frs-04',
  'nrl-04',
  'nrl-07',
  'vrd-06',
  'vrd-07',
  'lnr-04',
  'lnr-06',
  'lnr-08',
].map((id) => CARD_INDEX.get(id)!).filter(Boolean);

export function artBasePath(card: Pick<CardDef, 'universe' | 'slug'>): string {
  return `/cards/${card.universe}/${card.slug}`;
}
