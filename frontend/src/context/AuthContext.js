import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await api.get('/auth/session');
      if (response.data.loggedIn) {
        setUser(response.data.usuario);
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    setUser(response.data.usuario);
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  const isAdmin = () => {
    return user && user.role === 'administrador';
  };

  const isDependiente = () => {
    return user && user.role === 'dependiente';
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isDependiente
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
