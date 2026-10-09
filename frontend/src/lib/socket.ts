import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5175';
const socket = io(API_BASE, { autoConnect: true });

export default socket;
