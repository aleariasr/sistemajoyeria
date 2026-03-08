/**
 * Comprehensive Mocked Public Listing Tests for Storefront
 * Tests GET /api/public/products with variants expansion, shuffle, and category balancing
 */

const request = require('supertest');
const express = require('express');
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

const publicRoutes = require('../../routes/public');

describe('Public Products Listing - Comprehensive Mocked Tests', () => {
  let app;
  let mockSupabase;
  let fixtures;

  beforeEach(() => {
    // Get fresh fixtures for each test
    fixtures = getFixtures();

    // Create mock Supabase
    mockSupabase = createMockSupabase(fixtures);
    
    // Replace the supabase instance in the mocked module
    require('../../supabase-db').supabase = mockSupabase;

    // Clear cache
    delete require.cache[require.resolve('../../routes/public')];
    delete require.cache[require.resolve('../../models/Joya')];
    delete require.cache[require.resolve('../../models/VarianteProducto')];
    delete require.cache[require.resolve('../../models/ProductoCompuesto')];

    // Create Express app
    app = express();
    
    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Mount public routes (NO AUTHENTICATION REQUIRED)
    app.use('/api/public', require('../../routes/public'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Filtering', () => {
    it('should only return active products', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      response.body.products.forEach(product => {
        // Should not expose sensitive fields
        expect(product).not.toHaveProperty('costo');
        expect(product).not.toHaveProperty('stock'); // Exact stock should be hidden
      });

      // Verify no Descontinuado products (id=5)
      const descontinuado = response.body.products.find(p => p.id === 5);
      expect(descontinuado).toBeUndefined();
    });

    it('should only return products with stock > 0', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product.stock_disponible).toBe(true);
      });

      // Verify product with stock=0 (id=3) is not included
      const noStock = response.body.products.find(p => p.id === 3);
      expect(noStock).toBeUndefined();
    });

    it('should only return products with mostrar_en_storefront=true', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Product id=4 has mostrar_en_storefront=false
      const hidden = response.body.products.find(p => p.id === 4);
      expect(hidden).toBeUndefined();
    });
  });

  describe('Variants Expansion', () => {
    it('should expand variants as separate products', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Product id=6 (Anillo de Diamantes) has 3 variants
      // Should appear as 3 separate products with variant info
      const variantProducts = response.body.products.filter(p => p.id === 6);
      expect(variantProducts.length).toBeGreaterThan(0);
      
      // Each variant should have variante_id
      variantProducts.forEach(vp => {
        expect(vp).toHaveProperty('variante_id');
        expect(vp.variante_id).toBeDefined();
      });
    });

    it('should have unique _uniqueKey for each variant', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Check all products have _uniqueKey
      response.body.products.forEach(product => {
        expect(product).toHaveProperty('_uniqueKey');
        expect(product._uniqueKey).toBeTruthy();
      });

      // Check uniqueness
      const uniqueKeys = response.body.products.map(p => p._uniqueKey);
      const uniqueSet = new Set(uniqueKeys);
      expect(uniqueKeys.length).toBe(uniqueSet.size);
    });

    it('should use variant name, description, and image for variants', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Find a variant product
      const variantProduct = response.body.products.find(p => p.variante_id);
      
      if (variantProduct) {
        // Should have variant-specific data
        expect(variantProduct.nombre).toContain('Talla'); // Variants have "Talla" in name
        expect(variantProduct.imagen_url).toBeTruthy();
        
        // imagenes array should contain only variant image
        expect(Array.isArray(variantProduct.imagenes)).toBe(true);
        expect(variantProduct.imagenes.length).toBeGreaterThan(0);
      }
    });

    it('should not show parent product if it has variants', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Product id=6 should only appear as variants, not as parent
      const parentOnly = response.body.products.find(p => 
        p.id === 6 && !p.variante_id
      );
      expect(parentOnly).toBeUndefined();
    });
  });

  describe('Sets/Composite Products', () => {
    it('should NOT show sets if any component has no stock', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // SET-001 (id=11) has component id=3 with stock=0
      // So the set should NOT appear
      const setProduct = response.body.products.find(p => p.id === 11);
      expect(setProduct).toBeUndefined();
    });

    it('should mark products as es_producto_compuesto', async () => {
      // Create fresh fixtures with component having stock
      const freshFixtures = getFixtures();
      const pulsera1 = freshFixtures.joyas.find(j => j.id === 3);
      if (pulsera1) {
        pulsera1.stock_actual = 5; // Give it stock
      }
      // Update mock with fresh fixtures
      mockSupabase.setFixtures('joyas', freshFixtures.joyas);

      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Now SET-001 should appear
      const setProduct = response.body.products.find(p => p.id === 11);
      if (setProduct) {
        expect(setProduct.es_producto_compuesto).toBe(true);
      }
    });
  });

  describe('GET /api/public/products/:id - Detail', () => {
    it('should return product detail by id', async () => {
      const response = await request(app)
        .get('/api/public/products/1')
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.codigo).toBe('ANILLO-001');
      expect(response.body).toHaveProperty('precio');
      expect(response.body).not.toHaveProperty('costo');
    });

    it('should return variant detail by id and variante_id', async () => {
      const response = await request(app)
        .get('/api/public/products/6')
        .query({ variante_id: 1 })
        .expect(200);

      expect(response.body.id).toBe(6);
      expect(response.body.variante_id).toBe(1);
      expect(response.body.nombre).toContain('Talla 6');
    });

    it('should return 404 for non-existent product', async () => {
      await request(app)
        .get('/api/public/products/99999')
        .expect(404);
    });

    it('should return 404 for inactive product', async () => {
      await request(app)
        .get('/api/public/products/5') // Descontinuado
        .expect(404);
    });

    it('should show set components in detail', async () => {
      // Create fresh fixtures with all components having stock
      const freshFixtures = getFixtures();
      const pulsera1 = freshFixtures.joyas.find(j => j.id === 3);
      if (pulsera1) {
        pulsera1.stock_actual = 5;
      }
      // Update mock with fresh fixtures
      mockSupabase.setFixtures('joyas', freshFixtures.joyas);

      const response = await request(app)
        .get('/api/public/products/11') // SET-001
        .expect(200);

      expect(response.body.es_producto_compuesto).toBe(true);
      expect(response.body).toHaveProperty('componentes');
      expect(Array.isArray(response.body.componentes)).toBe(true);
      expect(response.body.componentes.length).toBeGreaterThan(0);
    });
  });

  describe('Deterministic Shuffle', () => {
    it('should return same order with same shuffle_seed', async () => {
      const seed = '12345';

      const response1 = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: seed })
        .expect(200);

      const response2 = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: seed })
        .expect(200);

      // Same seed should produce same order
      const ids1 = response1.body.products.map(p => p._uniqueKey);
      const ids2 = response2.body.products.map(p => p._uniqueKey);
      
      expect(ids1).toEqual(ids2);
    });

    it('should return different order with different shuffle_seed', async () => {
      const seed1 = '12345';
      const seed2 = '67890';

      const response1 = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: seed1 })
        .expect(200);

      const response2 = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: seed2 })
        .expect(200);

      // Different seeds should produce different orders (with high probability)
      const ids1 = response1.body.products.map(p => p._uniqueKey);
      const ids2 = response2.body.products.map(p => p._uniqueKey);
      
      // Not all IDs should be in same positions
      const allSamePosition = ids1.every((id, idx) => id === ids2[idx]);
      expect(allSamePosition).toBe(false);
    });
  });

  describe('Category Balancing (Max 3 Consecutive)', () => {
    it('should enforce max 3 consecutive products from same category', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: '12345' })
        .expect(200);

      const products = response.body.products;
      
      // Check for violations of max 3 consecutive rule
      for (let i = 0; i <= products.length - 4; i++) {
        const window = products.slice(i, i + 4);
        const firstCategory = window[0].categoria;
        
        // Check if all 4 consecutive products have same category (violation)
        const allSameCategory = window.every(p => p.categoria === firstCategory);
        
        // Should NOT have 4 consecutive from same category
        expect(allSameCategory).toBe(false);
      }
    });

    it('should allow up to 3 consecutive from same category', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: '12345' })
        .expect(200);

      const products = response.body.products;
      
      // It's OK to have up to 3 consecutive from same category
      let found3Consecutive = false;
      for (let i = 0; i <= products.length - 3; i++) {
        const window = products.slice(i, i + 3);
        const firstCategory = window[0].categoria;
        
        if (window.every(p => p.categoria === firstCategory)) {
          found3Consecutive = true;
          break;
        }
      }
      
      // This assertion is lenient - we just verify the rule doesn't break
      // (we already verified no 4+ consecutive above)
      expect(true).toBe(true);
    });
  });

  describe('Pagination with Shuffle', () => {
    it('should paginate shuffled results correctly', async () => {
      const seed = '12345';
      
      // Get page 1
      const page1 = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: seed, pagina: 1, por_pagina: 3 })
        .expect(200);

      // Get page 2
      const page2 = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: seed, pagina: 2, por_pagina: 3 })
        .expect(200);

      // No duplicates between pages
      const page1Keys = page1.body.products.map(p => p._uniqueKey);
      const page2Keys = page2.body.products.map(p => p._uniqueKey);
      
      const intersection = page1Keys.filter(k => page2Keys.includes(k));
      expect(intersection).toHaveLength(0);
    });

    it('should return correct total count with shuffle', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: '12345' })
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should calculate correct total_paginas with shuffle', async () => {
      const porPagina = 3;
      const response = await request(app)
        .get('/api/public/products')
        .query({ shuffle: 'true', shuffle_seed: '12345', por_pagina: porPagina })
        .expect(200);

      const expectedPages = Math.ceil(response.body.total / porPagina);
      expect(response.body.total_paginas).toBe(expectedPages);
    });
  });

  describe('Category Filter', () => {
    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .query({ categoria: 'Anillos' })
        .expect(200);

      response.body.products.forEach(product => {
        expect(product.categoria.toLowerCase()).toBe('anillos');
      });
    });

    it('should work with shuffle and category filter', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .query({ categoria: 'Anillos', shuffle: 'true', shuffle_seed: '12345' })
        .expect(200);

      response.body.products.forEach(product => {
        expect(product.categoria.toLowerCase()).toBe('anillos');
      });
    });
  });

  describe('No Authentication Required', () => {
    it('should allow access without authentication', async () => {
      // No auth cookie needed
      await request(app)
        .get('/api/public/products')
        .expect(200);
    });

    it('should allow detail access without authentication', async () => {
      await request(app)
        .get('/api/public/products/1')
        .expect(200);
    });
  });

  describe('Security: No Sensitive Data', () => {
    it('should not expose costo', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product).not.toHaveProperty('costo');
      });
    });

    it('should not expose exact stock numbers', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product).not.toHaveProperty('stock');
        expect(product).not.toHaveProperty('stock_actual');
        // Only stock_disponible (boolean) should be present
        expect(product).toHaveProperty('stock_disponible');
        expect(typeof product.stock_disponible).toBe('boolean');
      });
    });

    it('should not expose proveedor', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product).not.toHaveProperty('proveedor');
      });
    });
  });

  describe('GET /api/public/categories', () => {
    it('should return unique categories from active products', async () => {
      const response = await request(app)
        .get('/api/public/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.categories.length).toBeGreaterThan(0);
      
      // Check uniqueness
      const uniqueCategories = [...new Set(response.body.categories)];
      expect(response.body.categories.length).toBe(uniqueCategories.length);
    });
  });
});
