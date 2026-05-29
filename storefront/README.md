# Storefront

Aplicación React para la tienda online pública de Sistema Joyería.

## Propósito

Este módulo cubre la experiencia de compra digital de cliente final y consume la API pública del backend.

## Configuración

```bash
cd storefront
npm install
cp .env.example .env.local
```

## Variables de entorno

La referencia está en [`storefront/.env.example`](.env.example).

Variables principales:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SITE_URL` (SEO y sitemap en producción)

## Scripts

```bash
npm run dev
npm run build
npm start
npm test
npm run test:e2e
npm run lint
```

## Alcance funcional

- Catálogo público
- Detalle de producto
- Carrito y checkout
- Integración con API pública del backend
