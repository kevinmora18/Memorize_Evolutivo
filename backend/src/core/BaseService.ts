/**
 * BaseService - Clase abstracta base para todos los servicios
 * 
 * EXPLICACIÓN POO:
 * - ABSTRACCIÓN: Define la estructura común que todos los servicios deben seguir
 * - ENCAPSULACIÓN: Protege el logger y otros métodos comunes
 * - HERENCIA: Otros servicios heredarán de esta clase
 */
export abstract class BaseService {
  protected serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Método protegido para logging
   * Solo accesible por clases hijas
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.serviceName}]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ℹ️  ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️  ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
    }
  }

  /**
   * Método protegido para manejar errores consistentemente
   */
  protected handleError(error: any, context: string): never {
    this.log(`Error en ${context}: ${error.message}`, 'error');
    throw error;
  }

  /**
   * Método abstracto que cada servicio debe implementar
   * Define qué hacer al inicializar el servicio
   */
  abstract initialize(): Promise<void>;
}
