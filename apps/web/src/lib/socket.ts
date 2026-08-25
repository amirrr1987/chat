import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const auth = useAuthStore();
    socket = io('/', {
      auth: { token: auth.token },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
