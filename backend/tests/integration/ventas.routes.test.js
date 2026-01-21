/**
 * Integration Tests for Ventas (Sales) Routes
 * Tests /api/ventas/* endpoints including sales creation (contado/crédito/mixto),
 * stock validation, accounts receivable, and sale details
 */

const request = require('supertest');
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const { createMockSupabase } = require('../mocks/supabase.mock');
const { getFixtures } = require('../fixtures/data');

// Mock Supabase before requiring any modules that use it
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

describe('Ventas Routes Integration Tests', () => {
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
    delete require.cache[require.resolve('../../models/Usuario')];

    // Create Express app with required middleware
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
    app.use('/api/auth', authRoutes);
    app.use('/api/ventas', ventasRoutes);

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

  describe('POST /api/ventas - Create Sale', () => {
    describe('Venta Contado (Cash Sale)', () => {
      test('should create sale with cash payment', async () => {
        const saleData = {
          items: [
            {
              id_joya: 1, // Anillo de Oro 18K - stock: 10, precio: 80000
              cantidad: 2,
              precio_unitario: 80000
            }
          ],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          efectivo_recibido: 200000,
          descuento: 0,
          notas: 'Venta de prueba'
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.venta).toBeDefined();
        expect(response.body.venta.id).toBeDefined();
        expect(response.body.venta.subtotal).toBe(160000);
        expect(response.body.venta.total).toBe(160000);
        expect(response.body.venta.metodo_pago).toBe('Efectivo');
        expect(response.body.cambio).toBe(40000); // 200000 - 160000
      });

      test('should create sale with card payment', async () => {
        const saleData = {
          items: [
            {
              id_joya: 2, // Collar de Plata 925 - stock: 5, precio: 40000
              cantidad: 1,
              precio_unitario: 40000
            }
          ],
          metodo_pago: 'Tarjeta',
          tipo_venta: 'Contado',
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.venta.metodo_pago).toBe('Tarjeta');
        expect(response.body.venta.total).toBe(40000);
      });

      test('should create sale with transfer payment', async () => {
        const saleData = {
          items: [
            {
              id_joya: 4, // Anillo de Plata - stock: 8, precio: 18000
              cantidad: 1,
              precio_unitario: 18000
            }
          ],
          metodo_pago: 'Transferencia',
          tipo_venta: 'Contado',
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.venta.metodo_pago).toBe('Transferencia');
      });

      test('should create sale with mixed payment', async () => {
        const saleData = {
          items: [
            {
              id_joya: 1, // Anillo de Oro 18K - precio: 80000
              cantidad: 1,
              precio_unitario: 80000
            }
          ],
          metodo_pago: 'Mixto',
          tipo_venta: 'Contado',
          monto_efectivo: 30000,
          monto_tarjeta: 25000,
          monto_transferencia: 25000,
          efectivo_recibido: 35000, // 30000 + 5000 cambio
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.venta.metodo_pago).toBe('Mixto');
        expect(response.body.venta.monto_efectivo).toBe(30000);
        expect(response.body.venta.monto_tarjeta).toBe(25000);
        expect(response.body.venta.monto_transferencia).toBe(25000);
        expect(response.body.cambio).toBe(5000);
      });

      test('should apply discount correctly', async () => {
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
          efectivo_recibido: 75000,
          descuento: 5000
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.venta.subtotal).toBe(80000);
        expect(response.body.venta.descuento).toBe(5000);
        expect(response.body.venta.total).toBe(75000);
      });

      test('should reject sale with insufficient cash', async () => {
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
          efectivo_recibido: 70000, // Insufficient
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('insuficiente');
      });

      test('should reject mixed payment with incorrect total', async () => {
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
          monto_tarjeta: 20000, // Total is only 50000, not 80000
          monto_transferencia: 0,
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('no coincide');
      });
    });

    describe('Venta Crédito (Credit Sale)', () => {
      test('should create credit sale and cuenta por cobrar', async () => {
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
          id_cliente: 1, // Juan Pérez
          fecha_vencimiento: futureDate.toISOString(),
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.venta.tipo_venta).toBe('Credito');
        expect(response.body.venta.id_cliente).toBe(1);
        expect(response.body.cuenta_por_cobrar).toBeDefined();
        expect(response.body.cuenta_por_cobrar.monto_total).toBe(80000);
        expect(response.body.cuenta_por_cobrar.saldo_pendiente).toBe(80000);
        expect(response.body.cuenta_por_cobrar.estado).toBe('Pendiente');
      });

      test('should reject credit sale without client', async () => {
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
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('cliente');
      });

      test('should reject credit sale with non-existent client', async () => {
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
          id_cliente: 999, // Non-existent
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(404);
        expect(response.body.error).toContain('Cliente no encontrado');
      });
    });

    describe('Stock Validation', () => {
      test('should reject sale with insufficient stock', async () => {
        const saleData = {
          items: [
            {
              id_joya: 1, // Stock: 10
              cantidad: 15, // More than available
              precio_unitario: 80000
            }
          ],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          efectivo_recibido: 1200000,
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('stock insuficiente');
      });

      test('should reject sale with out-of-stock item', async () => {
        const saleData = {
          items: [
            {
              id_joya: 3, // Pulsera - stock: 0
              cantidad: 1,
              precio_unitario: 25000
            }
          ],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          efectivo_recibido: 25000,
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('stock insuficiente');
      });

      test('should update stock after successful sale', async () => {
        const { supabase } = require('../../supabase-db');
        
        // Get initial stock
        const { data: initialJoya } = await supabase
          .from('joyas')
          .select('*')
          .eq('id', 1)
          .single();
        
        const initialStock = initialJoya.stock_actual;

        const saleData = {
          items: [
            {
              id_joya: 1,
              cantidad: 2,
              precio_unitario: 80000
            }
          ],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          efectivo_recibido: 160000,
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);

        // Verify stock was updated
        const { data: updatedJoya } = await supabase
          .from('joyas')
          .select('*')
          .eq('id', 1)
          .single();

        expect(updatedJoya.stock_actual).toBe(initialStock - 2);
      });
    });

    describe('Validation', () => {
      test('should reject sale without items', async () => {
        const saleData = {
          items: [],
          metodo_pago: 'Efectivo',
          tipo_venta: 'Contado',
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('al menos un producto');
      });

      test('should reject sale without payment method', async () => {
        const saleData = {
          items: [
            {
              id_joya: 1,
              cantidad: 1,
              precio_unitario: 80000
            }
          ],
          tipo_venta: 'Contado',
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('método de pago');
      });

      test('should reject unauthenticated requests', async () => {
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
          efectivo_recibido: 80000,
          descuento: 0
        };

        const response = await adminAgent
          .post('/api/ventas')
          .send(saleData);

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('autenticado');
      });
    });

    describe('Multi-item Sales', () => {
      test('should create sale with multiple items', async () => {
        const saleData = {
          items: [
            {
              id_joya: 1, // Anillo - 80000
              cantidad: 1,
              precio_unitario: 80000
            },
            {
              id_joya: 2, // Collar - 40000
              cantidad: 2,
              precio_unitario: 40000
            },
            {
              id_joya: 4, // Anillo Plata - 18000
              cantidad: 1,
              precio_unitario: 18000
            }
          ],
          metodo_pago: 'Tarjeta',
          tipo_venta: 'Contado',
          descuento: 8000 // 5% discount
        };

        const response = await adminAgent
          .post('/api/ventas')
          
          .send(saleData);

        expect(response.status).toBe(201);
        expect(response.body.venta.subtotal).toBe(178000); // 80000 + 80000 + 18000
        expect(response.body.venta.descuento).toBe(8000);
        expect(response.body.venta.total).toBe(170000);
        expect(response.body.items).toHaveLength(3);
      });
    });
  });

  describe('GET /api/ventas/:id - Get Sale Details', () => {
    test('should get sale details', async () => {
      // First create a sale
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

      const createResponse = await adminAgent
        .post('/api/ventas')
        
        .send(saleData);

      const saleId = createResponse.body.venta.id;

      // Now get the sale details
      const response = await adminAgent
        .get(`/api/ventas/${saleId}`)
        ;

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(saleId);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    test('should return 404 for non-existent sale', async () => {
      const response = await adminAgent
        .get('/api/ventas/999999')
        ;

      expect(response.status).toBe(404);
    });

    test('should reject unauthenticated requests', async () => {
      const response = await adminAgent
        .get('/api/ventas/1');

      expect(response.status).toBe(401);
    });
  });

  describe('Access Control', () => {
    test('dependiente can create sales', async () => {
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

      const response = await dependienteAgent
        .post('/api/ventas')
        .send(saleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
