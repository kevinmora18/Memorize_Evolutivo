import test from 'node:test';
import assert from 'node:assert/strict';
import { User, UserRole } from '../src/models/domain/User.model';

test('Sistema de Progresión - Unificación de fórmula XP/Nivel', async (t) => {
  await t.test('la fórmula estándar level = floor(xp / 1000) + 1 se cumple en límites', () => {
    const calc = (xp: number) => Math.floor(Math.max(0, xp) / 1000) + 1;

    assert.equal(calc(0), 1, '0 XP -> Nivel 1');
    assert.equal(calc(500), 1, '500 XP -> Nivel 1');
    assert.equal(calc(999), 1, '999 XP -> Nivel 1');
    assert.equal(calc(1000), 2, '1000 XP -> Nivel 2');
    assert.equal(calc(1999), 2, '1999 XP -> Nivel 2');
    assert.equal(calc(2000), 3, '2000 XP -> Nivel 3');
    assert.equal(calc(5555), 6, '5555 XP -> Nivel 6');
    assert.equal(calc(10000), 11, '10000 XP -> Nivel 11');
  });

  await t.test('el modelo de dominio User incrementa niveles exactamente según la fórmula', () => {
    const user = new User({
      id: 'test-user-id',
      email: 'gamer@memorize.com',
      username: 'gamer',
      level: 1,
      xp: 0,
      coins: 0,
      gems: 0,
      role: UserRole.PLAYER,
      isBanned: false,
      bannedUntil: null,
      banReason: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    assert.equal(user.level, 1);
    assert.equal(user.getXpForNextLevel(), 1000);
    assert.equal(user.getXpIntoCurrentLevel(), 0);

    // Sumar 500 XP (permanece en nivel 1)
    const gained1 = user.addXp(500);
    assert.equal(gained1, 0);
    assert.equal(user.level, 1);
    assert.equal(user.xp, 500);
    assert.equal(user.getXpIntoCurrentLevel(), 500);

    // Sumar 700 XP (total 1200 XP -> Nivel 2)
    const gained2 = user.addXp(700);
    assert.equal(gained2, 1);
    assert.equal(user.level, 2);
    assert.equal(user.xp, 1200);
    assert.equal(user.getXpIntoCurrentLevel(), 200);

    // Sumar 2000 XP en un solo salto (total 3200 XP -> sube 2 niveles a Nivel 4)
    const gained3 = user.addXp(2000);
    assert.equal(gained3, 2);
    assert.equal(user.level, 4);
    assert.equal(user.xp, 3200);
    assert.equal(user.getXpIntoCurrentLevel(), 200);
  });
});
