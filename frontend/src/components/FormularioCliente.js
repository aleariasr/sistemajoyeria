import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { crearCliente, actualizarCliente, obtenerCliente } from '../services/api';
import '../styles/FormularioCliente.css';

function FormularioCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    telefono: '',
    direccion: '',
    email: '',
    notas: ''
  });

  const esEdicion = !!id;

  useEffect(() => {
    if (esEdicion) {
      cargarCliente();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cargarCliente = async () => {
    try {
      setLoading(true);
      const response = await obtenerCliente(id);
      setFormData(response.data);
    } catch (error) {
      console.error('Error al cargar cliente:', error);
      setError('Error al cargar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.cedula || !formData.telefono) {
      setError('Nombre, cédula y teléfono son campos obligatorios');
      return;
    }

    // Validar email si se proporciona (same regex as backend)
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('El email no tiene un formato válido');
        return;
      }
    }

    // Validar teléfono (consistent with backend: only digits, plus, and parentheses after normalization)
    const normalizedPhone = formData.telefono.replace(/[\s-]/g, '');
    const phoneRegex = /^[0-9+()]{6,20}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      setError('El teléfono debe tener entre 6 y 20 caracteres (solo números, +, y paréntesis)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (esEdicion) {
        await actualizarCliente(id, formData);
      } else {
        await crearCliente(formData);
      }

      navigate('/clientes');
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      setError(error.response?.data?.error || 'Error al guardar el cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/clientes');
  };

  if (loading && esEdicion) {
    return (
      <div className="formulario-cliente-container">
        <div className="loading">Cargando cliente...</div>
      </div>
    );
  }

  return (
    <div className="formulario-cliente-container">
      <div className="formulario-header">
        <h2>{esEdicion ? '✏️ Editar Cliente' : '➕ Nuevo Cliente'}</h2>
        <p>Complete los datos del cliente</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="formulario-cliente">
        <div className="form-section">
          <h3>Información Personal</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Nombre del cliente"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cedula">Cédula *</label>
              <input
                type="text"
                id="cedula"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                required
                placeholder="Número de cédula"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="telefono">Teléfono *</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
                placeholder="Número de teléfono"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <textarea
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              rows="2"
              placeholder="Dirección física del cliente"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notas">Notas</label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows="3"
              placeholder="Notas adicionales sobre el cliente"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : esEdicion ? 'Actualizar' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default FormularioCliente;
