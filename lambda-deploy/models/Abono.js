const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class Abono {
  // Crear nuevo abono
  static async crear(abonoData) {
    const { id_cuenta_por_cobrar, monto, metodo_pago, notas, usuario } = abonoData;

    // Usar fecha de Costa Rica para el registro
    const fechaAbono = formatearFechaSQL();

    const { data, error } = await supabase
      .from('abonos')
      .insert([{
        id_cuenta_por_cobrar,
        monto,
        metodo_pago,
        notas: notas || null,
        usuario: usuario || null,
        fecha_abono: fechaAbono
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todos los abonos de una cuenta
  static async obtenerPorCuenta(id_cuenta_por_cobrar) {
    const { data, error } = await supabase
      .from('abonos')
      .select('*')
      .eq('id_cuenta_por_cobrar', id_cuenta_por_cobrar)
      .order('fecha_abono', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  // Obtener un abono por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('abonos')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Obtener todos los abonos con información de cuenta y cliente
  static async obtenerTodos(filtros = {}) {
    const { id_cliente, fecha_desde, fecha_hasta, pagina = 1, por_pagina = 50 } = filtros;

    let query = supabase
      .from('abonos')
      .select(`
        *,
        cuentas_por_cobrar!abonos_id_cuenta_por_cobrar_fkey (
          id_cliente,
          monto_total,
          saldo_pendiente,
          id_venta,
          clientes!cuentas_por_cobrar_id_cliente_fkey (nombre, cedula)
        )
      `, { count: 'exact' });

    // Filtro por cliente
    if (id_cliente) {
      query = query.eq('cuentas_por_cobrar.id_cliente', id_cliente);
    }

    // Filtro por fecha desde
    if (fecha_desde) {
      query = query.gte('fecha_abono', fecha_desde);
    }

    // Filtro por fecha hasta
    if (fecha_hasta) {
      query = query.lte('fecha_abono', fecha_hasta);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('fecha_abono', { ascending: false })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear datos para mantener compatibilidad
    const abonos = data.map(abono => ({
      ...abono,
      id_cliente: abono.cuentas_por_cobrar?.id_cliente,
      monto_cuenta: abono.cuentas_por_cobrar?.monto_total,
      saldo_pendiente: abono.cuentas_por_cobrar?.saldo_pendiente,
      id_venta: abono.cuentas_por_cobrar?.id_venta,
      nombre_cliente: abono.cuentas_por_cobrar?.clientes?.nombre,
      cedula_cliente: abono.cuentas_por_cobrar?.clientes?.cedula
    }));

    return {
      abonos,
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }

  // Obtener resumen de abonos por periodo
  static async obtenerResumen(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;

    let query = supabase.from('abonos').select('*');

    if (fecha_desde) {
      query = query.gte('fecha_abono', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_abono', fecha_hasta);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const resumen = {
      total_abonos: data.length,
      monto_total_abonos: data.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0),
      promedio_abono: data.length > 0 ? data.reduce((sum, a) => sum + parseFloat(a.monto || 0), 0) / data.length : 0,
      abonos_efectivo: data.filter(a => a.metodo_pago === 'Efectivo').length,
      abonos_tarjeta: data.filter(a => a.metodo_pago === 'Tarjeta').length,
      abonos_transferencia: data.filter(a => a.metodo_pago === 'Transferencia').length,
      monto_abonos_efectivo: data.filter(a => a.metodo_pago === 'Efectivo').reduce((sum, a) => sum + parseFloat(a.monto || 0), 0),
      monto_abonos_tarjeta: data.filter(a => a.metodo_pago === 'Tarjeta').reduce((sum, a) => sum + parseFloat(a.monto || 0), 0),
      monto_abonos_transferencia: data.filter(a => a.metodo_pago === 'Transferencia').reduce((sum, a) => sum + parseFloat(a.monto || 0), 0)
    };

    return resumen;
  }

  // Marcar abonos como cerrados
  static async marcarComoCerrados(filtros = {}) {
    const { fecha_desde, fecha_hasta } = filtros;
    const fechaCierre = formatearFechaSQL();

    let query = supabase
      .from('abonos')
      .update({ 
        cerrado: true, 
        fecha_cierre: fechaCierre 
      })
      .eq('cerrado', false);

    if (fecha_desde) {
      query = query.gte('fecha_abono', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_abono', fecha_hasta);
    }

    const { data, error } = await query.select('id, monto, fecha_abono, fecha_cierre');

    if (error) {
      throw error;
    }

    return { 
      count: data?.length || 0,
      abonos: data 
    };
  }
}

module.exports = Abono;
