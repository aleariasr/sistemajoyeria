# Sistema de Inventario de Joyería 💎

Sistema completo de control de inventario para joyerías con interfaz gráfica moderna, bonita y fácil de usar, diseñado para usuarios no técnicos.

## 📋 Características

### Gestión de Joyas (CRUD Completo)
- ✅ Crear, leer, actualizar y eliminar joyas
- ✅ Validaciones completas de datos
- ✅ Códigos únicos por joya
- ✅ Gestión de 21 campos de información detallada

### Búsqueda y Filtros Avanzados
- 🔍 Búsqueda rápida por código, nombre, descripción, categoría, tipo de metal y proveedor
- 🎯 Filtros combinables: categoría, tipo de metal, rango de precios, stock bajo, sin stock, estado
- 📊 Paginación automática (20 registros por página)

### Gestión de Inventario
- 📦 Registro de movimientos: Entrada, Salida, Ajuste
- 📈 Historial completo de movimientos
- ✅ Validación de stock (no permite valores negativos)
- 👤 Registro de usuario responsable

### Alertas de Stock
- ⚠️ Resaltado visual de joyas con stock bajo
- 🔴 Identificación de joyas agotadas
- 📊 Vista específica de alertas de inventario

### Reportes
- 📋 Reporte de inventario actual completo
- ⚠️ Reporte de stock bajo
- 📥 Exportación a CSV/Excel
- 💰 Cálculo de valores totales

### Interfaz Moderna
- 🎨 Diseño elegante con paleta de colores profesional
- 📱 Responsive (adaptable a diferentes pantallas)
- 💡 Iconos intuitivos
- ✨ Mensajes de confirmación y error claros
- 🔄 Loaders durante operaciones

## 🏗️ Arquitectura del Proyecto

```
sistemajoyeria/
├── backend/                 # Servidor Node.js + Express
│   ├── models/             # Modelos de datos
│   │   ├── Joya.js
│   │   └── MovimientoInventario.js
│   ├── routes/             # Rutas de la API
│   │   ├── joyas.js
│   │   ├── movimientos.js
│   │   └── reportes.js
│   ├── database.js         # Configuración de SQLite
│   ├── seed.js             # Datos de ejemplo
│   ├── server.js           # Servidor principal
│   └── package.json
│
├── frontend/               # Aplicación React
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   │   ├── ListadoJoyas.js
│   │   │   ├── FormularioJoya.js
│   │   │   ├── DetalleJoya.js
│   │   │   ├── Movimientos.js
│   │   │   ├── StockBajo.js
│   │   │   └── Reportes.js
│   │   ├── services/       # Servicios API
│   │   │   └── api.js
│   │   ├── styles/         # Estilos CSS
│   │   │   └── App.css
│   │   ├── App.js          # Componente principal
│   │   └── index.js        # Punto de entrada
│   └── package.json
│
└── README.md
```

## 🗄️ Modelo de Datos

### Tabla: joyas
Contiene toda la información de las joyas del inventario:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único autoincremental |
| codigo | TEXT | Código único (ej: AN-0001) |
| nombre | TEXT | Nombre de la joya |
| descripcion | TEXT | Descripción detallada |
| categoria | TEXT | Anillo, Aretes, Collar, etc. |
| tipo_metal | TEXT | Oro 10k, 14k, 18k, Plata 925, etc. |
| color_metal | TEXT | dorado, plateado, rosado, etc. |
| piedras | TEXT | circonia, diamante, perla, etc. |
| peso_gramos | REAL | Peso en gramos |
| talla | TEXT | Talla o medida |
| coleccion | TEXT | Nombre de la colección |
| proveedor | TEXT | Nombre del proveedor |
| costo | REAL | Costo de compra |
| precio_venta | REAL | Precio de venta |
| moneda | TEXT | CRC o USD |
| stock_actual | INTEGER | Cantidad disponible |
| stock_minimo | INTEGER | Umbral de alerta |
| ubicacion | TEXT | Ubicación física |
| estado | TEXT | Activo, Descontinuado, Agotado |
| fecha_creacion | DATETIME | Fecha de creación |
| fecha_ultima_modificacion | DATETIME | Última modificación |

### Tabla: movimientos_inventario
Registra todos los movimientos de inventario:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único autoincremental |
| id_joya | INTEGER | Relación con tabla joyas |
| tipo_movimiento | TEXT | Entrada, Salida, Ajuste |
| cantidad | INTEGER | Cantidad del movimiento |
| motivo | TEXT | Razón del movimiento |
| fecha_movimiento | DATETIME | Fecha del movimiento |
| usuario | TEXT | Usuario que realizó el movimiento |
| stock_antes | INTEGER | Stock antes del movimiento |
| stock_despues | INTEGER | Stock después del movimiento |

## 🚀 Instalación y Ejecución

### Requisitos Previos
- Node.js (versión 14 o superior)
- npm (viene con Node.js)

### Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd sistemajoyeria
```

2. **Instalar dependencias del backend**
```bash
cd backend
npm install
```

3. **Instalar dependencias del frontend**
```bash
cd ../frontend
npm install
```

### Ejecución

#### Opción 1: Ejecución Manual (Recomendada para Desarrollo)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
El servidor backend estará disponible en: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
La aplicación frontend se abrirá automáticamente en: `http://localhost:3000`

#### Opción 2: Ejecución con nodemon (desarrollo)

**Backend con auto-reload:**
```bash
cd backend
npm run dev
```

### Datos de Ejemplo (Opcional)

Por defecto, el sistema inicia con una base de datos vacía y lista para producción.

Si deseas cargar datos de ejemplo para pruebas o desarrollo, ejecuta:

