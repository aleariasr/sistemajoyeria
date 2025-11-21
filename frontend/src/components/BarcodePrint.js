import React from 'react';
import '../styles/BarcodePrint.css';

const BarcodePrint = React.forwardRef(({ joya, cantidad = 1 }, ref) => {
  // Generar URL del código de barras con el código de la joya
  const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(joya.codigo)}&code=Code128&translate-esc=on&dpi=96&unit=Px&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0`;

  // Crear un array con la cantidad de etiquetas a imprimir
  const etiquetas = Array.from({ length: cantidad }, (_, index) => index);
  
  const handleImageError = (e) => {
    console.error('Error loading barcode image:', e);
    e.target.style.display = 'none';
    e.target.parentElement.innerHTML = '<div style="text-align:center; color:#999; font-size:10px;">Error al cargar código de barras</div>';
  };

  return (
    <div ref={ref} className="barcode-print-container">
      {etiquetas.map((_, index) => (
        <div key={index} className="barcode-label">
          <div className="barcode-info">
            <div className="barcode-business">Cuero y Perla</div>
            <div className="barcode-product-name">{joya.nombre}</div>
            <div className="barcode-product-code">Código: {joya.codigo}</div>
          </div>
          <div className="barcode-image-container">
            <img 
              src={barcodeUrl} 
              alt={`Código de barras ${joya.codigo}`}
              className="barcode-image"
              onError={handleImageError}
            />
          </div>
          <div className="barcode-price">
            {joya.moneda === 'USD' ? '$' : '₡'}{joya.precio_venta?.toFixed(2)}
          </div>
          <div className="barcode-footer">
            <a href="https://www.tec-it.com" className="barcode-credit">TEC-IT</a>
          </div>
        </div>
      ))}
    </div>
  );
});

BarcodePrint.displayName = 'BarcodePrint';

export default BarcodePrint;
