/**
 * index.ts - Servidor principal con arquitectura POO
 * 
 * EXPLICACIÓN:
 * Este archivo usa arquitectura POO profesional:
 * 1. Usa el Container para inyección de dependencias
 * 2. Usa SocketManager para manejar eventos
 * 3. Las rutas usan controladores
 * 4. Toda la lógica está organizada en capas
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importar Container (Dependency Injection)
import { Container } from './Container';

// Importar errores tipados
import { AppError } from './core/errors/AppError';

// Importar rutas POO
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roomRoutes from './routes/rooms';

// Importar rutas restantes (aún no migradas)
import matchRoutes from './routes/matches';
import adminRoutes from './routes/admin';
import leaderboardRoutes from './routes/leaderboard';

// Importar SocketManager
import { SocketManager } from './socket/SocketManager';

// Configuración
dotenv.config();

/**
 * Validación de variables de entorno (fail-fast).
 * Un servidor no debe arrancar con configuración insegura o incompleta.
 */
function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variables de entorno faltantes: ${missing.join(', ')}. Revisa backend/.env (usa backend/.env.example como guía).`
    );
  }

  if ((process.env.JWT_SECRET as string).length < 16) {
    throw new Error('JWT_SECRET debe tener al menos 16 caracteres.');
  }
}

/**
 * Orígenes permitidos para CORS (whitelist).
 * FRONTEND_URL admite varios orígenes separados por coma.
 */
function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    fromEnv.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176');
  }

  return Array.from(new Set(fromEnv.length > 0 ? fromEnv : ['http://localhost:5173']));
}

validateEnv();

// Prisma usa BigInt para totalScore; JSON.stringify lo revienta.
// Convertir BigInt a Number globalmente para que res.json() no dé 500.
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

// Exportar prisma para compatibilidad con rutas antiguas
export let prisma: any;

/**
 * Función principal asíncrona
 */
async function bootstrap() {
  console.log('🚀 Iniciando servidor con arquitectura POO...\n');

  // ============================================
  // 1. INICIALIZAR CONTAINER
  // ============================================
  const container = Container.getInstance();
  await container.initialize();
  
  // Exportar prisma para compatibilidad
  prisma = container.prisma;

  // ============================================
  // 2. CONFIGURAR EXPRESS
  // ============================================
  const app = express();
  const httpServer = createServer(app);
  const allowedOrigins = getAllowedOrigins();

  // Middleware de seguridad
  app.use(helmet());
  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));

  // Rate limit global para la API
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones. Intenta de nuevo más tarde.' },
  }));

  // ============================================
  // 3. CONFIGURAR RUTAS
  // ============================================
  
  // Rutas con arquitectura POO
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/rooms', roomRoutes);
  
  // Rutas pendientes de migrar
  app.use('/api/matches', matchRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);

  // Health check
  app.get('/health', (req, res) => {
    const roomStats = container.roomManager.getStats();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      architecture: 'POO',
      rooms: roomStats,
    });
  });

  // ============================================
  // 4. CONFIGURAR SOCKET.IO
  // ============================================
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Inicializar SocketManager
  const socketManager = new SocketManager(io, container.roomManager);
  socketManager.initialize();

  // ============================================
  // 5. ERROR HANDLING
  // ============================================

  // 404 para rutas de API desconocidas
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
  });

  // Manejador global de errores.
  // - AppError: errores esperados, mensaje seguro de exponer.
  // - Otros: nunca filtrar detalles internos en producción.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isKnownError = err instanceof AppError;
    const status = isKnownError ? err.status : err.status || 500;

    if (!isKnownError) {
      console.error('❌ Error inesperado:', err);
    }

    res.status(status).json({
      error: isKnownError ? err.message : isProduction ? 'Error interno del servidor' : err.message,
      ...(isKnownError ? { code: err.code } : {}),
    });
  });

  // ============================================
  // 6. INICIAR SERVIDOR
  // ============================================
  const PORT = process.env.PORT || 5175;

  httpServer.listen(PORT, () => {
    console.log('\n✅ Servidor iniciado con éxito!\n');
    console.log(`🌐 Servidor HTTP: http://localhost:${PORT}`);
    console.log(`📡 Socket.IO: ws://localhost:${PORT}`);
    console.log(`🗄️  Base de datos: Conectada (Prisma + PostgreSQL)`);
    console.log(`🏗️  Arquitectura: POO con Dependency Injection`);
    console.log('\n📚 Endpoints disponibles:');
    console.log('   GET  /health');
    console.log('   POST /api/auth/login');
    console.log('   GET  /api/users/:userId');
    console.log('   GET  /api/rooms');
    console.log('   POST /api/rooms');
    console.log('   ... y más\n');
  });

  // ============================================
  // 7. GRACEFUL SHUTDOWN
  // ============================================
  const shutdown = async () => {
    console.log('\n🛑 Iniciando shutdown graceful...');
    
    try {
      await container.shutdown();
      
      httpServer.close(() => {
        console.log('✅ Servidor HTTP cerrado');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('⚠️  Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
      
    } catch (error) {
      console.error('❌ Error durante shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Capturar errores no manejados
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    shutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
  });
}

// Iniciar aplicación
bootstrap().catch((error) => {
  console.error('❌ Error fatal al iniciar servidor:', error);
  process.exit(1);
});
