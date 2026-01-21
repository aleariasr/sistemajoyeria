import { rest } from 'msw';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Mock data stores
let sessions = new Map();
let joyas = [
  {
    id: 1,
    codigo: 'ANL001',
    categoria: 'anillos',
    peso: 5.5,
    quilates: 18,
    precio_compra: 100,
    precio_venta: 150,
    stock: 10,
    descripcion: 'Anillo de oro 18k',
    imagen_url: 'https://example.com/anillo.jpg',
    visible_storefront: true
  },
  {
    id: 2,
    codigo: 'CLR001',
    categoria: 'collares',
    peso: 8.0,
    quilates: 14,
    precio_compra: 200,
    precio_venta: 300,
    stock: 5,
    descripcion: 'Collar de oro 14k',
    imagen_url: 'https://example.com/collar.jpg',
    visible_storefront: true
  },
  {
    id: 3,
    codigo: 'ART001',
    categoria: 'aretes',
    peso: 3.2,
    quilates: 18,
    precio_compra: 80,
    precio_venta: 120,
    stock: 15,
    descripcion: 'Aretes de oro 18k',
    imagen_url: 'https://example.com/aretes.jpg',
    visible_storefront: false
  }
];

let ventas = [];
let cuentasPorCobrar = [];
let devoluciones = [];
let cierreCaja = {
  resumen: {
    ventas_contado: 0,
    ventas_credito: 0,
    abonos: 0,
    ingresos_extras: 0,
    total_efectivo: 0,
    total_tarjeta: 0
  },
  ventas: []
};

