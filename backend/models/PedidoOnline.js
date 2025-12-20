/**
 * Model: PedidoOnline
 * 
 * Handles online orders from the storefront with:
 * - Shipping address management
 * - Payment verification (Sinpe Móvil, Tilopay)
 * - Approval workflow
 */

const { supabase } = require('../supabase-db');
const { formatearFechaSQL } = require('../utils/timezone');

class PedidoOnline {
  /**
   * Create a new online order
   */
  static async crear(pedidoData) {
    const {
      nombre_cliente, telefono, email,
      provincia, canton, distrito, direccion_linea1, direccion_linea2,
      codigo_postal, telefono_envio,
      subtotal, costo_envio, total, notas,
      metodo_pago, comprobante_url, comprobante_public_id
    } = pedidoData;

    const fecha_creacion = formatearFechaSQL();

    const { data, error } = await supabase
      .from('pedidos_online')
      .insert([{
        nombre_cliente,
        telefono,
        email,
        provincia,
        canton,
        distrito,
        direccion_linea1,
        direccion_linea2: direccion_linea2 || null,
        codigo_postal: codigo_postal || null,
        telefono_envio,
        subtotal,
        costo_envio: costo_envio || 0,
        total,
        notas: notas || null,
        metodo_pago,
        comprobante_url: comprobante_url || null,
        comprobante_public_id: comprobante_public_id || null,
        estado: 'pendiente',
        estado_pago: metodo_pago === 'sinpe_movil' ? 'verificando' : 'pendiente',
        fecha_creacion
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { id: data.id };
  }

  /**
   * Get all online orders with filters and pagination
   */
  static async obtenerTodos(filtros = {}) {
    const {
      estado, estado_pago, fecha_desde, fecha_hasta,
      pagina = 1, por_pagina = 20
    } = filtros;

    let query = supabase
      .from('pedidos_online')
      .select('*', { count: 'exact' });

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (estado_pago) {
      query = query.eq('estado_pago', estado_pago);
    }

    if (fecha_desde) {
      query = query.gte('fecha_creacion', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_creacion', fecha_hasta);
    }

    const offset = (pagina - 1) * por_pagina;
    query = query
      .order('fecha_creacion', { ascending: false })
      .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      pedidos: data || [],
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }

  /**
   * Get a single order by ID with its items
   */
  static async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('pedidos_online')
      .select(`
        *,
        items_pedido_online (
          id,
          id_joya,
          cantidad,
          precio_unitario,
          subtotal
        )
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Get pending orders requiring payment verification
   */
  static async obtenerPendientesVerificacion() {
    const { data, error } = await supabase
      .from('pedidos_online')
      .select('*')
      .eq('estado_pago', 'verificando')
      .order('fecha_creacion', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Update order payment status (approve/reject)
   */
  static async actualizarEstadoPago(id, nuevoEstado, idUsuario = null) {
    const updateData = {
      estado_pago: nuevoEstado
    };

    if (nuevoEstado === 'aprobado') {
      updateData.id_usuario_aprobacion = idUsuario;
      updateData.fecha_aprobacion = formatearFechaSQL();
      updateData.estado = 'pago_verificado';
    } else if (nuevoEstado === 'rechazado') {
      updateData.estado = 'cancelado';
    }

    const { data, error } = await supabase
      .from('pedidos_online')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Update order status
   */
  static async actualizarEstado(id, nuevoEstado) {
    const { data, error } = await supabase
      .from('pedidos_online')
      .update({ estado: nuevoEstado })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Link order to a sale after approval
   */
  static async vincularVenta(id, idVenta) {
    const { data, error } = await supabase
      .from('pedidos_online')
      .update({ 
        id_venta: idVenta,
        estado: 'en_proceso'
      })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Get order summary/statistics
   */
  static async obtenerResumen() {
    const { data, error } = await supabase
      .from('pedidos_online')
      .select('estado, estado_pago, total');

    if (error) {
      throw error;
    }

    const resumen = {
      total_pedidos: data.length,
      pendientes_pago: data.filter(p => p.estado_pago === 'verificando').length,
      pagos_aprobados: data.filter(p => p.estado_pago === 'aprobado').length,
      en_proceso: data.filter(p => p.estado === 'en_proceso').length,
      enviados: data.filter(p => p.estado === 'enviado').length,
      entregados: data.filter(p => p.estado === 'entregado').length,
      cancelados: data.filter(p => p.estado === 'cancelado').length,
      monto_total: data
        .filter(p => p.estado_pago === 'aprobado')
        .reduce((sum, p) => sum + parseFloat(p.total || 0), 0)
    };

    return resumen;
  }

  /**
   * Update internal notes
   * @param {number} id - Order ID
   * @param {string} notas - Internal notes from admin
   */
  static async actualizarNotasInternas(id, notasInternas) {
    const { data, error } = await supabase
      .from('pedidos_online')
      .update({ notas_internas: notasInternas })
      .eq('id', id)
      .select();

    if (error) {
      throw error;
    }

    return { changes: data.length };
  }

  /**
   * Get orders with search filter (by name, email, phone)
   * @param {string} busqueda - Search term
   * @param {object} filtros - Additional filters
   */
  static async listar(filtros = {}) {
    const {
      estado, estado_pago, fecha_desde, fecha_hasta, busqueda,
      pagina = 1, por_pagina = 20
    } = filtros;

    let query = supabase
      .from('pedidos_online')
      .select('*', { count: 'exact' });

    if (estado) {
      query = query.eq('estado', estado);
    }

    if (estado_pago) {
      query = query.eq('estado_pago', estado_pago);
    }

    if (fecha_desde) {
      query = query.gte('fecha_creacion', fecha_desde);
    }

    if (fecha_hasta) {
      query = query.lte('fecha_creacion', fecha_hasta);
    }

    // Search by customer name, email, or phone
    // Sanitize input to prevent SQL injection
    if (busqueda) {
      const sanitizedBusqueda = busqueda
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      // Use OR filters with ilike for case-insensitive search
      query = query.or(`nombre_cliente.ilike.%${sanitizedBusqueda}%,email.ilike.%${sanitizedBusqueda}%,telefono.ilike.%${sanitizedBusqueda}%`);
    }

    const offset = (pagina - 1) * por_pagina;
    query = query
      .order('fecha_creacion', { ascending: false })
      .range(offset, offset + por_pagina - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      pedidos: data || [],
      total: count || 0,
      pagina: parseInt(pagina),
      por_pagina: parseInt(por_pagina),
      total_paginas: Math.ceil((count || 0) / por_pagina)
    };
  }
}

module.exports = PedidoOnline;
