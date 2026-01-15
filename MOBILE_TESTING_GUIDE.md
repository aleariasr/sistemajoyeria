# Mobile Testing Guide - Sistema de Joyería POS

## 📱 Quick Start

### Chrome DevTools Testing
1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select device or set custom dimensions
4. Test all breakpoints: 320px, 375px, 414px, 768px, 1024px

### Real Device Testing
1. Connect device to same network as dev server
2. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Access: `http://YOUR_IP:3000`
4. Test all critical user flows

---

## 🎯 Test Scenarios by Module

### 1. Login Module
**Viewport**: 375x667 (iPhone SE)

- [ ] Logo displays correctly
- [ ] Form fields are touch-friendly (≥ 44px)
- [ ] Email keyboard appears for email field
- [ ] Password toggle works
- [ ] Login button is full-width
- [ ] Error messages are readable
- [ ] No horizontal scroll

### 2. Navigation (Sidebar)
**Viewport**: 375x667 (iPhone SE)

- [ ] Hamburger button visible (top-left)
- [ ] Tapping hamburger opens sidebar
- [ ] Overlay darkens background
- [ ] All menu items visible
- [ ] Icons + text displayed
- [ ] Active state highlights
- [ ] Tapping menu item navigates
- [ ] Sidebar auto-closes after navigation
- [ ] Tapping overlay closes sidebar
- [ ] Smooth slide animation

**Test on tablet (768x1024)**:
- [ ] Collapsed sidebar (icon-only)
- [ ] Hover shows full menu
- [ ] Navigation still works

### 3. Ventas (POS) Module
**Viewport**: 414x896 (iPhone 11)

#### Search & Add Products
- [ ] Search bar full-width
- [ ] Product autocomplete works
- [ ] Touch to select product
- [ ] Product adds to cart

#### Shopping Cart
- [ ] Cart items stack vertically
- [ ] Product image visible
- [ ] Quantity controls accessible
- [ ] +/- buttons ≥ 44px
- [ ] Delete button full-width
- [ ] Price displays clearly
- [ ] Total updates correctly

#### Payment Form
- [ ] Payment method dropdown works
- [ ] All form fields visible
- [ ] Cliente search works
- [ ] Date picker appears
- [ ] Descuento input accessible
- [ ] Process button full-width (≥ 44px)

#### Post-Sale Actions
- [ ] Success message readable
- [ ] Print buttons full-width
- [ ] Thermal print option works
- [ ] New sale button visible

### 4. HistorialVentas (Sales History)
**Viewport**: 375x667 (iPhone SE)

#### Filters
- [ ] Date inputs stack vertically
- [ ] Filter dropdowns full-width
- [ ] Clear filters button visible
- [ ] Apply filters works

#### Sales Table
- [ ] "← Deslice →" indicator visible
- [ ] Horizontal scroll works smoothly
- [ ] All columns accessible
- [ ] Ver Detalle button tappable
- [ ] Row highlighting on tap

#### Pagination
- [ ] Page info centered
- [ ] Previous/Next buttons full-width
- [ ] Buttons ≥ 44px
- [ ] Disabled state clear

### 5. CuentasPorCobrar (Accounts)
**Viewport**: 414x896 (iPhone 11)

#### Summary Cards
- [ ] Cards stack vertically
- [ ] Icons display correctly
- [ ] Values are readable
- [ ] Colors indicate status
- [ ] Cards have hover effect

#### Filters
- [ ] Estado dropdown full-width
- [ ] Filter applies correctly
- [ ] Results update

#### Accounts Table
- [ ] Scroll indicator visible
- [ ] All columns accessible
- [ ] Cliente name readable
- [ ] Saldo highlighted
- [ ] View button works
- [ ] Badge colors correct

### 6. IngresosExtras (Extra Income)
**Viewport**: 375x667 (iPhone SE)

#### Stats Cards
- [ ] Cards stack vertically
- [ ] Icons visible
- [ ] Values readable
- [ ] Borders indicate type

