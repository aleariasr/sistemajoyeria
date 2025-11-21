const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class VentaDia {
  // Crear nueva venta del día
  static async crear(ventaData) {
    const {
      id_usuario, metodo_pago, subtotal, descuento, total,
      efectivo_recibido, cambio, notas, tipo_venta, id_cliente,
      monto_efectivo, monto_tarjeta, monto_transferencia
    } = ventaData;

    // Usar fecha de Costa Rica para el registro
    const fechaVenta = formatearFechaSQL();

    const { data, error } = await supabase
      .from('ventas_dia')
      .insert([{
        id_usuario,
        metodo_pago,
        subtotal: subtotal || 0,
        descuento: descuento || 0,
        total,
        efectivo_recibido: efectivo_recibido || null,
        cambio: cambio || null,
        notas: notas || null,
        tipo_venta: tipo_venta || 'Contado',
        id_cliente: id_cliente || null,
        monto_efectivo: monto_efectivo || 0,
        monto_tarjeta: monto_tarjeta || 0,
        monto_transferencia: monto_transferencia || 0,
        fecha_venta: fechaVenta
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todas las ventas del día
  static async obtenerTodas() {
    const { data, error } = await supabase
      .from('ventas_dia')
      .select('*')
      .order('fecha_venta', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  // Obtener una venta por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('ventas_dia')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Obtener resumen de ventas del día (solo ventas de contado)
  static async obtenerResumen() {
    const { data, error } = await supabase
      .from('ventas_dia')
      .select('*')
      .or('tipo_venta.eq.Contado,tipo_venta.is.null');

    if (error) {
      throw error;
    }

    const resumen = {
      total_ventas: data.length,
      total_ingresos: data.reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      total_efectivo: data.filter(v => v.metodo_pago === 'Efectivo').reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      total_transferencia: data.filter(v => v.metodo_pago === 'Transferencia').reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      total_tarjeta: data.filter(v => v.metodo_pago === 'Tarjeta').reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      total_efectivo_mixto: data.filter(v => v.metodo_pago === 'Mixto').reduce((sum, v) => sum + parseFloat(v.monto_efectivo || 0), 0),
      total_tarjeta_mixto: data.filter(v => v.metodo_pago === 'Mixto').reduce((sum, v) => sum + parseFloat(v.monto_tarjeta || 0), 0),
      total_transferencia_mixto: data.filter(v => v.metodo_pago === 'Mixto').reduce((sum, v) => sum + parseFloat(v.monto_transferencia || 0), 0),
      ventas_efectivo: data.filter(v => v.metodo_pago === 'Efectivo').length,
      ventas_transferencia: data.filter(v => v.metodo_pago === 'Transferencia').length,
      ventas_tarjeta: data.filter(v => v.metodo_pago === 'Tarjeta').length,
      ventas_mixto: data.filter(v => v.metodo_pago === 'Mixto').length
    };

    // Combinar totales de pagos simples y mixtos
    resumen.total_efectivo_final = resumen.total_efectivo + resumen.total_efectivo_mixto;
    resumen.total_tarjeta_final = resumen.total_tarjeta + resumen.total_tarjeta_mixto;
    resumen.total_transferencia_final = resumen.total_transferencia + resumen.total_transferencia_mixto;

    return resumen;
  }

  // Limpiar todas las ventas del día (después del cierre)
  static async limpiar() {
    // Primero eliminar items
    const { error: errorItems } = await supabase
      .from('items_venta_dia')
      .delete()
      .neq('id', 0); // Eliminar todos

    if (errorItems) {
      throw errorItems;
    }

    // Luego eliminar ventas
    const { error: errorVentas } = await supabase
      .from('ventas_dia')
      .delete()
      .neq('id', 0); // Eliminar todos

    if (errorVentas) {
      throw errorVentas;
    }

    return true;
  }
}

module.exports = VentaDia;
