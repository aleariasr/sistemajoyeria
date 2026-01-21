# Storefront E2E Test Suite Documentation

## Overview

Comprehensive E2E test suite for the storefront (Next.js) application using Playwright. Tests cover the complete user journey from browsing products to completing a simulated checkout.

## Test Coverage

### 1. Catalog Flow (`catalog.spec.ts`)
- ✅ Product display and filtering
- ✅ Category navigation
- ✅ Search functionality
- ✅ Deterministic shuffle with seed persistence
- ✅ Infinite scroll pagination
- ✅ Scroll position restoration
- ✅ Empty and error states
- ✅ Filter clearing
- ✅ Featured products section

### 2. Product Detail Flow (`product-detail.spec.ts`)
- ✅ Product information display
- ✅ Image gallery
- ✅ Variant selection (for variant products)
- ✅ Set components display
- ✅ Quantity selection
- ✅ Stock availability messages
- ✅ Low stock warnings
- ✅ Add to cart functionality
- ✅ Navigation breadcrumbs
- ✅ Product not found handling

### 3. Cart Flow (`cart.spec.ts`)
- ✅ Add/remove items
- ✅ Quantity updates
- ✅ Subtotal calculation
- ✅ Session persistence (localStorage)
- ✅ Multiple products handling
- ✅ Empty cart state
- ✅ Cart drawer/page navigation
- ✅ Product information display

### 4. Checkout Flow (`checkout.spec.ts`)
- ✅ Form validation (required fields, email, phone)
- ✅ Order summary display
- ✅ Mock order creation (no real payment gateway)
- ✅ Stock validation
- ✅ Success/error handling
- ✅ Cart clearing after order
- ✅ Network error handling
- ✅ Empty cart protection

## Quick Start

### Install Dependencies

