import { Router } from 'express';
import { Container } from '../Container';

/**
 * Auth Routes - Usando arquitectura POO
 * 
 * EXPLICACIÓN:
 * - Las rutas solo definen endpoints y delegan al controlador
 * - El controlador obtiene sus dependencias del Container
 * - Separación clara entre routing y lógica de negocio
 */

const router = Router();
const container = Container.getInstance();
const authController = container.authController;

// POST /api/auth/login - Login o registro automático
router.post('/login', authController.login);

// GET /api/auth/validate/:userId - Validar acceso de usuario
router.get('/validate/:userId', authController.validateAccess);

// GET /api/auth/is-admin/:userId - Verificar si es admin
router.get('/is-admin/:userId', authController.checkAdmin);

export default router;
