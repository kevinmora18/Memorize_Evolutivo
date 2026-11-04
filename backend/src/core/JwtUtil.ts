import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Payload firmado en el token JWT.
 * NOTA: solo incluir datos no sensibles; el token es legible por el cliente.
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  jti?: string;
}

const DEFAULT_EXPIRES_IN = '7d';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET no configurado o demasiado corto (mínimo 16 caracteres). Configúralo en backend/.env'
    );
  }
  return secret;
}

export class JwtUtil {
  /**
   * Registro en memoria de tokens / JTIs revocados (blacklist).
   */
  private static revokedTokens: Set<string> = new Set();

  static sign(payload: TokenPayload): string {
    const jti = payload.jti || crypto.randomUUID();
    return jwt.sign({ ...payload, jti }, getSecret(), {
      expiresIn: (process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN) as jwt.SignOptions['expiresIn'],
    });
  }

  static verify(token: string): TokenPayload {
    if (this.isRevoked(token)) {
      throw new Error('Token revocado');
    }

    const decoded = jwt.verify(token, getSecret()) as any;
    if (!decoded || typeof decoded === 'string' || !decoded.userId || !decoded.role) {
      throw new Error('Token con formato inválido');
    }

    if (decoded.jti && this.isRevoked(decoded.jti)) {
      throw new Error('Token revocado');
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      jti: decoded.jti,
    };
  }

  /**
   * Revoca un token (o su JTI) para invalidar sesiones futuras.
   */
  static revoke(tokenOrJti: string): void {
    if (!tokenOrJti) return;
    this.revokedTokens.add(tokenOrJti);
    try {
      const decoded = jwt.decode(tokenOrJti) as any;
      if (decoded?.jti) {
        this.revokedTokens.add(decoded.jti);
      }
    } catch {
      // Ignorar si no es decodificable
    }
  }

  /**
   * Verifica si un token o JTI ha sido revocado.
   */
  static isRevoked(tokenOrJti: string): boolean {
    return this.revokedTokens.has(tokenOrJti);
  }
}
