import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerJoyas, eliminarJoya, obtenerCategorias } from '../services/api';
import BarcodeModal from './BarcodeModal';
import NotificacionesPush from './NotificacionesPush';
import { useSelection } from '../context/SelectionContext';

// Constantes para thumbnail de imagen
const THUMBNAIL_SIZE = '50px';

function ListadoJoyas() {
  const navigate = useNavigate();
  const { toggleSelection, isSelected, clearSelection, toggleMultiple } = useSelection();
  const [joyas, setJoyas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [stockBajo, setStockBajo] = useState(false);
  const [sinStock, setSinStock] = useState(false);
  const [estado, setEstado] = useState('');
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Listas para filtros
  const [categorias, setCategorias] = useState([]);
  
  // Estado para modal de código de barras
  const [joyaSeleccionada, setJoyaSeleccionada] = useState(null);
  const [mostrarModalBarcode, setMostrarModalBarcode] = useState(false);
  const [mostrarModalMulti, setMostrarModalMulti] = useState(false);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarJoyas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filtros = {
        pagina: paginaActual,
        por_pagina: 20
      };
      
      if (busqueda) filtros.busqueda = busqueda;
      if (categoria) filtros.categoria = categoria;
      if (precioMin) filtros.precio_min = precioMin;
      if (precioMax) filtros.precio_max = precioMax;
      if (stockBajo) filtros.stock_bajo = 'true';
      if (sinStock) filtros.sin_stock = 'true';
      if (estado) filtros.estado = estado;

      const response = await obtenerJoyas(filtros);
      const lista = Array.isArray(response.data.joyas) ? response.data.joyas : [];
      // Dedup por id/codigo por si el backend o la UI repite entradas
      const seen = new Set();
      const dedup = [];
      for (const j of lista) {
        const key = j.id ?? j.codigo;
        if (!seen.has(key)) {
          seen.add(key);
          dedup.push(j);
        }
      }
      setJoyas(dedup);
      // Selection now persists across page/filter changes (managed by SelectionContext)
      setTotalPaginas(response.data.total_paginas);
      setTotal(response.data.total);
    } catch (err) {
      setError('Error al cargar las joyas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [paginaActual, busqueda, categoria, precioMin, precioMax, stockBajo, sinStock, estado]);

  useEffect(() => {
    cargarJoyas();
  }, [cargarJoyas]);

  const cargarCategorias = async () => {
    try {
      const response = await obtenerCategorias();
      setCategorias(response.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const handleEliminar = async (id, codigo) => {
    if (window.confirm(`¿Estás seguro de que deseas marcar como descontinuada la joya ${codigo}?`)) {
      try {
        await eliminarJoya(id);
        setMensaje('Joya marcada como descontinuada correctamente');
        setTimeout(() => setMensaje(null), 3000);
        cargarJoyas();
      } catch (err) {
        setError('Error al eliminar la joya');
        console.error(err);
      }
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoria('');
    setPrecioMin('');
    setPrecioMax('');
    setStockBajo(false);
    setSinStock(false);
    setEstado('');
    setPaginaActual(1);
  };

  const formatearMoneda = (valor, moneda) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'CRC',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const getEstadoBadge = (joya) => {
    if (joya.stock_actual === 0) {
      return <span className="badge badge-danger">Agotado</span>;
    } else if (joya.stock_actual <= joya.stock_minimo) {
      return <span className="badge badge-warning">Stock Bajo</span>;
    } else if (joya.estado === 'Descontinuado') {
      return <span className="badge badge-info">Descontinuado</span>;
    } else {
      return <span className="badge badge-success">Activo</span>;
    }
  };

  const getRowClass = (joya) => {
    if (joya.stock_actual === 0) return 'stock-agotado';
    if (joya.stock_actual <= joya.stock_minimo) return 'stock-bajo';
    return '';
  };

  const handleOpenBarcodeModal = (joya) => {
    setJoyaSeleccionada(joya);
    setMostrarModalBarcode(true);
  };

  const handleCloseBarcodeModal = () => {
    setMostrarModalBarcode(false);
    setJoyaSeleccionada(null);
  };

  const joyasSeleccionadas = useMemo(() => {
    return joyas.filter((j) => isSelected(j.id) || isSelected(j.codigo));
  }, [joyas, isSelected]);

  const toggleSeleccionItem = (j) => {
    const key = j.id ?? j.codigo;
    toggleSelection(key);
  };

  const toggleSeleccionPagina = (checked) => {
    const ids = joyas.map((j) => j.id ?? j.codigo);
    toggleMultiple(ids, checked);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Inventario de Joyas</h2>
        <p>Gestiona el inventario completo de tu joyería</p>
      </div>

      {/* Push Notifications Banner */}
      <NotificacionesPush />

      {mensaje && <div className="alert alert-success">{mensaje}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar por código, nombre, descripción, categoría o proveedor..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>

        <div className="filters-grid">
          <div className="form-group">
            <label>Categoría</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Precio Mínimo</label>
            <input
              type="number"
              placeholder="0"
              value={precioMin}
              onChange={(e) => setPrecioMin(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Precio Máximo</label>
            <input
              type="number"
              placeholder="Sin límite"
              value={precioMax}
              onChange={(e) => setPrecioMax(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Descontinuado">Descontinuado</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={stockBajo}
                onChange={(e) => setStockBajo(e.target.checked)}
              />
              {' '}Stock bajo o igual al mínimo
            </label>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={sinStock}
                onChange={(e) => setSinStock(e.target.checked)}
              />
              {' '}Sin stock (0)
            </label>
          </div>
        </div>

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={limpiarFiltros}>
            🔄 Limpiar Filtros
          </button>
          <button
            className="btn btn-primary"
            disabled={joyasSeleccionadas.length === 0}
            onClick={() => setMostrarModalMulti(true)}
            title={joyasSeleccionadas.length === 0 ? 'Seleccione una o más joyas' : 'Imprimir códigos seleccionados'}
          >
            🖨️ Imprimir códigos seleccionados ({joyasSeleccionadas.length})
          </button>
          {joyasSeleccionadas.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={clearSelection}
              title="Limpiar selección"
            >
              ✕ Limpiar Selección
            </button>
          )}
          <span style={{ color: '#666', alignSelf: 'center' }}>
            Total: {total} joyas
          </span>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando joyas...</p>
          </div>
        ) : joyas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '1.2rem' }}>No se encontraron joyas</p>
            <Link to="/nueva-joya" className="btn btn-primary" style={{ marginTop: '20px' }}>
              ➕ Agregar Primera Joya
            </Link>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Seleccionar página"
                        checked={joyas.length > 0 && joyas.every((j) => isSelected(j.id) || isSelected(j.codigo))}
                        onChange={(e) => toggleSeleccionPagina(e.target.checked)}
                      />
                    </th>
                    <th>Imagen</th>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Tienda Online</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {joyas.map((joya) => (
                    <tr key={joya.id} className={getRowClass(joya)}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!(isSelected(joya.id) || isSelected(joya.codigo))}
                          onChange={() => toggleSeleccionItem(joya)}
                          aria-label={`Seleccionar ${joya.codigo}`}
                        />
                      </td>
                      <td>
                        {joya.imagen_url ? (
                          <img 
                            src={joya.imagen_url} 
                            alt={joya.nombre}
                            style={{ 
                              width: THUMBNAIL_SIZE, 
                              height: THUMBNAIL_SIZE, 
                              objectFit: 'cover',
                              borderRadius: '4px',
                              border: '1px solid #ddd'
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: THUMBNAIL_SIZE, 
                            height: THUMBNAIL_SIZE, 
                            background: '#f5f5f5',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: '20px'
                          }}>
                            💎
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{joya.codigo}</strong>
                          <button
                            className="btn btn-icon btn-barcode"
                            title="Generar Código de Barras"
                            onClick={() => handleOpenBarcodeModal(joya)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.85rem',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              border: 'none',
                              color: 'white',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            🏷️
                          </button>
                        </div>
                      </td>
                      <td>{joya.nombre}</td>
                      <td>{joya.categoria}</td>
                      <td>{formatearMoneda(joya.precio_venta, joya.moneda)}</td>
                      <td>
                        <strong>{joya.stock_actual}</strong>
                        {joya.stock_actual <= joya.stock_minimo && (
                          <span style={{ color: '#f57c00', marginLeft: '5px' }}>⚠️</span>
                        )}
                      </td>
                      <td>{joya.ubicacion}</td>
                      <td>{getEstadoBadge(joya)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {joya.mostrar_en_storefront === true ? (
                          <span 
                            style={{ 
                              fontSize: '20px',
                              filter: 'grayscale(0)',
                              display: 'inline-block'
                            }}
                            title="Visible en tienda online"
                          >
                            🌐
                          </span>
                        ) : (
                          <span 
                            style={{ 
                              fontSize: '18px',
                              opacity: 0.3,
                              display: 'inline-block'
                            }}
                            title="Oculto en tienda online"
                          >
                            🚫
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-primary btn-icon"
                            title="Ver Detalle"
                            onClick={() => navigate(`/joya/${joya.id}`)}
                          >
                            👁️
                          </button>
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Editar"
                            onClick={() => navigate(`/editar-joya/${joya.id}`)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            title="Eliminar"
                            onClick={() => handleEliminar(joya.id, joya.codigo)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
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
      
      {/* Modal de código de barras */}
      {mostrarModalBarcode && joyaSeleccionada && (
        <BarcodeModal 
          joya={joyaSeleccionada} 
          onClose={handleCloseBarcodeModal}
        />
      )}

      {/* Modal de códigos múltiple */}
      {mostrarModalMulti && joyasSeleccionadas.length > 0 && (
        <BarcodeModal
          joyas={joyasSeleccionadas}
          onClose={() => setMostrarModalMulti(false)}
        />
      )}
    </div>
  );
}

export default ListadoJoyas;
