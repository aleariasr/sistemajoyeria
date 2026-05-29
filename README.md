# Sistema Joyería (Monorepo)

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Licencia: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Repositorio monolítico orientado a portafolio técnico para entrevistas, enfocado en la operación integral de una joyería mediante tres aplicaciones coordinadas.

## Visión general del proyecto

El sistema integra procesos de punto de venta, administración operativa y comercio electrónico en una arquitectura modular.

- **backend/**: API REST (Node.js + Express + Supabase)
- **frontend/**: POS administrativo (React)
- **storefront/**: tienda online pública (Next.js)

## Tabla de contenido

- [Arquitectura](#arquitectura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Comandos principales](#comandos-principales)
- [Documentación por módulo](#documentación-por-módulo)
- [Despliegue](#despliegue)
- [Contribución](#contribución)

## Arquitectura

```text
Frontend POS (React) ─┐
                      ├──> Backend API (Express) ───> Supabase / Cloudinary / Resend
Storefront (Next.js) ─┘
```

## Requisitos

- Node.js 20+
- npm 9+

## Instalación

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp storefront/.env.example storefront/.env.local
```

## Variables de entorno

Las variables se documentan en:
- `/backend/.env.example`
- `/frontend/.env.example`
- `/storefront/.env.example`

> No se deben versionar archivos `.env` con valores reales.

## Comandos principales

Desde la raíz del monorepo:

```bash
npm run start:backend
npm run start:frontend
npm run start:storefront
npm run dev:backend
npm run dev:storefront

npm run test:backend
npm run test:storefront
npm run test:full

npm run build:frontend
npm run build:storefront
```

## Documentación por módulo

- [`backend/README.md`](backend/README.md)
- [`frontend/README.md`](frontend/README.md)
- [`storefront/README.md`](storefront/README.md)
- [`DEVELOPMENT.md`](DEVELOPMENT.md)
- [`DEPLOY.md`](DEPLOY.md)
- [`SECURITY.md`](SECURITY.md)

## Despliegue

La guía de despliegue se encuentra en [`DEPLOY.md`](DEPLOY.md).

## Contribución

1. Crear una rama por cambio.
2. Mantener commits atómicos y descriptivos (se recomienda Conventional Commits).
3. Ejecutar pruebas del módulo afectado antes de abrir un PR.
4. Actualizar la documentación cuando cambien scripts, configuración o comportamiento funcional.
