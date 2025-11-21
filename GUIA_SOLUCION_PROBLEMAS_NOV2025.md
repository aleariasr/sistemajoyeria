# Guía de Solución de Problemas - Noviembre 2025

Este documento describe las soluciones a tres problemas identificados en el sistema.

## 📋 Resumen de Problemas y Soluciones

| Problema | Estado | Solución |
|----------|--------|----------|
| 1. Botón de impresión no funciona | ✅ RESUELTO | Actualizar API de react-to-print v2 a v3 |
| 2. Productos no aparecen en detalle de ventas | ✅ RESUELTO | Verificar y corregir foreign key constraint |
| 3. Abonos aparecen después de cierre de caja | ✅ RESUELTO | Agregar campo `cerrado` a tabla abonos |

---

## 1. ❌ Botón de Impresión No Funciona

### Síntoma
Al hacer clic en "Imprimir Ticket" después de una venta o en el detalle de venta, no se abre el diálogo de impresión.

### Causa
El código utilizaba la API de react-to-print v2.x (`content: () => ref.current`), pero la versión instalada es v3.2.0 que usa una API diferente (`contentRef: ref`).

### Solución Aplicada

**Archivos modificados:**
- `frontend/src/components/Ventas.js` (líneas 175-178, 180-182)
- `frontend/src/components/DetalleVenta.js` (líneas 15-18)
- `frontend/src/components/BarcodeModal.js` (líneas 10-13)

**Cambio realizado:**
```javascript
// ANTES (v2.x API)
const handlePrint = useReactToPrint({
  content: () => ticketRef.current,
  documentTitle: `Ticket-Venta-${id}`,
});

// DESPUÉS (v3.x API)
const handlePrint = useReactToPrint({
  contentRef: ticketRef,
  documentTitle: `Ticket-Venta-${id}`,
});
```

### Verificación
1. Realiza una venta de prueba
2. Haz clic en "🖨️ Imprimir Ticket" en el mensaje de éxito
3. Debe abrirse el diálogo de impresión del navegador
4. Verifica que el ticket se muestre correctamente en la vista previa

**También puedes verificar desde:**
- Detalle de venta (Historial → Ver Detalle)
- Códigos de barras (Listado de Joyas → botón 🏷️)

---

## 2. ⚠️ Productos No Aparecen en Detalle de Ventas

### Síntoma
Al ver el detalle de una venta, la tabla de productos aparece vacía aunque la venta tiene items asociados.

### Causa Probable
El modelo `ItemVenta.obtenerPorVenta()` usa un foreign key relationship específico (`joyas!items_venta_id_joya_fkey`) para hacer el join con la tabla `joyas`. Si la constraint no existe o tiene un nombre diferente, Supabase no puede hacer el join.

### Solución Propuesta

**Script de migración:** `backend/fix-items-venta-fkey.sql`

Este script:
1. Verifica si existe una foreign key con un nombre diferente
2. Elimina la constraint incorrecta si existe
3. Crea la constraint con el nombre correcto: `items_venta_id_joya_fkey`

### Aplicación (REQUERIDA para instalaciones existentes)

1. Abre el SQL Editor de Supabase
2. Ejecuta el script `backend/fix-items-venta-fkey.sql`
3. Reinicia el backend

### Verificación
1. Ve a "Historial de Ventas"
2. Haz clic en "Ver Detalle" de cualquier venta
3. Verifica que se muestren los productos en la tabla:
   - Código
   - Producto
   - Categoría
   - Cantidad
   - Precio Unitario
   - Subtotal

---

## 3. 💰 Abonos Aparecen Después de Cierre de Caja

### Síntoma
Después de realizar un cierre de caja, los abonos (pagos a cuentas por cobrar) siguen apareciendo en el resumen del día, mostrando efectivo en caja incorrecto.

### Causa
El endpoint `cerrar-caja` transfería ventas de `ventas_dia` a `ventas` pero NO marcaba los abonos como procesados, causando que se siguieran contabilizando.

### Solución Aplicada

**Cambios en base de datos:**
Agregados dos campos a la tabla `abonos`:
- `cerrado` (BOOLEAN, default false): Indica si fue incluido en un cierre
- `fecha_cierre` (TIMESTAMP): Registra cuándo fue cerrado

