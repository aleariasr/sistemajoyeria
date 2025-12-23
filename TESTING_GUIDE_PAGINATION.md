# Testing Guide: Catalog Pagination & Infinite Scroll

## Prerequisites

1. **Backend running** with database populated with products
2. **Storefront running** in development or production mode
3. Products must have `mostrar_en_storefront=true` and `stock > 0` to appear in catalog

## Manual Testing Checklist

### 1. Basic Pagination Functionality

#### Test Case 1.1: Initial Load
- [ ] Navigate to `/catalog`
- [ ] Verify 20 products load initially
- [ ] Verify "Mostrando X de Y productos" counter appears
- [ ] Check that images load progressively (placeholder → full image)

#### Test Case 1.2: Infinite Scroll
- [ ] Scroll down to near the bottom of the page
- [ ] Verify "Cargando más productos..." spinner appears
- [ ] Verify next 20 products load automatically
- [ ] Verify no page refresh occurs
- [ ] Verify products counter updates

#### Test Case 1.3: Load More Button
- [ ] Before scrolling to bottom, click "Cargar más productos" button
- [ ] Verify next page loads
- [ ] Verify button remains visible if more pages exist

#### Test Case 1.4: End of Catalog
- [ ] Continue scrolling/loading until all products are shown
- [ ] Verify "Has llegado al final del catálogo" message appears
- [ ] Verify "Cargar más" button disappears
- [ ] Verify no more scroll events trigger loading

### 2. Filtering with Pagination

#### Test Case 2.1: Search Filter
- [ ] Type a search term (e.g., "anillo")
- [ ] Verify products filter immediately (after 300ms debounce)
- [ ] Verify counter updates with new total
- [ ] Verify pagination resets to page 1
- [ ] Scroll to load more filtered results

#### Test Case 2.2: Category Filter
- [ ] Click a category button
- [ ] Verify products filter by category
- [ ] Verify counter updates
- [ ] Verify pagination resets to page 1
- [ ] Test infinite scroll with category filter active

#### Test Case 2.3: Combined Filters
- [ ] Apply both search and category filters
- [ ] Verify both filters work together
- [ ] Verify pagination with combined filters
- [ ] Clear one filter, verify other remains active

#### Test Case 2.4: Clear Filters
- [ ] Apply multiple filters
- [ ] Click "Limpiar todo"
- [ ] Verify all filters clear
- [ ] Verify pagination resets
- [ ] Verify all products show again

### 3. Performance Testing

#### Test Case 3.1: Image Loading
- [ ] Open Network tab in DevTools
- [ ] Navigate to catalog
- [ ] Verify images load lazily (only visible ones)
- [ ] Verify Cloudinary transformations are applied:
  - `w_800,h_800` (width/height)
  - `q_auto:good` (quality)
  - `f_auto` (format)
  - `c_fill` (crop)
- [ ] Verify low-quality placeholders (50x50) load first
- [ ] Scroll and verify new images load on-demand

#### Test Case 3.2: Network Efficiency
- [ ] Monitor Network tab
- [ ] Verify only 1 request per page load
- [ ] Verify requests are around 20-30KB per product (with images)
- [ ] Verify no duplicate requests
- [ ] Test with throttled connection (Fast 3G)

#### Test Case 3.3: Memory Usage
- [ ] Open Performance Monitor in DevTools
- [ ] Load catalog and scroll through 100+ products
- [ ] Verify memory usage remains stable
- [ ] Verify no memory leaks

### 4. Mobile Testing

#### Test Case 4.1: Touch Devices
- [ ] Open on mobile device or DevTools mobile view
- [ ] Verify infinite scroll works with touch scrolling
- [ ] Verify "Agregar al carrito" button shows below product card
- [ ] Verify scroll performance is smooth
- [ ] Test with slow network (3G)

#### Test Case 4.2: Responsive Layout
- [ ] Test on different screen sizes:
  - Mobile: 375px - 2 columns
  - Tablet: 768px - 3 columns  
  - Desktop: 1024px+ - 4 columns
- [ ] Verify layout adjusts correctly
- [ ] Verify all interactive elements are accessible

### 5. Edge Cases

#### Test Case 5.1: Empty Catalog
- [ ] Apply filters that return 0 results
- [ ] Verify "No se encontraron productos" message
- [ ] Verify no loading indicators show
- [ ] Verify no errors in console

#### Test Case 5.2: Single Page Results
- [ ] Apply filters that return < 20 results
- [ ] Verify all results show immediately
- [ ] Verify "Has llegado al final" message shows
- [ ] Verify no "Cargar más" button appears

