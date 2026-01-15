import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerJoyas, eliminarJoya, obtenerCategorias } from '../services/api';
import BarcodeModal from './BarcodeModal';
import NotificacionesPush from './NotificacionesPush';
import { useSelection } from '../context/SelectionContext';
import PageHeader from './PageHeader';

// Constantes para thumbnail de imagen
const THUMBNAIL_SIZE = '50px';

// Constantes para estilos de selección
const SELECTION_STYLES = {
  container: {
    marginTop: '15px',
    padding: '12px',
    background: '#e3f2fd',
    borderRadius: '6px',
    border: '1px solid #90caf9'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  title: {
    color: '#1976d2'
  },
  clearButton: {
    background: 'transparent',
    border: 'none',
    color: '#1976d2',
    cursor: 'pointer',
    fontSize: '0.9rem',
    textDecoration: 'underline'
  },
  itemsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    maxHeight: '120px',
    overflowY: 'auto'
  },
  itemChip: (isOnCurrentPage) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: isOnCurrentPage ? '#ffffff' : '#fff9c4',
    border: isOnCurrentPage ? '1px solid #90caf9' : '1px solid #ffd54f',
    borderRadius: '4px',
    fontSize: '0.85rem'
  }),
  itemName: {
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  removeButton: {
    background: 'transparent',
    border: 'none',
    color: '#d32f2f',
    cursor: 'pointer',
    padding: '0 4px',
    fontSize: '1rem',
    lineHeight: 1
  },
  hint: {
    marginTop: '8px',
    fontSize: '0.8rem',
    color: '#666'
  }
};

function ListadoJoyas() {
  const navigate = useNavigate();
  const { toggleSelection, isSelected, clearSelection, toggleMultiple, getSelectedItems, getItemId } = useSelection();
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

  // Get all selected joyas from context (persists across pages/filters)
  const joyasSeleccionadas = useMemo(() => {
    return getSelectedItems();
  }, [getSelectedItems]);

  const toggleSeleccionItem = (j) => {
    const key = getItemId(j);
    toggleSelection(key, j);
  };

  const toggleSeleccionPagina = (checked) => {
    toggleMultiple(joyas, checked);
  };

  return (
    <div>
      <PageHeader 
        title="Inventario de Joyas"
        subtitle="Gestiona el inventario completo de tu joyería"
      />

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

        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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

        {/* Mostrar ítems seleccionados */}
        {joyasSeleccionadas.length > 0 && (
          <div style={SELECTION_STYLES.container}>
            <div style={SELECTION_STYLES.header}>
              <strong style={SELECTION_STYLES.title}>
                ✓ {joyasSeleccionadas.length} {joyasSeleccionadas.length === 1 ? 'ítem seleccionado' : 'ítems seleccionados'}
              </strong>
              <button
                onClick={clearSelection}
                style={SELECTION_STYLES.clearButton}
              >
                Limpiar todo
              </button>
            </div>
            <div style={SELECTION_STYLES.itemsContainer}>
              {joyasSeleccionadas.map((j) => {
                const key = getItemId(j);
                // Check if this item is on the current page
                const enPaginaActual = joyas.some(joya => getItemId(joya) === key);
                return (
                  <div 
                    key={key}
                    style={SELECTION_STYLES.itemChip(enPaginaActual)}
                    title={enPaginaActual ? 'En página actual' : 'En otra página/filtro'}
                  >
                    <strong>{j.codigo}</strong>
                    <span style={{ color: '#666' }}>-</span>
                    <span style={SELECTION_STYLES.itemName}>
                      {j.nombre}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSeleccionItem(j);
                      }}
                      style={SELECTION_STYLES.removeButton}
                      title="Remover selección"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={SELECTION_STYLES.hint}>
              💡 Los ítems en amarillo no están en la página actual. Todas las selecciones se mantendrán al imprimir.
            </div>
          </div>
        )}
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
