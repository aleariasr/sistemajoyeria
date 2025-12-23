import React, { useMemo, useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import BarcodePrint from './BarcodePrint';
import { useSelection } from '../context/SelectionContext';
import '../styles/BarcodeModal.css';

// Soporta modo simple (una joya) y modo múltiple (varias joyas)
function BarcodeModal({ joya, joyas = [], onClose }) {
  const { clearSelection } = useSelection();
  const isMulti = Array.isArray(joyas) && joyas.length > 0;

  // Estado de cantidades
  const [cantidad, setCantidad] = useState(!isMulti ? (joya?.stock_actual || 1) : 1);
  const [cantidades, setCantidades] = useState(() => {
    if (!isMulti) return {};
    const initial = {};
    joyas.forEach((j) => {
      initial[j.id ?? j.codigo] = 1;
    });
    return initial;
  });
  const [clearAfterPrint, setClearAfterPrint] = useState(false);

  const itemsParaImprimir = useMemo(() => {
    if (!isMulti && joya) return [{ joya, cantidad }];
    if (isMulti) {
      return joyas.map((j) => ({ joya: j, cantidad: cantidades[j.id ?? j.codigo] || 1 }));
    }
    return [];
  }, [isMulti, joya, cantidad, joyas, cantidades]);

  const totalEtiquetas = useMemo(() => {
    return itemsParaImprimir.reduce((acc, it) => acc + (parseInt(it.cantidad, 10) || 1), 0);
  }, [itemsParaImprimir]);

  const barcodeRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: barcodeRef,
    documentTitle: isMulti ? 'Codigos-Barras-Seleccion' : `Codigos-Barras-${joya?.codigo}`,
  });

  const handlePrintClick = () => {
    handlePrint();
    if (clearAfterPrint && isMulti) {
      // Small delay to ensure print dialog opens before clearing
      setTimeout(() => {
        clearSelection();
        onClose();
      }, 100);
    }
  };

  const setCantidadItem = (key, value) => {
    setCantidades((prev) => ({ ...prev, [key]: Math.max(1, Math.min(100, parseInt(value, 10) || 1)) }));
  };

  return (
    <div className="barcode-modal-overlay" onClick={onClose}>
      <div className="barcode-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="barcode-modal-header">
          <h2>🏷️ Generar Códigos de Barras</h2>
          <button className="barcode-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="barcode-modal-body">
          {!isMulti ? (
            <>
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
            </>
          ) : (
            <>
              <div className="barcode-info-section">
                <p><strong>Productos seleccionados:</strong> {joyas.length}</p>
                <p><strong>Total de etiquetas:</strong> {totalEtiquetas}</p>
              </div>
              <div className="barcode-cantidad-section">
                <label>Configura la cantidad por producto:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center' }}>
                  {joyas.map((j) => {
                    const key = j.id ?? j.codigo;
                    const value = cantidades[key] || 1;
                    return (
                      <React.Fragment key={key}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <strong>{j.codigo}</strong> — {j.nombre}
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={value}
                          onChange={(e) => setCantidadItem(key, e.target.value)}
                          className="barcode-cantidad-input"
                        />
                        <button
                          onClick={() => setCantidadItem(key, j.stock_actual || 1)}
                          className="barcode-btn-stock"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          Usar Stock ({j.stock_actual})
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="barcode-preview-section">
            <h3>Vista Previa</h3>
            <div className="barcode-preview-container">
              {!isMulti ? (
                <BarcodePrint ref={barcodeRef} joya={joya} cantidad={cantidad} />
              ) : (
                <BarcodePrint ref={barcodeRef} items={itemsParaImprimir} />
              )}
            </div>
          </div>

          {isMulti && (
            <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={clearAfterPrint}
                  onChange={(e) => setClearAfterPrint(e.target.checked)}
                />
                <span>Limpiar selección después de imprimir</span>
              </label>
            </div>
          )}
        </div>

        <div className="barcode-modal-footer">
          <button onClick={onClose} className="barcode-btn-cancel">
            Cancelar
          </button>
          <button onClick={handlePrintClick} className="barcode-btn-print">
            🖨️ Imprimir {isMulti ? `${totalEtiquetas} Etiquetas` : `${cantidad} ${cantidad === 1 ? 'Etiqueta' : 'Etiquetas'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BarcodeModal;
