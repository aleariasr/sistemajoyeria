const { supabase } = require('../supabase-db');

class CuentaPorCobrar {
  // Crear nueva cuenta por cobrar
  static async crear(cuentaData) {
    const { 
      id_venta, id_cliente, monto_total, monto_pagado = 0, 
      saldo_pendiente, estado = 'Pendiente', fecha_vencimiento 
    } = cuentaData;

    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .insert([{
        id_venta,
        id_cliente,
        monto_total,
        monto_pagado,
        saldo_pendiente,
        estado,
        fecha_vencimiento: fecha_vencimiento || null
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  // Obtener todas las cuentas por cobrar con filtros
  static async obtenerTodas(filtros = {}) {
    const { estado, id_cliente, pagina = 1, por_pagina = 50 } = filtros;

    let query = supabase
      .from('cuentas_por_cobrar')
      .select(`
        *,
        clientes!cuentas_por_cobrar_id_cliente_fkey (nombre, telefono, cedula),
        ventas!cuentas_por_cobrar_id_venta_fkey (fecha_venta, total)
      `, { count: 'exact' });

    // Filtro por estado
    if (estado) {
      query = query.eq('estado', estado);
    }

    // Filtro por cliente
    if (id_cliente) {
      query = query.eq('id_cliente', id_cliente);
    }

    // Ordenar y paginar
    const offset = (pagina - 1) * por_pagina;
    query = query.order('fecha_creacion', { ascending: false })
                 .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    // Formatear datos para mantener compatibilidad
    const cuentas = data.map(cuenta => ({
      ...cuenta,
      nombre_cliente: cuenta.clientes?.nombre,
      telefono_cliente: cuenta.clientes?.telefono,
      cedula_cliente: cuenta.clientes?.cedula,
      fecha_venta: cuenta.ventas?.fecha_venta,
      total_venta: cuenta.ventas?.total
    }));

    return {
      cuentas,
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }

  // Obtener una cuenta por cobrar por ID
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .select(`
        *,
        clientes!cuentas_por_cobrar_id_cliente_fkey (nombre, telefono, cedula),
        ventas!cuentas_por_cobrar_id_venta_fkey (fecha_venta, total, metodo_pago)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        nombre_cliente: data.clientes?.nombre,
        telefono_cliente: data.clientes?.telefono,
        cedula_cliente: data.clientes?.cedula,
        fecha_venta: data.ventas?.fecha_venta,
        total_venta: data.ventas?.total,
        metodo_pago: data.ventas?.metodo_pago
      };
    }

    return data;
  }

  // Obtener cuentas por cobrar de un cliente
  static async obtenerPorCliente(id_cliente) {
    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .select(`
        *,
        ventas!cuentas_por_cobrar_id_venta_fkey (fecha_venta, total)
      `)
      .eq('id_cliente', id_cliente)
      .order('fecha_creacion', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(cuenta => ({
      ...cuenta,
      fecha_venta: cuenta.ventas?.fecha_venta,
      total_venta: cuenta.ventas?.total
    }));
  }

  // Obtener cuenta por venta
  static async obtenerPorVenta(id_venta) {
    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .select(`
        *,
        clientes!cuentas_por_cobrar_id_cliente_fkey (nombre, telefono, cedula)
      `)
      .eq('id_venta', id_venta)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        nombre_cliente: data.clientes?.nombre,
        telefono_cliente: data.clientes?.telefono,
        cedula_cliente: data.clientes?.cedula
      };
    }

    return data;
  }

  // Actualizar monto pagado y saldo
  static async actualizarPago(id, monto_abono) {
    // Primero obtener la cuenta actual
    const cuenta = await this.obtenerPorId(id);
    
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    const nuevoMontoPagado = parseFloat(cuenta.monto_pagado) + parseFloat(monto_abono);
    const nuevoSaldoPendiente = parseFloat(cuenta.monto_total) - nuevoMontoPagado;
    const nuevoEstado = nuevoSaldoPendiente <= 0.01 ? 'Pagada' : 'Pendiente';

    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .update({
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: nuevoSaldoPendiente,
        estado: nuevoEstado
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { 
      changes: data.length,
      monto_pagado: nuevoMontoPagado,
      saldo_pendiente: nuevoSaldoPendiente,
      estado: nuevoEstado
    };
  }

  // Obtener resumen de cuentas por cobrar
  static async obtenerResumen() {
    const { data, error } = await supabase
      .from('cuentas_por_cobrar')
      .select('*');

    if (error) {
      throw error;
    }

    const resumen = {
      total_cuentas: data.length,
      cuentas_pendientes: data.filter(c => c.estado === 'Pendiente').length,
      cuentas_pagadas: data.filter(c => c.estado === 'Pagada').length,
      monto_total_general: data.reduce((sum, c) => sum + parseFloat(c.monto_total || 0), 0),
      monto_pagado_general: data.reduce((sum, c) => sum + parseFloat(c.monto_pagado || 0), 0),
      saldo_pendiente_general: data.reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0),
      cuentas_vencidas: 0,
      monto_vencido: 0
    };

    // Calcular cuentas vencidas
    const now = new Date();
    data.forEach(cuenta => {
      if (cuenta.fecha_vencimiento && cuenta.estado === 'Pendiente') {
        const fechaVenc = new Date(cuenta.fecha_vencimiento);
        if (fechaVenc < now) {
          resumen.cuentas_vencidas++;
          resumen.monto_vencido += parseFloat(cuenta.saldo_pendiente || 0);
        }
      }
    });

    return resumen;
  }
}

module.exports = CuentaPorCobrar;
