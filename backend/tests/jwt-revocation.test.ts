import test from 'node:test';
import assert from 'node:assert/strict';
import { JwtUtil } from '../src/core/JwtUtil';

// Configurar JWT_SECRET para el entorno de test si no está definido
process.env.JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-testing-12345';

test('JwtUtil - Generación, verificación y revocación de JWT', async (t) => {
  await t.test('debe firmar y verificar un token válido con payload correcto', () => {
    const payload = {
      userId: 'user-uuid-1234',
      email: 'test@memorize.com',
      role: 'player',
    };

    const token = JwtUtil.sign(payload);
    assert.ok(typeof token === 'string' && token.length > 20);

    const verified = JwtUtil.verify(token);
    assert.equal(verified.userId, payload.userId);
    assert.equal(verified.email, payload.email);
    assert.equal(verified.role, payload.role);
    assert.ok(verified.jti, 'Debe incluir un JTI generado');
  });

  await t.test('debe revocar un token y rechazar verificaciones posteriores', () => {
    const token = JwtUtil.sign({
      userId: 'user-to-logout',
      email: 'logout@memorize.com',
      role: 'player',
    });

    // Antes de revocar es válido
    const before = JwtUtil.verify(token);
    assert.equal(before.userId, 'user-to-logout');

    // Revocar token (simulando logout)
    JwtUtil.revoke(token);

    assert.equal(JwtUtil.isRevoked(token), true);
    assert.throws(
      () => JwtUtil.verify(token),
      /Token revocado/,
      'Un token revocado debe fallar la verificación'
    );
  });

  await t.test('debe rechazar tokens alterados o con firma inválida', () => {
    const valid = JwtUtil.sign({
      userId: 'user-valid',
      email: 'valid@memorize.com',
      role: 'player',
    });

    const tampered = valid.slice(0, -5) + 'abcde';
    assert.throws(() => JwtUtil.verify(tampered));
  });
});

