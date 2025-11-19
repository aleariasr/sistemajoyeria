# Sistema de Inventario de Joyería 💎

Sistema completo de control de inventario para joyerías con interfaz gráfica moderna y fácil de usar, diseñado para usuarios no técnicos.

## 📋 Características Principales

- 🔐 **Autenticación y control de acceso**: Sistema de login seguro con dos roles (Administrador y Dependiente)
- 💎 **Gestión de joyas**: CRUD completo con 21 campos de información detallada y códigos únicos
- 🔍 **Búsqueda avanzada**: Filtros combinables por categoría, tipo de metal, precio, stock y estado
- 📦 **Control de inventario**: Registro de movimientos (entrada/salida/ajuste) con historial completo
- 💰 **Sistema de ventas**: Múltiples métodos de pago (efectivo, tarjeta, transferencia, mixto, crédito)
- 💳 **Cuentas por cobrar**: Gestión de ventas a crédito con registro de abonos
- 📊 **Reportes y cierre de caja**: Reportes financieros completos con exportación a CSV
- ⚠️ **Alertas**: Notificaciones visuales para productos con stock bajo o agotado
- 🎨 **Interfaz moderna**: Diseño responsive con paleta de colores profesional

## 🗄️ Modelo de Datos

### Tablas Principales

**usuarios** - Gestión de usuarios del sistema
- Campos: id, username, password_hash, role, full_name, fecha_creacion
- Roles: administrador, dependiente

**joyas** - Inventario de productos
- 21 campos incluyendo: código único, nombre, descripción, categoría, tipo de metal, peso, precio, stock, ubicación
- Validación de códigos únicos y stock mínimo

**ventas** - Registro de transacciones
- Soporte para múltiples métodos de pago (efectivo, tarjeta, transferencia, mixto)
- Ventas de contado y a crédito

**cuentas_por_cobrar** - Control de créditos
- Gestión de saldos pendientes
- Registro de abonos por método de pago

**movimientos_inventario** - Historial de cambios
- Registro de entradas, salidas y ajustes
- Trazabilidad completa de stock

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js (versión 14 o superior)
- npm (incluido con Node.js)

### Instalación Rápida

1. **Clonar e instalar dependencias**
```bash
git clone <url-del-repositorio>
cd sistemajoyeria

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

2. **Ejecutar el sistema**
```bash
# Terminal 1 - Backend (http://localhost:3001)
cd backend && npm start

# Terminal 2 - Frontend (http://localhost:3000)
cd frontend && npm start
```

**Usuarios por defecto:**
- Administrador: `admin` / `admin123`
- Dependiente: `dependiente` / `dependiente123`

⚠️ **Cambiar contraseñas antes de usar en producción**

### Datos de Ejemplo (Opcional)
```bash
cd backend
node load-sample-data.js
```

## 📝 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/session` - Verificar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios (Solo Administradores)
- `GET /api/auth` - Listar usuarios
- `POST /api/auth` - Crear usuario
- `PUT /api/auth/:id` - Actualizar usuario
- `DELETE /api/auth/:id` - Eliminar usuario

### Joyas
- `GET /api/joyas` - Listar con filtros y paginación
- `GET /api/joyas/:id` - Obtener detalle
- `POST /api/joyas` - Crear joya
- `PUT /api/joyas/:id` - Actualizar joya
- `DELETE /api/joyas/:id` - Eliminar joya
- `GET /api/joyas/stock-bajo` - Alertas de stock

### Ventas y Caja
- `POST /api/ventas` - Registrar venta (contado o crédito)
- `GET /api/ventas` - Historial de ventas
- `GET /api/cierrecaja/resumen-dia` - Resumen del día
- `POST /api/cierrecaja/cerrar-caja` - Procesar cierre

### Cuentas por Cobrar
- `GET /api/cuentas-por-cobrar` - Listar cuentas
- `POST /api/cuentas-por-cobrar/:id/abonos` - Registrar pago

