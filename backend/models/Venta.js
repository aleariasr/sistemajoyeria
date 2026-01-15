const { supabase } = require('../supabase-db');
const { formatearFechaSQL, obtenerFechaActualCR } = require('../utils/timezone');

class Venta {
  // Crear nueva venta
  static async crear(ventaData) {
    const {
      id_usuario, metodo_pago, subtotal, descuento, total,
      efectivo_recibido, cambio, notas, tipo_venta, id_cliente,
      monto_efectivo, monto_tarjeta, monto_transferencia
    } = ventaData;

    // Usar fecha de Costa Rica para el registro
    const fechaVenta = formatearFechaSQL();

    const { data, error } = await supabase
      .from('ventas')
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

    return { id: data.id, fecha_venta: data.fecha_venta };
  }

  // Obtener todas las ventas con paginación y filtros
  static async obtenerTodas(filtros = {}) {
    const {
      fecha_desde, fecha_hasta, metodo_pago, id_usuario,
      pagina = 1, por_pagina = 50
    } = filtros;

    let query = supabase
      .from('ventas')
      .select(`
        *,
        usuarios!ventas_id_usuario_fkey (username, full_name)
      `, { count: 'exact' });

    // Filtro por fecha desde
    if (fecha_desde) {
      query = query.gte('fecha_venta', fecha_desde);
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query = query.lte('fecha_venta', fecha_hasta);
    }

    // Filtro por método de pago
    if (metodo_pago) {
      query = query.eq('metodo_pago', metodo_pago);
    }

    // Filtro por usuario
    if (id_usuario) {
      query = query.eq('id_usuario', id_usuario);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('fecha_venta', { ascending: false })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear datos para mantener compatibilidad
    const ventas = data.map(venta => ({
      ...venta,
      usuario: venta.usuarios?.username,
      nombre_usuario: venta.usuarios?.full_name
    }));

    return {
      ventas,
      total: count,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil(count / por_pagina)
    };
  }

  // Obtener una venta por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        usuarios!ventas_id_usuario_fkey (username, full_name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        usuario: data.usuarios?.username,
        nombre_usuario: data.usuarios?.full_name
      };
    }

    return data;
  }

  // Obtener ventas del día
  static async obtenerVentasDelDia(fecha = null) {
    const fechaConsulta = fecha || obtenerFechaActualCR();
    
    const { data, error } = await supabase
      .from('ventas')
      .select(`
        *,
        usuarios!ventas_id_usuario_fkey (username, full_name)
      `)
      .gte('fecha_venta', `${fechaConsulta}T00:00:00`)
      .lte('fecha_venta', `${fechaConsulta}T23:59:59`)
      .order('fecha_venta', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(venta => ({
      ...venta,
      usuario: venta.usuarios?.username,
      nombre_usuario: venta.usuarios?.full_name
    }));
  }

  // Obtener resumen de ventas por periodo
  static async obtenerResumen(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;

    let query = supabase.from('ventas').select('*');

    if (fecha_desde) {
      query = query.gte('fecha_venta', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_venta', fecha_hasta);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Calcular resumen
    const resumen = {
      total_ventas: data.length,
      total_ingresos: data.reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      promedio_venta: data.length > 0 ? data.reduce((sum, v) => sum + parseFloat(v.total || 0), 0) / data.length : 0,
      ventas_efectivo: data.filter(v => v.metodo_pago === 'Efectivo').length,
      ventas_tarjeta: data.filter(v => v.metodo_pago === 'Tarjeta').length,
      ventas_transferencia: data.filter(v => v.metodo_pago === 'Transferencia').length,
      ventas_mixto: data.filter(v => v.metodo_pago === 'Mixto').length,
      monto_efectivo: data.filter(v => v.metodo_pago === 'Efectivo').reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      monto_tarjeta: data.filter(v => v.metodo_pago === 'Tarjeta').reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      monto_transferencia: data.filter(v => v.metodo_pago === 'Transferencia').reduce((sum, v) => sum + parseFloat(v.total || 0), 0),
      monto_mixto_efectivo: data.filter(v => v.metodo_pago === 'Mixto').reduce((sum, v) => sum + parseFloat(v.monto_efectivo || 0), 0),
      monto_mixto_tarjeta: data.filter(v => v.metodo_pago === 'Mixto').reduce((sum, v) => sum + parseFloat(v.monto_tarjeta || 0), 0),
      monto_mixto_transferencia: data.filter(v => v.metodo_pago === 'Mixto').reduce((sum, v) => sum + parseFloat(v.monto_transferencia || 0), 0),
      ventas_contado: data.filter(v => v.tipo_venta === 'Contado' || !v.tipo_venta).length,
      ventas_credito: data.filter(v => v.tipo_venta === 'Credito').length
    };

    return resumen;
  }
}

module.exports = Venta;
