# Sistema de Inventario para Joyería

Sistema completo de gestión de inventario para joyería con backend Node.js/Express, frontend React, y base de datos SQLite.

## 🌟 Características

### Gestión de Joyas
- ✅ **CRUD Completo**: Crear, leer, actualizar y eliminar joyas
- ✅ **Código único** para cada pieza
- ✅ **Información detallada**: nombre, descripción, categoría, metal, piedras, talla, precio venta, costo, stock actual y mínimo, ubicación, estado
- ✅ **Múltiples piedras** por joya con cantidad

### Búsqueda y Filtros
- ✅ **Búsqueda avanzada** por código, nombre o descripción
- ✅ **Filtros** por categoría, metal, estado
- ✅ **Filtro especial** para joyas con stock bajo

### Gestión de Inventario
- ✅ **Alertas automáticas** de stock bajo
- ✅ **Historial completo** de movimientos (entradas/salidas/ajustes)
- ✅ **Ajustes de stock** con razón y usuario
- ✅ **Trazabilidad completa** de cada movimiento

### Reportes y Dashboard
- ✅ **Dashboard** con estadísticas en tiempo real
- ✅ **Gráficos interactivos** (distribución por categoría, valor por categoría)
- ✅ **Reportes detallados** del inventario
- ✅ **Visualización del valor total** del inventario

### Configuración
- ✅ **Gestión de categorías** (Anillos, Collares, Pulseras, Aretes, Relojes)
- ✅ **Gestión de metales** (Oro 18K, 14K, Plata 925, Platino, etc.)
- ✅ **Gestión de piedras** (Diamante, Esmeralda, Rubí, Zafiro, etc.)

### Interfaz
- ✅ **Diseño moderno y elegante** con Material-UI
- ✅ **Tema personalizado** con colores de joyería (marrón y dorado)
- ✅ **Responsive** - funciona en móviles, tablets y desktop
- ✅ **Navegación intuitiva** con sidebar

## 🚀 Instalación

### Prerrequisitos
- Node.js 14+ 
- npm o yarn

### Backend

```bash
cd backend
npm install
npm start
```

El servidor estará disponible en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## 📁 Estructura del Proyecto

```
sistemajoyeria/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuración y esquema de BD
│   ├── src/
│   │   ├── controllers/         # Controladores de API
│   │   │   ├── jewelryController.js
│   │   │   ├── categoryController.js
│   │   │   ├── metalController.js
│   │   │   └── stoneController.js
│   │   ├── models/              # Modelos de datos
│   │   │   ├── Jewelry.js
│   │   │   ├── Category.js
│   │   │   ├── Metal.js
│   │   │   └── Stone.js
│   │   └── routes/              # Rutas de API
│   │       ├── jewelry.js
│   │       ├── categories.js
│   │       ├── metals.js
│   │       └── stones.js
│   ├── server.js                # Servidor Express
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   └── Layout.js
│   │   ├── pages/               # Páginas
│   │   │   ├── Dashboard.js
│   │   │   ├── JewelryList.js
│   │   │   ├── JewelryForm.js
│   │   │   ├── InventoryMovements.js
│   │   │   ├── Reports.js
│   │   │   └── Settings.js
│   │   ├── services/            # Servicios de API
│   │   │   └── api.js
│   │   └── App.js               # Componente principal
│   └── package.json
├── database/
│   └── joyeria.db              # Base de datos SQLite (se crea automáticamente)
└── README.md
```

## 🗄️ Esquema de Base de Datos

### Tablas principales:

- **jewelry**: Información de joyas
- **categories**: Categorías de joyas
- **metals**: Tipos de metales
- **stones**: Piedras preciosas
- **jewelry_stones**: Relación muchos a muchos entre joyas y piedras
- **inventory_movements**: Historial de movimientos de inventario

## 🔌 API Endpoints

### Joyas
- `GET /api/jewelry` - Obtener todas las joyas (con filtros)
- `GET /api/jewelry/:id` - Obtener una joya
- `POST /api/jewelry` - Crear joya
- `PUT /api/jewelry/:id` - Actualizar joya
- `DELETE /api/jewelry/:id` - Eliminar joya
- `GET /api/jewelry/stats` - Obtener estadísticas
- `GET /api/jewelry/low-stock` - Obtener joyas con stock bajo
- `POST /api/jewelry/:id/adjust-stock` - Ajustar stock
- `GET /api/jewelry/movements` - Obtener historial de movimientos

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría
- `PUT /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Metales
- `GET /api/metals` - Listar metales
- `POST /api/metals` - Crear metal
- `PUT /api/metals/:id` - Actualizar metal
- `DELETE /api/metals/:id` - Eliminar metal

### Piedras
- `GET /api/stones` - Listar piedras
- `POST /api/stones` - Crear piedra
- `PUT /api/stones/:id` - Actualizar piedra
- `DELETE /api/stones/:id` - Eliminar piedra

## 💡 Uso

### 1. Dashboard
- Vista general del inventario
- Estadísticas principales (total joyas, valor, stock bajo, unidades totales)
- Alertas de stock bajo
- Movimientos recientes
- Acciones rápidas

### 2. Inventario
- Lista completa de joyas
- Búsqueda y filtros avanzados
- Editar, eliminar y ajustar stock
- Indicadores visuales de estado de stock

### 3. Nueva Joya / Editar
- Formulario completo con todas las propiedades
- Selección de categoría y metal
- Agregar múltiples piedras
- Definir precios y stock
- Ubicación y estado

### 4. Movimientos
- Historial completo de entradas, salidas y ajustes
- Información detallada de cada movimiento
- Trazabilidad por usuario y fecha

### 5. Reportes
- Estadísticas generales
- Gráficos de distribución por categoría
- Gráficos de valor por categoría
- Tabla detallada del inventario
- Opciones de exportación (en desarrollo)

### 6. Configuración
- Gestión de categorías
- Gestión de metales
- Gestión de piedras preciosas

## 🎨 Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- SQLite3
- CORS
- Body-parser

### Frontend
- React 18
- React Router DOM
- Material-UI (MUI)
- Axios
- Recharts (gráficos)
- Emotion (CSS-in-JS)

## 🔒 Seguridad

- Validación de datos en backend
- Manejo de errores robusto
- Consultas parametrizadas para prevenir SQL injection
- CORS configurado

## 🚧 Desarrollo Futuro

- [ ] Autenticación y autorización de usuarios
- [ ] Exportación real a PDF y Excel
- [ ] Imágenes de productos
- [ ] Sistema de ventas integrado
- [ ] Códigos de barras / QR
- [ ] Backup automático de base de datos
- [ ] Notificaciones por email para stock bajo
- [ ] Multi-idioma
- [ ] API REST documentada con Swagger

## 📝 Licencia

ISC

## 👥 Autor

Sistema desarrollado para gestión profesional de inventario de joyería.