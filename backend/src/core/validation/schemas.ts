import { z } from 'zod';

/**
 * Esquemas de validación de entrada (zod).
 * Toda entrada del cliente debe validarse antes de tocar lógica de negocio.
 */

export const emailSchema = z.string().trim().toLowerCase().email('Email inválido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña es demasiado larga');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z
    .string()
    .trim()
    .min(2, 'El nombre de usuario debe tener al menos 2 caracteres')
    .max(30, 'El nombre de usuario es demasiado largo')
    .optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Limita un parámetro de paginación a un rango seguro.
 */
export function clampLimit(raw: unknown, def = 50, max = 100): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return def;
  return Math.min(Math.floor(value), max);
}

export function clampPage(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return 1;
  return Math.floor(value);
}
