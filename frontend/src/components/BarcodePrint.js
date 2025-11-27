import React from 'react';
import '../styles/BarcodePrint.css';

// Permite imprimir múltiples etiquetas de distintas joyas en una sola hoja.
// Soporta compatibilidad hacia atrás: (joya, cantidad) o bien items=[{ joya, cantidad }]
const BarcodePrint = React.forwardRef(({ joya, cantidad = 1, items }, ref) => {
  // Normalizar a una lista de etiquetas a renderizar
  const labelItems = React.useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      // Expandir por cantidad para el grid
      const expanded = [];
      items.forEach(({ joya: j, cantidad: c = 1 }) => {
        const qty = Math.max(1, parseInt(c, 10) || 1);
        for (let i = 0; i < qty; i += 1) {
          expanded.push(j);
        }
      });
      return expanded;
    }
    if (joya) {
      const qty = Math.max(1, parseInt(cantidad, 10) || 1);
      return Array.from({ length: qty }, () => joya);
    }
    return [];
  }, [items, joya, cantidad]);

  const handleImageError = (e) => {
    console.error('Error loading barcode image:', e);
    e.target.style.display = 'none';
    e.target.parentElement.innerHTML = '<div style="text-align:center; color:#999; font-size:10px;">Error al cargar código de barras</div>';
  };

  return (
    <div ref={ref} className="barcode-print-container">
      {labelItems.map((item, index) => {
        const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(item.codigo)}&code=Code128&translate-esc=on&dpi=96&unit=Px&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0`;
        return (
          <div key={`${item.codigo}-${index}`} className="barcode-label">
            <div className="barcode-info">
              <div className="barcode-business">Cuero y Perla</div>
              <div className="barcode-product-name">{item.nombre}</div>
            </div>
            <div className="barcode-image-container">
              <img
                src={barcodeUrl}
                alt={`Código de barras ${item.codigo}`}
                className="barcode-image"
                onError={handleImageError}
              />
            </div>
            <div className="barcode-price">
              {item.moneda === 'USD' ? '$' : '₡'}{item.precio_venta?.toFixed(2)}
            </div>
            <div className="barcode-footer">
              <a href="https://www.tec-it.com" className="barcode-credit">TEC-IT</a>
            </div>
          </div>
        );
      })}
    </div>
  );
});

BarcodePrint.displayName = 'BarcodePrint';

export default BarcodePrint;
