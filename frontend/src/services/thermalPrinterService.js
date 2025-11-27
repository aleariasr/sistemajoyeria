/**
 * Servicio de Impresión Térmica para 3nstar RPT008
 * 
 * Este servicio permite imprimir en impresoras térmicas POS usando comandos ESC/POS.
 * Compatible con USB en Windows, Linux y macOS usando WebUSB API.
 * 
 * Características:
 * - Impresión directa vía USB con WebUSB API
 * - Corte automático de papel al final del ticket
 * - Compatible con impresoras ESC/POS estándar
 * - Fallback a impresión del navegador cuando WebUSB no está disponible
 */

// Comandos ESC/POS para impresoras térmicas
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// Comandos ESC/POS
const ESCPOS = {
  // Inicialización
  INIT: [ESC, 0x40], // ESC @ - Inicializar impresora
  
  // Alineación de texto
  ALIGN_LEFT: [ESC, 0x61, 0x00],    // ESC a 0
  ALIGN_CENTER: [ESC, 0x61, 0x01],   // ESC a 1
  ALIGN_RIGHT: [ESC, 0x61, 0x02],    // ESC a 2
  
  // Estilos de texto
  BOLD_ON: [ESC, 0x45, 0x01],        // ESC E 1
  BOLD_OFF: [ESC, 0x45, 0x00],       // ESC E 0
  DOUBLE_HEIGHT_ON: [GS, 0x21, 0x01], // GS ! 1
  DOUBLE_WIDTH_ON: [GS, 0x21, 0x10],  // GS ! 16
  DOUBLE_SIZE_ON: [GS, 0x21, 0x11],   // GS ! 17 (doble ancho y alto)
  NORMAL_SIZE: [GS, 0x21, 0x00],      // GS ! 0
  UNDERLINE_ON: [ESC, 0x2D, 0x01],    // ESC - 1
  UNDERLINE_OFF: [ESC, 0x2D, 0x00],   // ESC - 0
  
  // Espaciado entre líneas
  LINE_SPACING_DEFAULT: [ESC, 0x32],  // ESC 2
  LINE_SPACING_SET: [ESC, 0x33],      // ESC 3 n
  
  // Corte de papel
  PAPER_CUT_FULL: [GS, 0x56, 0x00],   // GS V 0 - Corte completo
  PAPER_CUT_PARTIAL: [GS, 0x56, 0x01], // GS V 1 - Corte parcial
  PAPER_CUT_FEED: [GS, 0x56, 0x41, 0x03], // GS V A 3 - Alimentar y cortar
  
  // Alimentación de papel
  FEED_LINE: [LF],
  FEED_LINES: (n) => [ESC, 0x64, n],  // ESC d n - Alimentar n líneas
  
  // Separadores
  LINE_SEPARATOR: '--------------------------------',
  DASHED_SEPARATOR: '- - - - - - - - - - - - - - - -',
};

// Clase principal del servicio de impresora térmica
class ThermalPrinterService {
  constructor() {
    this.device = null;
    this.interfaceNumber = null;
    this.endpointNumber = null;
    this.isConnected = false;
    this.encoder = new TextEncoder();
  }

  /**
   * Verifica si WebUSB está disponible en el navegador
   */
  isWebUSBSupported() {
    return 'usb' in navigator;
  }

