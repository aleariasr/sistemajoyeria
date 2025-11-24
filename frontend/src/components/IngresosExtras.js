import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/IngresosExtras.css';

function IngresosExtras() {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [resumen, setResumen] = useState(null);

  const [formData, setFormData] = useState({
    tipo: 'Fondo de Caja',
    monto: '',
    metodo_pago: 'Efectivo',
    descripcion: '',
    notas: ''
  });

  useEffect(() => {
    cargarIngresos();
  }, []);

  const cargarIngresos = async () => {
    try {
      setLoading(true);
      
      // Obtener ingresos del día (no cerrados)
      const responseIngresos = await api.get('/ingresos-extras', {
        params: { cerrado: false }
      });
      
      setIngresos(responseIngresos.data.ingresos || []);

      // Obtener resumen
      const responseResumen = await api.get('/ingresos-extras/resumen', {
        params: { cerrado: false }
      });
      
      setResumen(responseResumen.data);
      setError('');
    } catch (err) {
      console.error('Error al cargar ingresos extras:', err);
      setError('Error al cargar ingresos extras');
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
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      setMensaje({ tipo: 'error', texto: 'El monto debe ser mayor a 0' });
      return;
    }

    if (!formData.descripcion.trim()) {
      setMensaje({ tipo: 'error', texto: 'La descripción es requerida' });
      return;
    }

    try {
      setLoading(true);
      await api.post('/ingresos-extras', {
        tipo: formData.tipo,
        monto: parseFloat(formData.monto),
        metodo_pago: formData.metodo_pago,
        descripcion: formData.descripcion,
        notas: formData.notas
      });

      setMensaje({ tipo: 'success', texto: 'Ingreso extra registrado exitosamente' });
      
      // Limpiar formulario
      setFormData({
        tipo: 'Fondo de Caja',
        monto: '',
        metodo_pago: 'Efectivo',
        descripcion: '',
        notas: ''
      });
      
      setMostrarFormulario(false);
      
      // Recargar datos
      await cargarIngresos();
      
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      console.error('Error al registrar ingreso extra:', err);
      setMensaje({ 
        tipo: 'error', 
        texto: err.response?.data?.error || 'Error al registrar ingreso extra' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="ingresos-extras-container">
      <div className="page-header">
        <h1>💵 Ingresos Extras</h1>
        <p>Registra ingresos de dinero fuera de ventas (fondo de caja, préstamos, otros)</p>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Botón para mostrar formulario */}
      {!mostrarFormulario && (
        <button 
          onClick={() => setMostrarFormulario(true)} 
          className="btn btn-primary"
          style={{ marginBottom: '20px' }}
        >
          ➕ Nuevo Ingreso Extra
        </button>
      )}

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Registrar Ingreso Extra</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Tipo de Ingreso *</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="Fondo de Caja">Fondo de Caja</option>
                  <option value="Prestamo">Préstamo</option>
                  <option value="Devolucion">Devolución</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Monto *</label>
                <input
                  type="number"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Método de Pago *</label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  required
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Descripción *</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Ej: Fondo inicial del día, Préstamo de Juan..."
                required
              />
            </div>

            <div className="form-group">
              <label>Notas (Opcional)</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Información adicional..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setMostrarFormulario(false);
                  setFormData({
                    tipo: 'Fondo de Caja',
                    monto: '',
                    metodo_pago: 'Efectivo',
                    descripcion: '',
                    notas: ''
                  });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Ingreso'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resumen */}
      {resumen && (
        <div className="stats-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <h4>Total Ingresos</h4>
            <div className="value">{resumen.total_ingresos || 0}</div>
            <small>{formatearMoneda(resumen.monto_total || 0)}</small>
          </div>
          <div className="stat-card success">
            <h4>💵 Efectivo</h4>
            <div className="value">{formatearMoneda(resumen.monto_efectivo || 0)}</div>
            <small>{resumen.efectivo || 0} transacciones</small>
          </div>
          <div className="stat-card info">
            <h4>💳 Tarjeta</h4>
            <div className="value">{formatearMoneda(resumen.monto_tarjeta || 0)}</div>
            <small>{resumen.tarjeta || 0} transacciones</small>
          </div>
          <div className="stat-card warning">
            <h4>🏦 Transferencia</h4>
            <div className="value">{formatearMoneda(resumen.monto_transferencia || 0)}</div>
            <small>{resumen.transferencia || 0} transacciones</small>
          </div>
        </div>
      )}

      {/* Lista de ingresos */}
      <div className="card">
        <div className="card-header">
          <h3>Ingresos Extras del Día ({ingresos.length})</h3>
        </div>

        {loading && ingresos.length === 0 ? (
          <div className="loading">Cargando...</div>
        ) : ingresos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📭</p>
            <p>No hay ingresos extras registrados hoy</p>
            <p style={{ fontSize: '0.9rem', marginTop: '10px' }}>
              Los ingresos extras aparecerán aquí hasta el cierre de caja
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Método</th>
                  <th>Monto</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map((ingreso) => (
                  <tr key={ingreso.id}>
                    <td><strong>{ingreso.id}</strong></td>
                    <td>{formatearFecha(ingreso.fecha_ingreso)}</td>
                    <td>
                      <span className={`badge badge-${
                        ingreso.tipo === 'Fondo de Caja' ? 'success' :
                        ingreso.tipo === 'Prestamo' ? 'warning' :
                        ingreso.tipo === 'Devolucion' ? 'info' : 'default'
                      }`}>
                        {ingreso.tipo}
                      </span>
                    </td>
                    <td>{ingreso.descripcion}</td>
                    <td>{ingreso.metodo_pago}</td>
                    <td><strong>{formatearMoneda(ingreso.monto)}</strong></td>
                    <td>{ingreso.nombre_usuario || ingreso.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="info-box" style={{ marginTop: '20px' }}>
        <p><strong>ℹ️ Nota:</strong> Los ingresos extras registrados aquí se incluirán automáticamente en el cierre de caja del día.</p>
      </div>
    </div>
  );
}

export default IngresosExtras;
