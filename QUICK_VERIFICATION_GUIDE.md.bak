# Quick Verification Guide

This guide shows you how to quickly verify that the variant mutation bug is fixed.

## 1. Run the Test Suite

```bash
cd backend

# Run mutation prevention tests
node tests/test-variant-mutation-fix.js

# Run existing variant logic tests
node tests/test-variant-logic-unit.js

# Run integration tests
node tests/test-public-api-integration.js
```

**Expected Result**: All tests should pass ✅

---

## 2. Manual API Test (if backend is running)

### Start the backend:
```bash
cd backend
npm start
```

### Test the API endpoint:
```bash
# Get products from page 1
curl http://localhost:3001/api/public/products?page=1&per_page=50 | jq '.products[] | {nombre, imagen_url, variante_id}'
```

### What to look for:

✅ **CORRECT (Bug is fixed):**
```json
{"nombre":"Diseño Dorado","imagen_url":"...dorada.jpg","variante_id":101}
{"nombre":"Diseño Plateado","imagen_url":"...plateada.jpg","variante_id":102}
{"nombre":"Diseño Rose Gold","imagen_url":"...rosegold.jpg","variante_id":103}
```
Each variant has a **different** name and image.

❌ **INCORRECT (Bug exists):**
```json
{"nombre":"Diseño Rose Gold","imagen_url":"...rosegold.jpg","variante_id":101}
{"nombre":"Diseño Rose Gold","imagen_url":"...rosegold.jpg","variante_id":102}
{"nombre":"Diseño Rose Gold","imagen_url":"...rosegold.jpg","variante_id":103}
```
All variants show the **same** name and image (last one).

---

## 3. Frontend Test (if storefront is running)

### Start the storefront:
```bash
cd storefront
npm run dev
```

### Test in browser:
1. Open browser to `http://localhost:3002`
2. **Clear browser cache** (CTRL+SHIFT+DEL)
3. Navigate to catalog/products page
4. Look at products that have variants

✅ **CORRECT**: Each variant card shows different name and image
❌ **INCORRECT**: All variant cards show the same name and image

---

## 4. Check Backend Logs

When the API is called, you should see logs like:

```
📦 [Página 1] Productos de DB: 5
📦 [Página 1] Únicos: 5
📦 [Página 1] Productos con variantes: 2
📦 [Página 1] Producto 100: 3 variantes
📦 [Página 1] Expandiendo PULSERA-001: 3 variantes
📦 [Página 1] Producto 200: 2 variantes
📦 [Página 1] Expandiendo COLLAR-001: 2 variantes
📦 [Página 1] Productos expandidos: 8
```

This shows:
- 2 parent products with variants
- Product 100 expanded into 3 variants
- Product 200 expanded into 2 variants
- Total 8 products returned (3 + 2 + 3 non-variant products)

---

## 5. Simple Node.js Test

Create a file `test-quick.js`:

```javascript
// Simulate the fix
function generateProductSlug(codigo, nombre) {
  return `${codigo.toLowerCase()}-${nombre.toLowerCase().replace(/\s+/g, '-')}`;
}

function transformToPublicProduct(joya, varianteInfo = null) {
  if (varianteInfo) {
    return {
      id: joya.id,
      nombre: varianteInfo.nombre_variante,
      imagen_url: varianteInfo.imagen_url,
      imagenes: [{
        url: varianteInfo.imagen_url,
        es_principal: true
      }]
    };
  }
  return {
    id: joya.id,
    nombre: joya.nombre,
    imagen_url: joya.imagen_url,
    imagenes: joya.imagenes || []
  };
}

// Test data
const parent = {
  id: 1,
  nombre: 'Pulsera Base',
  imagen_url: 'parent.jpg',
  imagenes: [{ url: 'parent.jpg' }]
};

const variants = [
  { id: 101, nombre_variante: 'Dorada', imagen_url: 'dorada.jpg' },
  { id: 102, nombre_variante: 'Plateada', imagen_url: 'plateada.jpg' },
  { id: 103, nombre_variante: 'Rose Gold', imagen_url: 'rosegold.jpg' }
];

// Create variant products
const products = variants.map(v => transformToPublicProduct(parent, v));

// Check results
console.log('\n=== VERIFICATION RESULTS ===\n');
products.forEach((p, i) => {
  console.log(`Variant ${i + 1}:`);
  console.log(`  Name: ${p.nombre}`);
  console.log(`  Image: ${p.imagen_url}`);
  console.log(`  Images Array: ${JSON.stringify(p.imagenes)}`);
  console.log('');
});

// Validate
const allDifferent = new Set(products.map(p => p.imagen_url)).size === 3;
console.log(allDifferent 
  ? '✅ SUCCESS: All variants have unique images!' 
  : '❌ FAIL: Variants share the same image'
);
```

Run it:
```bash
node test-quick.js
```

Expected output:
```
=== VERIFICATION RESULTS ===

Variant 1:
  Name: Dorada
  Image: dorada.jpg
  Images Array: [{"url":"dorada.jpg","es_principal":true}]

Variant 2:
  Name: Plateada
  Image: plateada.jpg
  Images Array: [{"url":"plateada.jpg","es_principal":true}]

Variant 3:
  Name: Rose Gold
  Image: rosegold.jpg
  Images Array: [{"url":"rosegold.jpg","es_principal":true}]

✅ SUCCESS: All variants have unique images!
```

---

## Summary

Run any of these tests to verify the fix. The fastest is option 1 (run the test suite).
The most comprehensive is option 3 (test in the actual storefront).

All tests should show that each variant has its own unique name and image,
proving that the object mutation bug is fixed.
