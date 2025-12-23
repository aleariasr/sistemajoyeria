# Productos Compuestos (Sets) - Composite Products System

## 📋 Descripción

Sistema para gestionar productos compuestos (sets) formados por múltiples productos individuales. Permite vender conjuntos completos o piezas sueltas, con inventarios y precios independientes.

## 🎯 Caso de Uso

**Ejemplo: Trio de Pulseras Oro**

- **Set "Trio de Pulseras Oro"**: ₡45,000 (incluye 3 pulseras)
  - Pulsera A individual: ₡18,000 (stock: 10 unidades)
  - Pulsera B individual: ₡18,000 (stock: 5 unidades)  
  - Pulsera C individual: ₡18,000 (stock: 15 unidades)
  
- **Stock del set** = 5 (limitado por la pulsera B, el componente con menos stock)
- **Al vender 1 set**: descuenta 1 de cada pulsera
- **Si pulsera B se agota**: el set muestra "Stock agotado"
- Las pulseras siguen siendo vendibles individualmente

## 🗄️ Base de Datos

### Tabla: `productos_compuestos`

```sql
CREATE TABLE productos_compuestos (
  id SERIAL PRIMARY KEY,
  id_producto_set INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  id_producto_componente INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL DEFAULT 1,
  orden_display INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT no_self_reference CHECK (id_producto_set != id_producto_componente),
  CONSTRAINT unique_component UNIQUE (id_producto_set, id_producto_componente)
);
```

### Campo en `joyas`: `es_producto_compuesto`

Indica si un producto es un set (compuesto por otros productos).

## 📐 Cálculo de Stock

### Fórmula

```javascript
stockSet = MIN(
  stockComponenteA / cantidadRequeridaA,
  stockComponenteB / cantidadRequeridaB,
  stockComponenteC / cantidadRequeridaC
)
```

### Ejemplo

```
Componente A: 10 unidades disponibles, requiere 1 → puede hacer 10 sets
Componente B: 5 unidades disponibles, requiere 1  → puede hacer 5 sets
Componente C: 15 unidades disponibles, requiere 1 → puede hacer 15 sets

Stock del set = MIN(10, 5, 15) = 5 sets disponibles
```

## 📡 API Endpoints

### POS (Requiere Autenticación)

```
POST   /api/productos-compuestos                    # Agregar componente al set
GET    /api/productos-compuestos/set/:id            # Listar componentes del set
DELETE /api/productos-compuestos/:id                # Eliminar componente
PUT    /api/productos-compuestos/:id/cantidad       # Actualizar cantidad requerida
GET    /api/productos-compuestos/validar-stock/:id  # Validar disponibilidad
```

### Storefront (Público)

```
GET /api/public/products/:id                        # Incluye info de stock del set
GET /api/public/products/:id/componentes            # Obtener componentes con stock
```

## 🔧 Uso desde el POS

### 1. Crear Set

```javascript
// 1. Crear producto set
const set = await api.post('/api/joyas', {
  codigo: 'SET-TRIO-PULS',
  nombre: 'Trio de Pulseras Oro',
  precio_venta: 45000,
  stock_actual: 0, // Stock se calcula automáticamente
  es_producto_compuesto: true
});

// 2. Agregar componentes
await api.post('/api/productos-compuestos', {
  id_producto_set: set.id,
  id_producto_componente: 101, // ID de Pulsera A
  cantidad: 1,
  orden_display: 0
});

await api.post('/api/productos-compuestos', {
  id_producto_set: set.id,
  id_producto_componente: 102, // ID de Pulsera B
  cantidad: 1,
  orden_display: 1
});

await api.post('/api/productos-compuestos', {
  id_producto_set: set.id,
  id_producto_componente: 103, // ID de Pulsera C
  cantidad: 1,
  orden_display: 2
});
```

### 2. Consultar Stock del Set

```javascript
const response = await api.get(`/api/productos-compuestos/validar-stock/${setId}?cantidad=2`);

console.log('Stock disponible:', response.data.data.stock_disponible);
console.log('Suficiente para 2 sets:', response.data.data.suficiente);
```

### 3. Actualizar Cantidad Requerida

```javascript
// Cambiar a 2 pulseras B por set
await api.put(`/api/productos-compuestos/${componenteId}/cantidad`, {
  cantidad: 2
});
```

### 4. Eliminar Componente

