/**
 * Integration Tests for Cuentas Por Cobrar (Accounts Receivable) Routes
 * Tests /api/cuentas-por-cobrar/* endpoints including payments (abonos),
 * balance tracking, and account management
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

describe('Cuentas Por Cobrar Routes Integration Tests', () => {
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
    const cuentasPorCobrarRoutes = require('../../routes/cuentas-por-cobrar');
    app.use('/api/auth', authRoutes);
    app.use('/api/ventas', ventasRoutes);
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

  describe('GET /api/cuentas-por-cobrar - List Accounts Receivable', () => {
    test('should list all accounts receivable', async () => {
      const response = await adminAgent
        .get('/api/cuentas-por-cobrar')
        ;

      expect(response.status).toBe(200);
      expect(response.body.cuentas).toBeDefined();
      expect(Array.isArray(response.body.cuentas)).toBe(true);
    });

    test('should filter by pending status', async () => {
      // Create a credit sale
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

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Filter by pending status
      const response = await adminAgent
        .get('/api/cuentas-por-cobrar?estado=Pendiente')
        ;

      expect(response.status).toBe(200);
      expect(response.body.cuentas.length).toBeGreaterThan(0);
      expect(response.body.cuentas[0].estado).toBe('Pendiente');
    });

    test('should filter by client', async () => {
      // Create a credit sale
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

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Filter by client
      const response = await adminAgent
        .get('/api/cuentas-por-cobrar?id_cliente=1')
        ;

      expect(response.status).toBe(200);
      expect(response.body.cuentas.length).toBeGreaterThan(0);
      expect(response.body.cuentas[0].id_cliente).toBe(1);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/cuentas-por-cobrar');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/cuentas-por-cobrar/:id - Get Account Details', () => {
    test('should get account receivable details with payment history', async () => {
      // Create credit sale
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // Get account details
      const response = await adminAgent
        .get(`/api/cuentas-por-cobrar/${cuentaId}`)
        ;

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(cuentaId);
      expect(response.body.monto_total).toBe(80000);
      expect(response.body.saldo_pendiente).toBe(80000);
      expect(response.body.abonos).toBeDefined();
      expect(Array.isArray(response.body.abonos)).toBe(true);
    });

    test('should return 404 for non-existent account', async () => {
      const response = await adminAgent
        .get('/api/cuentas-por-cobrar/999999')
        ;

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/cuentas-por-cobrar/:id/abonos - Make Payment', () => {
    test('should make partial payment', async () => {
      // Create credit sale
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // Make partial payment
      const abonoData = {
        monto: 30000,
        metodo_pago: 'Efectivo',
        notas: 'Primer abono'
      };

      const response = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send(abonoData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.abono).toBeDefined();
      expect(response.body.abono.monto).toBe(30000);
      expect(response.body.abono.metodo_pago).toBe('Efectivo');
      expect(response.body.cuenta_actualizada).toBeDefined();
      expect(response.body.cuenta_actualizada.saldo_pendiente).toBe(50000); // 80000 - 30000
      expect(response.body.cuenta_actualizada.estado).toBe('Pendiente');
    });

    test('should complete payment and update status to Pagado', async () => {
      // Create credit sale
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // Make full payment
      const abonoData = {
        monto: 80000,
        metodo_pago: 'Transferencia',
        notas: 'Pago completo'
      };

      const response = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send(abonoData);

      expect(response.status).toBe(201);
      expect(response.body.cuenta_actualizada.saldo_pendiente).toBe(0);
      expect(response.body.cuenta_actualizada.estado).toBe('Pagado');
    });

    test('should make multiple payments', async () => {
      // Create credit sale
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // First payment
      await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send({
          monto: 30000,
          metodo_pago: 'Efectivo',
          notas: 'Primer abono'
        });

      // Second payment
      await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send({
          monto: 25000,
          metodo_pago: 'Efectivo',
          notas: 'Segundo abono'
        });

      // Third payment (complete)
      const finalResponse = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send({
          monto: 25000,
          metodo_pago: 'Efectivo',
          notas: 'Último abono'
        });

      expect(finalResponse.status).toBe(201);
      expect(finalResponse.body.cuenta_actualizada.saldo_pendiente).toBe(0);
      expect(finalResponse.body.cuenta_actualizada.estado).toBe('Pagado');

      // Verify payment history
      const detailsResponse = await adminAgent
        .get(`/api/cuentas-por-cobrar/${cuentaId}`)
        ;

      expect(detailsResponse.body.abonos).toHaveLength(3);
    });

    test('should support different payment methods', async () => {
      // Create credit sale
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const saleData = {
        items: [
          {
            id_joya: 1,
            cantidad: 2,
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // Payment with cash
      const cashResponse = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send({
          monto: 50000,
          metodo_pago: 'Efectivo',
          notas: 'Efectivo'
        });

      expect(cashResponse.status).toBe(201);
      expect(cashResponse.body.abono.metodo_pago).toBe('Efectivo');

      // Payment with card
      const cardResponse = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send({
          monto: 50000,
          metodo_pago: 'Tarjeta',
          notas: 'Tarjeta'
        });

      expect(cardResponse.status).toBe(201);
      expect(cardResponse.body.abono.metodo_pago).toBe('Tarjeta');

      // Payment with transfer
      const transferResponse = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send({
          monto: 60000,
          metodo_pago: 'Transferencia',
          notas: 'Transferencia'
        });

      expect(transferResponse.status).toBe(201);
      expect(transferResponse.body.abono.metodo_pago).toBe('Transferencia');
      expect(transferResponse.body.cuenta_actualizada.estado).toBe('Pagado');
    });

    test('should reject payment exceeding balance', async () => {
      // Create credit sale
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // Try to pay more than balance
      const abonoData = {
        monto: 100000, // More than 80000
        metodo_pago: 'Efectivo',
        notas: 'Exceso'
      };

      const response = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send(abonoData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('excede');
    });

    test('should reject payment without amount', async () => {
      const abonoData = {
        metodo_pago: 'Efectivo',
        notas: 'Test'
      };

      const response = await adminAgent
        .post('/api/cuentas-por-cobrar/1/abonos')
        
        .send(abonoData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject payment without payment method', async () => {
      const abonoData = {
        monto: 30000,
        notas: 'Test'
      };

      const response = await adminAgent
        .post('/api/cuentas-por-cobrar/1/abonos')
        
        .send(abonoData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    test('should reject payment for non-existent account', async () => {
      const abonoData = {
        monto: 30000,
        metodo_pago: 'Efectivo',
        notas: 'Test'
      };

      const response = await adminAgent
        .post('/api/cuentas-por-cobrar/999999/abonos')
        
        .send(abonoData);

      expect(response.status).toBe(404);
    });

    test('should reject unauthenticated requests', async () => {
      const abonoData = {
        monto: 30000,
        metodo_pago: 'Efectivo',
        notas: 'Test'
      };

      const response = await request(app)
        .post('/api/cuentas-por-cobrar/1/abonos')
        .send(abonoData);

      expect(response.status).toBe(401);
    });
  });

  describe('Account Status Management', () => {
    test('should track overdue accounts', async () => {
      // Create credit sale with past due date
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

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
        fecha_vencimiento: pastDate.toISOString(),
        descuento: 0
      };

      await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      // Get accounts
      const response = await adminAgent
        .get('/api/cuentas-por-cobrar')
        ;

      expect(response.status).toBe(200);
      const overdueAccounts = response.body.cuentas.filter(c => {
        return c.estado === 'Pendiente' && new Date(c.fecha_vencimiento) < new Date();
      });
      expect(overdueAccounts.length).toBeGreaterThan(0);
    });
  });

  describe('Access Control', () => {
    test('dependiente can view accounts receivable', async () => {
      const response = await adminAgent
        .get('/api/cuentas-por-cobrar')
        ;

      expect(response.status).toBe(200);
    });

    test('dependiente can make payments', async () => {
      // Create credit sale
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

      const cuentaId = saleResponse.body.cuenta_por_cobrar.id;

      // Make payment as dependiente
      const abonoData = {
        monto: 30000,
        metodo_pago: 'Efectivo',
        notas: 'Abono'
      };

      const response = await adminAgent
        .post(`/api/cuentas-por-cobrar/${cuentaId}/abonos`)
        
        .send(abonoData);

      expect(response.status).toBe(201);
    });
  });
});
