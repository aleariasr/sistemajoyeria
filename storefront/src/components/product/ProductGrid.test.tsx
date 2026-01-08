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
const createMockProduct = (id: number): Product => ({
  id,
  codigo: `PROD-${id}`,
  nombre: `Product ${id}`,
  descripcion: `Description ${id}`,
  categoria: 'Test Category',
  precio: 10000,
  moneda: 'CRC',
  stock_disponible: true,
  stock: 10,
  imagen_url: `https://example.com/image-${id}.jpg`,
  imagenes: [],
  slug: `product-${id}`,
});

describe('ProductGrid', () => {
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
