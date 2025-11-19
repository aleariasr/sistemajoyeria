# Changelog

## [3.0.0] - 2025-11-19 - Pagos Mixtos y Correcciones de Zona Horaria

### 🎯 Cambios Principales
- Sistema completo de pagos mixtos implementado
- Corrección crítica de zona horaria (Costa Rica UTC-6)
- Permitir cierre de caja con solo abonos
- Sincronización correcta entre ventas a crédito y cierre de caja

### ✨ Agregado
- **Pagos Mixtos**:
  - Interfaz para desglose de efectivo, tarjeta y transferencia
  - Auto-cálculo de montos restantes
  - Cálculo de cambio para componente de efectivo
  - Validación en tiempo real de totales
  - Desglose completo en cierre de caja y reportes

- **Módulo de Zona Horaria**:
  - `backend/utils/timezone.js` para manejo de fechas en Costa Rica
  - Funciones: `obtenerFechaActualCR()`, `obtenerRangoDia()`, `formatearFechaSQL()`
  - Todas las fechas ahora usan zona horaria de Costa Rica (UTC-6)

- **Nuevos Reportes**:
  - `GET /api/reportes/movimientos-financieros` - Reporte completo de ventas y abonos
  - `GET /api/reportes/historial-completo` - Historial unificado de todas las transacciones

- **Migraciones de Base de Datos**:
  - Columnas `monto_efectivo`, `monto_tarjeta`, `monto_transferencia` en `ventas` y `ventas_dia`
  - Migración automática al iniciar el servidor

### 🔧 Mejorado
- **Cierre de Caja**:
  - Permite cierre con solo abonos (sin ventas)
  - Muestra ventas mixtas con desglose detallado
  - Totales combinados (ventas + abonos) por método de pago
  - Filtrado correcto de ventas a crédito (no incluidas en cierre de caja del día)

- **Ventas a Crédito**:
  - Van directamente a base de datos principal (no a `ventas_dia`)
  - No se incluyen en totales de cierre de caja
  - Preservación de campos `tipo_venta` y `id_cliente`

- **Abonos**:
  - Ahora aparecen correctamente en cierre de caja
  - Incluidos en totales por método de pago
  - Desglose separado de ventas

- **Formato de Fechas**:
  - Frontend muestra fechas con `timeZone: 'America/Costa_Rica'`
  - Backend usa funciones de zona horaria para todas las fechas
  - Consistencia entre base de datos y reportes

### 🐛 Corregido
- **Problema Crítico**: Abonos no aparecían en cierre de caja debido a desajuste de zona horaria
- **Problema**: Ventas a crédito se incluían incorrectamente en cierre de caja
- **Problema**: Pagos mixtos no se integraban con ventas ni cierre de caja
- **Problema**: Pérdida de datos (`tipo_venta`, `id_cliente`) durante transferencia en cierre de caja
- **Problema**: No se podía cerrar caja con solo abonos (sin ventas del día)

### 🔒 Seguridad
- CodeQL scan: **0 vulnerabilidades**
- Validación de pagos mixtos (suma debe coincidir con total)
- Mantiene todos los estándares de seguridad previos

### 🧪 Testing
- Suite completa de pruebas E2E ejecutada exitosamente
- Pruebas de validación de casos borde
- Verificación de integridad de datos
- Todos los flujos de negocio validados
- Stock y cálculos financieros verificados

## [2.0.0] - 2025-11-17 - Autenticación y Gestión de Usuarios

### 🎯 Cambios Principales
- Sistema de autenticación completo implementado
- Gestión de usuarios para administradores
- Control de acceso basado en roles
- Sistema listo para producción con seguridad mejorada

### ✨ Agregado
- **Autenticación y Sesiones**:
  - Login con validación de credenciales
  - Sesiones seguras con cookies HTTP-only
  - Logout con destrucción de sesión
  - Verificación de sesión activa
  
- **Gestión de Usuarios**:
  - Componente Usuarios.js para listar usuarios
  - Componente FormularioUsuario.js para crear/editar
  - Rutas protegidas para administradores
  - Modelo Usuario.js con métodos CRUD
  - Encriptación de contraseñas con bcrypt
  
