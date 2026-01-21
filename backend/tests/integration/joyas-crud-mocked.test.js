/**
 * Comprehensive Mocked CRUD Tests for Joyas
 * Tests create, read, update, delete with full mocking and no DB dependencies
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
    url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/new-test.jpg',
    publicId: 'new_test_image',
    width: 800,
    height: 600,
    format: 'jpg'
  }),
  deleteImage: jest.fn().mockResolvedValue({ result: 'ok' })
}));

// Mock Resend
jest.mock('resend', () => require('../mocks/resend.mock'));

// Mock upload middleware
jest.mock('../../middleware/upload', () => ({
  uploadMiddleware: (req, res, next) => next(),
  cleanupTempFile: jest.fn()
}));

const joyasRoutes = require('../../routes/joyas');

describe('Joyas CRUD - Comprehensive Mocked Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;
  let authCookie;

  beforeEach(async () => {
    // Get fresh fixtures for each test
    fixtures = getFixtures();
    
    // Hash password for admin user
    const adminHash = bcrypt.hashSync('admin123', 10);
    
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
        password_hash: bcrypt.hashSync('dep123', 10),
        role: 'dependiente',
        fecha_creacion: '2024-01-01T00:00:00Z'
      }
    ];

    // Create mock Supabase with fixtures
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the supabase instance in the mocked module
    const supabaseDb = require('../../supabase-db');
    supabaseDb.supabase = mockSupabase;

    // Clear the require cache for routes to pick up new mock
    delete require.cache[require.resolve('../../routes/joyas')];
    delete require.cache[require.resolve('../../routes/auth')];
    delete require.cache[require.resolve('../../models/Joya')];
    delete require.cache[require.resolve('../../models/Usuario')];
    delete require.cache[require.resolve('../../models/MovimientoInventario')];
    delete require.cache[require.resolve('../../models/VarianteProducto')];
    delete require.cache[require.resolve('../../models/ProductoCompuesto')];
    
    // Create Express app
    app = express();
    
    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    
    // Session middleware
    app.use(cookieSession({
      name: 'session',
      keys: ['test-secret-key'],
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
      sameSite: 'lax'
    }));

    // Mount routes
    const authRoutes = require('../../routes/auth');
    app.use('/api/auth', authRoutes);
    app.use('/api/joyas', joyasRoutes);

    // Login to get auth cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    
    authCookie = loginRes.headers['set-cookie'];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CREATE - POST /api/joyas', () => {
    it('should create a new joya with valid data', async () => {
      const newJoya = {
        codigo: 'TEST-001',
        nombre: 'Test Joya',
        descripcion: 'Test description',
        categoria: 'Test',
        proveedor: 'Test Provider',
        costo: 10000,
        precio_venta: 15000,
        moneda: 'CRC',
        stock_actual: 5,
        stock_minimo: 2,
        ubicacion: 'Test Location',
        estado: 'Activo',
        mostrar_en_storefront: true
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', authCookie)
        .send(newJoya)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('mensaje');
      expect(response.body.mensaje).toMatch(/creada correctamente/i);
    });

    it('should reject duplicate codigo (case-insensitive)', async () => {
      const newJoya = {
        codigo: 'anillo-001', // Lowercase of existing ANILLO-001
        nombre: 'Duplicate Joya',
        descripcion: 'Test description',
        categoria: 'Test',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', authCookie)
        .send(newJoya)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
      expect(Array.isArray(response.body.errores)).toBe(true);
      expect(response.body.errores[0]).toMatch(/código ya existe/i);
    });

    it('should reject invalid data (missing required fields)', async () => {
      const invalidJoya = {
        codigo: 'TEST-002'
        // Missing nombre, costo, precio_venta, stock_actual
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', authCookie)
        .send(invalidJoya)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
      expect(Array.isArray(response.body.errores)).toBe(true);
      expect(response.body.errores.length).toBeGreaterThan(0);
    });

    it('should reject negative stock_actual', async () => {
      const invalidJoya = {
        codigo: 'TEST-003',
        nombre: 'Test Joya',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: -5, // Invalid
        stock_minimo: 2
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', authCookie)
        .send(invalidJoya)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
      expect(Array.isArray(response.body.errores)).toBe(true);
      const hasStockError = response.body.errores.some(e => e.toLowerCase().includes('stock'));
      expect(hasStockError).toBe(true);
    });

    it('should require authentication', async () => {
      const newJoya = {
        codigo: 'TEST-004',
        nombre: 'Test Joya',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2
      };

      await request(app)
        .post('/api/joyas')
        .send(newJoya)
        .expect(401);
    });
  });

  describe('READ - GET /api/joyas/:id', () => {
    it('should get a joya by id', async () => {
      const response = await request(app)
        .get('/api/joyas/1')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.codigo).toBe('ANILLO-001');
      expect(response.body.nombre).toBe('Anillo de Oro 18K');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app)
        .get('/api/joyas/99999')
        .set('Cookie', authCookie)
        .expect(404);
    });

    it('should include variants if product has them', async () => {
      const response = await request(app)
        .get('/api/joyas/6') // Anillo de Diamantes with variants
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.es_producto_variante).toBe(true);
      expect(response.body).toHaveProperty('variantes');
      expect(Array.isArray(response.body.variantes)).toBe(true);
      expect(response.body.variantes.length).toBeGreaterThan(0);
    });

    it('should include components if product is a set', async () => {
      const response = await request(app)
        .get('/api/joyas/11') // Set Trio de Pulseras
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.es_producto_compuesto).toBe(true);
      expect(response.body).toHaveProperty('componentes');
      expect(Array.isArray(response.body.componentes)).toBe(true);
      expect(response.body.componentes.length).toBeGreaterThan(0);
    });
  });

  describe('UPDATE - PUT /api/joyas/:id', () => {
    it('should update a joya', async () => {
      const updates = {
        nombre: 'Updated Name',
        precio_venta: 90000,
        codigo: 'ANILLO-001', // Keep same to avoid duplicate error
        costo: 50000,
        stock_actual: 10,
        stock_minimo: 2
      };

      const response = await request(app)
        .put('/api/joyas/1')
        .set('Cookie', authCookie)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('mensaje');
      expect(response.body.mensaje).toMatch(/actualizada correctamente/i);
      
      // Verify the update persisted
      const joya = mockSupabase.getFixtures('joyas').find(j => j.id === 1);
      expect(joya.nombre).toBe(updates.nombre);
      expect(joya.precio_venta).toBe(updates.precio_venta);
    });

    it('should register stock movement when stock changes', async () => {
      const originalJoya = fixtures.joyas.find(j => j.id === 1);
      const originalStock = originalJoya.stock_actual;

      const updates = {
        codigo: originalJoya.codigo, // Keep same
        nombre: originalJoya.nombre,
        costo: originalJoya.costo,
        precio_venta: originalJoya.precio_venta,
        stock_actual: originalStock + 10,
        stock_minimo: originalJoya.stock_minimo,
        motivo_cambio_stock: 'Restock from supplier'
      };

      await request(app)
        .put('/api/joyas/1')
        .set('Cookie', authCookie)
        .send(updates)
        .expect(200);

      // Verify stock movement was registered
      const movimientos = mockSupabase.getFixtures('movimientos_inventario');
      const newMovement = movimientos.find(m => 
        m.id_joya === 1 && 
        m.stock_despues === updates.stock_actual
      );
      
      expect(newMovement).toBeDefined();
      expect(newMovement.stock_antes).toBe(originalStock);
    });

    it('should reject duplicate codigo on update (case-insensitive)', async () => {
      const originalJoya = fixtures.joyas.find(j => j.id === 1);
      const updates = {
        codigo: 'collar-001', // Lowercase of existing COLLAR-001 (id=2)
        nombre: originalJoya.nombre,
        costo: originalJoya.costo,
        precio_venta: originalJoya.precio_venta,
        stock_actual: originalJoya.stock_actual,
        stock_minimo: originalJoya.stock_minimo
      };

      const response = await request(app)
        .put('/api/joyas/1') // Updating ANILLO-001
        .set('Cookie', authCookie)
        .send(updates)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
      expect(Array.isArray(response.body.errores)).toBe(true);
      expect(response.body.errores[0]).toMatch(/código ya existe/i);
    });

    it('should allow updating own codigo with different case', async () => {
      const originalJoya = fixtures.joyas.find(j => j.id === 1);
      const updates = {
        codigo: 'anillo-001', // Same codigo, different case
        nombre: originalJoya.nombre,
        costo: originalJoya.costo,
        precio_venta: originalJoya.precio_venta,
        stock_actual: originalJoya.stock_actual,
        stock_minimo: originalJoya.stock_minimo
      };

      const response = await request(app)
        .put('/api/joyas/1')
        .set('Cookie', authCookie)
        .send(updates)
        .expect(200);

      expect(response.body.mensaje).toMatch(/actualizada correctamente/i);
      
      const joya = mockSupabase.getFixtures('joyas').find(j => j.id === 1);
      expect(joya.codigo.toLowerCase()).toBe('anillo-001');
    });

    it('should return 404 for non-existent id', async () => {
      await request(app)
        .put('/api/joyas/99999')
        .set('Cookie', authCookie)
        .send({ nombre: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE - DELETE /api/joyas/:id', () => {
    it('should delete a joya with no dependencies', async () => {
      const joyaId = 7; // ANILLO-004 - no dependencies

      const response = await request(app)
        .delete(`/api/joyas/${joyaId}`)
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.eliminado).toBe(true);

      // Verify joya was deleted or marked as descontinuado
      const joyas = mockSupabase.getFixtures('joyas');
      const joya = joyas.find(j => j.id === joyaId);
      // Either deleted or marked as descontinuado
      expect(!joya || joya.estado === 'Descontinuado').toBe(true);
    });

    it('should block deletion if joya has variants', async () => {
      const joyaId = 6; // Anillo de Diamantes - has variants

      const response = await request(app)
        .delete(`/api/joyas/${joyaId}`)
        .set('Cookie', authCookie)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Verify joya was NOT deleted (may be marked descontinuado)
      const joyas = mockSupabase.getFixtures('joyas');
      const joya = joyas.find(j => j.id === joyaId);
      expect(joya).toBeDefined();
    });

    it('should block deletion if joya is component of a set', async () => {
      const joyaId = 3; // Pulsera de Plata - component of SET-001

      const response = await request(app)
        .delete(`/api/joyas/${joyaId}`)
        .set('Cookie', authCookie)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      
      // Verify joya was NOT deleted
      const joyas = mockSupabase.getFixtures('joyas');
      const joya = joyas.find(j => j.id === joyaId);
      expect(joya).toBeDefined();
    });

    it('should block deletion if joya has sale history', async () => {
      // Add a sale item referencing joya id=1
      const fixtures = mockSupabase.getFixtures('items_venta');
      fixtures.push({
        id: 1,
        id_venta: 1,
        id_joya: 1,
        cantidad: 1,
        precio_unitario: 80000
      });
      mockSupabase.setFixtures('items_venta', fixtures);

      const response = await request(app)
        .delete('/api/joyas/1')
        .set('Cookie', authCookie)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent id', async () => {
      await request(app)
        .delete('/api/joyas/99999')
        .set('Cookie', authCookie)
        .expect(404);
    });
  });

  describe('Code Verification - GET /api/joyas/verificar-codigo', () => {
    it('should detect exact duplicate codigo (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo')
        .query({ codigo: 'anillo-001' }) // Lowercase of ANILLO-001
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.existe).toBe(true);
      expect(response.body.codigo_existente).toBeDefined();
      expect(response.body.codigo_existente.codigo.toLowerCase()).toBe('anillo-001');
    });

    it('should not find non-existent codigo', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo')
        .query({ codigo: 'NONEXISTENT-999' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.existe).toBe(false);
      expect(response.body.codigo_existente).toBeNull();
    });

    it('should exclude specific joya when checking (for updates)', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo')
        .query({ codigo: 'ANILLO-001', excluir_id: 1 })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.existe).toBe(false);
    });

    it('should find similar codigos', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo')
        .query({ codigo: 'ANILLO-999' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.existe).toBe(false);
      expect(response.body.similares).toBeDefined();
      expect(Array.isArray(response.body.similares)).toBe(true);
      
      // Should find ANILLO-001, ANILLO-002, etc.
      const hasAnilloPrefix = response.body.similares.some(s => 
        s.codigo.toUpperCase().startsWith('ANILLO-')
      );
      expect(hasAnilloPrefix).toBe(true);
    });
  });
});
