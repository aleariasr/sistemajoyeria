import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { buscarClientes } from '../services/api';
import { useReactToPrint } from 'react-to-print';
import TicketPrint, { useThermalPrint } from './TicketPrint';
import '../styles/Ventas.css';

function Ventas() {
  const { user } = useAuth();
  const [joyas, setJoyas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [tipoVenta, setTipoVenta] = useState('Contado');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [descuento, setDescuento] = useState(0);
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const joyasRequestIdRef = useRef(0);
  
  // Estados para pago mixto
  const [montoEfectivo, setMontoEfectivo] = useState('');
  const [montoTarjeta, setMontoTarjeta] = useState('');
  const [montoTransferencia, setMontoTransferencia] = useState('');
  
  // Estados para impresión de ticket
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [ultimosItems, setUltimosItems] = useState([]);
  const ticketRef = useRef();
  
  // Hook para impresión térmica (3nstar RPT008)
  const thermalPrint = useThermalPrint();

  const buscarJoyas = useCallback(async () => {
    const requestId = ++joyasRequestIdRef.current;
    const q = busqueda.trim();
    if (q.length < 2) {
      setJoyas([]);
      return;
    }
    try {
      const response = await api.get('/joyas', {
        params: { busqueda: q, estado: 'Activo', por_pagina: 20 }
      });
      if (requestId !== joyasRequestIdRef.current) {
        return; // Hay una búsqueda más reciente en curso
      }

      const lista = response.data.joyas || [];
      const lowerQ = q.toLowerCase();
      const exact = lista.find(j => j.codigo?.toLowerCase() === lowerQ);
      if (exact) {
        setJoyas([exact]);
        return;
      }

      const filtrada = lista.filter(j => {
        const c = (j.codigo || '').toLowerCase();
        const n = (j.nombre || '').toLowerCase();
        const cat = (j.categoria || '').toLowerCase();
        return c.includes(lowerQ) || n.includes(lowerQ) || cat.includes(lowerQ);
      }).slice(0, 10);
      setJoyas(filtrada);
    } catch (error) {
      if (requestId !== joyasRequestIdRef.current) {
        return;
      }
      console.error('Error al buscar joyas:', error);
      setJoyas([]);
    }
  }, [busqueda]);

  const buscarClientesFunc = useCallback(async () => {
    if (busquedaCliente.length < 2) {
      setClientesEncontrados([]);
      return;
    }
    try {
      const response = await buscarClientes(busquedaCliente);
      setClientesEncontrados(response.data || []);
    } catch (error) {
      console.error('Error al buscar clientes:', error);
    }
  }, [busquedaCliente]);

  useEffect(() => {
    buscarJoyas();
  }, [busqueda, buscarJoyas]);

  useEffect(() => {
    buscarClientesFunc();
  }, [busquedaCliente, buscarClientesFunc]);

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente('');
    setClientesEncontrados([]);
  };

  const limpiarCliente = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente('');
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
    
    // Limpiar resultados tras agregar; si se escaneó un código, esto evita listados
    setBusqueda('');
    setJoyas([]);
  };

  const agregarOtroItem = () => {
    const monto = parseFloat(busqueda.trim());
    if (isNaN(monto) || monto <= 0) {
      setMensaje({ tipo: 'error', texto: 'Debe ingresar un monto válido' });
      setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
      return;
    }

    // Generar un ID temporal único para el item "Otros"
    const idTemporal = `otros-${Date.now()}`;

    setCarrito([...carrito, {
      id: idTemporal,
      id_joya: null, // Sin referencia a joya
      codigo: null,
      nombre: 'Otros',
      descripcion_item: 'Otros',
      precio_unitario: monto,
      cantidad: 1,
      stock_disponible: null, // Sin stock, es un item especial
      moneda: 'CRC'
    }]);

    setBusqueda('');
    setJoyas([]);
    setMensaje({ tipo: 'success', texto: `Item "Otros" agregado por ₡${monto.toFixed(2)}` });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
  };

  const esMontoValido = () => {
    const valor = busqueda.trim();
    if (valor === '' || joyas.length > 0) return false;
    const monto = parseFloat(valor);
    return !isNaN(monto) && monto > 0;
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    const item = carrito.find(i => i.id === id);
    
    // Si el item tiene stock_disponible (no es "Otros"), validar el stock
    if (item.stock_disponible !== null && nuevaCantidad > item.stock_disponible) {
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
    if (metodoPago === 'Mixto' && efectivoRecibido && montoEfectivo) {
      const cambio = parseFloat(efectivoRecibido) - parseFloat(montoEfectivo || 0);
      return cambio >= 0 ? cambio : 0;
    }
    return 0;
  };
  
  const calcularTotalMixto = () => {
    return (parseFloat(montoEfectivo) || 0) + (parseFloat(montoTarjeta) || 0) + (parseFloat(montoTransferencia) || 0);
  };
  
  const calcularMontoRestante = () => {
    const total = calcularTotal();
    const pagado = calcularTotalMixto();
    return total - pagado;
  };

  // Manejador de impresión por navegador (fallback)
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket-Venta-${ultimaVenta?.id || 'N/A'}`,
  });

  // Imprimir con impresora térmica USB (3nstar RPT008)
  const imprimirTermico = async () => {
    if (!ultimaVenta || !ultimosItems) return;
    
    const success = await thermalPrint.printTicket(ultimaVenta, ultimosItems, 'venta');
    if (success) {
      setMensaje({ 
        tipo: 'success', 
        texto: `Ticket #${ultimaVenta.id} impreso correctamente en impresora térmica` 
      });
    } else {
      // Si falla la impresión térmica, usar fallback del navegador
      const errorMessage = thermalPrint.error 
        ? `Error: ${thermalPrint.error}` 
        : 'Impresora térmica no disponible';
      setMensaje({ 
        tipo: 'info', 
        texto: `Usando diálogo de impresión del navegador. ${errorMessage}` 
      });
      handlePrint();
    }
  };

  // Función principal de impresión
  const imprimirTicket = () => {
    // Si WebUSB está soportado, intentar impresión térmica
    if (thermalPrint.isSupported) {
      imprimirTermico();
    } else {
      // Fallback a impresión del navegador
      handlePrint();
    }
  };

  const procesarVenta = async (e) => {
    e.preventDefault();
    
    if (carrito.length === 0) {
      setMensaje({ tipo: 'error', texto: 'El carrito está vacío' });
      return;
    }

    if (tipoVenta === 'Credito' && !clienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Debe seleccionar un cliente para venta a crédito' });
      return;
    }

    if (metodoPago === 'Efectivo' && tipoVenta === 'Contado' && parseFloat(efectivoRecibido) < calcularTotal()) {
      setMensaje({ tipo: 'error', texto: 'El efectivo recibido es insuficiente' });
      return;
    }
    
    if (metodoPago === 'Mixto') {
      const totalMixto = calcularTotalMixto();
      const total = calcularTotal();
      if (Math.abs(totalMixto - total) > 0.01) {
        setMensaje({ tipo: 'error', texto: `El total del pago mixto (${totalMixto.toFixed(2)}) debe ser igual al total (${total.toFixed(2)})` });
        return;
      }
      
      if (montoEfectivo && parseFloat(efectivoRecibido) < parseFloat(montoEfectivo)) {
        setMensaje({ tipo: 'error', texto: 'El efectivo recibido es insuficiente para cubrir el monto en efectivo' });
        return;
      }
    }

    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const ventaData = {
        items: carrito,
        metodo_pago: metodoPago,
        descuento: descuento,
        efectivo_recibido: (metodoPago === 'Efectivo' || metodoPago === 'Mixto') && tipoVenta === 'Contado' ? parseFloat(efectivoRecibido) : null,
        notas: notas,
        tipo_venta: tipoVenta,
        id_cliente: tipoVenta === 'Credito' ? clienteSeleccionado.id : null,
        fecha_vencimiento: tipoVenta === 'Credito' && fechaVencimiento ? fechaVencimiento : null,
        monto_efectivo: metodoPago === 'Mixto' ? parseFloat(montoEfectivo) || 0 : 0,
        monto_tarjeta: metodoPago === 'Mixto' ? parseFloat(montoTarjeta) || 0 : 0,
        monto_transferencia: metodoPago === 'Mixto' ? parseFloat(montoTransferencia) || 0 : 0
      };

      const response = await api.post('/ventas', ventaData);
      
      // Guardar items antes de limpiar el carrito
      setUltimosItems([...carrito]);
      
      // Preparar datos para el ticket
      const ventaParaTicket = {
        id: response.data.id,
        fecha_venta: new Date(),
        tipo_venta: tipoVenta,
        metodo_pago: metodoPago,
        subtotal: calcularSubtotal(),
        descuento: descuento,
        total: response.data.total,
        efectivo_recibido: ventaData.efectivo_recibido,
        cambio: response.data.cambio,
        monto_efectivo: ventaData.monto_efectivo,
        monto_tarjeta: ventaData.monto_tarjeta,
        monto_transferencia: ventaData.monto_transferencia,
        notas: notas,
        nombre_usuario: user?.full_name,
        usuario: user?.username,
        nombre_cliente: clienteSeleccionado?.nombre
      };
      
      setUltimaVenta(ventaParaTicket);
      
      let mensajeTexto = `Venta #${response.data.id} realizada exitosamente. Total: ${calcularTotal().toFixed(2)}`;
      if (tipoVenta === 'Credito') {
        mensajeTexto += ` - Cuenta por cobrar creada para ${clienteSeleccionado.nombre}`;
      }
      
      setMensaje({ 
        tipo: 'success', 
        texto: mensajeTexto
      });
      
      // Limpiar formulario
      setCarrito([]);
      setDescuento(0);
      setEfectivoRecibido('');
      setNotas('');
      setMetodoPago('Efectivo');
      setTipoVenta('Contado');
      setClienteSeleccionado(null);
      setFechaVencimiento('');
      setMostrarFormulario(false);
      setMontoEfectivo('');
      setMontoTarjeta('');
      setMontoTransferencia('');
      
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
          {mensaje.tipo === 'success' && ultimaVenta && (
            <div style={{ display: 'inline-flex', gap: '10px', marginLeft: '15px' }}>
              <button 
                onClick={imprimirTicket}
                className="btn-imprimir-ticket"
                disabled={thermalPrint.isPrinting}
              >
                🖨️ {thermalPrint.isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket'}
              </button>
              {/* Botón alternativo para impresión por navegador */}
              {thermalPrint.isSupported && (
                <button 
                  onClick={handlePrint}
                  className="btn-imprimir-ticket"
                  style={{ backgroundColor: '#6c757d' }}
                  title="Usar diálogo de impresión del navegador"
                >
                  📄 Navegador
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="ventas-content">
        <div className="busqueda-section">
          <h2>Buscar Producto</h2>
          <div className="busqueda-input-container">
            <input
              type="text"
              placeholder="Buscar por código, nombre, categoría o monto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="busqueda-input"
            />
            {esMontoValido() && (
              <button 
                onClick={agregarOtroItem}
                className="btn-agregar-otro"
                style={{
                  marginLeft: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                ➕ Agregar Otro (₡{parseFloat(busqueda).toFixed(2)})
              </button>
            )}
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
                      <strong>{item.codigo || 'N/A'}</strong>
                      <div>{item.nombre}</div>
                      {item.stock_disponible !== null && (
                        <small>Stock disponible: {item.stock_disponible}</small>
                      )}
                      {item.stock_disponible === null && (
                        <small style={{ color: '#6c757d', fontStyle: 'italic' }}>Item especial</small>
                      )}
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
                        max={item.stock_disponible || 999}
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
                    <label>Tipo de Venta</label>
                    <select 
                      value={tipoVenta} 
                      onChange={(e) => {
                        setTipoVenta(e.target.value);
                        if (e.target.value === 'Contado') {
                          setClienteSeleccionado(null);
                          setFechaVencimiento('');
                        }
                      }}
                      required
                    >
                      <option value="Contado">Contado</option>
                      <option value="Credito">Crédito</option>
                    </select>
                  </div>

                  {tipoVenta === 'Credito' && (
                    <div className="credito-section">
                      <div className="form-group">
                        <label>Cliente *</label>
                        {clienteSeleccionado ? (
                          <div className="cliente-seleccionado">
                            <div>
                              <strong>{clienteSeleccionado.nombre}</strong>
                              <br />
                              <small>Cédula: {clienteSeleccionado.cedula} | Tel: {clienteSeleccionado.telefono}</small>
                            </div>
                            <button 
                              type="button"
                              onClick={limpiarCliente}
                              className="btn-limpiar-cliente"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={busquedaCliente}
                              onChange={(e) => setBusquedaCliente(e.target.value)}
                              placeholder="Buscar cliente por nombre, cédula o teléfono..."
                            />
                            {clientesEncontrados.length > 0 && (
                              <div className="clientes-encontrados">
                                {clientesEncontrados.map(cliente => (
                                  <div 
                                    key={cliente.id}
                                    className="cliente-item"
                                    onClick={() => seleccionarCliente(cliente)}
                                  >
                                    <strong>{cliente.nombre}</strong>
                                    <br />
                                    <small>Cédula: {cliente.cedula} | Tel: {cliente.telefono}</small>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Fecha de Vencimiento (opcional)</label>
                        <input
                          type="date"
                          value={fechaVencimiento}
                          onChange={(e) => setFechaVencimiento(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Método de Pago</label>
                    <select 
                      value={metodoPago} 
                      onChange={(e) => {
                        setMetodoPago(e.target.value);
                        // Limpiar campos al cambiar método de pago
                        if (e.target.value !== 'Mixto') {
                          setMontoEfectivo('');
                          setMontoTarjeta('');
                          setMontoTransferencia('');
                        }
                        if (e.target.value !== 'Efectivo' && e.target.value !== 'Mixto') {
                          setEfectivoRecibido('');
                        }
                      }}
                      required
                    >
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Mixto">Mixto (Efectivo + Tarjeta/Transferencia)</option>
                    </select>
                  </div>

                  {metodoPago === 'Mixto' && tipoVenta === 'Contado' && (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                      <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>💰 Desglose de Pago Mixto</h4>
                      
                      <div className="form-group">
                        <label>Monto en Efectivo</label>
                        <input
                          type="number"
                          value={montoEfectivo}
                          onChange={(e) => {
                            const valor = parseFloat(e.target.value) || 0;
                            setMontoEfectivo(e.target.value);
                            // Auto-calcular el resto en tarjeta si hay tarjeta y no hay transferencia
                            if (!montoTransferencia || parseFloat(montoTransferencia) === 0) {
                              const resto = calcularTotal() - valor;
                              if (resto > 0) {
                                setMontoTarjeta(resto.toFixed(2));
                              }
                            }
                          }}
                          step="0.01"
                          min="0"
                          max={calcularTotal()}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Monto en Tarjeta</label>
                        <input
                          type="number"
                          value={montoTarjeta}
                          onChange={(e) => {
                            setMontoTarjeta(e.target.value);
                          }}
                          step="0.01"
                          min="0"
                          max={calcularTotal()}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Monto en Transferencia</label>
                        <input
                          type="number"
                          value={montoTransferencia}
                          onChange={(e) => {
                            setMontoTransferencia(e.target.value);
                          }}
                          step="0.01"
                          min="0"
                          max={calcularTotal()}
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div style={{ 
                        padding: '10px', 
                        backgroundColor: calcularMontoRestante() === 0 ? '#d4edda' : '#fff3cd', 
                        borderRadius: '4px',
                        marginTop: '10px'
                      }}>
                        <strong>Total del pago mixto:</strong> ₡{calcularTotalMixto().toFixed(2)}<br />
                        <strong>Total de la venta:</strong> ₡{calcularTotal().toFixed(2)}<br />
                        <strong style={{ color: calcularMontoRestante() === 0 ? '#155724' : '#856404' }}>
                          {calcularMontoRestante() === 0 
                            ? '✓ Monto completo' 
                            : `Restante: ₡${calcularMontoRestante().toFixed(2)}`
                          }
                        </strong>
                      </div>
                      
                      {montoEfectivo && parseFloat(montoEfectivo) > 0 && (
                        <div className="form-group" style={{ marginTop: '15px' }}>
                          <label>Efectivo Recibido</label>
                          <input
                            type="number"
                            value={efectivoRecibido}
                            onChange={(e) => setEfectivoRecibido(e.target.value)}
                            step="0.01"
                            min={montoEfectivo}
                            required
                            placeholder={`Mínimo: ${montoEfectivo}`}
                          />
                          {efectivoRecibido && (
                            <div className="cambio-info">
                              Cambio: ₡{calcularCambio().toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {metodoPago === 'Efectivo' && tipoVenta === 'Contado' && (
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
                    {loading ? 'Procesando...' : tipoVenta === 'Credito' ? 'Procesar Venta a Crédito' : 'Procesar Venta'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Componente de ticket oculto para impresión */}
      {ultimaVenta && (
        <div style={{ display: 'none' }}>
          <TicketPrint 
            ref={ticketRef} 
            venta={ultimaVenta} 
            items={ultimosItems}
            tipo="venta"
          />
        </div>
      )}
    </div>
  );
}

export default Ventas;
