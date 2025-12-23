# Eliminación Inteligente de Joyas - Documentación

## Resumen

Esta funcionalidad implementa la eliminación física de joyas del inventario con validación inteligente de dependencias. A diferencia del comportamiento anterior (que solo marcaba como "Descontinuado"), ahora el sistema:

1. **Elimina físicamente** las joyas que no tienen dependencias críticas
2. **Protege datos históricos** marcando como descontinuadas las joyas con ventas o movimientos registrados
3. **Proporciona retroalimentación clara** sobre por qué una joya no puede eliminarse

---

## Comportamiento

### Eliminación Física
Una joya se elimina **completamente** de la base de datos cuando:
- ✅ No tiene ventas registradas (`items_venta`)
- ✅ No tiene movimientos de inventario (`movimientos_inventario`)
- ✅ No es componente de ningún set activo (`productos_compuestos`)
- ✅ No aparece en pedidos online (`items_pedido_online`)

### Marcado como Descontinuado
Una joya se marca como **Descontinuado** (sin eliminar) cuando:
- ❌ Tiene ventas registradas
- ❌ Tiene movimientos de inventario
- ❌ Es componente de algún set
- ❌ Aparece en pedidos online

---

## API Endpoints

### 1. DELETE /api/joyas/:id
Elimina una joya o la marca como descontinuada según sus dependencias.

**Autenticación**: Requerida

**Respuestas**:

#### Eliminación Exitosa (200 OK)
```json
{
  "success": true,
  "mensaje": "Joya eliminada completamente del sistema",
  "eliminado": true
}
```

#### Con Dependencias (409 Conflict)
```json
{
  "success": false,
  "error": "No se puede eliminar la joya debido a dependencias existentes",
  "mensaje": "La joya fue marcada como descontinuada porque tiene registros relacionados",
  "marcado_descontinuado": true,
  "dependencias": [
    {
      "tipo": "ventas",
      "cantidad": 5,
      "mensaje": "Esta joya está asociada a 5 venta(s) registrada(s)"
    },
    {
      "tipo": "movimientos",
      "cantidad": 12,
      "mensaje": "Esta joya tiene 12 movimiento(s) de inventario registrado(s)"
    }
  ]
}
```

#### No Encontrada (404 Not Found)
```json
{
  "error": "Joya no encontrada"
}
```

---

### 2. GET /api/joyas/:id/dependencias
Consulta las dependencias de una joya sin eliminarla.

**Autenticación**: Requerida

**Respuesta**:
```json
{
  "tiene_dependencias": true,
  "detalles": [
    {
      "tipo": "ventas",
      "cantidad": 5,
      "mensaje": "Esta joya está asociada a 5 venta(s) registrada(s)"
    },
    {
      "tipo": "movimientos",
      "cantidad": 12,
      "mensaje": "Esta joya tiene 12 movimiento(s) de inventario registrado(s)"
    },
    {
      "tipo": "sets",
      "cantidad": 2,
      "mensaje": "Esta joya es componente de 2 set(s): Set Anillos Oro, Trio Elegante"
    },
    {
      "tipo": "pedidos_online",
      "cantidad": 3,
      "mensaje": "Esta joya está en 3 pedido(s) online"
    }
  ]
}
```

---

## Migración de Base de Datos

### Archivo
`backend/migrations/add-joya-deletion-constraints.sql`

### Propósito
Configura las restricciones de claves foráneas (Foreign Keys) para:

1. **Prevenir eliminación accidental** de joyas con datos críticos
2. **Limpiar automáticamente** datos secundarios cuando una joya se elimina

### Estrategia de Restricciones

#### ON DELETE RESTRICT (Prevenir eliminación)
Estas tablas **bloquean** la eliminación de una joya si tienen referencias:
- `items_venta` - Historial de ventas
- `items_venta_dia` - Ventas temporales
- `movimientos_inventario` - Movimientos de stock
- `items_pedido_online` - Pedidos online
- `productos_compuestos` (como componente) - Si es parte de un set

