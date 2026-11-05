/**
 * Catálogo oficial de la tienda (fuente de verdad del servidor).
 *
 * ¿Por qué existe?
 * El cliente mostraba los precios, pero enviaba `price` y `currency` al
 * backend. Un cliente malicioso podía comprar un artículo de 3000 monedas
 * por 1. Aquí centralizamos precios y disponibilidad: el servidor ignora
 * cualquier importe enviado por el navegador.
 *
 * Debe mantenerse sincronizado con `frontend/src/components/TiendaScreen.tsx`.
 */

export type ShopItemType = 'pack' | 'frame' | 'skin' | 'board';
export type ShopCurrency = 'coins' | 'gems';

export interface ShopItemDef {
  itemId: string;
  itemType: ShopItemType;
  price: number;
  currency: ShopCurrency;
  /** Si es false, el artículo aún no puede comprarse. */
  available: boolean;
}

const ITEMS: ShopItemDef[] = [
  // Packs de cartas
  { itemId: 'frutas', itemType: 'pack', price: 0, currency: 'coins', available: true },
  { itemId: 'animales', itemType: 'pack', price: 500, currency: 'coins', available: true },
  { itemId: 'espacio', itemType: 'pack', price: 1000, currency: 'coins', available: true },
  { itemId: 'oceano', itemType: 'pack', price: 1500, currency: 'coins', available: true },
  { itemId: 'magico', itemType: 'pack', price: 2500, currency: 'coins', available: true },
  { itemId: 'dragon', itemType: 'pack', price: 100, currency: 'gems', available: true },
  { itemId: 'cyber', itemType: 'pack', price: 3000, currency: 'coins', available: false },
  { itemId: 'celestial', itemType: 'pack', price: 150, currency: 'gems', available: false },

  // Marcos de perfil
  { itemId: 'basic', itemType: 'frame', price: 0, currency: 'coins', available: true },
  { itemId: 'gold', itemType: 'frame', price: 1000, currency: 'coins', available: true },
  { itemId: 'diamond', itemType: 'frame', price: 200, currency: 'gems', available: true },
  { itemId: 'fire', itemType: 'frame', price: 2500, currency: 'coins', available: true },
  { itemId: 'cosmic', itemType: 'frame', price: 300, currency: 'gems', available: true },
  { itemId: 'rainbow', itemType: 'frame', price: 3500, currency: 'coins', available: false },

  // Skins de cartas
  { itemId: 'classic', itemType: 'skin', price: 0, currency: 'coins', available: true },
  { itemId: 'neon', itemType: 'skin', price: 800, currency: 'coins', available: true },
  { itemId: 'gold', itemType: 'skin', price: 1500, currency: 'coins', available: true },
  { itemId: 'ice', itemType: 'skin', price: 150, currency: 'gems', available: true },
  { itemId: 'shadow', itemType: 'skin', price: 2000, currency: 'coins', available: false },
  { itemId: 'galaxy', itemType: 'skin', price: 250, currency: 'gems', available: false },

  // Tableros
  { itemId: 'default', itemType: 'board', price: 0, currency: 'coins', available: true },
  { itemId: 'forest', itemType: 'board', price: 1200, currency: 'coins', available: true },
  { itemId: 'ocean', itemType: 'board', price: 1500, currency: 'coins', available: true },
  { itemId: 'volcano', itemType: 'board', price: 2000, currency: 'coins', available: true },
  { itemId: 'space', itemType: 'board', price: 180, currency: 'gems', available: true },
  { itemId: 'heaven', itemType: 'board', price: 3000, currency: 'coins', available: false },
];

const CATALOG = new Map<string, ShopItemDef>(
  ITEMS.map((item) => [`${item.itemType}:${item.itemId}`, item])
);

export function findShopItem(itemType: unknown, itemId: unknown): ShopItemDef | undefined {
  if (typeof itemType !== 'string' || typeof itemId !== 'string') return undefined;
  return CATALOG.get(`${itemType}:${itemId}`);
}

/** Campos de inventario por tipo de artículo. */
export const INVENTORY_FIELD: Record<ShopItemType, 'ownedPacks' | 'ownedFrames' | 'ownedSkins' | 'ownedBoards'> = {
  pack: 'ownedPacks',
  frame: 'ownedFrames',
  skin: 'ownedSkins',
  board: 'ownedBoards',
};

/** Artículo equipado por defecto (siempre poseído). */
export const DEFAULT_EQUIPPED: Record<ShopItemType, string> = {
  pack: 'frutas',
  frame: 'basic',
  skin: 'classic',
  board: 'default',
};

/** Campo `equipped*` del inventario por tipo. */
export const EQUIPPED_FIELD: Record<ShopItemType, 'equippedPack' | 'equippedFrame' | 'equippedSkin' | 'equippedBoard'> = {
  pack: 'equippedPack',
  frame: 'equippedFrame',
  skin: 'equippedSkin',
  board: 'equippedBoard',
};
