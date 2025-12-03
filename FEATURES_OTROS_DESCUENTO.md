# Nuevas Funcionalidades: Items "Otros" y Descuentos

## 📋 Resumen

Se han implementado dos nuevas funcionalidades al módulo de ventas:

1. **Items "Otros"**: Permite agregar items personalizados con cualquier monto a una venta, sin necesidad de que estén registrados en el inventario
2. **Descuentos**: Sistema completo de descuentos que se restan del subtotal y se muestran en el ticket

## 🎯 Funcionalidad 1: Items "Otros"

### Descripción
Permite agregar items personalizados a una venta escribiendo directamente un monto en el buscador. Útil para:
- Servicios adicionales
- Productos no registrados en inventario
- Cargos especiales
- Items misceláneos

### Cómo usar
1. En el módulo de **Ventas**, en el campo de búsqueda, escribe un monto válido (número positivo)
2. Aparecerá automáticamente el botón **"➕ Agregar Otro (₡X.XX)"**
3. Haz clic en el botón para agregar el item al carrito
4. El item se agregará con:
   - **Nombre**: "Otros"
   - **Precio**: El monto ingresado
   - **Cantidad**: 1 (editable)
   - **Sin control de stock**: Puedes agregar la cantidad que desees

### Ejemplos
- Escribe `5000` → Aparece botón "➕ Agregar Otro (₡5000.00)"
- Escribe `15.50` → Aparece botón "➕ Agregar Otro (₡15.50)"
- Escribe `100000` → Aparece botón "➕ Agregar Otro (₡100000.00)"

### Características Técnicas
- **Frontend**: Valida que el input sea un número positivo
- **Backend**: 
  - Acepta items sin `id_joya` (NULL)
  - No valida stock para estos items
  - No registra movimientos de inventario
  - Almacena descripción en campo `descripcion_item`
- **Base de Datos**: 
  - Campo `id_joya` es nullable en `items_venta` e `items_venta_dia`
  - Nuevo campo `descripcion_item` para almacenar el nombre del item

### En el Ticket
Los items "Otros" se imprimen igual que los productos normales:
```
Detalle de Venta
Producto    Cant.   Precio    Total
Otros       1       ₡5000.00  ₡5000.00
```

## 💰 Funcionalidad 2: Descuentos

### Descripción
Sistema completo de descuentos que permite aplicar un descuento al subtotal de la venta. El descuento se resta del subtotal y el total final refleja el precio con descuento aplicado.

### Cómo usar
1. Agrega productos al carrito
2. En la sección del carrito, verás el campo **"Descuento"**
3. Ingresa el monto del descuento en colones
4. El total se actualiza automáticamente: `Total = Subtotal - Descuento`
5. El descuento se guarda en la venta y se muestra en el ticket

### Características
- **Validación**: El descuento no puede ser negativo ni mayor al subtotal
- **Formato**: Acepta decimales (ej: 50.50)
- **Aplicación**: Se resta del subtotal antes de calcular el total
- **Persistencia**: Se guarda en la base de datos como parte de la venta

### En el Ticket
El descuento se muestra claramente en el desglose de totales:
```
Subtotal:        ₡10000.00
Descuento:       -₡1000.00
TOTAL:           ₡9000.00
```

## 🔧 Cambios Técnicos Implementados

### Base de Datos (Migration)
```sql
-- Permite items sin referencia a joya
ALTER TABLE items_venta ALTER COLUMN id_joya DROP NOT NULL;
ALTER TABLE items_venta ADD COLUMN IF NOT EXISTS descripcion_item TEXT;

ALTER TABLE items_venta_dia ALTER COLUMN id_joya DROP NOT NULL;
ALTER TABLE items_venta_dia ADD COLUMN IF NOT EXISTS descripcion_item TEXT;
```

**Archivo**: `backend/migrations/add-otros-item-support.sql`

### Backend

#### Modelos Actualizados
- **ItemVenta.js**: 
  - Acepta `id_joya = null`
  - Acepta y guarda `descripcion_item`
  - Retorna nombre desde `descripcion_item` si no hay joya
  
- **ItemVentaDia.js**: 
  - Mismos cambios que ItemVenta

#### Rutas (ventas.js)
- Valida items tipo "Otros" (sin `id_joya`)
- Salta validación de stock para items "Otros"
- No registra movimientos de inventario para items "Otros"
- Guarda `descripcion_item` en la base de datos

### Frontend

#### Ventas.js
**Nuevas Funciones:**
- `agregarOtroItem()`: Agrega un item "Otros" al carrito
- `esMontoValido()`: Valida si el input es un monto válido para "Otros"

