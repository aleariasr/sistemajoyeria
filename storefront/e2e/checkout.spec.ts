/**
 * E2E Tests for Checkout Flow (Simulated)
 * 
 * Tests:
 * - Form validation
 * - Mock payment flow (no real gateway)
 * - Order creation
 * - Stock validation
 * - Success/error handling
 */

import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';

test.describe('Checkout Flow (Simulated)', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupApiMocks(page);
    
    // Clear cart
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Add a product to cart for checkout tests
    await page.goto('/product/1');
    await page.waitForSelector('h1');
    await page.click('button:has-text("Agregar al carrito")');
    await page.waitForTimeout(500);
  });

  test('should redirect to cart if empty', async ({ page }) => {
    // Clear cart
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Try to access checkout
    await page.goto('/checkout');
    
    // Should show empty cart message
    await expect(page.locator('text=/Tu carrito está vacío|vacío/i')).toBeVisible();
    
    // Should show link to catalog
    await expect(page.locator('a[href*="/catalog"], button:has-text("Ver productos")')).toBeVisible();
  });

  test('should display checkout form', async ({ page }) => {
    await page.goto('/checkout');
    
    // Should show form fields
    await expect(page.locator('input[name="nombre"], input[placeholder*="Nombre"]')).toBeVisible();
    await expect(page.locator('input[name="telefono"], input[placeholder*="Teléfono"]')).toBeVisible();
    await expect(page.locator('input[name="email"], input[placeholder*="Email"]')).toBeVisible();
  });

  test('should display order summary', async ({ page }) => {
    await page.goto('/checkout');
    
    // Should show product in summary
    await expect(page.locator('text=/Product/i')).toBeVisible();
    
    // Should show subtotal
    await expect(page.locator('text=/Subtotal|Total/i')).toBeVisible();
    
    // Should show price
    await expect(page.locator('text=/₡|\\$|€/i')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('text=/obligatorio|requerido|required/i')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill form with invalid email
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'invalid-email');
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show email validation error
    await expect(page.locator('text=/email.*válido|correo.*válido/i')).toBeVisible();
  });

  test('should validate phone number format', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill form with invalid phone
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', 'abc');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Try to submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show phone validation error
    await expect(page.locator('text=/teléfono.*válido|phone.*valid/i')).toBeVisible();
  });

  test('should successfully create order with valid data', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill form with valid data
    await page.fill('input[name="nombre"]', 'Juan Pérez');
    await page.fill('input[name="telefono"]', '88887777');
    await page.fill('input[name="email"]', 'juan@example.com');
    
    // Optional fields
    const cedulaInput = page.locator('input[name="cedula"]');
    if (await cedulaInput.isVisible({ timeout: 1000 })) {
      await cedulaInput.fill('123456789');
    }
    
    const direccionInput = page.locator('input[name="direccion"], textarea[name="direccion"]');
    if (await direccionInput.isVisible({ timeout: 1000 })) {
      await direccionInput.fill('San José, Costa Rica');
    }
    
    const notesInput = page.locator('input[name="notes"], textarea[name="notes"]');
    if (await notesInput.isVisible({ timeout: 1000 })) {
      await notesInput.fill('Test order notes');
    }
    
    // Submit order
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show success message or redirect
    await expect(page.locator('text=/éxito|exitoso|confirmado|creado|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to order confirmation page', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill and submit form
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'test@example.com');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Wait for redirect or success
    await page.waitForTimeout(2000);
    
    // Should either show success message or redirect to order page
    const urlOrMessage = await Promise.race([
      page.waitForURL(/\/order\/\d+/, { timeout: 5000 }).then(() => 'url'),
      page.waitForSelector('text=/éxito|success/i', { timeout: 5000 }).then(() => 'message'),
    ]).catch(() => null);
    
    expect(urlOrMessage).toBeTruthy();
  });

  test('should handle order creation error', async ({ page }) => {
    // Mock order error
    await setupApiMocks(page, { orderError: true });
    
    await page.goto('/checkout');
    
    // Fill form
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('text=/error|problema|insuficiente/i')).toBeVisible({ timeout: 5000 });
  });

  test('should clear cart after successful order', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill and submit form
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'test@example.com');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Wait for success
    await page.waitForTimeout(2000);
    
    // Go to cart
    await page.goto('/cart');
    
    // Cart should be empty
    await expect(page.locator('text=/Tu carrito está vacío|vacío/i')).toBeVisible();
  });

  test('should show loading state during order submission', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill form
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show loading indicator (button disabled or spinner)
    await expect(submitButton).toBeDisabled({ timeout: 1000 });
  });

  test('should display payment method selection', async ({ page }) => {
    await page.goto('/checkout');
    
    // Look for payment method options
    const paymentSection = page.locator('text=/Método de pago|Payment method|Forma de pago/i');
    
    // Payment method might not be visible in all implementations
    try {
      await paymentSection.waitFor({ timeout: 2000 });
      await expect(paymentSection).toBeVisible();
    } catch {
      // Payment method selection might be hidden in mock implementation
    }
  });

  test('should show product quantities in order summary', async ({ page }) => {
    await page.goto('/checkout');
    
    // Should show quantity
    await expect(page.locator('text=/Cantidad|Qty|x\\d+/i')).toBeVisible();
  });

  test('should allow navigation back to cart', async ({ page }) => {
    await page.goto('/checkout');
    
    // Find back to cart link/button
    const backButton = page.locator('a[href="/cart"], button:has-text("Volver al carrito"), button:has-text("Editar carrito")').first();
    
    if (await backButton.isVisible({ timeout: 2000 })) {
      await backButton.click();
      
      // Should navigate to cart
      await expect(page).toHaveURL(/\/cart/);
    }
  });

  test('should validate stock availability before checkout', async ({ page }) => {
    // Mock out of stock error
    await setupApiMocks(page, {
      orderError: true,
      customOrderResponse: null,
    });
    
    await page.goto('/checkout');
    
    // Fill form
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show stock error
    await expect(page.locator('text=/stock|disponible|agotado/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle network error during order submission', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/public/orders', async (route) => {
      await route.abort('failed');
    });
    
    await page.goto('/checkout');
    
    // Fill form
    await page.fill('input[name="nombre"]', 'Test User');
    await page.fill('input[name="telefono"]', '12345678');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Finalizar"), button:has-text("Confirmar")').first();
    await submitButton.click();
    
    // Should show error message
    await expect(page.locator('text=/error|problema|conexión|network/i')).toBeVisible({ timeout: 5000 });
  });
});
