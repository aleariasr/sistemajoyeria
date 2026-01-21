/**
 * API Mock utilities for E2E tests
 * 
 * Provides utilities to mock backend API responses using Playwright's route interception
 */

import { Page, Route } from '@playwright/test';
import {
  createMockProductsResponse,
  createMockFeaturedResponse,
  createMockCategoriesResponse,
  createMockProduct,
  createMockSet,
  shuffleWithSeed,
  applyCategoryOrderingRule,
} from './products';
import type { CreateOrderResponse } from '@/lib/types';

/**
 * Setup API mocks for a test
 */
export async function setupApiMocks(page: Page, options: {
  /**
   * Mock successful API responses
   */
  mockProducts?: boolean;
  mockFeatured?: boolean;
  mockCategories?: boolean;
  mockProductDetail?: boolean;
  mockOrders?: boolean;
  
  /**
   * Custom responses
   */
  customProductsResponse?: any;
  customOrderResponse?: any;
  
  /**
   * Error scenarios
   */
  productsError?: boolean;
  orderError?: boolean;
} = {}) {
  // Match any backend API URL pattern (localhost:3001 or environment variable)
  const apiPattern = '**/api/public/**';
  
  // Mock products list
  if (options.mockProducts !== false) {
    await page.route(`${apiPattern}/products`, async (route: Route) => {
      const url = new URL(route.request().url());
      const page = parseInt(url.searchParams.get('pagina') || '1');
      const perPage = parseInt(url.searchParams.get('por_pagina') || '20');
      const category = url.searchParams.get('categoria');
      const search = url.searchParams.get('busqueda');
      const shuffle = url.searchParams.get('shuffle') === 'true';
      const shuffleSeed = parseInt(url.searchParams.get('shuffle_seed') || '0');
      
      if (options.productsError) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
        return;
      }
      
      if (options.customProductsResponse) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(options.customProductsResponse),
        });
        return;
      }
      
      let response = createMockProductsResponse({
        page,
        perPage,
        total: 50,
        category: category || undefined,
        hasVariants: true,
      });
      
      // Apply search filter
      if (search) {
        response.products = response.products.filter(p =>
          p.nombre.toLowerCase().includes(search.toLowerCase()) ||
          p.descripcion?.toLowerCase().includes(search.toLowerCase())
        );
        response.total = response.products.length;
        response.total_products = response.products.length;
      }
      
      // Apply shuffle if requested
      if (shuffle && shuffleSeed) {
        response.products = shuffleWithSeed(response.products, shuffleSeed);
        response.products = applyCategoryOrderingRule(response.products);
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }
  
  // Mock featured products
  if (options.mockFeatured !== false) {
    await page.route(`${apiPattern}/products/featured`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockFeaturedResponse()),
      });
    });
  }
  
  // Mock categories
  if (options.mockCategories !== false) {
    await page.route(`${apiPattern}/categories`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockCategoriesResponse()),
      });
    });
  }
  
  // Mock product detail
  if (options.mockProductDetail !== false) {
    await page.route(`${apiPattern}/products/*`, async (route: Route) => {
      const url = new URL(route.request().url());
      const pathParts = url.pathname.split('/');
      const productId = parseInt(pathParts[pathParts.length - 1]);
      const varianteId = url.searchParams.get('variante_id');
      
      // Skip if this is the components endpoint
      if (url.pathname.endsWith('/componentes')) {
        return route.continue();
      }
      
      let product;
      if (productId === 999) {
        // Special case for set product
        product = createMockSet(productId);
      } else {
        product = createMockProduct({
          id: productId,
          variante_id: varianteId ? parseInt(varianteId) : undefined,
        });
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(product),
      });
    });
    
    // Mock product components
    await page.route(`${apiPattern}/products/*/componentes`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          componentes: [
            {
              id: 1,
              codigo: 'COMP-1',
              nombre: 'Component 1',
              descripcion: 'Description',
              precio: 5000,
              moneda: 'CRC',
              stock_disponible: true,
              stock: 10,
              imagen_url: 'https://via.placeholder.com/200',
              cantidad_requerida: 1,
              estado: 'disponible',
              es_activo: true,
            },
          ],
          stock_set: 10,
          completo: true,
        }),
      });
    });
  }
  
  // Mock order creation
  if (options.mockOrders !== false) {
    await page.route(`${apiPattern}/orders`, async (route: Route) => {
      if (route.request().method() === 'POST') {
        if (options.orderError) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Stock insuficiente' }),
          });
          return;
        }
        
        const response: CreateOrderResponse = options.customOrderResponse || {
          success: true,
          message: 'Pedido creado exitosamente',
          order: {
            id: 12345,
            total: 25000,
            items_count: 2,
            customer_name: 'Test Customer',
          },
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      } else {
        await route.continue();
      }
    });
    
    // Mock order detail
    await page.route(`${apiPattern}/orders/*`, async (route: Route) => {
      if (route.request().method() === 'GET') {
        const url = new URL(route.request().url());
        const pathParts = url.pathname.split('/');
        const orderId = parseInt(pathParts[pathParts.length - 1]);
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: orderId,
            date: new Date().toISOString(),
            total: 25000,
            subtotal: 25000,
            discount: 0,
            payment_method: 'Efectivo',
            notes: 'Test order',
            items: [
              {
                id: 1,
                product_name: 'Product 1',
                product_image: 'https://via.placeholder.com/200',
                quantity: 2,
                unit_price: 10000,
                subtotal: 20000,
              },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });
  }
}

/**
 * Wait for API call to complete
 */
export async function waitForApiCall(page: Page, endpoint: string, timeout = 5000) {
  return page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  );
}

/**
 * Mock API error
 */
export async function mockApiError(page: Page, endpoint: string, status = 500, message = 'Internal server error') {
  const apiPattern = '**/api/public';
  
  await page.route(`${apiPattern}${endpoint}`, async (route: Route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: message }),
    });
  });
}

/**
 * Mock empty products response
 */
export async function mockEmptyProducts(page: Page) {
  const apiPattern = '**/api/public';
  
  await page.route(`${apiPattern}/products`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [],
        total: 0,
        total_products: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
        has_more: false,
      }),
    });
  });
}
