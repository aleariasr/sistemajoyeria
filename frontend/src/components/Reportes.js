import React, { useState, useEffect, useCallback } from 'react';
import { 
  obtenerReporteInventario, 
  obtenerReporteStockBajo, 
  obtenerReporteVentas, 
  obtenerReporteCierresCaja 
} from '../services/api';
import { 
  exportInventarioToExcel, 
  exportVentasToExcel, 
  exportCierresCajaToExcel,
  exportStockBajoToExcel 
} from '../utils/excelExport';

function Reportes() {
  const [reporteActivo, setReporteActivo] = useState('inventario');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: ''
  });

  const cargarReporte = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (reporteActivo === 'inventario') {
        response = await obtenerReporteInventario();
      } else if (reporteActivo === 'stock-bajo') {
        response = await obtenerReporteStockBajo();
      } else if (reporteActivo === 'ventas') {
        response = await obtenerReporteVentas(filtros);
      } else if (reporteActivo === 'cierres-caja') {
        response = await obtenerReporteCierresCaja(filtros);
      }
      
      setDatos(response.data);
    } catch (err) {
      setError('Error al cargar el reporte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reporteActivo, filtros]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const formatearMoneda = (valor, moneda = 'CRC') => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'CRC',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportarExcel = async () => {
    try {
      if (datos.length === 0) return;
      
      if (reporteActivo === 'inventario') {
        await exportInventarioToExcel(datos);
      } else if (reporteActivo === 'ventas') {
        await exportVentasToExcel(datos);
      } else if (reporteActivo === 'cierres-caja') {
        await exportCierresCajaToExcel(datos);
      } else if (reporteActivo === 'stock-bajo') {
        await exportStockBajoToExcel(datos);
      }
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al exportar a Excel: ' + err.message);
    }
  };

  const calcularTotales = () => {
    if (reporteActivo === 'inventario') {
      const totalUnidades = datos.reduce((sum, item) => sum + item.stock_actual, 0);
      const valorTotalCosto = datos.reduce((sum, item) => sum + item.valor_total_costo, 0);
      const valorTotalVenta = datos.reduce((sum, item) => sum + item.valor_total_venta, 0);
      
      return { totalUnidades, valorTotalCosto, valorTotalVenta };
    } else if (reporteActivo === 'ventas') {
      const totalVentas = datos.reduce((sum, item) => sum + item.total, 0);
      const totalDescuentos = datos.reduce((sum, item) => sum + (item.descuento || 0), 0);
      
      return { totalVentas, totalDescuentos };
    } else if (reporteActivo === 'cierres-caja') {
      const totalGeneral = datos.reduce((sum, item) => sum + (item.total_general || 0), 0);
      const totalEfectivo = datos.reduce((sum, item) => sum + (item.total_efectivo || 0), 0);
      const totalTarjeta = datos.reduce((sum, item) => sum + (item.total_tarjeta || 0), 0);
      const totalTransferencia = datos.reduce((sum, item) => sum + (item.total_transferencia || 0), 0);
      
      return { totalGeneral, totalEfectivo, totalTarjeta, totalTransferencia };
    }
    return null;
  };

  const totales = calcularTotales();

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: ''
    });
  };

  return (
    <div>
      <div className="page-header">
        <h2>Reportes</h2>
        <p>Consulta y exporta reportes del sistema</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className={`btn ${reporteActivo === 'inventario' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReporteActivo('inventario')}
            >
              📋 Inventario
            </button>
            <button
              className={`btn ${reporteActivo === 'ventas' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReporteActivo('ventas')}
            >
              💰 Ventas
            </button>
            <button
              className={`btn ${reporteActivo === 'cierres-caja' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReporteActivo('cierres-caja')}
            >
              🔒 Cierres de Caja
            </button>
            <button
              className={`btn ${reporteActivo === 'stock-bajo' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReporteActivo('stock-bajo')}
            >
              ⚠️ Stock Bajo
            </button>
          </div>
          <button
            className="btn btn-success"
            onClick={exportarExcel}
            disabled={datos.length === 0}
          >
            📊 Exportar Excel
          </button>
        </div>

        {/* Filtros de fecha para ventas y cierres */}
        {(reporteActivo === 'ventas' || reporteActivo === 'cierres-caja') && (
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Fecha Desde:
                </label>
                <input
                  type="date"
                  name="fecha_desde"
                  value={filtros.fecha_desde}
                  onChange={handleFiltroChange}
                  className="input"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Fecha Hasta:
                </label>
                <input
                  type="date"
                  name="fecha_hasta"
                  value={filtros.fecha_hasta}
                  onChange={handleFiltroChange}
                  className="input"
                />
              </div>
              <button
                className="btn btn-outline"
                onClick={cargarReporte}
              >
                🔍 Filtrar
              </button>
              {(filtros.fecha_desde || filtros.fecha_hasta) && (
                <button
                  className="btn btn-outline"
                  onClick={limpiarFiltros}
                >
                  ✖️ Limpiar
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando reporte...</p>
          </div>
        ) : datos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '1.2rem' }}>No hay datos para mostrar</p>
          </div>
        ) : (
          <>
            {reporteActivo === 'inventario' && totales && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <h4>Total Unidades</h4>
                  <div className="value">{totales.totalUnidades}</div>
                </div>
                <div className="stat-card success">
                  <h4>Valor Total (Costo)</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.valorTotalCosto)}
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Valor Total (Venta)</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.valorTotalVenta)}
                  </div>
                </div>
              </div>
            )}

            {reporteActivo === 'ventas' && totales && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card success">
                  <h4>Total Ventas</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.totalVentas)}
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Total Descuentos</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.totalDescuentos)}
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Cantidad de Ventas</h4>
                  <div className="value">{datos.length}</div>
                </div>
              </div>
            )}

            {reporteActivo === 'cierres-caja' && totales && (
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card success">
                  <h4>Total General</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.totalGeneral)}
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Total Efectivo</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.totalEfectivo)}
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Total Tarjeta</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.totalTarjeta)}
                  </div>
                </div>
                <div className="stat-card">
                  <h4>Total Transferencia</h4>
                  <div className="value" style={{ fontSize: '1.3rem' }}>
                    {formatearMoneda(totales.totalTransferencia)}
                  </div>
                </div>
              </div>
            )}

            <div className="table-container">
              {reporteActivo === 'inventario' ? (
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Stock</th>
                      <th>Costo</th>
                      <th>Precio Venta</th>
                      <th>Valor Total Costo</th>
                      <th>Valor Total Venta</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.codigo}</strong></td>
                        <td>{item.nombre}</td>
                        <td>{item.categoria}</td>
                        <td><strong>{item.stock_actual}</strong></td>
                        <td>{formatearMoneda(item.costo, item.moneda)}</td>
                        <td>{formatearMoneda(item.precio_venta, item.moneda)}</td>
                        <td>{formatearMoneda(item.valor_total_costo, item.moneda)}</td>
                        <td>{formatearMoneda(item.valor_total_venta, item.moneda)}</td>
                        <td>
                          {item.estado === 'Activo' ? (
                            <span className="badge badge-success">Activo</span>
                          ) : (
                            <span className="badge badge-info">Descontinuado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : reporteActivo === 'ventas' ? (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Método Pago</th>
                      <th>Subtotal</th>
                      <th>Descuento</th>
                      <th>Total</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.map((item, index) => (
                      <tr key={index}>
                        <td><strong>#{item.id}</strong></td>
                        <td>{formatearFecha(item.fecha)}</td>
                        <td>
                          <span className={`badge ${item.tipo_venta === 'Credito' ? 'badge-warning' : 'badge-success'}`}>
                            {item.tipo_venta}
                          </span>
                        </td>
                        <td>{item.metodo_pago}</td>
                        <td>{formatearMoneda(item.subtotal)}</td>
                        <td>{formatearMoneda(item.descuento || 0)}</td>
                        <td><strong>{formatearMoneda(item.total)}</strong></td>
                        <td>{item.usuario}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : reporteActivo === 'cierres-caja' ? (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha Cierre</th>
                      <th>Usuario</th>
                      <th>Total Ventas</th>
                      <th>Total General</th>
                      <th>Efectivo</th>
                      <th>Tarjeta</th>
                      <th>Transferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.map((item, index) => (
                      <tr key={index}>
                        <td><strong>#{item.id}</strong></td>
                        <td>{formatearFecha(item.fecha_cierre)}</td>
                        <td>{item.usuario}</td>
                        <td>{formatearMoneda(item.total_ventas || 0)}</td>
                        <td><strong>{formatearMoneda(item.total_general || 0)}</strong></td>
                        <td>{formatearMoneda(item.total_efectivo || 0)}</td>
                        <td>{formatearMoneda(item.total_tarjeta || 0)}</td>
                        <td>{formatearMoneda(item.total_transferencia || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Stock Actual</th>
                      <th>Stock Mínimo</th>
                      <th>Diferencia</th>
                      <th>Precio Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datos.map((item, index) => (
                      <tr key={index} className="stock-bajo">
                        <td><strong>{item.codigo}</strong></td>
                        <td>{item.nombre}</td>
                        <td>{item.categoria}</td>
                        <td>
                          <span style={{ color: '#f57c00', fontWeight: 'bold' }}>
                            {item.stock_actual} ⚠️
                          </span>
                        </td>
                        <td>{item.stock_minimo}</td>
                        <td>
                          <span className="badge badge-danger">
                            -{item.diferencia}
                          </span>
                        </td>
                        <td>{formatearMoneda(item.precio_venta, item.moneda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Reportes;
