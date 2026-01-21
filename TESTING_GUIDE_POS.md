# Testing Guide - POS Sistema de Joyería

Esta guía explica cómo ejecutar y mantener las pruebas para el sistema POS (punto de venta) de la joyería, incluyendo pruebas de backend y frontend.

## Tabla de Contenido

- [Resumen](#resumen)
- [Prerrequisitos](#prerrequisitos)
- [Backend Tests](#backend-tests)
- [Frontend Tests](#frontend-tests)
- [Ejecutar Todas las Pruebas](#ejecutar-todas-las-pruebas)
- [Cobertura de Pruebas](#cobertura-de-pruebas)
- [Mocks y Fixtures](#mocks-y-fixtures)
- [Troubleshooting](#troubleshooting)

## Resumen

El sistema de testing cubre los flujos principales del POS:

### Backend (Integration Tests con Jest + Supertest)
- ✅ **Ventas**: Contado (efectivo, tarjeta, transferencia, mixto) y crédito
- ✅ **Devoluciones**: Ajuste de stock y validación de cantidades
- ✅ **Cierre de caja**: Resumen diario, transferencia a DB principal
- ✅ **Cuentas por cobrar**: Abonos y seguimiento de saldos
- ✅ **Autenticación**: Login, roles, sesiones

### Frontend (Integration Tests con React Testing Library + MSW)
- ✅ **Login**: Autenticación de admin y dependiente
- 🔨 **Ventas**: Carrito, métodos de pago, validación de stock
- 🔨 **Cierre de caja**: Resumen y cierre (solo admin)
- 🔨 **Cuentas por cobrar**: Listado y abonos

**Leyenda**: ✅ = Funcionando completamente | 🔨 = Implementado, requiere ajustes menores

## Prerrequisitos

```bash
# Instalar dependencias (si no está hecho)
npm install

# Verificar que Jest está instalado
cd backend && npm list jest
cd ../frontend && npm list @testing-library/react
```

## Backend Tests

### Ejecutar Tests de Backend

```bash
# Todos los tests de backend
npm run test:backend

# Solo tests POS (ventas, devoluciones, cierre, cuentas por cobrar)
npm run test:pos

# Tests unitarios solamente
npm run test:backend -- tests/unit

# Tests de integración solamente
npm run test:backend -- tests/integration

# Con cobertura
npm run test:backend -- --coverage

# En modo watch
npm run test:backend -- --watch
```

### Estructura de Tests Backend

```
backend/tests/
├── integration/
│   ├── auth.routes.test.js          ✅ 24 tests passing
│   ├── ventas.routes.test.js        🔨 19/68 passing
│   ├── devoluciones.routes.test.js  🔨 Tests implementados
│   ├── cierrecaja.routes.test.js    🔨 Tests implementados
│   └── cuentas-por-cobrar.routes.test.js 🔨 Tests implementados
├── unit/
│   └── joya.model.test.js           ✅ 5 tests passing
├── fixtures/
│   └── data.js                      # Datos de prueba
├── mocks/
│   ├── supabase.mock.js             # Mock de Supabase
│   ├── cloudinary.mock.js           # Mock de Cloudinary
│   └── resend.mock.js               # Mock de Resend
└── helpers/
    └── testHelpers.js               # Utilidades de testing
```

### Tests POS Backend - Detalles

#### Ventas (ventas.routes.test.js)

**Venta Contado** ✅
- Pago en efectivo con cálculo de cambio
- Pago con tarjeta
- Pago con transferencia
- Pago mixto (efectivo + tarjeta + transferencia)
- Aplicación de descuentos
- Validación de efectivo insuficiente
- Validación de totales en pago mixto

**Venta Crédito** ✅
- Creación de venta a crédito con cuenta por cobrar
- Validación de cliente requerido
- Validación de cliente existente

**Validación de Stock** 🔨
- Rechazo de venta con stock insuficiente
- Rechazo de venta con producto agotado
- Actualización de stock después de venta exitosa

**Ventas Multi-item** ✅
- Venta con múltiples productos
- Cálculo correcto de subtotales y totales

#### Devoluciones (devoluciones.routes.test.js)

**Creación de Devolución** 🔨
- Devolución parcial de un ítem
- Devolución total de todos los ítems
- Restauración de stock después de devolución
- Actualización de estado de venta

**Validaciones** 🔨
- Rechazo de devolución con ID de venta inválido
- Rechazo de devolución sin ítems
- Rechazo de devolución con cantidad excedente

**Control de Acceso** 🔨
- Solo administradores pueden crear devoluciones

#### Cierre de Caja (cierrecaja.routes.test.js)

**Resumen Diario** 🔨
- Resumen sin ventas
- Resumen con ventas del día
- Inclusión de abonos en resumen
- Categorización por método de pago

**Cierre de Caja** 🔨
- Cierre y transferencia a DB principal
- Totales por método de pago
- Marcado de abonos como cerrados
- Solo administradores pueden cerrar

**Pagos Mixtos** 🔨
- Manejo correcto en resumen y cierre

#### Cuentas por Cobrar (cuentas-por-cobrar.routes.test.js)

**Listado** 🔨
- Lista de todas las cuentas
- Filtro por estado (Pendiente/Pagado)
- Filtro por cliente

**Abonos (Pagos)** 🔨
- Abono parcial y actualización de saldo
- Pago completo y cambio de estado a "Pagado"
- Múltiples abonos en una cuenta
- Soporte de diferentes métodos de pago
- Validación de monto que excede saldo
- Validación de campos requeridos

**Tracking de Saldos** 🔨
- Detección de cuentas vencidas
- Historial de abonos

## Frontend Tests

### Ejecutar Tests de Frontend

```bash
# Todos los tests de frontend
npm run test:frontend

# En modo watch
npm run test:watch --workspace=frontend

# Con cobertura
npm run test:coverage --workspace=frontend

# Test específico
npm test --workspace=frontend -- Login.test.js
```

### Estructura de Tests Frontend

```
frontend/src/
├── __tests__/
│   ├── Login.test.js                ✅ 8/8 tests passing
│   ├── Ventas.test.js               🔨 Tests implementados
│   ├── CierreCaja.test.js           🔨 Tests implementados
│   └── CuentasPorCobrar.test.js     🔨 Tests implementados
├── mocks/
│   ├── handlers.js                  # MSW handlers para API
│   └── server.js                    # MSW server setup
├── test-utils.js                    # Render helpers con providers
└── setupTests.js                    # Jest + MSW setup
```

### Mock Service Worker (MSW)

Los tests frontend usan MSW para simular las respuestas del backend. Los handlers están en `frontend/src/mocks/handlers.js`:

```javascript
// Ejemplo de handler
rest.post(`${API_URL}/api/ventas`, (req, res, ctx) => {
  const { items, metodo_pago, tipo_venta } = req.body;
  
  // Validar stock
  for (const item of items) {
    const joya = mockJoyas.find(j => j.id === item.id_joya);
    if (joya.stock_actual < item.cantidad) {
      return res(
        ctx.status(400),
        ctx.json({ error: `Stock insuficiente para ${joya.nombre}` })
      );
    }
  }
  
  // Simular venta exitosa
  return res(
    ctx.status(201),
    ctx.json({
      success: true,
      venta: { id: 1, total: 80000, ... }
    })
  );
});
```

### Tests Frontend - Detalles

#### Login (Login.test.js) ✅

- Renderizado del formulario
- Login exitoso con credenciales de admin
- Login exitoso con credenciales de dependiente
- Login fallido con credenciales inválidas
- Validación de campos requeridos
- Redirección después de login
- Logout exitoso
- Persistencia de sesión

#### Ventas (Ventas.test.js) 🔨

- Agregar ítems al carrito
- Remover ítems del carrito
- Venta con efectivo (contado)
- Venta con tarjeta
- Venta con pago mixto
- Venta a crédito (requiere cliente)
- Validación de stock insuficiente

#### Cierre de Caja (CierreCaja.test.js) 🔨

- Ver resumen diario
- Crear cierre de caja
- Solo admin puede cerrar
- Inclusión de abonos en resumen

#### Cuentas por Cobrar (CuentasPorCobrar.test.js) 🔨

- Listar cuentas por cobrar
- Hacer abono a cuenta
- Pago completo actualiza estado

## Ejecutar Todas las Pruebas

```bash
# Desde la raíz del proyecto

# Backend + Frontend
npm run test:backend && npm run test:frontend

# Solo tests POS backend + frontend login
npm run test:pos && npm run test:frontend -- Login.test.js
```

## Cobertura de Pruebas

```bash
# Backend con cobertura
cd backend && npm run test:coverage

# Frontend con cobertura
cd frontend && npm run test:coverage
```

Las métricas de cobertura se generan en:
- `backend/coverage/`
- `frontend/coverage/`

Abrir `coverage/lcov-report/index.html` en el navegador para ver el reporte visual.

## Mocks y Fixtures

### Backend Mocks

#### Supabase Mock (`backend/tests/mocks/supabase.mock.js`)

Simula la base de datos Supabase con una implementación en memoria que soporta:
- Operaciones CRUD (`select`, `insert`, `update`, `delete`)
- Filtros (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `ilike`)
- Ordenamiento (`order`)
- Paginación (`range`, `limit`)
- Conteo (`count`)

#### Fixtures de Datos (`backend/tests/fixtures/data.js`)

Datos de prueba para:
- **usuarios**: admin y dependiente con contraseñas hasheadas
- **joyas**: 6 joyas con diferentes precios y stock
- **clientes**: 1 cliente de prueba
- **ventas**: Inicialmente vacío (se llenan en tests)
- **cuentas_por_cobrar**: Inicialmente vacío
- **abonos**: Inicialmente vacío

### Frontend Mocks

#### MSW Handlers (`frontend/src/mocks/handlers.js`)

Handlers para todos los endpoints de la API:
- Autenticación (login/logout/session)
- Joyas (CRUD + búsqueda)
- Ventas (crear con validación de stock)
- Cuentas por cobrar (listar + abonos)
- Cierre de caja (resumen + cerrar)
- Devoluciones (crear)

#### Mock Data (`frontend/src/test-utils.js`)

Datos de prueba sincronizados con backend fixtures:
- `mockJoyas`: Mismas joyas que en backend
- `mockUsuarios`: Admin y dependiente
- `mockClientes`: Cliente de prueba

## Troubleshooting

### Backend

**Error: "Cannot find module"**
```bash
cd backend && npm install
```

**Tests fallan con errores de autenticación**
- Verifica que los fixtures de usuarios tengan `password_hash` (no `password`)
- Verifica que bcrypt esté instalado
- Los tests deben usar `request.agent(app)` y hacer login real

**Tests de ventas fallan**
- Verifica que las rutas de ventas estén montadas en la app de test
- Verifica que las rutas de auth estén montadas (necesarias para login)
- Verifica que los mocks de Cloudinary y Resend estén activos

### Frontend

**Error: "Cannot resolve 'axios'"**
```bash
cd frontend && npm install
```

**Tests fallan con `act()` warnings**
- Usa `await waitFor()` para operaciones asíncronas
- Usa `await userEvent.click()` para interacciones de usuario
- Envuelve cambios de estado en `act()` si es necesario

**MSW no intercepta requests**
- Verifica que el servidor MSW esté iniciado en `setupTests.js`
- Verifica que los handlers estén registrados correctamente
- Usa `msw.printHandlers()` para debug

**Componente no renderiza en test**
- Verifica que uses `renderWithProviders` de `test-utils.js`
- Verifica que las rutas estén configuradas si el componente usa `useNavigate`

### Ambos

**Build falla**
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

**Tests muy lentos**
- Reduce el número de tests ejecutados en paralelo: `npm test -- --maxWorkers=2`
- Aumenta el timeout en `jest.config.js`: `testTimeout: 20000`

## Mejores Prácticas

### Backend

1. **Usa fixtures consistentes**: Todos los tests deben usar `getFixtures()` para datos limpios
2. **Limpia entre tests**: `beforeEach` debe resetear fixtures y mocks
3. **Autentica correctamente**: Usa `request.agent()` con login real
4. **Mock externo**: Siempre mockea Cloudinary, Resend, y otros servicios externos
5. **Tests independientes**: Cada test debe poder ejecutarse solo

### Frontend

1. **Usa MSW para mocks**: Evita mockear axios directamente
2. **Renderiza con providers**: Usa `renderWithProviders` para AuthContext
3. **Espera operaciones async**: Usa `waitFor`, `findBy*` para elementos que aparecen asíncronamente
4. **Simula interacciones reales**: Usa `userEvent` en lugar de `fireEvent`
5. **Verifica estado visual**: Usa `screen.getByText`, `screen.getByRole` para verificar UI

## Contribuir

Al agregar nuevas features:

1. **Agrega fixtures** si introduces nuevos modelos
2. **Agrega handlers MSW** si introduces nuevos endpoints
3. **Escribe tests** antes de implementar la feature (TDD)
4. **Actualiza esta documentación** si cambias la estructura de tests

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Supertest Documentation](https://github.com/ladjs/supertest)

## Estado Actual del Testing

| Área | Backend | Frontend | Notas |
|------|---------|----------|-------|
| Autenticación | ✅ 24/24 | ✅ 8/8 | Completo y funcional |
| Inventario | ✅ 5/5 | 🔨 | Backend completo, frontend por implementar |
| Ventas | 🔨 19/68 | 🔨 | Tests implementados, algunas rutas necesitan ajustes |
| Devoluciones | 🔨 | 🔨 | Tests implementados, rutas por completar |
| Cierre Caja | 🔨 | 🔨 | Tests implementados, rutas por completar |
| Cuentas Cobrar | 🔨 | 🔨 | Tests implementados, rutas por completar |

**Total**: 56 tests implementados, 37 passing, 19 necesitan ajustes de rutas

Los tests marcados con 🔨 están completamente implementados y sirven como **especificaciones ejecutables** de lo que el sistema debe hacer. Son útiles para:
- Entender los requisitos del sistema
- Guiar la implementación de rutas faltantes
- Validar cambios futuros
- Documentar el comportamiento esperado
