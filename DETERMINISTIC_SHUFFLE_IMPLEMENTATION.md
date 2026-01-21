# Deterministic Shuffle Implementation Summary

## Overview
This implementation adds deterministic random ordering to the storefront catalog with session-based persistence and category balancing rules.

## Key Features

### 1. Deterministic Shuffle with Session Seed
- **Backend**: Seeded RNG (Mulberry32 algorithm) for reproducible shuffle
- **Frontend**: Session-based seed stored in `sessionStorage`
- **Benefit**: Same order maintained across navigation and page refreshes within session

### 2. Category Balancing
- **Rule**: Maximum 3 consecutive products from the same category
- **Algorithm**: Sliding window approach with swap mechanism
- **Benefit**: Better product variety in catalog display

### 3. Session Persistence
- **Seed Management**: Automatic per-filter-context seed generation
- **Context Awareness**: Different seeds for different filters (category/search)
- **Scroll Restoration**: Existing scroll position maintained with stable order

## Backend Implementation

### Files Modified
- `backend/models/Joya.js`: Added seeded shuffle and category balancing
- `backend/routes/public.js`: Added `shuffle_seed` parameter support

### Key Functions
```javascript
// Seeded RNG (Mulberry32)
static _seededRandom(seed)

// Fisher-Yates with seed
static _shuffleArraySeeded(array, seed)

// Category balancing
static _balanceCategories(products, maxConsecutive = 3)
```

### Configuration Constants
```javascript
const MAX_CONSECUTIVE_CATEGORY = 3;
const MAX_BALANCING_ITERATIONS = 100;
```

### API Changes
**Endpoint**: `GET /api/public/products`
**New Parameter**: `shuffle_seed` (optional, integer)

**Example**:
```
GET /api/public/products?shuffle=true&shuffle_seed=12345&per_page=20
```

## Frontend Implementation

### Files Modified
- `storefront/src/lib/utils/catalogSeed.ts`: New utility for seed management
- `storefront/src/lib/api/client.ts`: Added `shuffle_seed` parameter
- `storefront/src/hooks/useApi.ts`: Added seed support and `refetchOnMount: false`
- `storefront/src/components/product/ProductGrid.tsx`: Updated to use `_uniqueKey`
- `storefront/src/app/catalog/CatalogContent.tsx`: Integrated session seed
- `storefront/src/app/catalog/[categoria]/CategoryCatalogContent.tsx`: Integrated session seed

### Key Utilities

#### catalogSeed.ts
```typescript
// Get or generate session seed
getCatalogSeed(params?: { category?: string; search?: string }): number

// Clear seed (force new shuffle)
clearCatalogSeed(): void

// Check if seed exists for context
hasCatalogSeed(params?: { category?: string; search?: string }): boolean
```

#### Configuration Constants
```typescript
const MAX_SEED_VALUE = 2147483647;
const SEARCH_TERM_MAX_LENGTH = 10;
```

### Storage Keys
- **Seed**: `catalog_shuffle_seed`
- **Context**: `catalog_filter_context`
- **Order**: `productOrder_<filterContext>` (per-filter localStorage key)

## Testing

### Backend Tests
**File**: `backend/tests/test-shuffle-seed.js`

Tests:
1. ✅ Same seed produces identical order
2. ✅ Different seeds produce different orders
3. ✅ Category balancing (max 3 rule)
4. ✅ Pagination maintains order with seed
5. ✅ Backward compatibility (shuffle without seed)

### Frontend Tests
**Files**:
- `storefront/src/lib/utils/catalogSeed.test.ts` (seed utility tests)
- `storefront/src/components/product/ProductGrid.test.tsx` (updated for `_uniqueKey` and `filterContext`)

Tests:
- ✅ 48/48 tests passing
- ✅ Seed generation and persistence
- ✅ Context-aware seed management
- ✅ `_uniqueKey` handling for variants
- ✅ Filter context separation

## Validation Results

### Linting
```bash
npm run lint:storefront
```
✅ Passed (1 minor warning - pre-existing)

### Build
```bash
npm run build:storefront
```
✅ Success - Production build completed

### Tests
```bash
npm run test:storefront
```
✅ 48/48 tests passed

## Backward Compatibility

The implementation is fully backward compatible:
- `shuffle=true` without `shuffle_seed`: Uses non-deterministic shuffle (existing behavior)
- `shuffle=false` or omitted: No shuffle (existing behavior)
- `shuffle=true` with `shuffle_seed`: New deterministic shuffle with category balancing

## Performance Considerations

1. **Backend**: Shuffle happens once per page load, not per request
2. **Frontend**: Minimal overhead - single seed generation per filter context
3. **Storage**: Lightweight - only stores seed integer and context string
4. **Memory**: No significant increase - same product data structure

## Usage Example

### User Flow
1. User visits catalog → Session seed generated (e.g., 12345)
2. Backend shuffles products with seed 12345 and balances categories
3. User scrolls and loads more products → Same seed maintains order
4. User clicks product → Navigates to detail page
5. User clicks back → Same seed restores exact catalog order and scroll position
6. User changes filter → New seed generated for new context
7. Session ends (browser close) → Next visit gets new seed

### Filter Context Examples
- No filters: `"none"`
- Category only: `"cat:anillos"`
- Search only: `"search:oro"`
- Both: `"cat:anillos|search:oro"`

## Future Enhancements

Potential improvements (not in scope):
- Make `MAX_CONSECUTIVE_CATEGORY` configurable via environment variable
- Add admin UI to force re-shuffle (clear all seeds)
- Track and log shuffle performance metrics
- A/B test different balancing strategies

## Security Considerations

- Seeds are session-scoped (not user-identifiable)
- No sensitive data in seeds
- Seeds stored in sessionStorage (expires on tab close)
- No impact on product data integrity

## Deployment Notes

1. **Environment Variables**: None required (backward compatible)
2. **Database Changes**: None
3. **Cache Invalidation**: None required
4. **Migration**: None required

## Documentation

- Backend: API documentation updated in code comments
- Frontend: Component and utility documentation in JSDoc format
- Tests: Comprehensive test coverage with descriptive names

## Summary

This implementation successfully adds deterministic shuffle to the storefront catalog while:
- ✅ Maintaining backward compatibility
- ✅ Enforcing category balancing rules
- ✅ Preserving order across navigation
- ✅ Supporting different filter contexts
- ✅ Passing all tests and builds
- ✅ Following code review recommendations

The feature is production-ready and provides a better user experience with consistent catalog browsing and improved product variety.
