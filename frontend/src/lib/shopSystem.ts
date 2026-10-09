// Sistema de tienda y equipamiento

export interface EquippedItems {
  pack: string;
  frame: string;
  skin: string;
  board: string;
}

// Obtener items equipados
export function getEquippedItems(): EquippedItems {
  return {
    pack: localStorage.getItem('equippedPack') || 'frutas',
    frame: localStorage.getItem('equippedFrame') || 'basic',
    skin: localStorage.getItem('equippedSkin') || 'classic',
    board: localStorage.getItem('equippedBoard') || 'default',
  };
}

// Obtener pack equipado
export function getEquippedPack(): string {
  return localStorage.getItem('equippedPack') || 'frutas';
}

// Obtener marco equipado
export function getEquippedFrame(): string {
  return localStorage.getItem('equippedFrame') || 'basic';
}

// Obtener skin equipado
export function getEquippedSkin(): string {
  return localStorage.getItem('equippedSkin') || 'classic';
}

// Obtener tablero equipado
export function getEquippedBoard(): string {
  return localStorage.getItem('equippedBoard') || 'default';
}

// Obtener cartas del pack equipado
export function getEquippedPackCards(): string[] {
  const packId = getEquippedPack();
  
  const PACKS: Record<string, string[]> = {
    frutas: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍'],
    animales: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
    espacio: ['🌍', '🌙', '⭐', '🌟', '🚀', '🛸', '🌌', '☄️'],
    oceano: ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🐚', '🦀'],
    magico: ['🔮', '✨', '🌟', '💫', '🪄', '🎭', '👑', '💎'],
    dragon: ['🐉', '🔥', '⚡', '💥', '🌋', '👹', '🗡️', '🛡️'],
    cyber: ['🤖', '💻', '📱', '⚙️', '🔧', '💾', '🖥️', '⌨️'],
    celestial: ['☀️', '🌙', '⭐', '✨', '☁️', '🌈', '⚡', '🌟'],
  };
  
  return PACKS[packId] || PACKS.frutas;
}

// Obtener estilo del skin equipado
export function getEquippedSkinStyle(): string {
  const skinId = getEquippedSkin();
  
  const SKIN_STYLES: Record<string, string> = {
    classic: 'bg-gradient-to-br from-blue-500 to-purple-500',
    neon: 'bg-gradient-to-br from-cyan-400 to-pink-500',
    gold: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    ice: 'bg-gradient-to-br from-cyan-300 to-blue-400',
    shadow: 'bg-gradient-to-br from-gray-800 to-black',
    galaxy: 'bg-gradient-to-br from-purple-900 via-blue-800 to-pink-900',
  };
  
  return SKIN_STYLES[skinId] || SKIN_STYLES.classic;
}

// Obtener estilo del tablero equipado
export function getEquippedBoardStyle(): { bgColor: string; gradient: string } {
  const boardId = getEquippedBoard();
  
  const BOARD_STYLES: Record<string, { bgColor: string; gradient: string }> = {
    default: { bgColor: 'bg-gray-900', gradient: 'from-gray-700 to-gray-800' },
    forest: { bgColor: 'bg-green-900', gradient: 'from-green-600 to-emerald-700' },
    ocean: { bgColor: 'bg-blue-900', gradient: 'from-blue-600 to-cyan-700' },
    volcano: { bgColor: 'bg-red-900', gradient: 'from-red-600 to-orange-700' },
    space: { bgColor: 'bg-black', gradient: 'from-purple-800 to-indigo-900' },
    heaven: { bgColor: 'bg-sky-400', gradient: 'from-yellow-300 to-orange-400' },
  };
  
  return BOARD_STYLES[boardId] || BOARD_STYLES.default;
}

// Obtener estilo del marco equipado
export function getEquippedFrameStyle(): { gradient: string; borderStyle: string } {
  const frameId = getEquippedFrame();
  
  const FRAME_STYLES: Record<string, { gradient: string; borderStyle: string }> = {
    basic: { gradient: 'from-gray-500 to-gray-600', borderStyle: 'border-4 border-gray-500' },
    gold: { gradient: 'from-yellow-400 to-yellow-600', borderStyle: 'border-4 border-yellow-500' },
    diamond: { gradient: 'from-cyan-400 to-blue-500', borderStyle: 'border-4 border-cyan-400' },
    fire: { gradient: 'from-red-500 to-orange-600', borderStyle: 'border-4 border-red-500' },
    cosmic: { gradient: 'from-purple-600 to-pink-600', borderStyle: 'border-4 border-purple-500' },
    rainbow: { gradient: 'from-red-400 via-yellow-400 to-blue-400', borderStyle: 'border-4 border-pink-500' },
  };
  
  return FRAME_STYLES[frameId] || FRAME_STYLES.basic;
}
