# Backend Test Suite - Quick Verification Guide

Este documento describe cómo ejecutar la suite de pruebas del backend en modo mock (sin credenciales reales ni base de datos remota).

## 📋 Resumen

La suite de pruebas incluye:
- **Tests Unitarios**: Lógica de negocio de modelos (Joya, shuffle, filtros)
- **Tests de Integración**: Rutas API con mocks de Supabase, Cloudinary y Resend
- **Fixtures**: Datos de prueba en memoria
- **Sin Dependencias Externas**: Todo se ejecuta con mocks, no requiere credenciales reales

## 🚀 Ejecución Rápida

### Todos los Tests
```bash
cd backend
npm test
```

### Tests Unitarios (Modelos)
```bash
npm run test:unit
```

### Tests de Integración (Rutas API)
```bash
npm run test:integration
```

### Tests con Cobertura
```bash
npm run test:coverage
```

### Modo Watch (desarrollo)
```bash
npm run test:watch
```

## 📊 Cobertura Actual

### Tests Unitarios (20 tests)
- ✅ **Joya Model** - CRUD, filtros, paginación, shuffle determinístico
  - `crear()` - Creación de joyas con validaciones
  - `obtenerTodas()` - Listado con filtros (búsqueda, categoría, stock)
  - `obtenerPorId()` - Búsqueda por ID
  - `obtenerPorCodigo()` - Búsqueda por código (case-insensitive)
  - `actualizar()` - Actualización de campos
  - `_shuffleArraySeeded()` - Shuffle determinístico con seed
  - `_balanceCategories()` - Balance de categorías (max 3 consecutivos)

### Tests de Integración (24+ tests)
- ✅ **Auth Routes** - Autenticación y autorización
  - POST `/api/auth/login` - Login exitoso/fallido
  - GET `/api/auth/session` - Verificación de sesión
  - POST `/api/auth/logout` - Cierre de sesión
  - POST `/api/auth/refresh-session` - Renovación de sesión
  - Rutas protegidas - 401 sin autenticación, 403 sin permisos

- 🔄 **Joyas Routes** - CRUD de joyas (en desarrollo)
  - GET `/api/joyas` - Listado con filtros y paginación
  - POST `/api/joyas` - Creación con validaciones
  - GET `/api/joyas/:id` - Detalle de joya
  - PUT `/api/joyas/:id` - Actualización
  - DELETE `/api/joyas/:id` - Eliminación

- 🔄 **Public Routes** - API pública (en desarrollo)
  - GET `/api/public/products` - Productos activos con shuffle
  - GET `/api/public/products/:slug` - Detalle de producto
  - Expansión de variantes con `_uniqueKey`
  - Balance de categorías en shuffle

## 🔧 Estructura de Tests

```
backend/tests/
├── setup.js                 # Configuración global de Jest
├── mocks/                   # Mocks de servicios externos
│   ├── supabase.mock.js    # Mock de Supabase (in-memory DB)
│   ├── cloudinary.mock.js  # Mock de Cloudinary (imágenes)
│   └── resend.mock.js      # Mock de Resend (emails)
├── fixtures/                # Datos de prueba
│   └── data.js             # Fixtures de joyas, usuarios, etc.
├── helpers/                 # Utilidades de testing
│   └── testHelpers.js      # Helpers para auth y app setup
├── unit/                    # Tests unitarios
│   └── joya.model.test.js  # Tests del modelo Joya
└── integration/             # Tests de integración
    ├── auth.routes.test.js # Tests de autenticación ✅
    ├── joyas.routes.test.js # Tests de joyas CRUD
    └── public.routes.test.js # Tests de API pública
```

## 🎯 Funcionalidades Clave Probadas

### 1. Autenticación y Sesiones
- ✅ Login con credenciales válidas/inválidas
- ✅ Manejo de sesiones con cookies
- ✅ Rutas protegidas con `requireAuth`
- ✅ Control de acceso basado en roles (admin/dependiente)

