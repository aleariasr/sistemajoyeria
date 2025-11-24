# 🚧 TRABAJO EN PROGRESO - Nuevas Funcionalidades

## ✅ COMPLETADO (Backend)

### 1. Sistema de Ingresos Extras
**Archivos creados:**
- `backend/models/IngresoExtra.js`
- `backend/routes/ingresos-extras.js`
- Tabla SQL: `ingresos_extras`

**Funcionalidad:**
- Registrar ingresos de dinero fuera de ventas
- Tipos: Fondo de Caja, Préstamo, Devolución, Otros
- Métodos de pago: Efectivo, Tarjeta, Transferencia
- Integrado con cierre de caja
- Marca ingresos como cerrados

**Endpoints:**
- `GET /api/ingresos-extras` - Listar todos
- `GET /api/ingresos-extras/resumen` - Resumen
- `GET /api/ingresos-extras/:id` - Obtener uno
- `POST /api/ingresos-extras` - Crear nuevo

### 2. Sistema de Devoluciones/Reclamos
**Archivos creados:**
- `backend/models/Devolucion.js`
- `backend/routes/devoluciones.js`
- Tabla SQL: `devoluciones`

**Funcionalidad:**
- Registrar devoluciones de productos
- Tipos: Reembolso, Cambio, Nota de Crédito
- Estados: Pendiente, Aprobada, Rechazada, Procesada
- Ajuste automático de inventario
- Registro en movimientos de inventario

**Endpoints:**
- `GET /api/devoluciones` - Listar todas
- `GET /api/devoluciones/resumen` - Resumen
- `GET /api/devoluciones/:id` - Obtener una
- `GET /api/devoluciones/venta/:id_venta` - Por venta
- `POST /api/devoluciones` - Crear nueva
- `POST /api/devoluciones/:id/procesar` - Aprobar/Rechazar

### 3. Historial de Ventas Completo
**Modificado:**
- `backend/routes/ventas.js`

**Funcionalidad:**
- GET `/api/ventas` ahora devuelve ventas del día + historial
- Ventas del día marcadas con `es_venta_dia: true`
- Sin duplicados después del cierre
- Ordenadas cronológicamente

### 4. Cierre de Caja Mejorado
**Modificado:**
- `backend/routes/cierrecaja.js`

**Funcionalidad:**
- Incluye ingresos extras en el resumen
- Totales combinados: ventas + abonos + ingresos extras
- Desglose completo por método de pago:
  - Efectivo: ventas + abonos + ingresos extras
  - Tarjeta: ventas + abonos + ingresos extras
  - Transferencia: ventas + abonos + ingresos extras
- Marca ingresos extras como cerrados al cerrar caja

---

## 🔄 PENDIENTE (Frontend)

### 1. Componente de Ingresos Extras
**Archivo a crear:** `frontend/src/components/IngresosExtras.js`

**Funciones necesarias:**
- Formulario para registrar ingreso extra
- Validación de campos (tipo, monto, método, descripción)
- Lista de ingresos extras del día
- Filtros por tipo y método de pago
- Resumen de totales por tipo

**UI sugerida:**
```
┌──────────────────────────────────────┐
│ 💵 Ingresos Extras                  │
├──────────────────────────────────────┤
│                                      │
│ [Botón: Nuevo Ingreso]              │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Lista de Ingresos del Día       │ │
│ │ - ID | Tipo | Monto | Método    │ │
│ │ - ...                           │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Total Efectivo: ₡X,XXX              │
│ Total Tarjeta: ₡X,XXX               │
│ Total Transferencia: ₡X,XXX         │
└──────────────────────────────────────┘
```

### 2. Componente de Devoluciones
**Archivo a crear:** `frontend/src/components/Devoluciones.js`

**Funciones necesarias:**
- Buscar venta por ID
- Seleccionar producto a devolver
- Formulario de devolución:
  - Cantidad a devolver
  - Motivo
  - Tipo (Reembolso/Cambio/Nota de Crédito)
  - Método de reembolso (si aplica)
- Lista de devoluciones pendientes
- Aprobar/Rechazar devolución (solo admin)
- Historial de devoluciones

