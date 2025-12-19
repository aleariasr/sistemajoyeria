import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  obtenerPedidosOnline, 
  obtenerPedidoOnline,
  actualizarEstadoPedido,
  actualizarNotasPedido,
  obtenerResumenPedidos
} from '../services/api';
import { formatearFechaCorta } from '../utils/dateFormatter';
import './PedidosOnline.css';

function PedidosOnline() {
  const { isAdmin: _isAdmin } = useAuth(); // eslint-disable-line no-unused-vars
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [procesando, setProcesando] = useState(false);
  
  const [filtros, setFiltros] = useState({
    estado: '',
    busqueda: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    total_paginas: 1,
    total: 0
  });

  const cargarPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filtros,
        pagina: paginacion.pagina,
        por_pagina: 20
      };

      const response = await obtenerPedidosOnline(params);
      setPedidos(response.data.pedidos || []);
      setPaginacion({
        pagina: response.data.pagina,
        total_paginas: response.data.total_paginas,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [filtros, paginacion.pagina]);

  const cargarResumen = async () => {
    try {
      const response = await obtenerResumenPedidos();
      setResumen(response.data);
    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    cargarResumen();
  }, []);

  const verDetalle = async (id) => {
    try {
      const response = await obtenerPedidoOnline(id);
      setPedidoSeleccionado(response.data);
      setMostrarModal(true);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      console.log('DETALLE BACKEND:', error.response?.data);
      console.log('STATUS:', error.response?.status);
    alert('Error al cargar detalles del pedido');
    }
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setPedidoSeleccionado(null);
  };

  const cambiarEstado = async (nuevoEstado) => {
    if (!pedidoSeleccionado) return;

    const mensajesConfirmacion = {
      'Confirmado': '¿Confirmar este pedido? Se actualizará el stock y se creará la venta.',
      'Enviado': '¿Marcar como enviado? Se enviará un email al cliente.',
      'Entregado': '¿Marcar como entregado?',
      'Cancelado': '¿Cancelar este pedido? Si fue confirmado, se devolverá el stock.'
    };

    const mensaje = mensajesConfirmacion[nuevoEstado];
    if (!window.confirm(mensaje)) return;

    let motivo = '';
    if (nuevoEstado === 'Cancelado') {
      motivo = window.prompt('Motivo de cancelación (opcional):') || 'Cancelado por el administrador';
    }

    setProcesando(true);
    try {
      await actualizarEstadoPedido(pedidoSeleccionado.id, { 
        estado: mapEstado[nuevoEstado], 
        motivo 
      });
      
      alert('Estado actualizado correctamente');
      cerrarModal();
      cargarPedidos();
      cargarResumen();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      const mensaje = error.response?.data?.error || 'Error al cambiar estado';
      alert(mensaje);
    } finally {
      setProcesando(false);
    }
  };

  const guardarNotas = async () => {
    if (!pedidoSeleccionado) return;

    setProcesando(true);
    try {
      await actualizarNotasPedido(pedidoSeleccionado.id, {
        notas_internas: pedidoSeleccionado.notas_internas
      });
      alert('Notas guardadas correctamente');
    } catch (error) {
      console.error('Error al guardar notas:', error);
      alert('Error al guardar notas');
    } finally {
      setProcesando(false);
    }
  };

  const aplicarFiltros = () => {
    setPaginacion({ ...paginacion, pagina: 1 });
    cargarPedidos();
  };

  const mapEstado = {
  Confirmado: 'pago_verificado',
  Enviado: 'enviado',
  Entregado: 'entregado',
  Cancelado: 'cancelado'
};

  const limpiarFiltros = () => {
    setFiltros({
      estado: '',
      busqueda: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    setPaginacion({ ...paginacion, pagina: 1 });
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'pendiente': { className: 'badge-warning', icon: '⏳', texto: 'Pendiente' },
      'pago_verificado': { className: 'badge-info', icon: '✓', texto: 'Verificado' },
      'en_proceso': { className: 'badge-primary', icon: '📦', texto: 'En Proceso' },
      'enviado': { className: 'badge-info', icon: '🚚', texto: 'Enviado' },
      'entregado': { className: 'badge-success', icon: '✅', texto: 'Entregado' },
      'cancelado': { className: 'badge-danger', icon: '❌', texto: 'Cancelado' }
    };

    const badge = badges[estado] || badges['pendiente'];
    return (
      <span className={`badge ${badge.className}`}>
        {badge.icon} {badge.texto}
      </span>
    );
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const puedeConfirmar = pedidoSeleccionado?.estado === 'pendiente';
  const puedeEnviar = pedidoSeleccionado?.estado === 'en_proceso' || pedidoSeleccionado?.estado === 'pago_verificado';
  const puedeEntregar = pedidoSeleccionado?.estado === 'enviado';
  const puedeCancelar = pedidoSeleccionado?.estado !== 'entregado' && pedidoSeleccionado?.estado !== 'cancelado';

  return (
    <div className="pedidos-online-container">
      <div className="page-header">
        <h1>📦 Pedidos Online</h1>
        <p>Gestión de pedidos recibidos desde la tienda web</p>
      </div>

      {/* Resumen de estadísticas */}
      {resumen && (
        <div className="stats-grid">
          <div className="stat-card warning">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{resumen.pendientes_pago || 0}</div>
              <div className="stat-label">Pendientes</div>
            </div>
          </div>
          <div className="stat-card primary">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{resumen.en_proceso || 0}</div>
              <div className="stat-label">En Proceso</div>
            </div>
          </div>
          <div className="stat-card info">
            <div className="stat-icon">🚚</div>
            <div className="stat-content">
              <div className="stat-value">{resumen.enviados || 0}</div>
              <div className="stat-label">Enviados</div>
            </div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value">{formatearMoneda(resumen.monto_total || 0)}</div>
              <div className="stat-label">Total Ventas</div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-section">
        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Buscar:</label>
            <input
              type="text"
              placeholder="Nombre, email o teléfono..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && aplicarFiltros()}
            />
          </div>

          <div className="filtro-grupo">
            <label>Estado:</label>
            <select
              value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="pago_verificado">Verificado</option>
              <option value="en_proceso">En Proceso</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Desde:</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
            />
          </div>

          <div className="filtro-grupo">
            <label>Hasta:</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
            />
          </div>

          <div className="filtros-actions">
            <button onClick={aplicarFiltros} className="btn-primary">
              🔍 Buscar
            </button>
            <button onClick={limpiarFiltros} className="btn-secondary">
              🔄 Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="tabla-container">
        {loading ? (
          <div className="loading">Cargando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="empty-state">
            <p>📭 No se encontraron pedidos</p>
          </div>
        ) : (
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Contacto</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>#{pedido.id}</td>
                  <td>{formatearFechaCorta(pedido.fecha_creacion)}</td>
                  <td>{pedido.nombre_cliente}</td>
                  <td>
                    <div className="contacto-info">
                      <div>📧 {pedido.email}</div>
                      <div>📱 {pedido.telefono}</div>
                    </div>
                  </td>
                  <td className="monto">{formatearMoneda(pedido.total)}</td>
                  <td>{getEstadoBadge(pedido.estado)}</td>
                  <td>
                    <button
                      className="btn-ver-detalle"
                      onClick={() => verDetalle(pedido.id)}
                    >
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {paginacion.total_paginas > 1 && (
        <div className="paginacion">
          <button
            onClick={() => setPaginacion({ ...paginacion, pagina: paginacion.pagina - 1 })}
            disabled={paginacion.pagina === 1}
          >
            ← Anterior
          </button>
          <span>
            Página {paginacion.pagina} de {paginacion.total_paginas}
          </span>
          <button
            onClick={() => setPaginacion({ ...paginacion, pagina: paginacion.pagina + 1 })}
            disabled={paginacion.pagina === paginacion.total_paginas}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de detalle */}
      {mostrarModal && pedidoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pedido #{pedidoSeleccionado.id}</h2>
              <button className="btn-close" onClick={cerrarModal}>✕</button>
            </div>

            <div className="modal-body">
              {/* Información del cliente */}
              <div className="seccion">
                <h3>👤 Información del Cliente</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Nombre:</label>
                    <span>{pedidoSeleccionado.nombre_cliente}</span>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{pedidoSeleccionado.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Teléfono:</label>
                    <span>{pedidoSeleccionado.telefono}</span>
                  </div>
                  <div className="info-item">
                    <label>Estado:</label>
                    {getEstadoBadge(pedidoSeleccionado.estado)}
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="seccion">
                <h3>📦 Productos</h3>
                {pedidoSeleccionado.items?.map((item) => (
                  <div key={item.id} className="item-card">
                    {item.imagen_url && (
                      <img src={item.imagen_url} alt={item.nombre_producto} />
                    )}
                    <div className="item-info">
                      <div className="item-nombre">{item.nombre_producto || 'Producto'}</div>
                      <div className="item-detalle">
                        Cantidad: {item.cantidad} × {formatearMoneda(item.precio_unitario)}
                      </div>
                    </div>
                    <div className="item-precio">
                      {formatearMoneda(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="total-section">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>{formatearMoneda(pedidoSeleccionado.subtotal)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>{formatearMoneda(pedidoSeleccionado.total)}</span>
                </div>
              </div>

              {/* Notas del cliente */}
              {pedidoSeleccionado.notas && (
                <div className="seccion">
                  <h3>💬 Comentarios del Cliente</h3>
                  <div className="nota-box">{pedidoSeleccionado.notas}</div>
                </div>
              )}

              {/* Notas internas */}
              <div className="seccion">
                <h3>📝 Notas Internas</h3>
                <textarea
                  className="notas-textarea"
                  value={pedidoSeleccionado.notas_internas || ''}
                  onChange={(e) => setPedidoSeleccionado({
                    ...pedidoSeleccionado,
                    notas_internas: e.target.value
                  })}
                  placeholder="Agregar notas internas (solo visible para administradores)..."
                  rows={4}
                />
                <button 
                  className="btn-secondary"
                  onClick={guardarNotas}
                  disabled={procesando}
                >
                  💾 Guardar Notas
                </button>
              </div>

              {/* Acciones */}
              <div className="seccion">
                <h3>⚡ Acciones</h3>
                <div className="acciones-grid">
                  {puedeConfirmar && (
                    <button
                      className="btn-success"
                      onClick={() => cambiarEstado('Confirmado')}
                      disabled={procesando}
                    >
                      ✅ Confirmar Pedido
                    </button>
                  )}
                  {puedeEnviar && (
                    <button
                      className="btn-primary"
                      onClick={() => cambiarEstado('Enviado')}
                      disabled={procesando}
                    >
                      🚚 Marcar como Enviado
                    </button>
                  )}
                  {puedeEntregar && (
                    <button
                      className="btn-success"
                      onClick={() => cambiarEstado('Entregado')}
                      disabled={procesando}
                    >
                      ✅ Marcar como Entregado
                    </button>
                  )}
                  {puedeCancelar && (
                    <button
                      className="btn-danger"
                      onClick={() => cambiarEstado('Cancelado')}
                      disabled={procesando}
                    >
                      ❌ Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PedidosOnline;
