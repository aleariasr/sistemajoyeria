/**
 * Unit Tests for Joya Model
 * Tests business logic with mocked Supabase client
 */

const { createMockSupabase } = require('../mocks/supabase.mock');
const { getFixtures } = require('../fixtures/data');

// Mock the Supabase module before requiring Joya
jest.mock('../../supabase-db', () => {
  let mockSupabaseInstance = null;
  
  return {
    get supabase() {
      if (!mockSupabaseInstance) {
        const { createMockSupabase } = require('../mocks/supabase.mock');
        const { getFixtures } = require('../fixtures/data');
        mockSupabaseInstance = createMockSupabase(getFixtures());
      }
      return mockSupabaseInstance;
    },
    resetMock() {
      if (mockSupabaseInstance) {
        mockSupabaseInstance.resetFixtures();
      }
    }
  };
});

const Joya = require('../../models/Joya');
const { supabase, resetMock } = require('../../supabase-db');

describe('Joya Model - Unit Tests', () => {
  beforeEach(() => {
    // Reset fixtures before each test
    const fixtures = getFixtures();
    Object.keys(fixtures).forEach(table => {
      supabase.setFixtures(table, fixtures[table]);
    });
  });

  describe('crear()', () => {
    test('should create a new joya with all fields', async () => {
      const joyaData = {
        codigo: 'TEST-NEW-001',
        nombre: 'Test Joya',
        descripcion: 'Test description',
        categoria: 'Anillos',
        proveedor: 'Test Provider',
        costo: 10000,
        precio_venta: 15000,
        moneda: 'CRC',
        stock_actual: 5,
        stock_minimo: 1,
        ubicacion: 'Test Location',
        estado: 'Activo'
      };

      const result = await Joya.crear(joyaData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();

      // Verify it was added to fixtures
      const joyas = supabase.getFixtures('joyas');
      const created = joyas.find(j => j.id === result.id);
      expect(created).toBeDefined();
      expect(created.codigo).toBe('TEST-NEW-001');
      expect(created.nombre).toBe('Test Joya');
    });

    test('should set default values for optional fields', async () => {
      const joyaData = {
        codigo: 'TEST-NEW-002',
        nombre: 'Test Joya 2',
        costo: 10000,
        precio_venta: 15000,
        stock_actual: 5
      };

      const result = await Joya.crear(joyaData);
      const joyas = supabase.getFixtures('joyas');
      const created = joyas.find(j => j.id === result.id);

      expect(created.moneda).toBe('CRC'); // Default
      expect(created.stock_minimo).toBe(5); // Default
      expect(created.estado).toBe('Activo'); // Default
      expect(created.mostrar_en_storefront).toBe(true); // Default
    });
  });

  describe('obtenerTodas()', () => {
    test('should return all joyas with pagination', async () => {
      const result = await Joya.obtenerTodas({ pagina: 1, por_pagina: 20 });

      expect(result).toBeDefined();
      expect(result.joyas).toBeDefined();
      expect(Array.isArray(result.joyas)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.pagina).toBe(1);
      expect(result.por_pagina).toBe(20);
    });

    test('should order by fecha_creacion DESC then id DESC', async () => {
      const result = await Joya.obtenerTodas({ pagina: 1, por_pagina: 10 });

      // Verify descending order by fecha_creacion
      for (let i = 0; i < result.joyas.length - 1; i++) {
        const current = new Date(result.joyas[i].fecha_creacion);
        const next = new Date(result.joyas[i + 1].fecha_creacion);
        expect(current >= next).toBe(true);
      }
    });

    test('should filter by search term (busqueda)', async () => {
      const result = await Joya.obtenerTodas({ busqueda: 'anillo' });

      expect(result.joyas.length).toBeGreaterThan(0);
      result.joyas.forEach(joya => {
        const searchText = `${joya.codigo} ${joya.nombre} ${joya.descripcion}`.toLowerCase();
        expect(searchText).toContain('anillo');
      });
    });

    test('should filter by categoria (case-insensitive)', async () => {
      const result = await Joya.obtenerTodas({ categoria: 'anillos' });

      expect(result.joyas.length).toBeGreaterThan(0);
      result.joyas.forEach(joya => {
        expect(joya.categoria.toLowerCase()).toBe('anillos');
      });
    });

    test('should filter by stock_bajo', async () => {
      const result = await Joya.obtenerTodas({ stock_bajo: 'true' });

      expect(result.joyas.length).toBeGreaterThan(0);
      result.joyas.forEach(joya => {
        expect(joya.stock_actual).toBeLessThanOrEqual(joya.stock_minimo);
      });
    });

    test('should filter by sin_stock', async () => {
      const result = await Joya.obtenerTodas({ sin_stock: 'true' });

      expect(result.joyas.length).toBeGreaterThan(0);
      result.joyas.forEach(joya => {
        expect(joya.stock_actual).toBe(0);
      });
    });

    test('should filter by estado', async () => {
      const result = await Joya.obtenerTodas({ estado: 'Activo' });

      expect(result.joyas.length).toBeGreaterThan(0);
      result.joyas.forEach(joya => {
        expect(joya.estado).toBe('Activo');
      });
    });

    test('should deduplicate results (no duplicate IDs)', async () => {
      const result = await Joya.obtenerTodas({ pagina: 1, por_pagina: 100 });

      const ids = result.joyas.map(j => j.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('obtenerPorId()', () => {
    test('should return joya by ID', async () => {
      const joya = await Joya.obtenerPorId(1);

      expect(joya).toBeDefined();
      expect(joya.id).toBe(1);
      expect(joya.codigo).toBe('ANILLO-001');
    });

    test('should return null for non-existent ID', async () => {
      const joya = await Joya.obtenerPorId(99999);
      expect(joya).toBeNull();
    });
  });

  describe('obtenerPorCodigo()', () => {
    test('should return joya by codigo (case-insensitive)', async () => {
      const joya = await Joya.obtenerPorCodigo('anillo-001');

      expect(joya).toBeDefined();
      expect(joya.codigo).toBe('ANILLO-001');
    });

    test('should return null for non-existent codigo', async () => {
      const joya = await Joya.obtenerPorCodigo('NON-EXISTENT');
      expect(joya).toBeNull();
    });
  });

  describe('actualizar()', () => {
    test('should update joya fields', async () => {
      const updateData = {
        nombre: 'Updated Name',
        precio_venta: 99000
      };

      const result = await Joya.actualizar(1, updateData);

      expect(result).toBeDefined();
      const updated = await Joya.obtenerPorId(1);
      expect(updated.nombre).toBe('Updated Name');
      expect(updated.precio_venta).toBe(99000);
    });

    test('should preserve unchanged fields', async () => {
      const original = await Joya.obtenerPorId(1);
      const updateData = { nombre: 'New Name' };

      await Joya.actualizar(1, updateData);
      const updated = await Joya.obtenerPorId(1);

      expect(updated.codigo).toBe(original.codigo);
      expect(updated.categoria).toBe(original.categoria);
    });
  });

  describe('_shuffleArraySeeded()', () => {
    test('should produce deterministic shuffle with same seed', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const seed = 12345;

      const shuffle1 = Joya._shuffleArraySeeded(items, seed);
      const shuffle2 = Joya._shuffleArraySeeded(items, seed);

      expect(shuffle1).toEqual(shuffle2);
    });

    test('should produce different shuffle with different seed', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const shuffle1 = Joya._shuffleArraySeeded(items, 12345);
      const shuffle2 = Joya._shuffleArraySeeded(items, 54321);

      expect(shuffle1).not.toEqual(shuffle2);
    });
  });

  describe('_balanceCategories()', () => {
    test('should enforce max 3 consecutive same category rule', () => {
      const products = [
        { id: 1, categoria: 'Anillos' },
        { id: 2, categoria: 'Anillos' },
        { id: 3, categoria: 'Anillos' },
        { id: 4, categoria: 'Anillos' }, // 4th consecutive - should be moved
        { id: 5, categoria: 'Collares' }
      ];

      const balanced = Joya._balanceCategories(products, 3);

      // Check no more than 3 consecutive Anillos
      for (let i = 0; i <= balanced.length - 4; i++) {
        const window = balanced.slice(i, i + 4);
        const allAnillos = window.every(p => p.categoria === 'Anillos');
        expect(allAnillos).toBe(false);
      }
    });

    test('should return unchanged if no violations', () => {
      const products = [
        { id: 1, categoria: 'Anillos' },
        { id: 2, categoria: 'Collares' },
        { id: 3, categoria: 'Anillos' },
        { id: 4, categoria: 'Pulseras' }
      ];

      const balanced = Joya._balanceCategories(products, 3);

      // Should be identical (no violations)
      expect(balanced.map(p => p.id)).toEqual(products.map(p => p.id));
    });
  });
});
