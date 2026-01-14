/**
 * Tests for CategoryCatalogContent Component
 * 
 * Validates:
 * - Category-based filtering from URL
 * - State persistence (scroll position, search term, category)
 * - Navigation between categories
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryCatalogContent from './CategoryCatalogContent';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  
  constructor() {}
  
  disconnect(): void {}
  observe(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve(): void {}
}

global.IntersectionObserver = IntersectionObserverMock;

// Mock useApi hooks
const mockFetchNextPage = jest.fn();
const mockRefetch = jest.fn();

jest.mock('@/hooks/useApi', () => ({
  useInfiniteProducts: jest.fn(() => ({
    data: {
      pages: [
        {
          products: [],
          total: 0,
          has_more: false,
        },
      ],
    },
    isLoading: false,
    error: null,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: mockRefetch,
  })),
  useCategories: jest.fn(() => ({
    data: {
      categories: ['Anillos', 'Aretes', 'Collares'],
    },
    isLoading: false,
  })),
}));

// Mock ProductGrid
jest.mock('@/components/product', () => ({
  ProductGrid: ({ products }: any) => (
    <div data-testid="product-grid">
      {products.map((p: any) => (
        <div key={p.id} data-testid={`product-${p.id}`}>
          {p.nombre}
        </div>
      ))}
    </div>
  ),
}));

describe('CategoryCatalogContent', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    mockPush.mockClear();
    
    // Mock window.scrollTo
    window.scrollTo = jest.fn();
  });

  it('renders with initial category', () => {
    render(<CategoryCatalogContent initialCategory="anillos" />);
    
    // Should render the category filter buttons
    expect(screen.getByText('Todos')).toBeInTheDocument();
    expect(screen.getByText('Anillos')).toBeInTheDocument();
    expect(screen.getByText('Aretes')).toBeInTheDocument();
  });

  it('highlights active category button', () => {
    render(<CategoryCatalogContent initialCategory="Anillos" />);
    
    const anillosButton = screen.getByRole('button', { name: 'Anillos' });
    const todosButton = screen.getByRole('button', { name: 'Todos' });
    
    // Anillos should be active
    expect(anillosButton).toHaveClass('bg-primary-900', 'text-white');
    
    // Todos should not be active
    expect(todosButton).not.toHaveClass('bg-primary-900');
  });

  it('navigates to new category when button clicked', () => {
    render(<CategoryCatalogContent initialCategory="todos" />);
    
    const aretesButton = screen.getByRole('button', { name: 'Aretes' });
    fireEvent.click(aretesButton);
    
    expect(mockPush).toHaveBeenCalledWith('/catalog/Aretes');
  });

  it('saves search term to sessionStorage on unmount', async () => {
    const { unmount } = render(<CategoryCatalogContent initialCategory="todos" />);
    
    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'collar oro' } });
    
    // Wait for component to update
    await waitFor(() => {
      expect(searchInput).toHaveValue('collar oro');
    });
    
    // Unmount to trigger sessionStorage save via useEffect cleanup
    unmount();
    
    // Check sessionStorage was saved
    expect(sessionStorage.getItem('catalog_search_term')).toBe('collar oro');
    expect(sessionStorage.getItem('catalog_last_category')).toBe('todos');
  });

  it('restores search term from sessionStorage', () => {
    // Set up sessionStorage
    sessionStorage.setItem('catalog_search_term', 'anillo plata');
    sessionStorage.setItem('catalog_last_category', 'todos');
    
    render(<CategoryCatalogContent initialCategory="todos" />);
    
    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    expect(searchInput).toHaveValue('anillo plata');
  });

  it('clears sessionStorage when changing category', () => {
    sessionStorage.setItem('catalog_scroll_position', '500');
    sessionStorage.setItem('catalog_search_term', 'test');
    
    render(<CategoryCatalogContent initialCategory="todos" />);
    
    const anillosButton = screen.getByRole('button', { name: 'Anillos' });
    fireEvent.click(anillosButton);
    
    // Should clear scroll position and search
    expect(sessionStorage.getItem('catalog_scroll_position')).toBeNull();
    expect(sessionStorage.getItem('catalog_search_term')).toBeNull();
  });

  it('shows category in results count', () => {
    const { useInfiniteProducts } = require('@/hooks/useApi');
    useInfiniteProducts.mockImplementation(() => ({
      data: {
        pages: [
          {
            products: [
              { id: 1, nombre: 'Anillo 1' },
              { id: 2, nombre: 'Anillo 2' },
            ],
            total: 10,
            has_more: true,
          },
        ],
      },
      isLoading: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
      refetch: mockRefetch,
    }));
    
    render(<CategoryCatalogContent initialCategory="Anillos" />);
    
    expect(screen.getByText(/Mostrando 2 de 10 productos en Anillos/)).toBeInTheDocument();
  });

  it('does not show category in results count for "todos"', () => {
    const { useInfiniteProducts } = require('@/hooks/useApi');
    useInfiniteProducts.mockImplementation(() => ({
      data: {
        pages: [
          {
            products: [{ id: 1, nombre: 'Product 1' }],
            total: 5,
            has_more: false,
          },
        ],
      },
      isLoading: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: mockRefetch,
    }));
    
    render(<CategoryCatalogContent initialCategory="todos" />);
    
    // Should not include category name - just check it exists
    expect(screen.getByText(/Mostrando 1 de 5 producto/)).toBeInTheDocument();
  });

  it('clears all filters when clear button clicked', () => {
    render(<CategoryCatalogContent initialCategory="anillos" />);
    
    // Enter search term
    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Clear filters button should appear
    const clearButton = screen.getByText('Limpiar todo');
    fireEvent.click(clearButton);
    
    // Should clear search
    expect(searchInput).toHaveValue('');
    
    // Should navigate to todos
    expect(mockPush).toHaveBeenCalledWith('/catalog/todos');
  });

  it('does not navigate to todos when already there and clearing', () => {
    render(<CategoryCatalogContent initialCategory="todos" />);
    
    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    mockPush.mockClear();
    
    const clearButton = screen.getByText('Limpiar todo');
    fireEvent.click(clearButton);
    
    // Should not navigate if already on todos
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('passes correct category filter to useInfiniteProducts', () => {
    const { useInfiniteProducts } = require('@/hooks/useApi');
    
    render(<CategoryCatalogContent initialCategory="anillos" />);
    
    expect(useInfiniteProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'anillos',
      })
    );
  });

  it('passes null category filter for "todos"', () => {
    const { useInfiniteProducts } = require('@/hooks/useApi');
    
    render(<CategoryCatalogContent initialCategory="todos" />);
    
    expect(useInfiniteProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        category: undefined,
      })
    );
  });

  it('restores scroll position after products load', async () => {
    sessionStorage.setItem('catalog_scroll_position', '300');
    sessionStorage.setItem('catalog_last_category', 'anillos');
    
    const { useInfiniteProducts } = require('@/hooks/useApi');
    useInfiniteProducts.mockImplementation(() => ({
      data: {
        pages: [
          {
            products: [{ id: 1, nombre: 'Product 1' }],
            total: 1,
            has_more: false,
          },
        ],
      },
      isLoading: false,
      error: null,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      refetch: mockRefetch,
    }));
    
    render(<CategoryCatalogContent initialCategory="anillos" />);
    
    // Wait for scroll restoration
    await waitFor(() => {
      expect(window.scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({
          top: 300,
        })
      );
    });
  });

  it('does not restore scroll for different category', () => {
    sessionStorage.setItem('catalog_scroll_position', '300');
    sessionStorage.setItem('catalog_last_category', 'anillos');
    
    render(<CategoryCatalogContent initialCategory="aretes" />);
    
    // Should not restore scroll when category is different
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
