import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

/**
 * AuthController - Controlador para rutas de autenticación
 * 
 * EXPLICACIÓN POO:
 * - SRP: Solo maneja peticiones HTTP de autenticación
 * - DEPENDENCY INJECTION: Recibe el servicio como dependencia
 * - SEPARACIÓN DE RESPONSABILIDADES: No contiene lógica de negocio
 */
export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * POST /api/auth/login
   * Login o registro automático
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        res.status(400).json({ error: 'Email válido requerido' });
        return;
      }

      const user = await this.authService.loginOrRegister(email);

      res.json(user.toJSON());
    } catch (error: any) {
      if (error.message.includes('baneado')) {
        res.status(403).json({ error: error.message });
      } else {
        next(error);
      }
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
