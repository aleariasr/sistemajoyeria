import React, { useState, useEffect } from 'react';
import api from '../services/api';

function CierreCaja() {
  const [ventasDia, setVentasDia] = useState([]);
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
      setResumen(response.data.resumen);
    } catch (err) {
      setError('Error al cargar ventas del día');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const realizarCierre = async () => {
    if (ventasDia.length === 0) {
      setError('No hay ventas para cerrar');
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

  return (
    <div>
      <div className="page-header">
        <h2>Cierre de Caja</h2>
        <p>Gestión de ventas del día y cierre de caja</p>
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
              <h4>Total Ventas</h4>
              <div className="value">{resumen?.total_ventas || 0}</div>
            </div>
            
            <div className="stat-card success">
              <h4>Efectivo en Caja</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_efectivo || 0)}
              </div>
              <small>{resumen?.ventas_efectivo || 0} ventas</small>
            </div>
            
            <div className="stat-card info">
              <h4>Transferencias</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_transferencia || 0)}
              </div>
              <small>{resumen?.ventas_transferencia || 0} ventas</small>
            </div>

            <div className="stat-card primary">
              <h4>Total Ingresos</h4>
              <div className="value" style={{ fontSize: '1.5rem' }}>
                {formatearMoneda(resumen?.total_ingresos || 0)}
              </div>
            </div>
          </div>

          {ventasDia.length === 0 ? (
            <div className="card">
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📭</p>
                <p style={{ fontSize: '1.2rem' }}>No hay ventas registradas hoy</p>
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

              {/* Botón de Cierre */}
              <div className="card" style={{ marginTop: '20px' }}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: '1.2rem', padding: '15px 40px' }}
                    onClick={realizarCierre}
                    disabled={procesando || ventasDia.length === 0}
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
