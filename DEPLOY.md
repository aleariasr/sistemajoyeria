# Guía de Despliegue

## Arquitectura recomendada

- **Backend**: Railway (Node.js)
- **Frontend POS**: Vercel (React)
- **Storefront**: Vercel (Next.js)
- **Base de datos**: Supabase

## Backend (Railway)

Variables mínimas:

```bash
NODE_ENV=production
PORT=3001
SESSION_SECRET=<valor-seguro>
FRONTEND_URL=https://<pos>.vercel.app,https://<storefront>.vercel.app
SUPABASE_URL=<url>
SUPABASE_KEY=<key>
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
```

Comando de inicio:

```bash
npm start
```

## Frontend POS (Vercel)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `build`
- Variable requerida:

```bash
REACT_APP_API_URL=https://<backend>.railway.app/api
```

## Storefront (Vercel)

- Root directory: `storefront`
- Build command: `npm run build`
- Variables recomendadas:

```bash
NEXT_PUBLIC_API_URL=https://<backend>.railway.app/api
NEXT_PUBLIC_SITE_URL=https://<storefront>.vercel.app
```

## Verificación post-deploy

1. Health check backend: `GET /api/health`
2. Login POS y operaciones básicas
3. Navegación del catálogo en storefront
4. Confirmar CORS entre frontends y backend
