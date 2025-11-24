const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class Devolucion {
  // Crear nueva devolución
  static async crear(devolucionData) {
    const {
      id_venta, id_joya, cantidad, precio_unitario, subtotal,
      motivo, tipo_devolucion, monto_reembolsado, metodo_reembolso,
      id_usuario, usuario, notas
    } = devolucionData;

    const fechaDevolucion = formatearFechaSQL();

    const { data, error } = await supabase
      .from('devoluciones')
      .insert([{
        id_venta,
        id_joya,
        cantidad,
        precio_unitario,
        subtotal,
        motivo,
        tipo_devolucion,
        estado: 'Pendiente',
        monto_reembolsado: monto_reembolsado || 0,
        metodo_reembolso: metodo_reembolso || null,
        id_usuario,
        usuario: usuario || null,
        notas: notas || null,
        fecha_devolucion: fechaDevolucion
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todas las devoluciones con filtros
  static async obtenerTodas(filtros = {}) {
    const {
      id_venta, estado, tipo_devolucion, fecha_desde, fecha_hasta,
      pagina = 1, por_pagina = 50
    } = filtros;

    let query = supabase
      .from('devoluciones')
      .select(`
        *,
        ventas!devoluciones_id_venta_fkey (fecha_venta, metodo_pago, total),
        joyas!devoluciones_id_joya_fkey (codigo, nombre, categoria),
        usuarios!devoluciones_id_usuario_fkey (username, full_name)
      `, { count: 'exact' });

    // Filtro por venta
    if (id_venta) {
      query = query.eq('id_venta', id_venta);
    }

    // Filtro por estado
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Filtro por tipo de devolución
    if (tipo_devolucion) {
      query = query.eq('tipo_devolucion', tipo_devolucion);
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query = query.gte('fecha_devolucion', fecha_desde);
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query = query.lte('fecha_devolucion', fecha_hasta);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('fecha_devolucion', { ascending: false })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear datos
    const devoluciones = data.map(dev => ({
      ...dev,
      fecha_venta: dev.ventas?.fecha_venta,
      metodo_pago_venta: dev.ventas?.metodo_pago,
      total_venta: dev.ventas?.total,
      codigo_joya: dev.joyas?.codigo,
      nombre_joya: dev.joyas?.nombre,
      categoria_joya: dev.joyas?.categoria,
      username: dev.usuarios?.username,
      nombre_usuario: dev.usuarios?.full_name
    }));

    return {
      devoluciones,
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }

  // Obtener devolución por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('devoluciones')
      .select(`
        *,
        ventas!devoluciones_id_venta_fkey (fecha_venta, metodo_pago, total),
        joyas!devoluciones_id_joya_fkey (codigo, nombre, categoria, precio_venta),
        usuarios!devoluciones_id_usuario_fkey (username, full_name)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        fecha_venta: data.ventas?.fecha_venta,
        metodo_pago_venta: data.ventas?.metodo_pago,
        total_venta: data.ventas?.total,
        codigo_joya: data.joyas?.codigo,
        nombre_joya: data.joyas?.nombre,
        categoria_joya: data.joyas?.categoria,
        precio_venta_actual: data.joyas?.precio_venta,
        username: data.usuarios?.username,
        nombre_usuario: data.usuarios?.full_name
      };
    }

    return data;
  }

  // Actualizar estado de devolución
  static async actualizarEstado(id, nuevoEstado, fechaProcesada = null) {
    const updateData = { estado: nuevoEstado };
    
    if (fechaProcesada) {
      updateData.fecha_procesada = fechaProcesada;
    } else if (nuevoEstado === 'Procesada') {
      updateData.fecha_procesada = formatearFechaSQL();
    }

    const { data, error } = await supabase
      .from('devoluciones')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  // Obtener devoluciones por venta
  static async obtenerPorVenta(id_venta) {
    const { data, error } = await supabase
      .from('devoluciones')
      .select(`
        *,
        joyas!devoluciones_id_joya_fkey (codigo, nombre),
        usuarios!devoluciones_id_usuario_fkey (username, full_name)
      `)
      .eq('id_venta', id_venta)
      .order('fecha_devolucion', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(dev => ({
      ...dev,
      codigo_joya: dev.joyas?.codigo,
      nombre_joya: dev.joyas?.nombre,
      username: dev.usuarios?.username,
      nombre_usuario: dev.usuarios?.full_name
    }));
  }

  // Obtener resumen de devoluciones
  static async obtenerResumen(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;

    let query = supabase.from('devoluciones').select('*');

    if (fecha_desde) {
      query = query.gte('fecha_devolucion', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_devolucion', fecha_hasta);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const resumen = {
      total_devoluciones: data.length,
      // Por estado
      pendientes: data.filter(d => d.estado === 'Pendiente').length,
      aprobadas: data.filter(d => d.estado === 'Aprobada').length,
      procesadas: data.filter(d => d.estado === 'Procesada').length,
      rechazadas: data.filter(d => d.estado === 'Rechazada').length,
      // Por tipo
      reembolsos: data.filter(d => d.tipo_devolucion === 'Reembolso').length,
      cambios: data.filter(d => d.tipo_devolucion === 'Cambio').length,
      notas_credito: data.filter(d => d.tipo_devolucion === 'Nota de Credito').length,
      // Montos
      monto_total_devoluciones: data.reduce((sum, d) => sum + parseFloat(d.subtotal || 0), 0),
      monto_total_reembolsado: data.filter(d => d.estado === 'Procesada' && d.tipo_devolucion === 'Reembolso')
        .reduce((sum, d) => sum + parseFloat(d.monto_reembolsado || 0), 0)
    };

    return resumen;
  }
}

module.exports = Devolucion;
