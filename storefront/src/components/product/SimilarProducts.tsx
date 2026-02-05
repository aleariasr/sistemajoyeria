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

interface SimilarProductsProps {
  currentProductId: number;
  currentVariantId?: number;
}

export function SimilarProducts({ currentProductId, currentVariantId }: SimilarProductsProps) {
  // Fetch all available products
  const { data, isLoading } = useProducts({ per_page: 100 });

  if (isLoading || !data?.products) {
    return null; // Silent fail - not critical to page
  }

  // Filter out the current product and randomly select 3-6 items
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

  // Shuffle using simple random sort (frontend-only, as specified)
  const shuffled = [...filteredItems].sort(() => Math.random() - 0.5);
  
  // Pick random count between 3 and 6
  const targetCount = Math.floor(Math.random() * 4) + 3; // 3 to 6
  const selectedItems = shuffled.slice(0, Math.min(targetCount, shuffled.length));

  // Don't show section if we don't have at least 3 products
  if (selectedItems.length < 3) {
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
