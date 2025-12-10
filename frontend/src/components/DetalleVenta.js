import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useReactToPrint } from 'react-to-print';
import TicketPrint, { useThermalPrint } from './TicketPrint';
import { formatearFechaLarga } from '../utils/dateFormatter';
import '../styles/DetalleVenta.css';

function DetalleVenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensajePrint, setMensajePrint] = useState('');
  const ticketRef = useRef();
  
  // Hook para impresión térmica (3nstar RPT008)
  const thermalPrint = useThermalPrint();

  // Impresión por navegador (fallback)
  const handlePrint = useReactToPrint({
    contentRef: ticketRef,
    documentTitle: `Ticket-Venta-${id}`,
  });
  
  // Imprimir con impresora térmica USB
  const imprimirTermico = async () => {
    if (!venta) return;
    
    setMensajePrint('Imprimiendo...');
    const success = await thermalPrint.printTicket(venta, venta.items || [], 'venta');
    
    if (success) {
      setMensajePrint('✓ Impreso correctamente');
      setTimeout(() => setMensajePrint(''), 3000);
    } else {
      // Fallback a impresión del navegador
      setMensajePrint('Usando navegador...');
      handlePrint();
      setTimeout(() => setMensajePrint(''), 2000);
    }
  };
  
  // Función principal de impresión
  const imprimirTicket = () => {
    if (thermalPrint.isSupported) {
      imprimirTermico();
    } else {
      handlePrint();
    }
  };

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
          <p>{formatearFechaLarga(venta.fecha_venta)}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {mensajePrint && (
            <span style={{ 
              fontSize: '14px', 
              color: mensajePrint.includes('✓') ? '#28a745' : '#666' 
            }}>
              {mensajePrint}
            </span>
          )}
          <button 
            onClick={imprimirTicket} 
            className="btn-imprimir"
            disabled={thermalPrint.isPrinting}
          >
            🖨️ {thermalPrint.isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket'}
          </button>
          {/* Botón alternativo para navegador */}
          {thermalPrint.isSupported && (
            <button 
              onClick={handlePrint} 
              className="btn-imprimir"
              style={{ backgroundColor: '#6c757d' }}
              title="Usar diálogo de impresión del navegador"
            >
              📄 Navegador
            </button>
          )}
          <button onClick={() => navigate('/historial-ventas')} className="btn-volver">
            ← Volver
          </button>
        </div>
      </div>

      <div className="venta-info-grid">
        <div className="info-card">
          <h3>Información General</h3>
          <div className="info-linea">
            <span className="label">Vendedor:</span>
            <span>{venta.nombre_usuario || venta.usuario}</span>
          </div>
          <div className="info-linea">
            <span className="label">Tipo de Venta:</span>
            <span style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: venta.tipo_venta === 'Credito' ? '#fff3cd' : '#d4edda',
              color: '#000'
            }}>
              {venta.tipo_venta === 'Credito' ? '📝 Crédito' : '💰 Contado'}
            </span>
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
            <span>₡{(venta.subtotal || 0).toFixed(2)}</span>
          </div>
          {(venta.descuento || 0) > 0 && (
            <div className="info-linea">
              <span className="label">Descuento:</span>
              <span className="descuento">-₡{(venta.descuento || 0).toFixed(2)}</span>
            </div>
          )}
          <div className="info-linea total">
            <span className="label">Total:</span>
            <span>₡{(venta.total || 0).toFixed(2)}</span>
          </div>
          {venta.metodo_pago === 'Efectivo' && venta.efectivo_recibido && (
            <>
              <div className="info-linea">
                <span className="label">Efectivo Recibido:</span>
                <span>₡{(venta.efectivo_recibido || 0).toFixed(2)}</span>
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
                  <td>₡{(item.precio_unitario || 0).toFixed(2)}</td>
                  <td className="subtotal">₡{(item.subtotal || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Componente de ticket oculto para impresión */}
      <div style={{ display: 'none' }}>
        <TicketPrint 
          ref={ticketRef} 
          venta={venta} 
          items={venta.items || []}
          tipo="venta"
        />
      </div>
    </div>
  );
}

export default DetalleVenta;