**Modificaciones:**
- `agregarAlCarrito()`: Mantiene lógica original para productos
- `actualizarCantidad()`: Maneja items con y sin stock
- Input de búsqueda actualizado con placeholder que incluye "o monto"
- Botón "Agregar Otro" aparece dinámicamente cuando se detecta monto válido
- Carrito muestra "Item especial" en lugar de stock para items "Otros"

#### TicketPrint.js
- **Sin cambios necesarios**: Ya soporta descuentos y muestra items correctamente
- Descuentos se muestran automáticamente cuando `venta.descuento > 0`

## 🧪 Testing

### Casos de Prueba Recomendados

#### Items "Otros"
1. ✅ Agregar item "Otros" con monto válido
2. ✅ Agregar múltiples items "Otros" con diferentes montos
3. ✅ Mezclar items "Otros" con productos del inventario
4. ✅ Modificar cantidad de item "Otros"
5. ✅ Eliminar item "Otros" del carrito
6. ✅ Completar venta solo con items "Otros"
7. ✅ Completar venta mixta (productos + "Otros")
8. ✅ Imprimir ticket con items "Otros"

#### Descuentos
1. ✅ Aplicar descuento a venta simple
2. ✅ Aplicar descuento a venta con múltiples productos
3. ✅ Aplicar descuento a venta con items "Otros"
4. ✅ Aplicar descuento con diferentes métodos de pago (efectivo, tarjeta, mixto)
5. ✅ Imprimir ticket con descuento
6. ✅ Verificar que el descuento se guarda correctamente en la base de datos

#### Integración
1. ✅ Venta con productos + items "Otros" + descuento
2. ✅ Venta a crédito con items "Otros"
3. ✅ Venta con pago mixto + descuento + items "Otros"
4. ✅ Cierre de caja con ventas que incluyen items "Otros"

### Pasos para Testing Manual

1. **Aplicar la migración de base de datos**:
   ```sql
   -- Ejecutar en Supabase SQL Editor
   -- Contenido de: backend/migrations/add-otros-item-support.sql
   ```

2. **Reiniciar el backend**:
   ```bash
   npm run dev:backend
   ```

3. **Iniciar el frontend**:
   ```bash
   npm run start:frontend
   ```

4. **Probar funcionalidades**:
   - Ir a módulo de Ventas
   - Escribir un monto en el buscador (ej: "5000")
   - Clic en "Agregar Otro"
   - Agregar también productos normales
   - Aplicar un descuento
   - Completar la venta
   - Imprimir ticket

## 📝 Notas Importantes

1. **Migración Requerida**: Antes de usar estas funcionalidades, debe ejecutarse la migración SQL en Supabase
2. **Compatibilidad**: Totalmente compatible con ventas existentes
3. **Sin Breaking Changes**: Las ventas antiguas siguen funcionando normalmente
4. **Stock**: Items "Otros" no afectan el stock del inventario
5. **Movimientos**: Items "Otros" no generan movimientos de inventario
6. **Descuentos**: Ya estaban implementados pero ahora están completamente funcionales y visibles en tickets

## 🎨 Interfaz de Usuario

### Antes
```
[Buscar por código, nombre, categoría...]
```

### Después
```
[Buscar por código, nombre, categoría o monto...]
[➕ Agregar Otro (₡5000.00)]  ← Aparece al escribir un monto
```

### Carrito - Item Normal
```
COD123
Anillo de Oro
Stock disponible: 5
```

### Carrito - Item "Otros"
```
N/A
Otros
Item especial
```

## 🚀 Beneficios

1. **Flexibilidad**: Permite vender items no registrados sin necesidad de crearlos en inventario
2. **Rapidez**: Agregar items personalizados es instantáneo
3. **Control**: Los descuentos se registran correctamente para reportes
4. **Trazabilidad**: Todas las ventas, incluyendo items "Otros", quedan registradas
5. **Impresión**: Los tickets muestran toda la información claramente

## ⚠️ Consideraciones

1. **Items "Otros" en Reportes**: Se incluyen en los totales de ventas pero no en reportes de inventario
2. **Sin Stock**: No hay límite en la cantidad de items "Otros" que se pueden agregar
3. **Historial**: Los items "Otros" aparecen en el historial de ventas con su descripción
4. **Cuentas por Cobrar**: Funcionan normalmente con items "Otros"

## 📄 Archivos Modificados

### Backend
- `backend/migrations/add-otros-item-support.sql` (nuevo)
- `backend/models/ItemVenta.js`
- `backend/models/ItemVentaDia.js`
- `backend/routes/ventas.js`

### Frontend
- `frontend/src/components/Ventas.js`

### Sin Cambios
- `frontend/src/components/TicketPrint.js` (ya soportaba descuentos)
- Tablas de ventas (ya tenían campo descuento)
- Otros componentes del sistema
