/**
 * Product Grid Component
 * 
 * Responsive grid layout for displaying products with loading and empty states.
 * Optimized with React.memo to prevent unnecessary re-renders.
 * 
 * Randomization Strategy:
 * - Maintains a persistent shuffled order in localStorage across navigation
 * - When new products load (infinite scroll), appends them without reshuffling existing order
 * - Ensures balanced category distribution to avoid consecutive grouping
 */

'use client';

import React, { useMemo } from 'react';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/lib/types';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * More reliable than array.sort(() => Math.random() - 0.5)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffle products with balanced category distribution
 * Ensures that products of the same category are not grouped consecutively
 */
function shuffleWithBalance(products: Product[]): Product[] {
  // Group products by category
  const categories = products.reduce((acc, product) => {
    const category = product.categoria || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Shuffle products within each category first
  Object.keys(categories).forEach((key) => {
    categories[key] = shuffleArray(categories[key]);
  });

  // Distribute products evenly across categories
  const shuffled: Product[] = [];
  let categoryKeys = Object.keys(categories);
  
  while (categoryKeys.length > 0) {
    // Shuffle category order for more randomness
    const shuffledKeys = shuffleArray(categoryKeys);
    
    shuffledKeys.forEach((key) => {
      if (categories[key].length > 0) {
        shuffled.push(categories[key].shift()!);
      }
    });
    
    // Remove empty categories by filtering
    categoryKeys = categoryKeys.filter(key => categories[key].length > 0);
  }
  
  return shuffled;
}

/**
 * Get shuffled products with localStorage persistence
 * Maintains the same order across page navigation and infinite scroll
 * 
 * Key behaviors:
 * 1. If products haven't changed (same IDs), use stored order
 * 2. If new products appear (longer list), add them to existing order without reshuffling
 * 3. If products are completely different, regenerate order
 */
function getShuffledProducts(products: Product[]): Product[] {
  // Only use localStorage in browser environment
  if (typeof window === 'undefined') {
    return shuffleWithBalance(products);
  }

  try {
    const storedOrder = localStorage.getItem('productOrder');
    const productMap = new Map(products.map((p) => [p.id, p]));
    const currentProductIds = products.map(p => p.id);
    
    if (storedOrder) {
      const storedProductIds = storedOrder.split(',').map((id) => parseInt(id, 10));
      
      // Check if all stored IDs exist in current products (subset check)
      const storedIdsInCurrent = storedProductIds.filter(id => productMap.has(id));
      
      // Find new products not in stored order
      const newProductIds = currentProductIds.filter(id => !storedProductIds.includes(id));
      
      // Case 1: All current products are in stored order - use stored order as-is
      if (newProductIds.length === 0) {
        const orderedProducts = storedProductIds
          .map((id) => productMap.get(id))
          .filter((p): p is Product => p !== undefined);
        return orderedProducts;
      }
      
      // Case 2: Some new products - append them to stored order with balanced shuffle
      // This happens during infinite scroll
      if (storedIdsInCurrent.length > 0) {
        const newProducts = newProductIds.map(id => productMap.get(id)).filter((p): p is Product => p !== undefined);
        const newProductsShuffled = shuffleWithBalance(newProducts);
        
        // Combine: existing order + new shuffled products
        const combinedOrder = [...storedProductIds, ...newProductsShuffled.map(p => p.id)];
        localStorage.setItem('productOrder', combinedOrder.join(','));
        
        const orderedProducts = combinedOrder
          .map((id) => productMap.get(id))
          .filter((p): p is Product => p !== undefined);
        return orderedProducts;
      }
    }
    
    // Case 3: No stored order or completely different products - generate new shuffled order
    const shuffled = shuffleWithBalance(products);
    localStorage.setItem('productOrder', shuffled.map((p) => p.id).join(','));
    return shuffled;
  } catch (error) {
    // If localStorage is not available or fails, fall back to regular shuffle
    console.warn('localStorage not available, using regular shuffle:', error);
    return shuffleWithBalance(products);
  }
}

function ProductGridComponent({
  products,
  isLoading = false,
  error = null,
  onRetry,
}: ProductGridProps) {
  // Get shuffled products with persistent order from localStorage
  // useMemo ensures the shuffle happens only when products array changes, not on every render
  const shuffledProducts = useMemo(() => getShuffledProducts(products), [products]);

  // Loading state
  if (isLoading) {
    return <ProductGridSkeleton count={8} />;
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-primary-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-primary-900 mb-2">
            Error al cargar productos
          </h3>
          <p className="text-primary-500 mb-6">
            {error.message || 'Ocurrió un error inesperado. Por favor intenta de nuevo.'}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              Intentar de nuevo
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (shuffledProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-primary-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-primary-900 mb-2">
            No se encontraron productos
          </h3>
          <p className="text-primary-500">
            Intenta ajustar los filtros o buscar con otros términos.
          </p>
        </div>
      </div>
    );
  }

  // Products grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {shuffledProducts.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export const ProductGrid = React.memo(ProductGridComponent);

export default ProductGrid;
