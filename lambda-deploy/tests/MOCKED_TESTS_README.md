# Backend Test Suite - Mocked Environment

This test suite runs comprehensive tests against mocked versions of all external dependencies (Supabase, Cloudinary, Resend), allowing for fast, reliable testing without requiring database connections or external service credentials.

## Running Tests

### Run all tests
```bash
npm run test:backend
```

### Run specific test suites
```bash
# CRUD tests only
npm test -- joyas-crud-mocked.test.js

# Admin listing tests only
npm test -- joyas-admin-listing-mocked.test.js

# Public listing tests only
npm test -- public-listing-mocked.test.js
```

### Run with coverage
```bash
npm run test:coverage
```

### Watch mode (for development)
```bash
npm run test:watch
```

## Test Coverage

### 1. Joyas CRUD Tests (`joyas-crud-mocked.test.js`)
Tests all CRUD operations with comprehensive mocking:

- **CREATE**: Validation, duplicate codigo detection (case-insensitive), authentication
- **READ**: Single product, with variants, with sets/components
- **UPDATE**: Data updates, stock movement registration, codigo validation
- **DELETE**: Success cases, blocking when dependencies exist (variants, sets, sales)
- **Code Verification**: Duplicate detection, similar code suggestions

### 2. Admin Listing Tests (`joyas-admin-listing-mocked.test.js`)
Tests admin panel product listing with full filtering:

- **Ordering**: DESC by fecha_creacion then id, stable pagination
- **Pagination**: Correct totals, page sizes, page numbers
- **Deduplication**: No duplicate products in results
- **Filters**:
  - Búsqueda (search): By codigo, nombre, descripcion (case-insensitive)
  - Categoría: Case-insensitive exact match
  - Stock bajo: stock_actual <= stock_minimo
  - Sin stock: stock_actual = 0
  - Estado: Activo, Descontinuado, Agotado
- **Combined Filters**: Multiple filters working together

### 3. Public Listing Tests (`public-listing-mocked.test.js`)
Tests public storefront API with variants and shuffle:

- **Basic Filtering**: Only active products with stock and mostrar_en_storefront=true
- **Variants Expansion**: Variants as separate products with unique _uniqueKey
- **Sets/Composite Products**: Proper stock calculation, component display
- **Product Detail**: By id, with variante_id support
- **Deterministic Shuffle**: Same seed = same order, different seed = different order
- **Category Balancing**: Max 3 consecutive products from same category
- **Pagination with Shuffle**: Correct counts, no duplicates
- **Security**: No sensitive data (costo, exact stock, proveedor) exposed

## Mock Architecture

### Fixtures (`tests/fixtures/data.js`)
In-memory test data including:
- 14 joyas with various states (active, discontinued, with/without stock)
- 3 variants for testing variant expansion
- 1 set (composite product) with 3 components
- 3 inventory movements
- 2 users (admin, dependiente)

### Mocks (`tests/mocks/`)
- **supabase.mock.js**: Full mock of Supabase client with query builder
- **cloudinary.mock.js**: Mock image upload/delete operations
- **resend.mock.js**: Mock email sending (no actual emails sent)

### Benefits of Mocked Tests
✅ **Fast**: No network calls or database connections
✅ **Reliable**: No flaky tests due to external services
✅ **Isolated**: Tests don't affect production data
✅ **Deterministic**: Same inputs always produce same outputs
✅ **CI/CD Friendly**: No credentials or secrets needed

## Test Philosophy

These tests focus on:
1. **Business Logic**: Ensuring filters, sorting, and validation work correctly
2. **Edge Cases**: Empty results, invalid inputs, pagination boundaries
3. **Security**: Authentication requirements, data exposure prevention
4. **Integration**: Routes + Models + Mocks working together

Tests do NOT require:
- Real database connection
- Cloudinary account
- Resend/email account
- Production credentials

## Adding New Tests

When adding new tests:
1. Use `getFixtures()` to get fresh test data for each test
2. Mock any new external dependencies in `tests/mocks/`
3. Clear require cache in `beforeEach` for fresh module state
4. Follow existing patterns for consistency

## Debugging Failed Tests

If tests fail:
1. Check fixture data matches expected format
2. Verify mock implementations match actual service behavior
3. Use `console.log` in tests to inspect data
4. Run single test in isolation: `npm test -- -t "test name"`

## Common Issues

### "jest: not found"
Run `npm install` to install dependencies.

### Tests pass locally but fail in CI
Ensure no real database/service connections are being made. All should use mocks.

### Fixtures getting mutated between tests
Always use `getFixtures()` to get a fresh copy. The function deep clones data to prevent mutation.
