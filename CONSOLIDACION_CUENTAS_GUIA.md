# Consolidación de Cuentas por Cobrar - Guía de Implementación

## 📋 Resumen

Esta implementación resuelve el problema de cuentas por cobrar duplicadas consolidando todas las cuentas activas de un cliente en una sola cuenta única. A partir de esta actualización:

- ✅ Cada cliente tiene **una sola cuenta activa** (estado "Pendiente")
- ✅ Múltiples ventas a crédito **se acumulan en la misma cuenta**
- ✅ Se mantiene un **historial completo** de todas las ventas y abonos
- ✅ Los abonos se aplican a la cuenta consolidada del cliente
- ✅ **No se crearán más cuentas duplicadas** gracias a un índice único

## 🔄 Cambios Implementados

### Backend

#### 1. Nueva Tabla: `movimientos_cuenta`
Registra el historial de todos los movimientos en una cuenta:
- Ventas a crédito
- Abonos (para referencia histórica completa)
- Ajustes manuales

```sql
CREATE TABLE movimientos_cuenta (
  id BIGSERIAL PRIMARY KEY,
  id_cuenta_por_cobrar BIGINT REFERENCES cuentas_por_cobrar(id),
  id_venta BIGINT REFERENCES ventas(id),
  tipo TEXT NOT NULL, -- 'venta_credito', 'abono', 'ajuste'
  monto NUMERIC(10, 2) NOT NULL,
  descripcion TEXT,
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT
);
```

#### 2. Modelo `CuentaPorCobrar` Actualizado

**Nuevo método:**
```javascript
CuentaPorCobrar.obtenerActivaPorCliente(id_cliente)
```
Busca la cuenta activa (estado "Pendiente") de un cliente.

**Método `crear()` modificado:**
- Verifica si existe una cuenta activa para el cliente
- Si existe: actualiza los montos y crea un movimiento
- Si no existe: crea una cuenta nueva y registra el movimiento inicial

#### 3. Nuevo Modelo: `MovimientoCuenta`

Gestiona el historial de movimientos:
```javascript
MovimientoCuenta.crear(movimientoData)
MovimientoCuenta.obtenerPorCuenta(id_cuenta_por_cobrar)
```

#### 4. Endpoint Actualizado

`GET /api/cuentas-por-cobrar/:id` ahora incluye:
```json
{
  "id": 1,
  "id_cliente": 100,
  "monto_total": 1500,
  "monto_pagado": 500,
  "saldo_pendiente": 1000,
  "abonos": [...],
  "movimientos": [
    {
      "tipo": "venta_credito",
      "monto": 1000,
      "descripcion": "Venta a crédito #123",
      "fecha_movimiento": "2024-01-15T10:30:00Z"
    },
    {
      "tipo": "venta_credito",
      "monto": 500,
      "descripcion": "Venta a crédito #124",
      "fecha_movimiento": "2024-01-20T14:15:00Z"
    }
  ]
}
```

### Frontend

#### DetalleCuentaPorCobrar Component

Se agregó una sección de "Historial de Ventas a Crédito" que muestra:
- Fecha de cada venta
- Tipo de movimiento
- Monto
- Descripción
- Número de venta asociado

## 🚀 Pasos de Migración

### 1. Backup de la Base de Datos

**⚠️ IMPORTANTE:** Haz un backup completo antes de ejecutar la migración.

```bash
# Ejemplo con pg_dump (ajusta según tu configuración)
pg_dump -h your-host -U your-user -d your-database > backup_before_consolidation.sql
```

### 2. Aplicar Migración de Esquema

Ejecuta el script de migración principal para crear las nuevas tablas e índices:

```sql
-- En Supabase SQL Editor o tu cliente PostgreSQL favorito
-- Ejecuta: backend/supabase-migration.sql (ya incluye la tabla movimientos_cuenta)
```

O si ya tienes la BD creada, solo ejecuta la parte nueva:

```sql
-- Crear tabla movimientos_cuenta
CREATE TABLE IF NOT EXISTS movimientos_cuenta (
  id BIGSERIAL PRIMARY KEY,
  id_cuenta_por_cobrar BIGINT NOT NULL REFERENCES cuentas_por_cobrar(id) ON DELETE CASCADE,
  id_venta BIGINT REFERENCES ventas(id),
  tipo TEXT NOT NULL,
  monto NUMERIC(10, 2) NOT NULL,
  descripcion TEXT,
  fecha_movimiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario TEXT
);

CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta_id_cuenta ON movimientos_cuenta(id_cuenta_por_cobrar);
CREATE INDEX IF NOT EXISTS idx_movimientos_cuenta_fecha ON movimientos_cuenta(fecha_movimiento);

-- Crear índice único para prevenir duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_cuenta_activa_por_cliente
ON cuentas_por_cobrar (id_cliente)
WHERE estado = 'Pendiente';
```

### 3. Consolidar Cuentas Existentes

Ejecuta el script de consolidación:

```bash
# En Supabase SQL Editor o psql
# Ejecuta: backend/migrations/consolidate-cuentas-por-cobrar.sql
```

Este script:
1. ✅ Identifica clientes con múltiples cuentas activas
2. ✅ Selecciona la cuenta más antigua como cuenta principal
3. ✅ Crea movimientos históricos para todas las ventas
4. ✅ Migra todos los abonos a la cuenta principal
5. ✅ Actualiza los totales consolidados
6. ✅ Marca las cuentas duplicadas con estado "Consolidada"
7. ✅ Muestra un reporte de la consolidación

**Salida esperada:**
```
========================================
CONSOLIDATION PLAN
========================================
Total clients with duplicate accounts: X
Client ID: 100 - Accounts to consolidate: 3 -> Keep account #45
  Total owed: 15000 | Total paid: 5000 | Remaining: 10000
...
========================================
MIGRATION COMPLETED
========================================
Accounts marked as consolidated: X
Active unique accounts: Y
========================================
```

