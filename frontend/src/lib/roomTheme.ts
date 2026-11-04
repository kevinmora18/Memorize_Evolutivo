// Sistema de Fondos Vinculados para Perfil, Lobby y Salas de Juego
import { useState, useEffect } from 'react';

export interface RoomThemeDef {
  id: string;
  name: string;
  subtitle: string;
  lore: string;
  accent: string;
  image: string;
  glow: string;
  icon: string;
  badge: string;
}

export const ROOM_THEMES: Record<string, RoomThemeDef> = {
  neural: {
    id: 'neural',
    name: 'Neural Nexus',
    subtitle: 'El Núcleo Sináptico',
    lore: 'Pulsos de energía y memorias cuánticas que conectan las sinapsis de la sala.',
    accent: '#2BE08F',
    image: '/classic/wing-neural-1920.webp',
    glow: 'rgba(43, 224, 143, 0.25)',
    icon: '🧠',
    badge: 'Sináptico',
  },
  verdalis: {
    id: 'verdalis',
    name: 'Verdalis',
    subtitle: 'El Bosque que Recuerda',
    lore: 'Ruinas cubiertas de musgo donde cada espora flotante protege una memoria.',
    accent: '#8FE04A',
    image: '/classic/wing-verdalis-1920.webp',
    glow: 'rgba(143, 224, 74, 0.25)',
    icon: '🌿',
    badge: 'Naturaleza',
  },
  frostheim: {
    id: 'frostheim',
    name: 'Frostheim',
    subtitle: 'La Catedral de Hielo',
    lore: 'Escarcha cristalina y vientos gélidos que conservan las reliquias intactas.',
    accent: '#6EE7F5',
    image: '/classic/wing-frostheim-1920.webp',
    glow: 'rgba(110, 231, 245, 0.25)',
    icon: '❄️',
    badge: 'Glacial',
  },
  volcania: {
    id: 'volcania',
    name: 'Volcania',
    subtitle: 'La Forja Viva',
    lore: 'Magma ardiente y calor abrasador para los duelos de reflejos más intensos.',
    accent: '#FF6B35',
    image: '/classic/wing-volcania-1920.webp',
    glow: 'rgba(255, 107, 53, 0.25)',
    icon: '🌋',
    badge: 'Fuego',
  },
  lunaris: {
    id: 'lunaris',
    name: 'Lunaris',
    subtitle: 'El Eclipse Cósmico',
    lore: 'Bóveda estelar infinita bajo la luz de una luna que distorsiona el tiempo.',
    accent: '#B79CFF',
    image: '/classic/wing-lunaris-1920.webp',
    glow: 'rgba(183, 156, 255, 0.25)',
    icon: '🌙',
    badge: 'Cósmico',
  },
  archive: {
    id: 'archive',
    name: 'Gran Archivo',
    subtitle: 'Cámara de Custodia',
    lore: 'El santuario central donde se registran todas las victorias y rangos.',
    accent: '#35E0C8',
    image: '/classic/map-hero-1920.webp',
    glow: 'rgba(53, 224, 200, 0.25)',
    icon: '🏛️',
    badge: 'Imperial',
  },
};

export const THEME_LIST = Object.values(ROOM_THEMES);

export function getEquippedRoomTheme(): RoomThemeDef {
  try {
    const saved = localStorage.getItem('equippedRoomTheme') || 'neural';
    return ROOM_THEMES[saved] || ROOM_THEMES.neural;
  } catch {
    return ROOM_THEMES.neural;
  }
}

export function setEquippedRoomTheme(themeId: string): RoomThemeDef {
  const chosen = ROOM_THEMES[themeId] || ROOM_THEMES.neural;
  try {
    localStorage.setItem('equippedRoomTheme', chosen.id);
    window.dispatchEvent(new CustomEvent('roomThemeChanged', { detail: chosen }));
  } catch (e) {
    console.error('Error guardando fondo de sala:', e);
  }
  return chosen;
}

/**
 * Hook reactivo para sincronizar el fondo equipado en tiempo real
 * en cualquier pantalla (Lobby, Perfil, Salas, Tienda, etc.)
 */
export function useEquippedRoomTheme(): RoomThemeDef {
  const [theme, setTheme] = useState<RoomThemeDef>(getEquippedRoomTheme);

  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail && e.detail.id) {
        setTheme(e.detail);
      } else {
        setTheme(getEquippedRoomTheme());
      }
    };

    window.addEventListener('roomThemeChanged', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('roomThemeChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return theme;
}