```javascript
await api.delete(`/api/productos-compuestos/${componenteId}`);
```

## 🛒 Venta de Sets

### Proceso de Venta

```javascript
// Cliente compra 2 sets
const venta = {
  items: [
    { id_joya: 999, cantidad: 2 } // ID del set
  ]
};

// Backend automáticamente:
// 1. Detecta que es un set (es_producto_compuesto = true)
// 2. Obtiene componentes del set
// 3. Valida stock de cada componente:
//    - Pulsera A: necesita 2, tiene 10 ✅
//    - Pulsera B: necesita 2, tiene 5  ✅
//    - Pulsera C: necesita 2, tiene 15 ✅
// 4. Descuenta stock de cada componente:
//    - Pulsera A: 10 → 8
//    - Pulsera B: 5 → 3
//    - Pulsera C: 15 → 13
// 5. Registra movimiento de inventario por cada componente
// 6. Si falla algún descuento, hace rollback (transacción atómica)
```

### Código Backend (productService.js)

```javascript
async function actualizarStockVenta(itemConJoya, motivo, username) {
  const { joya, cantidad, es_set, componentes } = itemConJoya;

  if (es_set) {
    // Actualizar stock de cada componente
    for (const comp of componentes) {
      const cantidadADescontar = comp.cantidad_requerida * cantidad;
      const producto = comp.producto;
      
      const nuevoStock = producto.stock_actual - cantidadADescontar;
      await Joya.actualizarStock(producto.id, nuevoStock);
      
      // Registrar movimiento
      await MovimientoInventario.crear({
        id_joya: producto.id,
        tipo_movimiento: 'Salida',
        cantidad: cantidadADescontar,
        motivo: `${motivo} (Set: ${joya.nombre})`,
        usuario: username
      });
    }
  }
}
```

## 🌐 Comportamiento en Storefront

### Concepto Fundamental: Set vs Joyas Individuales

**IMPORTANTE:** Los sets y las joyas individuales son productos SEPARADOS en el catálogo:

1. **El SET (Producto Padre)**:
   - Es un producto independiente con su propio ID, código, nombre, precio e imagen
   - Aparece como un producto en el catálogo
   - Tiene su propia página de detalle
   - Su stock se calcula automáticamente basado en los componentes
   - Al comprarlo, se descuenta 1 unidad de cada componente

2. **Las JOYAS INDIVIDUALES (Componentes)**:
   - Son productos independientes que TAMBIÉN aparecen en el catálogo
   - Tienen su propia página de detalle
   - Se pueden comprar por separado
   - Tienen su propio stock individual

3. **La Relación**:
   - El SET "referencia" a las joyas como componentes
   - Las joyas NO pertenecen exclusivamente al set
   - Una joya puede ser componente de múltiples sets

### Detalle de Set

El storefront muestra completamente todos los componentes de un set:

```html
Producto SET (Página de detalle):
┌─────────────────────────────────────────┐
│ [IMAGEN DEL SET]                        │
│ Trio de Pulseras Oro - ₡45,000         │
│ ✅ Disponible (5 sets)                  │
│ [Agregar set completo al carrito]      │
└─────────────────────────────────────────┘

Componentes del set:
┌──────────────────────────────────────────┐
│ 🔍 Piezas que componen este set         │
│                                          │
│ 📿 Pulsera Oro Eslabones                 │
│    ₡18,000 | ✅ 10 disponibles            │
│    [Agregar pieza]                       │
├──────────────────────────────────────────┤
│ 📿 Pulsera Oro Dije Corazón             │
│    ₡18,000 | ✅ 5 disponibles             │
│    [Agregar pieza]                       │
├──────────────────────────────────────────┤
│ 📿 Pulsera Oro Perlas                    │
│    ₡18,000 | ✅ 15 disponibles            │
│    [Agregar pieza]                       │
└──────────────────────────────────────────┘

💡 Cada pieza es un producto individual disponible
   también por separado en el catálogo
```

### Características del Storefront

1. **Visualización de Componentes**: Muestra todos los componentes del set con:
   - Imagen del componente
   - Nombre y código
   - Precio individual
   - Stock disponible
   - Estado (Activo/Agotado/Inactivo)

2. **Selección Individual**: Permite agregar al carrito:
   - ✅ Piezas activas con stock disponible
   - ❌ Bloquea piezas agotadas o inactivas

