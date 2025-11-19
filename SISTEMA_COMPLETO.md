# Documentación Completa del Sistema de Joyería

## Flujos de Transacciones

### 1. Ventas de Contado
```
Usuario → Registro de Venta → ventas_dia (temporal)
                           ↓
                    Actualiza Inventario
                           ↓
                  Movimiento de Inventario
                           ↓
              Al Cierre de Caja → ventas (permanente)
```

### 2. Ventas a Crédito
```
Usuario → Registro de Venta → ventas (permanente)
                           ↓
                    Actualiza Inventario
                           ↓
                  Movimiento de Inventario
                           ↓
                    Cuentas por Cobrar
```

### 3. Abonos
```
Usuario → Registro de Abono → abonos (permanente)
                           ↓
                Actualiza Cuenta por Cobrar
                           ↓
                   Aparece en Cierre de Caja
                           ↓
                  Reportes Financieros
```

## Estructura de Datos

### Bases de Datos

#### 1. joyeria.db (Principal)
- **usuarios** - Usuarios del sistema
- **joyas** - Inventario de productos
- **movimientos_inventario** - Historial de movimientos
- **ventas** - Ventas finalizadas (contado cerrado + crédito)
- **items_venta** - Detalle de ventas
- **clientes** - Información de clientes
- **cuentas_por_cobrar** - Cuentas pendientes
- **abonos** - Pagos a cuentas por cobrar

#### 2. ventas_dia.db (Temporal)
- **ventas_dia** - Ventas de contado del día
- **items_venta_dia** - Detalle de ventas del día

## Endpoints de API

### Reportes Financieros

#### GET /api/reportes/inventario
Reporte completo del inventario actual

#### GET /api/reportes/stock-bajo
Productos con stock por debajo del mínimo

#### GET /api/reportes/movimientos-financieros
**NUEVO** - Reporte completo de movimientos financieros
- Ventas por método de pago
- Abonos por método de pago
- Totales combinados
- Filtros: fecha_desde, fecha_hasta

Respuesta:
```json
{
  "periodo": {
    "fecha_desde": "2025-11-18 00:00:00",
    "fecha_hasta": "2025-11-18 23:59:59"
  },
  "ventas": {
    "cantidad": 3,
    "totales": {
      "efectivo": 110000,
      "tarjeta": 75000,
      "transferencia": 0,
      "total": 185000
    }
  },
  "abonos": {
    "cantidad": 3,
    "totales": {
      "efectivo": 30000,
      "tarjeta": 20000,
      "transferencia": 15000,
      "total": 65000
    }
  },
  "totales_combinados": {
    "efectivo": 140000,
    "tarjeta": 95000,
    "transferencia": 15000,
    "total": 250000
  }
}
```

#### GET /api/reportes/historial-completo
**NUEVO** - Historial unificado de todas las transacciones
- Ventas
- Abonos
- Movimientos de inventario
- Filtros: fecha_desde, fecha_hasta, tipo

Respuesta:
```json
{
  "total": 9,
  "historial": [
    {
      "tipo": "venta",
      "fecha": "2025-11-18 20:00:00",
      "descripcion": "Venta #1 - Contado",
      "metodo_pago": "Efectivo",
      "monto": 50000,
      "usuario": "admin"
    },
    {
      "tipo": "abono",
      "fecha": "2025-11-18 20:41:00",
      "descripcion": "Abono a cuenta #1 - Juan Pérez",
      "metodo_pago": "Efectivo",
      "monto": 30000,
      "usuario": "admin"
    },
    {
      "tipo": "movimiento_inventario",
      "fecha": "2025-11-18 19:00:00",
      "descripcion": "Entrada - Anillo (AN-001)",
      "cantidad": 10,
      "motivo": "Compra a proveedor",
      "usuario": "admin"
    }
  ]
}
```

### Cierre de Caja

#### GET /api/cierrecaja/resumen-dia
Obtiene el resumen del día incluyendo:
- Ventas de contado por método de pago
- Abonos por método de pago
- Totales combinados

Respuesta mejorada:
```json
{
  "resumen": {
    "total_ventas": 3,
    "total_ingresos": 185000,
    "total_efectivo_final": 110000,
    "total_tarjeta_final": 75000,
    "total_transferencia_final": 0,
    "total_abonos": 3,
    "monto_total_abonos": 65000,
    "monto_abonos_efectivo": 30000,
    "monto_abonos_tarjeta": 20000,
    "monto_abonos_transferencia": 15000,
    "total_efectivo_combinado": 140000,
    "total_tarjeta_combinado": 95000,
    "total_transferencia_combinado": 15000,
    "total_ingresos_combinado": 250000
  },
  "ventas": [...],
  "abonos": [...]
}
```

