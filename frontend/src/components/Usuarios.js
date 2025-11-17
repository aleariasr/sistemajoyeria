import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Usuarios.css';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth');
      setUsuarios(response.data);
      setError('');
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      await api.delete(`/auth/${id}`);
      setError('');
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Error al eliminar usuario');
      }
    }
  };

  const getRoleLabel = (role) => {
    return role === 'administrador' ? '👨‍💼 Administrador' : '👤 Dependiente';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="usuarios-container">
      <div className="page-header">
        <h1>👥 Gestión de Usuarios</h1>
        <button onClick={() => navigate('/nuevo-usuario')} className="btn-primary">
          ➕ Nuevo Usuario
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="usuarios-list">
        {usuarios.length === 0 ? (
          <p className="no-data">No hay usuarios registrados.</p>
        ) : (
          <table className="usuarios-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre Completo</th>
                <th>Rol</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td><strong>{usuario.username}</strong></td>
                  <td>{usuario.full_name}</td>
                  <td>
                    <span className={`role-badge ${usuario.role}`}>
                      {getRoleLabel(usuario.role)}
                    </span>
                  </td>
                  <td>{formatDate(usuario.fecha_creacion)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => navigate(`/editar-usuario/${usuario.id}`)}
                        className="btn-edit"
                        title="Editar usuario"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(usuario.id, usuario.username)}
                        className="btn-delete"
                        title="Eliminar usuario"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Usuarios;
