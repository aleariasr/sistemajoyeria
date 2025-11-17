import React, { useState, useEffect, useCallback } from 'react';
import { obtenerReporteInventario, obtenerReporteStockBajo } from '../services/api';

function Reportes() {
  const [reporteActivo, setReporteActivo] = useState('inventario');
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarReporte = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (reporteActivo === 'inventario') {
        response = await obtenerReporteInventario();
      } else {
        response = await obtenerReporteStockBajo();
      }
      
      setDatos(response.data);
    } catch (err) {
      setError('Error al cargar el reporte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [reporteActivo]);

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

  const exportarCSV = () => {
    if (datos.length === 0) return;

    let csv = '';
    
    if (reporteActivo === 'inventario') {
      csv = 'Código,Nombre,Categoría,Tipo Metal,Stock,Costo,Precio Venta,Moneda,Valor Total Costo,Valor Total Venta,Estado\n';
      datos.forEach((item) => {
        csv += `${item.codigo},"${item.nombre}","${item.categoria}","${item.tipo_metal}",${item.stock_actual},${item.costo},${item.precio_venta},${item.moneda},${item.valor_total_costo},${item.valor_total_venta},${item.estado}\n`;
      });
    } else {
      csv = 'Código,Nombre,Categoría,Stock Actual,Stock Mínimo,Diferencia,Precio Venta,Moneda\n';
      datos.forEach((item) => {
        csv += `${item.codigo},"${item.nombre}","${item.categoria}",${item.stock_actual},${item.stock_minimo},${item.diferencia},${item.precio_venta},${item.moneda}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${reporteActivo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calcularTotales = () => {
    if (reporteActivo === 'inventario') {
      const totalUnidades = datos.reduce((sum, item) => sum + item.stock_actual, 0);
      const valorTotalCosto = datos.reduce((sum, item) => sum + item.valor_total_costo, 0);
      const valorTotalVenta = datos.reduce((sum, item) => sum + item.valor_total_venta, 0);
      
      return { totalUnidades, valorTotalCosto, valorTotalVenta };
    }
    return null;
  };

  const totales = calcularTotales();

  return (
    <div>
      <div className="page-header">
        <h2>Reportes</h2>
        <p>Consulta y exporta reportes del inventario</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`btn ${reporteActivo === 'inventario' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setReporteActivo('inventario')}
            >
              📋 Inventario Actual
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
            onClick={exportarCSV}
            disabled={datos.length === 0}
          >
            📥 Exportar CSV
          </button>
        </div>

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

            <div className="table-container">
              {reporteActivo === 'inventario' ? (
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Tipo Metal</th>
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
                        <td>{item.tipo_metal}</td>
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
