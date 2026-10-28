import jwt from 'jsonwebtoken';

/**
 * Payload firmado en el token JWT.
 * NOTA: solo incluir datos no sensibles; el token es legible por el cliente.
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
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
  static sign(payload: TokenPayload): string {
    return jwt.sign(payload, getSecret(), {
      expiresIn: (process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN) as jwt.SignOptions['expiresIn'],
    });
  }

  static verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === 'string' || !decoded.userId || !decoded.role) {
      throw new Error('Token con formato inválido');
    }
    return {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };
  }
}
