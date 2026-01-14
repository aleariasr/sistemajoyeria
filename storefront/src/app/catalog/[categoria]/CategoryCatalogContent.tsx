/**
 * Category Catalog Content Component (Client)
 * 
 * Enhanced catalog with:
 * - URL-based category filtering
 * - State persistence (scroll position and search)
 * - Infinite scroll for better performance
 */

'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteProducts, useCategories } from '@/hooks/useApi';
import { ProductGrid } from '@/components/product';
import { debounce } from '@/lib/utils';

interface CategoryCatalogContentProps {
  initialCategory: string;
}

// Session storage keys for state persistence
const STORAGE_KEYS = {
  SCROLL_POS: 'catalog_scroll_position',
  SEARCH_TERM: 'catalog_search_term',
  LAST_CATEGORY: 'catalog_last_category',
};

export default function CategoryCatalogContent({ initialCategory }: CategoryCatalogContentProps) {
  const router = useRouter();
  
  // Normalize category: 'todos' means no filter
  const categoryFilter = initialCategory === 'todos' ? null : initialCategory;
  
  // Initialize state from sessionStorage if returning to catalog
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window === 'undefined') return '';
    const stored = sessionStorage.getItem(STORAGE_KEYS.SEARCH_TERM);
    const lastCategory = sessionStorage.getItem(STORAGE_KEYS.LAST_CATEGORY);
    // Only restore search if returning to the same category
    return lastCategory === initialCategory && stored ? stored : '';
  });
  
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [shouldRestoreScroll, setShouldRestoreScroll] = useState(true);
  
  // Ref for infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Debounce search input
  const handleSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  // Fetch products with infinite scroll
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteProducts({
    search: debouncedSearch || undefined,
    category: categoryFilter || undefined,
    per_page: 20,
    shuffle: true,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  // Flatten all pages into a single products array
  const products = useMemo(() => {
    return data?.pages.flatMap(page => page.products) || [];
  }, [data]);

  // Total count from first page
  const totalCount = data?.pages[0]?.total || 0;

  // Save state to sessionStorage when navigating away
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.SCROLL_POS, String(window.scrollY));
        sessionStorage.setItem(STORAGE_KEYS.SEARCH_TERM, searchTerm);
        sessionStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, initialCategory);
      }
    };
  }, [searchTerm, initialCategory]);

  // Restore scroll position after products load
  useEffect(() => {
    if (typeof window === 'undefined' || !shouldRestoreScroll) return;
    
    // Only restore on initial mount and after data loads
    if (isInitialMount.current && !isLoading && products.length > 0) {
      const savedPosition = sessionStorage.getItem(STORAGE_KEYS.SCROLL_POS);
      const lastCategory = sessionStorage.getItem(STORAGE_KEYS.LAST_CATEGORY);
      
      if (savedPosition && lastCategory === initialCategory) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo({
            top: parseInt(savedPosition, 10),
            behavior: 'instant' as ScrollBehavior,
          });
          setShouldRestoreScroll(false);
        });
      }
      
      isInitialMount.current = false;
    }
  }, [isLoading, products.length, shouldRestoreScroll, initialCategory]);

  // Clear saved search when leaving the component
  useEffect(() => {
    // Initialize debounced search from search term
    if (searchTerm) {
      setDebouncedSearch(searchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoize fetchNextPage to prevent unnecessary useEffect re-runs
  const handleFetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleFetchNextPage();
        }
      },
      {
        rootMargin: '200px',
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, handleFetchNextPage]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearchChange(value);
  };

  const handleCategoryChange = (category: string) => {
    // Clear session storage when actively changing category
    sessionStorage.removeItem(STORAGE_KEYS.SCROLL_POS);
    sessionStorage.removeItem(STORAGE_KEYS.SEARCH_TERM);
    
    // Navigate to new category route
    router.push(`/catalog/${category}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    sessionStorage.removeItem(STORAGE_KEYS.SCROLL_POS);
    sessionStorage.removeItem(STORAGE_KEYS.SEARCH_TERM);
    
    // Navigate to 'todos' if not already there
    if (initialCategory !== 'todos') {
      router.push('/catalog/todos');
    }
  };

  const hasFilters = searchTerm;

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Buscar productos..."
            className="w-full pl-12 pr-4 py-3 border-2 border-primary-200 rounded-full
                       focus:outline-none focus:border-primary-900 transition-colors
                       placeholder:text-primary-400"
            aria-label="Buscar productos"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange('todos')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                       ${
                         initialCategory === 'todos'
                           ? 'bg-primary-900 text-white'
                           : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                       }`}
          >
            Todos
          </button>
          {categoriesLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-20 h-9 bg-primary-100 rounded-full animate-pulse"
                />
              ))}
            </div>
          ) : (
            categoriesData?.categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                           ${
                             initialCategory === category
                               ? 'bg-primary-900 text-white'
                               : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                           }`}
              >
                {category}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-primary-500">Filtros activos:</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 rounded-full text-sm">
              Búsqueda: {searchTerm}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDebouncedSearch('');
                }}
                className="ml-1 hover:text-red-500"
                aria-label="Quitar filtro de búsqueda"
              >
                ×
              </button>
            </span>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-primary-600 hover:text-primary-900 underline"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* Results Count */}
      {!isLoading && (
        <p className="text-primary-500">
          Mostrando {products.length} de {totalCount} producto
          {totalCount !== 1 && 's'}
          {categoryFilter && ` en ${categoryFilter}`}
        </p>
      )}

      {/* Products Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        error={error as Error | null}
        onRetry={refetch}
      />

      {/* Infinite Scroll Trigger & Load More Button */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="mt-8 text-center">
          {isFetchingNextPage ? (
            <div className="flex justify-center items-center gap-2 py-8">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-900 rounded-full animate-spin" />
              <span className="text-primary-600">Cargando más productos...</span>
            </div>
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="px-6 py-3 bg-primary-900 text-white font-medium rounded-full
                         hover:bg-primary-800 transition-colors duration-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Cargar más productos
            </button>
          )}
        </div>
      )}

      {/* End of catalog message */}
      {!hasNextPage && products.length > 0 && (
        <div className="mt-8 text-center py-8 border-t border-primary-200">
          <p className="text-primary-500">
            Has llegado al final del catálogo
          </p>
        </div>
      )}
    </div>
  );
}
