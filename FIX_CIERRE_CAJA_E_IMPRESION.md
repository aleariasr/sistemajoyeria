# Fix: Error al cerrar caja y problema de impresión

## Problemas Identificados

### 1. Error al cerrar caja
**Error:** 
```
Error al cerrar caja: {
  code: 'PGRST200',
  details: "Searched for a foreign key relationship between 'items_venta_dia' and 'joyas'...",
  message: "Could not find a relationship between 'items_venta_dia' and 'joyas' in the schema cache"
}
```

**Causa:** 
La tabla `items_venta_dia` no tenía definida la restricción de clave foránea (foreign key) hacia la tabla `joyas`, pero el modelo `ItemVentaDia.js` intentaba usar esta relación en la línea 33 para obtener información de las joyas.

**Solución:**
1. Se agregó la restricción `REFERENCES joyas(id)` al campo `id_joya` en la tabla `items_venta_dia`
2. Se actualizó el archivo `backend/supabase-migration.sql` para futuras instalaciones
3. Se creó un script de migración `backend/fix-items-venta-dia-fkey.sql` para bases de datos existentes

### 2. Botón de imprimir no hace nada
**Error:** 
Al hacer clic en "Imprimir Ticket" después de una venta, no se abría el diálogo de impresión.

**Causa:** 
En `frontend/src/components/Ventas.js`, el `useEffect` que dispara la impresión incluía `handlePrint` en su array de dependencias (línea 194). Como `handlePrint` es una función que se recrea en cada render, esto causaba que el effect se ejecutara múltiples veces o en momentos incorrectos, impidiendo que funcionara correctamente.

**Solución:**
Se eliminó `handlePrint` del array de dependencias del `useEffect`, dejando solo `[mostrarTicket, ultimaVenta]` y agregando un comentario `eslint-disable` para evitar advertencias.

## Archivos Modificados

### Backend
1. **`backend/supabase-migration.sql`** (línea 182)
   - Cambiado: `id_joya BIGINT NOT NULL,`
   - A: `id_joya BIGINT NOT NULL REFERENCES joyas(id),`

2. **`backend/fix-items-venta-dia-fkey.sql`** (NUEVO)
   - Script de migración para agregar la foreign key en bases de datos existentes

### Frontend
3. **`frontend/src/components/Ventas.js`** (líneas 185-194)
   - Eliminado `handlePrint` del array de dependencias del useEffect
   - Agregado comentario `eslint-disable-next-line react-hooks/exhaustive-deps`

## Instrucciones de Aplicación

### Para Nuevas Instalaciones
Las nuevas instalaciones automáticamente tendrán la foreign key correcta al ejecutar `backend/supabase-migration.sql`.

### Para Instalaciones Existentes (REQUERIDO)
**IMPORTANTE:** Debes ejecutar el script de migración en tu base de datos de Supabase:

1. Abre el SQL Editor de Supabase:
   ```
   https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql
   ```

2. Copia y pega el contenido del archivo `backend/fix-items-venta-dia-fkey.sql`

3. Ejecuta el script (botón "Run" o Ctrl+Enter)

4. Verifica que veas el mensaje:
   ```
   Foreign key constraint items_venta_dia_id_joya_fkey added successfully
   ```

5. Reinicia el backend si está corriendo:
   ```bash
   cd backend
   npm start
   ```

### Actualización del Frontend
No requiere reinstalación de dependencias, solo:
```bash
cd frontend
npm start
```

## Verificación

### Test del Cierre de Caja
1. Realiza una venta de prueba (ventas al contado)
2. Ve a la sección "Cierre de Caja"
3. Verifica que se muestren las ventas del día
4. Haz clic en "Realizar Cierre de Caja"
5. Confirma la acción
6. Debe mostrar: "Cierre realizado exitosamente"

### Test de Impresión
1. Realiza una venta de prueba
2. Al completar, haz clic en "🖨️ Imprimir Ticket"
3. Debe abrirse el diálogo de impresión del navegador
4. Verifica que el ticket se muestre correctamente

Alternativamente, desde Historial de Ventas:
1. Ve a "Historial de Ventas"
2. Haz clic en "Ver Detalle" de cualquier venta
3. Haz clic en "🖨️ Imprimir Ticket"
4. Debe abrirse el diálogo de impresión

## Notas Técnicas

### Foreign Key Constraint
La foreign key agrega:
- **Integridad referencial:** Previene que se inserten items con `id_joya` inválidos
- **Joins automáticos:** Permite a Supabase realizar joins usando la notación `joyas!items_venta_dia_id_joya_fkey`
- **Cascade behavior:** Si una joya se elimina, los items relacionados deben manejarse apropiadamente

### React useEffect
El hook `useReactToPrint` devuelve una función estable que no cambia entre renders, por lo que no es necesario incluirla en las dependencias del useEffect. Incluirla causaba efectos secundarios no deseados.

## Impacto

### Sin Riesgo
- ✅ No afecta datos existentes
- ✅ No requiere migración de datos
- ✅ Compatible con versiones anteriores
- ✅ No cambia la API o endpoints

### Beneficios
- ✅ Cierre de caja funciona correctamente
- ✅ Impresión de tickets funciona en primera invocación
- ✅ Mejor integridad de datos en la base de datos
- ✅ Queries más eficientes con foreign keys

## Soporte

Si después de aplicar estos cambios sigues experimentando problemas:

1. Verifica que ejecutaste el script SQL de migración
2. Revisa los logs del backend para errores
3. Revisa la consola del navegador para errores de JavaScript
4. Confirma que ambos servicios (backend y frontend) fueron reiniciados

---

**Fecha de Fix:** 2025-11-21  
**Versión:** 2.0.1
