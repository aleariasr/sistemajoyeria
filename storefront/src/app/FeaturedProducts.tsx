/**
 * Featured Products Component (Client)
 * 
 * Fetches and displays featured products on the homepage.
 */

'use client';

import { useFeaturedProducts } from '@/hooks/useApi';
import { ProductGrid } from '@/components/product';

export default function FeaturedProducts() {
  const { data, isLoading, error, refetch } = useFeaturedProducts();

  return (
    <ProductGrid
      products={data?.products || []}
      isLoading={isLoading}
      error={error as Error | null}
      onRetry={refetch}
    />
  );
}
