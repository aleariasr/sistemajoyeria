import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      // Mensajes de error más descriptivos
      if (error.code === 'ERR_NETWORK' || !error.response) {
        // Error de red - no se puede conectar al servidor
        const apiUrl = localStorage.getItem('lastApiUrl') || window.location.hostname;
        setError(
          `No se puede conectar al servidor backend.\n\n` +
          `Verifique:\n` +
          `1. Que el backend esté ejecutándose en el servidor\n` +
          `2. Que esté en la misma red WiFi (si usa iPad/móvil)\n` +
          `3. URL detectada: ${apiUrl}:3001\n\n` +
          `Consulte la documentación para configurar el acceso desde red local.`
        );
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Error al iniciar sesión. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Cuero & Perla</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
