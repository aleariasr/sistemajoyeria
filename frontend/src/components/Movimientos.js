import React, { useState, useEffect } from 'react';
import { obtenerMovimientos, crearMovimiento, obtenerJoyas } from '../services/api';

function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  
  // Modal para crear movimiento
  const [mostrarModal, setMostrarModal] = useState(false);
  const [joyas, setJoyas] = useState([]);
  const [busquedaJoya, setBusquedaJoya] = useState('');
  const [joyaSeleccionada, setJoyaSeleccionada] = useState(null);
  
  // Formulario de movimiento
  const [formMovimiento, setFormMovimiento] = useState({
    id_joya: '',
    tipo_movimiento: 'Entrada',
    cantidad: '',
    motivo: '',
    usuario: ''
  });
  
  // Filtros
  const [filtros, setFiltros] = useState({
    tipo_movimiento: '',
    fecha_desde: '',
    fecha_hasta: ''
  });
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  useEffect(() => {
    cargarMovimientos();
  }, [paginaActual, filtros]);

  const cargarMovimientos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        pagina: paginaActual,
        por_pagina: 50,
        ...filtros
      };

      const response = await obtenerMovimientos(params);
      setMovimientos(response.data.movimientos);
      setTotalPaginas(response.data.total_paginas);
    } catch (err) {
      setError('Error al cargar movimientos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buscarJoyas = async (termino) => {
    if (!termino || termino.length < 2) {
      setJoyas([]);
      return;
    }

    try {
      const response = await obtenerJoyas({ busqueda: termino, por_pagina: 10 });
      setJoyas(response.data.joyas);
    } catch (err) {
      console.error('Error al buscar joyas:', err);
    }
  };

  const handleBusquedaJoya = (e) => {
    const valor = e.target.value;
    setBusquedaJoya(valor);
    buscarJoyas(valor);
  };

  const seleccionarJoya = (joya) => {
    setJoyaSeleccionada(joya);
    setBusquedaJoya(`${joya.codigo} - ${joya.nombre}`);
    setFormMovimiento({ ...formMovimiento, id_joya: joya.id });
    setJoyas([]);
  };

  const handleSubmitMovimiento = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      await crearMovimiento(formMovimiento);
      
      setMensaje('Movimiento registrado correctamente');
      setTimeout(() => setMensaje(null), 3000);
      
      // Resetear formulario
      setFormMovimiento({
        id_joya: '',
        tipo_movimiento: 'Entrada',
        cantidad: '',
        motivo: '',
        usuario: ''
      });
      setBusquedaJoya('');
      setJoyaSeleccionada(null);
      setMostrarModal(false);
      
      cargarMovimientos();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al registrar movimiento');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const getTipoMovimientoBadge = (tipo) => {
    switch (tipo) {
      case 'Entrada':
        return <span className="badge badge-success">Entrada</span>;
      case 'Salida':
        return <span className="badge badge-danger">Salida</span>;
      case 'Ajuste':
        return <span className="badge badge-info">Ajuste</span>;
      default:
        return <span className="badge">{tipo}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Movimientos de Inventario</h2>
            <p>Registra y consulta entradas, salidas y ajustes de inventario</p>
          </div>
          <button className="btn btn-primary" onClick={() => setMostrarModal(true)}>
            ➕ Registrar Movimiento
          </button>
        </div>
      </div>

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-filters">
        <div className="filters-grid">
          <div className="form-group">
            <label>Tipo de Movimiento</label>
            <select
              value={filtros.tipo_movimiento}
              onChange={(e) => setFiltros({ ...filtros, tipo_movimiento: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="Entrada">Entrada</option>
              <option value="Salida">Salida</option>
              <option value="Ajuste">Ajuste</option>
            </select>
          </div>

          <div className="form-group">
            <label>Fecha Desde</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Fecha Hasta</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
            />
          </div>
        </div>

        <button
          className="btn btn-secondary"
          style={{ marginTop: '15px' }}
          onClick={() => {
            setFiltros({ tipo_movimiento: '', fecha_desde: '', fecha_hasta: '' });
            setPaginaActual(1);
          }}
        >
          🔄 Limpiar Filtros
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando movimientos...</p>
          </div>
        ) : movimientos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '1.2rem' }}>No hay movimientos registrados</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Antes</th>
                    <th>Stock Después</th>
                    <th>Motivo</th>
                    <th>Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov) => (
                    <tr key={mov.id}>
                      <td>{formatearFecha(mov.fecha_movimiento)}</td>
                      <td><strong>{mov.codigo}</strong></td>
                      <td>{mov.nombre}</td>
                      <td>{getTipoMovimientoBadge(mov.tipo_movimiento)}</td>
                      <td><strong>{mov.cantidad}</strong></td>
                      <td>{mov.stock_antes}</td>
                      <td>{mov.stock_despues}</td>
                      <td>{mov.motivo || '-'}</td>
                      <td>{mov.usuario || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPaginaActual(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  ← Anterior
                </button>
                <span>
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para registrar movimiento */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Registrar Movimiento de Inventario</h3>
              <button
                className="btn btn-icon"
                onClick={() => {
                  setMostrarModal(false);
                  setBusquedaJoya('');
                  setJoyaSeleccionada(null);
                  setJoyas([]);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMovimiento}>
              <div className="form-group">
                <label>
                  Buscar Joya (por código o nombre) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={busquedaJoya}
                  onChange={handleBusquedaJoya}
                  placeholder="Escriba código o nombre..."
                  required
                />
                {joyas.length > 0 && (
                  <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginTop: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {joyas.map((joya) => (
                      <div
                        key={joya.id}
                        onClick={() => seleccionarJoya(joya)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        <strong>{joya.codigo}</strong> - {joya.nombre}
                        <br />
                        <small style={{ color: '#666' }}>
                          Stock actual: {joya.stock_actual}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {joyaSeleccionada && (
                <div style={{
                  backgroundColor: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '20px'
                }}>
                  <strong>Joya seleccionada:</strong> {joyaSeleccionada.codigo} - {joyaSeleccionada.nombre}
                  <br />
                  <span style={{ color: '#666' }}>Stock actual: {joyaSeleccionada.stock_actual}</span>
                </div>
              )}

              <div className="form-group">
                <label>
                  Tipo de Movimiento <span className="required">*</span>
                </label>
                <select
                  value={formMovimiento.tipo_movimiento}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo_movimiento: e.target.value })}
                  required
                >
                  <option value="Entrada">Entrada</option>
                  <option value="Salida">Salida</option>
                  <option value="Ajuste">Ajuste</option>
                </select>
                <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                  {formMovimiento.tipo_movimiento === 'Entrada' && 'Aumenta el stock actual'}
                  {formMovimiento.tipo_movimiento === 'Salida' && 'Disminuye el stock actual'}
                  {formMovimiento.tipo_movimiento === 'Ajuste' && 'Establece el stock en la cantidad especificada'}
                </small>
              </div>

              <div className="form-group">
                <label>
                  Cantidad <span className="required">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formMovimiento.cantidad}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, cantidad: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Motivo</label>
                <textarea
                  value={formMovimiento.motivo}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, motivo: e.target.value })}
                  placeholder="Ej: Compra a proveedor, Venta, Ajuste por conteo físico..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  value={formMovimiento.usuario}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, usuario: e.target.value })}
                  placeholder="Nombre del usuario"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMostrarModal(false);
                    setBusquedaJoya('');
                    setJoyaSeleccionada(null);
                    setJoyas([]);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading || !joyaSeleccionada}
                >
                  {loading ? 'Registrando...' : '💾 Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Movimientos;
