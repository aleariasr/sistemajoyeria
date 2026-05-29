# Backend (API)

API REST de Sistema Joyería construida con Express y Supabase.

## Stack

- Node.js + Express
- Supabase (PostgreSQL)
- Cloudinary (imágenes)
- Resend (emails)

## Configuración

```bash
cd backend
npm install
cp .env.example .env
```

## Variables de entorno

Ver detalle completo en [`backend/.env.example`](.env.example).

Variables críticas:
- `SESSION_SECRET`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Scripts

```bash
npm run dev
npm start
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
```

## Estructura

- `routes/`: endpoints HTTP
- `models/`: acceso y reglas de datos
- `middleware/`: autenticación, validaciones, upload
- `services/`: integraciones externas
- `tests/`: pruebas unitarias/integración/performance
- `migrations/`: scripts SQL
