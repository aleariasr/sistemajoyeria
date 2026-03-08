/**
 * Comprehensive Mocked Admin Listing Tests for Joyas
 * Tests GET /api/joyas with filters, pagination, ordering, and deduplication
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
    publicId: 'test_image',
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

describe('Admin Joyas Listing - Comprehensive Mocked Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;
  let authCookie;

  beforeEach(async () => {
    // Get fresh fixtures for each test
    fixtures = getFixtures();
    
    // Hash password for admin user
    const adminHash = bcrypt.hashSync('admin123', 10);
    
    // Override usuarios fixtures
    fixtures.usuarios = [
      {
        id: 1,
        username: 'admin',
        full_name: 'Admin User',
        password_hash: adminHash,
        role: 'administrador',
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

  describe('Ordering and Sorting', () => {
    it('should return joyas in DESC order by fecha_creacion then id', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('joyas');
      expect(Array.isArray(response.body.joyas)).toBe(true);
      expect(response.body.joyas.length).toBeGreaterThan(0);

      // Verify DESC order by fecha_creacion/id
      for (let i = 0; i < response.body.joyas.length - 1; i++) {
        const current = response.body.joyas[i];
        const next = response.body.joyas[i + 1];
        
        // Compare fecha_creacion first
        const currentDate = new Date(current.fecha_creacion);
        const nextDate = new Date(next.fecha_creacion);
        
        if (currentDate.getTime() === nextDate.getTime()) {
          // Same date, compare by id DESC
          expect(current.id).toBeGreaterThanOrEqual(next.id);
        } else {
          // Different dates, current should be newer (greater)
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
        }
      }
    });

    it('should maintain stable pagination across pages', async () => {
      // Get page 1
      const page1 = await request(app)
        .get('/api/joyas')
        .query({ pagina: 1, por_pagina: 5 })
        .set('Cookie', authCookie)
        .expect(200);

      // Get page 2
      const page2 = await request(app)
        .get('/api/joyas')
        .query({ pagina: 2, por_pagina: 5 })
        .set('Cookie', authCookie)
        .expect(200);

      // No duplicates between pages
      const page1Ids = page1.body.joyas.map(j => j.id);
      const page2Ids = page2.body.joyas.map(j => j.id);
      
      const intersection = page1Ids.filter(id => page2Ids.includes(id));
      expect(intersection).toHaveLength(0);
    });
  });

  describe('Pagination', () => {
    it('should return correct total count', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBe(fixtures.joyas.length);
    });

    it('should respect por_pagina parameter', async () => {
      const porPagina = 3;
      const response = await request(app)
        .get('/api/joyas')
        .query({ por_pagina: porPagina })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeLessThanOrEqual(porPagina);
      expect(response.body.por_pagina).toBe(porPagina);
    });

    it('should calculate correct total_paginas', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ por_pagina: 5 })
        .set('Cookie', authCookie)
        .expect(200);

      const expectedPages = Math.ceil(response.body.total / 5);
      expect(response.body.total_paginas).toBe(expectedPages);
    });

    it('should handle page numbers correctly', async () => {
      const page2 = await request(app)
        .get('/api/joyas')
        .query({ pagina: 2, por_pagina: 5 })
        .set('Cookie', authCookie)
        .expect(200);

      expect(page2.body.pagina).toBe(2);
    });
  });

  describe('No Duplicates', () => {
    it('should not return duplicate joyas by ID', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .set('Cookie', authCookie)
        .expect(200);

      const ids = response.body.joyas.map(j => j.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });

    it('should deduplicate results even with filters', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ categoria: 'Anillos' })
        .set('Cookie', authCookie)
        .expect(200);

      const ids = response.body.joyas.map(j => j.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('Filter: Búsqueda (Search)', () => {
    it('should search by codigo', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ busqueda: 'ANILLO' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.codigo.toLowerCase()).toContain('anillo');
      });
    });

    it('should search by nombre', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ busqueda: 'Diamantes' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        const matchesSearch = 
          joya.nombre.toLowerCase().includes('diamantes') ||
          joya.descripcion?.toLowerCase().includes('diamantes') ||
          joya.codigo.toLowerCase().includes('diamantes');
        expect(matchesSearch).toBe(true);
      });
    });

    it('should search case-insensitively', async () => {
      const responseLower = await request(app)
        .get('/api/joyas')
        .query({ busqueda: 'anillo' })
        .set('Cookie', authCookie)
        .expect(200);

      const responseUpper = await request(app)
        .get('/api/joyas')
        .query({ busqueda: 'ANILLO' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(responseLower.body.joyas.length).toBe(responseUpper.body.joyas.length);
    });
  });

  describe('Filter: Categoría (case-insensitive)', () => {
    it('should filter by categoria (exact match, case-insensitive)', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ categoria: 'anillos' }) // lowercase
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.categoria.toLowerCase()).toBe('anillos');
      });
    });

    it('should match categoria case-insensitively (uppercase)', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ categoria: 'COLLARES' }) // UPPERCASE
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.categoria.toLowerCase()).toBe('collares');
      });
    });

    it('should match categoria case-insensitively (mixed case)', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ categoria: 'PuLsErAs' }) // Mixed case
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.categoria.toLowerCase()).toBe('pulseras');
      });
    });
  });

  describe('Filter: Stock Bajo', () => {
    it('should filter joyas with stock_actual <= stock_minimo', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ stock_bajo: 'true' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.stock_actual).toBeLessThanOrEqual(joya.stock_minimo);
      });
    });

    it('should not include joyas with stock above minimum', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ stock_bajo: 'true' })
        .set('Cookie', authCookie)
        .expect(200);

      // Find a joya with high stock
      const highStockJoya = fixtures.joyas.find(j => j.stock_actual > j.stock_minimo + 3);
      if (highStockJoya) {
        const foundInResults = response.body.joyas.find(j => j.id === highStockJoya.id);
        expect(foundInResults).toBeUndefined();
      }
    });
  });

  describe('Filter: Sin Stock', () => {
    it('should filter joyas with stock_actual = 0', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ sin_stock: 'true' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.stock_actual).toBe(0);
      });
    });

    it('should not include joyas with any stock', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ sin_stock: 'true' })
        .set('Cookie', authCookie)
        .expect(200);

      response.body.joyas.forEach(joya => {
        expect(joya.stock_actual).toBe(0);
      });
    });
  });

  describe('Filter: Estado', () => {
    it('should filter by estado = Activo', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ estado: 'Activo' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.estado).toBe('Activo');
      });
    });

    it('should filter by estado = Descontinuado', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ estado: 'Descontinuado' })
        .set('Cookie', authCookie)
        .expect(200);

      // Should find the Descontinuado product (id=5)
      expect(response.body.joyas.length).toBeGreaterThan(0);
      response.body.joyas.forEach(joya => {
        expect(joya.estado).toBe('Descontinuado');
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({
          categoria: 'Anillos',
          estado: 'Activo'
        })
        .set('Cookie', authCookie)
        .expect(200);

      response.body.joyas.forEach(joya => {
        expect(joya.categoria.toLowerCase()).toBe('anillos');
        expect(joya.estado).toBe('Activo');
      });
    });

    it('should handle busqueda with categoria filter', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({
          busqueda: 'Oro',
          categoria: 'Anillos'
        })
        .set('Cookie', authCookie)
        .expect(200);

      response.body.joyas.forEach(joya => {
        expect(joya.categoria.toLowerCase()).toBe('anillos');
        const matchesSearch = 
          joya.nombre.toLowerCase().includes('oro') ||
          joya.descripcion?.toLowerCase().includes('oro');
        expect(matchesSearch).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty results gracefully', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ busqueda: 'NONEXISTENT_XYZ_123' })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should handle invalid page numbers (default to 1)', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ pagina: 0 })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.pagina).toBe(1);
    });

    it('should handle page beyond total pages', async () => {
      const response = await request(app)
        .get('/api/joyas')
        .query({ pagina: 9999, por_pagina: 5 })
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.joyas).toEqual([]);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/joyas')
        .expect(401);
    });
  });

  describe('GET /api/joyas/categorias', () => {
    it('should return unique categories', async () => {
      const response = await request(app)
        .get('/api/joyas/categorias')
        .set('Cookie', authCookie)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Check uniqueness
      const uniqueCategories = [...new Set(response.body)];
      expect(response.body.length).toBe(uniqueCategories.length);
    });
  });
});
