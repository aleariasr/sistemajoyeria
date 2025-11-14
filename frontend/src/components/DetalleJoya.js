import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerJoya } from '../services/api';

function DetalleJoya() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [joya, setJoya] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarJoya();
  }, [id]);

  const cargarJoya = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerJoya(id);
      setJoya(response.data);
      setMovimientos(response.data.movimientos || []);
    } catch (err) {
      setError('Error al cargar la joya');
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

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoMovimientoBadge = (tipo) => {
    switch (tipo) {
      case 'Entrada':
        return <span className="badge badge-success">Entrada</span>;
      case 'Salida':
        return <span className="badge badge-danger">Salida</span>;
      case 'Ajuste':
        return <span className="badge badge-info">Ajuste</span>;
      default:
        return <span className="badge">{tipo}</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando detalle...</p>
      </div>
    );
  }

  if (error || !joya) {
    return (
      <div className="alert alert-error">
        {error || 'Joya no encontrada'}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>{joya.nombre}</h2>
            <p>Código: {joya.codigo}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              ← Volver
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/editar-joya/${id}`)}>
              ✏️ Editar
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Información General</h3>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <label>Código</label>
            <div className="value">{joya.codigo}</div>
          </div>
          
          <div className="detail-item">
            <label>Nombre</label>
            <div className="value">{joya.nombre}</div>
          </div>
          
          <div className="detail-item">
            <label>Categoría</label>
            <div className="value">{joya.categoria || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Estado</label>
            <div className="value">
              {joya.stock_actual === 0 ? (
                <span className="badge badge-danger">Agotado</span>
              ) : joya.stock_actual <= joya.stock_minimo ? (
                <span className="badge badge-warning">Stock Bajo</span>
              ) : joya.estado === 'Descontinuado' ? (
                <span className="badge badge-info">Descontinuado</span>
              ) : (
                <span className="badge badge-success">Activo</span>
              )}
            </div>
          </div>
        </div>

        {joya.descripcion && (
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Descripción</label>
            <p style={{ color: '#666', lineHeight: '1.6' }}>{joya.descripcion}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Características</h3>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <label>Tipo de Metal</label>
            <div className="value">{joya.tipo_metal || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Color del Metal</label>
            <div className="value">{joya.color_metal || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Piedras</label>
            <div className="value">{joya.piedras || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Peso</label>
            <div className="value">{joya.peso_gramos ? `${joya.peso_gramos}g` : '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Talla / Medida</label>
            <div className="value">{joya.talla || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Colección</label>
            <div className="value">{joya.coleccion || '-'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Información Comercial</h3>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <label>Proveedor</label>
            <div className="value">{joya.proveedor || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Ubicación</label>
            <div className="value">{joya.ubicacion || '-'}</div>
          </div>
          
          <div className="detail-item">
            <label>Costo</label>
            <div className="value">{formatearMoneda(joya.costo, joya.moneda)}</div>
          </div>
          
          <div className="detail-item">
            <label>Precio de Venta</label>
            <div className="value">{formatearMoneda(joya.precio_venta, joya.moneda)}</div>
          </div>
          
          <div className="detail-item">
            <label>Margen</label>
            <div className="value">
              {((((joya.precio_venta - joya.costo) / joya.costo) * 100).toFixed(1))}%
            </div>
          </div>
          
          <div className="detail-item">
            <label>Valor Inventario</label>
            <div className="value">
              {formatearMoneda(joya.stock_actual * joya.costo, joya.moneda)}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Inventario</h3>
        </div>
        
        <div className="detail-grid">
          <div className="detail-item">
            <label>Stock Actual</label>
            <div className="value" style={{ fontSize: '1.5rem', color: '#1a237e' }}>
              {joya.stock_actual}
            </div>
          </div>
          
          <div className="detail-item">
            <label>Stock Mínimo</label>
            <div className="value">{joya.stock_minimo}</div>
          </div>
          
          <div className="detail-item">
            <label>Fecha de Creación</label>
            <div className="value">{formatearFecha(joya.fecha_creacion)}</div>
          </div>
          
          <div className="detail-item">
            <label>Última Modificación</label>
            <div className="value">{formatearFecha(joya.fecha_ultima_modificacion)}</div>
          </div>
        </div>
      </div>

      {movimientos.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>Historial de Movimientos (Últimos 10)</h3>
          </div>
          
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Stock Antes</th>
                  <th>Stock Después</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov) => (
                  <tr key={mov.id}>
                    <td>{formatearFecha(mov.fecha_movimiento)}</td>
                    <td>{getTipoMovimientoBadge(mov.tipo_movimiento)}</td>
                    <td><strong>{mov.cantidad}</strong></td>
                    <td>{mov.stock_antes}</td>
                    <td>{mov.stock_despues}</td>
                    <td>{mov.motivo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleJoya;
