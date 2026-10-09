/**
 * TurnTimer - Gestor de temporizador de turnos
 * 
 * EXPLICACIÓN POO:
 * - ENCAPSULACIÓN: Encapsula la lógica del temporizador
 * - SRP: Solo maneja el reloj de turno, no las reglas del juego
 * - EVENTOS: Usa callbacks para notificar cuando el tiempo se agota
 * 
 * SERVIDOR AUTORITATIVO:
 * - El timer corre en el servidor, no en el cliente
 * - Previene trampas (cliente no puede pausar el tiempo)
 * - Garantiza tiempos consistentes para todos los jugadores
 */
export class TurnTimer {
  /**
   * Duración del turno en milisegundos
   */
  private duration: number;

  /**
   * ID del timeout de Node.js
   */
  private timeoutId: NodeJS.Timeout | null = null;

  /**
   * Timestamp de cuando inició el turno
   */
  private startTime: number | null = null;

  /**
   * Indica si el timer está activo
   */
  private isActive: boolean = false;

  /**
   * Callback a ejecutar cuando el tiempo se agota
   */
  private onTimeoutCallback: (() => void) | null = null;

  /**
   * Callback opcional para actualizar el tiempo restante
   */
  private onTickCallback: ((remaining: number) => void) | null = null;

  /**
   * Intervalo para el tick (por defecto cada segundo)
   */
  private tickInterval: number = 1000;

  /**
   * ID del intervalo de tick
   */
  private tickIntervalId: NodeJS.Timeout | null = null;

  /**
   * Constructor
   * @param duration Duración del turno en milisegundos (default: 30 segundos)
   */
  constructor(duration: number = 30000) {
    this.duration = duration;
  }

  /**
   * Inicia el temporizador
   * @param onTimeout Callback cuando el tiempo se agote
   * @param onTick Callback opcional para cada tick del reloj
   */
  start(
    onTimeout: () => void,
    onTick?: (remaining: number) => void
  ): void {
    // Si ya está activo, detenerlo primero
    if (this.isActive) {
      this.stop();
    }

    this.onTimeoutCallback = onTimeout;
    this.onTickCallback = onTick || null;
    this.startTime = Date.now();
    this.isActive = true;

    // Configurar el timeout principal
    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.duration);

    // Configurar el intervalo de tick si hay callback
    if (this.onTickCallback) {
      this.tickIntervalId = setInterval(() => {
        if (this.isActive) {
          const remaining = this.getRemaining();
          if (this.onTickCallback) {
            this.onTickCallback(remaining);
          }
        }
      }, this.tickInterval);
    }
  }

  /**
   * Detiene el temporizador
   */
  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }

    this.isActive = false;
    this.startTime = null;
  }

  /**
   * Pausa el temporizador (útil para pausas de juego)
   * Nota: Implementación simplificada, en producción requiere más lógica
   */
  pause(): void {
    if (!this.isActive) return;

    this.stop();
    // Aquí deberías guardar el tiempo restante para poder resumir
  }

  /**
   * Reinicia el temporizador con la misma duración
   */
  reset(): void {
    this.stop();
    if (this.onTimeoutCallback) {
      this.start(this.onTimeoutCallback, this.onTickCallback || undefined);
    }
  }

  /**
   * Extiende el tiempo del turno actual
   * @param additionalTime Tiempo adicional en milisegundos
   */
  extend(additionalTime: number): void {
    if (!this.isActive) return;

    // Detener el timer actual
    this.stop();

    // Calcular el tiempo restante más la extensión
    const elapsed = Date.now() - (this.startTime || Date.now());
    const remaining = Math.max(0, this.duration - elapsed);
    const newDuration = remaining + additionalTime;

    // Reiniciar con el nuevo tiempo
    this.duration = newDuration;
    if (this.onTimeoutCallback) {
      this.start(this.onTimeoutCallback, this.onTickCallback || undefined);
    }
  }

  /**
   * Obtiene el tiempo restante en milisegundos
   * @returns Milisegundos restantes
   */
  getRemaining(): number {
    if (!this.isActive || !this.startTime) return 0;

    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.duration - elapsed);

    return remaining;
  }

  /**
   * Obtiene el tiempo restante en segundos
   * @returns Segundos restantes (redondeado)
   */
  getRemainingSeconds(): number {
    return Math.ceil(this.getRemaining() / 1000);
  }

  /**
   * Obtiene el progreso del turno (0 a 1)
   * @returns Fracción del tiempo transcurrido (0 = inicio, 1 = fin)
   */
  getProgress(): number {
    if (!this.isActive || !this.startTime) return 0;

    const elapsed = Date.now() - this.startTime;
    return Math.min(1, elapsed / this.duration);
  }

  /**
   * Verifica si el timer está activo
   * @returns true si está corriendo
   */
  isRunning(): boolean {
    return this.isActive;
  }

  /**
   * Cambia la duración del turno (solo afecta próximos turnos)
   * @param newDuration Nueva duración en milisegundos
   */
  setDuration(newDuration: number): void {
    if (newDuration <= 0) {
      throw new Error('La duración debe ser mayor a 0');
    }
    this.duration = newDuration;
  }

  /**
   * Obtiene la duración configurada
   * @returns Duración en milisegundos
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Maneja cuando el tiempo se agota
   */
  private handleTimeout(): void {
    this.isActive = false;
    this.startTime = null;

    // Limpiar el intervalo de tick
    if (this.tickIntervalId) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }

    // Ejecutar el callback
    if (this.onTimeoutCallback) {
      this.onTimeoutCallback();
    }
  }

  /**
   * Obtiene información del estado actual del timer
   * Útil para debugging
   */
  getStatus(): {
    isActive: boolean;
    remaining: number;
    progress: number;
    duration: number;
  } {
    return {
      isActive: this.isActive,
      remaining: this.getRemaining(),
      progress: this.getProgress(),
      duration: this.duration,
    };
  }

  /**
   * Destruye el timer y limpia recursos
   */
  destroy(): void {
    this.stop();
    this.onTimeoutCallback = null;
    this.onTickCallback = null;
  }
}
