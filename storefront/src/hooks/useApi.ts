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
  product: (id: number) => ['product', id] as const,
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
    // When shuffle is enabled, cache for 24 hours to preserve shuffled order
    // across navigation. When user navigates back from product detail, they see the
    // same products in the same shuffled order they left. Using 24 hours instead of
    // Infinity to prevent memory leaks and ensure eventual cache invalidation.
    staleTime: params?.shuffle ? 1000 * 60 * 60 * 24 : 1000 * 60 * 5, // 24h for shuffle, 5 min otherwise
    // Garbage collection time should match staleTime pattern
    gcTime: params?.shuffle ? 1000 * 60 * 60 * 24 : 1000 * 60 * 10, // 24h for shuffle, 10 min otherwise
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
 */
export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => api.getProduct(id),
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
