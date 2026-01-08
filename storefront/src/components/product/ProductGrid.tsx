/**
 * Product Grid Component
 * 
 * Responsive grid layout for displaying products with loading and empty states.
 * Optimized with React.memo to prevent unnecessary re-renders.
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
  const categoryKeys = Object.keys(categories);
  
  while (categoryKeys.length > 0) {
    // Shuffle category order for more randomness
    const shuffledKeys = shuffleArray(categoryKeys);
    
    shuffledKeys.forEach((key) => {
      if (categories[key].length > 0) {
        shuffled.push(categories[key].shift()!);
      }
    });
    
    // Remove empty categories
    categoryKeys.forEach((key, index) => {
      if (categories[key].length === 0) {
        categoryKeys.splice(index, 1);
      }
    });
  }
  
  return shuffled;
}

/**
 * Get shuffled products with localStorage persistence
 * Maintains the same order across page navigation until browser reload
 */
function getShuffledProducts(products: Product[]): Product[] {
  // Only use localStorage in browser environment
  if (typeof window === 'undefined') {
    return shuffleWithBalance(products);
  }

  try {
    const storedOrder = localStorage.getItem('productOrder');
    
    if (storedOrder) {
      const productIds = storedOrder.split(',').map((id) => parseInt(id, 10));
      const productMap = new Map(products.map((p) => [p.id, p]));
      
      // Reconstruct the order from stored IDs
      const orderedProducts = productIds
        .map((id) => productMap.get(id))
        .filter((p): p is Product => p !== undefined);
      
      // If all products are accounted for, return the stored order
      // Otherwise, regenerate (products list may have changed)
      if (orderedProducts.length === products.length) {
        return orderedProducts;
      }
    }
    
    // Generate new shuffled order
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
