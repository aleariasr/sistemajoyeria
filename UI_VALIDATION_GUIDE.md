# UI Screenshots and Validation Guide

## SetComponents Visual Guide

### Component Structure

The SetComponents component displays in the product detail page below the main product information when `es_producto_compuesto` is true.

### Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Este set incluye 3 piezas     [✅ Set completo disponible]│
│                                                               │
│  Puedes comprar el set completo o las piezas individuales    │
│  por separado                                                 │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Image]  Pulsera Oro Eslabones              ✅ 10      │  │
│  │          ₡18,000                          disponibles   │  │
│  │          Código: PULS-001                               │  │
│  │          × 1 unidades por set           [Agregar pieza] │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Image]  Pulsera Oro Dije Corazón           ❌ Agotado │  │
│  │          ₡18,000                                        │  │
│  │          Código: PULS-002                               │  │
│  │          × 1 unidades por set                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [Image]  Pulsera Oro Perlas                 ✅ 15      │  │
│  │          ₡18,000                          disponibles   │  │
│  │          Código: PULS-003                               │  │
│  │                                         [Agregar pieza] │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  💡 Tip: Las piezas individuales también están disponibles  │
│          en el catálogo principal.                           │
└─────────────────────────────────────────────────────────────┘
```

### Visual States

#### 1. Active Component with Stock
- **Border**: Light primary color (border-primary-200)
- **Image**: Full color, 80x80px, rounded
- **Status Badge**: Green circle + "X disponible(s)"
- **Button**: Primary blue "Agregar pieza"
- **Hover**: Border darkens (border-primary-300)

#### 2. Out of Stock Component
- **Border**: Gray (border-gray-200)
- **Opacity**: 75%
- **Status Badge**: Red circle + "Agotado"
- **Button**: None
- **Interaction**: Non-clickable

#### 3. Inactive Component (Descontinuado)
- **Border**: Gray (border-gray-200)
- **Opacity**: 75%
- **Status Badge**: Gray circle + "No disponible"
- **Button**: None
- **Interaction**: Non-clickable

### Color Scheme

```css
/* Available (Active + Stock) */
Background: white (#ffffff)
Border: primary-200 → primary-300 on hover
Status: Green (#10b981)
Button: Primary blue (#3b82f6)

/* Unavailable (Out of stock or Inactive) */
Background: white (#ffffff)
Border: gray-200 (#e5e7eb)
Opacity: 0.75
Status: Red (#ef4444) or Gray (#6b7280)
Button: None

/* Container */
Background: primary-50 (light beige/cream)
Padding: 24px
Border-radius: 8px

/* Set Header Badge */
Available: Green background (#dcfce7), Green text (#15803d)
Unavailable: Red background (#fee2e2), Red text (#991b1b)
```

### Animation

- **Initial Load**: Fade in from bottom (y: 20 → 0)
- **Components**: Staggered fade-in (0.1s delay per item)
- **Transitions**: Smooth 300ms for all state changes

### Responsive Behavior

- **Desktop**: Full layout as shown
- **Mobile**: Stack vertically, maintain all information
- **Images**: Maintain 80x80px size on all screens
- **Buttons**: Full width on mobile

## Validation Checklist

### For Developers Testing

1. **Display Test**
   - [ ] Component appears below product details
   - [ ] All pieces show with correct information
   - [ ] Images load correctly
   - [ ] Prices formatted with correct currency
   - [ ] Stock numbers display accurately

2. **Interaction Test**
   - [ ] "Agregar pieza" button works for active pieces
   - [ ] Out-of-stock pieces cannot be added
   - [ ] Inactive pieces cannot be added
   - [ ] Toast notification shows on add
   - [ ] Cart updates correctly

3. **Visual Test**
   - [ ] Colors match design system
   - [ ] Animations smooth
   - [ ] Hover states work
   - [ ] Layout responsive
   - [ ] Text readable on all backgrounds

4. **Edge Cases**
   - [ ] Set with 0 components (doesn't render)
   - [ ] Set with 1 component (displays correctly)
   - [ ] Set with 20 components (scrolls properly)
   - [ ] Component with very long name (wraps correctly)
   - [ ] Component without image (shows diamond emoji)

5. **Performance**
   - [ ] API call happens once on mount
   - [ ] No unnecessary re-renders
   - [ ] Images lazy load
   - [ ] Smooth scrolling

## Browser Testing

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Accessibility

- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Focus indicators visible

## User Experience Flow

### Happy Path: Adding Individual Piece
1. User views product (e.g., "Trio de Pulseras Oro")
2. Scrolls down to see components section
3. Sees 3 pieces with their individual details
4. Clicks "Agregar pieza" on an available piece
5. Toast notification confirms addition
6. Can click "Ver carrito" to proceed to checkout
7. Or continue shopping and add more pieces

### Alternative Path: Out of Stock
1. User views product
2. Sees some pieces marked as "Agotado"
3. Understands only available pieces can be added
4. Adds available pieces to cart
5. Can still purchase the set if main product is available

## Sample Data for Testing

### Test Set: "Trio de Pulseras Oro"
```json
{
  "id": 999,
  "nombre": "Trio de Pulseras Oro",
  "es_producto_compuesto": true,
  "precio": 45000,
  "moneda": "CRC"
}
```

### Test Components
```json
[
  {
    "id": 101,
    "codigo": "PULS-001",
    "nombre": "Pulsera Oro Eslabones",
    "precio": 18000,
    "stock": 10,
    "estado": "Activo",
    "es_activo": true,
    "stock_disponible": true
  },
  {
    "id": 102,
    "codigo": "PULS-002",
    "nombre": "Pulsera Oro Dije Corazón",
    "precio": 18000,
    "stock": 0,
    "estado": "Activo",
    "es_activo": true,
    "stock_disponible": false
  },
  {
    "id": 103,
    "codigo": "PULS-003",
    "nombre": "Pulsera Oro Perlas",
    "precio": 18000,
    "stock": 15,
    "estado": "Activo",
    "es_activo": true,
    "stock_disponible": true
  }
]
```

## API Testing

### Test Endpoint
```bash
curl http://localhost:3001/api/public/products/999/componentes
```

### Expected Response
```json
{
  "componentes": [...],
  "stock_set": 5,
  "completo": true
}
```

### Validation
- [ ] Response matches ComponentsResponse type
- [ ] All fields present and correct types
- [ ] Stock calculations accurate
- [ ] Completo flag correct

## Notes for QA

- The component only appears when product has `es_producto_compuesto: true`
- API call is automatic on component mount
- Component state persists through navigation (via cart store)
- Error handling shows user-friendly message
- Loading state shows skeleton UI
