/**
 * Enum de Acciones Administrativas
 * 
 * PRINCIPIO SOLID - Open/Closed Principle (OCP):
 * - Centraliza las acciones administrativas en un solo lugar
 * - Extensible: agregar nuevas acciones sin modificar código existente
 * - Cerrado a modificación: los servicios usan estos valores sin hardcodear strings
 */
export enum AdminAction {
  // Gestión de usuarios
  BAN_USER = 'ban_user',
  UNBAN_USER = 'unban_user',
  DELETE_USER = 'delete_user',
  CHANGE_ROLE = 'change_role',
  
  // Gestión de moneda
  GIVE_CURRENCY = 'give_currency',
  GIVE_CURRENCY_ALL = 'give_currency_all',
  
  // Gestión de contenido
  CREATE_DECK = 'create_deck',
  UPDATE_DECK = 'update_deck',
  DELETE_DECK = 'delete_deck',
  
  CREATE_FLASHCARD = 'create_flashcard',
  UPDATE_FLASHCARD = 'update_flashcard',
  DELETE_FLASHCARD = 'delete_flashcard',
  
  // Gestión de configuración
  UPDATE_CONFIG = 'update_config',
  
  // Otras acciones futuras se pueden agregar aquí sin tocar el resto del código
}

/**
 * Utilidad para validar si una acción es válida
 */
export function isValidAdminAction(action: string): action is AdminAction {
  return Object.values(AdminAction).includes(action as AdminAction);
}

/**
 * Descripción legible de cada acción
 */
export const AdminActionLabels: Record<AdminAction, string> = {
  [AdminAction.BAN_USER]: 'Banear usuario',
  [AdminAction.UNBAN_USER]: 'Desbanear usuario',
  [AdminAction.DELETE_USER]: 'Eliminar usuario',
  [AdminAction.CHANGE_ROLE]: 'Cambiar rol',
  [AdminAction.GIVE_CURRENCY]: 'Dar moneda a usuario',
  [AdminAction.GIVE_CURRENCY_ALL]: 'Dar moneda a todos',
  [AdminAction.CREATE_DECK]: 'Crear mazo',
  [AdminAction.UPDATE_DECK]: 'Actualizar mazo',
  [AdminAction.DELETE_DECK]: 'Eliminar mazo',
  [AdminAction.CREATE_FLASHCARD]: 'Crear flashcard',
  [AdminAction.UPDATE_FLASHCARD]: 'Actualizar flashcard',
  [AdminAction.DELETE_FLASHCARD]: 'Eliminar flashcard',
  [AdminAction.UPDATE_CONFIG]: 'Actualizar configuración',
};
