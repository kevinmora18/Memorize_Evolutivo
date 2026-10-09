import { PrismaClient } from '@prisma/client';
import { UserRepository } from './repositories/UserRepository';
import { PlayerStatsRepository } from './repositories/PlayerStatsRepository';
import { AuthService } from './services/AuthService';
import { UserService } from './services/UserService';
import { AuthController } from './controllers/AuthController';
import { RoomController } from './controllers/RoomController';
import { UserController } from './controllers/UserController';
import { RoomManager } from './managers/RoomManager';
import { GameEngine } from './engine/GameEngine';
import { GameModeFactory } from './models/strategies/GameModeFactory';
import { 
  PairsModeStrategy, 
  TriadsModeStrategy, 
  BossModeStrategy 
} from './models/strategies';

/**
 * Container - Contenedor de Inyección de Dependencias
 * 
 * EXPLICACIÓN POO:
 * - DEPENDENCY INJECTION: Centraliza la creación de todas las dependencias
 * - SINGLETON: Usa el patrón singleton para servicios compartidos
 * - INVERSION OF CONTROL: Las clases no crean sus dependencias, las reciben
 * - FACTORY PATTERN: Registra estrategias de juego en GameModeFactory
 * 
 * ARQUITECTURA POO APLICADA:
 * - Motor de Juego (GameEngine): Gestiona lógica de partida autoritativa
 * - Estrategias Polimórficas: PairsModeStrategy, TriadsModeStrategy, BossModeStrategy
 * - Factory Pattern: GameModeFactory para gestión de modos de juego
 * 
 * VENTAJAS:
 * - Facilita testing (podemos inyectar mocks)
 * - Desacopla componentes
 * - Facilita cambios (cambiar implementaciones sin tocar código)
 * - Centraliza configuración
 * - OCP: Nuevas estrategias se registran sin modificar código existente
 */
export class Container {
  private static instance: Container;

  // Clientes y managers compartidos
  public prisma: PrismaClient;
  public roomManager: RoomManager;
  public gameEngine: GameEngine;

  // Repositorios
  public userRepository: UserRepository;
  public statsRepository: PlayerStatsRepository;

  // Servicios
  public authService: AuthService;
  public userService: UserService;

  // Controladores
  public authController: AuthController;
  public roomController: RoomController;
  public userController: UserController;

  /**
   * Constructor privado (Singleton)
   */
  private constructor() {
    console.log('📦 Inicializando Container...\n');

    // ============================================
    // 1. CLIENTES Y MANAGERS
    // ============================================
    console.log('  🔌 Creando clientes...');
    this.prisma = new PrismaClient();
    this.roomManager = RoomManager.getInstance();

    // ============================================
    // 2. ESTRATEGIAS DE JUEGO (Factory Pattern)
    // ============================================
    console.log('  🎯 Registrando estrategias de juego...');
    this.initializeGameStrategies();

    // ============================================
    // 3. MOTOR DE JUEGO
    // ============================================
    console.log('  🎮 Creando motor de juego...');
    // El GameEngine se inicializa con callback en SocketManager
    // Aquí solo creamos una instancia por defecto para testing/future use
    this.gameEngine = new GameEngine((outcome) => {
      if (outcome.event) {
        console.log(`[GameEngine] Outcome: ${outcome.event}`);
      } else if (outcome.type) {
        console.log(`[GameEngine] Outcome: ${outcome.type}`);
      }
    });

    // ============================================
    // 4. REPOSITORIOS (necesitan prisma)
    // ============================================
    console.log('  🗄️  Creando repositorios...');
    this.userRepository = new UserRepository(this.prisma);
    this.statsRepository = new PlayerStatsRepository(this.prisma);

    // ============================================
    // 5. SERVICIOS (necesitan repositorios)
    // ============================================
    console.log('  ⚙️  Creando servicios...');
    this.authService = new AuthService(this.userRepository);
    this.userService = new UserService(this.userRepository, this.statsRepository);

    // ============================================
    // 6. CONTROLADORES (necesitan servicios)
    // ============================================
    console.log('  🎮 Creando controladores...');
    this.authController = new AuthController(this.authService);
    this.roomController = new RoomController(this.roomManager, this.userRepository);
    this.userController = new UserController(this.userService);

    console.log('\n✅ Container inicializado con todas las dependencias\n');
  }

  /**
   * Inicializar estrategias de juego (POLIMORFISMO + OCP)
   * 
   * EXPLICACIÓN POO:
   * - STRATEGY PATTERN: Cada modo de juego es una estrategia diferente
   * - FACTORY PATTERN: GameModeFactory gestiona el registro
   * - OCP: Para agregar un nuevo modo, solo registramos la estrategia aquí
   * - POLIMORFISMO: Todas implementan IGameModeStrategy
   */
  private initializeGameStrategies(): void {
    if (!GameModeFactory.hasMode('classic')) {
      GameModeFactory.registerStrategy('classic', new PairsModeStrategy());
    }
    if (!GameModeFactory.hasMode('triads')) {
      GameModeFactory.registerStrategy('triads', new TriadsModeStrategy());
    }
    if (!GameModeFactory.hasMode('boss')) {
      GameModeFactory.registerStrategy('boss', new BossModeStrategy());
    }

    const pairsStrategy = GameModeFactory.getStrategy('classic');
    const triadsStrategy = GameModeFactory.getStrategy('triads');
    const bossStrategy = GameModeFactory.getStrategy('boss');

    console.log(`    ✓ Estrategia registrada: ${pairsStrategy.name}`);
    console.log(`    ✓ Estrategia registrada: ${triadsStrategy.name}`);
    console.log(`    ✓ Estrategia registrada: ${bossStrategy.name}`);
  }

  /**
   * Obtener instancia única (Singleton)
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * Inicializar servicios asíncronos
   */
  async initialize(): Promise<void> {
    console.log('🚀 Inicializando servicios asíncronos...');
    await this.authService.initialize();
    await this.userService.initialize();
    console.log('✅ Todos los servicios inicializados\n');
  }

  /**
   * Cerrar conexiones (para shutdown graceful)
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Cerrando conexiones...');
    await this.prisma.$disconnect();
    console.log('✅ Conexiones cerradas');
  }
}
