# Frontend POS

Aplicación React para operación interna (punto de venta, inventario y reportes).

## Configuración

```bash
cd frontend
npm install
cp .env.example .env
```

## Variables de entorno

Ver [`frontend/.env.example`](.env.example).

Variables principales:
- `HOST=0.0.0.0` (acceso desde dispositivos en red local)
- `REACT_APP_API_URL` (opcional en local, requerido en despliegues externos)

## Scripts

```bash
npm start
npm test
npm run build
npm run test:coverage
```

## Notas

- El frontend detecta automáticamente la IP del backend en escenarios de red local.
- Para producción, configure `REACT_APP_API_URL` hacia la API publicada.
