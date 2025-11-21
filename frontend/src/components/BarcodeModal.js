import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import BarcodePrint from './BarcodePrint';
import '../styles/BarcodeModal.css';

function BarcodeModal({ joya, onClose }) {
  const [cantidad, setCantidad] = useState(joya.stock_actual || 1);
  const barcodeRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => barcodeRef.current,
    documentTitle: `Codigos-Barras-${joya.codigo}`,
  });

  const handlePrintClick = () => {
    handlePrint();
  };

  return (
    <div className="barcode-modal-overlay" onClick={onClose}>
      <div className="barcode-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="barcode-modal-header">
          <h2>🏷️ Generar Códigos de Barras</h2>
          <button className="barcode-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="barcode-modal-body">
          <div className="barcode-info-section">
            <p><strong>Producto:</strong> {joya.nombre}</p>
            <p><strong>Código:</strong> {joya.codigo}</p>
            <p><strong>Stock actual:</strong> {joya.stock_actual}</p>
          </div>

          <div className="barcode-cantidad-section">
            <label htmlFor="cantidad">Cantidad de etiquetas a imprimir:</label>
            <div className="barcode-cantidad-controls">
              <button 
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="barcode-btn-cantidad"
              >
                -
              </button>
              <input
                type="number"
                id="cantidad"
                min="1"
                max="100"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="barcode-cantidad-input"
              />
              <button 
                onClick={() => setCantidad(Math.min(100, cantidad + 1))}
                className="barcode-btn-cantidad"
              >
                +
              </button>
              <button
                onClick={() => setCantidad(joya.stock_actual || 1)}
                className="barcode-btn-stock"
              >
                Usar Stock ({joya.stock_actual})
              </button>
            </div>
          </div>

          <div className="barcode-preview-section">
            <h3>Vista Previa</h3>
            <div className="barcode-preview-container">
              <BarcodePrint ref={barcodeRef} joya={joya} cantidad={cantidad} />
            </div>
          </div>
        </div>

        <div className="barcode-modal-footer">
          <button onClick={onClose} className="barcode-btn-cancel">
            Cancelar
          </button>
          <button onClick={handlePrintClick} className="barcode-btn-print">
            🖨️ Imprimir {cantidad} {cantidad === 1 ? 'Etiqueta' : 'Etiquetas'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BarcodeModal;