- **Control de Acceso**:
  - Dos roles: Administrador y Dependiente
  - AuthContext para gestión de estado de autenticación
  - Protección de rutas según rol
  - Menú dinámico según permisos
  
- **Backend**:
  - Tabla usuarios en base de datos
  - Rutas de autenticación en `/api/auth`
  - Middleware de sesiones con express-session
  - Usuarios iniciales creados automáticamente
  - CORS configurado con credenciales

### 🔧 Mejorado
- Servicio API configurado con `withCredentials: true`
- CORS del backend con origin específico y credentials
- Protección contra eliminación del propio usuario
- Validación de contraseñas (mínimo 6 caracteres)
- Mensajes de error más descriptivos
- Documentación completa actualizada

### 🗑️ Eliminado
- Archivo `seed.js` obsoleto (reemplazado por load-sample-data.js)
- Archivo `package-lock.json` vacío en la raíz

### 🔒 Seguridad
- CodeQL scan: **0 vulnerabilidades**
- Encriptación de contraseñas con bcrypt (10 rounds)
- Sesiones HTTP-only para prevenir XSS
- Protección CSRF con cookies de sesión
- Validación de roles en backend
- Control de acceso a rutas protegidas

### 📝 Documentación
- README actualizado con sección de autenticación
- Tabla de usuarios agregada al modelo de datos
- Endpoints de autenticación documentados
- Arquitectura actualizada con nuevos componentes
- Sección de seguridad ampliada
- Instrucciones de usuarios por defecto

### 🧪 Testing
- Login exitoso con credenciales válidas
- Creación de nuevos usuarios
- Edición de usuarios existentes
- Eliminación de usuarios (excepto propio usuario)
- Verificación de sesión persistente
- Acceso denegado a dependientes en rutas administrativas
- Frontend sin advertencias de React

## [1.0.0] - 2025-11-17 - Versión de Producción

### 🎯 Cambios Principales
- Sistema listo para producción sin datos de prueba automáticos
- Base de datos limpia al iniciar por defecto
- Mejoras significativas en validación y seguridad
- Build de frontend optimizado y sin advertencias

### ✨ Agregado
- Script `load-sample-data.js` para cargar datos de ejemplo opcionalmente
- Utilidades de validación en `backend/utils/validaciones.js`
- Endpoint `/health` para monitoreo del servidor
- Endpoint raíz `/` con información de la API
- Archivos `.env.example` para configuración de backend y frontend
- Interceptor de errores en el servicio API del frontend
- Logging de peticiones en modo desarrollo
- Manejo de cierre graceful del servidor (SIGTERM)
- Sección de despliegue en producción en README
- Sección de gestión de base de datos en README
- Mejores mensajes de error y validación
- CHANGELOG.md para documentar cambios

### 🔧 Mejorado
- Validación de entrada de datos más robusta con funciones especializadas
- Manejo de errores en servidor con diferenciación por ambiente
- Validación de códigos con formato específico (letras, números, guiones)
- Validación de monedas, estados y tipos de movimiento
- Mensajes de error más descriptivos en validaciones
- Documentación más clara sobre uso en producción vs desarrollo
- Límites de tamaño para peticiones JSON (10mb)
- React Hooks con useCallback para evitar advertencias de ESLint
- Frontend compila sin errores ni advertencias

### 🗑️ Eliminado
- Script `clear-db.js` que no funcionaba correctamente
- Comando `npm run clear-db` de package.json
- Carga automática de datos de prueba al iniciar el servidor

### 🔒 Seguridad
- Sin vulnerabilidades detectadas por CodeQL
- Validación de entrada mejorada en todos los endpoints
- Sanitización de strings de entrada
- Validación de tipos de datos numéricos y enteros

## [0.1.0] - 2025-11-13 - Versión Inicial

### Agregado
- Sistema completo de gestión de inventario de joyería
- CRUD completo para joyas
- Gestión de movimientos de inventario
- Sistema de reportes
- Interfaz React moderna y responsive
- API REST con Express y SQLite
- Búsqueda y filtros avanzados
- Alertas de stock bajo
- Exportación de reportes a CSV
