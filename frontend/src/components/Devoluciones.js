import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Devoluciones.css';

function Devoluciones() {
  const { isAdmin } = useAuth();
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estado para búsqueda de venta
  const [idVenta, setIdVenta] = useState('');
  const [venta, setVenta] = useState(null);
  const [itemsVenta, setItemsVenta] = useState([]);

  const [formData, setFormData] = useState({
    id_joya: '',
    cantidad: 1,
    motivo: 'Defecto',
    tipo_devolucion: 'Reembolso',
    metodo_reembolso: 'Efectivo',
    notas: ''
  });

  useEffect(() => {
    cargarDevoluciones();
  }, []);

  const cargarDevoluciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/devoluciones', {
        params: { estado: 'Pendiente' }
      });
      
      setDevoluciones(response.data.devoluciones || []);
      setError('');
    } catch (err) {
      console.error('Error al cargar devoluciones:', err);
      setError('Error al cargar devoluciones');
    } finally {
      setLoading(false);
    }
  };

  const buscarVenta = async () => {
    if (!idVenta) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un ID de venta' });
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/ventas/${idVenta}`);
      setVenta(response.data);
      setItemsVenta(response.data.items || []);
      setMensaje({ tipo: '', texto: '' });
      setMostrarFormulario(true);
    } catch (err) {
      console.error('Error al buscar venta:', err);
      setMensaje({ tipo: 'error', texto: 'Venta no encontrada' });
      setVenta(null);
      setItemsVenta([]);
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

    if (!formData.id_joya) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un producto' });
      return;
    }

    if (!formData.cantidad || formData.cantidad <= 0) {
      setMensaje({ tipo: 'error', texto: 'La cantidad debe ser mayor a 0' });
      return;
    }

    try {
      setLoading(true);
      await api.post('/devoluciones', {
        id_venta: venta.id,
        id_joya: parseInt(formData.id_joya),
        cantidad: parseInt(formData.cantidad),
        motivo: formData.motivo,
        tipo_devolucion: formData.tipo_devolucion,
        metodo_reembolso: formData.tipo_devolucion === 'Reembolso' ? formData.metodo_reembolso : null,
        notas: formData.notas
      });

      setMensaje({ tipo: 'success', texto: 'Devolución registrada exitosamente. Pendiente de aprobación.' });
      
      // Limpiar formulario
      setFormData({
        id_joya: '',
        cantidad: 1,
        motivo: 'Defecto',
        tipo_devolucion: 'Reembolso',
        metodo_reembolso: 'Efectivo',
        notas: ''
      });
      setMostrarFormulario(false);
      setVenta(null);
      setItemsVenta([]);
      setIdVenta('');
      
      // Recargar devoluciones
      await cargarDevoluciones();
      
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    } catch (err) {
      console.error('Error al registrar devolución:', err);
      setMensaje({ 
        tipo: 'error', 
        texto: err.response?.data?.error || 'Error al registrar devolución' 
      });
    } finally {
      setLoading(false);
    }
  };

  const procesarDevolucion = async (id, aprobar) => {
    const accion = aprobar ? 'aprobar' : 'rechazar';
    if (!window.confirm(`¿Estás seguro de ${accion} esta devolución?`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/devoluciones/${id}/procesar`, { aprobar });
      
      setMensaje({ 
        tipo: 'success', 
        texto: `Devolución ${aprobar ? 'aprobada' : 'rechazada'} exitosamente` 
      });
      
      // Recargar devoluciones
      await cargarDevoluciones();
      
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
    } catch (err) {
      console.error('Error al procesar devolución:', err);
      setMensaje({ 
        tipo: 'error', 
        texto: err.response?.data?.error || 'Error al procesar devolución' 
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

  const itemSeleccionado = itemsVenta.find(item => item.id_joya === parseInt(formData.id_joya));

  return (
    <div className="devoluciones-container">
      <div className="page-header">
        <h1>🔄 Devoluciones y Reclamos</h1>
        <p>Gestión de devoluciones de productos y cambios</p>
      </div>

      {mensaje.texto && (
        <div className={`alert alert-${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {/* Búsqueda de venta */}
      {!mostrarFormulario && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Nueva Devolución</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div className="search-venta">
              <div className="form-group">
                <label>ID de Venta</label>
                <input
                  type="number"
                  value={idVenta}
                  onChange={(e) => setIdVenta(e.target.value)}
                  placeholder="Ingresa el ID de la venta..."
                  onKeyPress={(e) => e.key === 'Enter' && buscarVenta()}
                />
              </div>
              <button 
                onClick={buscarVenta} 
                className="btn btn-primary"
                disabled={loading}
              >
                🔍 Buscar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de devolución */}
      {mostrarFormulario && venta && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <h3>Registrar Devolución - Venta #{venta.id}</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ padding: '20px' }}>
              {/* Info de la venta */}
              <div className="venta-info">
                <p><strong>Fecha:</strong> {formatearFecha(venta.fecha_venta)}</p>
                <p><strong>Total:</strong> {formatearMoneda(venta.total)}</p>
                <p><strong>Método de Pago:</strong> {venta.metodo_pago}</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Producto a Devolver *</label>
                  <select
                    name="id_joya"
                    value={formData.id_joya}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecciona un producto...</option>
                    {itemsVenta.map((item) => (
                      <option key={item.id_joya} value={item.id_joya}>
                        {item.codigo} - {item.nombre} (Cant: {item.cantidad}) - {formatearMoneda(item.precio_unitario)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Cantidad a Devolver *</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    min="1"
                    max={itemSeleccionado?.cantidad || 1}
                    required
                  />
                  {itemSeleccionado && (
                    <small>Máximo: {itemSeleccionado.cantidad}</small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Motivo *</label>
                  <select
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleChange}
                    required
                  >
                    <option value="Defecto">Producto Defectuoso</option>
                    <option value="Cliente no satisfecho">Cliente no Satisfecho</option>
                    <option value="Cambio">Cambio por otro Producto</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Devolución *</label>
                  <select
                    name="tipo_devolucion"
                    value={formData.tipo_devolucion}
                    onChange={handleChange}
                    required
                  >
                    <option value="Reembolso">Reembolso (Devolver Dinero)</option>
                    <option value="Cambio">Cambio (Por otro Producto)</option>
                    <option value="Nota de Credito">Nota de Crédito</option>
                  </select>
                </div>

                {formData.tipo_devolucion === 'Reembolso' && (
                  <div className="form-group">
                    <label>Método de Reembolso *</label>
                    <select
                      name="metodo_reembolso"
                      value={formData.metodo_reembolso}
                      onChange={handleChange}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                )}
              </div>

              {itemSeleccionado && (
                <div className="monto-devolucion">
                  <strong>Monto a Reembolsar:</strong> {formatearMoneda(itemSeleccionado.precio_unitario * formData.cantidad)}
                </div>
              )}

              <div className="form-group">
                <label>Notas (Opcional)</label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  placeholder="Información adicional sobre la devolución..."
                  rows="3"
                />
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => {
                  setMostrarFormulario(false);
                  setVenta(null);
                  setItemsVenta([]);
                  setIdVenta('');
                  setFormData({
                    id_joya: '',
                    cantidad: 1,
                    motivo: 'Defecto',
                    tipo_devolucion: 'Reembolso',
                    metodo_reembolso: 'Efectivo',
                    notas: ''
                  });
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Registrando...' : 'Registrar Devolución'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de devoluciones pendientes */}
      <div className="card">
        <div className="card-header">
          <h3>Devoluciones Pendientes de Aprobación ({devoluciones.length})</h3>
        </div>

        {loading && devoluciones.length === 0 ? (
          <div className="loading">Cargando...</div>
        ) : devoluciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>✅</p>
            <p>No hay devoluciones pendientes de aprobación</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Venta</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  {isAdmin() && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {devoluciones.map((devolucion) => (
                  <tr key={devolucion.id}>
                    <td><strong>{devolucion.id}</strong></td>
                    <td>{formatearFecha(devolucion.fecha_devolucion)}</td>
                    <td>#{devolucion.id_venta}</td>
                    <td>
                      <div>{devolucion.codigo_joya}</div>
                      <small>{devolucion.nombre_joya}</small>
                    </td>
                    <td>{devolucion.cantidad}</td>
                    <td><strong>{formatearMoneda(devolucion.subtotal)}</strong></td>
                    <td>
                      <span className="badge badge-info">{devolucion.tipo_devolucion}</span>
                    </td>
                    <td>{devolucion.motivo}</td>
                    {isAdmin() && (
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            onClick={() => procesarDevolucion(devolucion.id, true)}
                            className="btn btn-success btn-sm"
                            disabled={loading}
                          >
                            ✓ Aprobar
                          </button>
                          <button
                            onClick={() => procesarDevolucion(devolucion.id, false)}
                            className="btn btn-danger btn-sm"
                            disabled={loading}
                          >
                            ✗ Rechazar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isAdmin() && devoluciones.length > 0 && (
        <div className="info-box" style={{ marginTop: '20px' }}>
          <p><strong>ℹ️ Nota:</strong> Las devoluciones deben ser aprobadas por un administrador antes de procesarse.</p>
        </div>
      )}
    </div>
  );
}

export default Devoluciones;
