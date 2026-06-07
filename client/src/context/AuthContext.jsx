import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          setAccessToken(token);
          const { data } = await api.post('/auth/refresh');
          localStorage.setItem('accessToken', data.data.accessToken);
          setAccessToken(data.data.accessToken);
          const me = await api.get('/auth/me');
          setUser(me.data.data.user);
        }
      } catch {
        localStorage.removeItem('accessToken');
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const verifyAccount = async (verificationMethod, target, code) => {
    const { data } = await api.post('/auth/verify', { verificationMethod, target, code });
    localStorage.setItem('accessToken', data.data.accessToken);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data;
  };

  const resendVerification = async (verificationMethod, target) => {
    const { data } = await api.post('/auth/resend-verification', { verificationMethod, target });
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data.data.user);
    return data.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        verifyAccount,
        resendVerification,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
