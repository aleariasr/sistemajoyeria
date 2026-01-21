# Storefront E2E Tests - Quick Start

## Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (only needed once)
npx playwright install chromium
```

## Running Tests

### All Tests (Unit + E2E)
```bash
npm run test:all
```

### Unit Tests Only
```bash
npm test
```

### E2E Tests Only
```bash
npm run test:e2e
```

### E2E Tests - Interactive UI Mode
```bash
npm run test:e2e:ui
```

### E2E Tests - Watch Browser
```bash
npm run test:e2e:headed
```

### View Test Report
```bash
npm run test:e2e:report
```

## Test Files

- `e2e/catalog.spec.ts` - Catalog flow (filters, search, pagination, shuffle)
- `e2e/product-detail.spec.ts` - Product detail page (variants, sets, stock)
- `e2e/cart.spec.ts` - Cart functionality (add, remove, quantities)
- `e2e/checkout.spec.ts` - Checkout flow (form validation, mock payment)

## Key Features

✅ **Mocked Backend** - All API calls are mocked, no backend needed
✅ **Deterministic** - Tests produce consistent results
✅ **Fast** - Complete suite runs in ~2-3 minutes
✅ **Coverage** - 70+ test cases covering all major flows

## Documentation

See [STOREFRONT_E2E_TEST_SUITE.md](../STOREFRONT_E2E_TEST_SUITE.md) for comprehensive documentation.
