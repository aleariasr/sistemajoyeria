/**
 * Integration Tests for Joyas (Jewelry) Routes
 * Tests /api/joyas/* endpoints including CRUD operations, validation, filtering
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
jest.mock('../../cloudinary-config', () => {
  const cloudinaryMock = require('../mocks/cloudinary.mock');
  return {
    uploadImage: jest.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/test-cloud/image/upload/v1/test.jpg',
      publicId: 'test_image_1',
      width: 800,
      height: 600,
      format: 'jpg'
    }),
    deleteImage: jest.fn().mockResolvedValue({ result: 'ok' })
  };
});

// Mock Resend
jest.mock('resend', () => require('../mocks/resend.mock'));

// Mock upload middleware
jest.mock('../../middleware/upload', () => ({
  uploadMiddleware: (req, res, next) => next(),
  cleanupTempFile: jest.fn()
}));

const joyasRoutes = require('../../routes/joyas');

describe('Joyas Routes Integration Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;

  beforeEach(async () => {
    // Get fresh fixtures for each test
    fixtures = getFixtures();
    
    // Hash password for admin user - bcrypt hashes are consistent with same salt
    const adminHash = bcrypt.hashSync('admin123', 10);
    
    // Override usuarios fixtures with proper password_hash field
    fixtures.usuarios = [
      {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        password_hash: adminHash, // Supabase uses password_hash, not password
        role: 'administrador',
        fecha_creacion: '2024-01-01T00:00:00Z'
      }
    ];

    // Create mock Supabase with correct fixtures
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the supabase instance in the mocked module
    const supabaseDb = require('../../supabase-db');
    supabaseDb.supabase = mockSupabase;

    // Clear the require cache for routes to pick up new mock
    delete require.cache[require.resolve('../../routes/joyas')];
    delete require.cache[require.resolve('../../routes/auth')];
    delete require.cache[require.resolve('../../models/Joya')];
    delete require.cache[require.resolve('../../models/Usuario')];
    
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

    // Mount auth routes for login - must be required AFTER setting up mocks
    const authRoutes = require('../../routes/auth');
    app.use('/api/auth', authRoutes);
    
    // Mount joyas routes
    const joyasRoutes = require('../../routes/joyas');
    app.use('/api/joyas', joyasRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/joyas - List all joyas', () => {
    let agent;

    beforeEach(async () => {
      // Create agent and login
      agent = request.agent(app);
      await agent
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
        .expect(200);
    });

    it('should return all joyas without filters', async () => {
      const response = await agent
        .get('/api/joyas')
        .expect(200);

      expect(response.body).toHaveProperty('joyas');
      expect(Array.isArray(response.body.joyas)).toBe(true);
      expect(response.body.joyas.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('pagina');
      expect(response.body).toHaveProperty('por_pagina');
    });

    it('should filter joyas by busqueda (search)', async () => {
      const response = await agent
        .get('/api/joyas?busqueda=anillo')
        .expect(200);

      expect(response.body.joyas).toBeDefined();
      expect(response.body.joyas.length).toBeGreaterThan(0);
      
      // All results should contain "anillo" in codigo or nombre
      response.body.joyas.forEach(joya => {
        const matchesCodigo = joya.codigo.toLowerCase().includes('anillo');
        const matchesNombre = joya.nombre.toLowerCase().includes('anillo');
        expect(matchesCodigo || matchesNombre).toBe(true);
      });
    });

    it('should filter joyas by categoria', async () => {
      const response = await request(app)
        .get('/api/joyas?categoria=Anillos')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.joyas).toBeDefined();
      response.body.joyas.forEach(joya => {
        expect(joya.categoria).toBe('Anillos');
      });
    });

    it('should filter joyas by estado', async () => {
      const response = await request(app)
        .get('/api/joyas?estado=Activo')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.joyas).toBeDefined();
      response.body.joyas.forEach(joya => {
        expect(joya.estado).toBe('Activo');
      });
    });

    it('should filter joyas by stock_bajo', async () => {
      const response = await request(app)
        .get('/api/joyas?stock_bajo=true')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.joyas).toBeDefined();
      // Joyas with stock_actual <= stock_minimo
      response.body.joyas.forEach(joya => {
        expect(joya.stock_actual).toBeLessThanOrEqual(joya.stock_minimo);
      });
    });

    it('should filter joyas by sin_stock', async () => {
      const response = await request(app)
        .get('/api/joyas?sin_stock=true')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.joyas).toBeDefined();
      response.body.joyas.forEach(joya => {
        expect(joya.stock_actual).toBe(0);
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/joyas?pagina=1&por_pagina=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.joyas).toBeDefined();
      expect(response.body.joyas.length).toBeLessThanOrEqual(2);
      expect(response.body.pagina).toBe(1);
      expect(response.body.por_pagina).toBe(2);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });

  describe('GET /api/joyas/:id - Get single joya', () => {
    it('should return joya by id with movimientos', async () => {
      const response = await request(app)
        .get('/api/joyas/1')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        codigo: 'ANILLO-001',
        nombre: 'Anillo de Oro 18K'
      });
      expect(response.body).toHaveProperty('movimientos');
      expect(Array.isArray(response.body.movimientos)).toBe(true);
    });

    it('should return 404 for non-existent joya', async () => {
      const response = await request(app)
        .get('/api/joyas/99999')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Joya no encontrada');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/joyas/1')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });

  describe('GET /api/joyas/categorias - Get categories', () => {
    it('should return list of unique categories', async () => {
      const response = await request(app)
        .get('/api/joyas/categorias')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Should contain unique categories
      const uniqueCategories = [...new Set(response.body)];
      expect(response.body.length).toBe(uniqueCategories.length);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/joyas/categorias')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });

  describe('GET /api/joyas/verificar-codigo - Verify code uniqueness', () => {
    it('should detect existing codigo (case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo?codigo=anillo-001')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toMatchObject({
        existe: true,
        codigo_existente: expect.objectContaining({
          codigo: 'ANILLO-001'
        })
      });
    });

    it('should return false for non-existent codigo', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo?codigo=NEW-CODE-123')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toMatchObject({
        existe: false,
        codigo_existente: null
      });
    });

    it('should find similar codes', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo?codigo=anillo')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toHaveProperty('similares');
      expect(Array.isArray(response.body.similares)).toBe(true);
      expect(response.body.similares.length).toBeGreaterThan(0);
    });

    it('should exclude specified ID when checking', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo?codigo=anillo-001&excluir_id=1')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.existe).toBe(false);
    });

    it('should require codigo parameter', async () => {
      const response = await request(app)
        .get('/api/joyas/verificar-codigo')
        .set('Cookie', adminCookie)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'El código es requerido');
    });
  });

  describe('POST /api/joyas - Create new joya', () => {
    it('should create joya with valid data', async () => {
      const newJoya = {
        codigo: 'TEST-001',
        nombre: 'Test Joya',
        descripcion: 'Test description',
        categoria: 'Anillos',
        proveedor: 'Test Provider',
        costo: 10000,
        precio_venta: 15000,
        moneda: 'CRC',
        stock_actual: 5,
        stock_minimo: 2,
        ubicacion: 'Test Location',
        estado: 'Activo'
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(newJoya)
        .expect(201);

      expect(response.body).toMatchObject({
        mensaje: 'Joya creada correctamente',
        id: expect.any(Number)
      });
    });

    it('should fail to create joya with duplicate codigo', async () => {
      const newJoya = {
        codigo: 'ANILLO-001', // Already exists
        nombre: 'Test Joya',
        descripcion: 'Test description',
        categoria: 'Anillos',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(newJoya)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
      expect(response.body.errores).toContain('El código ya existe');
    });

    it('should validate required fields', async () => {
      const invalidJoya = {
        codigo: 'TEST-002'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(invalidJoya)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
      expect(Array.isArray(response.body.errores)).toBe(true);
      expect(response.body.errores.length).toBeGreaterThan(0);
    });

    it('should validate numeric fields', async () => {
      const invalidJoya = {
        codigo: 'TEST-003',
        nombre: 'Test Joya',
        costo: -100, // Invalid negative
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(invalidJoya)
        .expect(400);

      expect(response.body).toHaveProperty('errores');
    });

    it('should validate moneda field', async () => {
      const invalidJoya = {
        codigo: 'TEST-004',
        nombre: 'Test Joya',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'INVALID' // Invalid currency
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(invalidJoya)
        .expect(400);

      expect(response.body.errores).toContain('La moneda debe ser CRC, USD o EUR');
    });

    it('should validate estado field', async () => {
      const invalidJoya = {
        codigo: 'TEST-005',
        nombre: 'Test Joya',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'INVALID', // Invalid estado
        moneda: 'CRC'
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(invalidJoya)
        .expect(400);

      expect(response.body.errores).toContain('El estado debe ser Activo, Descontinuado o Agotado');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/joyas')
        .send({ codigo: 'TEST' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });

  describe('PUT /api/joyas/:id - Update joya', () => {
    it('should update joya with valid data', async () => {
      const updates = {
        codigo: 'ANILLO-001',
        nombre: 'Updated Anillo',
        descripcion: 'Updated description',
        categoria: 'Anillos',
        costo: 55000,
        precio_venta: 85000,
        stock_actual: 10,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .put('/api/joyas/1')
        .set('Cookie', adminCookie)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        mensaje: 'Joya actualizada correctamente'
      });
    });

    it('should return 404 for non-existent joya', async () => {
      const updates = {
        codigo: 'TEST',
        nombre: 'Test',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .put('/api/joyas/99999')
        .set('Cookie', adminCookie)
        .send(updates)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Joya no encontrada');
    });

    it('should prevent duplicate codigo (case-insensitive)', async () => {
      const updates = {
        codigo: 'collar-001', // Exists as COLLAR-001
        nombre: 'Test',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .put('/api/joyas/1') // Update ANILLO-001 to COLLAR-001
        .set('Cookie', adminCookie)
        .send(updates)
        .expect(400);

      expect(response.body.errores).toContain('El código ya existe en otra joya');
    });

    it('should allow updating with same codigo (case change)', async () => {
      const updates = {
        codigo: 'anillo-001', // Same as ANILLO-001, just lowercase
        nombre: 'Updated Anillo',
        costo: 50000,
        precio_venta: 80000,
        stock_actual: 10,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .put('/api/joyas/1')
        .set('Cookie', adminCookie)
        .send(updates)
        .expect(200);

      expect(response.body).toMatchObject({
        mensaje: 'Joya actualizada correctamente'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/joyas/1')
        .send({ codigo: 'TEST' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });

  describe('DELETE /api/joyas/:id - Delete joya', () => {
    it('should delete joya without dependencies', async () => {
      const response = await request(app)
        .delete('/api/joyas/4')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        eliminado: true,
        mensaje: 'Joya eliminada completamente del sistema'
      });
    });

    it('should return 404 for non-existent joya', async () => {
      const response = await request(app)
        .delete('/api/joyas/99999')
        .set('Cookie', adminCookie)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Joya no encontrada');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/joyas/1')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No autenticado');
    });
  });

  describe('Pagination Stability', () => {
    it('should return consistent results across pages', async () => {
      // Get first page
      const page1 = await request(app)
        .get('/api/joyas?pagina=1&por_pagina=2')
        .set('Cookie', adminCookie)
        .expect(200);

      // Get second page
      const page2 = await request(app)
        .get('/api/joyas?pagina=2&por_pagina=2')
        .set('Cookie', adminCookie)
        .expect(200);

      // Pages should not overlap
      const page1Ids = page1.body.joyas.map(j => j.id);
      const page2Ids = page2.body.joyas.map(j => j.id);
      
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });

    it('should maintain order across multiple requests', async () => {
      const request1 = await request(app)
        .get('/api/joyas?pagina=1&por_pagina=10')
        .set('Cookie', adminCookie)
        .expect(200);

      const request2 = await request(app)
        .get('/api/joyas?pagina=1&por_pagina=10')
        .set('Cookie', adminCookie)
        .expect(200);

      const ids1 = request1.body.joyas.map(j => j.id);
      const ids2 = request2.body.joyas.map(j => j.id);
      
      expect(ids1).toEqual(ids2);
    });
  });

  describe('Code Uniqueness (Case-Insensitive)', () => {
    it('should treat codigo as case-insensitive when creating', async () => {
      const newJoya = {
        codigo: 'anillo-001', // Lowercase of existing ANILLO-001
        nombre: 'Test',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .post('/api/joyas')
        .set('Cookie', adminCookie)
        .send(newJoya)
        .expect(400);

      expect(response.body.errores).toContain('El código ya existe');
    });

    it('should treat codigo as case-insensitive when updating', async () => {
      const updates = {
        codigo: 'COLLAR-001', // Uppercase of existing collar-001
        nombre: 'Test',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 10,
        stock_minimo: 2,
        estado: 'Activo',
        moneda: 'CRC'
      };

      const response = await request(app)
        .put('/api/joyas/1') // Try to update ANILLO-001 to COLLAR-001
        .set('Cookie', adminCookie)
        .send(updates)
        .expect(400);

      expect(response.body.errores).toContain('El código ya existe en otra joya');
    });
  });

  describe('Deduplication', () => {
    it('should not return duplicate joyas in list', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .set('Cookie', adminCookie)
        .expect(200);

      const ids = response.body.joyas.map(j => j.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids).toHaveLength(uniqueIds.length);
    });
  });
});