#### Add Income Form
- [ ] Form button full-width
- [ ] Modal opens full-screen
- [ ] All fields accessible
- [ ] Tipo dropdown works
- [ ] Monto input numeric keyboard
- [ ] Método pago dropdown works
- [ ] Description textarea expands
- [ ] Save button full-width (≥ 44px)
- [ ] Cancel on top (mobile pattern)

#### Income Table
- [ ] Scroll indicator visible
- [ ] All columns readable
- [ ] Badges display correctly
- [ ] Actions work

### 7. Devoluciones (Returns)
**Viewport**: 414x896 (iPhone 11)

#### Search Sale
- [ ] Search form stacks vertically
- [ ] Venta ID input works
- [ ] Search button full-width
- [ ] Results display correctly

#### Sale Info
- [ ] Info box readable
- [ ] All sale details visible
- [ ] Monto devolucion highlighted

#### Return Form
- [ ] Form fields stack
- [ ] Motivo dropdown works
- [ ] Notas textarea works
- [ ] Process button full-width

### 8. Clientes (Customers)
**Viewport**: 375x667 (iPhone SE)

#### Search
- [ ] Search bar full-width
- [ ] Search icon visible
- [ ] Results update on type

#### Customer Table
- [ ] Scroll indicator visible
- [ ] Name + phone readable
- [ ] Action buttons work
- [ ] Edit icon tappable
- [ ] View icon tappable

### 9. FormularioCliente (Customer Form)
**Viewport**: 414x896 (iPhone 11)

- [ ] All fields stack vertically
- [ ] Labels readable
- [ ] Required fields marked
- [ ] Input fields ≥ 44px
- [ ] Phone keyboard for phone
- [ ] Email keyboard for email
- [ ] Save button full-width
- [ ] Cancel button above save

### 10. ListadoJoyas (Inventory)
**Viewport**: 375x667 (iPhone SE)

#### Filters
- [ ] Search bar full-width
- [ ] Category dropdown works
- [ ] Price range inputs work
- [ ] Stock checkboxes accessible
- [ ] Filter button full-width
- [ ] Clear filters works

#### Products Grid/Table
- [ ] Products display in grid
- [ ] Images load correctly
- [ ] Product name readable
- [ ] Price visible
- [ ] Stock indicator clear
- [ ] Action buttons accessible

### 11. FormularioJoya (Product Form)
**Viewport**: 414x896 (iPhone 11)

#### Basic Info
- [ ] All fields stack
- [ ] Código input works
- [ ] Nombre input works
- [ ] Categoria dropdown works
- [ ] Precio inputs work
- [ ] Stock input numeric keyboard

#### Images
- [ ] File input accessible
- [ ] Multiple upload works
- [ ] Preview images display
- [ ] Remove image works

#### Variants (if applicable)
- [ ] Add variant button full-width
- [ ] Variant form modal full-screen
- [ ] Variant list scrollable

#### Composite Products (if applicable)
- [ ] Add component button full-width
- [ ] Component modal works
- [ ] Component list readable

#### Save Actions
- [ ] Save button full-width (≥ 44px)
- [ ] Cancel button above save

### 12. CierreCaja (Cash Closure)
**Viewport**: 414x896 (iPhone 11)

#### Summary
- [ ] Total cards stack
- [ ] Payment method breakdown visible
- [ ] Values readable

#### Form
- [ ] All inputs accessible
- [ ] Efectivo inicial works
- [ ] Efectivo final works
- [ ] Notas textarea works
- [ ] Close button full-width

### 13. Reportes (Reports)
**Viewport**: 375x667 (iPhone SE)

#### Report Type Selection
- [ ] Buttons wrap properly
- [ ] Active button highlighted
- [ ] Export button visible

#### Filters (when applicable)
- [ ] Date inputs stack
- [ ] Filter applies

#### Report Table
- [ ] Scroll indicator visible
- [ ] All columns accessible
- [ ] Data readable
- [ ] Totals visible