#### Test Case 5.3: Network Errors
- [ ] Disable network in DevTools
- [ ] Try to load more products
- [ ] Verify error message shows
- [ ] Enable network and retry
- [ ] Verify recovery works

#### Test Case 5.4: Slow Network
- [ ] Throttle to Slow 3G
- [ ] Verify loading indicators show appropriately
- [ ] Verify user feedback is clear
- [ ] Verify no race conditions or duplicate loads

### 6. Accessibility Testing

#### Test Case 6.1: Keyboard Navigation
- [ ] Navigate catalog using Tab key
- [ ] Verify focus indicators are visible
- [ ] Verify "Load More" button is keyboard accessible
- [ ] Verify product cards are accessible

#### Test Case 6.2: Screen Readers
- [ ] Use screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify aria-labels are present and meaningful
- [ ] Verify loading states are announced
- [ ] Verify product information is readable

## Automated Testing

### Backend API Testing

```bash
# Start backend first
npm run start:backend

# In another terminal, run pagination test
node backend/tests/test-pagination.js
```

Expected output:
```
🧪 Testing Pagination Endpoint

Test 1: Default pagination (page 1, per_page=50)
✅ Response structure: { products_count, total, total_products, page, per_page, total_pages, has_more }

Test 2: Custom page size (page 1, per_page=10)
✅ Response structure: { ... }

Test 3: Second page (page 2, per_page=10)
✅ Response structure: { ... }

Test 4: With search filter
✅ Response structure: { ... }

✅ All pagination tests completed successfully!
```

### Frontend Build Testing

```bash
# TypeScript compilation and lint check
cd storefront
npm run lint
npm run build
```

Expected: No errors or warnings

### Lighthouse Performance Testing

1. Build storefront for production:
```bash
cd storefront
npm run build
npm run start
```

2. Open Chrome DevTools → Lighthouse
3. Run audit on `http://localhost:3002/catalog`

Expected scores:
- **Performance**: 90+ 
  - First Contentful Paint: < 1.5s
  - Largest Contentful Paint: < 2.5s
  - Cumulative Layout Shift: < 0.1
  - Total Blocking Time: < 200ms

- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 90+

### Load Testing (Optional)

For catalogs with 1000+ products:

```bash
# Using Apache Bench
ab -n 100 -c 10 "http://localhost:3001/api/public/products?per_page=20&page=1"

# Using Artillery
artillery quick --count 50 --num 10 "http://localhost:3001/api/public/products?per_page=20"
```

Expected:
- Response time: < 500ms (p95)
- No errors
- Consistent response times across pages

## Visual Regression Testing (Optional)

Using Percy, Chromatic, or similar:

1. Capture baseline screenshots:
   - Catalog page initial load
   - Catalog with 1 page loaded
   - Catalog with 3 pages loaded
   - Catalog with filters applied
   - Empty state
   - Loading state

2. Run visual tests on subsequent builds
3. Review and approve visual changes

## Checklist Summary

### Must Pass
- [ ] Initial load shows 20 products
- [ ] Infinite scroll loads more products automatically
- [ ] Filters work correctly and reset pagination
- [ ] Images load lazily with Cloudinary optimization
- [ ] No console errors
- [ ] TypeScript build successful
- [ ] ESLint passes with no warnings

### Should Pass
- [ ] Lighthouse Performance > 90
- [ ] Works on mobile devices
- [ ] Handles slow network gracefully
- [ ] Memory usage is stable

### Nice to Have
- [ ] Keyboard navigation works perfectly
- [ ] Screen reader friendly
- [ ] Visual regression tests pass
- [ ] Load tests show good performance

## Known Issues / Limitations

1. **Variant Expansion**: Products with variants may cause the actual number of products shown per page to vary slightly from the `per_page` parameter.

2. **Filter Reset**: Changing filters resets to page 1, which is expected behavior but might surprise users.

3. **Browser Back Button**: Infinite scroll state is not preserved when using browser back button (this is by design, React Query will refetch fresh data).

## Troubleshooting

### Products not loading
- Check backend is running
- Verify products have `mostrar_en_storefront=true`
- Verify products have `stock > 0`
- Check browser console for errors

### Infinite scroll not working
- Verify Intersection Observer is supported (all modern browsers)
- Check console for errors
- Verify `has_more` is being returned from API

### Images not optimizing
- Verify images are hosted on Cloudinary
- Check URL format includes `/upload/`
- Verify transformation parameters are being added
- Check Network tab for actual image URLs

### Performance issues
- Check image sizes (should be optimized to 800x800)
- Verify lazy loading is working
- Check for memory leaks in DevTools
- Test with production build, not development