## Cálculos de Totales

### Ventas de Contado
```javascript
// Ventas simples
total_efectivo = SUM(total WHERE metodo_pago = 'Efectivo')
total_tarjeta = SUM(total WHERE metodo_pago = 'Tarjeta')
total_transferencia = SUM(total WHERE metodo_pago = 'Transferencia')

// Ventas mixtas
total_efectivo_mixto = SUM(monto_efectivo WHERE metodo_pago = 'Mixto')
total_tarjeta_mixto = SUM(monto_tarjeta WHERE metodo_pago = 'Mixto')
total_transferencia_mixto = SUM(monto_transferencia WHERE metodo_pago = 'Mixto')

// Totales finales de ventas
total_efectivo_final = total_efectivo + total_efectivo_mixto
total_tarjeta_final = total_tarjeta + total_tarjeta_mixto
total_transferencia_final = total_transferencia + total_transferencia_mixto
```

### Abonos
```javascript
monto_abonos_efectivo = SUM(monto WHERE metodo_pago = 'Efectivo')
monto_abonos_tarjeta = SUM(monto WHERE metodo_pago = 'Tarjeta')
monto_abonos_transferencia = SUM(monto WHERE metodo_pago = 'Transferencia')
monto_total_abonos = monto_abonos_efectivo + monto_abonos_tarjeta + monto_abonos_transferencia
```

### Totales Combinados
```javascript
total_efectivo_combinado = total_efectivo_final + monto_abonos_efectivo
total_tarjeta_combinado = total_tarjeta_final + monto_abonos_tarjeta
total_transferencia_combinado = total_transferencia_final + monto_abonos_transferencia
total_ingresos_combinado = total_ingresos + monto_total_abonos
```

## Zona Horaria

El sistema usa la zona horaria de Costa Rica (UTC-6).

### Utilidades (utils/timezone.js)
- `obtenerFechaActualCR()` - Fecha actual en Costa Rica (YYYY-MM-DD)
- `obtenerRangoDia()` - Rango completo del día (00:00:00 - 23:59:59)
- `formatearFechaSQL()` - Fecha formateada para SQL

### Importante
Las fechas en la base de datos deben estar en hora de Costa Rica para que los reportes y el cierre de caja funcionen correctamente.

## Verificación del Sistema

### Test 1: Abonos Aparecen en Cierre de Caja
```bash
# Crear abono
curl -X POST http://localhost:3001/api/cuentas-por-cobrar/1/abonos \
  -H "Content-Type: application/json" \
  -d '{"monto": 30000, "metodo_pago": "Efectivo"}'

# Verificar en cierre de caja
curl http://localhost:3001/api/cierrecaja/resumen-dia

# Resultado esperado:
# - monto_abonos_efectivo: 30000
# - total_efectivo_combinado incluye el abono
```

### Test 2: Reporte Financiero Completo
```bash
curl "http://localhost:3001/api/reportes/movimientos-financieros?fecha_desde=2025-11-18%2000:00:00&fecha_hasta=2025-11-18%2023:59:59"

# Resultado esperado:
# - Listado de todas las ventas
# - Listado de todos los abonos
# - Totales por método de pago
# - Totales combinados
```

### Test 3: Historial Completo
```bash
curl "http://localhost:3001/api/reportes/historial-completo?fecha_desde=2025-11-18%2000:00:00&fecha_hasta=2025-11-18%2023:59:59"

# Resultado esperado:
# - Todas las transacciones ordenadas cronológicamente
# - Ventas, abonos y movimientos de inventario mezclados
```

## Solución de Problemas

### Los abonos no aparecen en el cierre de caja
1. Verificar que los abonos tengan la fecha correcta de Costa Rica
2. Verificar el rango de fechas usado en la consulta
3. Verificar que el método de pago esté correctamente registrado

### Los totales no coinciden
1. Verificar que las ventas mixtas tengan correctamente asignados los montos por método
2. Verificar que no haya ventas duplicadas
3. Verificar que los abonos estén correctamente sumados

### La zona horaria es incorrecta
1. El sistema usa UTC-6 para Costa Rica
2. Verificar que las fechas en la base de datos estén en hora de Costa Rica
3. Usar las utilidades de timezone.js para todas las operaciones de fecha
