---
applyTo: "storefront/**/*.{ts,tsx}"
---

# Storefront Next.js Guidelines

Al escribir código para el storefront Next.js, sigue estas convenciones:

## Estructura de Código

1. **App Router**: En `src/app/` (Next.js 14)
2. **Componentes**: En `src/components/`
3. **Hooks**: En `src/hooks/` (useApi, useCart)
4. **Tipos**: En `src/types/`
5. **Utilidades**: En `src/lib/`

## Convenciones

1. **TypeScript**: Siempre usar tipos estrictos
   ```tsx
   interface Product {
     id: number;
     name: string;
     price: number;
     stock: number;
   }
   ```

2. **Componentes Server/Client**: 
   - Usar `'use client'` solo cuando necesario
   - Preferir Server Components por defecto

3. **Fetching de datos**: Usar hooks en `src/hooks/useApi.ts`
   ```tsx
   const { data, isLoading, error } = useProducts();
   ```

4. **Estado del carrito**: Usar Zustand store en `src/store/`
   ```tsx
   const { items, addItem, removeItem } = useCartStore();
   ```

5. **Estilos**: Tailwind CSS con clases utilitarias

## API Pública

Las rutas públicas del storefront usan `/api/public/*`:
- `GET /api/public/products` - Lista productos
- `GET /api/public/products/:id` - Detalle producto
- `GET /api/public/categories` - Categorías
- `POST /api/public/orders` - Crear pedido

## Build y Deploy

```bash
npm run build --workspace=storefront
npm run start --workspace=storefront
```

Deploy en Vercel con `storefront/vercel.json`.
