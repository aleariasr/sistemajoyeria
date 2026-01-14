import ExcelJS from 'exceljs';

/**
 * Exporta datos a un archivo Excel con formato personalizado
 * @param {Array} data - Datos que se utilizarán para llenar el Excel
 * @param {Array} columns - Definición de columnas [{header: 'Nombre', key: 'nombre', width: 20}]
 * @param {string} title - Título del archivo Excel
 * @param {Object} options - Opciones adicionales {totales: {}}
 */
export async function exportToExcel(data, columns, title, options = {}) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title);

  // Configurar columnas
  sheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
    style: col.style || {}
  }));

  // Estilo del encabezado
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }
  };
  sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 25;

  // Añadir los datos
  data.forEach(row => {
    const addedRow = sheet.addRow(row);
    
    // Aplicar estilos a celdas numéricas
    columns.forEach((col, idx) => {
      const cell = addedRow.getCell(idx + 1);
      if (col.numFmt) {
        cell.numFmt = col.numFmt;
      }
    });
  });

  // Agregar fila de totales si se especifica
  if (options.totales) {
    const totalRow = sheet.addRow(options.totales);
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };
  }

  // Auto-filtro en el encabezado
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length }
  };

  // Congelar primera fila
  sheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1 }
  ];

  // Generar y descargar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Use consistent date format YYYY-MM-DD for file names
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `${title}_${dateStr}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Exporta reporte de inventario a Excel
 */
export async function exportInventarioToExcel(datos) {
  const columns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Categoría', key: 'categoria', width: 15 },
    { header: 'Stock', key: 'stock_actual', width: 10, numFmt: '#,##0' },
    { header: 'Costo', key: 'costo', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Precio Venta', key: 'precio_venta', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Moneda', key: 'moneda', width: 10 },
    { header: 'Valor Total Costo', key: 'valor_total_costo', width: 18, numFmt: '₡#,##0.00' },
    { header: 'Valor Total Venta', key: 'valor_total_venta', width: 18, numFmt: '₡#,##0.00' },
    { header: 'Estado', key: 'estado', width: 12 }
  ];

  // Calcular totales
  const totalUnidades = datos.reduce((sum, item) => sum + item.stock_actual, 0);
  const totalCosto = datos.reduce((sum, item) => sum + item.valor_total_costo, 0);
  const totalVenta = datos.reduce((sum, item) => sum + item.valor_total_venta, 0);

  const totales = {
    codigo: '',
    nombre: '',
    categoria: 'TOTALES',
    stock_actual: totalUnidades,
    costo: '',
    precio_venta: '',
    moneda: '',
    valor_total_costo: totalCosto,
    valor_total_venta: totalVenta,
    estado: ''
  };

  await exportToExcel(datos, columns, 'Reporte_Inventario', { totales });
}

/**
 * Exporta reporte de ventas a Excel
 */
export async function exportVentasToExcel(datos) {
  const columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Fecha', key: 'fecha', width: 18 },
    { header: 'Tipo Venta', key: 'tipo_venta', width: 12 },
    { header: 'Método Pago', key: 'metodo_pago', width: 15 },
    { header: 'Subtotal', key: 'subtotal', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Descuento', key: 'descuento', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Total', key: 'total', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Efectivo', key: 'monto_efectivo', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Tarjeta', key: 'monto_tarjeta', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Transferencia', key: 'monto_transferencia', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Notas', key: 'notas', width: 30 }
  ];

  // Formatear fechas
  const datosFormateados = datos.map(venta => ({
    ...venta,
    fecha: new Date(venta.fecha).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  // Calcular totales
  const totalVentas = datos.reduce((sum, v) => sum + v.total, 0);
  const totalDescuentos = datos.reduce((sum, v) => sum + (v.descuento || 0), 0);
  const totalEfectivo = datos.reduce((sum, v) => sum + (v.monto_efectivo || 0), 0);
  const totalTarjeta = datos.reduce((sum, v) => sum + (v.monto_tarjeta || 0), 0);
  const totalTransferencia = datos.reduce((sum, v) => sum + (v.monto_transferencia || 0), 0);

  const totales = {
    id: '',
    fecha: '',
    tipo_venta: '',
    metodo_pago: 'TOTALES',
    subtotal: totalVentas + totalDescuentos,
    descuento: totalDescuentos,
    total: totalVentas,
    monto_efectivo: totalEfectivo,
    monto_tarjeta: totalTarjeta,
    monto_transferencia: totalTransferencia,
    usuario: '',
    notas: ''
  };

  await exportToExcel(datosFormateados, columns, 'Reporte_Ventas', { totales });
}

/**
 * Exporta reporte de cierres de caja a Excel
 */
export async function exportCierresCajaToExcel(datos) {
  const columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Fecha Cierre', key: 'fecha_cierre', width: 18 },
    { header: 'Usuario', key: 'usuario', width: 20 },
    { header: 'Total Ventas', key: 'total_ventas', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Total Ingresos', key: 'total_ingresos', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Total General', key: 'total_general', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Total Efectivo', key: 'total_efectivo', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Total Tarjeta', key: 'total_tarjeta', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Total Transferencia', key: 'total_transferencia', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Abonos', key: 'monto_abonos', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Ingresos Extras', key: 'monto_ingresos_extras', width: 12, numFmt: '₡#,##0.00' },
    { header: 'Notas', key: 'notas', width: 30 }
  ];

  // Formatear fechas
  const datosFormateados = datos.map(cierre => ({
    ...cierre,
    fecha_cierre: new Date(cierre.fecha_cierre).toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }));

  // Calcular totales
  const totalVentas = datos.reduce((sum, c) => sum + (c.total_ventas || 0), 0);
  const totalIngresos = datos.reduce((sum, c) => sum + (c.total_ingresos || 0), 0);
  const totalGeneral = datos.reduce((sum, c) => sum + (c.total_general || 0), 0);
  const totalEfectivo = datos.reduce((sum, c) => sum + (c.total_efectivo || 0), 0);
  const totalTarjeta = datos.reduce((sum, c) => sum + (c.total_tarjeta || 0), 0);
  const totalTransferencia = datos.reduce((sum, c) => sum + (c.total_transferencia || 0), 0);
  const totalAbonos = datos.reduce((sum, c) => sum + (c.monto_abonos || 0), 0);
  const totalIngresosExtras = datos.reduce((sum, c) => sum + (c.monto_ingresos_extras || 0), 0);

  const totales = {
    id: '',
    fecha_cierre: '',
    usuario: 'TOTALES',
    total_ventas: totalVentas,
    total_ingresos: totalIngresos,
    total_general: totalGeneral,
    total_efectivo: totalEfectivo,
    total_tarjeta: totalTarjeta,
    total_transferencia: totalTransferencia,
    monto_abonos: totalAbonos,
    monto_ingresos_extras: totalIngresosExtras,
    notas: ''
  };

  await exportToExcel(datosFormateados, columns, 'Reporte_Cierres_Caja', { totales });
}

/**
 * Exporta reporte de stock bajo a Excel
 */
export async function exportStockBajoToExcel(datos) {
  const columns = [
    { header: 'Código', key: 'codigo', width: 12 },
    { header: 'Nombre', key: 'nombre', width: 30 },
    { header: 'Categoría', key: 'categoria', width: 15 },
    { header: 'Stock Actual', key: 'stock_actual', width: 12, numFmt: '#,##0' },
    { header: 'Stock Mínimo', key: 'stock_minimo', width: 12, numFmt: '#,##0' },
    { header: 'Diferencia', key: 'diferencia', width: 12, numFmt: '#,##0' },
    { header: 'Precio Venta', key: 'precio_venta', width: 15, numFmt: '₡#,##0.00' },
    { header: 'Moneda', key: 'moneda', width: 10 }
  ];

  await exportToExcel(datos, columns, 'Reporte_Stock_Bajo');
}
