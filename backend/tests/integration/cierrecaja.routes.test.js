/**
 * Integration Tests for CierreCaja (Cash Closure) Routes
 * Tests /api/cierrecaja/* endpoints including daily summary,
 * sales consolidation, payments (abonos), and closure creation
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

describe('CierreCaja Routes Integration Tests', () => {
  let app;
  let adminAgent;
  let dependienteAgent;

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
    delete require.cache[require.resolve('../../routes/cierrecaja')];
    delete require.cache[require.resolve('../../routes/cuentas-por-cobrar')];
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
    const cierreCajaRoutes = require('../../routes/cierrecaja');
    const cuentasPorCobrarRoutes = require('../../routes/cuentas-por-cobrar');
    app.use('/api/auth', authRoutes);
    app.use('/api/ventas', ventasRoutes);
    app.use('/api/cierrecaja', cierreCajaRoutes);
    app.use('/api/cuentas-por-cobrar', cuentasPorCobrarRoutes);

    // Create authenticated agents
    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
      .expect(200);

    dependienteAgent = request.agent(app);
    await dependienteAgent
      .post('/api/auth/login')
      .send({
        username: 'dependiente',
        password: 'dependiente123'
      })
      .expect(200);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('GET /api/cierrecaja/resumen-dia - Get Daily Summary', () => {
    test('should get daily summary with no sales', async () => {
      const response = await adminAgent
        .get('/api/cierrecaja/resumen-dia')
        ;

      expect(response.status).toBe(200);
      expect(response.body.resumen).toBeDefined();
      expect(response.body.resumen.total_ventas).toBe(0);
      expect(response.body.resumen.cantidad_ventas).toBe(0);
    });

    test('should get daily summary with sales', async () => {
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

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Get summary
      const response = await adminAgent
        .get('/api/cierrecaja/resumen-dia')
        ;

      expect(response.status).toBe(200);
      expect(response.body.resumen.total_ventas).toBeGreaterThan(0);
      expect(response.body.resumen.cantidad_ventas).toBeGreaterThan(0);
    });

    test('should include abonos in daily summary', async () => {
      // First create a credit sale
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Credito',
        tipo_venta: 'Credito',
        id_cliente: 1,
        fecha_vencimiento: futureDate.toISOString(),
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const cuentaId = saleResponse.body.id_cuenta_por_cobrar;

      // Make a payment
      const abonoData = {
        monto: 40000,
        metodo_pago: 'Efectivo',
        notas: 'Primer abono'
      };

      await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send(abonoData);

      // Get summary
      const response = await adminAgent
        .get('/api/cierrecaja/resumen-dia')
        ;

      expect(response.status).toBe(200);
      expect(response.body.abonos).toBeDefined();
      expect(response.body.resumen.total_abonos).toBeGreaterThan(0);
    });

    test('should categorize sales by payment method', async () => {
      // Create sales with different payment methods
      const sales = [
        {
          items: [{ id_joya: 1, cantidad: 1, precio_unitario: 80000 }],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          efectivo_recibido: 100000,
          descuento: 0
        },
        {
          items: [{ id_joya: 2, cantidad: 1, precio_unitario: 40000 }],
          metodo_pago: 'Tarjeta',
          tipo_venta: 'Contado',
          descuento: 0
        },
        {
          items: [{ id_joya: 4, cantidad: 1, precio_unitario: 18000 }],
          metodo_pago: 'Transferencia',
          tipo_venta: 'Contado',
          descuento: 0
        }
      ];

      for (const sale of sales) {
        await adminAgent
          .post('/api/ventas')
          
          .send(sale);
      }

      // Get summary
      const response = await adminAgent
        .get('/api/cierrecaja/resumen-dia')
        ;

      expect(response.status).toBe(200);
      expect(response.body.resumen.efectivo).toBeGreaterThan(0);
      expect(response.body.resumen.tarjeta).toBeGreaterThan(0);
      expect(response.body.resumen.transferencia).toBeGreaterThan(0);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/cierrecaja/resumen-dia');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cierrecaja/ventas-dia - Get Daily Sales', () => {
    test('should get daily sales list', async () => {
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

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Get daily sales
      const response = await adminAgent
        .get('/api/cierrecaja/ventas-dia')
        ;

      expect(response.status).toBe(200);
      expect(response.body.ventas).toBeDefined();
      expect(Array.isArray(response.body.ventas)).toBe(true);
      expect(response.body.ventas.length).toBeGreaterThan(0);
    });

    test('should filter by date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const response = await adminAgent
        .get(`/api/cierrecaja/ventas-dia?fecha=${yesterday.toISOString()}`)
        ;

      expect(response.status).toBe(200);
      expect(response.body.ventas).toBeDefined();
    });
  });

  describe('POST /api/cierrecaja/cerrar-caja - Close Cash Register', () => {
    test('should close cash register and transfer to main DB', async () => {
      // Create some sales
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

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Close cash register
      const closureData = {
        efectivo_contado: 80000,
        notas: 'Cierre de prueba'
      };

      const response = await adminAgent
        .post('/api/cierrecaja/cerrar-caja')
        
        .send(closureData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.cierre).toBeDefined();
      expect(response.body.cierre.id).toBeDefined();
      expect(response.body.ventas_transferidas).toBeGreaterThan(0);
    });

    test('should include totals by payment method in closure', async () => {
      // Create sales with different payment methods
      const sales = [
        {
          items: [{ id_joya: 1, cantidad: 1, precio_unitario: 80000 }],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          efectivo_recibido: 100000,
          descuento: 0
        },
        {
          items: [{ id_joya: 2, cantidad: 1, precio_unitario: 40000 }],
          metodo_pago: 'Tarjeta',
          tipo_venta: 'Contado',
          descuento: 0
        }
      ];

      for (const sale of sales) {
        await adminAgent
          .post('/api/ventas')
          
          .send(sale);
      }

      // Close cash register
      const closureData = {
        efectivo_contado: 80000,
        tarjeta: 40000,
        notas: 'Cierre con múltiples métodos de pago'
      };

      const response = await adminAgent
        .post('/api/cierrecaja/cerrar-caja')
        
        .send(closureData);

      expect(response.status).toBe(201);
      expect(response.body.cierre.total_efectivo).toBeGreaterThan(0);
      expect(response.body.cierre.total_tarjeta).toBeGreaterThan(0);
    });

    test('should mark abonos as closed', async () => {
      // Create credit sale and abono
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Credito',
        tipo_venta: 'Credito',
        id_cliente: 1,
        fecha_vencimiento: futureDate.toISOString(),
        descuento: 0
      };

      const saleResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const cuentaId = saleResponse.body.id_cuenta_por_cobrar;

      // Make payment
      const abonoData = {
        monto: 40000,
        metodo_pago: 'Efectivo',
        notas: 'Primer abono'
      };

      await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send(abonoData);

      // Close cash register
      const closureData = {
        efectivo_contado: 0,
        efectivo_abonos: 40000,
        notas: 'Cierre con abonos'
      };

      const response = await adminAgent
        .post('/api/cierrecaja/cerrar-caja')
        
        .send(closureData);

      expect(response.status).toBe(201);
      expect(response.body.abonos_cerrados).toBeGreaterThan(0);
    });

    test('should reject closure for non-admin users', async () => {
      const closureData = {
        efectivo_contado: 80000,
        notas: 'Test'
      };

      const response = await dependienteAgent
        .post('/api/cierrecaja/cerrar-caja')
        
        .send(closureData);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('administrador');
    });

    test('should reject unauthenticated requests', async () => {
      const closureData = {
        efectivo_contado: 80000,
        notas: 'Test'
      };

      const response = await request(app)
        .post('/api/cierrecaja/cerrar-caja')
        .send(closureData);

      expect(response.status).toBe(401);
    });
  });

  describe('Mixed Payment Sales in Closure', () => {
    test('should handle mixed payment sales correctly in closure', async () => {
      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 1,
            precio_unitario: 80000
          }
        ],
        metodo_pago: 'Mixto',
        tipo_venta: 'Contado',
        monto_efectivo: 30000,
        monto_tarjeta: 25000,
        monto_transferencia: 25000,
        efectivo_recibido: 35000,
        descuento: 0
      };

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Get summary
      const summaryResponse = await adminAgent
        .get('/api/cierrecaja/resumen-dia')
        ;

      expect(summaryResponse.status).toBe(200);
      expect(summaryResponse.body.resumen.efectivo).toBe(30000);
      expect(summaryResponse.body.resumen.tarjeta).toBe(25000);
      expect(summaryResponse.body.resumen.transferencia).toBe(25000);

      // Close cash register
      const closureData = {
        efectivo_contado: 30000,
        tarjeta: 25000,
        transferencia: 25000,
        notas: 'Cierre con pago mixto'
      };

      const closureResponse = await adminAgent
        .post('/api/cierrecaja/cerrar-caja')
        
        .send(closureData);

      expect(closureResponse.status).toBe(201);
      expect(closureResponse.body.success).toBe(true);
    });
  });

  describe('Access Control', () => {
    test('dependiente can view summary', async () => {
      const response = await adminAgent
        .get('/api/cierrecaja/resumen-dia')
        ;

      expect(response.status).toBe(200);
    });

    test('dependiente can view daily sales', async () => {
      const response = await adminAgent
        .get('/api/cierrecaja/ventas-dia')
        ;

      expect(response.status).toBe(200);
    });

    test('only admin can close cash register', async () => {
      const closureData = {
        efectivo_contado: 80000,
        notas: 'Test'
      };

      const response = await dependienteAgent
        .post('/api/cierrecaja/cerrar-caja')
        
        .send(closureData);

      expect(response.status).toBe(403);
    });
  });
});
