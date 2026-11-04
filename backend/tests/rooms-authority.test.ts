import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../src/managers/RoomManager';

test('RoomManager - Autoridad de salas y validaciones', async (t) => {
  const roomManager = RoomManager.getInstance();

  await t.test('debe crear una sala con datos válidos y host asignado', () => {
    const room = roomManager.createRoom({
      name: 'Sala Alpha',
      hostId: 'host-123',
      hostName: 'HostUser',
      hostLevel: 5,
      maxPlayers: 4,
      mode: 'classic',
      difficulty: 'normal',
      isPrivate: false,
    });

    assert.ok(room.id);
    assert.equal(room.hostId, 'host-123');
    assert.equal(room.name, 'Sala Alpha');
    assert.equal(room.maxPlayers, 4);
    assert.equal(room.getPlayers().length, 1);
    assert.equal(room.getPlayers()[0].id, 'host-123');
  });

  await t.test('debe permitir unirse a una sala y validar capacidad máxima', () => {
    const room = roomManager.createRoom({
      name: 'Sala Dúo',
      hostId: 'host-duo',
      hostName: 'HostDuo',
      hostLevel: 2,
      maxPlayers: 2,
      mode: 'classic',
      difficulty: 'normal',
      isPrivate: false,
    });

    // Jugador 2 se une
    const joined = roomManager.joinRoom(room.id, {
      id: 'player-2',
      socketId: 'sock-2',
      name: 'Player 2',
      level: 1,
      isReady: false,
      score: 0,
      matches: 0,
      isConnected: true,
    });
    assert.equal(joined.getPlayers().length, 2);

    // Intentar meter un tercer jugador en sala de 2 debe fallar
    assert.throws(
      () =>
        roomManager.joinRoom(room.id, {
          id: 'player-3',
          socketId: 'sock-3',
          name: 'Player 3',
          level: 1,
          isReady: false,
          score: 0,
          matches: 0,
          isConnected: true,
        }),
      /llena/
    );
  });

  await t.test('debe validar contraseñas en salas privadas', () => {
    const privateRoom = roomManager.createRoom({
      name: 'Sala Secreta',
      hostId: 'host-priv',
      hostName: 'HostPriv',
      hostLevel: 3,
      maxPlayers: 4,
      mode: 'classic',
      difficulty: 'normal',
      isPrivate: true,
      password: 'clave-secreta',
    });

    // Unirse con clave incorrecta falla
    assert.throws(
      () =>
        roomManager.joinRoom(
          privateRoom.id,
          {
            id: 'intruder',
            socketId: 'sock-bad',
            name: 'Intruder',
            level: 1,
            isReady: false,
            score: 0,
            matches: 0,
            isConnected: true,
          },
          'clave-erronea'
        ),
      /Contraseña/
    );

    // Unirse con clave correcta tiene éxito
    const successJoin = roomManager.joinRoom(
      privateRoom.id,
      {
        id: 'friend',
        socketId: 'sock-ok',
        name: 'Friend',
        level: 1,
        isReady: false,
        score: 0,
        matches: 0,
        isConnected: true,
      },
      'clave-secreta'
    );
    assert.equal(successJoin.hasPlayer('friend'), true);
  });
});
