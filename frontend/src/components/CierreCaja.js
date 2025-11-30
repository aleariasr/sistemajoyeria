import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useReactToPrint } from 'react-to-print';
import TicketPrint from './TicketPrint';
import thermalPrinterService from '../services/thermalPrinterService';

function CierreCaja() {
  const [ventasDia, setVentasDia] = useState([]);
  const [abonosDia, setAbonosDia] = useState([]);
  const [ingresosExtras, setIngresosExtras] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const ticketRef = useRef();

  const handlePrintTicket = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Cierre-Caja-${new Date().toISOString().slice(0,10)}`,
  });

  const triggerPrintCierre = () => {
    if (!resumen) {
      alert('No hay resumen del día para imprimir.');
      return;
    }
    if (!ticketRef.current) {
      console.warn('TicketPrint aún no está listo para imprimir (ref vacío).');
      // intentar esperar un ciclo de render
      setTimeout(() => {
        if (ticketRef.current) {
          handlePrintTicket();
        } else {
          alert('No se pudo preparar el contenido de impresión. Inténtalo de nuevo.');
        }
      }, 200);
      return;
    }
    try {
      handlePrintTicket();
    } catch (e) {
      console.warn('Fallo al invocar react-to-print, usando window.print()', e);
      window.print();
    }
  };

  const printCierreUSB = async () => {
    try {
      if (!thermalPrinterService.isWebUSBSupported()) {
        alert('Tu navegador no soporta WebUSB. Usa la impresión del navegador.');
        return;
      }
      // Conectar si no está conectado
      if (!thermalPrinterService.isConnected) {
        await thermalPrinterService.connect();
      }
      const ventaCierre = {
        id: resumen?.id_cierre,
        usuario: resumen?.usuario,
        fecha_venta: new Date(),
        resumen,
        notas: 'Cierre de caja diario'
      };
      await thermalPrinterService.printTicket(ventaCierre, [], 'cierre');
    } catch (err) {
      console.error('Error imprimiendo por USB:', err);
      alert(err.message || 'Error al imprimir por USB');
    }
  };

  useEffect(() => {
    cargarVentasDia();
  }, []);

  const cargarVentasDia = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/cierrecaja/resumen-dia');
      setVentasDia(response.data.ventas);
      setAbonosDia(response.data.abonos || []);
      setIngresosExtras(response.data.ingresos_extras || []);
      setResumen(response.data.resumen);
    } catch (err) {
      setError('Error al cargar ventas del día');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  

  const realizarCierre = async () => {
    if (ventasDia.length === 0 && abonosDia.length === 0 && ingresosExtras.length === 0) {
      setError('No hay ventas, abonos ni ingresos extras para cerrar');
      return;
    }

    if (!window.confirm('¿Está seguro que desea realizar el cierre de caja? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setProcesando(true);
      setError(null);
      const response = await api.post('/cierrecaja/cerrar-caja');
      
      alert(`Cierre realizado exitosamente.\n\nVentas transferidas: ${response.data.resumen.total_ventas}\nAbonos cerrados: ${response.data.resumen.total_abonos_cerrados}\nIngresos extras cerrados: ${response.data.resumen.total_ingresos_extras_cerrados}\nTotal: ${formatearMoneda(response.data.resumen.total_general)}`);
      
      // Recargar datos
      await cargarVentasDia();
      // Intentar imprimir ticket automático
      try {
        setResumen(response.data.resumen);
        setTimeout(() => triggerPrintCierre(), 300);
      } catch (e) {
        console.warn('No se pudo imprimir el ticket de cierre automáticamente:', e);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al realizar el cierre de caja');
      console.error(err);
    } finally {
      setProcesando(false);
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
      timeZone: 'America/Costa_Rica',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Separar ventas por método de pago
  const ventasEfectivo = ventasDia.filter(v => v.metodo_pago === 'Efectivo');
  const ventasTransferencia = ventasDia.filter(v => v.metodo_pago === 'Transferencia');
  const ventasTarjeta = ventasDia.filter(v => v.metodo_pago === 'Tarjeta');
  const ventasMixto = ventasDia.filter(v => v.metodo_pago === 'Mixto');

  return (
    <div>
      <div className="page-header">
        <h2>Cierre de Caja</h2>
        <p>Gestión de ventas del día y cierre de caja (solo ventas de contado)</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando ventas del día...</p>
        </div>
      ) : (
        <>
          {/* Resumen General */}
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Total Ventas Contado</h4>
              <div className="value">{resumen?.total_ventas || 0}</div>
              <small>Solo ventas al contado</small>
            </div>
            
            <div className="stat-card success">
              <h4>Efectivo en Caja</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_efectivo_combinado || 0)}
              </div>
              <small>
                Ventas: {formatearMoneda(resumen?.total_efectivo_final || 0)} | 
                Abonos: {formatearMoneda(resumen?.monto_abonos_efectivo || 0)}
              </small>
            </div>
            
            <div className="stat-card info">
              <h4>Transferencias</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_transferencia_combinado || 0)}
              </div>
              <small>
                Ventas: {formatearMoneda(resumen?.total_transferencia_final || 0)} | 
                Abonos: {formatearMoneda(resumen?.monto_abonos_transferencia || 0)}
              </small>
            </div>

            <div className="stat-card warning">
              <h4>Tarjeta</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_tarjeta_combinado || 0)}
              </div>
              <small>
                Ventas: {formatearMoneda(resumen?.total_tarjeta_final || 0)} | 
                Abonos: {formatearMoneda(resumen?.monto_abonos_tarjeta || 0)}
              </small>
            </div>

            <div className="stat-card primary">
              <h4>Total Ingresos del Día</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_ingresos_combinado || 0)}
              </div>
              <small>Ventas: {formatearMoneda(resumen?.total_ingresos || 0)} + Abonos: {formatearMoneda(resumen?.monto_total_abonos || 0)}</small>
            </div>
          </div>

          {ventasDia.length === 0 && abonosDia.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📭</p>
                <p style={{ fontSize: '1.2rem' }}>No hay ventas ni abonos registrados hoy</p>
                <p style={{ marginTop: '10px' }}>Las ventas del día aparecerán aquí</p>
              </div>
            </div>
          ) : (
            <>
              {/* Ventas en Efectivo */}
              {ventasEfectivo.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <h3>💵 Ventas en Efectivo</h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Fecha</th>
                          <th>Subtotal</th>
                          <th>Descuento</th>
                          <th>Total</th>
                          <th>Efectivo Recibido</th>
                          <th>Cambio</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventasEfectivo.map((venta) => (
                          <tr key={venta.id}>
                            <td><strong>{venta.id}</strong></td>
                            <td>{formatearFecha(venta.fecha_venta)}</td>
                            <td>{formatearMoneda(venta.subtotal)}</td>
                            <td>{formatearMoneda(venta.descuento)}</td>
                            <td><strong>{formatearMoneda(venta.total)}</strong></td>
                            <td>{formatearMoneda(venta.efectivo_recibido)}</td>
                            <td>{formatearMoneda(venta.cambio)}</td>
                            <td>{venta.notas || '-'}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total Efectivo:</strong></td>
                          <td colSpan="4"><strong>{formatearMoneda(resumen?.total_efectivo || 0)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ventas con Transferencia */}
              {ventasTransferencia.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <h3>💳 Ventas con Transferencia</h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Fecha</th>
                          <th>Subtotal</th>
                          <th>Descuento</th>
                          <th>Total</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventasTransferencia.map((venta) => (
                          <tr key={venta.id}>
                            <td><strong>{venta.id}</strong></td>
                            <td>{formatearFecha(venta.fecha_venta)}</td>
                            <td>{formatearMoneda(venta.subtotal)}</td>
                            <td>{formatearMoneda(venta.descuento)}</td>
                            <td><strong>{formatearMoneda(venta.total)}</strong></td>
                            <td>{venta.notas || '-'}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total Transferencia:</strong></td>
                          <td colSpan="2"><strong>{formatearMoneda(resumen?.total_transferencia || 0)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ventas con Tarjeta */}
              {ventasTarjeta.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <h3>💳 Ventas con Tarjeta</h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Fecha</th>
                          <th>Subtotal</th>
                          <th>Descuento</th>
                          <th>Total</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventasTarjeta.map((venta) => (
                          <tr key={venta.id}>
                            <td><strong>{venta.id}</strong></td>
                            <td>{formatearFecha(venta.fecha_venta)}</td>
                            <td>{formatearMoneda(venta.subtotal)}</td>
                            <td>{formatearMoneda(venta.descuento)}</td>
                            <td><strong>{formatearMoneda(venta.total)}</strong></td>
                            <td>{venta.notas || '-'}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="4" style={{ textAlign: 'right' }}><strong>Total Tarjeta:</strong></td>
                          <td colSpan="2"><strong>{formatearMoneda(resumen?.total_tarjeta || 0)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ventas con Pago Mixto */}
              {ventasMixto.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <h3>💰 Ventas con Pago Mixto</h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Fecha</th>
                          <th>Total</th>
                          <th>Efectivo</th>
                          <th>Tarjeta</th>
                          <th>Transferencia</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventasMixto.map((venta) => (
                          <tr key={venta.id}>
                            <td><strong>{venta.id}</strong></td>
                            <td>{formatearFecha(venta.fecha_venta)}</td>
                            <td><strong>{formatearMoneda(venta.total)}</strong></td>
                            <td>{formatearMoneda(venta.monto_efectivo || 0)}</td>
                            <td>{formatearMoneda(venta.monto_tarjeta || 0)}</td>
                            <td>{formatearMoneda(venta.monto_transferencia || 0)}</td>
                            <td>{venta.notas || '-'}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="2" style={{ textAlign: 'right' }}><strong>Totales:</strong></td>
                          <td><strong>{formatearMoneda(ventasMixto.reduce((sum, v) => sum + v.total, 0))}</strong></td>
                          <td><strong>{formatearMoneda(ventasMixto.reduce((sum, v) => sum + (v.monto_efectivo || 0), 0))}</strong></td>
                          <td><strong>{formatearMoneda(ventasMixto.reduce((sum, v) => sum + (v.monto_tarjeta || 0), 0))}</strong></td>
                          <td colSpan="2"><strong>{formatearMoneda(ventasMixto.reduce((sum, v) => sum + (v.monto_transferencia || 0), 0))}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Abonos del Día */}
              {abonosDia.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <h3>💰 Abonos a Cuentas por Cobrar del Día</h3>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cliente</th>
                          <th>Monto</th>
                          <th>Método de Pago</th>
                          <th>Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abonosDia.map((abono) => (
                          <tr key={abono.id}>
                            <td>{formatearFecha(abono.fecha_abono)}</td>
                            <td>{abono.nombre_cliente || 'N/A'}</td>
                            <td><strong>{formatearMoneda(abono.monto)}</strong></td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                backgroundColor: 
                                  abono.metodo_pago === 'Efectivo' ? '#d4edda' :
                                  abono.metodo_pago === 'Tarjeta' ? '#fff3cd' : '#cfe2ff',
                                color: '#000'
                              }}>
                                {abono.metodo_pago}
                              </span>
                            </td>
                            <td>{abono.notas || '-'}</td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="2" style={{ textAlign: 'right' }}><strong>Total Abonos:</strong></td>
                          <td colSpan="3"><strong>{formatearMoneda(resumen?.monto_total_abonos || 0)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ingresos Extras del Día */}
              {ingresosExtras.length > 0 && (
                <div className="card" style={{ marginTop: '20px' }}>
                  <div className="card-header">
                    <h3>💵 Ingresos Extras del Día ({ingresosExtras.length})</h3>
                  </div>
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
                        </tr>
                      </thead>
                      <tbody>
                        {ingresosExtras.map((ingreso) => (
                          <tr key={ingreso.id}>
                            <td><strong>{ingreso.id}</strong></td>
                            <td>{formatearFecha(ingreso.fecha_ingreso)}</td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                backgroundColor:
                                  ingreso.tipo === 'Fondo de Caja' ? '#d4edda' :
                                  ingreso.tipo === 'Prestamo' ? '#fff3cd' :
                                  ingreso.tipo === 'Devolucion' ? '#d1ecf1' : '#e9ecef',
                                color: '#000'
                              }}>
                                {ingreso.tipo}
                              </span>
                            </td>
                            <td>{ingreso.descripcion}</td>
                            <td>{ingreso.metodo_pago}</td>
                            <td><strong>{formatearMoneda(ingreso.monto)}</strong></td>
                          </tr>
                        ))}
                        <tr className="total-row">
                          <td colSpan="5" style={{ textAlign: 'right' }}><strong>Total Ingresos Extras:</strong></td>
                          <td><strong>{formatearMoneda(resumen?.monto_total_ingresos_extras || 0)}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Botón de Cierre */}
              <div className="card" style={{ marginTop: '20px' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: '1.2rem', padding: '15px 40px' }}
                    onClick={realizarCierre}
                    disabled={procesando || (ventasDia.length === 0 && abonosDia.length === 0 && ingresosExtras.length === 0)}
                  >
                    {procesando ? '🔄 Procesando...' : '🔒 Realizar Cierre de Caja'}
                  </button>
                  <div style={{ marginTop: '12px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={triggerPrintCierre}
                      disabled={!resumen}
                      title="Abre el diálogo de impresión de Windows (puede guardar como PDF)"
                    >
                      🖨️ Imprimir / Guardar PDF
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={printCierreUSB}
                      disabled={!resumen}
                      style={{ marginLeft: '10px' }}
                      title="Imprime directamente en impresora térmica POS80 vía USB"
                    >
                      🔌 Impresora Térmica USB
                    </button>
                  </div>
                  <p style={{ marginTop: '10px', color: '#888', fontSize: '0.85rem' }}>
                    💡 Use "Imprimir / Guardar PDF" para abrir el diálogo de Windows donde puede seleccionar guardar como PDF
                  </p>
                  <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>
                    Al realizar el cierre, todas las ventas del día, abonos e ingresos extras se transferirán a la base de datos principal
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Contenido oculto siempre montado para impresión de ticket de cierre */}
      <div style={{ position: 'absolute', left: -9999, top: -9999 }}>
        <TicketPrint
          ref={ticketRef}
          tipo="cierre"
          venta={{
            id: resumen?.id_cierre,
            usuario: resumen?.usuario,
            fecha_venta: new Date(),
            resumen,
            notas: resumen ? 'Cierre de caja diario' : 'Preparando cierre'
          }}
        />
      </div>
    </div>
  );
}

export default CierreCaja;
