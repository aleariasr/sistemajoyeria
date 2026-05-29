# Backend (API)

Servicio API REST de Sistema Joyería, documentado en formato de portafolio técnico para entrevistas.

## Propósito

El backend centraliza reglas de negocio, autenticación, gestión operativa y exposición de endpoints para el POS y la tienda online.

## Stack

- Node.js + Express
- Supabase (PostgreSQL)
- Cloudinary (gestión de imágenes)
- Resend (notificaciones por correo)

## Configuración

```bash
cd backend
npm install
cp .env.example .env
```

## Variables de entorno

La referencia completa se encuentra en [`backend/.env.example`](.env.example).

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

- `routes/`: definición de endpoints HTTP
- `models/`: acceso a datos y reglas de dominio
- `middleware/`: autenticación, validaciones y carga de archivos
- `services/`: integraciones externas
- `tests/`: pruebas unitarias, de integración y de rendimiento
- `migrations/`: scripts SQL
