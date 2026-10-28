import bcrypt from 'bcryptjs';
import { BaseService } from '../core/BaseService';
import { IAuthService } from '../core/interfaces/IServices';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/domain/User.model';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../core/errors/AppError';
import { JwtUtil } from '../core/JwtUtil';

/**
 * Resultado de autenticación: usuario + token firmado.
 */
export interface AuthResult {
  user: User;
  token: string;
}

/**
 * AuthService - Servicio de autenticación
 *
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseService
 * - SRP: Solo maneja lógica de autenticación
 * - DEPENDENCY INJECTION: Recibe el repositorio como dependencia
 * - ENCAPSULACIÓN: Oculta la lógica de negocio de autenticación
 * - ISP: Implementa únicamente IAuthService
 *
 * SEGURIDAD:
 * - Contraseñas hasheadas con bcrypt (nunca en texto plano)
 * - Tokens JWT firmados con JWT_SECRET (nunca se confía en IDs del cliente)
 * - Mensajes de error genéricos en credenciales (evita enumeración de usuarios)
 */
export class AuthService extends BaseService implements IAuthService {
  private userRepository: UserRepository;

  /**
   * Rondas de bcrypt. 12 es el estándar recomendado actual.
   */
  private static readonly BCRYPT_ROUNDS = 12;

  constructor(userRepository: UserRepository) {
    super('AuthService');
    this.userRepository = userRepository;
  }

  /**
   * Implementación del método abstracto
   */
  async initialize(): Promise<void> {
    this.log('Servicio de autenticación inicializado');
  }

  /**
   * Registro de nuevo usuario con contraseña hasheada.
   */
  async register(email: string, password: string, username?: string): Promise<AuthResult> {
    try {
      const existing = await this.userRepository.findByEmail(email);
      if (existing) {
        throw new ConflictError('Ya existe una cuenta con ese email');
      }

      const passwordHash = await bcrypt.hash(password, AuthService.BCRYPT_ROUNDS);

      const user = await this.userRepository.create({
        email,
        username: username ?? null,
        passwordHash,
      });

      this.log(`Usuario registrado: ${user.id}`);

      return { user, token: this.issueToken(user) };
    } catch (error: any) {
      this.handleError(error, 'register');
    }
  }

  /**
   * Login con email + contraseña.
   */
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const user = await this.userRepository.findByEmail(email);

      // Respuesta genérica: no revelar si el email existe o no.
      if (!user || !user.hasPassword()) {
        throw new UnauthorizedError('Credenciales inválidas');
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash!);
      if (!passwordMatches) {
        throw new UnauthorizedError('Credenciales inválidas');
      }

      if (user.isCurrentlyBanned()) {
        const message = user.bannedUntil
          ? `Usuario baneado hasta ${user.bannedUntil.toISOString()}`
          : 'Usuario baneado permanentemente';
        throw new ForbiddenError(message);
      }

      await this.userRepository.updateLastLogin(user.id);

      this.log(`Login exitoso: ${user.id}`);

      return { user, token: this.issueToken(user) };
    } catch (error: any) {
      this.handleError(error, 'login');
    }
  }

  /**
   * Validar si un usuario puede acceder
   */
  async validateAccess(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);

      if (!user) {
        return false;
      }

      return !user.isCurrentlyBanned();
    } catch (error: any) {
      this.log(`Error validando acceso: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Verificar si un usuario es admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.userRepository.findById(userId);
      return user ? user.isAdmin() : false;
    } catch (error: any) {
      this.log(`Error verificando admin: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Firma un token JWT para el usuario.
   */
  private issueToken(user: User): string {
    return JwtUtil.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
