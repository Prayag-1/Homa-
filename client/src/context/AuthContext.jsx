import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const sanitizeUser = (value) => {
  if (!value || typeof value !== 'object') return null;
  const {
    id,
    _id,
    name,
    email,
    phone,
    phoneNumber,
    birthday,
    address,
    role,
    loyaltyPoints,
    membershipTier,
    verificationMethod,
    isVerified,
    isActive,
    skinType,
    createdAt,
    updatedAt,
  } = value;

  return {
    id: id || _id,
    name,
    email,
    phone,
    phoneNumber,
    birthday,
    address,
    role: role === 'admin' ? 'admin' : 'user',
    loyaltyPoints,
    membershipTier,
    verificationMethod,
    isVerified,
    isActive,
    skinType,
    createdAt,
    updatedAt,
  };
};

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
          const me = await api.get('/auth/me');
          setUser(sanitizeUser(me.data.data.user));
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
    setUser(sanitizeUser(data.data.user));
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
    setUser(sanitizeUser(data.data.user));
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
    const user = sanitizeUser(data.data.user);
    setUser(user);
    return user;
  };

  const updateProfile = async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
    const user = sanitizeUser(data.data.user);
    setUser(user);
    return user;
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
        updateProfile,
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
