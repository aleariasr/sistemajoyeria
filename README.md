# Sistema de Inventario de Joyería 💎

Sistema completo de gestión para joyerías con base de datos en la nube, soporte de imágenes y preparado para e-commerce.

## ✨ Versión 2.0 - Actualización Mayor

**🎯 Migrado a Supabase + Cloudinary**
- Base de datos PostgreSQL en la nube (Supabase)
- Imágenes de productos en Cloudinary
- Multi-dispositivo simultáneo
- Preparado para tienda online

## 📋 Características Principales

- 🔐 **Autenticación segura**: Sistema de login con roles (Administrador y Dependiente)
- 💎 **Gestión de joyas**: CRUD completo con soporte de imágenes
- 🖼️ **Imágenes de productos**: Subida y gestión de fotos (Cloudinary)
- 🔍 **Búsqueda avanzada**: Filtros por categoría, precio, stock y estado
- 📦 **Control de inventario**: Registro automático y manual de movimientos
- 💰 **Sistema de ventas**: Múltiples métodos de pago (efectivo, tarjeta, transferencia, mixto, crédito)
- 💳 **Cuentas por cobrar**: Gestión de créditos con registro de abonos
- 📊 **Reportes y cierre de caja**: Reportes financieros completos
- ⚠️ **Alertas de stock**: Notificaciones para productos con stock bajo
- 📱 **Multi-dispositivo**: Usa el sistema desde varios dispositivos simultáneamente
- 🛒 **E-commerce ready**: Preparado para tienda online con reservas de inventario

## 🚀 Inicio Rápido

### 1. Configurar Base de Datos

Ejecuta el SQL en Supabase (una sola vez):
- Abre: https://mvujkbpbqyihixkbzthe.supabase.co
- Ve a SQL Editor
- Ejecuta: `backend/supabase-migration.sql`

### 2. Instalar y Ejecutar

```bash
# Backend
cd backend
npm install
npm start
# Servidor en http://localhost:3001

# Frontend (otra terminal)
cd frontend
npm install
npm start
# App en http://localhost:3000
```

### 3. Login

- **Admin:** `admin` / `admin123`
- **Dependiente:** `dependiente` / `dependiente123`

## 📚 Documentación Completa

**Guía principal:** `backend/GUIA_COMPLETA.md`

Incluye:
- Setup detallado paso a paso
- Configuración multi-dispositivo
- Preparación para e-commerce
- Solución de problemas
- Tests y verificación

**Otros documentos:**
- `backend/AUDITORIA_COMPLETA.md` - Revisión de código completa
- `backend/supabase-migration.sql` - Schema de base de datos
- `CHANGELOG.md` - Historial de cambios

## 🗄️ Estructura del Sistema

### Base de Datos (Supabase/PostgreSQL)

**Tablas Principales:**
- `usuarios` - Control de acceso
- `joyas` - Inventario con imágenes
- `clientes` - Base de clientes
- `ventas` - Transacciones
- `items_venta` - Detalle de ventas
- `cuentas_por_cobrar` - Créditos
- `abonos` - Pagos a créditos
- `movimientos_inventario` - Historial

**Tablas E-commerce:**
- `reservas_inventario` - Carritos online
- `auditoria_inventario` - Trazabilidad completa
- `configuracion_tienda` - Parámetros globales

### Backend (Node.js + Express)

- 10 modelos completamente migrados a Supabase
- 8 rutas API RESTful
- Middleware de autenticación
- Subida de imágenes con Cloudinary
- Control de concurrencia

### Frontend (React)

- Interfaz responsive
- Gestión completa de inventario
- Sistema de ventas
- Reportes y análisis
- Multi-usuario

## 📝 API Endpoints

Ver documentación completa en `backend/GUIA_COMPLETA.md`

Principales endpoints:
- `/api/auth/*` - Autenticación y usuarios
- `/api/joyas/*` - Gestión de inventario (con soporte de imágenes)
- `/api/ventas/*` - Sistema de ventas
- `/api/clientes/*` - Gestión de clientes
- `/api/cuentas-por-cobrar/*` - Créditos y abonos
- `/api/movimientos/*` - Historial de inventario
- `/api/reportes/*` - Reportes y análisis
- `/api/cierrecaja/*` - Cierre de caja

## 🛠️ Tecnologías

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- Cloudinary (imágenes)
- bcryptjs (seguridad)
- Multer (uploads)

**Frontend:**
- React 18
- React Router
- Axios
- CSS moderno

## 🧪 Testing

```bash
cd backend/tests
node comprehensive-test.js
```

## 🔒 Seguridad

- ✅ Autenticación con sesiones
- ✅ Contraseñas encriptadas (bcrypt)
- ✅ Control de acceso por roles
- ✅ Validaciones en backend y frontend
- ✅ Manejo seguro de imágenes
- ✅ Control de concurrencia en inventario
- ✅ Auditoría completa de cambios

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 🤝 Contribuir

Ver `CHANGELOG.md` para historial de cambios.

---

**Versión:** 2.0  
**Estado:** ✅ Producción Ready  
**Base de datos:** Supabase (PostgreSQL)  
**Última actualización:** 2025-11-21
