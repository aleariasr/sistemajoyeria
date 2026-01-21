/**
 * React Query hooks for API data fetching
 * 
 * These hooks provide type-safe data fetching with:
 * - Automatic caching
 * - Background refetching
 * - Loading/error states
 * - Optimistic updates
 */

'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CreateOrderRequest } from '@/lib/types';

/**
 * Query keys for cache management
 */
export const queryKeys = {
  products: (params?: Record<string, unknown>) => ['products', params] as const,
  featuredProducts: ['products', 'featured'] as const,
  product: (id: number, varianteId?: number) => 
    varianteId ? ['product', id, 'variant', varianteId] as const : ['product', id] as const,
  categories: ['categories'] as const,
  order: (id: number) => ['order', id] as const,
};

/**
 * Fetch all products with optional filtering
 */
export function useProducts(params?: {
  search?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  page?: number;
  per_page?: number;
  shuffle?: boolean;
}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => api.getProducts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch products with infinite scroll support
 * This hook automatically manages pagination for infinite scroll UI
 */
export function useInfiniteProducts(params?: {
  search?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  per_page?: number;
  shuffle?: boolean;
  shuffle_seed?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params], // Separate key for infinite queries
    queryFn: ({ pageParam = 1 }) => 
      api.getProducts({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Return next page number if there are more pages, otherwise undefined
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },
    // Reduce cache time to prevent corrupted data from persisting too long
    // 30 minutes for shuffle mode, 5 minutes for normal mode
    staleTime: params?.shuffle ? 1000 * 60 * 30 : 1000 * 60 * 5, // 30min shuffle, 5min normal
    gcTime: params?.shuffle ? 1000 * 60 * 60 : 1000 * 60 * 10, // 1h shuffle, 10min normal
    
    // Disable refetch on window focus to avoid unnecessary re-fetching
    // Users can manually refresh if needed
    refetchOnWindowFocus: false,
    
    // CRITICAL: Disable refetch on mount to preserve order when navigating back
    // This ensures the same shuffled order is maintained when returning from product detail
    refetchOnMount: false,
  });
}

/**
 * Fetch featured products for homepage
 */
export function useFeaturedProducts() {
  return useQuery({
    queryKey: queryKeys.featuredProducts,
    queryFn: () => api.getFeaturedProducts(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Fetch a single product by ID
 * @param id - Product ID
 * @param varianteId - Optional variant ID to fetch specific variant
 */
export function useProduct(id: number, varianteId?: number) {
  return useQuery({
    queryKey: queryKeys.product(id, varianteId),
    queryFn: () => api.getProduct(id, varianteId),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch all product categories
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
    staleTime: 1000 * 60 * 30, // 30 minutes (categories change infrequently)
  });
}

/**
 * Fetch order details by ID
 */
export function useOrder(id: number) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => api.getOrder(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 60, // 1 hour (orders don't change)
  });
}

/**
 * Create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: CreateOrderRequest) => api.createOrder(order),
    onSuccess: () => {
      // Invalidate products to update stock
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