### 14. PedidosOnline (Online Orders)
**Viewport**: 414x896 (iPhone 11)

- [ ] Order cards stack
- [ ] Order details readable
- [ ] Status badges clear
- [ ] Action buttons work
- [ ] View details modal works

### 15. ProductosCompuestosManager
**Viewport**: 375x667 (iPhone SE)

- [ ] Component list stacks
- [ ] Thumbnails display
- [ ] Component info readable
- [ ] Add button full-width
- [ ] Delete button full-width
- [ ] Modal full-screen

### 16. VariantesManager
**Viewport**: 414x896 (iPhone 11)

- [ ] Variant list stacks
- [ ] Ordering controls horizontal
- [ ] Up/down buttons work
- [ ] Thumbnails display
- [ ] Edit/delete buttons full-width
- [ ] Add variant button full-width

---

## 🧪 Specific Test Cases

### Touch Target Validation
Test that all interactive elements meet the 44x44px minimum:

```
Measure touch targets:
1. Open DevTools
2. Select element
3. Check Computed > Box Model
4. Verify: min-width: 44px && min-height: 44px
```

### Form Submission Flow
**Mobile (iPhone SE)**:
1. Fill all required fields
2. Verify keyboard types match input type
3. Submit form
4. Verify success/error message readable
5. Verify next action is clear

### Table Horizontal Scroll
**Mobile (any device)**:
1. Open page with table
2. Verify scroll indicator visible
3. Swipe left/right on table
4. Verify all columns accessible
5. Verify scroll is smooth

### Modal Full-Screen Experience
**Mobile (iPhone 11)**:
1. Open modal
2. Verify modal fills screen (95-100% width)
3. Verify header visible
4. Verify close button accessible
5. Verify content scrollable if long
6. Verify footer buttons visible
7. Verify close on overlay tap works

### Navigation Flow
**Mobile (iPhone SE)**:
1. Open menu
2. Navigate to each module
3. Verify sidebar closes
4. Verify no horizontal scroll
5. Verify page loads correctly

---

## 📊 Breakpoint Testing

### 320px (Ultra-small phones)
- [ ] Text remains readable (≥ 14px)
- [ ] Buttons don't break
- [ ] Forms work
- [ ] Tables scroll

### 375px (iPhone SE, iPhone 12 mini)
- [ ] All content fits
- [ ] Touch targets adequate
- [ ] No text cutoff
- [ ] Images scale correctly

### 414px (iPhone 11, Pixel 5)
- [ ] Optimal mobile layout
- [ ] Proper whitespace
- [ ] Images display well
- [ ] Touch targets comfortable

### 768px (iPad Mini)
- [ ] Two-column layouts appear
- [ ] Sidebar icon-only or collapsed
- [ ] Tables show more columns
- [ ] Forms use available space

### 1024px (iPad, small laptops)
- [ ] Desktop-like layout begins
- [ ] Multi-column grids
- [ ] Sidebar fully visible
- [ ] Hover states work

---

## 🔍 Visual Regression Checklist

### Layout
- [ ] No overlapping elements
- [ ] No content cutoff
- [ ] Proper alignment
- [ ] Consistent spacing

### Typography
- [ ] All text readable
- [ ] Proper line height
- [ ] No text overflow
- [ ] Correct font sizes

### Colors & Contrast
- [ ] Sufficient contrast (WCAG AA)
- [ ] Status colors clear
- [ ] Hover/active states visible
- [ ] Focus indicators present

### Images & Icons
- [ ] Images scale correctly
- [ ] Icons remain crisp
- [ ] Aspect ratios maintained
- [ ] No broken images

### Animations
- [ ] Smooth transitions (60fps)
- [ ] No janky scrolling
- [ ] No layout shifts
- [ ] Appropriate duration

---

## 🚀 Performance Testing

### Lighthouse Mobile Audit
```bash
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Select "Mobile"
4. Select "Performance"
5. Run audit
6. Target scores:
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90
```

### Key Metrics
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.8s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 200ms