### 2. Joyas CRUD
- ✅ Creación con validaciones (código único, campos obligatorios)
- ✅ Listado con paginación estable (DESC por fecha_creacion, id)
- ✅ Filtros: búsqueda, categoría (case-insensitive), stock_bajo, sin_stock, estado
- ✅ Deduplicación automática de resultados
- ✅ Código único (case-insensitive)

### 3. Shuffle y Balance de Categorías
- ✅ Shuffle determinístico con seed (mismo orden con mismo seed)
- ✅ Balance de categorías: máximo 3 productos consecutivos de la misma categoría
- ✅ Algoritmo Fisher-Yates con RNG seeded (Mulberry32)

### 4. API Pública (Storefront)
- 🔄 Sólo productos activos con stock y `mostrar_en_storefront=true`
- 🔄 Expansión de variantes con `_uniqueKey` único
- 🔄 Ocultación de campos sensibles (costo, stock exacto)
- 🔄 Shuffle con seed y balance de categorías

## 🔍 Ejemplos de Uso

### Ejecutar un test específico
```bash
npm test -- tests/unit/joya.model.test.js
npm test -- tests/integration/auth.routes.test.js
```

### Ver tests con verbose
```bash
npm test -- --verbose
```

### Ejecutar tests que coincidan con un patrón
```bash
npm test -- --testNamePattern="should login"
```

### Generar reporte de cobertura HTML
```bash
npm run test:coverage
# Abre backend/coverage/lcov-report/index.html en el navegador
```

## ✅ Validación Pre-CI

Antes de hacer push o merge, ejecuta:

```bash
# 1. Todos los tests deben pasar
npm test

# 2. Verificar cobertura (objetivo: >80%)
npm run test:coverage

# 3. No debe haber console.log/error en tests
npm test -- --silent
```

## 🐛 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install --save-dev @supabase/supabase-js
```

### "Jest did not exit one second after test run"
- Los mocks están correctamente configurados, no hay conexiones abiertas
- Si persiste, usa `--forceExit`: `npm test -- --forceExit`

### "Module not mocked correctly"
- Verifica que `jest.mock()` esté **antes** del `require()` del módulo
- Revisa que el path del mock sea correcto

### Tests fallan localmente pero pasan en CI
- Verifica que no haya dependencias de estado global
- Usa `beforeEach()` para resetear fixtures

## 📚 Recursos Adicionales

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Guide](https://github.com/visionmedia/supertest)
- `backend/tests/integration/auth.routes.test.js` - Ejemplo completo de test con sesiones
- `backend/tests/mocks/supabase.mock.js` - Implementación del mock de Supabase

## 🎯 Próximos Pasos

1. Completar tests de joyas routes (filtros, paginación)
2. Completar tests de public routes (shuffle, variantes)
3. Agregar tests de variantes y sets
4. Agregar tests de movimientos de inventario
5. Integrar con CI/CD (GitHub Actions)

## 📝 Convenciones

- Tests unitarios: Prueban **lógica de negocio** aislada (modelos)
- Tests de integración: Prueban **rutas API** con mocks de servicios
- Fixtures: Datos mínimos pero representativos
- Mocks: Comportamiento realista, sin side effects

---

**Última actualización:** 2024-01-21  
**Estado:** 44 tests pasando (100%)

### Tests Adicionales (WIP)

Los siguientes archivos de tests están disponibles pero requieren ajustes para funcionar completamente con el sistema de mocks:

- `tests/integration/joyas.routes.test.js` - Tests completos de CRUD de joyas (38 tests)
- `tests/integration/public.routes.test.js` - Tests de API pública con shuffle (36 tests)

Estos tests están bien estructurados pero necesitan cargar la aplicación Express completa con todos los middlewares y rutas. Para activarlos:

```javascript
// En jest.config.js, agregar a testMatch:
testMatch: [
  '**/tests/unit/**/*.test.js',
  '**/tests/integration/**/*.test.js'  // Incluir todos los tests de integración
],
```

Ver los archivos de tests para más detalles sobre la implementación.

