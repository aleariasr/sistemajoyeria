import React, { useState, useEffect, useCallback } from 'react';
import {
  obtenerComponentesSet,
  agregarComponente,
  eliminarComponente,
  obtenerJoyas
} from '../services/api';
import './ProductosCompuestosManager.css';

function ProductosCompuestosManager({ setId, nombreSet, onComponentesChange }) {
  const [componentes, setComponentes] = useState([]);
  const [stockSet, setStockSet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState(null);

  const cargarComponentes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await obtenerComponentesSet(setId);
      const comps = response.data.data || [];
      setComponentes(comps);
      
      // Calcular stock del set
      if (comps.length > 0) {
        calcularStockSet(comps);
      } else {
        setStockSet(0);
      }
      
      if (onComponentesChange) {
        onComponentesChange(comps);
      }
    } catch (error) {
      console.error('Error cargando componentes:', error);
      setError('Error al cargar componentes');
    } finally {
      setLoading(false);
    }
  }, [setId, onComponentesChange]);

  useEffect(() => {
    if (setId) {
      cargarComponentes();
    }
  }, [setId, cargarComponentes]);

  const calcularStockSet = (comps) => {
    if (comps.length === 0) {
      setStockSet(0);
      return;
    }
    
    const stocks = comps.map(c => {
      if (!c.producto) return 0;
      return Math.floor(c.producto.stock_actual / c.cantidad_requerida);
    });
    
    setStockSet(Math.min(...stocks));
  };

  const buscarProductos = async (termino) => {
    if (!termino || termino.length < 2) {
      setProductos([]);
      return;
    }

    try {
      const response = await obtenerJoyas({ busqueda: termino, por_pagina: 20 });
      const todosProductos = response.data.joyas || [];
      
      // Filtrar productos ya agregados
      const idsComponentes = componentes.map(c => c.producto?.id);
      const productosFiltrados = todosProductos.filter(p => 
        p.id !== setId && !idsComponentes.includes(p.id)
      );
      
      setProductos(productosFiltrados);
    } catch (error) {
      console.error('Error buscando productos:', error);
    }
  };

  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setBusqueda(valor);
    buscarProductos(valor);
  };

  const handleSeleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setBusqueda(producto.nombre);
    setProductos([]);
  };

  const handleAgregarComponente = async () => {
    if (!productoSeleccionado) {
      setError('Seleccione un producto');
      return;
    }

    if (cantidad <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await agregarComponente({
        id_producto_set: setId,
        id_producto_componente: productoSeleccionado.id,
        cantidad: cantidad
      });

      await cargarComponentes();
      cerrarModal();
      alert('✅ Componente agregado');
    } catch (error) {
      console.error('Error agregando componente:', error);
      setError(error.response?.data?.error || 'Error al agregar componente');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarComponente = async (id) => {
    if (!window.confirm('¿Eliminar este componente del set?')) return;

    try {
      setLoading(true);
      await eliminarComponente(id);
      await cargarComponentes();
      alert('✅ Componente eliminado');
    } catch (error) {
      console.error('Error eliminando componente:', error);
      alert('❌ Error al eliminar componente');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    setMostrarModal(true);
    setProductoSeleccionado(null);
    setBusqueda('');
    setCantidad(1);
    setProductos([]);
    setError(null);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setProductoSeleccionado(null);
    setBusqueda('');
    setCantidad(1);
    setProductos([]);
    setError(null);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="productos-compuestos-manager">
      <div className="componentes-header">
        <h4>📦 Componentes del Set</h4>
        <button type="button" onClick={abrirModal} className="btn-agregar-componente">
          + Agregar Componente
        </button>
      </div>

      {componentes.length > 0 && (
        <div className="stock-set-indicator">
          <strong>Stock Disponible del SET:</strong>
          <span className={`stock-badge ${stockSet > 0 ? 'disponible' : 'agotado'}`}>
            {stockSet} unidades
          </span>
          <small>Calculado automáticamente basado en componentes</small>
        </div>
      )}

      {componentes.length === 0 ? (
        <p className="sin-componentes">
          No hay componentes. Agrega productos que forman parte de este set.
        </p>
      ) : (
        <div className="componentes-lista">
          {componentes.map((comp) => (
            <div key={comp.id} className="componente-item">
              {comp.producto?.imagen_url && (
                <img 
                  src={comp.producto.imagen_url} 
                  alt={comp.producto.nombre}
                  className="componente-thumbnail"
                />
              )}
              <div className="componente-info">
                <strong>{comp.producto?.nombre || 'Producto'}</strong>
                <div className="componente-detalles">
                  <span>Código: {comp.producto?.codigo}</span>
                  <span>Precio: {formatPrice(comp.producto?.precio_venta || 0)}</span>
                </div>
                <div className="componente-stock">
                  <span>Stock actual: {comp.producto?.stock_actual || 0}</span>
                  <span>Cantidad requerida: {comp.cantidad_requerida}</span>
                  <span className={`sets-posibles ${
                    Math.floor((comp.producto?.stock_actual || 0) / comp.cantidad_requerida) > 0 
                      ? 'disponible' 
                      : 'agotado'
                  }`}>
                    Sets posibles: {Math.floor((comp.producto?.stock_actual || 0) / comp.cantidad_requerida)}
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleEliminarComponente(comp.id)}
                className="btn-eliminar-componente"
                disabled={loading}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Componente al Set</h3>
              <button type="button" onClick={cerrarModal} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              {error && <div className="alert-error">{error}</div>}

              <div className="form-group">
                <label>Buscar Producto</label>
                <input
                  type="text"
                  value={busqueda}
                  onChange={handleBusquedaChange}
                  placeholder="Buscar por nombre o código..."
                  autoComplete="off"
                />
                {productos.length > 0 && (
                  <div className="productos-dropdown">
                    {productos.map(producto => (
                      <div 
                        key={producto.id} 
                        className="producto-option"
                        onClick={() => handleSeleccionarProducto(producto)}
                      >
                        <strong>{producto.nombre}</strong>
                        <small>Código: {producto.codigo} | Stock: {producto.stock_actual}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {productoSeleccionado && (
                <div className="producto-seleccionado">
                  <strong>✓ Producto seleccionado:</strong>
                  <p>{productoSeleccionado.nombre}</p>
                  <small>Stock: {productoSeleccionado.stock_actual} | Precio: {formatPrice(productoSeleccionado.precio_venta)}</small>
                </div>
              )}

              <div className="form-group">
                <label>Cantidad Requerida por Set</label>
                <input
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                  min="1"
                  max="100"
                />
                <small>Cuántas unidades de este producto se incluyen en cada set</small>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={cerrarModal} className="btn-cancelar">
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleAgregarComponente} 
                disabled={loading || !productoSeleccionado}
                className="btn-guardar"
              >
                {loading ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductosCompuestosManager;
