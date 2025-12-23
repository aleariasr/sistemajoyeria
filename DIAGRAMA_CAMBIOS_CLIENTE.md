# Diagrama Visual de Cambios

## Antes vs Después

### Base de Datos: Tabla `clientes`

```
ANTES:
┌────────────────────────────────────────┐
│ clientes                               │
├────────────────────────────────────────┤
│ id            BIGSERIAL PRIMARY KEY    │
│ nombre        TEXT NOT NULL            │
│ telefono      TEXT NOT NULL            │ ❌
│ cedula        TEXT UNIQUE NOT NULL     │ ❌
│ direccion     TEXT                     │
│ email         TEXT                     │
│ notas         TEXT                     │
└────────────────────────────────────────┘

DESPUÉS:
┌────────────────────────────────────────┐
│ clientes                               │
├────────────────────────────────────────┤
│ id            BIGSERIAL PRIMARY KEY    │
│ nombre        TEXT NOT NULL            │ ✅
│ telefono      TEXT (nullable)          │ ✅
│ cedula        TEXT (nullable)          │ ✅
│ direccion     TEXT                     │
│ email         TEXT                     │
│ notas         TEXT                     │
└────────────────────────────────────────┘
```

### Backend: Validación POST /api/clientes

```javascript
// ANTES
if (!nombre || !telefono || !cedula) {
  return res.status(400).json({ 
    error: 'Nombre, teléfono y cédula son requeridos' 
  });
}

// Verificar cedula única (siempre)
const clienteExistente = await Cliente.obtenerPorCedula(cedula);
if (clienteExistente) {
  return res.status(400).json({ 
    error: 'Ya existe un cliente con esta cédula' 
  });
}

// DESPUÉS
if (!nombre || nombre.trim() === '') {
  return res.status(400).json({ 
    error: 'El nombre es requerido' 
  });
}

// Verificar cedula única (solo si se proporciona)
if (cedula && cedula.trim() !== '') {
  const clienteExistente = await Cliente.obtenerPorCedula(cedula);
  if (clienteExistente) {
    return res.status(400).json({ 
      error: 'Ya existe un cliente con esta cédula' 
    });
  }
}
```

### Frontend: Formulario de Cliente

```jsx
// ANTES
<div className="form-group">
  <label htmlFor="cedula">Cédula *</label>
  <input
    type="text"
    id="cedula"
    name="cedula"
    value={formData.cedula}
    onChange={handleChange}
    required                    // ❌ Obligatorio
    placeholder="Número de cédula"
  />
</div>

<div className="form-group">
  <label htmlFor="telefono">Teléfono *</label>
  <input
    type="tel"
    id="telefono"
    name="telefono"
    value={formData.telefono}
    onChange={handleChange}
    required                    // ❌ Obligatorio
    placeholder="Número de teléfono"
  />
</div>

// DESPUÉS
<div className="form-group">
  <label htmlFor="cedula">Cédula</label>
  <input
    type="text"
    id="cedula"
    name="cedula"
    value={formData.cedula}
    onChange={handleChange}
                               // ✅ Opcional
    placeholder="Número de cédula"
  />
</div>

<div className="form-group">
  <label htmlFor="telefono">Teléfono</label>
  <input
    type="tel"
    id="telefono"
    name="telefono"
    value={formData.telefono}
    onChange={handleChange}
                               // ✅ Opcional
    placeholder="Número de teléfono"
  />
</div>
```

### Frontend: Validación

```javascript
// ANTES
if (!formData.nombre || !formData.cedula || !formData.telefono) {
  setError('Nombre, cédula y teléfono son campos obligatorios');
  return;
}

// Validar teléfono (siempre)
const normalizedPhone = formData.telefono.replace(/[\s-]/g, '');
const phoneRegex = /^[0-9+()]{6,20}$/;
if (!phoneRegex.test(normalizedPhone)) {
  setError('El teléfono debe tener entre 6 y 20 caracteres...');
  return;
}

// DESPUÉS
if (!formData.nombre || formData.nombre.trim() === '') {
  setError('El nombre es un campo obligatorio');
  return;
}

// Validar teléfono (solo si se proporciona)
if (formData.telefono && formData.telefono.trim() !== '') {
  const normalizedPhone = formData.telefono.replace(/[\s-]/g, '');
  const phoneRegex = /^[0-9+()]{6,20}$/;
  if (!phoneRegex.test(normalizedPhone)) {
    setError('El teléfono debe tener entre 6 y 20 caracteres...');
    return;
  }
}
```

## Flujo de Validación

### Antes

