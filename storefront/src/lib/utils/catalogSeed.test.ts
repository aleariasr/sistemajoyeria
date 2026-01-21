/**
 * Tests for catalogSeed utility
 * 
 * Validates session seed generation and persistence
 */

import { getCatalogSeed, clearCatalogSeed, hasCatalogSeed } from './catalogSeed';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Replace global sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('catalogSeed', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getCatalogSeed', () => {
    it('generates a seed when none exists', () => {
      const seed = getCatalogSeed();
      
      expect(seed).toBeDefined();
      expect(typeof seed).toBe('number');
      expect(seed).toBeGreaterThan(0);
    });

    it('returns the same seed on subsequent calls with same context', () => {
      const seed1 = getCatalogSeed({ category: 'anillos' });
      const seed2 = getCatalogSeed({ category: 'anillos' });
      
      expect(seed1).toBe(seed2);
    });

    it('generates different seeds for different filter contexts', () => {
      clearCatalogSeed();
      const seed1 = getCatalogSeed({ category: 'anillos' });
      clearCatalogSeed();
      const seed2 = getCatalogSeed({ category: 'collares' });
      
      expect(seed1).not.toBe(seed2);
    });

    it('generates different seeds when search changes', () => {
      clearCatalogSeed();
      const seed1 = getCatalogSeed({ search: 'oro' });
      clearCatalogSeed();
      const seed2 = getCatalogSeed({ search: 'plata' });
      
      expect(seed1).not.toBe(seed2);
    });

    it('generates different seeds when category changes', () => {
      clearCatalogSeed();
      const seed1 = getCatalogSeed({ category: 'anillos' });
      clearCatalogSeed();
      const seed2 = getCatalogSeed({ category: 'collares' });
      
      expect(seed1).not.toBe(seed2);
    });

    it('uses combined context for category and search', () => {
      clearCatalogSeed();
      const seed1 = getCatalogSeed({ category: 'anillos', search: 'oro' });
      const seed2 = getCatalogSeed({ category: 'anillos', search: 'oro' });
      clearCatalogSeed();
      const seed3 = getCatalogSeed({ category: 'anillos', search: 'plata' });
      
      expect(seed1).toBe(seed2); // Same context
      expect(seed1).not.toBe(seed3); // Different search
    });

    it('clears seed when filter context changes', () => {
      // Start fresh
      sessionStorage.clear();
      
      // Generate seed for first context
      const seed1 = getCatalogSeed({ category: 'anillos' });
      
      // When we call with a different context, the old seed should be cleared
      const seed2 = getCatalogSeed({ category: 'collares' });
      
      // Seeds should be different because context changed
      // NOTE: Due to randomness, there's a tiny chance they could be the same
      // If this fails, it's statistically very unlikely but possible
      expect(seed1).not.toBe(seed2);
      
      // Going back to first context should generate yet another new seed
      const seed3 = getCatalogSeed({ category: 'anillos' });
      expect(seed3).not.toBe(seed1);
      expect(seed3).not.toBe(seed2);
    });

    it('persists seed in sessionStorage', () => {
      const seed = getCatalogSeed({ category: 'anillos' });
      
      const stored = sessionStorage.getItem('catalog_shuffle_seed');
      expect(stored).toBeTruthy();
      expect(parseInt(stored!, 10)).toBe(seed);
    });

    it('stores filter context in sessionStorage', () => {
      getCatalogSeed({ category: 'anillos', search: 'oro' });
      
      const context = sessionStorage.getItem('catalog_filter_context');
      expect(context).toBe('cat:anillos|search:oro');
    });
  });

  describe('clearCatalogSeed', () => {
    it('removes seed from sessionStorage', () => {
      getCatalogSeed({ category: 'anillos' });
      expect(sessionStorage.getItem('catalog_shuffle_seed')).toBeTruthy();
      
      clearCatalogSeed();
      expect(sessionStorage.getItem('catalog_shuffle_seed')).toBeNull();
    });

    it('removes filter context from sessionStorage', () => {
      getCatalogSeed({ category: 'anillos' });
      expect(sessionStorage.getItem('catalog_filter_context')).toBeTruthy();
      
      clearCatalogSeed();
      expect(sessionStorage.getItem('catalog_filter_context')).toBeNull();
    });
  });

  describe('hasCatalogSeed', () => {
    it('returns false when no seed exists', () => {
      expect(hasCatalogSeed({ category: 'anillos' })).toBe(false);
    });

    it('returns true when seed exists for context', () => {
      getCatalogSeed({ category: 'anillos' });
      expect(hasCatalogSeed({ category: 'anillos' })).toBe(true);
    });

    it('returns false when seed exists but context is different', () => {
      getCatalogSeed({ category: 'anillos' });
      expect(hasCatalogSeed({ category: 'collares' })).toBe(false);
    });

    it('returns false after clearing seed', () => {
      getCatalogSeed({ category: 'anillos' });
      expect(hasCatalogSeed({ category: 'anillos' })).toBe(true);
      
      clearCatalogSeed();
      expect(hasCatalogSeed({ category: 'anillos' })).toBe(false);
    });
  });

  describe('seed generation quality', () => {
    it('generates seeds within valid range', () => {
      const seeds = Array.from({ length: 100 }, () => getCatalogSeed());
      
      seeds.forEach(seed => {
        expect(seed).toBeGreaterThan(0);
        expect(seed).toBeLessThanOrEqual(4294967295); // Max uint32 value
      });
    });

    it('generates different seeds across multiple contexts', () => {
      const categories = ['anillos', 'collares', 'pulseras', 'aretes', 'relojes'];
      const seeds = categories.map(cat => {
        clearCatalogSeed();
        return getCatalogSeed({ category: cat });
      });
      
      // All seeds should be unique (statistically very likely with 5 random seeds)
      const uniqueSeeds = new Set(seeds);
      expect(uniqueSeeds.size).toBe(seeds.length);
    });
  });
});