```bash
cd backend
node load-sample-data.js
```

Los datos de ejemplo incluyen 10 joyas:
- Anillos de oro y plata
- Aretes con perlas
- Collares de oro
- Pulseras
- Dijes
- Relojes
- Sets de joyería

**Nota**: Los datos de ejemplo solo se cargarán si la base de datos está vacía.

## 📝 API Endpoints

### Sistema
- `GET /` - Información de la API y endpoints disponibles
- `GET /health` - Estado del servidor

### Joyas
- `GET /api/joyas` - Obtener todas las joyas (con filtros y paginación)
- `GET /api/joyas/:id` - Obtener una joya específica
- `POST /api/joyas` - Crear nueva joya
- `PUT /api/joyas/:id` - Actualizar joya
- `DELETE /api/joyas/:id` - Eliminar joya (marca como descontinuada)
- `GET /api/joyas/categorias` - Obtener categorías únicas
- `GET /api/joyas/tipos-metal` - Obtener tipos de metal únicos
- `GET /api/joyas/stock-bajo` - Obtener joyas con stock bajo

### Movimientos
- `GET /api/movimientos` - Obtener movimientos (con filtros y paginación)
- `POST /api/movimientos` - Crear nuevo movimiento

### Reportes
- `GET /api/reportes/inventario` - Reporte de inventario completo
- `GET /api/reportes/stock-bajo` - Reporte de stock bajo

## 🎨 Interfaz de Usuario

### Secciones Principales

1. **Inventario**
   - Listado completo de joyas
   - Búsqueda y filtros avanzados
   - Acciones: Ver, Editar, Eliminar
   - Resaltado de alertas de stock

2. **Nueva Joya**
   - Formulario completo con todos los campos
   - Validaciones en tiempo real
   - Mensajes de error claros

3. **Movimientos**
   - Registro de entrada/salida/ajuste
   - Búsqueda de joyas en tiempo real
   - Historial completo de movimientos

4. **Stock Bajo**
   - Vista dedicada a alertas
   - Estadísticas de unidades faltantes
   - Acceso rápido a registro de entradas

5. **Reportes**
   - Reporte de inventario actual
   - Reporte de stock bajo
   - Exportación a CSV

### Paleta de Colores
- **Principal**: Azul marino (#1a237e)
- **Acento**: Dorado (#d4af37)
- **Éxito**: Verde (#2e7d32)
- **Advertencia**: Naranja (#f57c00)
- **Error**: Rojo (#c62828)
- **Fondo**: Gris claro (#f5f5f5)

## 🔒 Seguridad

- ✅ Validaciones en backend y frontend
- ✅ Prevención de inyección SQL (uso de parámetros preparados)
- ✅ Validación de códigos únicos
- ✅ Manejo de errores robusto
- ✅ Validación de stock (no permite valores negativos)

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **SQLite3** - Base de datos
- **CORS** - Manejo de peticiones cross-origin
- **Body-parser** - Parseo de JSON

### Frontend
- **React 18** - Librería de UI
- **React Router 6** - Navegación
- **Axios** - Cliente HTTP
- **CSS3** - Estilos

## 🗄️ Gestión de Base de Datos

### Iniciar con Base de Datos Limpia (Producción)
El sistema está configurado para iniciar con una base de datos vacía, lista para usar en producción:
```bash
cd backend
npm start
```

### Cargar Datos de Ejemplo (Desarrollo/Pruebas)
Si necesitas datos de prueba:
```bash
cd backend
node load-sample-data.js
```

### Limpiar la Base de Datos
Para comenzar desde cero:
```bash
cd backend
rm joyeria.db
npm start
```

### Backup de la Base de Datos
La base de datos se encuentra en: `backend/joyeria.db`

Para hacer un backup:
```bash
cp backend/joyeria.db backend/joyeria.db.backup
```

Para restaurar:
```bash
cp backend/joyeria.db.backup backend/joyeria.db
```

## 📊 Funcionalidades Futuras (Opcionales)

- 🔐 Sistema de autenticación y usuarios
- 📸 Carga de imágenes de joyas
- 📱 Aplicación móvil
- 🖨️ Impresión de etiquetas con códigos de barras
- 📧 Notificaciones por email de stock bajo
- 📈 Gráficos y estadísticas avanzadas
- 💳 Módulo de ventas y facturación
- 👥 Gestión de clientes

## 🐛 Solución de Problemas

### El backend no inicia
- Verificar que el puerto 3001 esté disponible
- Revisar que las dependencias estén instaladas: `npm install`

### El frontend no se conecta al backend
- Verificar que el backend esté corriendo
- Revisar la URL de la API en `frontend/src/services/api.js`

### Error de base de datos
- Si experimentas problemas con la base de datos, elimina el archivo `backend/joyeria.db` y reinicia el backend
- El sistema creará automáticamente una base de datos nueva y limpia

### La aplicación está lenta
- Verifica la cantidad de datos en la base de datos
- Los filtros y búsquedas están optimizados, pero con grandes volúmenes considera agregar índices
- En producción, considera usar PostgreSQL o MySQL en lugar de SQLite

### Datos de ejemplo no aparecen
- El sistema ya NO carga datos de ejemplo automáticamente
- Para cargar datos de prueba: `cd backend && node load-sample-data.js`
- Verifica que no haya errores en la consola del backend

## 📄 Licencia

MIT License - Libre para uso personal y comercial

## 👨‍💻 Autor

Sistema desarrollado para gestión de inventarios de joyerías

---

**¡Listo para usar!** 🚀

Para cualquier duda o problema, consulta la documentación o revisa los logs del backend y frontend.