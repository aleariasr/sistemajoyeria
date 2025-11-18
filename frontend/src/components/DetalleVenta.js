import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/DetalleVenta.css';

function DetalleVenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarVenta = useCallback(async () => {
    try {
      const response = await api.get(`/ventas/${id}`);
      setVenta(response.data);
    } catch (error) {
      console.error('Error al cargar venta:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarVenta();
  }, [cargarVenta]);

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Cargando detalle de venta...</div>;
  }

  if (!venta) {
    return (
      <div className="error-container">
        <p>No se encontró la venta</p>
        <button onClick={() => navigate('/historial-ventas')} className="btn-volver">
          Volver al Historial
        </button>
      </div>
    );
  }

  return (
    <div className="detalle-venta-container">
      <div className="page-header">
        <div>
          <h1>📄 Detalle de Venta #{venta.id}</h1>
          <p>{formatearFecha(venta.fecha_venta)}</p>
        </div>
        <button onClick={() => navigate('/historial-ventas')} className="btn-volver">
          ← Volver
        </button>
      </div>

      <div className="venta-info-grid">
        <div className="info-card">
          <h3>Información General</h3>
          <div className="info-linea">
            <span className="label">Vendedor:</span>
            <span>{venta.nombre_usuario || venta.usuario}</span>
          </div>
          <div className="info-linea">
            <span className="label">Método de Pago:</span>
            <span>{venta.metodo_pago}</span>
          </div>
          {venta.notas && (
            <div className="info-linea">
              <span className="label">Notas:</span>
              <span>{venta.notas}</span>
            </div>
          )}
        </div>

        <div className="info-card">
          <h3>Resumen de Pago</h3>
          <div className="info-linea">
            <span className="label">Subtotal:</span>
            <span>₡{venta.subtotal.toFixed(2)}</span>
          </div>
          {venta.descuento > 0 && (
            <div className="info-linea">
              <span className="label">Descuento:</span>
              <span className="descuento">-₡{venta.descuento.toFixed(2)}</span>
            </div>
          )}
          <div className="info-linea total">
            <span className="label">Total:</span>
            <span>₡{venta.total.toFixed(2)}</span>
          </div>
          {venta.metodo_pago === 'Efectivo' && venta.efectivo_recibido && (
            <>
              <div className="info-linea">
                <span className="label">Efectivo Recibido:</span>
                <span>₡{venta.efectivo_recibido.toFixed(2)}</span>
              </div>
              <div className="info-linea">
                <span className="label">Cambio:</span>
                <span>₡{(venta.cambio || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="items-section">
        <h3>Productos Vendidos</h3>
        <div className="items-tabla">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Precio Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.items && venta.items.map(item => (
                <tr key={item.id}>
                  <td>{item.codigo}</td>
                  <td>{item.nombre}</td>
                  <td>{item.categoria}</td>
                  <td>{item.cantidad}</td>
                  <td>₡{item.precio_unitario.toFixed(2)}</td>
                  <td className="subtotal">₡{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DetalleVenta;
