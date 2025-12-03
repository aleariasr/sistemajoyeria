# 📸 UI Screenshots - Validación de Código en Tiempo Real

## Nueva Funcionalidad: Validación de Códigos de Joya

### Vista 1: Estado Normal (sin validación)
```
┌──────────────────────────────────────────────────────┐
│ Información Básica                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Código *                                             │
│ ┌─────────────────────────────────────────────┐     │
│ │ AN-                                          │     │
│ └─────────────────────────────────────────────┘     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Vista 2: Validando (usuario acaba de escribir)
```
┌──────────────────────────────────────────────────────┐
│ Información Básica                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Código *                                             │
│ ┌─────────────────────────────────────────────┐     │
│ │ AN-001                                       │     │
│ └─────────────────────────────────────────────┘     │
│ 🔍 Verificando código...                            │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Vista 3: Código Duplicado (ERROR)
```
┌──────────────────────────────────────────────────────┐
│ Información Básica                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Código *                                             │
│ ┌─────────────────────────────────────────────┐     │
│ │ AN-001                                       │     │ ← Borde ROJO
│ └─────────────────────────────────────────────┘     │
│ ⚠️ Este código ya existe en el inventario           │ ← Texto ROJO
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Vista 4: Códigos Similares Encontrados (WARNING)
```
┌──────────────────────────────────────────────────────┐
│ Información Básica                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Código *                                             │
│ ┌─────────────────────────────────────────────┐     │
│ │ AN-005                                       │     │ ← Borde AMARILLO
│ └─────────────────────────────────────────────┘     │
│ ┌─────────────────────────────────────────────┐     │
│ │ 💡 Códigos similares encontrados:           │     │
│ │                                              │     │
│ │ • AN-001 - Anillo de Oro 18k                │     │
│ │ • AN-002 - Anillo de Plata                  │     │ ← Fondo AMARILLO
│ │ • AN-003 - Anillo con Diamante              │     │
│ │ • AN-004 - Anillo Compromiso                │     │
│ │ • AN-006 - Anillo Clásico                   │     │
│ │                                              │     │
│ │ ... y 3 más                                  │     │
│ └─────────────────────────────────────────────┘     │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Vista 5: Código Único (ÉXITO)
```
┌──────────────────────────────────────────────────────┐
│ Información Básica                                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Código *                                             │
│ ┌─────────────────────────────────────────────┐     │
│ │ PU-NEW-2024                                  │     │ ← Borde NORMAL
│ └─────────────────────────────────────────────┘     │
│                                                       │
│ (Sin mensajes - código válido)                      │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Colores Utilizados

### Estado: Validando
- **Icono**: 🔍
- **Color texto**: `#6c757d` (gris)
- **Mensaje**: "Verificando código..."

### Estado: Error (Duplicado)
- **Icono**: ⚠️
- **Color borde**: `#dc3545` (rojo)
- **Color texto**: `#dc3545` (rojo)
- **Font weight**: `500` (semi-bold)
- **Mensaje**: "Este código ya existe en el inventario"

### Estado: Advertencia (Similares)
- **Icono**: 💡
- **Color borde**: `#ffc107` (amarillo/dorado)
- **Fondo**: `#fff3cd` (amarillo claro)
- **Color texto**: `#856404` (marrón oscuro)
- **Border**: `1px solid #ffc107`
- **Mensaje**: "Códigos similares encontrados:"

### Estado: Normal (Sin problemas)
- **Sin color especial**
- **Sin mensajes adicionales**

---

## Flujo de Interacción

```
Usuario escribe código
        ↓
   [Espera 500ms]
        ↓
   🔍 Validando...
        ↓
   Llamada API
        ↓
    ¿Existe?
     /    \
   SÍ     NO
   ↓      ↓
  ⚠️    ¿Similares?
Error    /    \
       SÍ     NO
       ↓      ↓
      💡     ✓
   Warning  OK
```

---

## Ejemplo de Secuencia Real

