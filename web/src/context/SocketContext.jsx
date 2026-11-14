import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE } from '../lib/api';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refreshCounts = useCallback(async () => {
    if (!localStorage.getItem('msr_token')) return;
    try {
      const [n, c] = await Promise.all([api.get('/notifications?limit=1'), api.get('/chat/conversations')]);
      setUnreadNotifications(n.unread || 0);
      setUnreadMessages(c.totalUnread || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'user') return undefined;
    const s = io(API_BASE || window.location.origin, {
      auth: { token: localStorage.getItem('msr_token') },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 2000,
    });
    socketRef.current = s;
    setSocket(s);
    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('notification', (n) => {
      setUnreadNotifications((x) => x + 1);
      toast(n.title, { icon: '🔔' });
    });
    s.on('message:new', (m) => {
      if (String(m.sender) !== String(user.id) && !window.location.pathname.startsWith(`/chat/${m.sender}`)) {
        setUnreadMessages((x) => x + 1);
      }
    });
    refreshCounts();
    return () => { s.disconnect(); socketRef.current = null; setSocket(null); };
  }, [user, refreshCounts]);

  return (
    <SocketContext.Provider value={{ socket, connected, unreadNotifications, setUnreadNotifications, unreadMessages, setUnreadMessages, refreshCounts }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
