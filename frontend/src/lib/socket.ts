import { io } from 'socket.io-client';
import { getToken, API_BASE } from './api';

/**
 * Socket singleton.
 * - No se conecta solo: requiere autenticación previa (JWT en el handshake).
 * - `connectSocket()` se llama después del login con el token de la sesión.
 */
const socket = io(API_BASE, {
  autoConnect: false,
  auth: { token: null },
});

export function connectSocket(): void {
  socket.auth = { token: getToken() };
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  socket.auth = { token: null };
  if (socket.connected) {
    socket.disconnect();
  }
}

export default socket;
