# Limpieza de Datos de Prueba - Sistema Joyería

## ⚠️ ADVERTENCIA IMPORTANTE

Este script elimina **TODOS** los datos de prueba de la base de datos, pero **PRESERVA**:
- ✅ **Joyas** (tabla `joyas`) - Todas las joyas registradas se mantienen
- ✅ **Usuarios** (tabla `usuarios`) - Todos los usuarios registrados se mantienen

## Datos que serán ELIMINADOS

| Tabla | Descripción | ¿Se elimina? |
|-------|-------------|--------------|
| `joyas` | Catálogo de joyas | ❌ NO |
| `usuarios` | Usuarios del sistema | ❌ NO |
| `clientes` | Clientes registrados | ✅ SÍ |
| `ventas` | Registro de ventas | ✅ SÍ |
| `items_venta` | Detalles de ventas | ✅ SÍ |
| `ventas_dia` | Ventas del día actual | ✅ SÍ |
| `items_venta_dia` | Items del día actual | ✅ SÍ |
| `cuentas_por_cobrar` | Créditos pendientes | ✅ SÍ |
| `abonos` | Pagos a créditos | ✅ SÍ |
| `devoluciones` | Devoluciones | ✅ SÍ |
| `movimientos_inventario` | Historial de stock | ✅ SÍ |
| `reservas_inventario` | Reservas de stock | ✅ SÍ |
| `auditoria_inventario` | Auditoría de cambios | ✅ SÍ |
| `ingresos_extras` | Ingresos adicionales | ✅ SÍ |
| `cierres_caja` | Histórico de cierres | ✅ SÍ |
| `configuracion_tienda` | Configuración | ❌ NO |

## Cómo ejecutar la limpieza

### Paso 1: Acceder al SQL Editor de Supabase

1. Ir a: https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql
2. Iniciar sesión con las credenciales del proyecto

### Paso 2: Ejecutar el script

1. Copiar todo el contenido del archivo `clean-test-data.sql`
2. Pegarlo en el SQL Editor de Supabase
3. Hacer clic en **"Run"** para ejecutar

### Paso 3: Verificar los resultados

El script mostrará un resumen indicando:
- Cuántas joyas fueron preservadas
- Cuántos usuarios fueron preservados
- Confirmación de que las tablas fueron limpiadas

## Orden de eliminación

El script respeta las restricciones de clave foránea (foreign keys) eliminando los datos en el orden correcto:

1. **Primero**: `abonos`, `items_venta`, `items_venta_dia`, `devoluciones`
2. **Segundo**: `cuentas_por_cobrar`
3. **Tercero**: `ventas`, `ventas_dia`
4. **Cuarto**: `movimientos_inventario`, `reservas_inventario`, `auditoria_inventario`
5. **Quinto**: `clientes`, `ingresos_extras`, `cierres_caja`

## Reinicio de secuencias

Después de la limpieza, las secuencias de ID se reinician a 1, lo que significa que:
- La próxima venta será ID = 1
- El próximo cliente será ID = 1
- etc.

## Seguridad

El script incluye validaciones para asegurar que:
- Las joyas NO sean eliminadas
- Los usuarios NO sean eliminados
- Si algo sale mal, la transacción se revierte automáticamente

## Después de la limpieza

Una vez ejecutado el script:
1. El sistema seguirá funcionando normalmente
2. Las joyas mantendrán su stock actual
3. Los usuarios podrán seguir iniciando sesión
4. Se pueden agregar nuevos clientes, ventas, etc.

## Soporte

Si hay algún problema durante la limpieza, contactar al administrador del sistema.