export const handlers = [
  // Auth endpoints
  rest.post(`${API_BASE}/auth/login`, (req, res, ctx) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin') {
      const sessionId = 'mock-session-admin';
      const user = { id: 1, username: 'admin', nombre: 'Administrador', role: 'administrador' };
      sessions.set(sessionId, user);
      
      return res(
        ctx.status(200),
        ctx.cookie('sessionId', sessionId),
        ctx.json({ 
          success: true, 
          usuario: user 
        })
      );
    }
    
    if (username === 'dependiente' && password === 'dependiente') {
      const sessionId = 'mock-session-dependiente';
      const user = { id: 2, username: 'dependiente', nombre: 'Dependiente Test', role: 'dependiente' };
      sessions.set(sessionId, user);
      
      return res(
        ctx.status(200),
        ctx.cookie('sessionId', sessionId),
        ctx.json({ 
          success: true, 
          usuario: user 
        })
      );
    }
    
    return res(
      ctx.status(401),
      ctx.json({ success: false, message: 'Credenciales inválidas' })
    );
  }),

  rest.get(`${API_BASE}/auth/session`, (req, res, ctx) => {
    const sessionId = req.cookies.sessionId;
    const user = sessions.get(sessionId);
    
    if (user) {
      return res(
        ctx.status(200),
        ctx.json({ loggedIn: true, usuario: user })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({ loggedIn: false })
    );
  }),

  rest.post(`${API_BASE}/auth/logout`, (req, res, ctx) => {
    const sessionId = req.cookies.sessionId;
    sessions.delete(sessionId);
    
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  }),

  // Joyas endpoints
  rest.get(`${API_BASE}/joyas`, (req, res, ctx) => {
    const categoria = req.url.searchParams.get('categoria');
    const buscar = req.url.searchParams.get('buscar');
    
    let filteredJoyas = [...joyas];
    
    if (categoria && categoria !== 'todos') {
      filteredJoyas = filteredJoyas.filter(j => j.categoria === categoria);
    }
    
    if (buscar) {
      const searchLower = buscar.toLowerCase();
      filteredJoyas = filteredJoyas.filter(j => 
        j.codigo.toLowerCase().includes(searchLower) ||
        j.descripcion.toLowerCase().includes(searchLower)
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: filteredJoyas })
    );
  }),

  rest.post(`${API_BASE}/joyas`, (req, res, ctx) => {
    const newJoya = {
      id: joyas.length + 1,
      ...req.body,
      created_at: new Date().toISOString()
    };
    joyas.push(newJoya);
    
    return res(
      ctx.status(201),
      ctx.json({ success: true, data: newJoya })
    );
  }),

  rest.put(`${API_BASE}/joyas/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id);
    const index = joyas.findIndex(j => j.id === id);
    
    if (index === -1) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Joya no encontrada' })
      );
    }
    
    joyas[index] = { ...joyas[index], ...req.body };
    
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: joyas[index] })
    );
  }),

  rest.delete(`${API_BASE}/joyas/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id);
    const index = joyas.findIndex(j => j.id === id);
    
    if (index === -1) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Joya no encontrada' })
      );
    }
    
    joyas.splice(index, 1);
    
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: 'Joya eliminada' })
    );
  }),

  // Ventas endpoints
  rest.post(`${API_BASE}/ventas`, (req, res, ctx) => {
    const { items, tipo_venta, metodo_pago, cliente_id, monto_efectivo, monto_tarjeta } = req.body;
    
    // Validate stock
    for (const item of items) {
      const joya = joyas.find(j => j.id === item.joya_id);
      if (!joya) {
        return res(
          ctx.status(400),
          ctx.json({ success: false, message: `Joya con id ${item.joya_id} no encontrada` })
        );
      }
      if (joya.stock < item.cantidad) {
        return res(
          ctx.status(400),
          ctx.json({ success: false, message: `Stock insuficiente para ${joya.descripcion}` })
        );
      }
    }
    
    // Update stock
    items.forEach(item => {
      const joya = joyas.find(j => j.id === item.joya_id);
      joya.stock -= item.cantidad;
    });
    
    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    
    const newVenta = {
      id: ventas.length + 1,
      fecha: new Date().toISOString(),
      total,
      tipo_venta,
      metodo_pago,
      cliente_id: cliente_id || null,
      monto_efectivo: monto_efectivo || 0,
      monto_tarjeta: monto_tarjeta || 0,
      vendedor_nombre: 'Admin',
      items: items.map(item => ({
        ...item,
        subtotal: item.precio_unitario * item.cantidad
      }))
    };
    
    ventas.push(newVenta);
    
    // If credit sale, create cuenta por cobrar
    if (tipo_venta === 'credito') {
      const nuevaCuenta = {
        id: cuentasPorCobrar.length + 1,
        venta_id: newVenta.id,
        cliente_id: cliente_id,
        cliente_nombre: 'Cliente Test',
        monto_total: total,
        saldo_pendiente: total,
        fecha_venta: newVenta.fecha,
        estado: 'pendiente',
        abonos: []
      };
      cuentasPorCobrar.push(nuevaCuenta);
    }
    
    return res(
      ctx.status(201),
      ctx.json({ 
        success: true, 
        data: newVenta,
        message: 'Venta registrada exitosamente' 
      })
    );
  }),

  rest.get(`${API_BASE}/ventas/:id`, (req, res, ctx) => {
    const id = parseInt(req.params.id);
    const venta = ventas.find(v => v.id === id);
    
    if (!venta) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Venta no encontrada' })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: venta })
    );
  }),

  // Devoluciones endpoints
  rest.post(`${API_BASE}/devoluciones`, (req, res, ctx) => {
    const { venta_id, items, motivo } = req.body;
    
    const venta = ventas.find(v => v.id === venta_id);
    if (!venta) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Venta no encontrada' })
      );
    }
    
    // Restore stock
    items.forEach(item => {
      const joya = joyas.find(j => j.id === item.joya_id);
      if (joya) {
        joya.stock += item.cantidad;
      }
    });
    
    const devolucion = {
      id: devoluciones.length + 1,
      venta_id,
      fecha: new Date().toISOString(),
      motivo,
      items,
      total: items.reduce((sum, item) => sum + item.monto_devuelto, 0)
    };
    
    devoluciones.push(devolucion);
    
    return res(
      ctx.status(201),
      ctx.json({ success: true, data: devolucion })
    );
  }),

  // Cuentas por cobrar endpoints
  rest.get(`${API_BASE}/cuentas-por-cobrar`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, data: cuentasPorCobrar })
    );
  }),

  rest.post(`${API_BASE}/cuentas-por-cobrar/:id/abonos`, (req, res, ctx) => {
    const id = parseInt(req.params.id);
    const { monto, metodo_pago } = req.body;
    
    const cuenta = cuentasPorCobrar.find(c => c.id === id);
    if (!cuenta) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Cuenta no encontrada' })
      );
    }
    
    if (monto > cuenta.saldo_pendiente) {
      return res(
        ctx.status(400),
        ctx.json({ success: false, message: 'El monto excede el saldo pendiente' })
      );
    }
    
    const nuevoAbono = {
      id: cuenta.abonos.length + 1,
      monto,
      fecha: new Date().toISOString(),
      metodo_pago
    };
    
    cuenta.abonos.push(nuevoAbono);
    cuenta.saldo_pendiente -= monto;
    
    if (cuenta.saldo_pendiente === 0) {
      cuenta.estado = 'pagado';
    }
    
    return res(
      ctx.status(201),
      ctx.json({ 
        success: true, 
        data: nuevoAbono,
        saldo_pendiente: cuenta.saldo_pendiente 
      })
    );
  }),

  // Cierre de caja endpoints
  rest.get(`${API_BASE}/cierrecaja/resumen-dia`, (req, res, ctx) => {
    const fecha = req.url.searchParams.get('fecha') || new Date().toISOString().split('T')[0];
    
    // Filter ventas by date
    const ventasDelDia = ventas.filter(v => 
      v.fecha.split('T')[0] === fecha
    );
    
    const resumen = {
      ventas_contado: ventasDelDia.filter(v => v.tipo_venta === 'contado').length,
      ventas_credito: ventasDelDia.filter(v => v.tipo_venta === 'credito').length,
      abonos: 0, // Would need to calculate from cuentas
      ingresos_extras: 0,
      total_efectivo: ventasDelDia
        .filter(v => v.metodo_pago === 'efectivo' || v.metodo_pago === 'mixto')
        .reduce((sum, v) => sum + (v.monto_efectivo || v.total), 0),
      total_tarjeta: ventasDelDia
        .filter(v => v.metodo_pago === 'tarjeta' || v.metodo_pago === 'mixto')
        .reduce((sum, v) => sum + (v.monto_tarjeta || v.total), 0)
    };
    
    return res(
      ctx.status(200),
      ctx.json({ 
        success: true, 
        data: {
          resumen,
          ventas: ventasDelDia
        }
      })
    );
  }),

  rest.post(`${API_BASE}/cierrecaja/cerrar-caja`, (req, res, ctx) => {
    const sessionId = req.cookies.sessionId;
    const user = sessions.get(sessionId);
    
    // Only admin can close
    if (!user || user.role !== 'administrador') {
      return res(
        ctx.status(403),
        ctx.json({ success: false, message: 'Solo administradores pueden cerrar caja' })
      );
    }
    
    const { fecha, efectivo_declarado, tarjeta_declarado } = req.body;
    
    const cierre = {
      id: Date.now(),
      fecha,
      efectivo_declarado,
      tarjeta_declarado,
      vendedor_id: user.id,
      vendedor_nombre: user.nombre
    };
    
    // Reset daily data
    ventas = [];
    
    return res(
      ctx.status(201),
      ctx.json({ success: true, data: cierre })
    );
  })
];