```
Usuario ingresa datos
         ↓
    ┌─────────┐
    │ Nombre  │ → Requerido ✓
    └─────────┘
         ↓
    ┌─────────┐
    │ Cédula  │ → Requerido ✗ (Ahora opcional)
    └─────────┘
         ↓
    ┌──────────┐
    │ Teléfono │ → Requerido ✗ (Ahora opcional)
    └──────────┘
         ↓
    Envío fallaba si faltaba algún campo
```

### Después

```
Usuario ingresa datos
         ↓
    ┌─────────┐
    │ Nombre  │ → Requerido ✓
    └─────────┘
         ↓
    ┌─────────┐
    │ Cédula  │ → Opcional ✓ (Validar solo si se proporciona)
    └─────────┘
         ↓
    ┌──────────┐
    │ Teléfono │ → Opcional ✓ (Validar solo si se proporciona)
    └──────────┘
         ↓
    Envío exitoso con solo nombre
```

## Casos de Uso

### Caso 1: Cliente Completo
```json
{
  "nombre": "Juan Pérez",
  "cedula": "123456789",
  "telefono": "8888-8888",
  "email": "juan@example.com"
}
```
✅ **Resultado**: Cliente creado exitosamente

### Caso 2: Solo Nombre
```json
{
  "nombre": "María González"
}
```
✅ **Resultado**: Cliente creado exitosamente

### Caso 3: Sin Nombre
```json
{
  "cedula": "987654321",
  "telefono": "7777-7777"
}
```
❌ **Resultado**: Error - "El nombre es requerido"

### Caso 4: Nombre + Teléfono
```json
{
  "nombre": "Carlos Ramírez",
  "telefono": "6666-6666"
}
```
✅ **Resultado**: Cliente creado exitosamente

### Caso 5: Cédulas Duplicadas
```json
// Cliente 1
{
  "nombre": "Ana López",
  "cedula": "555555555"
}

// Cliente 2 (mismo cedula)
{
  "nombre": "Pedro Mora",
  "cedula": "555555555"
}
```
❌ **Resultado**: Error - "Ya existe un cliente con esta cédula"

## Impacto Visual en la UI

```
┌─────────────────────────────────────────────┐
│  ➕ Nuevo Cliente                           │
├─────────────────────────────────────────────┤
│                                             │
│  Información Personal                       │
│                                             │
│  ┌────────────────────┐ ┌────────────────┐ │
│  │ Nombre Completo * │ │ Cédula         │ │  ← Sin asterisco
│  │ Juan Pérez        │ │ (opcional)     │ │
│  └────────────────────┘ └────────────────┘ │
│                                             │
│  ┌────────────────────┐ ┌────────────────┐ │
│  │ Teléfono          │ │ Email          │ │  ← Sin asterisco
│  │ (opcional)        │ │ (opcional)     │ │
│  └────────────────────┘ └────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │ Dirección (opcional)                   │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │ Notas (opcional)                       │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│    [Cancelar]  [Crear Cliente]             │
└─────────────────────────────────────────────┘
```

## Archivos Modificados

```
sistemajoyeria/
├── backend/
│   ├── migrations/
│   │   ├── make-cliente-fields-optional.sql          ← NUEVO
│   │   └── README-make-cliente-fields-optional.md    ← NUEVO
│   ├── models/
│   │   └── Cliente.js                                ← MODIFICADO
│   ├── routes/
│   │   └── clientes.js                               ← MODIFICADO
│   ├── tests/
│   │   └── test-cliente-optional-fields.js           ← NUEVO
│   └── supabase-migration.sql                        ← MODIFICADO
├── frontend/
│   └── src/
│       └── components/
│           └── FormularioCliente.js                  ← MODIFICADO
└── CLIENTE_OPTIONAL_FIELDS_SUMMARY.md                ← NUEVO
```

## Resumen de Cambios

| Componente | Cambio | Impacto |
|------------|--------|---------|
| Base de datos | `telefono` y `cedula` nullable | ✅ Permite valores NULL |
| Base de datos | Eliminar UNIQUE de `cedula` | ✅ Backend valida duplicados |
| Backend Routes | Solo requiere `nombre` | ✅ Menor validación obligatoria |
| Backend Model | Maneja NULL para campos opcionales | ✅ Inserta/actualiza correctamente |
| Frontend Form | Solo `nombre` tiene asterisco | ✅ UX más clara |
| Frontend Validation | Validación condicional | ✅ Valida solo si se proporciona |
| Tests | Suite completa de tests | ✅ Verifica todos los casos |
| Documentación | README y Summary | ✅ Guía completa de cambios |

## Líneas de Código Modificadas

- **Backend**: ~40 líneas modificadas
- **Frontend**: ~20 líneas modificadas
- **Tests**: ~322 líneas nuevas
- **Documentación**: ~600 líneas nuevas
- **Total**: ~982 líneas (830 agregadas, 29 eliminadas)