\`\`\`bash
cd storefront
npm install
\`\`\`

### Run All Tests

\`\`\`bash
# From root directory
npm run test:storefront:all

# Or from storefront directory
npm run test:all
\`\`\`

### Run Only E2E Tests

\`\`\`bash
# From root directory
npm run test:storefront:e2e

# Or from storefront directory
npm run test:e2e
\`\`\`

### Run E2E Tests in UI Mode (Interactive)

\`\`\`bash
cd storefront
npm run test:e2e:ui
\`\`\`

### Run E2E Tests in Headed Mode (See Browser)

\`\`\`bash
cd storefront
npm run test:e2e:headed
\`\`\`

### View Test Report

\`\`\`bash
cd storefront
npm run test:e2e:report
\`\`\`

## Test Architecture

### API Mocking

All E2E tests use mocked API responses to ensure:
- **Deterministic results** - Tests produce consistent results
- **No external dependencies** - Tests run without backend server
- **Speed** - Tests run quickly without network latency
- **Isolation** - Each test is independent

### Mock Fixtures

Located in `e2e/fixtures/`:

- **`products.ts`** - Mock product data and utilities
  - `createMockProduct()` - Generate mock products
  - `createMockVariant()` - Generate variant products
  - `createMockSet()` - Generate set/composite products
  - `shuffleWithSeed()` - Deterministic shuffle algorithm
  - `applyCategoryOrderingRule()` - Category balancing

- **`api-mocks.ts`** - API mocking utilities
  - `setupApiMocks()` - Setup all API route mocks
  - `mockApiError()` - Mock API error responses
  - `mockEmptyProducts()` - Mock empty catalog
  - `waitForApiCall()` - Wait for specific API calls

### Test Organization

\`\`\`
storefront/
├── e2e/                          # E2E tests directory
│   ├── fixtures/                 # Mock data and utilities
│   │   ├── products.ts          # Product mock fixtures
│   │   └── api-mocks.ts         # API mocking utilities
│   ├── catalog.spec.ts          # Catalog flow tests
│   ├── product-detail.spec.ts   # Product detail tests
│   ├── cart.spec.ts             # Cart flow tests
│   └── checkout.spec.ts         # Checkout flow tests
├── playwright.config.ts          # Playwright configuration
└── package.json                 # Scripts and dependencies
\`\`\`

## Key Features Tested

### Deterministic Shuffle

Tests verify that:
1. Products are shuffled deterministically using a seed
2. Shuffle order persists in localStorage
3. Order is maintained when navigating back from product detail
4. Category ordering rule (max 3 consecutive from same category) is applied

### Variant Deduplication

Tests verify that:
1. Products with variants use `_uniqueKey` for deduplication
2. Each variant appears as an independent product
3. Variant selection works correctly in product detail

### Scroll Restoration

Tests verify that:
1. Scroll position is saved before navigation
2. Scroll position is restored when returning to catalog
3. Search terms persist across navigation

### Cart Persistence

Tests verify that:
1. Cart items persist in localStorage
2. Cart survives page reloads
3. Cart is cleared after successful checkout
4. Multiple products are handled correctly

### Form Validation

Tests verify that:
1. Required fields are validated
2. Email format is validated
3. Phone format is validated
4. Error messages are displayed appropriately

## Mock Payment Gateway

The checkout flow uses a simulated payment process:

- **No real payment gateway** is called
- Order creation returns mock success response
- Stock validation is simulated
- Network errors can be tested

This ensures:
- Tests run without external payment service
- No test orders are created in production
- Payment flow errors can be simulated

## Running Tests in CI/CD

### GitHub Actions Example

\`\`\`yaml
- name: Install dependencies
  run: npm install

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
  working-directory: storefront

- name: Run E2E tests
  run: npm run test:storefront:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: storefront/playwright-report/
\`\`\`

## Test Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Timeout**: 30 seconds per test
- **Retries**: 2 on CI, 0 locally
- **Workers**: 1 on CI (sequential), unlimited locally (parallel)
- **Base URL**: http://localhost:3002
- **Screenshots**: On failure only
- **Video**: On failure only
- **Trace**: On first retry

### Browser Support

Currently configured for:
- ✅ Chromium (Desktop Chrome)

Can be extended for:
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)

## Debugging Tests

### Interactive Mode

Run tests in UI mode to debug interactively:

\`\`\`bash
npm run test:e2e:ui
\`\`\`

### Headed Mode

See the browser during test execution:

\`\`\`bash
npm run test:e2e:headed
\`\`\`

### Debug Specific Test

\`\`\`bash
npx playwright test catalog.spec.ts --debug
\`\`\`

### View Traces

After test failure, view trace:

\`\`\`bash
npx playwright show-trace trace.zip
\`\`\`

## Writing New Tests

### Template for New Test File

\`\`\`typescript
import { test, expect } from '@playwright/test';
import { setupApiMocks } from './fixtures/api-mocks';

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    
    // Your test logic
    await expect(page.locator('text=/Expected/i')).toBeVisible();
  });
});
\`\`\`

### Best Practices

1. **Use data-testid** for stable selectors
2. **Wait for elements** before interacting
3. **Mock API calls** for deterministic results
4. **Clear state** in beforeEach hooks
5. **Use meaningful assertions**
6. **Keep tests independent**
7. **Test user journeys**, not implementation details

## Maintenance

### Updating Mock Data

When backend API changes:
1. Update type definitions in `src/lib/types/index.ts`
2. Update mock fixtures in `e2e/fixtures/products.ts`
3. Update API mock routes in `e2e/fixtures/api-mocks.ts`
4. Run tests to verify compatibility

### Adding New Test Cases

1. Create new spec file in `e2e/` directory
2. Import fixtures and mocks
3. Write test cases following existing patterns
4. Run tests to verify
5. Update documentation

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check if dev server is starting properly
- Verify mock API routes are being intercepted

### Flaky Tests

- Add explicit waits for elements
- Use `waitForTimeout` sparingly
- Verify API mocks are stable
- Check for race conditions

### Mock API Not Working

- Verify route patterns match exactly
- Check baseURL in config
- Ensure mocks are setup before navigation
- Use browser dev tools to inspect network

## Integration with Existing Tests

### Unit Tests (Jest)

- Located in component directories
- Run with `npm run test`
- Test individual components in isolation

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Run with `npm run test:e2e`
- Test complete user flows with mocked backend

### Combined Test Suite

Run all tests:

\`\`\`bash
npm run test:all
\`\`\`

## Performance

- **Average test duration**: ~30 seconds per spec file
- **Total suite duration**: ~2-3 minutes
- **Parallel execution**: Yes (locally)
- **CI execution**: Sequential for stability

## Future Enhancements

Potential improvements:
- [ ] Add cross-browser testing (Firefox, Safari)
- [ ] Add mobile device emulation tests
- [ ] Add accessibility tests
- [ ] Add performance benchmarks
- [ ] Add visual regression tests
- [ ] Add API contract tests

## Support

For issues or questions:
1. Check test output and error messages
2. Run tests in headed/UI mode for debugging
3. Review test documentation
4. Check Playwright documentation: https://playwright.dev

## License

Part of the Sistema Joyería project.
