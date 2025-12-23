# Diagrama de Consolidación de Cuentas por Cobrar

## Flujo Anterior (con duplicados) ❌

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente: Juan Pérez (ID: 100)                               │
└─────────────────────────────────────────────────────────────┘

Venta #1 (Enero 5)
    ↓
┌────────────────────┐
│ Cuenta #201        │
│ Monto: ₡5,000      │
│ Saldo: ₡5,000      │
│ Estado: Pendiente  │
└────────────────────┘

Venta #2 (Enero 10)
    ↓
┌────────────────────┐  ❌ DUPLICADO!
│ Cuenta #202        │
│ Monto: ₡3,000      │
│ Saldo: ₡3,000      │
│ Estado: Pendiente  │
└────────────────────┘

Venta #3 (Enero 15)
    ↓
┌────────────────────┐  ❌ DUPLICADO!
│ Cuenta #203        │
│ Monto: ₡2,000      │
│ Saldo: ₡2,000      │
│ Estado: Pendiente  │
└────────────────────┘

Resultado:
- 3 cuentas separadas ❌
- Difícil ver deuda total ❌
- Usuario debe buscar en múltiples lugares ❌
```

## Flujo Nuevo (consolidado) ✅

```
┌─────────────────────────────────────────────────────────────┐
│ Cliente: Juan Pérez (ID: 100)                               │
└─────────────────────────────────────────────────────────────┘

Venta #1 (Enero 5) → ₡5,000
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Cuenta #201 (ÚNICA)                                          │
│ ════════════════════════════════════════════════════════════ │
│ Monto Total: ₡5,000                                          │
│ Saldo Pendiente: ₡5,000                                      │
│ Estado: Pendiente                                            │
│                                                              │
│ Movimientos:                                                 │
│  • Venta #1 - ₡5,000 (Enero 5)                              │
└──────────────────────────────────────────────────────────────┘

Venta #2 (Enero 10) → ₡3,000
    ↓ (actualiza la misma cuenta)
┌──────────────────────────────────────────────────────────────┐
│ Cuenta #201 (ÚNICA)                                          │
│ ════════════════════════════════════════════════════════════ │
│ Monto Total: ₡8,000  ← actualizado                          │
│ Saldo Pendiente: ₡8,000                                      │
│ Estado: Pendiente                                            │
│                                                              │
│ Movimientos:                                                 │
│  • Venta #1 - ₡5,000 (Enero 5)                              │
│  • Venta #2 - ₡3,000 (Enero 10)  ← nuevo                    │
└──────────────────────────────────────────────────────────────┘

Venta #3 (Enero 15) → ₡2,000
    ↓ (actualiza la misma cuenta)
┌──────────────────────────────────────────────────────────────┐
│ Cuenta #201 (ÚNICA)                                          │
│ ════════════════════════════════════════════════════════════ │
│ Monto Total: ₡10,000  ← actualizado                         │
│ Saldo Pendiente: ₡10,000                                     │
│ Estado: Pendiente                                            │
│                                                              │
│ Movimientos:                                                 │
│  • Venta #1 - ₡5,000 (Enero 5)                              │
│  • Venta #2 - ₡3,000 (Enero 10)                             │
│  • Venta #3 - ₡2,000 (Enero 15)  ← nuevo                    │
└──────────────────────────────────────────────────────────────┘

Resultado:
- 1 cuenta única ✅
- Deuda total visible de inmediato ✅
- Historial completo de todas las ventas ✅
```

## Con Abonos

```
Abono #1 (Enero 20) → ₡4,000
    ↓
┌──────────────────────────────────────────────────────────────┐
│ Cuenta #201                                                  │
│ ════════════════════════════════════════════════════════════ │
│ Monto Total: ₡10,000                                         │
│ Monto Pagado: ₡4,000  ← actualizado                         │
│ Saldo Pendiente: ₡6,000  ← actualizado                      │
│ Estado: Pendiente                                            │
│                                                              │
│ Movimientos:                                                 │
│  • Venta #1 - ₡5,000 (Enero 5)                              │
│  • Venta #2 - ₡3,000 (Enero 10)                             │
│  • Venta #3 - ₡2,000 (Enero 15)                             │
│                                                              │
│ Abonos:                                                      │
│  • Abono ₡4,000 - Efectivo (Enero 20)                       │
└──────────────────────────────────────────────────────────────┘

Venta #4 (Enero 25) → ₡1,500
    ↓ (sigue usando la misma cuenta)
