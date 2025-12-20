# Variantes de Producto - Product Variants System

## 📋 Descripción

Sistema para gestionar productos con múltiples diseños visuales que comparten el mismo precio y stock. Ideal para joyas con diferentes estilos pero características idénticas.

## 🎯 Caso de Uso

**Ejemplo: Aretes Premium**
- Un grupo de aretes tiene 15 diseños diferentes
- Todos cuestan ₡15,000
- Comparten un stock común de 30 unidades
- En el storefront, cada diseño aparece como un "producto individual" con su propia foto
- Al comprar cualquier diseño, se descuenta del inventario compartido del grupo

## 🗄️ Base de Datos

### Tabla: `variantes_producto`

```sql
CREATE TABLE variantes_producto (
  id SERIAL PRIMARY KEY,
  id_producto_padre INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  nombre_variante VARCHAR(200) NOT NULL,
  descripcion_variante TEXT,
  imagen_url TEXT NOT NULL,
  orden_display INTEGER DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Campo en `joyas`: `es_producto_variante`

Indica si un producto tiene variantes asociadas.

## 📡 API Endpoints

### POS (Requiere Autenticación)

```
POST   /api/variantes                    # Crear variante
GET    /api/variantes/:id                # Obtener variante
PUT    /api/variantes/:id                # Actualizar variante
DELETE /api/variantes/:id                # Eliminar variante
GET    /api/variantes/producto/:id       # Listar variantes de un producto
POST   /api/variantes/reordenar           # Cambiar orden de display
```

### Storefront (Público)

```
GET /api/public/products                 # Expande variantes como productos individuales
GET /api/public/products/:id             # Incluye lista de variantes si aplica
```

## 🔧 Uso desde el POS

### 1. Crear Producto con Variantes

```javascript
// 1. Crear producto padre
const producto = await api.post('/api/joyas', {
  codigo: 'ARET-PREM',
  nombre: 'Aretes Premium',
  precio_venta: 15000,
  stock_actual: 30,
  es_producto_variante: true // Marcar como producto con variantes
});

// 2. Agregar variantes
await api.post('/api/variantes', {
  id_producto_padre: producto.id,
  nombre_variante: 'Diseño Corazón',
  descripcion_variante: 'Aretes con dije de corazón',
  imagen_url: 'https://res.cloudinary.com/...', // URL de Cloudinary
  orden_display: 0
});

await api.post('/api/variantes', {
  id_producto_padre: producto.id,
  nombre_variante: 'Diseño Estrella',
  descripcion_variante: 'Aretes con dije de estrella',
  imagen_url: 'https://res.cloudinary.com/...',
  orden_display: 1
});
```

### 2. Listar Variantes

```javascript
const response = await api.get(`/api/variantes/producto/${productoId}`);
const variantes = response.data.data;

console.log(`Producto tiene ${variantes.length} variantes`);
```

### 3. Actualizar Variante

```javascript
await api.put(`/api/variantes/${varianteId}`, {
  nombre_variante: 'Diseño Corazón Actualizado',
  activo: true
});
```

### 4. Reordenar Variantes (Drag & Drop)

```javascript
await api.post('/api/variantes/reordenar', {
  ordenes: [
    { id: 1, orden_display: 0 },
    { id: 2, orden_display: 1 },
    { id: 3, orden_display: 2 }
  ]
});
```

## 🛒 Comportamiento en Storefront

### Expansión de Variantes

Cuando un cliente visita el storefront:

1. **Lista de Productos**: Cada variante aparece como un producto individual
   - Nombre: "Aretes Premium - Diseño Corazón"
   - Precio: ₡15,000 (del producto padre)
   - Stock: 30 unidades (del producto padre)
   - Imagen: URL específica de la variante

2. **Detalle de Producto**: Muestra selector de variantes
   - Grid de thumbnails de todas las variantes
   - Al seleccionar, cambia la imagen principal
   - URL: `/product/{id_padre}?variante={id_variante}`

### Venta de Variantes

```javascript
// Cliente agrega variante al carrito
const item = {
  product_id: 123,      // ID del producto padre
  variante_id: 456,     // ID de la variante específica
  quantity: 2
};

// Al confirmar pedido:
// - Se valida stock del producto padre (30 unidades)
// - Se descuenta 2 del stock del padre
// - Stock restante: 28 unidades
// - Todas las variantes muestran ahora: "28 disponibles"
```

## 📊 Lógica de Stock

### Regla Principal
**El stock se gestiona ÚNICAMENTE en el producto padre.**

- ✅ Stock padre = 30 → Todas las variantes muestran 30 disponibles
- ✅ Venta de 5 de cualquier variante → Stock padre = 25
- ✅ Si stock padre = 0 → Todas las variantes se ocultan automáticamente

### Validaciones

1. **Límite de Variantes**: Máximo 100 por producto
2. **Imágenes**: Solo URLs de Cloudinary (seguridad)
3. **Eliminación**: No permitir eliminar producto padre si tiene variantes activas
4. **Stock**: Al agregar al carrito, validar stock del padre

## 🎨 Componentes Frontend

### VariantesManager.js

Componente para gestionar variantes desde el POS:

```jsx
<VariantesManager
  productoId={123}
  onVarianteCreated={(variante) => console.log('Nueva variante:', variante)}
  onVarianteUpdated={(variante) => console.log('Variante actualizada:', variante)}
/>
```

Características:
- Modal para agregar/editar variantes
- Lista con drag & drop para reordenar
- Thumbnails de imágenes
- Toggle activo/inactivo
- Botones editar/eliminar

## 🔒 Seguridad

- ✅ Todas las rutas de gestión requieren autenticación
- ✅ Validación de URLs de imágenes (solo Cloudinary)
- ✅ Sanitización de inputs
- ✅ Rate limiting en endpoints públicos
- ✅ SQL injection protection (prepared statements de Supabase)

## 📝 Notas Importantes

1. **Producto Padre No Visible**: Si `es_producto_variante = true`, el producto padre NO aparece en storefront, solo sus variantes

2. **Orden de Display**: Las variantes se ordenan por `orden_display` ASC, luego por `created_at` ASC

3. **Variantes Inactivas**: Solo se muestran en el POS. No aparecen en storefront.

4. **Stock Compartido**: NUNCA modificar stock de variantes. Solo del padre.

5. **Imágenes**: Siempre usar Cloudinary. Validación obligatoria.

## 🧪 Testing

### Escenarios de Prueba

1. ✅ Crear producto con 10 variantes
2. ✅ Vender variante A, verificar stock padre decrementó
3. ✅ Reordenar variantes con drag & drop
4. ✅ Desactivar variante, verificar que no aparece en storefront
5. ✅ Stock padre = 0, verificar todas las variantes ocultas
6. ✅ Intentar agregar variante 101 (debe fallar por límite)

## 🚀 Deployment

1. Ejecutar migración SQL: `backend/migrations/add-variantes-compuestos-notifications.sql`
2. Verificar columna `es_producto_variante` agregada a `joyas`
3. Verificar tabla `variantes_producto` creada
4. Reiniciar backend
5. Probar creación de variante desde POS

## 📚 Referencias

- Modelo: `backend/models/VarianteProducto.js`
- Rutas: `backend/routes/variantes.js`
- API Pública: `backend/routes/public.js`
- Componente: `frontend/src/components/VariantesManager.js`
