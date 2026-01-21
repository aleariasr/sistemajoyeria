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
      activo: true,
      fecha_creacion: '2024-01-06T11:00:00Z'
    },
    {
      id: 2,
      id_producto_padre: 6,
      nombre_variante: 'Anillo de Diamantes - Talla 8',
      descripcion_variante: 'Talla 8 para dedo mediano',
      imagen_url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/variant2.jpg',
      imagen_public_id: 'variant2',
      activo: true,
      fecha_creacion: '2024-01-06T11:00:00Z'
    }
  ],

  // Composite products (sets)
  productos_compuestos: [],

  // Inventory movements
  movimientos_inventario: [],

  // Sales
  ventas: [],

  // Sale items
  items_venta: [],

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
  abonos: []
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
