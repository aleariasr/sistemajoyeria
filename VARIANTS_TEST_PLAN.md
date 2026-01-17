# Variants System Test Plan

## Overview
This document outlines the comprehensive testing approach for the jewelry variants system, covering both the POS (frontend) and storefront implementations.

## Test Environment Setup

### Prerequisites
1. Backend running on port 3001
2. Frontend (POS) running on port 3000
3. Storefront running on port 3002
4. Test user authenticated in POS
5. Supabase database with migrations applied

## Part 1: POS - Variant Creation & Management

### Test Case 1.1: Create Product with Variants
**Objective**: Verify product creation flow and variant marker

**Steps**:
1. Navigate to "Nueva Joya" in POS
2. Fill in required fields:
   - Código: `TEST-VAR-001`
   - Nombre: `Aretes Premium Test`
   - Precio venta: `15000`
   - Stock actual: `30`
   - Moneda: `CRC`
3. Check ☑️ "Este producto tiene variantes"
4. Add image (optional, test scrolling on iPad if available)
5. Click "Agregar Joya"

**Expected Results**:
- ✅ Form saves successfully
- ✅ Message: "Joya creada correctamente"
- ✅ Product marked as `es_producto_variante = true`
- ✅ Redirected to inventory list
- ✅ On iPad: Save button visible and accessible (no scrolling issues)

**API Verification**:
```bash
curl http://localhost:3001/api/joyas/[id] \
  -H "Cookie: [session-cookie]"
# Should return: "es_producto_variante": true
```

### Test Case 1.2: Add Variants to Product
**Objective**: Verify variant creation with multiple designs

**Steps**:
1. Edit the product created in 1.1
2. Scroll to "Funciones Especiales" section
3. Click "+ Agregar Variante"
4. Fill modal form:
   - Nombre: `Diseño Corazón`
   - Descripción: `Aretes con dije de corazón`
   - Upload image (Cloudinary URL)
   - ☑️ Activo
5. Click "Guardar"
6. Repeat for additional variants:
   - `Diseño Estrella`
   - `Diseño Luna`
   - `Diseño Flor`

**Expected Results**:
- ✅ Each variant saves successfully
- ✅ Variants appear in list with thumbnails
- ✅ Order numbers show (1, 2, 3, 4)
- ✅ All marked as "✓ Activo"

**API Verification**:
```bash
curl http://localhost:3001/api/variantes/producto/[product-id] \
  -H "Cookie: [session-cookie]"
# Should return array of 4 variants
```

### Test Case 1.3: Reorder Variants
**Objective**: Verify drag-and-drop ordering functionality

**Steps**:
1. In variant list, use ▲▼ buttons to reorder
2. Move "Diseño Estrella" to position 1
3. Move "Diseño Corazón" to position 4

**Expected Results**:
- ✅ Order updates immediately
- ✅ Numbers reflect new order (1, 2, 3, 4)
- ✅ No page refresh required

**API Verification**:
```bash
curl http://localhost:3001/api/variantes/producto/[product-id] \
  -H "Cookie: [session-cookie]"
# Verify orden_display values match visual order
```

### Test Case 1.4: Edit Variant
**Objective**: Verify variant editing functionality

**Steps**:
1. Click ✏️ (edit) on "Diseño Corazón"
2. Change nombre to: `Diseño Corazón Grande`
3. Uncheck ☐ Activo
4. Click "Guardar"

**Expected Results**:
- ✅ Variant updates successfully
- ✅ Name changes in list
- ✅ Status shows "✗ Inactivo"
- ✅ Inactive variants won't show on storefront

### Test Case 1.5: Delete Variant
**Objective**: Verify variant deletion

**Steps**:
1. Click 🗑️ (delete) on "Diseño Luna"
2. Confirm deletion
3. Verify variant removed from list

**Expected Results**:
- ✅ Variant deleted successfully
- ✅ List updates to show 3 variants
- ✅ Order numbers adjust automatically

### Test Case 1.6: Variant Limit
**Objective**: Verify 100 variant limit enforcement

**Steps**:
1. Create product with 100 variants (can use script)
2. Try to add 101st variant

**Expected Results**:
- ✅ Error: "Maximum variant limit reached (100 per product)"
- ❌ 101st variant not created

## Part 2: Storefront - Public Display

### Test Case 2.1: Product List with Variants
**Objective**: Verify variants expand in catalog

**Steps**:
1. Navigate to storefront catalog
2. Search for `TEST-VAR-001`
3. Observe product listings

**Expected Results**:
- ✅ Parent product does NOT appear (it has variants)
- ✅ Each ACTIVE variant appears as separate product:
  - `Aretes Premium Test - Diseño Estrella`
  - `Aretes Premium Test - Diseño Flor`
  - `Aretes Premium Test - Diseño Luna` (if still exists)
