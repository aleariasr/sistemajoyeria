import React, { useState, useEffect } from 'react';
import { 
  activarNotificaciones, 
  areSoportadasNotificaciones,
  obtenerEstadoPermiso,
  estaSuscrito
} from '../utils/notifications';
import { enviarNotificacionPrueba } from '../services/api';
import './NotificacionesPush.css';

function NotificacionesPush() {
  const [estadoPermiso, setEstadoPermiso] = useState('default');
  const [suscrito, setSuscrito] = useState(false);
  const [activando, setActivando] = useState(false);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    verificarEstado();
  }, []);

  const verificarEstado = async () => {
    const permiso = obtenerEstadoPermiso();
    setEstadoPermiso(permiso);

    if (permiso === 'granted') {
      const subscrito = await estaSuscrito();
      setSuscrito(subscrito);
    }
  };

  const handleActivar = async () => {
    setActivando(true);
    setError(null);

    try {
      if (!areSoportadasNotificaciones()) {
        throw new Error('Las notificaciones no son soportadas en este navegador');
      }

      await activarNotificaciones();
      await verificarEstado();
      alert('✅ Notificaciones activadas correctamente');
    } catch (error) {
      console.error('Error activando notificaciones:', error);
      setError(error.message);
      alert('❌ Error: ' + error.message);
    } finally {
      setActivando(false);
    }
  };

  const handleEnviarPrueba = async () => {
    setEnviandoPrueba(true);
    setError(null);

    try {
      await enviarNotificacionPrueba({
        title: '🧪 Notificación de Prueba',
        body: 'Esta es una notificación de prueba del sistema POS'
      });
      alert('✅ Notificación de prueba enviada');
    } catch (error) {
      console.error('Error enviando notificación de prueba:', error);
      setError('Error enviando notificación de prueba');
      alert('❌ Error enviando notificación');
    } finally {
      setEnviandoPrueba(false);
    }
  };

  // Si no están soportadas, mostrar mensaje
  if (!areSoportadasNotificaciones()) {
    return (
      <div className="notificaciones-push">
        <div className="notificaciones-alert notificaciones-warning">
          <strong>⚠️ Notificaciones no soportadas</strong>
          <p>Tu navegador no soporta notificaciones push. Usa Chrome, Firefox o Edge.</p>
        </div>
      </div>
    );
  }

  // Si están denegadas
  if (estadoPermiso === 'denied') {
    return (
      <div className="notificaciones-push">
        <div className="notificaciones-alert notificaciones-error">
          <strong>🔕 Notificaciones bloqueadas</strong>
          <p>Has bloqueado las notificaciones. Para activarlas:</p>
          <ol style={{ marginLeft: '20px', marginTop: '10px' }}>
            <li>Haz clic en el ícono del candado en la barra de direcciones</li>
            <li>Cambia el permiso de notificaciones a "Permitir"</li>
            <li>Recarga la página</li>
          </ol>
        </div>
      </div>
    );
  }

  // Si ya están activadas
  if (suscrito) {
    return (
      <div className="notificaciones-push">
        <div className="notificaciones-alert notificaciones-success">
          <strong>✅ Notificaciones activadas</strong>
          <p>Recibirás alertas cuando lleguen pedidos online.</p>
        </div>

        <button
          type="button"
          onClick={handleEnviarPrueba}
          disabled={enviandoPrueba}
          className="btn-prueba"
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: enviandoPrueba ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {enviandoPrueba ? '📤 Enviando...' : '🧪 Enviar Notificación de Prueba'}
        </button>
      </div>
    );
  }

  // Banner para activar
  return (
    <div className="notificaciones-push">
      <div className="notificaciones-banner">
        <div className="notificaciones-banner-content">
          <div className="notificaciones-banner-icon">🔔</div>
          <div className="notificaciones-banner-text">
            <strong>Activa las notificaciones</strong>
            <p>Recibe alertas en tiempo real cuando lleguen pedidos online</p>
          </div>
          <button
            type="button"
            onClick={handleActivar}
            disabled={activando}
            className="notificaciones-banner-btn"
          >
            {activando ? '⏳ Activando...' : 'Activar Notificaciones'}
          </button>
        </div>
      </div>

      {error && (
        <div className="notificaciones-alert notificaciones-error" style={{ marginTop: '15px' }}>
          <strong>❌ Error</strong>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

export default NotificacionesPush;
