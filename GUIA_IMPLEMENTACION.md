# 📋 Guía de Implementación - Items "Otros" y Descuentos

## ⚠️ IMPORTANTE: Pasos a Seguir

Esta guía te ayudará a implementar las nuevas funcionalidades en tu sistema.

## 🔧 Paso 1: Aplicar la Migración de Base de Datos

### Opción A: Usando Supabase Dashboard (Recomendado)

1. Accede a tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo: `backend/migrations/add-otros-item-support.sql`
5. Ejecuta la query haciendo clic en **Run**
6. Verifica que se muestre "Success. No rows returned"

**Contenido de la migración:**
```sql
-- Modificar items_venta para permitir id_joya NULL
ALTER TABLE items_venta 
  ALTER COLUMN id_joya DROP NOT NULL;

-- Agregar columna para descripción de items "Otros"
ALTER TABLE items_venta 
  ADD COLUMN IF NOT EXISTS descripcion_item TEXT;

-- Modificar items_venta_dia para permitir id_joya NULL
ALTER TABLE items_venta_dia 
  ALTER COLUMN id_joya DROP NOT NULL;

-- Agregar columna para descripción de items "Otros"
ALTER TABLE items_venta_dia 
  ADD COLUMN IF NOT EXISTS descripcion_item TEXT;
```

### Opción B: Usando CLI de Supabase

```bash
cd backend/migrations
supabase db push add-otros-item-support.sql
```

### Verificar la Migración

Ejecuta en el SQL Editor:
```sql
-- Verificar que las columnas se agregaron correctamente
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name IN ('items_venta', 'items_venta_dia') 
  AND column_name IN ('id_joya', 'descripcion_item');
```

Deberías ver que `id_joya` ahora permite NULL y que existe `descripcion_item`.

## 🚀 Paso 2: Actualizar el Código

### Si estás en modo desarrollo local:

```bash
# Asegúrate de tener la última versión
git pull origin copilot/add-other-item-to-invoice

# Instalar dependencias (si es necesario)
npm install

# Reiniciar el backend
npm run dev:backend

# En otra terminal, iniciar el frontend
npm run start:frontend
```

### Si estás en producción (Railway + Vercel):

1. **Hacer merge del PR a la rama principal**
2. **Railway**: Se desplegará automáticamente
3. **Vercel**: Se desplegará automáticamente

## 🧪 Paso 3: Probar las Funcionalidades

### 🎯 Prueba 1: Agregar Item "Otros"

1. Abre el módulo de **Ventas**
2. En el campo de búsqueda, escribe un número (ejemplo: `5000`)
3. Verifica que aparece el botón **"➕ Agregar Otro (₡5000.00)"**
4. Haz clic en el botón
5. El item debe aparecer en el carrito como:
   ```
   N/A
   Otros
   Item especial
   ```
6. Verifica que puedes cambiar la cantidad
7. Verifica que puedes eliminarlo del carrito

### 🎯 Prueba 2: Venta con Items "Otros"

1. Agrega un producto normal al carrito (búscalo por código o nombre)
2. Agrega un item "Otros" escribiendo un monto (ej: `2500`)
3. Verifica el carrito muestra ambos items
4. Verifica que el subtotal suma correctamente
5. Completa la venta con método de pago **Efectivo**
6. Verifica que se procesa correctamente
7. Imprime el ticket

### 🎯 Prueba 3: Descuentos

1. Agrega productos al carrito
2. En el campo **"Descuento"** ingresa un monto (ej: `1000`)
3. Verifica que el total se actualiza: `Total = Subtotal - Descuento`
4. Completa la venta
5. Imprime el ticket
6. Verifica que el ticket muestra:
   ```
   Subtotal:        ₡XX.XX
   Descuento:       -₡XX.XX
   TOTAL:           ₡XX.XX
   ```

### 🎯 Prueba 4: Combinación Completa

1. Agrega un producto normal (ej: Anillo)
2. Agrega un item "Otros" (ej: ₡3000)
3. Aplica un descuento (ej: ₡500)
4. Selecciona método de pago **Mixto**
5. Ingresa montos de pago mixto
6. Completa la venta
7. Imprime el ticket
8. Verifica que todo se muestra correctamente

### 🎯 Prueba 5: Venta a Crédito con Items "Otros"

1. Cambia tipo de venta a **Crédito**
2. Selecciona un cliente
3. Agrega productos normales y items "Otros"
4. Aplica descuento (opcional)
5. Completa la venta
6. Verifica que se crea la cuenta por cobrar