#### ON DELETE CASCADE (Eliminar automáticamente)
Estas tablas se **limpian automáticamente** cuando se elimina una joya:
- `reservas_inventario` - Reservas temporales
- `auditoria_inventario` - Auditoría de cambios
- `imagenes_joya` - Galería de imágenes
- `variantes_producto` - Variantes del producto
- `productos_compuestos` (como set padre) - Si la joya es un set

### Ejecución
```bash
# Ejecutar en Supabase SQL Editor
# URL: https://mvujkbpbqyihixkbzthe.supabase.co/project/_/sql
# Copiar y ejecutar: backend/migrations/add-joya-deletion-constraints.sql
```

---

## Modelo de Datos

### Método: verificarDependencias(id)
```javascript
// backend/models/Joya.js

static async verificarDependencias(id) {
  // Retorna:
  // {
  //   tiene_dependencias: boolean,
  //   detalles: [
  //     { tipo: string, cantidad: number, mensaje: string }
  //   ]
  // }
}
```

**Optimización**: Usa queries con `count: 'exact', head: true` para evitar transferir datos innecesarios.

### Método: eliminar(id)
```javascript
// backend/models/Joya.js

static async eliminar(id) {
  // 1. Verifica dependencias
  // 2a. Si tiene dependencias: marca como Descontinuado
  // 2b. Si no tiene dependencias: elimina físicamente
  // 
  // Retorna:
  // {
  //   changes: number,
  //   eliminado: boolean,
  //   marcado_descontinuado: boolean,
  //   dependencias?: array  // Solo si marcado_descontinuado = true
  // }
}
```

---

## Pruebas

### Archivo de Prueba
`backend/tests/test-joya-deletion.js`

### Escenarios Cubiertos
1. ✅ Login de administrador
2. ✅ Crear joya sin dependencias
3. ✅ Verificar endpoint de dependencias
4. ✅ Eliminar físicamente joya sin dependencias
5. ✅ Verificar eliminación completa
6. ✅ Crear joya con movimientos (dependencias)
7. ✅ Intentar eliminar joya con dependencias
8. ✅ Verificar que se marcó como descontinuado

### Ejecutar Pruebas
```bash
# Asegurar que el backend esté corriendo
cd backend
npm start

# En otra terminal
node tests/test-joya-deletion.js
```

---

## Flujo de Usuario

### Caso 1: Joya Sin Dependencias

```
Usuario → DELETE /joyas/123
           ↓
Backend verifica dependencias
           ↓
    No hay dependencias
           ↓
Elimina físicamente de BD
           ↓
Elimina imagen de Cloudinary
           ↓
  Respuesta 200 OK
  { eliminado: true }
```

### Caso 2: Joya Con Dependencias

```
Usuario → DELETE /joyas/456
           ↓
Backend verifica dependencias
           ↓
Encuentra 5 ventas + 12 movimientos
           ↓
Marca estado = 'Descontinuado'
           ↓
  Respuesta 409 Conflict
  { 
    marcado_descontinuado: true,
    dependencias: [...]
  }
```

---

## Seguridad

### Validación CodeQL
✅ **0 alertas** de seguridad encontradas

### Protecciones Implementadas
1. **Autenticación requerida** - Solo usuarios autenticados pueden eliminar
2. **Validación de existencia** - Verifica que la joya existe antes de procesar
3. **Transacciones atómicas** - Las operaciones de BD son atómicas
4. **SQL Injection** - Prevención mediante uso de Supabase client parametrizado
5. **Manejo de errores** - Try-catch en todas las operaciones críticas

---

## Impacto en el Sistema

### Compatibilidad
✅ **Totalmente retrocompatible** - El endpoint mantiene la misma ruta

### Cambios de Comportamiento
- **Antes**: Siempre marcaba como "Descontinuado"
- **Ahora**: Elimina físicamente si no hay dependencias, marca como descontinuado si las hay

