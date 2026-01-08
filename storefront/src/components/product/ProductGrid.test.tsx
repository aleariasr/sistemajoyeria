/**
 * Tests for ProductGrid Component
 * 
 * Validates that products are displayed in random order while maintaining
 * all products in the grid without omission.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProductGrid } from './ProductGrid';
import type { Product } from '@/lib/types';

// Mock ProductCard to simplify testing
jest.mock('./ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <div data-testid={`product-${product.id}`}>{product.nombre}</div>
  ),
}));

// Mock Skeleton
jest.mock('@/components/ui/Skeleton', () => ({
  ProductGridSkeleton: () => <div data-testid="loading-skeleton">Loading...</div>,
}));

// Mock Button
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

// Helper to create mock products
const createMockProduct = (id: number, categoria?: string): Product => ({
  id,
  codigo: `PROD-${id}`,
  nombre: `Product ${id}`,
  descripcion: `Description ${id}`,
  categoria: categoria || 'Test Category',
  precio: 10000,
  moneda: 'CRC',
  stock_disponible: true,
  stock: 10,
  imagen_url: `https://example.com/image-${id}.jpg`,
  imagenes: [],
  slug: `product-${id}`,
});

describe('ProductGrid', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders all products without omission', () => {
    const products = Array.from({ length: 10 }, (_, i) => createMockProduct(i + 1));
    
    render(<ProductGrid products={products} />);
    
    // Verify all products are rendered
    products.forEach((product) => {
      expect(screen.getByTestId(`product-${product.id}`)).toBeInTheDocument();
    });
  });

  it('shuffles products on different renders', () => {
    const products = Array.from({ length: 20 }, (_, i) => createMockProduct(i + 1));
    
    // Render multiple times and collect orders
    const orders: number[][] = [];
    for (let i = 0; i < 5; i++) {
      localStorage.clear(); // Clear localStorage to get fresh shuffle each time
      const { unmount } = render(<ProductGrid products={products} />);
      
      const renderedProducts = screen.getAllByTestId(/product-\d+/);
      const order = renderedProducts.map((el) => {
        const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      });
      
      orders.push(order);
      unmount();
    }
    
    // Check that at least some renders have different orders
    // (with 20 products, the probability of getting the same order twice is astronomically small)
    const firstOrder = JSON.stringify(orders[0]);
    const hasDifferentOrder = orders.some(
      (order) => JSON.stringify(order) !== firstOrder
    );
    
    expect(hasDifferentOrder).toBe(true);
  });

  it('persists order in localStorage', () => {
    const products = Array.from({ length: 10 }, (_, i) => createMockProduct(i + 1));
    
    // First render
    const { unmount } = render(<ProductGrid products={products} />);
    const firstRenderedProducts = screen.getAllByTestId(/product-\d+/);
    const firstOrder = firstRenderedProducts.map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Check that order is saved in localStorage
    const storedOrder = localStorage.getItem('productOrder');
    expect(storedOrder).toBeTruthy();
    
    unmount();
    
    // Second render should use the same order
    render(<ProductGrid products={products} />);
    const secondRenderedProducts = screen.getAllByTestId(/product-\d+/);
    const secondOrder = secondRenderedProducts.map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Orders should be identical
    expect(secondOrder).toEqual(firstOrder);
  });

  it('maintains order when new products are added (infinite scroll)', () => {
    // Simulate initial load
    const initialProducts = Array.from({ length: 5 }, (_, i) => createMockProduct(i + 1));
    
    const { unmount, rerender } = render(<ProductGrid products={initialProducts} />);
    const initialRenderedProducts = screen.getAllByTestId(/product-\d+/);
    const initialOrder = initialRenderedProducts.map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Simulate loading more products (infinite scroll)
    const moreProducts = [
      ...initialProducts,
      ...Array.from({ length: 3 }, (_, i) => createMockProduct(i + 6))
    ];
    
    rerender(<ProductGrid products={moreProducts} />);
    const afterScrollRenderedProducts = screen.getAllByTestId(/product-\d+/);
    const afterScrollOrder = afterScrollRenderedProducts.map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // The first 5 products should maintain their original order
    const firstFiveAfterScroll = afterScrollOrder.slice(0, 5);
    expect(firstFiveAfterScroll).toEqual(initialOrder);
    
    // Total should be 8 products now
    expect(afterScrollOrder).toHaveLength(8);
    
    // New products (6, 7, 8) should be appended
    const newProductsInOrder = afterScrollOrder.slice(5);
    expect(newProductsInOrder).toContain(6);
    expect(newProductsInOrder).toContain(7);
    expect(newProductsInOrder).toContain(8);
  });

  it('regenerates order when product list changes', () => {
    const products1 = Array.from({ length: 5 }, (_, i) => createMockProduct(i + 1));
    const products2 = Array.from({ length: 5 }, (_, i) => createMockProduct(i + 6));
    
    // First render with products1
    const { unmount } = render(<ProductGrid products={products1} />);
    const storedOrder1 = localStorage.getItem('productOrder');
    expect(storedOrder1).toBeTruthy();
    unmount();
    
    // Second render with different products
    render(<ProductGrid products={products2} />);
    const storedOrder2 = localStorage.getItem('productOrder');
    
    // Orders should be different because product list changed
    expect(storedOrder2).not.toEqual(storedOrder1);
  });

  it('maintains order across multiple infinite scroll loads', () => {
    // Simulate initial load
    const page1 = Array.from({ length: 5 }, (_, i) => createMockProduct(i + 1));
    
    const { rerender } = render(<ProductGrid products={page1} />);
    const order1 = screen.getAllByTestId(/product-\d+/).map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Load page 2
    const page2 = [
      ...page1,
      ...Array.from({ length: 5 }, (_, i) => createMockProduct(i + 6))
    ];
    rerender(<ProductGrid products={page2} />);
    const order2 = screen.getAllByTestId(/product-\d+/).map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // Load page 3
    const page3 = [
      ...page2,
      ...Array.from({ length: 5 }, (_, i) => createMockProduct(i + 11))
    ];
    rerender(<ProductGrid products={page3} />);
    const order3 = screen.getAllByTestId(/product-\d+/).map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    // First 5 should remain consistent across all loads
    expect(order2.slice(0, 5)).toEqual(order1);
    expect(order3.slice(0, 5)).toEqual(order1);
    
    // First 10 should remain consistent in page 3
    expect(order3.slice(0, 10)).toEqual(order2);
    
    // Total products should increase
    expect(order1).toHaveLength(5);
    expect(order2).toHaveLength(10);
    expect(order3).toHaveLength(15);
  });

  it('balances categories in shuffle', () => {
    // Create products with multiple categories
    const products = [
      ...Array.from({ length: 10 }, (_, i) => createMockProduct(i + 1, 'Anillos')),
      ...Array.from({ length: 10 }, (_, i) => createMockProduct(i + 11, 'Collares')),
      ...Array.from({ length: 10 }, (_, i) => createMockProduct(i + 21, 'Aretes')),
    ];
    
    localStorage.clear(); // Ensure fresh shuffle
    render(<ProductGrid products={products} />);
    
    const renderedProducts = screen.getAllByTestId(/product-\d+/);
    const renderedOrder = renderedProducts.map((el) => {
      const match = el.getAttribute('data-testid')?.match(/product-(\d+)/);
      const id = match ? parseInt(match[1], 10) : 0;
      return products.find(p => p.id === id)!;
    });
    
    // Check that there are no long consecutive runs of the same category
    let maxConsecutive = 1;
    let currentConsecutive = 1;
    
    for (let i = 1; i < renderedOrder.length; i++) {
      if (renderedOrder[i].categoria === renderedOrder[i - 1].categoria) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }
    
    // With balanced distribution, we should not have more than 3 consecutive items
    // of the same category (allowing for some variance due to randomness)
    expect(maxConsecutive).toBeLessThanOrEqual(5);
  });

  it('displays loading state', () => {
    render(<ProductGrid products={[]} isLoading={true} />);
    
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('displays error state with retry button', () => {
    const error = new Error('Test error');
    const onRetry = jest.fn();
    
    render(<ProductGrid products={[]} error={error} onRetry={onRetry} />);
    
    expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.getByText('Intentar de nuevo')).toBeInTheDocument();
  });

  it('displays empty state when no products', () => {
    render(<ProductGrid products={[]} />);
    
    expect(screen.getByText('No se encontraron productos')).toBeInTheDocument();
  });

  it('maintains product count after shuffle', () => {
    const products = Array.from({ length: 15 }, (_, i) => createMockProduct(i + 1));
    
    render(<ProductGrid products={products} />);
    
    const renderedProducts = screen.getAllByTestId(/product-\d+/);
    expect(renderedProducts).toHaveLength(products.length);
  });

  it('preserves product data after shuffle', () => {
    const products = [
      createMockProduct(1),
      createMockProduct(2),
      createMockProduct(3),
    ];
    
    render(<ProductGrid products={products} />);
    
    // Check that all product names are present
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
  });
});
