'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socketInstance: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        autoConnect: false,
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });
    }

    socketRef.current = socketInstance;

    return () => {
    };
  }, []);

  const connect = useCallback((token?: string) => {
    if (socketInstance && !socketInstance.connected) {
      if (token) {
        socketInstance.auth = { token };
      }
      socketInstance.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketInstance && socketInstance.connected) {
      socketInstance.disconnect();
      setIsConnected(false);
    }
  }, []);

  const emit = useCallback((event: string, data: any, callback?: (...args: any[]) => void) => {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data, callback);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (socketInstance) {
      socketInstance.on(event, handler);
      return () => {
        socketInstance?.off(event, handler);
      };
    }
    return () => {};
  }, []);

  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (socketInstance) {
      socketInstance.off(event, handler);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}
