/**
 * Client-side Providers
 * 
 * Wraps the app with necessary providers:
 * - React Query for server state
 * - Other client-side providers
 */

'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ProvidersProps {
  children: ReactNode;
}

// Type for API errors with response property
interface ApiError extends Error {
  response?: {
    status?: number;
  };
}

export function Providers({ children }: ProvidersProps) {
  // Create a stable QueryClient instance with optimized settings
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes - data is fresh for 5 min
            gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache for 30 min
            retry: (failureCount, error) => {
              const apiError = error as ApiError;
              // Don't retry on 404s (product not found)
              if (apiError?.response?.status === 404) return false;
              // Don't retry on 403s (forbidden)
              if (apiError?.response?.status === 403) return false;
              // Retry up to 2 times for other errors
              return failureCount < 2;
            },
            refetchOnWindowFocus: false, // Don't refetch when window regains focus
            refetchOnReconnect: true, // Refetch when reconnecting to network
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default Providers;
