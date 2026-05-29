# Guía de Desarrollo

## Requisitos

- Node.js 20+
- npm 9+

## Setup local

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp storefront/.env.example storefront/.env.local
```

## Ejecución en desarrollo

```bash
npm run start:backend
npm run start:frontend
npm run start:storefront
npm run dev:backend
npm run dev:storefront
```

## Calidad y pruebas

```bash
npm run test:backend
npm run test:storefront
npm run test:full
```

## Convenciones

- Mantener cambios pequeños y enfocados.
- Actualizar documentación cuando cambien scripts, variables o flujos.
- Evitar versionar credenciales y artefactos temporales.
- Usar Conventional Commits de forma recomendada.
