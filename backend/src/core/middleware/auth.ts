import { Request, Response, NextFunction } from 'express';
import { JwtUtil, TokenPayload } from '../JwtUtil';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError';

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

/**
 * Middleware: exige un JWT válido en `Authorization: Bearer <token>`.
 * Nunca confiar en IDs enviados por el cliente para autorización.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('Token de autenticación requerido'));
    return;
  }

  try {
    req.auth = JwtUtil.verify(header.slice(7).trim());
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
}

/**
 * Middleware: exige JWT válido con rol admin.
 * Reemplaza la verificación anterior basada en `adminId` del body (suplantable).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, (err?: unknown) => {
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
export function requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, (err?: unknown) => {
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