- ❌ Inactive variant (Corazón Grande) NOT shown
- ✅ All show same price: ₡15,000
- ✅ All show "Disponible" (shared stock = 30)
- ✅ Each has its own variant image

**API Verification**:
```bash
curl http://localhost:3001/api/public/products?busqueda=TEST-VAR
# products array should have 3 items (active variants only)
# Each with es_variante: true, variante_id, variante_nombre
```

### Test Case 2.2: Product Detail - Variant Selector
**Objective**: Verify variant selection UI

**Steps**:
1. Click on any variant product
2. Observe product detail page

**Expected Results**:
- ✅ "Diseños Disponibles (3)" section shown
- ✅ Grid of 3 variant thumbnails displayed
- ✅ First variant pre-selected (checkmark icon)
- ✅ Selected variant name shown below grid
- ✅ Main product image shows selected variant
- ✅ Info badge: "Todos los diseños comparten el mismo precio y stock"

### Test Case 2.3: Variant Selection Interaction
**Objective**: Verify variant switching

**Steps**:
1. On product detail, click different variant thumbnail
2. Observe image change
3. Check "Diseño seleccionado" label

**Expected Results**:
- ✅ Thumbnail highlights with blue border + checkmark
- ✅ Main image updates to selected variant
- ✅ "Diseño seleccionado" updates
- ✅ Price stays same (₡15,000)
- ✅ Stock stays same (30 disponibles)
- ✅ Smooth animation on selection

### Test Case 2.4: Add Variant to Cart
**Objective**: Verify cart handles variants correctly

**Steps**:
1. Select "Diseño Estrella"
2. Set quantity to 2
3. Click "Agregar al carrito"
4. Open cart drawer
5. Verify item shows "Aretes Premium Test - Diseño Estrella"
6. Go back to product detail
7. Select "Diseño Flor"
8. Add 1 to cart
9. Open cart

**Expected Results**:
- ✅ Cart shows 2 separate items:
  - `Aretes Premium Test - Diseño Estrella` (qty: 2)
  - `Aretes Premium Test - Diseño Flor` (qty: 1)
- ✅ Each shows correct variant image
- ✅ Subtotal: ₡45,000 (15k×2 + 15k×1)
- ✅ Total items: 3

**Technical Verification**:
- Cart storage should have different `variante_id` for each item
- Same product_id but different variante_id = separate cart items

### Test Case 2.5: Checkout with Variants
**Objective**: Verify order creation includes variant info

**Steps**:
1. Proceed to checkout with variants in cart
2. Fill customer information:
   - Nombre: `Test Variants`
   - Teléfono: `88887777`
   - Email: `test@variants.com`
3. Submit order

**Expected Results**:
- ✅ Order processes successfully
- ✅ Order confirmation shows both variants
- ✅ Each variant listed separately with image
- ✅ Stock decrements from parent product

**API Verification**:
```bash
# Check created order
curl http://localhost:3001/api/public/orders/[order-id]

# Check parent product stock
curl http://localhost:3001/api/joyas/[product-id] \
  -H "Cookie: [session-cookie]"
# stock_actual should be 27 (30 - 2 - 1)
```

## Part 3: Stock Management

### Test Case 3.1: Shared Stock Validation
**Objective**: Verify all variants share parent product stock

**Steps**:
1. Note parent product stock: 27 (from previous test)
2. In storefront, view any variant
3. Check "Disponible" indicator
4. Try to add 30 units (more than available)

**Expected Results**:
- ✅ All variants show same stock availability
- ❌ Cannot add more than 27 to cart
- ✅ Validation error if attempting to exceed stock

### Test Case 3.2: Stock Depletion
**Objective**: Verify behavior when stock = 0

**Steps**:
1. In POS, edit parent product
2. Set stock_actual to 0
3. Save
4. Refresh storefront catalog

**Expected Results**:
- ✅ ALL variants disappear from catalog
- ✅ Direct product URL shows "Agotado"
- ❌ Cannot add to cart
- ✅ Variant selector still visible
- ✅ Message: "No disponible"

### Test Case 3.3: Stock Warning
**Objective**: Verify low stock warning

**Steps**:
1. Set parent product stock to 3
2. View any variant on storefront

**Expected Results**:
- ✅ Shows "(Solo 3 unidades)" warning
- ✅ Orange/warning color indicator
- ✅ Still can add to cart (up to 3)

## Part 4: iPad Responsiveness

### Test Case 4.1: Form Scrolling - Portrait iPad
**Device**: iPad (768px x 1024px portrait)