**UI sugerida:**
```
┌──────────────────────────────────────┐
│ 🔄 Devoluciones y Reclamos          │
├──────────────────────────────────────┤
│                                      │
│ [Buscar Venta: ____] [Buscar]       │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Pendientes de Aprobación (Admin)│ │
│ │ - Dev #1: Producto X - [Aprobar]│ │
│ │ - Dev #2: Producto Y - [Aprobar]│ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Historial de Devoluciones       │ │
│ │ - ...                           │ │
│ └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### 3. Actualizar HistorialVentas
**Archivo a modificar:** `frontend/src/components/HistorialVentas.js`

**Cambios necesarios:**
- Mostrar badge "Venta del Día" si `es_venta_dia === true`
- Diferentes colores para distinguir:
  - Verde claro: Ventas del día
  - Blanco: Ventas del historial
- Mantener toda la funcionalidad existente

**Código sugerido:**
```jsx
{venta.es_venta_dia && (
  <span className="badge badge-info">📋 Venta del Día</span>
)}
```

### 4. Actualizar CierreCaja
**Archivo a modificar:** `frontend/src/components/CierreCaja.js`

**Cambios necesarios:**
- Mostrar sección de ingresos extras
- Tabla con lista de ingresos extras del día
- Totales de ingresos extras por método de pago
- Incluir en totales combinados

**Nueva sección:**
```jsx
{/* Ingresos Extras del Día */}
{ingresosExtras.length > 0 && (
  <div className="card">
    <h3>💵 Ingresos Extras del Día</h3>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Tipo</th>
          <th>Descripción</th>
          <th>Método</th>
          <th>Monto</th>
        </tr>
      </thead>
      <tbody>
        {ingresosExtras.map(ingreso => (
          <tr key={ingreso.id}>
            <td>{ingreso.id}</td>
            <td>{ingreso.tipo}</td>
            <td>{ingreso.descripcion}</td>
            <td>{ingreso.metodo_pago}</td>
            <td>{formatearMoneda(ingreso.monto)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
```

### 5. Crear Componente Ticket de Cierre
**Archivo a crear:** `frontend/src/components/TicketCierreCaja.js`

**Contenido del ticket:**
```
═══════════════════════════════════════
          CIERRE DE CAJA
═══════════════════════════════════════
Fecha: DD/MM/YYYY HH:MM
Usuario: [Nombre del usuario]
═══════════════════════════════════════

VENTAS DE CONTADO
─────────────────────────────────────
Total Ventas:          X
Monto Total:           ₡X,XXX

Por Método de Pago:
  Efectivo:            ₡X,XXX
  Tarjeta:             ₡X,XXX
  Transferencia:       ₡X,XXX
  Mixto:               ₡X,XXX

ABONOS A CRÉDITOS
─────────────────────────────────────
Total Abonos:          X
Monto Total:           ₡X,XXX

Por Método de Pago:
  Efectivo:            ₡X,XXX
  Tarjeta:             ₡X,XXX
  Transferencia:       ₡X,XXX

INGRESOS EXTRAS
─────────────────────────────────────
Total Ingresos Extra:  X
Monto Total:           ₡X,XXX

Por Tipo:
  Fondo de Caja:       ₡X,XXX
  Préstamos:           ₡X,XXX
  Otros:               ₡X,XXX

Por Método de Pago:
  Efectivo:            ₡X,XXX
  Tarjeta:             ₡X,XXX
  Transferencia:       ₡X,XXX

═══════════════════════════════════════
TOTALES GENERALES
═══════════════════════════════════════
Efectivo Total:        ₡X,XXX
Tarjeta Total:         ₡X,XXX
Transferencia Total:   ₡X,XXX
───────────────────────────────────────
TOTAL GENERAL:         ₡X,XXX
═══════════════════════════════════════

Observaciones: ___________________
_________________________________

Firma: _____________________
═══════════════════════════════════════
```

### 6. Agregar Rutas en App.js
**Archivo a modificar:** `frontend/src/App.js`

**Rutas a agregar:**
```jsx
<Route path="/ingresos-extras" element={<IngresosExtras />} />
<Route path="/devoluciones" element={<Devoluciones />} />
```

**Links en Sidebar:**
```jsx
<li>
  <Link to="/ingresos-extras">
    <span className="icon">💵</span>
    <span>Ingresos Extras</span>
  </Link>
</li>
<li>
  <Link to="/devoluciones">
    <span className="icon">🔄</span>
    <span>Devoluciones</span>
  </Link>
</li>
```

### 7. Actualizar services/api.js
**Archivo a modificar:** `frontend/src/services/api.js`

**Agregar endpoints:**
```javascript
// ------- INGRESOS EXTRAS -------
export const obtenerIngresosExtras = (filtros = {}) => api.get('/ingresos-extras', { params: filtros });
export const obtenerIngresoExtra = (id) => api.get(`/ingresos-extras/${id}`);
export const crearIngresoExtra = (data) => api.post('/ingresos-extras', data);
export const obtenerResumenIngresosExtras = (filtros = {}) => api.get('/ingresos-extras/resumen', { params: filtros });

// ------- DEVOLUCIONES -------
export const obtenerDevoluciones = (filtros = {}) => api.get('/devoluciones', { params: filtros });
export const obtenerDevolucion = (id) => api.get(`/devoluciones/${id}`);
export const crearDevolucion = (data) => api.post('/devoluciones', data);
export const procesarDevolucion = (id, data) => api.post(`/devoluciones/${id}/procesar`, data);
export const obtenerDevolucionesPorVenta = (idVenta) => api.get(`/devoluciones/venta/${idVenta}`);
export const obtenerResumenDevoluciones = (filtros = {}) => api.get('/devoluciones/resumen', { params: filtros });
```

---

## 🧪 TESTING REQUERIDO

### Tests de Backend
1. **Ingresos Extras**
   - [ ] Crear ingreso extra con todos los tipos
   - [ ] Validar campos requeridos
   - [ ] Obtener lista de ingresos
   - [ ] Filtrar por tipo y método de pago
   - [ ] Marcar como cerrado en cierre de caja
   - [ ] Cálculos de totales correctos

2. **Devoluciones**
   - [ ] Crear devolución de cada tipo
   - [ ] Validar que no se devuelva más de lo vendido
   - [ ] Aprobar devolución y verificar ajuste de stock
   - [ ] Rechazar devolución
   - [ ] Cálculos de reembolso correctos

3. **Historial de Ventas**
   - [ ] Verificar que aparezcan ventas del día
   - [ ] Verificar que no haya duplicados después del cierre
   - [ ] Verificar orden cronológico
   - [ ] Verificar marca `es_venta_dia`

4. **Cierre de Caja**
   - [ ] Verificar inclusión de ingresos extras
   - [ ] Verificar totales combinados
   - [ ] Verificar desglose por método de pago
   - [ ] Verificar que ingresos extras se marquen como cerrados

### Tests de Frontend (cuando esté implementado)
1. **UI/UX**
   - [ ] Formularios validan correctamente
   - [ ] Mensajes de error claros
   - [ ] Feedback visual de acciones
   - [ ] Responsivo en móvil

2. **Integración**
   - [ ] CRUD de ingresos extras funciona
   - [ ] CRUD de devoluciones funciona
   - [ ] Historial muestra ventas del día
   - [ ] Cierre de caja incluye todos los módulos
   - [ ] Ticket de cierre se imprime correctamente

---

## 📝 REVISIÓN FINAL PENDIENTE

### Archivos a Revisar Exhaustivamente
1. **Backend Models** (11 archivos)
   - [ ] Venta.js
   - [ ] VentaDia.js
   - [ ] ItemVenta.js
   - [ ] ItemVentaDia.js
   - [ ] Joya.js
   - [ ] Cliente.js
   - [ ] Usuario.js
   - [ ] CuentaPorCobrar.js
   - [ ] Abono.js
   - [ ] IngresoExtra.js (nuevo)
   - [ ] Devolucion.js (nuevo)

2. **Backend Routes** (10 archivos)
   - [ ] ventas.js
   - [ ] joyas.js
   - [ ] clientes.js
   - [ ] auth.js
   - [ ] movimientos.js
   - [ ] reportes.js
   - [ ] cierrecaja.js
   - [ ] cuentas-por-cobrar.js
   - [ ] ingresos-extras.js (nuevo)
   - [ ] devoluciones.js (nuevo)

3. **Frontend Components** (20+ archivos)
   - [ ] Ventas.js
   - [ ] HistorialVentas.js
   - [ ] CierreCaja.js
   - [ ] CuentasPorCobrar.js
   - [ ] Todos los demás componentes
   - [ ] IngresosExtras.js (nuevo, pendiente)
   - [ ] Devoluciones.js (nuevo, pendiente)
   - [ ] TicketCierreCaja.js (nuevo, pendiente)

### Verificaciones de Código
- [ ] No hay números hardcodeados
- [ ] Todos los cálculos usan parseFloat correctamente
- [ ] Tolerancia de redondeo (0.01) en comparaciones
- [ ] Todas las fechas usan formato ISO 8601
- [ ] Validaciones completas en backend y frontend
- [ ] Manejo de errores apropiado
- [ ] Mensajes de error descriptivos

---

## 🚀 DEPLOYMENT

### Pre-deployment Checklist
- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar variables de entorno
- [ ] Probar instalación limpia en local
- [ ] Probar todas las funcionalidades
- [ ] Verificar que no hay console.log innecesarios
- [ ] Verificar que no hay TODOs pendientes

### Railway
- [ ] Variables de entorno configuradas
- [ ] Build exitoso
- [ ] Servidor inicia correctamente
- [ ] Todas las rutas funcionan
- [ ] Base de datos conecta correctamente

---

## 📚 DOCUMENTACIÓN PENDIENTE

### Actualizar
- [ ] README.md con nuevas funcionalidades
- [ ] CAMBIOS_REALIZADOS.md con todo lo nuevo
- [ ] API documentation (opcional)
- [ ] Guías de usuario (opcional)

---

**Estado Actual:** Backend completo, Frontend pendiente  
**Próximo Paso:** Implementar componentes de frontend  
**Estimado:** 2-3 horas más de trabajo para completar todo
