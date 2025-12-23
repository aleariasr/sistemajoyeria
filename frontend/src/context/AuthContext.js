import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api, { refreshSession as refreshSessionAPI } from '../services/api';
import { toast } from 'react-toastify';

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
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await api.get('/auth/session', {
        withCredentials: true
      });
      if (response.data.loggedIn) {
        setUser(response.data.usuario);
        setSessionExpired(false);
      }
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      setSessionExpired(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await api.post(
      '/auth/login',
      { username, password },
      { withCredentials: true }
    );
    setUser(response.data.usuario);
    setSessionExpired(false);
    return response.data;
  };

  const logout = useCallback(async (isAutomatic = false) => {
    try {
      await api.post(
        '/auth/logout',
        {},
        { withCredentials: true }
      );
    } catch (error) {
      // Ignorar errores en logout (puede ser que ya no haya sesión)
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpieza completa del estado
      setUser(null);
      setSessionExpired(isAutomatic);
      
      // Limpiar cualquier dato en localStorage si existe
      try {
        localStorage.removeItem('lastApiUrl');
      } catch (e) {
        console.warn('No se pudo limpiar localStorage:', e);
      }
      
      // Mostrar notificación si es cierre automático
      if (isAutomatic) {
        toast.warning('⏰ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
  }, []);

  // Método para renovar/extender la sesión
  const refreshSessionHandler = useCallback(async () => {
    try {
      const response = await refreshSessionAPI();
      if (response.data.success) {
        // Sesión renovada exitosamente
        console.log('✅ Sesión renovada exitosamente');
        return true;
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Sesión expirada, forzar logout
        console.warn('⚠️ No se pudo renovar la sesión (expirada)');
        await logout(true);
        return false;
      }
      console.error('Error al renovar sesión:', error);
      return false;
    }
  }, [logout]);

  // Configurar handler global para el interceptor de axios
  useEffect(() => {
    window.onSessionExpired = async () => {
      await logout(true);
    };
    
    return () => {
      window.onSessionExpired = null;
    };
  }, [logout]);

  const isAdmin = () => {
    return user && user.role === 'administrador';
  };

  const isDependiente = () => {
    return user && user.role === 'dependiente';
  };

  const value = {
    user,
    loading,
    sessionExpired,
    login,
    logout,
    refreshSession: refreshSessionHandler,
    isAdmin,
    isDependiente
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
