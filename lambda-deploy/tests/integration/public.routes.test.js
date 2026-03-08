/**
 * Integration Tests for Public API Routes
 * Tests /api/public/* endpoints for storefront (no authentication required)
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

describe('Public Routes Integration Tests', () => {
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

    // Create Express app
    app = express();
    
    // Middleware
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Mount public routes (NO AUTHENTICATION REQUIRED)
    app.use('/api/public', publicRoutes);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/public/products - List products for storefront', () => {
    it('should return only active products with stock and mostrar_en_storefront=true', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      
      // Verify all products meet criteria
      response.body.products.forEach(product => {
        // Should not expose sensitive fields
        expect(product).not.toHaveProperty('costo');
        expect(product).not.toHaveProperty('stock'); // Exact stock should be hidden
        
        // Should have public fields
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('codigo');
        expect(product).toHaveProperty('nombre');
        expect(product).toHaveProperty('precio');
        expect(product).toHaveProperty('stock_disponible');
        expect(product).toHaveProperty('slug');
        expect(product).toHaveProperty('_uniqueKey');
        
        // All products should have stock_disponible = true (since con_stock filter)
        expect(product.stock_disponible).toBe(true);
      });
    });

    it('should NOT return products with estado != Activo', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Fixture id=5 is Descontinuado - should not appear
      const descontinuadoProduct = response.body.products.find(p => p.id === 5);
      expect(descontinuadoProduct).toBeUndefined();
    });

    it('should NOT return products with stock = 0', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Fixture id=3 has stock_actual=0 - should not appear
      const noStockProduct = response.body.products.find(p => p.id === 3);
      expect(noStockProduct).toBeUndefined();
    });

    it('should NOT return products with mostrar_en_storefront=false', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Fixture id=4 has mostrar_en_storefront=false - should not appear
      const hiddenProduct = response.body.products.find(p => p.id === 4);
      expect(hiddenProduct).toBeUndefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/public/products?page=1&per_page=2')
        .expect(200);

      expect(response.body).toMatchObject({
        page: 1,
        per_page: 2,
        total: expect.any(Number),
        total_pages: expect.any(Number),
        has_more: expect.any(Boolean)
      });
      
      expect(response.body.products.length).toBeLessThanOrEqual(2);
    });

    it('should support search filtering', async () => {
      const response = await request(app)
        .get('/api/public/products?search=anillo')
        .expect(200);

      expect(response.body.products).toBeDefined();
      // Results should match search term
      response.body.products.forEach(product => {
        const matchesNombre = product.nombre.toLowerCase().includes('anillo');
        const matchesCodigo = product.codigo.toLowerCase().includes('anillo');
        expect(matchesNombre || matchesCodigo).toBe(true);
      });
    });

    it('should support category filtering', async () => {
      const response = await request(app)
        .get('/api/public/products?category=Anillos')
        .expect(200);

      expect(response.body.products).toBeDefined();
      response.body.products.forEach(product => {
        expect(product.categoria).toBe('Anillos');
      });
    });

    it('should work WITHOUT authentication', async () => {
      // No auth headers - should still work
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
    });
  });

  describe('Variant Expansion with _uniqueKey', () => {
    it('should expand variants as individual products with unique keys', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Find products that are variants (id=6 has variants in fixtures)
      const variants = response.body.products.filter(p => 
        p.variante_id !== undefined
      );

      if (variants.length > 0) {
        variants.forEach(variant => {
          // Each variant should have a unique key
          expect(variant._uniqueKey).toBeDefined();
          expect(variant._uniqueKey).toMatch(/^\d+-\d+$/); // Format: "parentId-variantId"
          
          // Variant should have its own name and image
          expect(variant.nombre).toBeDefined();
          expect(variant.imagen_url).toBeDefined();
          expect(variant.variante_id).toBeDefined();
          
          // Should not expose variants array
          expect(variant.variantes).toBeUndefined();
        });

        // All _uniqueKey should be unique
        const keys = variants.map(v => v._uniqueKey);
        const uniqueKeys = [...new Set(keys)];
        expect(keys.length).toBe(uniqueKeys.length);
      }
    });

    it('should deduplicate variants by _uniqueKey', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      const keys = response.body.products.map(p => p._uniqueKey);
      const uniqueKeys = [...new Set(keys)];
      
      // No duplicate _uniqueKey
      expect(keys.length).toBe(uniqueKeys.length);
    });

    it('should NOT mutate parent product images when expanding variants', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Check that each variant has its own images array
      const variants = response.body.products.filter(p => p.variante_id);
      
      if (variants.length > 1) {
        // Get first two variants
        const variant1 = variants[0];
        const variant2 = variants[1];
        
        // Images should be different arrays (not same reference)
        if (variant1.imagenes && variant2.imagenes) {
          // Modifying one shouldn't affect the other
          expect(variant1.imagenes).not.toBe(variant2.imagenes);
          
          // Each should have only their own image
          expect(variant1.imagenes.length).toBeGreaterThan(0);
          expect(variant2.imagenes.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Shuffle with shuffle_seed', () => {
    it('should shuffle products when shuffle=true', async () => {
      // Get products without shuffle
      const normal = await request(app)
        .get('/api/public/products')
        .expect(200);

      // Get products with shuffle
      const shuffled = await request(app)
        .get('/api/public/products?shuffle=true')
        .expect(200);

      // Both should return same total
      expect(shuffled.body.total).toBe(normal.body.total);
      
      // Order might be different (unless by chance they're the same)
      // We can't guarantee different order, but we can verify structure is intact
      expect(shuffled.body.products).toBeDefined();
      expect(Array.isArray(shuffled.body.products)).toBe(true);
    });

    it('should return same order with same shuffle_seed (deterministic)', async () => {
      const seed = 12345;
      
      // Request 1 with seed
      const response1 = await request(app)
        .get(`/api/public/products?shuffle=true&shuffle_seed=${seed}`)
        .expect(200);

      // Request 2 with same seed
      const response2 = await request(app)
        .get(`/api/public/products?shuffle=true&shuffle_seed=${seed}`)
        .expect(200);

      // Should return same order
      const ids1 = response1.body.products.map(p => p._uniqueKey);
      const ids2 = response2.body.products.map(p => p._uniqueKey);
      
      expect(ids1).toEqual(ids2);
    });

    it('should return different order with different shuffle_seed', async () => {
      const seed1 = 11111;
      const seed2 = 99999;
      
      // Request with seed1
      const response1 = await request(app)
        .get(`/api/public/products?shuffle=true&shuffle_seed=${seed1}`)
        .expect(200);

      // Request with seed2
      const response2 = await request(app)
        .get(`/api/public/products?shuffle=true&shuffle_seed=${seed2}`)
        .expect(200);

      const ids1 = response1.body.products.map(p => p._uniqueKey);
      const ids2 = response2.body.products.map(p => p._uniqueKey);
      
      // Different seeds should produce different orders (highly likely with enough products)
      if (ids1.length >= 3) {
        expect(ids1).not.toEqual(ids2);
      }
    });
  });

  describe('Category Balancing (≤3 consecutive per category)', () => {
    it('should not have more than 3 consecutive products from same category when using shuffle_seed', async () => {
      const response = await request(app)
        .get('/api/public/products?shuffle=true&shuffle_seed=12345')
        .expect(200);

      const products = response.body.products;
      
      if (products.length < 4) {
        // Not enough products to test
        return;
      }

      let consecutiveCount = 1;
      let lastCategory = products[0].categoria;
      
      for (let i = 1; i < products.length; i++) {
        if (products[i].categoria === lastCategory) {
          consecutiveCount++;
          expect(consecutiveCount).toBeLessThanOrEqual(3);
        } else {
          consecutiveCount = 1;
          lastCategory = products[i].categoria;
        }
      }
    });
  });

  describe('GET /api/public/products/:id - Get product detail', () => {
    it('should return product detail with exact stock', async () => {
      const response = await request(app)
        .get('/api/public/products/1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        codigo: 'ANILLO-001',
        nombre: expect.any(String),
        precio: expect.any(Number),
        stock_disponible: true,
        slug: expect.any(String)
      });

      // Detail endpoint SHOULD include exact stock for cart validation
      expect(response.body).toHaveProperty('stock');
      expect(typeof response.body.stock).toBe('number');
      
      // Should NOT expose cost
      expect(response.body).not.toHaveProperty('costo');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/public/products/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for inactive product', async () => {
      // Fixture id=5 is Descontinuado
      const response = await request(app)
        .get('/api/public/products/5')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not available');
    });

    it('should return 404 for product with mostrar_en_storefront=false', async () => {
      // Fixture id=4 has mostrar_en_storefront=false
      const response = await request(app)
        .get('/api/public/products/4')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Product not available');
    });

    it('should return specific variant when variante_id is provided', async () => {
      // Fixture id=6 has variants (id=1 and id=2)
      const response = await request(app)
        .get('/api/public/products/6?variante_id=1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 6, // Parent product ID
        variante_id: 1,
        nombre: expect.stringContaining('Talla 6'), // Variant name
        stock: expect.any(Number)
      });

      // Should NOT include list of other variants
      expect(response.body.variantes).toBeUndefined();
    });

    it('should return first active variant when no variante_id for variant product', async () => {
      // Fixture id=6 is a variant product
      const response = await request(app)
        .get('/api/public/products/6')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 6,
        variante_id: expect.any(Number),
        nombre: expect.any(String),
        stock: expect.any(Number)
      });

      // Should NOT include list of variants
      expect(response.body.variantes).toBeUndefined();
    });

    it('should work WITHOUT authentication', async () => {
      const response = await request(app)
        .get('/api/public/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
    });
  });

  describe('GET /api/public/categories - Get categories', () => {
    it('should return list of categories from available products', async () => {
      const response = await request(app)
        .get('/api/public/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
      
      // Should contain unique categories
      const uniqueCategories = [...new Set(response.body.categories)];
      expect(response.body.categories.length).toBe(uniqueCategories.length);
    });

    it('should only include categories from active, in-stock, visible products', async () => {
      const response = await request(app)
        .get('/api/public/categories')
        .expect(200);

      // Categories should only be from products that would appear in /products
      expect(response.body.categories).toBeDefined();
      expect(response.body.categories.length).toBeGreaterThan(0);
    });

    it('should work WITHOUT authentication', async () => {
      const response = await request(app)
        .get('/api/public/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
    });
  });

  describe('Sensitive Field Protection', () => {
    it('should NOT expose costo in product list', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product).not.toHaveProperty('costo');
        expect(product).not.toHaveProperty('proveedor');
        expect(product).not.toHaveProperty('ubicacion');
        expect(product).not.toHaveProperty('stock_minimo');
      });
    });

    it('should NOT expose costo in product detail', async () => {
      const response = await request(app)
        .get('/api/public/products/1')
        .expect(200);

      expect(response.body).not.toHaveProperty('costo');
      expect(response.body).not.toHaveProperty('proveedor');
      expect(response.body).not.toHaveProperty('ubicacion');
      expect(response.body).not.toHaveProperty('stock_minimo');
    });

    it('should hide exact stock in product list', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        // List should NOT have exact stock number
        expect(product).not.toHaveProperty('stock');
        
        // But should have boolean indicator
        expect(product).toHaveProperty('stock_disponible');
        expect(typeof product.stock_disponible).toBe('boolean');
      });
    });

    it('should show exact stock in product detail for cart validation', async () => {
      const response = await request(app)
        .get('/api/public/products/1')
        .expect(200);

      // Detail endpoint SHOULD include exact stock
      expect(response.body).toHaveProperty('stock');
      expect(typeof response.body.stock).toBe('number');
    });
  });

  describe('GET /api/public/products/featured - Featured products', () => {
    it('should return featured products (max 8)', async () => {
      const response = await request(app)
        .get('/api/public/products/featured')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeLessThanOrEqual(8);
      
      // Should meet same criteria as regular products
      response.body.products.forEach(product => {
        expect(product).not.toHaveProperty('costo');
        expect(product).toHaveProperty('stock_disponible');
        expect(product.stock_disponible).toBe(true);
      });
    });

    it('should work WITHOUT authentication', async () => {
      const response = await request(app)
        .get('/api/public/products/featured')
        .expect(200);

      expect(response.body).toHaveProperty('products');
    });
  });

  describe('Deduplication Across Pages', () => {
    it('should not return duplicates across pagination', async () => {
      // Get first page
      const page1 = await request(app)
        .get('/api/public/products?page=1&per_page=3')
        .expect(200);

      // Get second page
      const page2 = await request(app)
        .get('/api/public/products?page=2&per_page=3')
        .expect(200);

      const keys1 = page1.body.products.map(p => p._uniqueKey);
      const keys2 = page2.body.products.map(p => p._uniqueKey);

      // No overlap between pages
      const intersection = keys1.filter(key => keys2.includes(key));
      expect(intersection).toHaveLength(0);
    });

    it('should not return duplicate _uniqueKey in same page', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      const keys = response.body.products.map(p => p._uniqueKey);
      const uniqueKeys = [...new Set(keys)];
      
      expect(keys.length).toBe(uniqueKeys.length);
    });
  });

  describe('Slug Generation', () => {
    it('should generate URL-friendly slugs', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product.slug).toBeDefined();
        expect(typeof product.slug).toBe('string');
        
        // Slug should be lowercase and URL-safe
        expect(product.slug).toMatch(/^[a-z0-9-]+$/);
        
        // Should start with codigo
        expect(product.slug).toMatch(new RegExp(`^${product.codigo.toLowerCase()}`));
      });
    });
  });

  describe('Product Images', () => {
    it('should include imagenes array with proper structure', async () => {
      const response = await request(app)
        .get('/api/public/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('imagenes');
      expect(Array.isArray(response.body.imagenes)).toBe(true);
      
      // If images exist, check structure
      if (response.body.imagenes.length > 0) {
        response.body.imagenes.forEach(img => {
          expect(img).toHaveProperty('url');
          expect(img).toHaveProperty('orden');
          expect(img).toHaveProperty('es_principal');
        });
      }
    });

    it('should have imagen_url field', async () => {
      const response = await request(app)
        .get('/api/public/products')
        .expect(200);

      response.body.products.forEach(product => {
        expect(product).toHaveProperty('imagen_url');
      });
    });
  });
});
