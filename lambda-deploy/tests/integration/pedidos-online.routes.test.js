/**
 * Integration Tests for Online Orders Routes
 * Tests /api/public/orders/* and /api/pedidos-online/* endpoints
 */

const request = require('supertest');
const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
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
jest.mock('../../cloudinary-config', () => require('../mocks/cloudinary.mock'));

// Mock Resend
jest.mock('resend', () => require('../mocks/resend.mock'));

// Mock push notification service
jest.mock('../../services/pushNotificationService', () => ({
  enviarATodos: jest.fn().mockResolvedValue(0),
  enviarAUsuario: jest.fn().mockResolvedValue(0),
  crearPayload: jest.fn((data) => data)
}));

describe('Online Orders Routes Integration Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;
  let adminAgent;
  let dependienteAgent;

  beforeEach(async () => {
    // Get fresh fixtures for each test
    fixtures = getFixtures();
    
    // Create mock Supabase with fixtures
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the supabase instance in the mocked module
    const supabaseDb = require('../../supabase-db');
    supabaseDb.supabase = mockSupabase;

    // Create Express app
    app = express();
    
    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // Session middleware (same as production)
    app.use(cookieSession({
      name: 'session',
      keys: ['test-secret-key-1', 'test-secret-key-2'],
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
      secure: false,
      httpOnly: true
    }));

    // Mount routes
    const authRoutes = require('../../routes/auth');
    const pedidosRoutes = require('../../routes/pedidos-online');
    
    app.use('/api/auth', authRoutes);
    app.use('/api', pedidosRoutes);

    // Create authenticated agents
    adminAgent = request.agent(app);
    dependienteAgent = request.agent(app);

    // Login admin
    await adminAgent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    // Login dependiente
    await dependienteAgent
      .post('/api/auth/login')
      .send({ username: 'dependiente', password: 'dependiente123' });
  });

  describe('POST /api/public/orders - Create Online Order', () => {
    
    it('should create order successfully with valid data', async () => {
      const orderData = {
        customer: {
          nombre: 'Juan Pérez',
          email: 'juan@example.com',
          telefono: '88887777',
          direccion: 'San José, Costa Rica'
        },
        items: [
          {
            product_id: 1,
            quantity: 2
          }
        ],
        notes: 'Entrega urgente'
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBeDefined();
      expect(response.body.order.total).toBe(160000); // 2 * 80000
      expect(response.body.order.items_count).toBe(1);
      expect(response.body.order.customer_name).toBe('Juan Pérez');
    });

    it('should create order with multiple items', async () => {
      const orderData = {
        customer: {
          nombre: 'María González',
          email: 'maria@example.com',
          telefono: '77776666'
        },
        items: [
          {
            product_id: 1,
            quantity: 1
          },
          {
            product_id: 2,
            quantity: 2
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.order.total).toBe(160000); // 80000 + (2 * 40000)
      expect(response.body.order.items_count).toBe(2);
    });

    it('should fail when stock is insufficient', async () => {
      const orderData = {
        customer: {
          nombre: 'Carlos Ruiz',
          email: 'carlos@example.com',
          telefono: '66665555'
        },
        items: [
          {
            product_id: 1,
            quantity: 20 // Stock is only 10
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.toLowerCase()).toContain('stock');
    });

    it('should fail when product has zero stock', async () => {
      const orderData = {
        customer: {
          nombre: 'Ana López',
          email: 'ana@example.com',
          telefono: '55554444'
        },
        items: [
          {
            product_id: 3, // Stock is 0
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.toLowerCase()).toContain('stock');
    });

    it('should fail with missing customer name', async () => {
      const orderData = {
        customer: {
          email: 'test@example.com',
          telefono: '44443333'
        },
        items: [
          {
            product_id: 1,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.field).toBe('customer');
    });

    it('should fail with invalid email format', async () => {
      const orderData = {
        customer: {
          nombre: 'Pedro Martínez',
          email: 'invalid-email',
          telefono: '33332222'
        },
        items: [
          {
            product_id: 1,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toContain('email');
      expect(response.body.field).toBe('email');
    });

    it('should fail with invalid phone format', async () => {
      const orderData = {
        customer: {
          nombre: 'Laura Castro',
          email: 'laura@example.com',
          telefono: '123' // Too short
        },
        items: [
          {
            product_id: 1,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toContain('teléfono');
      expect(response.body.field).toBe('telefono');
    });

    it('should fail with empty items array', async () => {
      const orderData = {
        customer: {
          nombre: 'Roberto Sánchez',
          email: 'roberto@example.com',
          telefono: '22221111'
        },
        items: []
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toContain('al menos un producto');
      expect(response.body.field).toBe('items');
    });

    it('should fail with invalid quantity', async () => {
      const orderData = {
        customer: {
          nombre: 'Diana Flores',
          email: 'diana@example.com',
          telefono: '11110000'
        },
        items: [
          {
            product_id: 1,
            quantity: 0 // Invalid
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.field).toBe('quantity');
    });

    it('should sanitize customer input to prevent XSS', async () => {
      const orderData = {
        customer: {
          nombre: '<script>alert("xss")</script>Juan',
          email: 'safe@example.com',
          telefono: '99998888'
        },
        items: [
          {
            product_id: 1,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      // Verify script tags are removed or escaped
      expect(response.body.order.customer_name).not.toContain('<script>');
      expect(response.body.order.customer_name).toContain('Juan');
    });

    it('should accept order without optional direccion field', async () => {
      const orderData = {
        customer: {
          nombre: 'Felipe Vega',
          email: 'felipe@example.com',
          telefono: '87776666'
        },
        items: [
          {
            product_id: 2,
            quantity: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/public/orders')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/public/orders/:id - Get Order Details (Public)', () => {
    
    it('should return order details for valid order', async () => {
      // First create an order
      const createResponse = await request(app)
        .post('/api/public/orders')
        .send({
          customer: {
            nombre: 'Test User',
            email: 'test@example.com',
            telefono: '88889999'
          },
          items: [
            {
              product_id: 1,
              quantity: 1
            }
          ]
        });

      const orderId = createResponse.body.order.id;

      // Get order details
      const response = await request(app)
        .get(`/api/public/orders/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.total).toBe(80000);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBe(1);
    });

    it('should return 404 for non-existent order', async () => {
      const response = await request(app)
        .get('/api/public/orders/99999')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/pedidos-online - List Orders (Admin)', () => {
    
    it('should allow admin to list orders', async () => {
      const response = await adminAgent
        .get('/api/pedidos-online')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.pedidos) || Array.isArray(response.body)).toBe(true);
    });

    it('should allow dependiente to list orders', async () => {
      const response = await dependienteAgent
        .get('/api/pedidos-online')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/pedidos-online')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/pedidos-online/:id - Get Order Details (Admin)', () => {
    
    it('should allow admin to get order details', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/public/orders')
        .send({
          customer: {
            nombre: 'Admin Test',
            email: 'admintest@example.com',
            telefono: '77778888'
          },
          items: [
            {
              product_id: 1,
              quantity: 1
            }
          ]
        });

      const orderId = createResponse.body.order.id;

      const response = await adminAgent
        .get(`/api/pedidos-online/${orderId}`)
        .expect(200);

      expect(response.body.id).toBe(orderId);
      expect(response.body.items).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/pedidos-online/1')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/pedidos-online/:id/estado - Update Order Status (Admin)', () => {
    
    it('should require authentication', async () => {
      const response = await request(app)
        .patch('/api/pedidos-online/1/estado')
        .send({ estado: 'Confirmado' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject invalid estado', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/public/orders')
        .send({
          customer: {
            nombre: 'Status Test',
            email: 'status@example.com',
            telefono: '66667777'
          },
          items: [
            {
              product_id: 1,
              quantity: 1
            }
          ]
        });

      const orderId = createResponse.body.order.id;

      const response = await adminAgent
        .patch(`/api/pedidos-online/${orderId}/estado`)
        .send({ estado: 'InvalidStatus' })
        .expect(400);

      expect(response.body.error).toContain('inválido');
      expect(response.body.field).toBe('estado');
    });
  });

  describe('PATCH /api/pedidos-online/:id - Update Order Notes (Admin)', () => {
    
    it('should allow admin to update internal notes', async () => {
      // Create an order first
      const createResponse = await request(app)
        .post('/api/public/orders')
        .send({
          customer: {
            nombre: 'Notes Test',
            email: 'notes@example.com',
            telefono: '55556666'
          },
          items: [
            {
              product_id: 1,
              quantity: 1
            }
          ]
        });

      const orderId = createResponse.body.order.id;

      const response = await adminAgent
        .patch(`/api/pedidos-online/${orderId}`)
        .send({ notas_internas: 'Cliente preferencial' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch('/api/pedidos-online/1')
        .send({ notas_internas: 'Test' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/pedidos-online/resumen/stats - Get Order Statistics (Admin)', () => {
    
    it('should allow admin to get order stats', async () => {
      const response = await adminAgent
        .get('/api/pedidos-online/resumen/stats')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/pedidos-online/resumen/stats')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });
});
