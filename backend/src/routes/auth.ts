import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Container } from '../Container';
import { requireAuth } from '../core/middleware/auth';

/**
 * Auth Routes - Usando arquitectura POO
 *
 * EXPLICACIÓN:
 * - Las rutas solo definen endpoints y delegan al controlador
 * - El controlador obtiene sus dependencias del Container
 * - Separación clara entre routing y lógica de negocio
 *
 * SEGURIDAD:
 * - Rate limit estricto en login/register (anti fuerza bruta)
 */

const router = Router();
const container = Container.getInstance();
const authController = container.authController;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo más tarde.' },
});

// POST /api/auth/register - Crear cuenta
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login - Iniciar sesión
router.post('/login', authLimiter, authController.login);

// GET /api/auth/validate/:userId - Validar acceso de usuario (requiere token)
router.get('/validate/:userId', requireAuth, authController.validateAccess);

// GET /api/auth/is-admin/:userId - Verificar si es admin (requiere token)
router.get('/is-admin/:userId', requireAuth, authController.checkAdmin);

export default router;