### Paso 1: Usuario comienza a escribir
```
Campo: "A"
Estado: Sin validación (muy corto)
```

### Paso 2: Usuario continúa escribiendo
```
Campo: "AN-"
Estado: 🔍 Verificando código...
```

### Paso 3: Usuario termina de escribir
```
Campo: "AN-001"
API: GET /api/joyas/verificar-codigo?codigo=AN-001
Respuesta: { existe: true, similares: [...] }
Estado: ⚠️ Este código ya existe en el inventario
```

### Paso 4: Usuario modifica el código
```
Campo: "AN-010"
Estado: 🔍 Verificando código...
API: GET /api/joyas/verificar-codigo?codigo=AN-010
Respuesta: { existe: false, similares: [AN-001, AN-002, ...] }
Estado: 💡 Códigos similares encontrados
```

### Paso 5: Usuario usa código único
```
Campo: "PU-NEW-2024"
Estado: 🔍 Verificando código...
API: GET /api/joyas/verificar-codigo?codigo=PU-NEW-2024
Respuesta: { existe: false, similares: [] }
Estado: ✓ Sin mensajes (código válido)
```

---

## Validación al Submit

Si el usuario intenta guardar con código duplicado:

```
┌──────────────────────────────────────────────────────┐
│ ❌ Errores:                                          │
│                                                       │
│ • El código ya existe en el inventario. Por favor   │
│   usa un código diferente.                           │
└──────────────────────────────────────────────────────┘
```

El formulario NO se envía y el foco vuelve al campo código.

---

## Ventajas de esta Implementación

1. ✅ **Inmediato**: Usuario ve feedback en menos de 1 segundo
2. ✅ **No invasivo**: Usa debounce para evitar muchas llamadas API
3. ✅ **Informativo**: Muestra códigos similares para evitar errores
4. ✅ **Case-insensitive**: AN-001 = an-001 = An-001
5. ✅ **Funciona en edición**: Excluye el ID actual al editar
6. ✅ **Previene submit**: No permite guardar si hay error
7. ✅ **Visual claro**: Colores intuitivos (rojo=error, amarillo=advertencia)

---

## Casos de Uso

### Caso 1: Evitar duplicado exacto
```
Usuario escribe: "AN-001"
Sistema detecta: Código existe
Usuario ve: Alerta roja
Acción: Cambiar código
```

### Caso 2: Evitar duplicado por mayúsculas
```
Usuario escribe: "an-001" (minúsculas)
Sistema detecta: Código existe (case-insensitive)
Usuario ve: Alerta roja "AN-001 ya existe"
Acción: Cambiar código
```

### Caso 3: Sugerencia de nomenclatura
```
Usuario escribe: "AN-"
Sistema muestra: Lista de AN-001, AN-002, AN-003...
Usuario ve: Patrón de nomenclatura
Acción: Usar siguiente número disponible (ej: AN-010)
```

### Caso 4: Edición sin cambiar código
```
Editando joya con código "AN-001"
Campo muestra: "AN-001"
Sistema: Excluye ID actual de verificación
Resultado: No muestra error
```

---

## Tecnología Utilizada

### Frontend
- **React Hooks**: useState, useEffect, useCallback, useRef
- **Debouncing**: setTimeout de 500ms
- **API Call**: axios via verificarCodigoJoya()
- **Inline Styles**: Para colores condicionales

### Backend
- **Supabase**: Búsqueda con .ilike() (case-insensitive)
- **Express**: Nueva ruta GET /api/joyas/verificar-codigo
- **Filtrado**: Exclusión de ID en edición

### Base de Datos
- **PostgreSQL**: ILIKE para búsqueda case-insensitive
- **Índice**: Código tiene índice único (case-sensitive en DB)
- **Validación**: Doble capa (frontend + backend)

---

**Nota**: Las capturas de pantalla reales mostrarán los estilos exactos del sistema con los colores y fuentes configurados en el CSS global.
