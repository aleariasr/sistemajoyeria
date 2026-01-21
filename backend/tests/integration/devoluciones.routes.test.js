/**
 * Integration Tests for Devoluciones (Returns) Routes
 * Tests /api/devoluciones/* endpoints including return creation,
 * stock adjustment, and return management
 */

const request = require('supertest');
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { createMockSupabase } = require('../mocks/supabase.mock');
const { getFixtures } = require('../fixtures/data');

// Mock Supabase
jest.mock('../../supabase-db', () => {
  const fixtures = require('../fixtures/data').getFixtures();
  const mockSupabase = require('../mocks/supabase.mock').createMockSupabase(fixtures);
  return {
    supabase: mockSupabase
  };
});

// Mock Cloudinary
jest.mock('../../cloudinary-config', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test.jpg',
    publicId: 'test_image_1',
    width: 800,
    height: 600,
    format: 'jpg'
  }),
  deleteImage: jest.fn().mockResolvedValue({ result: 'ok' })
}));

// Mock Resend
jest.mock('resend', () => require('../mocks/resend.mock'));

describe('Devoluciones Routes Integration Tests', () => {
  let app;
  let adminAgent;

  beforeEach(async () => {
    // Get fresh fixtures
    const fixtures = getFixtures();
    
    // Hash passwords for test users
    const adminHash = bcrypt.hashSync('admin123', 10);
    const dependienteHash = bcrypt.hashSync('dependiente123', 10);
    
    // Override usuarios fixtures with proper password_hash field
    fixtures.usuarios = [
      {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        password_hash: adminHash,
        role: 'administrador',
        fecha_creacion: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        username: 'dependiente',
        full_name: 'Dependiente User',
        password_hash: dependienteHash,
        role: 'dependiente',
        fecha_creacion: '2024-01-01T00:00:00Z'
      }
    ];

    // Create mock Supabase with correct fixtures
    const mockSupabase = createMockSupabase(fixtures);
    const supabaseDb = require('../../supabase-db');
    supabaseDb.supabase = mockSupabase;

    // Clear the require cache for routes to pick up new mock
    delete require.cache[require.resolve('../../routes/auth')];
    delete require.cache[require.resolve('../../routes/ventas')];
    delete require.cache[require.resolve('../../routes/devoluciones')];
    delete require.cache[require.resolve('../../models/Usuario')];

    // Create Express app
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieSession({
      name: 'session',
      keys: ['test-secret-key'],
      maxAge: 24 * 60 * 60 * 1000
    }));

    // Mount routes - must be required AFTER setting up mocks
    const authRoutes = require('../../routes/auth');
    const ventasRoutes = require('../../routes/ventas');
    const devolucionesRoutes = require('../../routes/devoluciones');
    app.use('/api/auth', authRoutes);
    app.use('/api/ventas', ventasRoutes);
    app.use('/api/devoluciones', devolucionesRoutes);

    // Create authenticated agent
    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
      .expect(200);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/devoluciones - Create Return', () => {
    test('should create return for single item', async () => {
      // First create a sale
      const saleData = {
        items: [
          {
            id_joya: 1, // Stock: 10
            cantidad: 2,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Efectivo',
        tipo_venta: 'Contado',
        efectivo_recibido: 200000,
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const saleId = saleResponse.body.id;
      
      // Get sale details to get item IDs
      const saleDetails = await adminAgent
        .get(`/api/ventas/${saleId}?es_venta_dia=true`);
      
      const itemVentaId = saleDetails.body.items[0].id;

      // Get stock before return
      const { supabase } = require('../../supabase-db');
      const { data: joyaBefore } = await supabase
        .from('joyas')
        .select('*')
        .eq('id', 1)
        .single();

      const stockBefore = joyaBefore.stock_actual;

      // Now create a return
      const returnData = {
        id_venta: saleId,
        items: [
          {
            id_item_venta: itemVentaId,
            cantidad: 1,
            motivo: 'Cliente insatisfecho'
          }
        ],
        tipo_devolucion: 'Parcial',
        metodo_reembolso: 'Efectivo',
        notas: 'Devolución de prueba'
      };

      const response = await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.devolucion).toBeDefined();
      expect(response.body.devolucion.id_venta).toBe(saleId);
      expect(response.body.devolucion.tipo_devolucion).toBe('Parcial');
      expect(response.body.devolucion.estado).toBe('Completada');

      // Verify stock was restored
      const { data: joyaAfter } = await supabase
        .from('joyas')
        .select('*')
        .eq('id', 1)
        .single();

      expect(joyaAfter.stock_actual).toBe(stockBefore + 1);
    });

    test('should create complete return for all items', async () => {
      // Create a sale with multiple items
      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          },
          {
            id_joya: 2,
            cantidad: 1,
            precio_unitario: 40000
          }
        ],
        metodo_pago: 'Tarjeta',
        tipo_venta: 'Contado',
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const saleId = saleResponse.body.id;
      
      // Get sale details to get item IDs
      const saleDetails = await adminAgent
        .get(`/api/ventas/${saleId}?es_venta_dia=true`);
      
      const items = saleDetails.body.items;

      // Create complete return
      const returnData = {
        id_venta: saleId,
        items: items.map(item => ({
          id_item_venta: item.id,
          cantidad: item.cantidad,
          motivo: 'Producto defectuoso'
        })),
        tipo_devolucion: 'Total',
        metodo_reembolso: 'Tarjeta',
        notas: 'Devolución total'
      };

      const response = await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.devolucion.tipo_devolucion).toBe('Total');
      expect(response.body.items_devueltos).toHaveLength(2);
    });

    test('should reject return with invalid sale id', async () => {
      const returnData = {
        id_venta: 999999,
        items: [
          {
            id_item_venta: 1,
            cantidad: 1,
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Parcial',
        metodo_reembolso: 'Efectivo'
      };

      const response = await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('no encontrada');
    });

    test('should reject return without items', async () => {
      const returnData = {
        id_venta: 1,
        items: [],
        tipo_devolucion: 'Parcial',
        metodo_reembolso: 'Efectivo'
      };

      const response = await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject return with quantity exceeding original sale', async () => {
      // Create a sale
      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Efectivo',
        tipo_venta: 'Contado',
        efectivo_recibido: 100000,
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const saleId = saleResponse.body.id;
      
      // Get sale details to get item IDs
      const saleDetails = await adminAgent
        .get(`/api/ventas/${saleId}?es_venta_dia=true`);
      
      const itemVentaId = saleDetails.body.items[0].id;

      // Try to return more than sold
      const returnData = {
        id_venta: saleId,
        items: [
          {
            id_item_venta: itemVentaId,
            cantidad: 5, // Only sold 1
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Parcial',
        metodo_reembolso: 'Efectivo'
      };

      const response = await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should update sale status after complete return', async () => {
      // Create a sale
      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Efectivo',
        tipo_venta: 'Contado',
        efectivo_recibido: 100000,
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const saleId = saleResponse.body.id;
      
      // Get sale details to get item IDs
      const saleDetails = await adminAgent
        .get(`/api/ventas/${saleId}?es_venta_dia=true`);
      
      const itemVentaId = saleDetails.body.items[0].id;

      // Create complete return
      const returnData = {
        id_venta: saleId,
        items: [
          {
            id_item_venta: itemVentaId,
            cantidad: 1,
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Total',
        metodo_reembolso: 'Efectivo'
      };

      await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      // Verify sale status was updated
      const saleDetailsResponse = await adminAgent
        .get(`/api/ventas/${saleId}`)
        ;

      expect(saleDetailsResponse.body.estado_devolucion).toBeDefined();
    });

    test('should reject unauthenticated requests', async () => {
      const returnData = {
        id_venta: 1,
        items: [
          {
            id_item_venta: 1,
            cantidad: 1,
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Parcial',
        metodo_reembolso: 'Efectivo'
      };

      const response = await request(app)
        .post('/api/devoluciones')
        .send(returnData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/devoluciones - List Returns', () => {
    test('should list all returns', async () => {
      const response = await adminAgent
        .get('/api/devoluciones')
        ;

      expect(response.status).toBe(200);
      expect(response.body.devoluciones).toBeDefined();
      expect(Array.isArray(response.body.devoluciones)).toBe(true);
    });

    test('should filter returns by sale id', async () => {
      // Create a sale and return
      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Efectivo',
        tipo_venta: 'Contado',
        efectivo_recibido: 100000,
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        .send(saleData);

      const saleId = saleResponse.body.id;
      
      // Get sale details to get items
      const saleDetails = await adminAgent
        .get(`/api/ventas/${saleId}?es_venta_dia=true`);
      
      const itemVentaId = saleDetails.body.items[0].id;

      const returnData = {
        id_venta: saleId,
        items: [
          {
            id_item_venta: itemVentaId,
            cantidad: 1,
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Total',
        metodo_reembolso: 'Efectivo'
      };

      await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      // Filter by sale id
      const response = await adminAgent
        .get(`/api/devoluciones?id_venta=${saleId}`)
        ;

      expect(response.status).toBe(200);
      expect(response.body.devoluciones).toBeDefined();
      expect(response.body.devoluciones.length).toBeGreaterThan(0);
      expect(response.body.devoluciones[0].id_venta).toBe(saleId);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/devoluciones');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/devoluciones/:id - Get Return Details', () => {
    test('should get return details', async () => {
      // Create a sale and return
      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Efectivo',
        tipo_venta: 'Contado',
        efectivo_recibido: 100000,
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const saleId = saleResponse.body.id;
      
      // Get sale details to get item IDs
      const saleDetails = await adminAgent
        .get(`/api/ventas/${saleId}?es_venta_dia=true`);
      
      const itemVentaId = saleDetails.body.items[0].id;

      const returnData = {
        id_venta: saleResponse.body.id,
        items: [
          {
            id_item_venta: itemVentaId,
            cantidad: 1,
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Total',
        metodo_reembolso: 'Efectivo'
      };

      const returnResponse = await adminAgent
        .post('/api/devoluciones')
        
        .send(returnData);

      const returnId = returnResponse.body.devolucion.id;

      // Get return details
      const response = await adminAgent
        .get(`/api/devoluciones/${returnId}`)
        ;

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(returnId);
      expect(response.body.items).toBeDefined();
    });

    test('should return 404 for non-existent return', async () => {
      const response = await adminAgent
        .get('/api/devoluciones/999999')
        ;

      expect(response.status).toBe(404);
    });
  });

  describe('Access Control', () => {
    test('only admins can create returns', async () => {
      // Create dependiente agent
      const dependienteAgent = request.agent(app);
      await dependienteAgent
        .post('/api/auth/login')
        .send({
          username: 'dependiente',
          password: 'dependiente123'
        })
        .expect(200);

      const returnData = {
        id_venta: 1,
        items: [
          {
            id_item_venta: 1,
            cantidad: 1,
            motivo: 'Test'
          }
        ],
        tipo_devolucion: 'Parcial',
        metodo_reembolso: 'Efectivo'
      };

      const response = await dependienteAgent
        .post('/api/devoluciones')
        .send(returnData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('administrador');
    });
  });
});
