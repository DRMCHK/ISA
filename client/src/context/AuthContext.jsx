import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('isa_token');
    if (token) {
      api.auth.me()
        .then(({ user }) => setUser(user))
        .catch(() => localStorage.removeItem('isa_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { user, token } = await api.auth.login(email, password);
    localStorage.setItem('isa_token', token);
    setUser(user);
    return user;
  };

  const register = async (email, password, fullName) => {
    const { user, token } = await api.auth.register(email, password, fullName);
    localStorage.setItem('isa_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('isa_token');
    setUser(null);
  };

  const updateUser = (updated) => setUser(updated);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
