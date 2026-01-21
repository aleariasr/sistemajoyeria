/**
 * Test Fixtures
 * Sample data for testing
 */

const fixtures = {
  // Users
  usuarios: [
    {
      id: 1,
      username: 'admin',
      nombre: 'Admin User',
      password: '$2a$10$dummyHashedPassword1', // bcrypt hash for 'admin123'
      rol: 'Administrador',
      activo: true,
      fecha_creacion: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      username: 'dependiente',
      nombre: 'Dependiente User',
      password: '$2a$10$dummyHashedPassword2', // bcrypt hash for 'dependiente123'
      rol: 'Dependiente',
      activo: true,
      fecha_creacion: '2024-01-01T00:00:00Z'
    }
  ],

  // Jewelry items
  joyas: [
    {
      id: 1,
      codigo: 'ANILLO-001',
      nombre: 'Anillo de Oro 18K',
      descripcion: 'Hermoso anillo de oro 18K con diamante',
      categoria: 'Anillos',
      proveedor: 'Proveedor A',
      costo: 50000,
      precio_venta: 80000,
      moneda: 'CRC',
      stock_actual: 10,
      stock_minimo: 2,
      ubicacion: 'Vitrina A',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test1.jpg',
      imagen_public_id: 'test1',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      codigo: 'COLLAR-001',
      nombre: 'Collar de Plata 925',
      descripcion: 'Collar elegante de plata 925',
      categoria: 'Collares',
      proveedor: 'Proveedor B',
      costo: 25000,
      precio_venta: 40000,
      moneda: 'CRC',
      stock_actual: 5,
      stock_minimo: 1,
      ubicacion: 'Vitrina B',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test2.jpg',
      imagen_public_id: 'test2',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-02T10:00:00Z'
    },
    {
      id: 3,
      codigo: 'PULSERA-001',
      nombre: 'Pulsera de Plata',
      descripcion: 'Pulsera delicada de plata',
      categoria: 'Pulseras',
      proveedor: 'Proveedor C',
      costo: 15000,
      precio_venta: 25000,
      moneda: 'CRC',
      stock_actual: 0,
      stock_minimo: 2,
      ubicacion: 'Vitrina C',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test3.jpg',
      imagen_public_id: 'test3',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-03T10:00:00Z'
    },
    {
      id: 4,
      codigo: 'ANILLO-002',
      nombre: 'Anillo de Plata',
      descripcion: 'Anillo simple de plata',
      categoria: 'Anillos',
      proveedor: 'Proveedor A',
      costo: 10000,
      precio_venta: 18000,
      moneda: 'CRC',
      stock_actual: 8,
      stock_minimo: 3,
      ubicacion: 'Vitrina A',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test4.jpg',
      imagen_public_id: 'test4',
      mostrar_en_storefront: false, // NOT shown in storefront
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-04T10:00:00Z'
    },
    {
      id: 5,
      codigo: 'COLLAR-002',
      nombre: 'Collar de Oro',
      descripcion: 'Collar fino de oro',
      categoria: 'Collares',
      proveedor: 'Proveedor B',
      costo: 45000,
      precio_venta: 70000,
      moneda: 'CRC',
      stock_actual: 3,
      stock_minimo: 1,
      ubicacion: 'Vitrina B',
      estado: 'Descontinuado', // NOT active
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test5.jpg',
      imagen_public_id: 'test5',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-05T10:00:00Z'
    },
    {
      id: 6,
      codigo: 'ANILLO-003',
      nombre: 'Anillo de Diamantes',
      descripcion: 'Anillo con múltiples diamantes',
      categoria: 'Anillos',
      proveedor: 'Proveedor A',
      costo: 80000,
      precio_venta: 120000,
      moneda: 'CRC',
      stock_actual: 2,
      stock_minimo: 1,
      ubicacion: 'Vitrina Premium',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test6.jpg',
      imagen_public_id: 'test6',
      mostrar_en_storefront: true,
      es_producto_variante: true, // HAS VARIANTS
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-06T10:00:00Z'
    },
    // Products for testing shuffle and category balancing (max 3 consecutive)
    {
      id: 7,
      codigo: 'ANILLO-004',
      nombre: 'Anillo de Platino',
      descripcion: 'Anillo de platino moderno',
      categoria: 'Anillos',
      proveedor: 'Proveedor A',
      costo: 90000,
      precio_venta: 140000,
      moneda: 'CRC',
      stock_actual: 3,
      stock_minimo: 1,
      ubicacion: 'Vitrina Premium',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test7.jpg',
      imagen_public_id: 'test7',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-07T10:00:00Z'
    },
    {
      id: 8,
      codigo: 'ANILLO-005',
      nombre: 'Anillo de Rubí',
      descripcion: 'Anillo con rubí central',
      categoria: 'Anillos',
      proveedor: 'Proveedor A',
      costo: 70000,
      precio_venta: 110000,
      moneda: 'CRC',
      stock_actual: 4,
      stock_minimo: 1,
      ubicacion: 'Vitrina A',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test8.jpg',
      imagen_public_id: 'test8',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-08T10:00:00Z'
    },
    {
      id: 9,
      codigo: 'COLLAR-003',
      nombre: 'Collar de Perlas',
      descripcion: 'Collar elegante de perlas naturales',
      categoria: 'Collares',
      proveedor: 'Proveedor B',
      costo: 55000,
      precio_venta: 85000,
      moneda: 'CRC',
      stock_actual: 6,
      stock_minimo: 2,
      ubicacion: 'Vitrina B',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test9.jpg',
      imagen_public_id: 'test9',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-09T10:00:00Z'
    },
    {
      id: 10,
      codigo: 'PULSERA-002',
      nombre: 'Pulsera de Oro',
      descripcion: 'Pulsera elegante de oro 18K',
      categoria: 'Pulseras',
      proveedor: 'Proveedor C',
      costo: 40000,
      precio_venta: 65000,
      moneda: 'CRC',
      stock_actual: 7,
      stock_minimo: 2,
      ubicacion: 'Vitrina C',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test10.jpg',
      imagen_public_id: 'test10',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-10T10:00:00Z'
    },
    {
      id: 11,
      codigo: 'SET-001',
      nombre: 'Set Trio de Pulseras',
      descripcion: 'Set de 3 pulseras coordinadas',
      categoria: 'Sets',
      proveedor: 'Proveedor C',
      costo: 60000,
      precio_venta: 95000,
      moneda: 'CRC',
      stock_actual: 5, // Stock calculated from components
      stock_minimo: 1,
      ubicacion: 'Vitrina C',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test11.jpg',
      imagen_public_id: 'test11',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: true, // IS A SET
      fecha_creacion: '2024-01-11T10:00:00Z'
    },
    {
      id: 12,
      codigo: 'ANILLO-006',
      nombre: 'Anillo de Esmeralda',
      descripcion: 'Anillo con esmeralda colombiana',
      categoria: 'Anillos',
      proveedor: 'Proveedor A',
      costo: 75000,
      precio_venta: 115000,
      moneda: 'CRC',
      stock_actual: 2,
      stock_minimo: 1,
      ubicacion: 'Vitrina Premium',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test12.jpg',
      imagen_public_id: 'test12',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-12T10:00:00Z'
    },
    {
      id: 13,
      codigo: 'PULSERA-003',
      nombre: 'Pulsera de Diamantes',
      descripcion: 'Pulsera con diamantes incrustados',
      categoria: 'Pulseras',
      proveedor: 'Proveedor C',
      costo: 85000,
      precio_venta: 130000,
      moneda: 'CRC',
      stock_actual: 3,
      stock_minimo: 1,
      ubicacion: 'Vitrina Premium',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test13.jpg',
      imagen_public_id: 'test13',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-13T10:00:00Z'
    },
    // Product with stock bajo (stock_actual <= stock_minimo)
    {
      id: 14,
      codigo: 'COLLAR-004',
      nombre: 'Collar de Zafiro',
      descripcion: 'Collar con zafiro azul',
      categoria: 'Collares',
      proveedor: 'Proveedor B',
      costo: 60000,
      precio_venta: 95000,
      moneda: 'CRC',
      stock_actual: 1, // stock_actual <= stock_minimo (BAJO)
      stock_minimo: 2,
      ubicacion: 'Vitrina B',
      estado: 'Activo',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test14.jpg',
      imagen_public_id: 'test14',
      mostrar_en_storefront: true,
      es_producto_variante: false,
      es_producto_compuesto: false,
      fecha_creacion: '2024-01-14T10:00:00Z'
    }
  ],

  // Product variants
  variantes_producto: [
    {
      id: 1,
      id_producto_padre: 6, // Anillo de Diamantes
      nombre_variante: 'Anillo de Diamantes - Talla 6',
      descripcion_variante: 'Talla 6 para dedo pequeño',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/variant1.jpg',
      imagen_public_id: 'variant1',
      orden_display: 0,
      activo: true,
      created_at: '2024-01-06T11:00:00Z'
    },
    {
      id: 2,
      id_producto_padre: 6,
      nombre_variante: 'Anillo de Diamantes - Talla 8',
      descripcion_variante: 'Talla 8 para dedo mediano',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/variant2.jpg',
      imagen_public_id: 'variant2',
      orden_display: 1,
      activo: true,
      created_at: '2024-01-06T11:00:00Z'
    },
    {
      id: 3,
      id_producto_padre: 6,
      nombre_variante: 'Anillo de Diamantes - Talla 10',
      descripcion_variante: 'Talla 10 para dedo grande',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/variant3.jpg',
      imagen_public_id: 'variant3',
      orden_display: 2,
      activo: true,
      created_at: '2024-01-06T11:00:00Z'
    }
  ],

  // Composite products (sets) - components for SET-001 (id=11)
  productos_compuestos: [
    {
      id: 1,
      id_producto_set: 11, // Set Trio de Pulseras
      id_producto_componente: 3, // Pulsera de Plata (stock=0, prevents set from showing)
      cantidad: 1,
      orden_display: 0,
      created_at: '2024-01-11T11:00:00Z'
    },
    {
      id: 2,
      id_producto_set: 11,
      id_producto_componente: 10, // Pulsera de Oro (stock=7)
      cantidad: 1,
      orden_display: 1,
      created_at: '2024-01-11T11:00:00Z'
    },
    {
      id: 3,
      id_producto_set: 11,
      id_producto_componente: 13, // Pulsera de Diamantes (stock=3)
      cantidad: 1,
      orden_display: 2,
      created_at: '2024-01-11T11:00:00Z'
    }
  ],

  // Inventory movements
  movimientos_inventario: [
    {
      id: 1,
      id_joya: 1, // Anillo de Oro 18K
      tipo_movimiento: 'Ajuste',
      cantidad: 10,
      stock_anterior: 0,
      stock_nuevo: 10,
      motivo: 'Inventario inicial',
      id_usuario: 1,
      fecha: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      id_joya: 2, // Collar de Plata 925
      tipo_movimiento: 'Ajuste',
      cantidad: 5,
      stock_anterior: 0,
      stock_nuevo: 5,
      motivo: 'Inventario inicial',
      id_usuario: 1,
      fecha: '2024-01-02T10:00:00Z'
    },
    {
      id: 3,
      id_joya: 1, // Anillo de Oro 18K
      tipo_movimiento: 'Venta',
      cantidad: -2,
      stock_anterior: 10,
      stock_nuevo: 8,
      motivo: 'Venta al cliente',
      id_usuario: 2,
      fecha: '2024-01-15T14:30:00Z'
    }
  ],

  // Sales (main DB - for credit sales and historical)
  ventas: [],

  // Sale items (main DB)
  items_venta: [],

  // Daily sales (for cash sales before closure)
  ventas_dia: [],

  // Daily sale items
  items_venta_dia: [],

  // Clients
  clientes: [
    {
      id: 1,
      nombre: 'Juan Pérez',
      telefono: '8888-8888',
      cedula: '1-1234-5678',
      direccion: 'San José, Costa Rica',
      email: 'juan@example.com',
      notas: 'Cliente frecuente',
      fecha_registro: '2024-01-01T00:00:00Z'
    }
  ],

  // Accounts receivable
  cuentas_por_cobrar: [],

  // Payments (abonos)
  abonos: [],

  // Returns (devoluciones)
  devoluciones: [],

  // Cash register closures
  cierres_caja: [],

  // Extra income
  ingresos_extras: [],

  // Online orders
  pedidos_online: [],
  items_pedido_online: [],

  // Additional images for products
  imagenes_joya: [],

  // Push subscriptions
  push_subscriptions: [],

  // Account movements
  movimientos_cuenta: []
};

/**
 * Get a deep clone of fixtures to prevent mutation
 */
function getFixtures() {
  return JSON.parse(JSON.stringify(fixtures));
}

/**
 * Get fixtures for a specific table
 */
function getTableFixtures(table) {
  return JSON.parse(JSON.stringify(fixtures[table] || []));
}

module.exports = {
  fixtures,
  getFixtures,
  getTableFixtures
};
