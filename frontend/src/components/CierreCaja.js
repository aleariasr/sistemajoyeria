import React, { useState, useEffect } from 'react';
import api from '../services/api';

function CierreCaja() {
  const [ventasDia, setVentasDia] = useState([]);
  const [abonosDia, setAbonosDia] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(false);

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
      setResumen(response.data.resumen);
    } catch (err) {
      setError('Error al cargar ventas del día');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const realizarCierre = async () => {
    if (ventasDia.length === 0 && abonosDia.length === 0) {
      setError('No hay ventas ni abonos para cerrar');
      return;
    }

    if (!window.confirm('¿Está seguro que desea realizar el cierre de caja? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setProcesando(true);
      setError(null);
      const response = await api.post('/cierrecaja/cerrar-caja');
      
      alert(`Cierre realizado exitosamente.\n\nVentas transferidas: ${response.data.resumen.total_ventas}\nTotal: ${formatearMoneda(response.data.resumen.total_ingresos)}`);
      
      // Recargar datos
      await cargarVentasDia();
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
                {formatearMoneda(resumen?.total_efectivo_combinado || resumen?.total_efectivo_final || resumen?.total_efectivo || 0)}
              </div>
              <small>
                Ventas: {resumen?.ventas_efectivo || 0}
                {resumen?.ventas_mixto > 0 && ` + ${resumen?.ventas_mixto} mixtas`} | Abonos: {resumen?.abonos_efectivo || 0}
              </small>
            </div>
            
            <div className="stat-card info">
              <h4>Transferencias</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_transferencia_combinado || resumen?.total_transferencia_final || resumen?.total_transferencia || 0)}
              </div>
              <small>
                Ventas: {resumen?.ventas_transferencia || 0}
                {resumen?.total_transferencia_mixto > 0 && ' + mixtas'} | Abonos: {resumen?.abonos_transferencia || 0}
              </small>
            </div>

            <div className="stat-card warning">
              <h4>Tarjeta</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_tarjeta_combinado || resumen?.total_tarjeta_final || resumen?.total_tarjeta || 0)}
              </div>
              <small>
                Ventas: {resumen?.ventas_tarjeta || 0}
                {resumen?.total_tarjeta_mixto > 0 && ' + mixtas'} | Abonos: {resumen?.abonos_tarjeta || 0}
              </small>
            </div>

            <div className="stat-card primary">
              <h4>Total Ingresos del Día</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_ingresos_combinado || resumen?.total_ingresos || 0)}
              </div>
              <small>Ventas + Abonos</small>
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

              {/* Botón de Cierre */}
              <div className="card" style={{ marginTop: '20px' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: '1.2rem', padding: '15px 40px' }}
                    onClick={realizarCierre}
                    disabled={procesando || (ventasDia.length === 0 && abonosDia.length === 0)}
                  >
                    {procesando ? '🔄 Procesando...' : '🔒 Realizar Cierre de Caja'}
                  </button>
                  <p style={{ marginTop: '15px', color: '#666', fontSize: '0.9rem' }}>
                    Al realizar el cierre, todas las ventas del día se transferirán a la base de datos principal
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default CierreCaja;