### Reportes
- `GET /api/reportes/inventario` - Inventario completo
- `GET /api/reportes/stock-bajo` - Productos con stock bajo
- `GET /api/reportes/movimientos-financieros` - Reporte financiero
- `GET /api/reportes/historial-completo` - Historial unificado

## 🎨 Interfaz de Usuario

### Secciones Principales

**Acceso para todos los usuarios:**

1. **Nueva Venta**
   - Búsqueda de productos en tiempo real
   - Carrito de compras
   - Registro de ventas

2. **Historial de Ventas**
   - Listado completo de ventas
   - Detalle de cada venta
   - Información del vendedor

**Solo para Administradores:**

3. **Inventario**
   - Listado completo de joyas
   - Búsqueda y filtros avanzados
   - Acciones: Ver, Editar, Eliminar
   - Resaltado de alertas de stock

4. **Nueva Joya**
   - Formulario completo con todos los campos
   - Validaciones en tiempo real
   - Mensajes de error claros

5. **Movimientos**
   - Registro de entrada/salida/ajuste
   - Búsqueda de joyas en tiempo real
   - Historial completo de movimientos

6. **Stock Bajo**
   - Vista dedicada a alertas
   - Estadísticas de unidades faltantes
   - Acceso rápido a registro de entradas

7. **Reportes**
   - Reporte de inventario actual
   - Reporte de stock bajo
   - Exportación a CSV

8. **Usuarios**
   - Listado de usuarios del sistema
   - Crear nuevos usuarios
   - Editar y eliminar usuarios
   - Asignación de roles

### Paleta de Colores
- **Principal**: Azul marino (#1a237e)
- **Acento**: Dorado (#d4af37)
- **Éxito**: Verde (#2e7d32)
- **Advertencia**: Naranja (#f57c00)
- **Error**: Rojo (#c62828)
- **Fondo**: Gris claro (#f5f5f5)

## 🔒 Seguridad

- ✅ Sistema de autenticación con sesiones
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Control de acceso basado en roles
- ✅ Protección contra CSRF con cookies de sesión
- ✅ Validaciones en backend y frontend
- ✅ Prevención de inyección SQL (uso de parámetros preparados)
- ✅ Validación de códigos únicos
- ✅ Manejo de errores robusto
- ✅ Validación de stock (no permite valores negativos)

## 🛠️ Tecnologías

**Backend:** Node.js, Express, SQLite3, bcryptjs, express-session  
**Frontend:** React 18, React Router 6, Axios, CSS3  
**Seguridad:** Autenticación con sesiones, encriptación bcrypt, parámetros preparados SQL

## 🗄️ Gestión de Base de Datos

### Inicio con Base de Datos Limpia
```bash
cd backend && npm start
```
**Usuarios iniciales:** admin/admin123 y dependiente/dependiente123

### Backup y Restauración
```bash
# Backup
cp backend/joyeria.db backend/joyeria.db.backup
cp backend/ventas_dia.db backend/ventas_dia.db.backup

# Restaurar
cp backend/joyeria.db.backup backend/joyeria.db
cp backend/ventas_dia.db.backup backend/ventas_dia.db

# Reiniciar desde cero
rm backend/joyeria.db backend/ventas_dia.db
npm start
```

## 🐛 Solución de Problemas

**El backend no inicia**: Verificar puerto 3001 disponible y dependencias instaladas

**Frontend no conecta**: Verificar que backend esté corriendo en http://localhost:3001

**Error de base de datos**: Eliminar archivos .db y reiniciar el servidor

**Aplicación lenta**: Verificar cantidad de datos. Para producción considerar PostgreSQL/MySQL

**Datos de ejemplo no aparecen**: Ejecutar manualmente `node load-sample-data.js`

## 📄 Licencia

MIT License - Libre para uso personal y comercial

---

**Sistema desarrollado para gestión de inventarios de joyerías**  
Para más detalles, consultar el CHANGELOG.md