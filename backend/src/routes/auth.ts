import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Container } from '../Container';
import { requireSelfOrAdmin } from '../core/middleware/auth';
import { JwtUtil } from '../core/JwtUtil';

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
 * - Logout revoca el JWT activo en el servidor.
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

// POST /api/auth/logout - Revocar sesión
router.post('/logout', (req, res) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    JwtUtil.revoke(token);
  }
  res.json({ message: 'Sesión cerrada exitosamente' });
});

// GET /api/auth/validate/:userId - Validar acceso (solo el propio usuario o admin)
router.get('/validate/:userId', requireSelfOrAdmin, authController.validateAccess);

// GET /api/auth/is-admin/:userId - Verificar si es admin (solo el propio usuario o admin)
router.get('/is-admin/:userId', requireSelfOrAdmin, authController.checkAdmin);

export default router;
