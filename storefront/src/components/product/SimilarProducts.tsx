/**
 * Similar Products Section
 * 
 * Displays 3-6 random products at the bottom of product detail pages.
 * Excludes the current product being viewed.
 * 
 * CRITICAL: This component does NOT modify any existing logic for:
 * - Product loading or fetching
 * - Variant selection or management
 * - Cart operations or state
 * 
 * It's a pure display component that shows additional product recommendations.
 */

'use client';

import { useProducts } from '@/hooks/useApi';
import { SimilarProductCard } from './SimilarProductCard';
import type { Product } from '@/lib/types';

// Configuration constants
const MIN_PRODUCTS_TO_SHOW = 3;
const MAX_PRODUCTS_TO_SHOW = 6;
const PRODUCTS_FETCH_LIMIT = 50;

interface SimilarProductsProps {
  currentProductId: number;
  currentVariantId?: number;
}

export function SimilarProducts({ currentProductId, currentVariantId }: SimilarProductsProps) {
  // Fetch available products (limited to reduce payload)
  const { data, isLoading } = useProducts({ per_page: PRODUCTS_FETCH_LIMIT });

  if (isLoading || !data?.products) {
    return null; // Silent fail - not critical to page
  }

  const allProducts = data.products;
  
  // Remove current product from list
  const filteredItems = allProducts.filter(p => {
    // Exclude if same product ID
    if (p.id === currentProductId) {
      // If viewing a variant, only exclude that specific variant
      if (currentVariantId && p.variante_id) {
        return p.variante_id !== currentVariantId;
      }
      // Otherwise exclude the whole product
      return false;
    }
    return true;
  });

  // Simple shuffle using random sort (as specified: frontend random simple)
  const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
  
  // Pick random count between min and max
  const randomCount = Math.floor(Math.random() * (MAX_PRODUCTS_TO_SHOW - MIN_PRODUCTS_TO_SHOW + 1)) + MIN_PRODUCTS_TO_SHOW;
  const selectedItems = shuffled.slice(0, Math.min(randomCount, shuffled.length));

  // Don't show section if we don't have minimum products
  if (selectedItems.length < MIN_PRODUCTS_TO_SHOW) {
    return null;
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-primary-900 mb-8">
        Ver más productos
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {selectedItems.map((product) => (
          <SimilarProductCard 
            key={`similar-${product.id}-${product.variante_id || 0}`}
            item={product}
          />
        ))}
      </div>
    </section>
  );
}
