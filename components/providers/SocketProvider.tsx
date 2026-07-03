'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';

interface SocketContextValue {
  socket: Socket | null;
  onlineFriends: Set<string>;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, onlineFriends: new Set() });

export function SocketProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const socketRef = useRef<Socket | null>(null);
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const socket = io({
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      auth: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('friends_online', (ids: string[]) => {
      setOnlineFriends(new Set(ids));
    });

    socket.on('friend_status', ({ userId: uid, isOnline }: { userId: string; isOnline: boolean }) => {
      setOnlineFriends((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(uid);
        else next.delete(uid);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineFriends }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return useContext(SocketContext);
}
