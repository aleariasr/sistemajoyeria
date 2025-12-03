# 🚀 Referencia Rápida - Nuevas Funcionalidades

## 📝 Resumen Ejecutivo

Se agregaron dos funcionalidades al módulo de Ventas:
1. **Items "Otros"**: Agregar montos personalizados sin inventario
2. **Descuentos**: Sistema completo de descuentos en ventas

## ⚡ Uso Rápido

### Agregar Item "Otros"
```
1. En Ventas, escribe un monto en el buscador (ej: 5000)
2. Haz clic en el botón "➕ Agregar Otro (₡5000.00)"
3. El item se agrega al carrito como "Otros"
```

### Aplicar Descuento
```
1. En el carrito, ve al campo "Descuento"
2. Ingresa el monto del descuento (ej: 1000)
3. El total se actualiza automáticamente
```

## 🔑 Comandos Clave

### Aplicar Migración (Una sola vez)
```sql
-- En Supabase SQL Editor
ALTER TABLE items_venta ALTER COLUMN id_joya DROP NOT NULL;
ALTER TABLE items_venta ADD COLUMN IF NOT EXISTS descripcion_item TEXT;
ALTER TABLE items_venta_dia ALTER COLUMN id_joya DROP NOT NULL;
ALTER TABLE items_venta_dia ADD COLUMN IF NOT EXISTS descripcion_item TEXT;
```

### Verificar Migración
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'items_venta' 
  AND column_name IN ('id_joya', 'descripcion_item');
```

### Iniciar Sistema
```bash
# Backend
npm run dev:backend

# Frontend (en otra terminal)
npm run start:frontend
```

### Test de Lógica
```bash
node test-otros-descuento.js
```

## 📊 Validación Rápida

### ✅ Todo está funcionando si:
- [x] Al escribir "5000" aparece botón "Agregar Otro"
- [x] Items "Otros" se agregan al carrito
- [x] Campo descuento actualiza el total
- [x] Ventas se completan correctamente
- [x] Tickets muestran items "Otros" y descuentos

### ❌ Hay un problema si:
- [ ] Botón "Agregar Otro" no aparece → Actualizar frontend
- [ ] Error al guardar venta → Aplicar migración SQL
- [ ] Items "Otros" no se muestran → Verificar base de datos

## 📄 Archivos Modificados

```
backend/
├── migrations/add-otros-item-support.sql  ← NUEVO (ejecutar en Supabase)
├── models/ItemVenta.js                     ← Modificado
├── models/ItemVentaDia.js                  ← Modificado
└── routes/ventas.js                        ← Modificado

frontend/
└── src/components/Ventas.js               ← Modificado

docs/
├── FEATURES_OTROS_DESCUENTO.md            ← NUEVO (documentación completa)
├── GUIA_IMPLEMENTACION.md                 ← NUEVO (guía paso a paso)
└── test-otros-descuento.js                ← NUEVO (tests de lógica)
```

## 💡 Ejemplos Prácticos

### Venta Simple con Item "Otros"
```
1. Escribe "2500" en el buscador
2. Clic en "Agregar Otro"
3. Selecciona método de pago: Efectivo
4. Efectivo recibido: 3000
5. Completar venta
→ Ticket muestra "Otros - ₡2500.00"
```

### Venta Mixta con Descuento
```
1. Agrega producto: Anillo (₡5000)
2. Agrega "Otros": 1500
3. Subtotal: ₡6500
4. Descuento: 500
5. Total: ₡6000
→ Ticket muestra subtotal, descuento y total
```

### Venta a Crédito con Todo
```
1. Tipo de venta: Crédito
2. Selecciona cliente
3. Agrega productos normales
4. Agrega items "Otros"
5. Aplica descuento
6. Completar venta
→ Crea cuenta por cobrar con el total correcto
```

## 🔍 Consultas SQL Útiles

### Ver ventas del día con items "Otros"
```sql
SELECT v.id, v.total, i.descripcion_item, i.precio_unitario
FROM ventas_dia v
JOIN items_venta_dia i ON v.id = i.id_venta_dia
WHERE i.id_joya IS NULL
ORDER BY v.id DESC;
```

### Ver ventas con descuento
```sql
SELECT id, fecha_venta, subtotal, descuento, total
FROM ventas_dia
WHERE descuento > 0
ORDER BY fecha_venta DESC;
```

### Resumen de ventas del día
```sql
SELECT 
  COUNT(*) as total_ventas,
  SUM(total) as total_ingresos,
  SUM(descuento) as total_descuentos,
  COUNT(CASE WHEN descuento > 0 THEN 1 END) as ventas_con_descuento
FROM ventas_dia
WHERE fecha_venta >= CURRENT_DATE;
```

## 🎯 Casos de Uso Comunes

| Escenario | Solución |
|-----------|----------|
| Servicio de instalación | Agregar como item "Otros" |
| Producto no registrado | Agregar como item "Otros" |
| Cliente frecuente | Aplicar descuento |
| Promoción especial | Aplicar descuento |
| Producto + servicio | Mezclar productos e items "Otros" |
| Venta con ajuste | Aplicar descuento |

## 📱 Atajos de Teclado

- **Buscar**: Clic en campo de búsqueda
- **Agregar Otro**: Enter después de escribir monto (si está implementado)
- **Eliminar item**: Clic en ✕
- **Aumentar cantidad**: Clic en +
- **Disminuir cantidad**: Clic en -

## 🔗 Enlaces Rápidos

- Documentación completa: `FEATURES_OTROS_DESCUENTO.md`
- Guía de implementación: `GUIA_IMPLEMENTACION.md`
- Test de lógica: `test-otros-descuento.js`
- Migración SQL: `backend/migrations/add-otros-item-support.sql`

## 📞 Contacto

Si tienes problemas o preguntas, revisa:
1. Logs del backend: Terminal donde corre `npm run dev:backend`
2. Consola del navegador: F12 → Console
3. Base de datos: Supabase → SQL Editor

---

**Versión**: 1.0  
**Fecha**: Diciembre 2024  
**Estado**: ✅ Completado y probado