**Steps**:
1. Open "Nueva Joya" on iPad
2. Fill all fields
3. Upload image (triggers preview)
4. Try to scroll to "Guardar" button

**Expected Results**:
- ✅ Form container has scroll
- ✅ Can reach all fields
- ✅ Save button always accessible (sticky footer)
- ✅ Image preview doesn't push button off-screen
- ✅ Smooth iOS-style scrolling

**CSS Verification**:
- Container: `max-height: calc(100vh - 100px)`
- Container: `overflow-y: auto`
- Footer: `position: sticky; bottom: 0`
- Inputs: `min-height: 44px` (touch-friendly)

### Test Case 4.2: Form Scrolling - Landscape iPad
**Device**: iPad (1024px x 768px landscape)

**Steps**:
1. Rotate iPad to landscape
2. Repeat test 4.1

**Expected Results**:
- ✅ Layout adjusts to landscape
- ✅ Scrolling still works
- ✅ Save button accessible

### Test Case 4.3: Variant Manager on iPad
**Steps**:
1. Edit product with variants on iPad
2. Scroll to variant manager
3. Click "Agregar Variante"
4. Fill modal form

**Expected Results**:
- ✅ Modal scrollable if content exceeds viewport
- ✅ Buttons accessible
- ✅ Image preview visible
- ✅ Can save variant

## Part 5: Edge Cases & Security

### Test Case 5.1: Variant Without Product Parent
**Steps**:
1. Manually delete parent product (if possible)
2. Try to access variant

**Expected Results**:
- ✅ Variant automatically cleaned up (ON DELETE CASCADE)
- ✅ No orphaned variants in database

### Test Case 5.2: Image URL Validation
**Steps**:
1. Try to create variant with non-Cloudinary image URL
2. Example: `https://example.com/image.jpg`

**Expected Results**:
- ❌ Error: "Image URL must be from Cloudinary"
- ❌ Variant not created

### Test Case 5.3: XSS Prevention
**Steps**:
1. Try variant name: `<script>alert('xss')</script>`
2. Try description with HTML tags

**Expected Results**:
- ✅ HTML sanitized/escaped
- ✅ No script execution
- ✅ Safe display in UI

### Test Case 5.4: Unmark as Variant Product
**Steps**:
1. Delete all variants of a product
2. Check `es_producto_variante` flag

**Expected Results**:
- ✅ Flag automatically set to `false`
- ✅ Product appears normally in storefront
- ✅ No variant selector shown

## Part 6: Performance

### Test Case 6.1: Large Variant Set
**Steps**:
1. Create product with 50 variants
2. Load product detail on storefront
3. Measure page load time

**Expected Results**:
- ✅ Page loads in < 3 seconds
- ✅ All thumbnails visible
- ✅ Smooth scrolling through variants
- ✅ No browser lag

### Test Case 6.2: Catalog with Many Variant Products
**Steps**:
1. Create 10 products, each with 10 variants
2. Load catalog page

**Expected Results**:
- ✅ Pagination works correctly
- ✅ Variant expansion doesn't break pagination
- ✅ Page load time acceptable

## Test Results Summary

### Checklist
- [ ] POS: Create product with variants
- [ ] POS: Add multiple variants
- [ ] POS: Reorder variants
- [ ] POS: Edit variant
- [ ] POS: Delete variant
- [ ] POS: Variant limit enforcement
- [ ] Storefront: Variants expand in catalog
- [ ] Storefront: Variant selector displays
- [ ] Storefront: Variant selection works
- [ ] Storefront: Add variant to cart
- [ ] Storefront: Checkout with variants
- [ ] Stock: Shared stock validation
- [ ] Stock: Stock depletion behavior
- [ ] Stock: Low stock warning
- [ ] iPad: Portrait form scrolling
- [ ] iPad: Landscape form scrolling
- [ ] iPad: Variant manager modal
- [ ] Edge: Orphaned variant prevention
- [ ] Edge: Image URL validation
- [ ] Edge: XSS prevention
- [ ] Edge: Auto-unmark variant flag
- [ ] Performance: Large variant set
- [ ] Performance: Many variant products

### Issues Found
_Document any bugs or unexpected behavior here_

### Screenshots
_Add screenshots of key UI elements:_
- POS variant manager
- iPad scrolling behavior
- Storefront variant selector
- Cart with multiple variants
- Order confirmation with variants

## Conclusion

This test plan ensures 100% functionality of the variants system across all contexts:
✅ POS creation and management
✅ Storefront display and selection
✅ Cart and checkout integration
✅ Stock management
✅ iPad responsiveness
✅ Security and edge cases
✅ Performance with large datasets