  /**
   * Solicita acceso al dispositivo USB
   * El usuario debe seleccionar la impresora en el diálogo del navegador
   */
  async requestDevice() {
    if (!this.isWebUSBSupported()) {
      throw new Error('WebUSB no está soportado en este navegador');
    }

    try {
      // Filtros para impresoras térmicas POS comunes
      // La mayoría de impresoras ESC/POS usan clase 0x07 (Printer)
      this.device = await navigator.usb.requestDevice({
        filters: [
          // 3nstar RPT008 y otras impresoras térmicas genéricas
          { classCode: 7 }, // Clase de impresora
          { vendorId: 0x0483 }, // STMicroelectronics (común en impresoras chinas)
          { vendorId: 0x0525 }, // NetChip (común en impresoras POS)
          { vendorId: 0x04B8 }, // Epson
          { vendorId: 0x1FC9 }, // NXP Semiconductors
          { vendorId: 0x0416 }, // Winbond (común en impresoras genéricas)
          { vendorId: 0x1A86 }, // QinHeng Electronics (CH340)
          { vendorId: 0x0FE6 }, // ICS Electronics
        ]
      });
      
      return this.device;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        throw new Error('No se seleccionó ninguna impresora');
      }
      throw error;
    }
  }

  /**
   * Conecta a la impresora USB
   */
  async connect() {
    if (!this.device) {
      await this.requestDevice();
    }

    try {
      await this.device.open();
      
      // Seleccionar la primera configuración disponible
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      // Buscar la interfaz y endpoint de impresión
      for (const iface of this.device.configuration.interfaces) {
        for (const alternate of iface.alternates) {
          // Buscar interfaz de impresora (clase 7) o interfaz de proveedor específico
          if (alternate.interfaceClass === 7 || alternate.interfaceClass === 255) {
            this.interfaceNumber = iface.interfaceNumber;
            
            // Buscar endpoint de salida (Bulk OUT)
            for (const endpoint of alternate.endpoints) {
              if (endpoint.direction === 'out' && endpoint.type === 'bulk') {
                this.endpointNumber = endpoint.endpointNumber;
                break;
              }
            }
            
            if (this.endpointNumber) break;
          }
        }
        if (this.endpointNumber) break;
      }

      if (this.interfaceNumber === null || this.endpointNumber === null) {
        throw new Error('No se encontró la interfaz de impresión');
      }

      await this.device.claimInterface(this.interfaceNumber);
      this.isConnected = true;
      
      console.log('Impresora conectada:', this.device.productName);
      return true;
    } catch (error) {
      console.error('Error al conectar impresora:', error);
      throw error;
    }
  }

  /**
   * Desconecta la impresora
   */
  async disconnect() {
    if (this.device && this.isConnected) {
      try {
        await this.device.releaseInterface(this.interfaceNumber);
        await this.device.close();
        this.isConnected = false;
        this.device = null;
        console.log('Impresora desconectada');
      } catch (error) {
        console.error('Error al desconectar:', error);
      }
    }
  }

  /**
   * Envía datos a la impresora
   */
  async write(data) {
    if (!this.isConnected || !this.device) {
      throw new Error('Impresora no conectada');
    }

    try {
      await this.device.transferOut(this.endpointNumber, data);
    } catch (error) {
      console.error('Error al escribir:', error);
      throw error;
    }
  }

  /**
   * Convierte texto a bytes con comandos ESC/POS
   */
  textToBytes(text) {
    return this.encoder.encode(text);
  }

  /**
   * Combina múltiples arrays de bytes
   */
  combineBytes(...arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr instanceof Uint8Array ? arr : new Uint8Array(arr), offset);
      offset += arr.length;
    }
    return result;
  }

  /**
   * Formatea texto para impresión en impresora térmica de 32 caracteres (80mm)
   */
  formatLine(left, right = '', width = 32) {
    if (!right) {
      return left.substring(0, width).padEnd(width);
    }
    const spaceNeeded = width - left.length - right.length;
    if (spaceNeeded < 1) {
      return left.substring(0, width - right.length - 1) + ' ' + right;
    }
    return left + ' '.repeat(spaceNeeded) + right;
  }

  /**
   * Imprime un ticket de venta completo
   */
  async printTicket(venta, items, tipo = 'venta') {
    const commands = [];

    // Inicializar impresora
    commands.push(new Uint8Array(ESCPOS.INIT));
    
    // ====== ENCABEZADO ======
    commands.push(new Uint8Array(ESCPOS.ALIGN_CENTER));
    commands.push(new Uint8Array(ESCPOS.DOUBLE_SIZE_ON));
    commands.push(this.textToBytes('CUERO Y PERLA\n'));
    commands.push(new Uint8Array(ESCPOS.NORMAL_SIZE));
    commands.push(this.textToBytes('\n'));
    commands.push(new Uint8Array(ESCPOS.BOLD_ON));
    commands.push(this.textToBytes('Grecia, Alajuela\n'));
    commands.push(this.textToBytes('Costa Rica\n'));
    commands.push(new Uint8Array(ESCPOS.BOLD_OFF));
    commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
    
    // ====== INFORMACIÓN DE LA TRANSACCIÓN ======
    commands.push(new Uint8Array(ESCPOS.ALIGN_LEFT));
    
    // Formatear fecha
    const fecha = new Date(venta?.fecha_venta || new Date());
    const fechaFormateada = fecha.toLocaleString('es-CR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    commands.push(this.textToBytes(this.formatLine('Fecha:', fechaFormateada) + '\n'));
    
    if (tipo === 'venta') {
      commands.push(this.textToBytes(this.formatLine('Ticket #:', String(venta?.id || '')) + '\n'));
      commands.push(this.textToBytes(this.formatLine('Vendedor:', venta?.nombre_usuario || venta?.usuario || 'N/A') + '\n'));
      
      if (venta?.tipo_venta) {
        const tipoVentaText = venta.tipo_venta === 'Credito' ? 'Credito' : 'Contado';
        commands.push(this.textToBytes(this.formatLine('Tipo:', tipoVentaText) + '\n'));
      }
      
      if (venta?.nombre_cliente) {
        commands.push(this.textToBytes(this.formatLine('Cliente:', venta.nombre_cliente) + '\n'));
      }
    } else if (tipo === 'abono') {
      commands.push(this.textToBytes(this.formatLine('Recibo #:', String(venta?.id || '')) + '\n'));
      commands.push(this.textToBytes(this.formatLine('Cliente:', venta?.nombre_cliente || 'N/A') + '\n'));
      commands.push(this.textToBytes(this.formatLine('Concepto:', 'Abono a Cuenta') + '\n'));
    } else if (tipo === 'movimiento') {
      commands.push(this.textToBytes(this.formatLine('Movimiento #:', String(venta?.id || '')) + '\n'));
      commands.push(this.textToBytes(this.formatLine('Tipo:', venta?.tipo_movimiento || 'N/A') + '\n'));
      commands.push(this.textToBytes(this.formatLine('Usuario:', venta?.usuario || 'N/A') + '\n'));
    }
    
    commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
    
    // ====== DETALLE DE PRODUCTOS ======
    if (items && items.length > 0) {
      commands.push(new Uint8Array(ESCPOS.ALIGN_CENTER));
      commands.push(new Uint8Array(ESCPOS.BOLD_ON));
      const tituloDetalle = tipo === 'venta' ? 'DETALLE DE VENTA' : 'PRODUCTOS';
      commands.push(this.textToBytes(tituloDetalle + '\n'));
      commands.push(new Uint8Array(ESCPOS.BOLD_OFF));
      commands.push(new Uint8Array(ESCPOS.ALIGN_LEFT));
      
      // Encabezado de tabla
      commands.push(this.textToBytes('Producto        Cant   Total\n'));
      commands.push(this.textToBytes(ESCPOS.DASHED_SEPARATOR + '\n'));
      
      // Items
      for (const item of items) {
        const nombre = (item.nombre || '').substring(0, 16).padEnd(16);
        const cantidad = String(item.cantidad || 0).padStart(4);
        const subtotal = (item.subtotal || (item.precio_unitario || 0) * (item.cantidad || 0)).toFixed(2);
        const subtotalStr = ('C' + subtotal).padStart(10);
        
        commands.push(this.textToBytes(nombre + cantidad + subtotalStr + '\n'));
        
        // Mostrar código si existe
        if (item.codigo) {
          commands.push(this.textToBytes('  Cod: ' + item.codigo + '\n'));
        }
        
        // Mostrar precio unitario
        commands.push(this.textToBytes('  P/U: C' + (item.precio_unitario || 0).toFixed(2) + '\n'));
      }
      
      commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
    }
    
    // ====== TOTALES ======
    commands.push(new Uint8Array(ESCPOS.ALIGN_RIGHT));
    
    if (tipo === 'venta' && items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => 
        sum + (item.subtotal || (item.precio_unitario || 0) * (item.cantidad || 0)), 0);
      commands.push(this.textToBytes('Subtotal: C' + subtotal.toFixed(2) + '\n'));
      
      if (venta?.descuento > 0) {
        commands.push(this.textToBytes('Descuento: -C' + venta.descuento.toFixed(2) + '\n'));
      }
    }
    
    // Total final (grande y en negrita)
    commands.push(new Uint8Array(ESCPOS.BOLD_ON));
    commands.push(new Uint8Array(ESCPOS.DOUBLE_HEIGHT_ON));
    const total = venta?.total || venta?.monto || 0;
    commands.push(this.textToBytes('TOTAL: C' + total.toFixed(2) + '\n'));
    commands.push(new Uint8Array(ESCPOS.NORMAL_SIZE));
    commands.push(new Uint8Array(ESCPOS.BOLD_OFF));
    
    // ====== INFORMACIÓN DE PAGO ======
    if (tipo === 'venta' && venta?.metodo_pago) {
      commands.push(new Uint8Array(ESCPOS.ALIGN_LEFT));
      commands.push(this.textToBytes(ESCPOS.DASHED_SEPARATOR + '\n'));
      commands.push(this.textToBytes(this.formatLine('Metodo Pago:', venta.metodo_pago) + '\n'));
      
      if (venta.metodo_pago === 'Mixto') {
        if (venta.monto_efectivo > 0) {
          commands.push(this.textToBytes(this.formatLine('  Efectivo:', 'C' + venta.monto_efectivo.toFixed(2)) + '\n'));
        }
        if (venta.monto_tarjeta > 0) {
          commands.push(this.textToBytes(this.formatLine('  Tarjeta:', 'C' + venta.monto_tarjeta.toFixed(2)) + '\n'));
        }
        if (venta.monto_transferencia > 0) {
          commands.push(this.textToBytes(this.formatLine('  Transfer:', 'C' + venta.monto_transferencia.toFixed(2)) + '\n'));
        }
      }
      
      if (venta.metodo_pago === 'Efectivo' && venta.efectivo_recibido) {
        commands.push(this.textToBytes(this.formatLine('Recibido:', 'C' + venta.efectivo_recibido.toFixed(2)) + '\n'));
        commands.push(this.textToBytes(this.formatLine('Cambio:', 'C' + (venta.cambio || 0).toFixed(2)) + '\n'));
      }
    }
    
    // ====== NOTAS ======
    if (venta?.notas) {
      commands.push(new Uint8Array(ESCPOS.ALIGN_LEFT));
      commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
      commands.push(this.textToBytes('Notas:\n'));
      commands.push(this.textToBytes(venta.notas + '\n'));
    }
    
    // ====== SALDO PENDIENTE (para abonos) ======
    if (tipo === 'abono' && venta?.saldo_pendiente !== undefined) {
      commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
      commands.push(this.textToBytes(this.formatLine('Saldo Pendiente:', 'C' + (venta.saldo_pendiente || 0).toFixed(2)) + '\n'));
    }
    
    // ====== MOTIVO (para movimientos) ======
    if (tipo === 'movimiento' && venta?.motivo) {
      commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
      commands.push(this.textToBytes('Motivo:\n'));
      commands.push(this.textToBytes(venta.motivo + '\n'));
    }
    
    // ====== PIE DE PÁGINA ======
    commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
    commands.push(new Uint8Array(ESCPOS.ALIGN_CENTER));
    commands.push(new Uint8Array(ESCPOS.BOLD_ON));
    commands.push(this.textToBytes('\nGracias por su compra!\n'));
    commands.push(new Uint8Array(ESCPOS.BOLD_OFF));
    commands.push(this.textToBytes('\nCuero y Perla - Grecia, Alajuela\n'));
    commands.push(this.textToBytes('Belleza y Elegancia en Cada Detalle\n'));
    
    // Alimentar papel antes del corte
    commands.push(new Uint8Array(ESCPOS.FEED_LINES(4)));
    
    // ====== CORTE DE PAPEL ======
    commands.push(new Uint8Array(ESCPOS.PAPER_CUT_FEED));
    
    // Combinar todos los comandos
    const allCommands = this.combineBytes(...commands);
    
    // Enviar a la impresora
    await this.write(allCommands);
  }

  /**
   * Ejecuta un corte de papel
   */
  async cutPaper(partial = false) {
    const cutCommand = partial ? ESCPOS.PAPER_CUT_PARTIAL : ESCPOS.PAPER_CUT_FULL;
    const data = this.combineBytes(
      new Uint8Array(ESCPOS.FEED_LINES(3)),
      new Uint8Array(cutCommand)
    );
    await this.write(data);
  }

  /**
   * Imprime una línea de prueba
   */
  async testPrint() {
    const commands = [];
    
    commands.push(new Uint8Array(ESCPOS.INIT));
    commands.push(new Uint8Array(ESCPOS.ALIGN_CENTER));
    commands.push(new Uint8Array(ESCPOS.DOUBLE_SIZE_ON));
    commands.push(this.textToBytes('PRUEBA DE IMPRESION\n'));
    commands.push(new Uint8Array(ESCPOS.NORMAL_SIZE));
    commands.push(this.textToBytes('\n'));
    commands.push(this.textToBytes('3nstar RPT008\n'));
    commands.push(this.textToBytes('Cuero y Perla\n'));
    commands.push(this.textToBytes(ESCPOS.LINE_SEPARATOR + '\n'));
    commands.push(this.textToBytes(new Date().toLocaleString('es-CR') + '\n'));
    commands.push(new Uint8Array(ESCPOS.FEED_LINES(3)));
    commands.push(new Uint8Array(ESCPOS.PAPER_CUT_FEED));
    
    const allCommands = this.combineBytes(...commands);
    await this.write(allCommands);
  }
}

// Instancia singleton del servicio
const thermalPrinterService = new ThermalPrinterService();

// Exportar servicio y constantes
export default thermalPrinterService;
export { ThermalPrinterService, ESCPOS };
