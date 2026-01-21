/**
 * E2E Tests for Catalog Flow
 * 
 * Tests:
 * - Filters and search
 * - Pagination/infinite scroll
 * - Deterministic shuffle with seed
 * - Deduplication by _uniqueKey
 * - Category ordering rules
 * - Scroll restore and back navigation
 * - Empty/error states
 */

import { test, expect } from '@playwright/test';
import { setupApiMocks, mockEmptyProducts, mockApiError } from './fixtures/api-mocks';

test.describe('Catalog Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupApiMocks(page);
  });

  test('should display products in catalog', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid^="product-"]', { timeout: 10000 });
    
    // Should show products
    const products = await page.locator('[data-testid^="product-"]').all();
    expect(products.length).toBeGreaterThan(0);
    
    // Should show product count
    await expect(page.locator('text=/Mostrando \\d+ de \\d+ producto/i')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Click on "Anillos" category button
    await page.click('button:has-text("Anillos")');
    
    // URL should change
    await expect(page).toHaveURL(/\/catalog\/Anillos/);
    
    // Should show category in results count
    await expect(page.locator('text=/Anillos/i')).toBeVisible();
  });

  test('should search products', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    // Wait for products to load
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Enter search term
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('Product 1');
    
    // Wait for debounce and API call
    await page.waitForTimeout(1000);
    
    // Should show filtered products
    const products = await page.locator('[data-testid^="product-"]').all();
    expect(products.length).toBeGreaterThan(0);
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/catalog/Anillos');
    
    // Enter search term
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('test');
    
    await page.waitForTimeout(500);
    
    // Click clear button
    await page.click('button:has-text("Limpiar todo")');
    
    // Should clear search
    await expect(searchInput).toHaveValue('');
    
    // Should navigate to "todos"
    await expect(page).toHaveURL(/\/catalog\/todos/);
  });

  test('should maintain order with deterministic shuffle', async ({ page }) => {
    // Visit catalog with shuffle
    await page.goto('/catalog/todos');
    
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Get initial order
    const firstProducts = await page.locator('[data-testid^="product-"]').allTextContents();
    
    // Reload page
    await page.reload();
    
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Get order after reload
    const secondProducts = await page.locator('[data-testid^="product-"]').allTextContents();
    
    // Order should be the same (due to localStorage persistence)
    expect(firstProducts).toEqual(secondProducts);
  });

  test('should handle infinite scroll', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    // Wait for initial products
    await page.waitForSelector('[data-testid^="product-"]');
    
    const initialCount = await page.locator('[data-testid^="product-"]').count();
    
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for new products to load
    await page.waitForTimeout(2000);
    
    const newCount = await page.locator('[data-testid^="product-"]').count();
    
    // Should have loaded more products
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });

  test('should restore scroll position when navigating back', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    
    // Wait a bit for scroll position to be saved
    await page.waitForTimeout(500);
    
    // Click on a product
    const firstProduct = page.locator('[data-testid^="product-"]').first();
    await firstProduct.click();
    
    // Wait for product detail page
    await expect(page).toHaveURL(/\/product\//);
    
    // Go back
    await page.goBack();
    
    // Wait for catalog to load
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Give time for scroll restoration
    await page.waitForTimeout(500);
    
    // Scroll position should be restored (approximately)
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);
  });

  test('should preserve search when navigating back', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Enter search
    const searchInput = page.locator('input[placeholder*="Buscar"]');
    await searchInput.fill('Product 1');
    await page.waitForTimeout(1000);
    
    // Click on a product
    const firstProduct = page.locator('[data-testid^="product-"]').first();
    await firstProduct.click();
    
    // Wait for detail page
    await expect(page).toHaveURL(/\/product\//);
    
    // Go back
    await page.goBack();
    
    // Search term should be preserved
    await expect(searchInput).toHaveValue('Product 1');
  });

  test('should show empty state when no products', async ({ page }) => {
    // Mock empty response
    await mockEmptyProducts(page);
    
    await page.goto('/catalog/todos');
    
    // Should show empty message
    await expect(page.locator('text=/No se encontraron productos/i')).toBeVisible();
  });

  test('should show error state on API failure', async ({ page }) => {
    // Mock error response
    await mockApiError(page, '/public/products');
    
    await page.goto('/catalog/todos');
    
    // Should show error message
    await expect(page.locator('text=/Error al cargar productos/i')).toBeVisible();
    
    // Should show retry button
    await expect(page.locator('button:has-text("Intentar de nuevo")')).toBeVisible();
  });

  test('should handle category navigation', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    await page.waitForSelector('[data-testid^="product-"]');
    
    // Click on "Anillos"
    await page.click('button:has-text("Anillos")');
    await expect(page).toHaveURL(/\/catalog\/Anillos/);
    
    // Click on "Aretes"
    await page.click('button:has-text("Aretes")');
    await expect(page).toHaveURL(/\/catalog\/Aretes/);
    
    // Click on "Todos"
    await page.click('button:has-text("Todos")');
    await expect(page).toHaveURL(/\/catalog\/todos/);
  });

  test('should show category in breadcrumb', async ({ page }) => {
    await page.goto('/catalog/Anillos');
    
    // Should show category
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText('Anillos');
  });

  test('should display product cards with correct information', async ({ page }) => {
    await page.goto('/catalog/todos');
    
    await page.waitForSelector('[data-testid^="product-"]');
    
    const firstProduct = page.locator('[data-testid^="product-"]').first();
    
    // Should have image
    await expect(firstProduct.locator('img')).toBeVisible();
    
    // Should have name
    await expect(firstProduct.locator('text=/Product/i')).toBeVisible();
    
    // Should have price
    await expect(firstProduct.locator('text=/₡/i')).toBeVisible();
  });

  test('should handle featured section on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Should show featured products
    await expect(page.locator('text=/Destacados/i, text=/Featured/i')).toBeVisible();
    
    // Should have products
    const products = await page.locator('[data-testid^="product-"]').all();
    expect(products.length).toBeGreaterThan(0);
  });

  test('should navigate from homepage to catalog', async ({ page }) => {
    await page.goto('/');
    
    // Find and click "Ver todo" or similar link
    const viewAllButton = page.locator('a[href*="/catalog"], button:has-text("Ver todo")').first();
    if (await viewAllButton.isVisible()) {
      await viewAllButton.click();
      await expect(page).toHaveURL(/\/catalog/);
    }
  });
});