┌──────────────────────────────────────────────────────────────┐
│ Cuenta #201                                                  │
│ ════════════════════════════════════════════════════════════ │
│ Monto Total: ₡11,500  ← actualizado                         │
│ Monto Pagado: ₡4,000                                         │
│ Saldo Pendiente: ₡7,500  ← actualizado                      │
│ Estado: Pendiente                                            │
│                                                              │
│ Movimientos:                                                 │
│  • Venta #1 - ₡5,000 (Enero 5)                              │
│  • Venta #2 - ₡3,000 (Enero 10)                             │
│  • Venta #3 - ₡2,000 (Enero 15)                             │
│  • Venta #4 - ₡1,500 (Enero 25)  ← nuevo                    │
│                                                              │
│ Abonos:                                                      │
│  • Abono ₡4,000 - Efectivo (Enero 20)                       │
└──────────────────────────────────────────────────────────────┘
```

## Arquitectura Técnica

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                         │
│                                                              │
│  POST /api/ventas                                           │
│      ↓                                                       │
│  CuentaPorCobrar.crear()                                    │
│      ↓                                                       │
│  ┌──────────────────────────────────┐                      │
│  │ 1. obtenerActivaPorCliente()     │                      │
│  │    ↓                             │                      │
│  │ 2. ¿Existe cuenta activa?        │                      │
│  │    ├─ SÍ → Actualizar cuenta     │                      │
│  │    │        + Crear movimiento   │                      │
│  │    └─ NO → Crear cuenta nueva    │                      │
│  │              + Crear movimiento   │                      │
│  └──────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (Supabase)                        │
│                                                              │
│  ┌────────────────────┐    ┌─────────────────────┐         │
│  │ cuentas_por_cobrar │    │ movimientos_cuenta  │         │
│  ├────────────────────┤    ├─────────────────────┤         │
│  │ id                 │    │ id                  │         │
│  │ id_cliente  ←──────┼────┤ id_cuenta_por_...  │         │
│  │ monto_total        │    │ id_venta            │         │
│  │ monto_pagado       │    │ tipo                │         │
│  │ saldo_pendiente    │    │ monto               │         │
│  │ estado             │    │ descripcion         │         │
│  └────────────────────┘    └─────────────────────┘         │
│           ↑                                                 │
│           │ UNIQUE INDEX                                    │
│           │ idx_unique_cuenta_activa_por_cliente            │
│           │ WHERE estado = 'Pendiente'                      │
│           │ (previene duplicados)                           │
└─────────────────────────────────────────────────────────────┘
```

## Estados de Cuenta

```
┌──────────────┐
│  Pendiente   │ ← Solo UNA por cliente (índice único)
└──────┬───────┘
       │
       │ Todos los abonos aplicados
       ↓
┌──────────────┐
│    Pagada    │ ← Ya no se puede crear otra "Pendiente"
└──────────────┘

┌──────────────┐
│ Consolidada  │ ← Cuentas antiguas después de migración
└──────────────┘   (no afectan el índice único)
```

## Prevención de Duplicados

```sql
-- Índice único en la base de datos
CREATE UNIQUE INDEX idx_unique_cuenta_activa_por_cliente
ON cuentas_por_cobrar (id_cliente)
WHERE estado = 'Pendiente';

-- Esto garantiza que PostgreSQL rechace:
INSERT INTO cuentas_por_cobrar (id_cliente, estado, ...)
VALUES (100, 'Pendiente', ...);  -- ❌ ERROR si ya existe

-- El código backend maneja esto actualizando la existente
```

## Flujo de Migración

```
┌─────────────────────────────────────────────────────────────┐
│  1. ANTES DE MIGRACIÓN                                      │
│                                                              │
│  Cliente 100:                                               │
│    • Cuenta #1 - ₡5,000 (Pendiente)                        │
│    • Cuenta #2 - ₡3,000 (Pendiente)  ← duplicado           │
│    • Cuenta #3 - ₡2,000 (Pendiente)  ← duplicado           │
└─────────────────────────────────────────────────────────────┘
                        ↓
                 RUN MIGRATION
                        ↓
┌─────────────────────────────────────────────────────────────┐
│  2. DESPUÉS DE MIGRACIÓN                                    │
│                                                              │
│  Cliente 100:                                               │
│    • Cuenta #1 - ₡10,000 (Pendiente) ← CONSOLIDADA         │
│      └─ Movimientos:                                        │
│         • Venta original cuenta #1 - ₡5,000                │
│         • Venta original cuenta #2 - ₡3,000                │
│         • Venta original cuenta #3 - ₡2,000                │
│    • Cuenta #2 - ₡3,000 (Consolidada) ← histórica          │
│    • Cuenta #3 - ₡2,000 (Consolidada) ← histórica          │
└─────────────────────────────────────────────────────────────┘
```
