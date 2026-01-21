/**
 * Mock product data for E2E tests
 */

import type { Product, ProductsResponse, FeaturedProductsResponse, CategoriesResponse } from '@/lib/types';

/**
 * Create a mock product
 */
export function createMockProduct(overrides: Partial<Product> = {}): Product {
  const id = overrides.id || Math.floor(Math.random() * 10000);
  
  return {
    id,
    codigo: `TEST-${id}`,
    nombre: `Product ${id}`,
    descripcion: `Description for product ${id}`,
    categoria: 'Anillos',
    precio: 10000 + (id * 100),
    moneda: 'CRC',
    stock_disponible: true,
    stock: 10,
    imagen_url: `https://via.placeholder.com/400x400?text=Product+${id}`,
    imagenes: [
      {
        id: id * 10 + 1,
        url: `https://via.placeholder.com/800x800?text=Image+1`,
        orden: 1,
        es_principal: true,
      },
      {
        id: id * 10 + 2,
        url: `https://via.placeholder.com/800x800?text=Image+2`,
        orden: 2,
        es_principal: false,
      },
    ],
    slug: `product-${id}`,
    _uniqueKey: `${id}`,
    ...overrides,
  };
}

/**
 * Create a mock variant product
 */
export function createMockVariant(productId: number, variantId: number, overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id: productId,
    variante_id: variantId,
    variante_nombre: `Variant ${variantId}`,
    es_variante: true,
    _uniqueKey: `${productId}-${variantId}`,
    nombre: `Product ${productId} - Variant ${variantId}`,
    ...overrides,
  });
}

/**
 * Create a mock set/composite product
 */
export function createMockSet(id: number, overrides: Partial<Product> = {}): Product {
  return createMockProduct({
    id,
    nombre: `Set ${id}`,
    es_producto_compuesto: true,
    componentes: [
      {
        id: id * 100 + 1,
        codigo: `COMP-${id}-1`,
        nombre: `Component 1`,
        descripcion: 'Component description',
        precio: 5000,
        moneda: 'CRC',
        stock_disponible: true,
        stock: 5,
        imagen_url: 'https://via.placeholder.com/200x200?text=Component+1',
        cantidad_requerida: 1,
        estado: 'disponible',
        es_activo: true,
      },
      {
        id: id * 100 + 2,
        codigo: `COMP-${id}-2`,
        nombre: `Component 2`,
        descripcion: 'Component description',
        precio: 5000,
        moneda: 'CRC',
        stock_disponible: true,
        stock: 5,
        imagen_url: 'https://via.placeholder.com/200x200?text=Component+2',
        cantidad_requerida: 1,
        estado: 'disponible',
        es_activo: true,
      },
    ],
    ...overrides,
  });
}

/**
 * Mock products response with pagination
 */
export function createMockProductsResponse(options: {
  page?: number;
  perPage?: number;
  total?: number;
  category?: string;
  hasVariants?: boolean;
} = {}): ProductsResponse {
  const page = options.page || 1;
  const perPage = options.perPage || 20;
  const total = options.total || 50;
  const category = options.category;
  
  // Generate products for current page
  const products: Product[] = [];
  const startId = (page - 1) * perPage + 1;
  
  for (let i = 0; i < Math.min(perPage, total - (page - 1) * perPage); i++) {
    const id = startId + i;
    
    if (options.hasVariants && i % 3 === 0) {
      // Every 3rd product has variants
      products.push(createMockVariant(id, id * 10, { categoria: category }));
      products.push(createMockVariant(id, id * 10 + 1, { categoria: category }));
    } else {
      products.push(createMockProduct({ id, categoria: category }));
    }
  }
  
  return {
    products,
    total,
    total_products: products.length,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
    has_more: page < Math.ceil(total / perPage),
  };
}

/**
 * Mock featured products response
 */
export function createMockFeaturedResponse(): FeaturedProductsResponse {
  return {
    products: [
      createMockProduct({ id: 1, nombre: 'Featured Product 1' }),
      createMockProduct({ id: 2, nombre: 'Featured Product 2' }),
      createMockProduct({ id: 3, nombre: 'Featured Product 3' }),
    ],
  };
}

/**
 * Mock categories response
 */
export function createMockCategoriesResponse(): CategoriesResponse {
  return {
    categories: ['Anillos', 'Aretes', 'Collares', 'Pulseras', 'Relojes'],
  };
}

/**
 * Deterministic shuffle with seed for testing
 */
export function shuffleWithSeed<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let currentSeed = seed;
  
  // Simple seeded random number generator
  const seededRandom = () => {
    const x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
  };
  
  // Fisher-Yates shuffle with seeded random
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}

/**
 * Apply category ordering rule: max 3 consecutive from same category
 */
export function applyCategoryOrderingRule(products: Product[]): Product[] {
  const result: Product[] = [];
  const remaining = [...products];
  let lastCategory: string | null = null;
  let categoryCount = 0;
  
  while (remaining.length > 0) {
    let found = false;
    
    // Try to find a product from a different category
    for (let i = 0; i < remaining.length; i++) {
      const product = remaining[i];
      
      if (product.categoria !== lastCategory || categoryCount < 3) {
        result.push(product);
        remaining.splice(i, 1);
        
        if (product.categoria === lastCategory) {
          categoryCount++;
        } else {
          lastCategory = product.categoria || null;
          categoryCount = 1;
        }
        
        found = true;
        break;
      }
    }
    
    // If no different category found, reset and add any
    if (!found) {
      const product = remaining.shift()!;
      result.push(product);
      lastCategory = product.categoria || null;
      categoryCount = 1;
    }
  }
  
  return result;
}
