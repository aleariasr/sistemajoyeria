# Storefront Visibility Feature - Implementation Guide

## Overview
This feature allows administrators to control which products appear in the public storefront while keeping them visible in the internal POS system.

## Database Migration

### Running the Migration
Execute the SQL migration in your Supabase dashboard:

```bash
# Location: backend/migrations/add-storefront-visibility.sql
```

Or run directly in Supabase SQL Editor:

```sql
-- Add column mostrar_en_storefront to joyas table
ALTER TABLE joyas 
ADD COLUMN IF NOT EXISTS mostrar_en_storefront BOOLEAN DEFAULT true;

-- Update existing products to show in storefront by default
UPDATE joyas 
SET mostrar_en_storefront = true 
WHERE mostrar_en_storefront IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_joyas_storefront 
ON joyas(mostrar_en_storefront) 
WHERE estado = 'Activo';

-- Add column comment for documentation
COMMENT ON COLUMN joyas.mostrar_en_storefront IS 
'Indica si el producto debe mostrarse en la tienda online pública (storefront). Default: true';
```

### Verification
Verify the column was added successfully:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'joyas' AND column_name = 'mostrar_en_storefront';
```

## Testing

### Backend Tests
Run the storefront visibility tests:

```bash
# From the project root
cd backend
node tests/test-storefront-visibility.js
```

This will test:
- Creating products with `mostrar_en_storefront = true`
- Default value behavior (should be `true`)
- Filtering products by storefront visibility
- Updating storefront visibility
- Category filtering

### Manual Testing

#### 1. Test Backend API

**Test hidden product is excluded:**
```bash
# Create a hidden product via POS
# Then query public API:
curl http://localhost:3001/api/public/products
# Hidden product should NOT appear
```

**Test product detail:**
```bash
# Try to access hidden product directly:
curl http://localhost:3001/api/public/products/{hidden_product_id}
# Should return 404
```

#### 2. Test Frontend POS

1. **Create New Product:**
   - Go to "Nueva Joya"
   - Fill in product details
   - Check/uncheck "🌐 Mostrar en tienda online"
   - Save product

2. **Edit Existing Product:**
   - Go to product list
   - Edit any product
   - Toggle "🌐 Mostrar en tienda online"
   - Save changes

3. **Visual Indicator:**
   - View product list
   - Look for "Tienda Online" column
   - Should show 🌐 for visible products
   - Should show 🚫 for hidden products

#### 3. Test Storefront

1. **Hidden Products:**
   - Hide a product in POS
   - Visit storefront
   - Product should NOT appear in listing
   - Direct link should return 404

2. **Visible Products:**
   - Make product visible in POS
   - Refresh storefront
   - Product should appear

## ProductCard Click Fix

### Desktop Behavior
- Clicking on product image/name → Opens product detail
- Clicking "Agregar al carrito" button (on hover) → Adds to cart only

### Mobile/Touch Behavior
- Tapping on product image/name → Opens product detail
- "Agregar al carrito" button shown below product (not on hover)
- Tapping button → Adds to cart only

### Testing Click Behavior

**Desktop (Chrome DevTools):**
1. Open storefront in browser
2. Hover over product card
3. Click on image → Should navigate to product detail
4. Hover again and click "Agregar al carrito" → Should add to cart, NOT navigate

**Mobile (Chrome DevTools):**
1. Open DevTools, toggle device toolbar (mobile view)
2. Tap on product image → Should navigate to product detail
3. Tap "Agregar al carrito" button below → Should add to cart only

## Performance Optimizations

### React.memo
- `ProductCard` component is memoized to prevent unnecessary re-renders
- `ProductGrid` component is memoized for better list performance

### Image Optimization
- Blur placeholder while loading
- Optimized Cloudinary parameters (width, height, quality)
- Lazy loading enabled

### React Query
- 5-minute stale time for product data
- 30-minute garbage collection time
- Smart retry logic (doesn't retry 404s)
- No refetch on window focus

### Framer Motion
- Reduced animation delays (max 0.3s)
- Simplified animation config
- Removed complex motion button animations

## Rollback

If issues occur, you can rollback the database changes:

```sql
-- Remove the column
ALTER TABLE joyas DROP COLUMN IF EXISTS mostrar_en_storefront;

-- Remove the index
DROP INDEX IF EXISTS idx_joyas_storefront;
```

Then revert the code changes via git:
```bash
git revert HEAD
```

## Monitoring

### What to Monitor

1. **API Response Times:**
   - `/api/public/products` should remain fast with index
   - Check query execution plans in Supabase

2. **Frontend Performance:**
   - Lighthouse score should be > 90 on mobile
   - Time to Interactive should improve

3. **User Behavior:**
   - Track add-to-cart vs. product detail navigation
   - Monitor bounce rates on product pages

### Expected Improvements

- **Click Accuracy:** 100% (clicks always do expected action)
- **Re-renders:** ~50% reduction in ProductCard re-renders
- **Image Load Time:** ~30% faster with optimized parameters
- **Bundle Size:** No significant change (React.memo is small)

## Troubleshooting

### Issue: Products still showing in storefront after hiding
**Solution:** 
- Clear React Query cache (refresh page)
- Verify database column was updated
- Check API response in network tab

### Issue: Click goes to wrong place
**Solution:**
- Check if touch device detection is working
- Verify `e.stopPropagation()` is being called
- Test in different browsers

### Issue: Performance didn't improve
**Solution:**
- Enable React DevTools Profiler
- Check for other components causing re-renders
- Verify React Query cache is working (check network tab)

## Next Steps

1. Monitor production metrics after deployment
2. Collect user feedback on click behavior
3. Consider A/B testing different button placements
4. Add analytics to track visibility toggle usage