## 📊 Paso 4: Verificar en Base de Datos

### Verificar Items "Otros" en ventas del día:

```sql
SELECT 
  v.id,
  v.total,
  v.descuento,
  i.id_joya,
  i.descripcion_item,
  i.precio_unitario,
  i.cantidad,
  j.nombre as nombre_joya
FROM ventas_dia v
LEFT JOIN items_venta_dia i ON v.id = i.id_venta_dia
LEFT JOIN joyas j ON i.id_joya = j.id
WHERE v.fecha_venta >= CURRENT_DATE
ORDER BY v.id DESC, i.id;
```

Deberías ver:
- Items con `id_joya` (productos normales)
- Items con `id_joya = NULL` y `descripcion_item = 'Otros'` (items "Otros")

### Verificar descuentos:

```sql
SELECT 
  id,
  fecha_venta,
  subtotal,
  descuento,
  total,
  subtotal - descuento as total_calculado
FROM ventas_dia
WHERE descuento > 0
ORDER BY fecha_venta DESC;
```

Verifica que `total = subtotal - descuento`.

## 🎨 Paso 5: Revisar Tickets Impresos

Los tickets deben mostrar:

```
═══════════════════════════════════════
         Cuero y Perla
      Grecia, Alajuela
          Costa Rica
───────────────────────────────────────
Fecha: 03/12/2025, 10:30 AM
Ticket #: 123
Vendedor: Juan Pérez
Tipo: 💰 Contado
───────────────────────────────────────
Detalle de Venta

Producto      Cant.  Precio     Total
Anillo        1      ₡5000.00   ₡5000.00
Cód: AN001

Otros         1      ₡2500.00   ₡2500.00
───────────────────────────────────────
Subtotal:              ₡7500.00
Descuento:              -₡500.00
TOTAL:                 ₡7000.00
───────────────────────────────────────
Método de Pago: Efectivo
Efectivo Recibido:     ₡10000.00
Cambio:                ₡3000.00
───────────────────────────────────────
    ¡Gracias por su compra!
   Cuero y Perla - Grecia, Alajuela
  Belleza y Elegancia en Cada Detalle
═══════════════════════════════════════
```

## ✅ Checklist de Verificación

Antes de dar por completada la implementación, verifica:

- [ ] Migración aplicada exitosamente en Supabase
- [ ] Backend actualizado y funcionando
- [ ] Frontend actualizado y funcionando
- [ ] Botón "Agregar Otro" aparece al escribir un monto
- [ ] Items "Otros" se agregan al carrito correctamente
- [ ] Items "Otros" muestran "Item especial" en lugar de stock
- [ ] Campo descuento funciona y actualiza el total
- [ ] Ventas se completan correctamente con items "Otros"
- [ ] Ventas se completan correctamente con descuentos
- [ ] Tickets se imprimen con toda la información correcta
- [ ] Items "Otros" aparecen en base de datos con `id_joya = NULL`
- [ ] Descuentos se guardan correctamente en base de datos
- [ ] Funciona con diferentes métodos de pago
- [ ] Funciona con ventas a crédito
- [ ] No afecta ventas existentes

## 🆘 Solución de Problemas

### Error: "relation 'descripcion_item' does not exist"
**Solución**: Aplica la migración SQL en Supabase.

### El botón "Agregar Otro" no aparece
**Solución**: 
1. Verifica que el frontend esté actualizado
2. Limpia el caché del navegador
3. Recarga la página con Ctrl+Shift+R

### Items "Otros" no se guardan
**Solución**: 
1. Verifica que la migración se aplicó correctamente
2. Revisa los logs del backend para errores
3. Verifica que `id_joya` permite NULL en la base de datos

### Los descuentos no se muestran en el ticket
**Solución**: 
1. Verifica que el descuento sea mayor a 0
2. Limpia el caché del navegador
3. Actualiza el componente TicketPrint

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs del backend: `npm run dev:backend`
2. Revisa la consola del navegador (F12)
3. Verifica la base de datos en Supabase
4. Consulta el archivo `FEATURES_OTROS_DESCUENTO.md` para más detalles
5. Ejecuta el test de lógica: `node test-otros-descuento.js`

## 🎉 ¡Listo!

Una vez completados todos los pasos, las funcionalidades estarán disponibles:

✨ **Agregar items "Otros"**: Escribe un monto y haz clic en el botón
💰 **Aplicar descuentos**: Ingresa el monto en el campo de descuento
🖨️ **Imprimir tickets**: Con toda la información completa

¡Disfruta de las nuevas funcionalidades! 🎊
