import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('msr_token')) {
      setUser(null); setProfile(null); setLoading(false);
      return null;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.user);
      setProfile(res.profile);
      return res;
    } catch {
      setUser(null); setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const onLogout = () => { setUser(null); setProfile(null); };
    window.addEventListener('msr:logout', onLogout);
    return () => window.removeEventListener('msr:logout', onLogout);
  }, [refresh]);

  const loginWithToken = async (token) => {
    localStorage.setItem('msr_token', token);
    return refresh();
  };

  const logout = () => {
    localStorage.removeItem('msr_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refresh, loginWithToken, logout, setProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