**Archivos modificados:**
- `backend/supabase-migration.sql` (tabla abonos)
- `backend/models/Abono.js` (método `marcarComoCerrados`)
- `backend/routes/cierrecaja.js` (filtrar abonos cerrados)

**Script de migración:** `backend/fix-abonos-cierre-caja.sql`

### Aplicación (REQUERIDA para instalaciones existentes)

1. Abre el SQL Editor de Supabase
2. Ejecuta el script `backend/fix-abonos-cierre-caja.sql`
3. Verifica el mensaje de confirmación
4. Reinicia el backend

### Comportamiento Nuevo

**Resumen del Día:**
- **Antes del cierre**: Muestra ventas del día + abonos NO cerrados
- **Después del cierre**: Solo muestra nuevas transacciones

**Cierre de Caja:**
1. Transfiere ventas de `ventas_dia` a `ventas`
2. Marca abonos del día como cerrados (`cerrado = true`)
3. Registra fecha de cierre en `fecha_cierre`
4. Limpia `ventas_dia`
5. Retorna resumen con ventas y abonos procesados

### Verificación
1. Realiza una venta al contado
2. Realiza un abono a una cuenta por cobrar
3. Ve a "Cierre de Caja"
4. Verifica que se muestren ambas transacciones
5. Realiza el cierre de caja
6. Verifica mensaje de éxito con conteo de abonos cerrados
7. Actualiza la página
8. Verifica que las transacciones anteriores YA NO aparezcan
9. El efectivo en caja debe estar en cero

---

## 🚀 Pasos de Instalación Completa

### Para Instalaciones EXISTENTES

Ejecuta estos scripts en orden en el SQL Editor de Supabase:

```sql
-- 1. Fix de foreign key para items_venta
-- Copiar y ejecutar: backend/fix-items-venta-fkey.sql

-- 2. Fix de abonos en cierre de caja
-- Copiar y ejecutar: backend/fix-abonos-cierre-caja.sql
```

Luego reinicia el backend:
```bash
cd backend
npm start
```

El frontend no requiere reinstalación, solo refrescar el navegador.

### Para Instalaciones NUEVAS

Simplemente ejecuta `backend/supabase-migration.sql` que ya incluye todos los fixes.

---

## 📊 Consultas SQL Útiles

### Verificar Foreign Keys
```sql
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('items_venta', 'items_venta_dia')
  AND tc.constraint_type = 'FOREIGN KEY';
```

### Ver Abonos por Estado
```sql
SELECT 
  cerrado,
  COUNT(*) as cantidad,
  SUM(monto) as monto_total,
  MAX(fecha_cierre) as ultimo_cierre
FROM abonos
GROUP BY cerrado;
```

### Ver Items de una Venta Específica
```sql
SELECT 
  iv.*,
  j.codigo,
  j.nombre,
  j.categoria
FROM items_venta iv
JOIN joyas j ON iv.id_joya = j.id
WHERE iv.id_venta = 123;  -- Cambiar 123 por el ID de venta
```

---

## ⚠️ Notas Importantes

1. **Respaldo**: Siempre haz un respaldo de la base de datos antes de ejecutar migraciones
2. **Orden**: Ejecuta los scripts en el orden indicado
3. **Reinicio**: Reinicia el backend después de cada migración
4. **Verificación**: Prueba cada funcionalidad después de aplicar el fix

---

## 📞 Soporte

Si después de aplicar estos cambios sigues experimentando problemas:

1. Verifica que ejecutaste todos los scripts SQL
2. Revisa los logs del backend para errores
3. Revisa la consola del navegador para errores JavaScript
4. Confirma que tanto backend como frontend fueron reiniciados
5. Verifica que las foreign keys existan con los nombres correctos

---

**Fecha:** 2025-11-21  
**Versión del Sistema:** 2.0.3  
**Documentos Relacionados:**
- FIX_CIERRE_CAJA_E_IMPRESION.md
- FIX_ABONOS_CIERRE_CAJA.md
- GUIA_IMPRESION.md
