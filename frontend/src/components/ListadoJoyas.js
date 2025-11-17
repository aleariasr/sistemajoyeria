import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerJoyas, eliminarJoya, obtenerCategorias } from '../services/api';

function ListadoJoyas() {
  const navigate = useNavigate();
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
      setJoyas(response.data.joyas);
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

  return (
    <div>
      <div className="page-header">
        <h2>Inventario de Joyas</h2>
        <p>Gestiona el inventario completo de tu joyería</p>
      </div>

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
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio Venta</th>
                    <th>Stock</th>
                    <th>Ubicación</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {joyas.map((joya) => (
                    <tr key={joya.id} className={getRowClass(joya)}>
                      <td><strong>{joya.codigo}</strong></td>
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
    </div>
  );
}

export default ListadoJoyas;
