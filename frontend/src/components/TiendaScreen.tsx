import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Sparkles, Lock, Check, Frame, Palette, LayoutGrid, Star } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TiendaScreenProps {
  onBack: () => void;
  userId?: string;
}

type ShopCategory = 'cards' | 'frames' | 'skins' | 'boards';

interface CardPack {
  id: string;
  name: string;
  description: string;
  cards: string[];
  price: number;
  currency: 'coins' | 'gems';
  unlocked: boolean;
  owned: boolean;
  gradient: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface ProfileFrame {
  id: string;
  name: string;
  description: string;
  preview: string;
  price: number;
  currency: 'coins' | 'gems';
  unlocked: boolean;
  owned: boolean;
  gradient: string;
  borderStyle: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface CardSkin {
  id: string;
  name: string;
  description: string;
  preview: string;
  price: number;
  currency: 'coins' | 'gems';
  unlocked: boolean;
  owned: boolean;
  gradient: string;
  pattern: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface BoardTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  price: number;
  currency: 'coins' | 'gems';
  unlocked: boolean;
  owned: boolean;
  gradient: string;
  bgColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const CARD_PACKS: CardPack[] = [
  {
    id: 'frutas',
    name: 'Pack Frutas',
    description: 'Frutas clásicas y deliciosas',
    cards: ['🍎', '🍌', '🍇', '🍉', '🍓', '🍒', '🍑', '🍍'],
    price: 0,
    currency: 'coins',
    unlocked: true,
    owned: true,
    gradient: 'from-red-500 to-orange-500',
    rarity: 'common',
  },
  {
    id: 'animales',
    name: 'Pack Animales',
    description: 'Criaturas adorables del reino animal',
    cards: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
    price: 500,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-green-500 to-emerald-500',
    rarity: 'common',
  },
  {
    id: 'espacio',
    name: 'Pack Espacial',
    description: 'Explora el cosmos infinito',
    cards: ['🌍', '🌙', '⭐', '🌟', '🚀', '🛸', '🌌', '☄️'],
    price: 1000,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-blue-500 to-purple-500',
    rarity: 'rare',
  },
  {
    id: 'oceano',
    name: 'Pack Océano',
    description: 'Criaturas de las profundidades',
    cards: ['🐠', '🐟', '🐡', '🦈', '🐙', '🦑', '🐚', '🦀'],
    price: 1500,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-cyan-500 to-blue-600',
    rarity: 'rare',
  },
  {
    id: 'magico',
    name: 'Pack Mágico',
    description: 'Elementos místicos y encantados',
    cards: ['🔮', '✨', '🌟', '💫', '🪄', '🎭', '👑', '💎'],
    price: 2500,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-purple-500 to-pink-500',
    rarity: 'epic',
  },
  {
    id: 'dragon',
    name: 'Pack Dragón',
    description: 'Poder legendario de dragones',
    cards: ['🐉', '🔥', '⚡', '💥', '🌋', '👹', '🗡️', '🛡️'],
    price: 100,
    currency: 'gems',
    unlocked: true,
    owned: false,
    gradient: 'from-red-600 to-orange-600',
    rarity: 'legendary',
  },
  {
    id: 'cyber',
    name: 'Pack Cyber',
    description: 'Tecnología del futuro',
    cards: ['🤖', '💻', '📱', '⚙️', '🔧', '💾', '🖥️', '⌨️'],
    price: 3000,
    currency: 'coins',
    unlocked: false,
    owned: false,
    gradient: 'from-cyan-400 to-blue-500',
    rarity: 'epic',
  },
  {
    id: 'celestial',
    name: 'Pack Celestial',
    description: 'Poder divino de los cielos',
    cards: ['☀️', '🌙', '⭐', '✨', '☁️', '🌈', '⚡', '🌟'],
    price: 150,
    currency: 'gems',
    unlocked: false,
    owned: false,
    gradient: 'from-yellow-400 to-orange-500',
    rarity: 'legendary',
  },
];

const PROFILE_FRAMES: ProfileFrame[] = [
  {
    id: 'basic',
    name: 'Marco Básico',
    description: 'Marco simple y elegante',
    preview: '⬜',
    price: 0,
    currency: 'coins',
    unlocked: true,
    owned: true,
    gradient: 'from-gray-500 to-gray-600',
    borderStyle: 'border-4 border-gray-500',
    rarity: 'common',
  },
  {
    id: 'gold',
    name: 'Marco Dorado',
    description: 'Brilla con elegancia',
    preview: '🟨',
    price: 1000,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-yellow-400 to-yellow-600',
    borderStyle: 'border-4 border-yellow-500',
    rarity: 'rare',
  },
  {
    id: 'diamond',
    name: 'Marco Diamante',
    description: 'Lujo y prestigio',
    preview: '💎',
    price: 200,
    currency: 'gems',
    unlocked: true,
    owned: false,
    gradient: 'from-cyan-400 to-blue-500',
    borderStyle: 'border-4 border-cyan-400',
    rarity: 'epic',
  },
  {
    id: 'fire',
    name: 'Marco de Fuego',
    description: 'Ardiente y poderoso',
    preview: '🔥',
    price: 2500,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-red-500 to-orange-600',
    borderStyle: 'border-4 border-red-500',
    rarity: 'epic',
  },
  {
    id: 'cosmic',
    name: 'Marco Cósmico',
    description: 'Del espacio infinito',
    preview: '🌌',
    price: 300,
    currency: 'gems',
    unlocked: true,
    owned: false,
    gradient: 'from-purple-600 to-pink-600',
    borderStyle: 'border-4 border-purple-500',
    rarity: 'legendary',
  },
  {
    id: 'rainbow',
    name: 'Marco Arcoíris',
    description: 'Todos los colores',
    preview: '🌈',
    price: 3500,
    currency: 'coins',
    unlocked: false,
    owned: false,
    gradient: 'from-red-400 via-yellow-400 to-blue-400',
    borderStyle: 'border-4 border-pink-500',
    rarity: 'legendary',
  },
];

const CARD_SKINS: CardSkin[] = [
  {
    id: 'classic',
    name: 'Skin Clásico',
    description: 'El diseño original',
    preview: '🎴',
    price: 0,
    currency: 'coins',
    unlocked: true,
    owned: true,
    gradient: 'from-blue-500 to-purple-500',
    pattern: 'bg-gradient-to-br from-blue-500 to-purple-500',
    rarity: 'common',
  },
  {
    id: 'neon',
    name: 'Skin Neón',
    description: 'Brillo futurista',
    preview: '✨',
    price: 800,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-cyan-400 to-pink-500',
    pattern: 'bg-gradient-to-br from-cyan-400 to-pink-500',
    rarity: 'rare',
  },
  {
    id: 'gold',
    name: 'Skin Dorado',
    description: 'Lujo y elegancia',
    preview: '👑',
    price: 1500,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-yellow-400 to-orange-500',
    pattern: 'bg-gradient-to-br from-yellow-400 to-orange-500',
    rarity: 'epic',
  },
  {
    id: 'ice',
    name: 'Skin Hielo',
    description: 'Frío cristalino',
    preview: '❄️',
    price: 150,
    currency: 'gems',
    unlocked: true,
    owned: false,
    gradient: 'from-cyan-300 to-blue-400',
    pattern: 'bg-gradient-to-br from-cyan-300 to-blue-400',
    rarity: 'epic',
  },
  {
    id: 'shadow',
    name: 'Skin Sombra',
    description: 'Oscuridad misteriosa',
    preview: '🌑',
    price: 2000,
    currency: 'coins',
    unlocked: false,
    owned: false,
    gradient: 'from-gray-800 to-black',
    pattern: 'bg-gradient-to-br from-gray-800 to-black',
    rarity: 'legendary',
  },
  {
    id: 'galaxy',
    name: 'Skin Galaxia',
    description: 'Universo infinito',
    preview: '🌠',
    price: 250,
    currency: 'gems',
    unlocked: false,
    owned: false,
    gradient: 'from-purple-900 via-blue-800 to-pink-900',
    pattern: 'bg-gradient-to-br from-purple-900 via-blue-800 to-pink-900',
    rarity: 'legendary',
  },
];

const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'default',
    name: 'Tablero Clásico',
    description: 'El tablero original',
    preview: '🎮',
    price: 0,
    currency: 'coins',
    unlocked: true,
    owned: true,
    gradient: 'from-gray-700 to-gray-800',
    bgColor: 'bg-gray-900',
    rarity: 'common',
  },
  {
    id: 'forest',
    name: 'Bosque Místico',
    description: 'Naturaleza encantada',
    preview: '🌲',
    price: 1200,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-green-600 to-emerald-700',
    bgColor: 'bg-green-900',
    rarity: 'rare',
  },
  {
    id: 'ocean',
    name: 'Océano Profundo',
    description: 'Bajo el mar',
    preview: '🌊',
    price: 1500,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-blue-600 to-cyan-700',
    bgColor: 'bg-blue-900',
    rarity: 'rare',
  },
  {
    id: 'volcano',
    name: 'Volcán Ardiente',
    description: 'Lava y fuego',
    preview: '🌋',
    price: 2000,
    currency: 'coins',
    unlocked: true,
    owned: false,
    gradient: 'from-red-600 to-orange-700',
    bgColor: 'bg-red-900',
    rarity: 'epic',
  },
  {
    id: 'space',
    name: 'Espacio Exterior',
    description: 'Entre las estrellas',
    preview: '🚀',
    price: 180,
    currency: 'gems',
    unlocked: true,
    owned: false,
    gradient: 'from-purple-800 to-indigo-900',
    bgColor: 'bg-black',
    rarity: 'epic',
  },
  {
    id: 'heaven',
    name: 'Cielo Celestial',
    description: 'Reino divino',
    preview: '☁️',
    price: 3000,
    currency: 'coins',
    unlocked: false,
    owned: false,
    gradient: 'from-yellow-300 to-orange-400',
    bgColor: 'bg-sky-400',
    rarity: 'legendary',
  },
];

const RARITY_COLORS = {
  common: 'border-gray-500',
  rare: 'border-blue-500',
  epic: 'border-purple-500',
  legendary: 'border-yellow-500',
};

export function TiendaScreen({ onBack, userId }: TiendaScreenProps) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5175';
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory>('cards');
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  
  // Load from localStorage
  const [ownedPacks, setOwnedPacks] = useState<string[]>(() => {
    const saved = localStorage.getItem('ownedPacks');
    return saved ? JSON.parse(saved) : ['frutas'];
  });
  const [ownedFrames, setOwnedFrames] = useState<string[]>(() => {
    const saved = localStorage.getItem('ownedFrames');
    return saved ? JSON.parse(saved) : ['basic'];
  });
  const [ownedSkins, setOwnedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('ownedSkins');
    return saved ? JSON.parse(saved) : ['classic'];
  });
  const [ownedBoards, setOwnedBoards] = useState<string[]>(() => {
    const saved = localStorage.getItem('ownedBoards');
    return saved ? JSON.parse(saved) : ['default'];
  });
  
  // Equipped items
  const [equippedPack, setEquippedPack] = useState<string>(() => {
    return localStorage.getItem('equippedPack') || 'frutas';
  });
  const [equippedFrame, setEquippedFrame] = useState<string>(() => {
    return localStorage.getItem('equippedFrame') || 'basic';
  });
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem('equippedSkin') || 'classic';
  });
  const [equippedBoard, setEquippedBoard] = useState<string>(() => {
    return localStorage.getItem('equippedBoard') || 'default';
  });
  
  const [coins, setCoins] = useState(0);
  const [gems, setGems] = useState(0);

  // Cargar monedas del usuario
  useEffect(() => {
    if (userId) {
      fetch(`${API_BASE}/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setCoins(data.coins || 0);
          setGems(data.gems || 0);
        })
        .catch(err => console.error('Error loading currency:', err));
    }
  }, [userId]);

  const handleBuyPack = (pack: CardPack) => {
    if (pack.owned || ownedPacks.includes(pack.id)) {
      alert('¡Ya tienes este pack!');
      return;
    }

    if (!pack.unlocked) {
      alert('Este pack aún no está disponible');
      return;
    }

    const hasEnough = pack.currency === 'coins' ? coins >= pack.price : gems >= pack.price;
    
    if (!hasEnough) {
      alert(`No tienes suficientes ${pack.currency === 'coins' ? 'monedas' : 'gemas'}`);
      return;
    }

    // Simular compra
    const newOwned = [...ownedPacks, pack.id];
    setOwnedPacks(newOwned);
    localStorage.setItem('ownedPacks', JSON.stringify(newOwned));
    alert(`¡Has comprado ${pack.name}!`);
  };

  const handleEquipPack = (packId: string) => {
    setEquippedPack(packId);
    localStorage.setItem('equippedPack', packId);
    alert('¡Pack equipado! Se usará en tus próximas partidas.');
  };

  const handleBuyFrame = (frame: ProfileFrame) => {
    if (frame.owned || ownedFrames.includes(frame.id)) {
      alert('¡Ya tienes este marco!');
      return;
    }

    if (!frame.unlocked) {
      alert('Este marco aún no está disponible');
      return;
    }

    const hasEnough = frame.currency === 'coins' ? coins >= frame.price : gems >= frame.price;
    
    if (!hasEnough) {
      alert(`No tienes suficientes ${frame.currency === 'coins' ? 'monedas' : 'gemas'}`);
      return;
    }

    const newOwned = [...ownedFrames, frame.id];
    setOwnedFrames(newOwned);
    localStorage.setItem('ownedFrames', JSON.stringify(newOwned));
    alert(`¡Has comprado ${frame.name}!`);
  };

  const handleEquipFrame = (frameId: string) => {
    setEquippedFrame(frameId);
    localStorage.setItem('equippedFrame', frameId);
    alert('¡Marco equipado! Se mostrará en tu perfil.');
  };

  const handleBuySkin = (skin: CardSkin) => {
    if (skin.owned || ownedSkins.includes(skin.id)) {
      alert('¡Ya tienes este skin!');
      return;
    }

    if (!skin.unlocked) {
      alert('Este skin aún no está disponible');
      return;
    }

    const hasEnough = skin.currency === 'coins' ? coins >= skin.price : gems >= skin.price;
    
    if (!hasEnough) {
      alert(`No tienes suficientes ${skin.currency === 'coins' ? 'monedas' : 'gemas'}`);
      return;
    }

    const newOwned = [...ownedSkins, skin.id];
    setOwnedSkins(newOwned);
    localStorage.setItem('ownedSkins', JSON.stringify(newOwned));
    alert(`¡Has comprado ${skin.name}!`);
  };

  const handleEquipSkin = (skinId: string) => {
    setEquippedSkin(skinId);
    localStorage.setItem('equippedSkin', skinId);
    alert('¡Skin equipado! Tus cartas tendrán este diseño.');
  };

  const handleBuyBoard = (board: BoardTheme) => {
    if (board.owned || ownedBoards.includes(board.id)) {
      alert('¡Ya tienes este tablero!');
      return;
    }

    if (!board.unlocked) {
      alert('Este tablero aún no está disponible');
      return;
    }

    const hasEnough = board.currency === 'coins' ? coins >= board.price : gems >= board.price;
    
    if (!hasEnough) {
      alert(`No tienes suficientes ${board.currency === 'coins' ? 'monedas' : 'gemas'}`);
      return;
    }

    const newOwned = [...ownedBoards, board.id];
    setOwnedBoards(newOwned);
    localStorage.setItem('ownedBoards', JSON.stringify(newOwned));
    alert(`¡Has comprado ${board.name}!`);
  };

  const handleEquipBoard = (boardId: string) => {
    setEquippedBoard(boardId);
    localStorage.setItem('equippedBoard', boardId);
    alert('¡Tablero equipado! Se usará en tus partidas.');
  };

  return (
    <div 
      className="min-h-screen text-white p-8 relative overflow-hidden"
      style={{
        backgroundImage: "url('/fonlobby.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Lobby</span>
        </button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
          🛒 TIENDA DE CARTAS
        </h1>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-gray-800/50 rounded-xl backdrop-blur-sm border border-yellow-500/50">
            <span className="text-yellow-400 font-bold">{coins.toLocaleString()} 💰</span>
          </div>
          <div className="px-4 py-2 bg-gray-800/50 rounded-xl backdrop-blur-sm border border-blue-500/50">
            <span className="text-blue-400 font-bold">{gems.toLocaleString()} 💎</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Category Tabs */}
        <div className="flex gap-4 mb-8 justify-center">
          {[
            { id: 'cards', label: 'Packs de Cartas', icon: ShoppingCart },
            { id: 'frames', label: 'Marcos de Perfil', icon: Frame },
            { id: 'skins', label: 'Skins de Cartas', icon: Palette },
            { id: 'boards', label: 'Marcos de Tablero', icon: LayoutGrid },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedCategory(tab.id as ShopCategory);
                setSelectedPack(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800/50 text-gray-400 hover:text-white backdrop-blur-sm border border-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-center text-gray-300 mb-8">
          {selectedCategory === 'cards' && 'Desbloquea nuevos packs de cartas para personalizar tu experiencia de juego'}
          {selectedCategory === 'frames' && 'Personaliza tu perfil con marcos únicos y elegantes'}
          {selectedCategory === 'skins' && 'Cambia el aspecto de tus cartas con diseños increíbles'}
          {selectedCategory === 'boards' && 'Transforma el tablero de juego con temas espectaculares'}
        </p>

        {/* CARDS CATEGORY */}
        {selectedCategory === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {CARD_PACKS.map((pack, index) => {
              const isOwned = ownedPacks.includes(pack.id);
              const isSelected = selectedPack === pack.id;

              return (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'scale-105 shadow-2xl' : 'hover:scale-102'
                  } ${
                    isOwned ? 'bg-green-900/30 border-green-500' : 
                    pack.unlocked ? `bg-gray-800/50 ${RARITY_COLORS[pack.rarity]}` : 
                    'bg-gray-900/50 border-gray-700 opacity-60'
                  }`}
                >
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                    pack.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
                    pack.rarity === 'epic' ? 'bg-purple-500 text-white' :
                    pack.rarity === 'rare' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {pack.rarity}
                  </div>

                  {!pack.unlocked && (
                    <div className="absolute top-2 left-2">
                      <Lock className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  {isOwned && equippedPack !== pack.id && (
                    <div className="absolute top-2 left-2">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  {equippedPack === pack.id && (
                    <motion.div 
                      className="absolute top-2 left-2"
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  )}

                  <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br ${pack.gradient} flex items-center justify-center text-4xl shadow-lg`}>
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-white text-center mb-2">{pack.name}</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">{pack.description}</p>

                  <div className="grid grid-cols-4 gap-1 mb-4">
                    {pack.cards.map((card, i) => (
                      <div
                        key={i}
                        className="w-full aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center text-3xl border border-gray-700"
                      >
                        {card}
                      </div>
                    ))}
                  </div>

                  {isOwned ? (
                    <div className="space-y-2">
                      <div className="w-full py-2 bg-green-500/20 rounded-lg text-center">
                        <span className="text-green-400 font-bold">✓ DESBLOQUEADO</span>
                      </div>
                      {equippedPack === pack.id ? (
                        <div className="w-full py-2 bg-cyan-500/30 rounded-lg text-center border-2 border-cyan-400">
                          <span className="text-cyan-300 font-bold flex items-center justify-center gap-2">
                            <Star className="w-4 h-4 fill-cyan-300" />
                            EQUIPADO
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEquipPack(pack.id);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 rounded-lg font-bold transition-all"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  ) : !pack.unlocked ? (
                    <div className="w-full py-2 bg-gray-700/50 rounded-lg text-center">
                      <span className="text-gray-400 font-bold">🔒 BLOQUEADO</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyPack(pack);
                      }}
                      className={`w-full py-2 rounded-lg font-bold transition-all bg-gradient-to-r ${pack.gradient} hover:brightness-110 shadow-lg`}
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      {pack.price} {pack.currency === 'coins' ? '💰' : '💎'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* FRAMES CATEGORY */}
        {selectedCategory === 'frames' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROFILE_FRAMES.map((frame, index) => {
              const isOwned = ownedFrames.includes(frame.id);

              return (
                <motion.div
                  key={frame.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 transition-all hover:scale-102 ${
                    isOwned ? 'bg-green-900/30 border-green-500' : 
                    frame.unlocked ? `bg-gray-800/50 ${RARITY_COLORS[frame.rarity]}` : 
                    'bg-gray-900/50 border-gray-700 opacity-60'
                  }`}
                >
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                    frame.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
                    frame.rarity === 'epic' ? 'bg-purple-500 text-white' :
                    frame.rarity === 'rare' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {frame.rarity}
                  </div>

                  {!frame.unlocked && (
                    <div className="absolute top-2 left-2">
                      <Lock className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  {isOwned && equippedFrame !== frame.id && (
                    <div className="absolute top-2 left-2">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  {equippedFrame === frame.id && (
                    <motion.div 
                      className="absolute top-2 left-2"
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  )}

                  <div className={`w-32 h-32 mx-auto mb-4 rounded-full ${frame.borderStyle} bg-gradient-to-br ${frame.gradient} flex items-center justify-center text-6xl shadow-lg`}>
                    {frame.preview}
                  </div>

                  <h3 className="text-xl font-bold text-white text-center mb-2">{frame.name}</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">{frame.description}</p>

                  {isOwned ? (
                    <div className="space-y-2">
                      <div className="w-full py-2 bg-green-500/20 rounded-lg text-center">
                        <span className="text-green-400 font-bold">✓ DESBLOQUEADO</span>
                      </div>
                      {equippedFrame === frame.id ? (
                        <div className="w-full py-2 bg-cyan-500/30 rounded-lg text-center border-2 border-cyan-400">
                          <span className="text-cyan-300 font-bold flex items-center justify-center gap-2">
                            <Star className="w-4 h-4 fill-cyan-300" />
                            EQUIPADO
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipFrame(frame.id)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 rounded-lg font-bold transition-all"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  ) : !frame.unlocked ? (
                    <div className="w-full py-2 bg-gray-700/50 rounded-lg text-center">
                      <span className="text-gray-400 font-bold">🔒 BLOQUEADO</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuyFrame(frame)}
                      className={`w-full py-2 rounded-lg font-bold transition-all bg-gradient-to-r ${frame.gradient} hover:brightness-110 shadow-lg`}
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      {frame.price} {frame.currency === 'coins' ? '💰' : '💎'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* SKINS CATEGORY */}
        {selectedCategory === 'skins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CARD_SKINS.map((skin, index) => {
              const isOwned = ownedSkins.includes(skin.id);

              return (
                <motion.div
                  key={skin.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 transition-all hover:scale-102 ${
                    isOwned ? 'bg-green-900/30 border-green-500' : 
                    skin.unlocked ? `bg-gray-800/50 ${RARITY_COLORS[skin.rarity]}` : 
                    'bg-gray-900/50 border-gray-700 opacity-60'
                  }`}
                >
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                    skin.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
                    skin.rarity === 'epic' ? 'bg-purple-500 text-white' :
                    skin.rarity === 'rare' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {skin.rarity}
                  </div>

                  {!skin.unlocked && (
                    <div className="absolute top-2 left-2">
                      <Lock className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  {isOwned && equippedSkin !== skin.id && (
                    <div className="absolute top-2 left-2">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  {equippedSkin === skin.id && (
                    <motion.div 
                      className="absolute top-2 left-2"
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  )}

                  <div className={`w-32 h-40 mx-auto mb-4 rounded-xl ${skin.pattern} flex items-center justify-center text-6xl shadow-lg border-4 border-white/20`}>
                    {skin.preview}
                  </div>

                  <h3 className="text-xl font-bold text-white text-center mb-2">{skin.name}</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">{skin.description}</p>

                  {isOwned ? (
                    <div className="space-y-2">
                      <div className="w-full py-2 bg-green-500/20 rounded-lg text-center">
                        <span className="text-green-400 font-bold">✓ DESBLOQUEADO</span>
                      </div>
                      {equippedSkin === skin.id ? (
                        <div className="w-full py-2 bg-cyan-500/30 rounded-lg text-center border-2 border-cyan-400">
                          <span className="text-cyan-300 font-bold flex items-center justify-center gap-2">
                            <Star className="w-4 h-4 fill-cyan-300" />
                            EQUIPADO
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipSkin(skin.id)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 rounded-lg font-bold transition-all"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  ) : !skin.unlocked ? (
                    <div className="w-full py-2 bg-gray-700/50 rounded-lg text-center">
                      <span className="text-gray-400 font-bold">🔒 BLOQUEADO</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuySkin(skin)}
                      className={`w-full py-2 rounded-lg font-bold transition-all bg-gradient-to-r ${skin.gradient} hover:brightness-110 shadow-lg`}
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      {skin.price} {skin.currency === 'coins' ? '💰' : '💎'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* BOARDS CATEGORY */}
        {selectedCategory === 'boards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BOARD_THEMES.map((board, index) => {
              const isOwned = ownedBoards.includes(board.id);

              return (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 transition-all hover:scale-102 ${
                    isOwned ? 'bg-green-900/30 border-green-500' : 
                    board.unlocked ? `bg-gray-800/50 ${RARITY_COLORS[board.rarity]}` : 
                    'bg-gray-900/50 border-gray-700 opacity-60'
                  }`}
                >
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                    board.rarity === 'legendary' ? 'bg-yellow-500 text-black' :
                    board.rarity === 'epic' ? 'bg-purple-500 text-white' :
                    board.rarity === 'rare' ? 'bg-blue-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {board.rarity}
                  </div>

                  {!board.unlocked && (
                    <div className="absolute top-2 left-2">
                      <Lock className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  {isOwned && equippedBoard !== board.id && (
                    <div className="absolute top-2 left-2">
                      <Check className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  {equippedBoard === board.id && (
                    <motion.div 
                      className="absolute top-2 left-2"
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  )}

                  <div className={`w-full h-40 mx-auto mb-4 rounded-xl ${board.bgColor} bg-gradient-to-br ${board.gradient} flex items-center justify-center text-6xl shadow-lg border-4 border-white/20`}>
                    {board.preview}
                  </div>

                  <h3 className="text-xl font-bold text-white text-center mb-2">{board.name}</h3>
                  <p className="text-sm text-gray-400 text-center mb-4">{board.description}</p>

                  {isOwned ? (
                    <div className="space-y-2">
                      <div className="w-full py-2 bg-green-500/20 rounded-lg text-center">
                        <span className="text-green-400 font-bold">✓ DESBLOQUEADO</span>
                      </div>
                      {equippedBoard === board.id ? (
                        <div className="w-full py-2 bg-cyan-500/30 rounded-lg text-center border-2 border-cyan-400">
                          <span className="text-cyan-300 font-bold flex items-center justify-center gap-2">
                            <Star className="w-4 h-4 fill-cyan-300" />
                            EQUIPADO
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEquipBoard(board.id)}
                          className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 rounded-lg font-bold transition-all"
                        >
                          Equipar
                        </button>
                      )}
                    </div>
                  ) : !board.unlocked ? (
                    <div className="w-full py-2 bg-gray-700/50 rounded-lg text-center">
                      <span className="text-gray-400 font-bold">🔒 BLOQUEADO</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBuyBoard(board)}
                      className={`w-full py-2 rounded-lg font-bold transition-all bg-gradient-to-r ${board.gradient} hover:brightness-110 shadow-lg`}
                    >
                      <ShoppingCart className="w-4 h-4 inline mr-2" />
                      {board.price} {board.currency === 'coins' ? '💰' : '💎'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Selected Pack Details (solo para cards) */}
        {selectedCategory === 'cards' && selectedPack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-gray-800/50 rounded-2xl backdrop-blur-xl border border-purple-500/50"
          >
            {(() => {
              const pack = CARD_PACKS.find(p => p.id === selectedPack);
              if (!pack) return null;
              const isOwned = ownedPacks.includes(pack.id);

              return (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
                    <p className="text-gray-300 mb-4">{pack.description}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gray-400">Rareza: <span className={`font-bold ${
                        pack.rarity === 'legendary' ? 'text-yellow-400' :
                        pack.rarity === 'epic' ? 'text-purple-400' :
                        pack.rarity === 'rare' ? 'text-blue-400' :
                        'text-gray-400'
                      }`}>{pack.rarity.toUpperCase()}</span></span>
                      <span className="text-gray-400">Cartas: <span className="font-bold text-white">{pack.cards.length}</span></span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-6xl">
                    {pack.cards.slice(0, 4).map((card, i) => (
                      <motion.div
                        key={i}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                      >
                        {card}
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </div>
    </div>
  );
}
