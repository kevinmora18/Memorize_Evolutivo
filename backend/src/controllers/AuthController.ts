import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { loginSchema, registerSchema } from '../core/validation/schemas';
import { ValidationError } from '../core/errors/AppError';

/**
 * AuthController - Controlador para rutas de autenticación
 *
 * EXPLICACIÓN POO:
 * - SRP: Solo maneja peticiones HTTP de autenticación
 * - DEPENDENCY INJECTION: Recibe el servicio como dependencia
 * - SEPARACIÓN DE RESPONSABILIDADES: No contiene lógica de negocio
 *
 * SEGURIDAD:
 * - Validación de entrada con zod antes de tocar el servicio
 * - Los errores tipados (AppError) los serializa el middleware global
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * POST /api/auth/register
   * Crear cuenta con email + contraseña
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues[0]?.message || 'Datos inválidos');
      }

      const { user, token } = await this.authService.register(
        parsed.data.email,
        parsed.data.password,
        parsed.data.username
      );

      res.status(201).json({ token, user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/auth/login
   * Iniciar sesión con email + contraseña
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues[0]?.message || 'Datos inválidos');
      }

      const { user, token } = await this.authService.login(parsed.data.email, parsed.data.password);

      res.json({ token, user: user.toJSON() });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/validate/:userId
   * Validar si un usuario tiene acceso
   */
  validateAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const hasAccess = await this.authService.validateAccess(userId);

      res.json({ hasAccess });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/auth/is-admin/:userId
   * Verificar si un usuario es admin
   */
  checkAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId as string;

      const isAdmin = await this.authService.isAdmin(userId);

      res.json({ isAdmin });
    } catch (error) {
      next(error);
    }
  };
}
