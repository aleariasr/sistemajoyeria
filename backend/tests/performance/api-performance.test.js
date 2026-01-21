/**
 * Performance Tests for Key API Endpoints
 * 
 * Tests response times for critical endpoints with mocked backend.
 * Thresholds are reasonable for local/mocked execution.
 * 
 * Thresholds:
 * - Simple queries: < 100ms
 * - Complex queries with filtering: < 200ms
 * - Write operations: < 300ms
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

describe('API Performance Tests (Mocked)', () => {
  let app;
  let adminAgent;
  let mockSupabase;
  let fixtures;

  // Performance thresholds (in milliseconds)
  const THRESHOLDS = {
    SIMPLE_READ: 100,     // Simple GET requests
    COMPLEX_READ: 200,    // Queries with filters/pagination
    WRITE: 300,           // POST/PUT/DELETE operations
    PUBLIC_API: 150       // Public API endpoints
  };

  beforeEach(async () => {
    // Get fresh fixtures
    fixtures = getFixtures();
    
    // Hash passwords for test users
    const adminHash = bcrypt.hashSync('admin123', 10);
    
    fixtures.usuarios = fixtures.usuarios.map(u => ({
      ...u,
      password_hash: u.username === 'admin' ? adminHash : bcrypt.hashSync('dependiente123', 10)
    }));

    // Create mock Supabase with fixtures
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the mocked module's instance
    const supabaseDb = require('../../supabase-db');
    supabaseDb.supabase = mockSupabase;
    
    // Clear require cache
    delete require.cache[require.resolve('../../routes/joyas')];
    delete require.cache[require.resolve('../../routes/ventas')];
    delete require.cache[require.resolve('../../routes/public')];
    delete require.cache[require.resolve('../../routes/auth')];
    delete require.cache[require.resolve('../../models/Joya')];

    // Create Express app
    app = express();
    app.use(bodyParser.json());
    app.use(cookieSession({
      name: 'session',
      keys: ['test-secret-key-1', 'test-secret-key-2'],
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
      sameSite: 'lax'
    }));

    // Mount routes
    const authRoutes = require('../../routes/auth');
    const joyasRoutes = require('../../routes/joyas');
    const ventasRoutes = require('../../routes/ventas');
    const publicRoutes = require('../../routes/public');

    app.use('/api/auth', authRoutes);
    app.use('/api/joyas', joyasRoutes);
    app.use('/api/ventas', ventasRoutes);
    app.use('/api/public', publicRoutes);

    // Create admin agent and login
    adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);
  });

  describe('GET /api/public/products - Public Product Listing', () => {
    it('should respond within threshold for first page', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/public/products?page=1&per_page=20')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/public/products: ${responseTime}ms (threshold: ${THRESHOLDS.PUBLIC_API}ms)`);
      
      expect(response.body.products).toBeDefined();
      expect(responseTime).toBeLessThan(THRESHOLDS.PUBLIC_API);
    });

    it('should respond within threshold with category filter', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/public/products?page=1&per_page=20&categoria=Anillos')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/public/products (filtered): ${responseTime}ms (threshold: ${THRESHOLDS.PUBLIC_API}ms)`);
      
      expect(response.body.products).toBeDefined();
      expect(responseTime).toBeLessThan(THRESHOLDS.PUBLIC_API);
    });

    it('should respond within threshold with search', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/public/products?page=1&per_page=20&busqueda=oro')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/public/products (search): ${responseTime}ms (threshold: ${THRESHOLDS.PUBLIC_API}ms)`);
      
      expect(responseTime).toBeLessThan(THRESHOLDS.PUBLIC_API);
    });
  });

  describe('GET /api/joyas - Admin Jewelry Listing', () => {
    it('should respond within threshold for listing', async () => {
      const startTime = Date.now();
      
      const response = await adminAgent
        .get('/api/joyas?pagina=1&por_pagina=20')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/joyas: ${responseTime}ms (threshold: ${THRESHOLDS.COMPLEX_READ}ms)`);
      
      expect(response.body.joyas).toBeDefined();
      expect(responseTime).toBeLessThan(THRESHOLDS.COMPLEX_READ);
    });

    it('should respond within threshold with filters', async () => {
      const startTime = Date.now();
      
      const response = await adminAgent
        .get('/api/joyas?categoria=Anillos&estado=Activo&busqueda=oro')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/joyas (filtered): ${responseTime}ms (threshold: ${THRESHOLDS.COMPLEX_READ}ms)`);
      
      expect(responseTime).toBeLessThan(THRESHOLDS.COMPLEX_READ);
    });

    it('should respond within threshold for single joya', async () => {
      const joyaId = fixtures.joyas[0].id;
      const startTime = Date.now();
      
      const response = await adminAgent
        .get(`/api/joyas/${joyaId}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/joyas/:id: ${responseTime}ms (threshold: ${THRESHOLDS.SIMPLE_READ}ms)`);
      
      expect(response.body.joya).toBeDefined();
      expect(responseTime).toBeLessThan(THRESHOLDS.SIMPLE_READ);
    });
  });

  describe('POST /api/ventas - Create Sale', () => {
    it('should respond within threshold for simple sale', async () => {
      const venta = {
        cliente_id: fixtures.clientes[0].id,
        items: [
          {
            id_joya: fixtures.joyas[0].id,
            cantidad: 1,
            precio_unitario: fixtures.joyas[0].precio,
            subtotal: fixtures.joyas[0].precio
          }
        ],
        total: fixtures.joyas[0].precio,
        tipo: 'contado',
        metodo_pago: 'efectivo',
        efectivo_recibido: fixtures.joyas[0].precio,
        cambio: 0
      };

      const startTime = Date.now();
      
      const response = await adminAgent
        .post('/api/ventas')
        .send(venta)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  POST /api/ventas: ${responseTime}ms (threshold: ${THRESHOLDS.WRITE}ms)`);
      
      expect(response.body.venta).toBeDefined();
      expect(responseTime).toBeLessThan(THRESHOLDS.WRITE);
    });

    it('should respond within threshold for multi-item sale', async () => {
      const venta = {
        cliente_id: fixtures.clientes[0].id,
        items: [
          {
            id_joya: fixtures.joyas[0].id,
            cantidad: 1,
            precio_unitario: fixtures.joyas[0].precio,
            subtotal: fixtures.joyas[0].precio
          },
          {
            id_joya: fixtures.joyas[1].id,
            cantidad: 2,
            precio_unitario: fixtures.joyas[1].precio,
            subtotal: fixtures.joyas[1].precio * 2
          }
        ],
        total: fixtures.joyas[0].precio + (fixtures.joyas[1].precio * 2),
        tipo: 'contado',
        metodo_pago: 'tarjeta'
      };

      const startTime = Date.now();
      
      const response = await adminAgent
        .post('/api/ventas')
        .send(venta)
        .expect(201);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  POST /api/ventas (multi-item): ${responseTime}ms (threshold: ${THRESHOLDS.WRITE}ms)`);
      
      expect(responseTime).toBeLessThan(THRESHOLDS.WRITE);
    });
  });

  describe('GET /api/public/products/:id - Product Detail', () => {
    it('should respond within threshold for product detail', async () => {
      const productId = fixtures.joyas[0].id;
      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/public/products/${productId}`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      console.log(`    ⏱️  /api/public/products/:id: ${responseTime}ms (threshold: ${THRESHOLDS.SIMPLE_READ}ms)`);
      
      expect(response.body.product).toBeDefined();
      expect(responseTime).toBeLessThan(THRESHOLDS.SIMPLE_READ);
    });
  });

  describe('Performance Summary Report', () => {
    it('should generate performance summary', async () => {
      const metrics = [];

      // Test key endpoints and collect metrics
      const endpoints = [
        {
          name: 'Public Products List',
          method: 'get',
          url: '/api/public/products?page=1&per_page=20',
          threshold: THRESHOLDS.PUBLIC_API,
          authenticated: false
        },
        {
          name: 'Admin Joyas List',
          method: 'get',
          url: '/api/joyas',
          threshold: THRESHOLDS.COMPLEX_READ,
          authenticated: true
        },
        {
          name: 'Joya Detail',
          method: 'get',
          url: `/api/joyas/${fixtures.joyas[0].id}`,
          threshold: THRESHOLDS.SIMPLE_READ,
          authenticated: true
        }
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const agent = endpoint.authenticated ? adminAgent : request(app);
        
        await agent[endpoint.method](endpoint.url);
        
        const responseTime = Date.now() - startTime;
        const status = responseTime < endpoint.threshold ? '✅ PASS' : '⚠️  SLOW';
        
        metrics.push({
          endpoint: endpoint.name,
          time: responseTime,
          threshold: endpoint.threshold,
          status
        });
      }

      // Print summary
      console.log('\n  📊 Performance Summary:');
      console.log('  ────────────────────────────────────────────────────────');
      metrics.forEach(m => {
        console.log(`  ${m.status} ${m.endpoint}: ${m.time}ms (threshold: ${m.threshold}ms)`);
      });
      console.log('  ────────────────────────────────────────────────────────\n');

      // All should pass
      const allPass = metrics.every(m => m.status === '✅ PASS');
      expect(allPass).toBe(true);
    });
  });
});
