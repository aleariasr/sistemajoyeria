import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/Ventas.css';

function Ventas() {
  const { user } = useAuth();
  const [joyas, setJoyas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [descuento, setDescuento] = useState(0);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    if (busqueda.length >= 2) {
      buscarJoyas();
    } else {
      setJoyas([]);
    }
  }, [busqueda]);

  const buscarJoyas = async () => {
    try {
      const response = await api.get('/joyas', {
        params: { busqueda, estado: 'Activo', por_pagina: 10 }
      });
      setJoyas(response.data.joyas || []);
    } catch (error) {
      console.error('Error al buscar joyas:', error);
    }
  };

  const agregarAlCarrito = (joya) => {
    const itemExistente = carrito.find(item => item.id === joya.id);
    
    if (itemExistente) {
      if (itemExistente.cantidad >= joya.stock_actual) {
        setMensaje({ tipo: 'error', texto: 'No hay suficiente stock disponible' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        return;
      }
      
      setCarrito(carrito.map(item =>
        item.id === joya.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      if (joya.stock_actual === 0) {
        setMensaje({ tipo: 'error', texto: 'No hay stock disponible' });
        setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        return;
      }
      
      setCarrito([...carrito, {
        id: joya.id,
        id_joya: joya.id,
        codigo: joya.codigo,
        nombre: joya.nombre,
        precio_unitario: joya.precio_venta,
        cantidad: 1,
        stock_disponible: joya.stock_actual,
        moneda: joya.moneda
      }]);
    }
    
    setBusqueda('');
    setJoyas([]);
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    const item = carrito.find(i => i.id === id);
    
    if (nuevaCantidad > item.stock_disponible) {
      setMensaje({ tipo: 'error', texto: 'No hay suficiente stock disponible' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      return;
    }
    
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }
    
    setCarrito(carrito.map(item =>
      item.id === id ? { ...item, cantidad: nuevaCantidad } : item
    ));
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() - descuento;
  };

  const calcularCambio = () => {
    if (metodoPago === 'Efectivo' && efectivoRecibido) {
      const cambio = parseFloat(efectivoRecibido) - calcularTotal();
      return cambio >= 0 ? cambio : 0;
    }
    return 0;
  };

  const procesarVenta = async (e) => {
    e.preventDefault();
    
    if (carrito.length === 0) {
      setMensaje({ tipo: 'error', texto: 'El carrito está vacío' });
      return;
    }

    if (metodoPago === 'Efectivo' && parseFloat(efectivoRecibido) < calcularTotal()) {
      setMensaje({ tipo: 'error', texto: 'El efectivo recibido es insuficiente' });
      return;
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const ventaData = {
        items: carrito,
        metodo_pago: metodoPago,
        descuento: descuento,
        efectivo_recibido: metodoPago === 'Efectivo' ? parseFloat(efectivoRecibido) : null,
        notas: notas
      };

      const response = await api.post('/ventas', ventaData);
      
      setMensaje({ 
        tipo: 'success', 
        texto: `Venta #${response.data.id} realizada exitosamente. Total: ${calcularTotal().toFixed(2)}` 
      });
      
      // Limpiar formulario
      setCarrito([]);
      setDescuento(0);
      setEfectivoRecibido('');
      setNotas('');
      setMetodoPago('Efectivo');
      setMostrarFormulario(false);
      
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
    } catch (error) {
      console.error('Error al procesar venta:', error);
      setMensaje({ 
        tipo: 'error', 
        texto: error.response?.data?.error || 'Error al procesar la venta' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ventas-container">
      <div className="page-header">
        <h1>💰 Nueva Venta</h1>
        <p>Usuario: {user?.full_name}</p>
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="ventas-content">
        <div className="busqueda-section">
          <h2>Buscar Producto</h2>
          <div className="busqueda-input-container">
            <input
              type="text"
              placeholder="Buscar por código, nombre, categoría..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="busqueda-input"
            />
          </div>

          {joyas.length > 0 && (
            <div className="resultados-busqueda">
              {joyas.map(joya => (
                <div key={joya.id} className="resultado-item">
                  <div className="resultado-info">
                    <strong>{joya.codigo}</strong> - {joya.nombre}
                    <br />
                    <small>{joya.categoria} | Stock: {joya.stock_actual}</small>
                  </div>
                  <div className="resultado-precio">
                    {joya.moneda === 'USD' ? '$' : '₡'}{joya.precio_venta.toFixed(2)}
                  </div>
                  <button 
                    onClick={() => agregarAlCarrito(joya)}
                    className="btn-agregar"
                    disabled={joya.stock_actual === 0}
                  >
                    {joya.stock_actual === 0 ? 'Sin Stock' : 'Agregar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="carrito-section">
          <h2>Carrito ({carrito.length} productos)</h2>
          
          {carrito.length === 0 ? (
            <div className="carrito-vacio">
              <p>El carrito está vacío</p>
              <p>Busca productos para agregar a la venta</p>
            </div>
          ) : (
            <>
              <div className="carrito-items">
                {carrito.map(item => (
                  <div key={item.id} className="carrito-item">
                    <div className="item-info">
                      <strong>{item.codigo}</strong>
                      <div>{item.nombre}</div>
                      <small>Stock disponible: {item.stock_disponible}</small>
                    </div>
                    <div className="item-cantidad">
                      <button 
                        onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                        className="btn-cantidad"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.cantidad}
                        onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 0)}
                        className="input-cantidad"
                        min="1"
                        max={item.stock_disponible}
                      />
                      <button 
                        onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        className="btn-cantidad"
                      >
                        +
                      </button>
                    </div>
                    <div className="item-precio">
                      {item.moneda === 'USD' ? '$' : '₡'}
                      {(item.precio_unitario * item.cantidad).toFixed(2)}
                    </div>
                    <button 
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="btn-eliminar"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="carrito-resumen">
                <div className="resumen-linea">
                  <span>Subtotal:</span>
                  <span>₡{calcularSubtotal().toFixed(2)}</span>
                </div>
                <div className="resumen-linea">
                  <span>Descuento:</span>
                  <input
                    type="number"
                    value={descuento}
                    onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                    className="input-descuento"
                    min="0"
                    max={calcularSubtotal()}
                    step="0.01"
                  />
                </div>
                <div className="resumen-linea total">
                  <span>Total:</span>
                  <span>₡{calcularTotal().toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="btn-continuar"
              >
                {mostrarFormulario ? 'Cancelar' : 'Continuar con el Pago'}
              </button>

              {mostrarFormulario && (
                <form onSubmit={procesarVenta} className="pago-form">
                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select 
                      value={metodoPago} 
                      onChange={(e) => setMetodoPago(e.target.value)}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>

                  {metodoPago === 'Efectivo' && (
                    <>
                      <div className="form-group">
                        <label>Efectivo Recibido</label>
                        <input
                          type="number"
                          value={efectivoRecibido}
                          onChange={(e) => setEfectivoRecibido(e.target.value)}
                          step="0.01"
                          min={calcularTotal()}
                          required
                        />
                      </div>
                      {efectivoRecibido && (
                        <div className="cambio-info">
                          Cambio: ₡{calcularCambio().toFixed(2)}
                        </div>
                      )}
                    </>
                  )}

                  <div className="form-group">
                    <label>Notas (opcional)</label>
                    <textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      rows="3"
                      placeholder="Notas adicionales sobre la venta..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-procesar"
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : 'Procesar Venta'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Ventas;