### Network Simulation
Test on throttled connections:
- [ ] Fast 3G
- [ ] Slow 3G
- [ ] Offline (PWA features)

---

## 🔧 Debugging Tips

### Element Not Tappable
1. Check z-index conflicts
2. Verify no overlay blocking
3. Check if disabled state
4. Verify pointer-events: auto

### Horizontal Scroll
1. Use DevTools > Elements > Computed
2. Look for elements with width > viewport
3. Check overflow-x settings
4. Verify box-sizing: border-box

### Layout Breaks
1. Check media query syntax
2. Verify breakpoint order (mobile-first)
3. Check for missing closing braces
4. Validate CSS with linter

### Form Issues
1. Check input type matches keyboard
2. Verify autocomplete attributes
3. Check validation logic
4. Test with different values

---

## 📱 Device Testing Matrix

### iOS Devices
| Device | Size | iOS | Priority |
|--------|------|-----|----------|
| iPhone SE (2020) | 375x667 | 14+ | High |
| iPhone 12/13 | 390x844 | 15+ | High |
| iPhone 12/13 Pro Max | 428x926 | 15+ | Medium |
| iPad Mini | 768x1024 | 15+ | Medium |
| iPad Air | 820x1180 | 15+ | Low |

### Android Devices
| Device | Size | Android | Priority |
|--------|------|---------|----------|
| Samsung Galaxy S21 | 360x800 | 11+ | High |
| Google Pixel 5 | 393x851 | 11+ | High |
| Samsung Galaxy Tab | 800x1280 | 11+ | Medium |
| OnePlus 9 | 412x915 | 11+ | Low |

### Desktop Browsers
| Browser | Priority |
|---------|----------|
| Chrome | High |
| Firefox | High |
| Safari | High |
| Edge | Medium |

---

## ✅ Final Checklist

### Before Release
- [ ] All modules tested on mobile
- [ ] All modules tested on tablet
- [ ] Desktop functionality verified
- [ ] Cross-browser testing complete
- [ ] Performance audit passed
- [ ] Accessibility audit passed
- [ ] Real device testing done
- [ ] User acceptance testing done

### Documentation
- [ ] Screenshots captured
- [ ] Issues logged
- [ ] Known limitations documented
- [ ] Release notes updated

### Deployment
- [ ] Staging deployment successful
- [ ] Production deployment plan ready
- [ ] Rollback plan documented
- [ ] Monitoring in place

---

## 📝 Test Report Template

```markdown
## Mobile Test Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Device**: [Device model]
**OS**: [OS version]
**Browser**: [Browser + version]

### Modules Tested
- [ ] Module 1 - Status: ✅ Pass / ⚠️ Issues / ❌ Fail
- [ ] Module 2 - Status: ✅ Pass / ⚠️ Issues / ❌ Fail
- ...

### Issues Found
1. **Issue Title**
   - Module: [Module name]
   - Severity: Critical / High / Medium / Low
   - Description: [Details]
   - Steps to Reproduce: [Steps]
   - Expected: [Expected behavior]
   - Actual: [Actual behavior]
   - Screenshot: [Link]

### Performance Metrics
- FCP: [Value]
- LCP: [Value]
- TBT: [Value]
- CLS: [Value]

### Overall Assessment
[Pass / Fail] - [Comments]
```

---

## 🆘 Common Issues & Solutions

### Issue: Buttons too small on mobile
**Solution**: Add `min-height: 44px` to button styles

### Issue: Text requires zoom to read
**Solution**: Increase font-size to minimum 14px on mobile

### Issue: Forms not submitting on mobile
**Solution**: Check form validation, ensure submit button not disabled

### Issue: Horizontal scroll on mobile
**Solution**: Check for elements with fixed width > viewport, use max-width: 100%

### Issue: Images not loading on mobile
**Solution**: Check image URLs, ensure responsive image srcset

### Issue: Modal not closing on mobile
**Solution**: Verify overlay click handler, check z-index

---

**Testing Status**: Ready for execution
**Last Updated**: 2025-01-15

