# Frontend POS

Aplicación React para operación interna de la joyería (punto de venta, inventario y reportes), presentada en formato de portafolio para entrevista técnica.

## Propósito

Este módulo ofrece una interfaz administrativa para procesos diarios del negocio, con foco en productividad operativa y trazabilidad.

## Configuración

```bash
cd frontend
npm install
cp .env.example .env
```

## Variables de entorno

La referencia está en [`frontend/.env.example`](.env.example).

Variables principales:
- `HOST=0.0.0.0` (acceso desde dispositivos en red local)
- `REACT_APP_API_URL` (opcional en local y requerido en despliegues externos)

## Scripts

```bash
npm start
npm test
npm run build
npm run test:coverage
```

## Notas operativas

- El frontend detecta automáticamente la IP del backend en escenarios de red local.
- En producción, se debe configurar `REACT_APP_API_URL` apuntando a la API publicada.
