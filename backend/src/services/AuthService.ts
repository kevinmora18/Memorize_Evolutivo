import { BaseService } from '../core/BaseService';
import { IAuthService } from '../core/interfaces/IServices';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/domain/User.model';

/**
 * AuthService - Servicio de autenticación
 * 
 * EXPLICACIÓN POO:
 * - HERENCIA: Extiende BaseService
 * - SRP: Solo maneja lógica de autenticación
 * - DEPENDENCY INJECTION: Recibe el repositorio como dependencia
 * - ENCAPSULACIÓN: Oculta la lógica de negocio de autenticación
 * - ISP: Implementa únicamente IAuthService
 */
export class AuthService extends BaseService implements IAuthService {
  private userRepository: UserRepository;

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
   * Login o registro automático
   */
  async loginOrRegister(email: string): Promise<User> {
    try {
      this.log(`Intentando login/registro para: ${email}`);

      // Validar email
      if (!email || !email.includes('@')) {
        throw new Error('Email inválido');
      }

      // Buscar usuario existente
      let user = await this.userRepository.findByEmail(email);

      if (!user) {
        // Crear nuevo usuario
        this.log(`Usuario no existe, creando: ${email}`);
        user = await this.userRepository.create({ email });

        // Aquí podríamos crear stats e inventory por defecto
        this.log(`Usuario creado exitosamente: ${user.id}`);
      } else {
        this.log(`Usuario encontrado: ${user.id}`);
      }

      // Verificar si está baneado
      if (user.isCurrentlyBanned()) {
        const message = user.bannedUntil
          ? `Usuario baneado hasta ${user.bannedUntil}`
          : 'Usuario baneado permanentemente';
        throw new Error(message);
      }

      // Actualizar última conexión
      await this.userRepository.updateLastLogin(user.id);

      return user;
    } catch (error: any) {
      this.handleError(error, 'loginOrRegister');
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
}