### 4. Verificación Post-Migración

Ejecuta estas queries para verificar:

```sql
-- Verificar que no hay duplicados activos
SELECT id_cliente, COUNT(*) as cuentas_activas
FROM cuentas_por_cobrar
WHERE estado = 'Pendiente'
GROUP BY id_cliente
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas

-- Verificar movimientos creados
SELECT COUNT(*) FROM movimientos_cuenta;
-- Debe tener registros para todas las ventas y abonos históricos

-- Verificar totales
SELECT 
  c.id,
  c.id_cliente,
  c.monto_total,
  COUNT(m.id) as num_movimientos
FROM cuentas_por_cobrar c
LEFT JOIN movimientos_cuenta m ON m.id_cuenta_por_cobrar = c.id
WHERE c.estado = 'Pendiente'
GROUP BY c.id, c.id_cliente, c.monto_total;
```

### 5. Desplegar Código Actualizado

```bash
# Backend
cd backend
npm install  # Si hay nuevas dependencias
npm start

# Frontend
cd frontend
npm install
npm start
```

## 🧪 Testing

### Tests Unitarios

```bash
cd backend
node tests/test-consolidated-simple.js
```

### Tests de Integración (requiere servidor corriendo)

```bash
cd backend
npm start  # En una terminal
# En otra terminal:
node tests/test-consolidated-accounts.js
```

## 📊 Comportamiento del Sistema

### Antes de la Implementación
```
Cliente A hace venta a crédito #1 (₡500)
  → Crea Cuenta #101

Cliente A hace venta a crédito #2 (₡300)
  → Crea Cuenta #102 ❌ DUPLICADO

Cliente A tiene 2 cuentas activas
```

### Después de la Implementación
```
Cliente A hace venta a crédito #1 (₡500)
  → Crea Cuenta #101
  → Registra Movimiento: venta_credito ₡500

Cliente A hace venta a crédito #2 (₡300)
  → Actualiza Cuenta #101: ₡500 + ₡300 = ₡800 ✅
  → Registra Movimiento: venta_credito ₡300

Cliente A tiene 1 cuenta activa con historial completo
```

## 🔒 Prevención de Duplicados

El índice único `idx_unique_cuenta_activa_por_cliente` garantiza que:
- Solo puede existir **1 cuenta con estado "Pendiente"** por cliente
- Si se intenta crear un duplicado, la BD rechazará la operación
- El código maneja esto correctamente actualizando la cuenta existente

## 🎯 Criterios de Aceptación

- ✅ **Cada cliente tiene una sola cuenta activa**
  - Verificado con índice único en la BD
  - Verificado con tests unitarios

- ✅ **Los montos se consolidan correctamente**
  - Todas las ventas suman al monto_total
  - El saldo_pendiente refleja el total menos los abonos

- ✅ **El script de migración conserva todos los datos**
  - Los abonos se migran a la cuenta principal
  - El historial de ventas se registra en movimientos_cuenta
  - Nada se elimina, solo se consolida

- ✅ **Los usuarios pueden consultar la deuda total por cliente**
  - Vista de lista muestra el total consolidado
  - Vista de detalle muestra el historial completo

- ✅ **No se generan nuevas cuentas duplicadas**
  - Lógica de `crear()` modificada
  - Índice único en la BD
  - Tests verifican el comportamiento

- ✅ **Pruebas unitarias garantizan el funcionamiento**
  - 5 tests cubren los casos principales
  - Todos pasan exitosamente

## 🐛 Solución de Problemas

### Error: "duplicate key value violates unique constraint"

**Causa:** Ya existe una cuenta activa para el cliente.

**Solución:** Esto es normal y esperado. El código maneja este caso actualizando la cuenta existente en lugar de crear una nueva.

### Cuentas consolidadas siguen apareciendo

**Causa:** El filtro en el frontend puede estar mostrando todas las cuentas.

**Solución:** Asegúrate de filtrar por `estado = 'Pendiente'`:
```javascript
obtenerCuentasPorCobrar({ estado: 'Pendiente' })
```

### Movimientos no aparecen en el detalle

**Causa:** El endpoint puede no estar retornando los movimientos.

**Solución:** Verifica que la respuesta incluya:
```javascript
const movimientos = await MovimientoCuenta.obtenerPorCuenta(id);
res.json({ ...cuenta, abonos, movimientos });
```

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs del servidor
2. Verifica las queries de verificación post-migración
3. Consulta el backup antes de realizar cambios manuales
4. Revisa los tests para entender el comportamiento esperado

## 📝 Notas Adicionales

- Las cuentas con estado "Pagada" o "Consolidada" NO se ven afectadas por la lógica de consolidación
- Solo las cuentas "Pendiente" se consideran "activas"
- La migración es idempotente: se puede ejecutar múltiples veces sin problemas
- Los movimientos históricos se crean con `usuario = 'system_migration'`
- La fecha del movimiento refleja la fecha original de la venta/abono

## ✅ Checklist de Implementación

- [ ] Backup de base de datos realizado
- [ ] Script de migración de esquema ejecutado
- [ ] Script de consolidación ejecutado
- [ ] Queries de verificación ejecutadas exitosamente
- [ ] Tests unitarios pasan
- [ ] Código backend desplegado
- [ ] Código frontend desplegado
- [ ] Prueba manual: crear venta a crédito
- [ ] Prueba manual: crear segunda venta a mismo cliente
- [ ] Verificar: solo una cuenta activa por cliente
- [ ] Verificar: historial de movimientos visible en UI
- [ ] Prueba manual: registrar abono
- [ ] Verificar: saldos actualizados correctamente
