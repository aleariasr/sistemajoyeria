import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerJoyasStockBajo } from '../services/api';

function StockBajo() {
  const navigate = useNavigate();
  const [joyas, setJoyas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarJoyasStockBajo();
  }, []);

  const cargarJoyasStockBajo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerJoyasStockBajo();
      setJoyas(response.data);
    } catch (err) {
      setError('Error al cargar joyas con stock bajo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (valor, moneda) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'CRC',
      minimumFractionDigits: 0
    }).format(valor);
  };

  const totalJoyasAlerta = joyas.length;
  const totalUnidadesFaltantes = joyas.reduce((sum, joya) => 
    sum + (joya.stock_minimo - joya.stock_actual), 0
  );

  return (
    <div>
      <div className="page-header">
        <h2>Joyas con Stock Bajo</h2>
        <p>Alertas de inventario que requieren reabastecimiento</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card warning">
          <h4>Joyas en Alerta</h4>
          <div className="value">{totalJoyasAlerta}</div>
        </div>
        
        <div className="stat-card danger">
          <h4>Unidades Faltantes</h4>
          <div className="value">{totalUnidadesFaltantes}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando alertas...</p>
          </div>
        ) : joyas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>✅ ¡Excelente!</p>
            <p style={{ fontSize: '1.2rem' }}>No hay joyas con stock bajo</p>
            <p style={{ marginTop: '10px' }}>Todas las joyas tienen stock suficiente</p>
          </div>
        ) : (
          <div className="table-container">
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {joyas.map((joya) => (
                  <tr key={joya.id} className="stock-bajo">
                    <td><strong>{joya.codigo}</strong></td>
                    <td>{joya.nombre}</td>
                    <td>{joya.categoria}</td>
                    <td>
                      <span style={{ color: '#f57c00', fontWeight: 'bold' }}>
                        {joya.stock_actual} ⚠️
                      </span>
                    </td>
                    <td>{joya.stock_minimo}</td>
                    <td>
                      <span className="badge badge-danger">
                        -{joya.stock_minimo - joya.stock_actual}
                      </span>
                    </td>
                    <td>{formatearMoneda(joya.precio_venta, joya.moneda)}</td>
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
                          className="btn btn-success btn-icon"
                          title="Registrar Entrada"
                          onClick={() => navigate('/movimientos')}
                        >
                          📦
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockBajo;
