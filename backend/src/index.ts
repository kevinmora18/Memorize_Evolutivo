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
import dotenv from 'dotenv';

// Importar Container (Dependency Injection)
import { Container } from './Container';

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

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }));
  app.use(express.json());

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
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
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
