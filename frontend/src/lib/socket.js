import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;

function createNoopSocket() {
  const noop = () => {};
  return {
    on: noop,
    off: noop,
    once: noop,
    emit: noop,
    connect: noop,
    disconnect: noop,
    connected: false,
    active: false,
  };
}

export function createSocket(options = {}) {
  try {
    return io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      timeout: 10000,
      ...options,
    });
  } catch (error) {
    console.warn('Socket initialisation failed:', error?.message || error);
    return createNoopSocket();
  }
}
