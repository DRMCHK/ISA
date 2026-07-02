import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineFriends, setOnlineFriends] = useState(new Set());

  const isFriendOnline = useCallback(
    (friendId) => onlineFriends.has(friendId),
    [onlineFriends]
  );

  useEffect(() => {
    if (!user) {
      setOnlineFriends(new Set());
      return;
    }

    const token = localStorage.getItem('isa_token');
    const s = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('friends_online', (friendIds) => {
      setOnlineFriends(new Set(friendIds));
    });

    s.on('friend_presence', ({ userId, online }) => {
      setOnlineFriends((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, onlineFriends, isFriendOnline }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