3. **Badges de Disponibilidad**:
   - **Verde** ✅ "Set completo disponible" → Todos los componentes tienen stock
   - **Rojo** ❌ "Set no disponible" → Algún componente no tiene stock

### Componente SetComponents.tsx

Nuevo componente en `storefront/src/components/product/SetComponents.tsx`:

```tsx
<SetComponents setId={999} setName="Trio de Pulseras Oro" />
```

Características:
- Carga automática de componentes via API
- Display responsive con animaciones
- Integración con carrito de compras
- Validación de stock en tiempo real
- Estados visuales claros (disponible/agotado/inactivo)

### API Response Actualizada

```javascript
GET /api/public/products/999/componentes

{
  "componentes": [
    {
      "id": 101,
      "codigo": "PULS-001",
      "nombre": "Pulsera Oro Eslabones",
      "descripcion": "Pulsera de oro con eslabones",
      "precio": 18000,
      "moneda": "CRC",
      "stock": 10,
      "stock_disponible": true,
      "imagen_url": "https://...",
      "cantidad_requerida": 1,
      "estado": "Activo",
      "es_activo": true
    },
    // ...
  ],
  "stock_set": 5,
  "completo": true
}
```

## 🎨 Componentes Frontend

### ProductosCompuestosManager.js

```jsx
<ProductosCompuestosManager
  setId={999}
  onComponentAdded={(comp) => console.log('Componente agregado:', comp)}
  onStockUpdated={(stock) => console.log('Nuevo stock del set:', stock)}
/>
```

Características:
- Selector de productos existentes (autocomplete)
- Input de cantidad requerida
- Lista de componentes con thumbnails
- Indicador dinámico de stock disponible del set
- Botones editar/eliminar

## 🔒 Validaciones

### Límites

- ✅ Mínimo 1 componente por set
- ✅ Máximo 20 componentes por set
- ✅ Cantidad requerida debe ser positiva

### Prevención de Referencias Circulares

```javascript
// Ejemplo de referencia circular (NO PERMITIDO):
// Set A contiene Set B
// Set B contiene Set A
// → Detectado y rechazado automáticamente

async function validarNoCircular(idProductoSet, idNuevoComponente) {
  // Verifica si el nuevo componente es un set
  // Si lo es, verifica si ese set contiene el set actual
  // Rechaza si hay referencia circular
}
```

### Stock Atómico

```javascript
// Al confirmar venta de set:
// 1. Validar stock de TODOS los componentes
// 2. Descontar stock de TODOS los componentes
// 3. Si ALGUNO falla → ROLLBACK COMPLETO
```

## 📊 Reportes

### Stock Actual del Set

```sql
-- Consultar stock disponible de un set
SELECT 
  s.id,
  s.nombre,
  MIN(FLOOR(c.stock_actual / pc.cantidad)) as stock_disponible
FROM joyas s
JOIN productos_compuestos pc ON s.id = pc.id_producto_set
JOIN joyas c ON pc.id_producto_componente = c.id
WHERE s.id = 999
  AND c.estado = 'Activo'
GROUP BY s.id, s.nombre;
```

### Sets que Contienen un Producto

```javascript
// ¿En qué sets se usa la Pulsera A?
const response = await ProductoCompuesto.obtenerSetsQueContienenProducto(101);

console.log('Este producto es componente en', response.length, 'sets');
```

## 🧪 Testing

### Escenarios de Prueba

1. ✅ Crear set de 3 productos
2. ✅ Stock calculado correctamente (limitado por componente con menos stock)
3. ✅ Vender 1 set, verificar descuento de cada componente
4. ✅ Componente se agota, verificar set muestra "no disponible"
5. ✅ Prevención de referencia circular
6. ✅ Rollback si falla descuento de algún componente

## 🚀 Deployment

1. Ejecutar migración SQL
2. Verificar columna `es_producto_compuesto` en `joyas`
3. Verificar tabla `productos_compuestos` creada
4. Verificar servicio `productService.js` integrado
5. Probar venta de set desde POS

## 📚 Referencias

- Modelo: `backend/models/ProductoCompuesto.js`
- Servicio: `backend/services/productService.js`
- Rutas: `backend/routes/productos-compuestos.js`
- Integración Ventas: `backend/routes/ventas.js`
- Integración Pedidos: `backend/routes/pedidos-online.js`