### Frontend Requerido
Los frontends (React POS y Next.js Storefront) deben actualizarse para:
1. Manejar código de estado 409 (dependencias encontradas)
2. Mostrar mensajes detallados de dependencias al usuario
3. Opcionalmente: llamar a `/dependencias` antes de eliminar para mostrar advertencias

---

## Ejemplo de Integración Frontend

### React (POS)
```javascript
async function eliminarJoya(joyaId) {
  try {
    const response = await axios.delete(`/api/joyas/${joyaId}`);
    
    if (response.data.eliminado) {
      alert('Joya eliminada exitosamente');
      // Recargar lista
    }
  } catch (error) {
    if (error.response?.status === 409) {
      const { dependencias } = error.response.data;
      const mensajes = dependencias.map(d => d.mensaje).join('\n');
      alert(`No se puede eliminar:\n\n${mensajes}\n\nLa joya fue marcada como descontinuada.`);
      // Recargar lista (ahora muestra descontinuado)
    } else {
      alert('Error al eliminar joya');
    }
  }
}
```

### Verificar Dependencias Antes
```javascript
async function verificarYEliminar(joyaId) {
  // 1. Verificar dependencias primero
  const { data: deps } = await axios.get(`/api/joyas/${joyaId}/dependencias`);
  
  if (deps.tiene_dependencias) {
    const mensajes = deps.detalles.map(d => d.mensaje).join('\n');
    const confirmar = confirm(
      `Esta joya tiene dependencias:\n\n${mensajes}\n\n` +
      `No se puede eliminar físicamente, se marcará como descontinuada.\n\n` +
      `¿Desea continuar?`
    );
    if (!confirmar) return;
  } else {
    const confirmar = confirm('¿Está seguro de eliminar esta joya? Esta acción no se puede deshacer.');
    if (!confirmar) return;
  }
  
  // 2. Proceder con eliminación
  await eliminarJoya(joyaId);
}
```

---

## Preguntas Frecuentes

### ¿Por qué no eliminar siempre?
Mantener el historial de ventas y movimientos es crítico para:
- Reportes financieros
- Auditorías
- Cumplimiento legal
- Análisis de negocio

### ¿Qué pasa con las imágenes?
Las imágenes en Cloudinary se eliminan automáticamente solo cuando la joya se elimina físicamente.

### ¿Puedo forzar la eliminación física?
No. Si hay dependencias críticas (ventas, movimientos), la joya se marca como descontinuada por seguridad de datos.

### ¿Las joyas descontinuadas aparecen en el inventario?
Sí, pero puedes filtrarlas usando el parámetro `estado=Activo` en el endpoint GET `/api/joyas`.

### ¿Qué pasa con los sets que contienen una joya eliminada?
Si intentas eliminar una joya que es componente de un set, la eliminación se previene y se marca como descontinuada.

---

## Checklist de Despliegue

Antes de desplegar a producción:

- [ ] Ejecutar migración SQL en Supabase
- [ ] Verificar que las restricciones FK están correctas
- [ ] Actualizar frontend para manejar código 409
- [ ] Probar eliminación con joya sin dependencias
- [ ] Probar eliminación con joya con dependencias
- [ ] Verificar endpoint de dependencias
- [ ] Documentar cambios para usuarios finales
- [ ] Actualizar changelog del proyecto

---

## Soporte

Para problemas o preguntas:
1. Revisar logs del backend para errores
2. Verificar que la migración SQL se ejecutó correctamente
3. Confirmar que las claves foráneas están configuradas
4. Revisar el código en `backend/models/Joya.js` y `backend/routes/joyas.js`

---

## Changelog

### v1.0 - 2025-12-23
- ✨ Implementación inicial de eliminación inteligente
- ✅ Validación de dependencias en 4 tablas críticas
- 🔒 Restricciones FK configuradas correctamente
- 📝 Documentación completa
- 🧪 Suite de pruebas implementada
- 🛡️ Validación de seguridad (CodeQL) aprobada
