/**
 * Product Grid Component
 * 
 * Responsive grid layout for displaying products with loading and empty states.
 * Optimized with React.memo to prevent unnecessary re-renders.
 * 
 * Randomization Strategy:
 * - Backend shuffle provides global randomization across entire inventory
 * - localStorage maintains persistent order across navigation for continuity
 * - New products from infinite scroll are appended without client-side reshuffling
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
 * Get products with localStorage persistence for order continuity
 * 
 * Since backend shuffle provides global randomization, this function
 * primarily manages localStorage persistence so users see consistent
 * order when navigating back to the catalog.
 * 
 * Key behaviors:
 * 1. If products haven't changed (same IDs), use stored order
 * 2. If new products appear (longer list from infinite scroll), append them
 * 3. If products are completely different (filters/search), use new order
 */
function getOrderedProducts(products: Product[]): Product[] {
  // Skip localStorage in server-side rendering
  if (typeof window === 'undefined') {
    return products;
  }

  try {
    const storedOrder = localStorage.getItem('productOrder');
    const productMap = new Map(products.map((p) => [p.id, p]));
    
    if (storedOrder) {
      const storedProductIds = storedOrder.split(',').map((id) => parseInt(id, 10));
      
      // Filter stored IDs to only those that exist in current products
      const validStoredIds = storedProductIds.filter(id => productMap.has(id));
      
      // Find new products not in stored order
      const newProductIds = products
        .map(p => p.id)
        .filter(id => !storedProductIds.includes(id));
      
      // Case 1: All current products are in stored order - maintain order
      if (newProductIds.length === 0 && validStoredIds.length === products.length) {
        const orderedProducts = validStoredIds
          .map((id) => productMap.get(id)!)
          .filter((p): p is Product => p !== undefined);
        return orderedProducts;
      }
      
      // Case 2: Some new products from infinite scroll - append them
      if (validStoredIds.length > 0 && newProductIds.length > 0) {
        const newProducts = newProductIds
          .map(id => productMap.get(id))
          .filter((p): p is Product => p !== undefined);
        
        // Combine: existing order + new products (already shuffled by backend)
        const combinedOrder = [...validStoredIds, ...newProducts.map(p => p.id)];
        localStorage.setItem('productOrder', combinedOrder.join(','));
        
        const orderedProducts = combinedOrder
          .map((id) => productMap.get(id)!)
          .filter((p): p is Product => p !== undefined);
        return orderedProducts;
      }
    }
    
    // Case 3: No stored order or completely different products
    // Store the new order (already shuffled by backend)
    localStorage.setItem('productOrder', products.map((p) => p.id).join(','));
    return products;
  } catch (error) {
    // If localStorage is not available, just return products as-is
    console.warn('localStorage not available:', error);
    return products;
  }
}

function ProductGridComponent({
  products,
  isLoading = false,
  error = null,
  onRetry,
}: ProductGridProps) {
  // Get ordered products with persistent order from localStorage
  // useMemo ensures the ordering happens only when products array changes
  const orderedProducts = useMemo(() => getOrderedProducts(products), [products]);

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
  if (orderedProducts.length === 0) {
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
      {orderedProducts.map((product, index) => (
        <ProductCard 
          key={product._uniqueKey || `product-${product.id}-${product.variante_id || 0}`} 
          product={product} 
          index={index} 
        />
      ))}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export const ProductGrid = React.memo(ProductGridComponent);

export default ProductGrid;
