import React from 'react';
import '../styles/TicketPrint.css';

const TicketPrint = React.forwardRef(({ venta, items, tipo = 'venta' }, ref) => {
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calcularSubtotal = () => {
    if (items && items.length > 0) {
      return items.reduce((sum, item) => sum + (item.subtotal || item.precio_unitario * item.cantidad), 0);
    }
    return venta?.subtotal || 0;
  };

  return (
    <div ref={ref} className="ticket-print">
      <div className="ticket-header">
        <div className="ticket-logo-container">
          <img 
            src="https://res.cloudinary.com/dekqptpft/image/upload/v1763754027/CYP_FB-1_smbu4s.jpg" 
            alt="Cuero y Perla Logo" 
            className="ticket-logo"
          />
        </div>
        <h1 className="ticket-business-name">Cuero y Perla</h1>
        <p className="ticket-business-location">Grecia, Alajuela</p>
        <p className="ticket-business-info">Costa Rica</p>
        <div className="ticket-divider"></div>
      </div>

      <div className="ticket-info-section">
        <div className="ticket-row">
          <span className="ticket-label">Fecha:</span>
          <span className="ticket-value">{formatearFecha(venta?.fecha_venta || new Date())}</span>
        </div>
        {tipo === 'venta' && (
          <>
            <div className="ticket-row">
              <span className="ticket-label">Ticket #:</span>
              <span className="ticket-value">{venta?.id}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Vendedor:</span>
              <span className="ticket-value">{venta?.nombre_usuario || venta?.usuario || 'N/A'}</span>
            </div>
            {venta?.tipo_venta && (
              <div className="ticket-row">
                <span className="ticket-label">Tipo:</span>
                <span className="ticket-value ticket-tipo-venta">
                  {venta.tipo_venta === 'Credito' ? '📝 Crédito' : '💰 Contado'}
                </span>
              </div>
            )}
            {venta?.nombre_cliente && (
              <div className="ticket-row">
                <span className="ticket-label">Cliente:</span>
                <span className="ticket-value">{venta.nombre_cliente}</span>
              </div>
            )}
          </>
        )}
        {tipo === 'abono' && (
          <>
            <div className="ticket-row">
              <span className="ticket-label">Recibo #:</span>
              <span className="ticket-value">{venta?.id}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Cliente:</span>
              <span className="ticket-value">{venta?.nombre_cliente || 'N/A'}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Concepto:</span>
              <span className="ticket-value">Abono a Cuenta</span>
            </div>
          </>
        )}
        {tipo === 'movimiento' && (
          <>
            <div className="ticket-row">
              <span className="ticket-label">Movimiento #:</span>
              <span className="ticket-value">{venta?.id}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Tipo:</span>
              <span className="ticket-value">{venta?.tipo_movimiento || 'N/A'}</span>
            </div>
            <div className="ticket-row">
              <span className="ticket-label">Usuario:</span>
              <span className="ticket-value">{venta?.usuario || 'N/A'}</span>
            </div>
          </>
        )}
      </div>

      <div className="ticket-divider"></div>

      {items && items.length > 0 && (
        <>
          <div className="ticket-items-section">
            <h3 className="ticket-section-title">Detalle de {tipo === 'venta' ? 'Venta' : 'Productos'}</h3>
            <table className="ticket-items-table">
              <thead>
                <tr>
                  <th className="ticket-th-left">Producto</th>
                  <th className="ticket-th-center">Cant.</th>
                  <th className="ticket-th-right">Precio</th>
                  <th className="ticket-th-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="ticket-td-left">
                      <div className="ticket-item-name">{item.nombre}</div>
                      {item.codigo && <div className="ticket-item-code">Cód: {item.codigo}</div>}
                    </td>
                    <td className="ticket-td-center">{item.cantidad}</td>
                    <td className="ticket-td-right">₡{(item.precio_unitario || 0).toFixed(2)}</td>
                    <td className="ticket-td-right">₡{(item.subtotal || item.precio_unitario * item.cantidad).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ticket-divider"></div>
        </>
      )}

      <div className="ticket-totals-section">
        {tipo === 'venta' && items && items.length > 0 && (
          <>
            <div className="ticket-total-row">
              <span className="ticket-total-label">Subtotal:</span>
              <span className="ticket-total-value">₡{calcularSubtotal().toFixed(2)}</span>
            </div>
            {venta?.descuento > 0 && (
              <div className="ticket-total-row">
                <span className="ticket-total-label">Descuento:</span>
                <span className="ticket-total-value ticket-descuento">-₡{venta.descuento.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
        
        <div className="ticket-total-row ticket-total-final">
          <span className="ticket-total-label-final">TOTAL:</span>
          <span className="ticket-total-value-final">₡{(venta?.total || venta?.monto || 0).toFixed(2)}</span>
        </div>

        {tipo === 'venta' && venta?.metodo_pago && (
          <>
            <div className="ticket-divider-thin"></div>
            <div className="ticket-payment-section">
              <div className="ticket-total-row">
                <span className="ticket-total-label">Método de Pago:</span>
                <span className="ticket-total-value">{venta.metodo_pago}</span>
              </div>
              
              {venta.metodo_pago === 'Mixto' && (
                <>
                  {venta.monto_efectivo > 0 && (
                    <div className="ticket-total-row ticket-payment-detail">
                      <span className="ticket-total-label">Efectivo:</span>
                      <span className="ticket-total-value">₡{venta.monto_efectivo.toFixed(2)}</span>
                    </div>
                  )}
                  {venta.monto_tarjeta > 0 && (
                    <div className="ticket-total-row ticket-payment-detail">
                      <span className="ticket-total-label">Tarjeta:</span>
                      <span className="ticket-total-value">₡{venta.monto_tarjeta.toFixed(2)}</span>
                    </div>
                  )}
                  {venta.monto_transferencia > 0 && (
                    <div className="ticket-total-row ticket-payment-detail">
                      <span className="ticket-total-label">Transferencia:</span>
                      <span className="ticket-total-value">₡{venta.monto_transferencia.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}

              {venta.metodo_pago === 'Efectivo' && venta.efectivo_recibido && (
                <>
                  <div className="ticket-total-row">
                    <span className="ticket-total-label">Efectivo Recibido:</span>
                    <span className="ticket-total-value">₡{venta.efectivo_recibido.toFixed(2)}</span>
                  </div>
                  <div className="ticket-total-row">
                    <span className="ticket-total-label">Cambio:</span>
                    <span className="ticket-total-value">₡{(venta.cambio || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {venta?.notas && (
        <>
          <div className="ticket-divider"></div>
          <div className="ticket-notes-section">
            <p className="ticket-notes-label">Notas:</p>
            <p className="ticket-notes-text">{venta.notas}</p>
          </div>
        </>
      )}

      {tipo === 'abono' && venta?.saldo_pendiente !== undefined && (
        <>
          <div className="ticket-divider"></div>
          <div className="ticket-balance-section">
            <div className="ticket-total-row">
              <span className="ticket-total-label">Saldo Pendiente:</span>
              <span className="ticket-total-value">₡{(venta.saldo_pendiente || 0).toFixed(2)}</span>
            </div>
          </div>
        </>
      )}

      {tipo === 'movimiento' && venta?.motivo && (
        <>
          <div className="ticket-divider"></div>
          <div className="ticket-notes-section">
            <p className="ticket-notes-label">Motivo:</p>
            <p className="ticket-notes-text">{venta.motivo}</p>
          </div>
        </>
      )}

      <div className="ticket-divider"></div>

      <div className="ticket-footer">
        <p className="ticket-thanks">¡Gracias por su compra!</p>
        <p className="ticket-contact">Cuero y Perla - Grecia, Alajuela</p>
        <p className="ticket-slogan">Belleza y Elegancia en Cada Detalle</p>
      </div>
    </div>
  );
});

TicketPrint.displayName = 'TicketPrint';

export default TicketPrint;
