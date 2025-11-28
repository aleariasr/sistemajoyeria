/**
 * Catalog Content Component (Client)
 * 
 * Handles product fetching, filtering, and display for the catalog page.
 */

'use client';

import { useState, useMemo } from 'react';
import { useProducts, useCategories } from '@/hooks/useApi';
import { ProductGrid } from '@/components/product';
import { debounce } from '@/lib/utils';

export default function CatalogContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  const handleSearchChange = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedSearch(value);
      }, 300),
    []
  );

  // Fetch products
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch,
  } = useProducts({
    search: debouncedSearch || undefined,
    category: selectedCategory || undefined,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearchChange(value);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedCategory(null);
  };

  const hasFilters = searchTerm || selectedCategory;

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
            onClick={() => handleCategoryChange(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                       ${
                         !selectedCategory
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
                             selectedCategory === category
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
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 rounded-full text-sm">
              {selectedCategory}
              <button
                onClick={() => setSelectedCategory(null)}
                className="ml-1 hover:text-red-500"
                aria-label="Quitar filtro de categoría"
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
      {productsData && !productsLoading && (
        <p className="text-primary-500">
          {productsData.products.length} producto
          {productsData.products.length !== 1 && 's'} encontrado
          {productsData.products.length !== 1 && 's'}
        </p>
      )}

      {/* Products Grid */}
      <ProductGrid
        products={productsData?.products || []}
        isLoading={productsLoading}
        error={productsError as Error | null}
        onRetry={refetch}
      />
    </div>
  );
}
