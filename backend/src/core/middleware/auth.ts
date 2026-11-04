import { Request, Response, NextFunction } from 'express';
import { JwtUtil, TokenPayload } from '../JwtUtil';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';
import { Container } from '../../Container';

/**
 * Extiende Request de Express con el usuario autenticado (inyectado por requireAuth).
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: TokenPayload;
    }
  }
}

interface DbAuthState {
  id: string;
  email: string;
  role: string;
  isBanned: boolean;
  bannedUntil: Date | null;
  deletedAt: Date | null;
}

/**
 * Verifica el JWT y, además, contrasta el estado actual del usuario en la BD.
 *
 * SEGURIDAD:
 * - Un token sigue siendo válido criptográficamente aunque el usuario sea
 *   baneado o eliminado; por eso se consulta la BD en cada petición.
 * - El rol SIEMPRE se toma de la BD (fuente de verdad), no del token. Así un
 *   cambio de rol se aplica de inmediato y un token antiguo no conserva
 *   privilegios de admin.
 * - Usuarios con `deletedAt` no pueden autenticarse.
 */
async function resolveAuth(req: Request): Promise<TokenPayload> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticación requerido');
  }

  const payload = JwtUtil.verify(header.slice(7).trim());

  const prisma = Container.getInstance().prisma;
  const dbUser: DbAuthState | null = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isBanned: true,
      bannedUntil: true,
      deletedAt: true,
    },
  });

  if (!dbUser || dbUser.deletedAt) {
    throw new UnauthorizedError('Token inválido o usuario eliminado');
  }

  const banActive = dbUser.isBanned
    && (!dbUser.bannedUntil || new Date() < dbUser.bannedUntil);

  if (banActive) {
    throw new ForbiddenError(
      dbUser.bannedUntil
        ? `Usuario baneado hasta ${dbUser.bannedUntil.toISOString()}`
        : 'Usuario baneado permanentemente'
    );
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
  };
}

/**
 * Middleware: exige un JWT válido en `Authorization: Bearer <token>`.
 * Nunca confiar en IDs enviados por el cliente para autorización.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    req.auth = await resolveAuth(req);
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: autenticación opcional. Si no hay token (o es inválido) la
 * petición continúa como anónima; si el usuario está baneado se rechaza.
 * Se usa en endpoints públicos que muestran más datos al dueño/admin.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    req.auth = await resolveAuth(req);
    next();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      next(error);
      return;
    }
    // Token inválido/expirado: tratar como anónimo en rutas públicas.
    next();
  }
}

/**
 * Middleware: exige JWT válido con rol admin (rol leído de la BD).
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, (err?: unknown) => {
    if (err) {
      next(err);
      return;
    }
    if (req.auth?.role !== 'admin') {
      next(new ForbiddenError('Se requiere rol de administrador'));
      return;
    }
    next();
  });
}

/**
 * Middleware: exige JWT válido y que el usuario autenticado sea el dueño del recurso
 * (`req.params.userId` o `req.params.id`) o un admin.
 */
export async function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, (err?: unknown) => {
    if (err) {
      next(err);
      return;
    }
    const targetId = req.params.userId || req.params.id;
    if (req.auth!.role === 'admin' || req.auth!.userId === targetId) {
      next();
      return;
    }
    next(new ForbiddenError('No puedes operar sobre otro usuario'));
  });
}
