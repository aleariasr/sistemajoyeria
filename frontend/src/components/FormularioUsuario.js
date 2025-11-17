import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/FormularioUsuario.css';

function FormularioUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esEdicion = !!id;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'dependiente',
    full_name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingUsuario, setLoadingUsuario] = useState(esEdicion);

  useEffect(() => {
    if (esEdicion) {
      cargarUsuario();
    }
  }, [id]);

  const cargarUsuario = async () => {
    try {
      setLoadingUsuario(true);
      const response = await api.get('/auth');
      const usuario = response.data.find(u => u.id === parseInt(id));
      
      if (usuario) {
        setFormData({
          username: usuario.username,
          password: '',
          confirmPassword: '',
          role: usuario.role,
          full_name: usuario.full_name
        });
      } else {
        setError('Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setError('Error al cargar usuario');
    } finally {
      setLoadingUsuario(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.username || !formData.full_name || !formData.role) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (!esEdicion && !formData.password) {
      setError('La contraseña es requerida');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      
      const userData = {
        username: formData.username,
        role: formData.role,
        full_name: formData.full_name
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.password) {
        userData.password = formData.password;
      }

      if (esEdicion) {
        await api.put(`/auth/${id}`, userData);
      } else {
        await api.post('/auth', userData);
      }

      navigate('/usuarios');
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Error al guardar usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingUsuario) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="formulario-usuario-container">
      <div className="page-header">
        <h1>{esEdicion ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="formulario-usuario">
        <div className="form-section">
          <h2>Información del Usuario</h2>
          
          <div className="form-group">
            <label htmlFor="username">Usuario *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Nombre de usuario para acceder al sistema"
            />
          </div>

          <div className="form-group">
            <label htmlFor="full_name">Nombre Completo *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Nombre completo del usuario"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Rol *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="dependiente">👤 Dependiente</option>
              <option value="administrador">👨‍💼 Administrador</option>
            </select>
            <small className="help-text">
              Los administradores tienen acceso completo al sistema. Los dependientes solo pueden realizar ventas.
            </small>
          </div>
        </div>

        <div className="form-section">
          <h2>Contraseña</h2>
          {esEdicion && (
            <p className="info-text">
              ℹ️ Deja los campos de contraseña en blanco si no deseas cambiarla
            </p>
          )}

          <div className="form-group">
            <label htmlFor="password">
              {esEdicion ? 'Nueva Contraseña' : 'Contraseña *'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!esEdicion}
              disabled={loading}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              {esEdicion ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required={!esEdicion || formData.password !== ''}
              disabled={loading}
              placeholder="Repite la contraseña"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar Usuario' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioUsuario;
