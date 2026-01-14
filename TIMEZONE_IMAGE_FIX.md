# Solución de Problemas: Timezone e Imágenes

## 📅 Problema 1: Timezone Incorrectos en Facturas

### Problema Original
Las horas en facturas y otros registros no coincidían con la hora esperada debido a un manejo manual de zonas horarias que no consideraba:
- La zona horaria real del servidor
- Cambios de horario de verano (DST)
- Inconsistencias en cálculos manuales de offset

### Solución Implementada

#### 1. Nueva Librería de Timezone
- **Instalada**: `date-fns` y `date-fns-tz`
- **Beneficios**:
  - Manejo robusto de zonas horarias usando IANA timezone database
  - Soporte automático para DST
  - Consistencia independiente de donde corra el servidor
  - Ampliamente probada y mantenida

#### 2. Actualización de `backend/utils/timezone.js`

**Antes** (Manual UTC-6):
```javascript
function obtenerFechaCostaRica() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const costaRicaTime = new Date(utc + (3600000 * COSTA_RICA_OFFSET_HOURS));
  return costaRicaTime;
}
```

**Ahora** (date-fns-tz):
```javascript
const { toZonedTime, formatInTimeZone } = require('date-fns-tz');

function obtenerFechaCostaRica() {
  const now = new Date();
  return toZonedTime(now, TIMEZONE);
}
```

#### 3. Nuevas Funciones Agregadas

**`convertirFechaFrontend(fechaISO)`**
- Convierte fechas enviadas desde el frontend a la zona horaria local
- Maneja correctamente fechas en formato ISO 8601

**`formatearFechaParaFrontend(fecha)`**
- Formatea fechas para enviar al frontend
- Asegura que las fechas se muestren en la zona horaria correcta

#### 4. Variable de Entorno Configurable

Agregada a `.env.example`:
```bash
# Zona horaria (IANA timezone database)
# Valores comunes: America/Costa_Rica, America/Mexico_City, America/New_York
TZ=America/Costa_Rica
```

**Ventaja**: Permite cambiar la zona horaria sin modificar código.

### Uso en el Código

#### En Modelos (Ventas, CierreCaja, etc.)
```javascript
const { formatearFechaSQL } = require('../utils/timezone');

// Al crear registros
const fechaVenta = formatearFechaSQL(); // Usa hora actual en TZ configurado
```

#### En Rutas (API responses)
```javascript
const { formatearFechaParaFrontend } = require('../utils/timezone');

// Al devolver datos al frontend
const ventas = data.map(venta => ({
  ...venta,
  fecha_venta: formatearFechaParaFrontend(venta.fecha_venta)
}));
```

### Testing

Creado `backend/tests/test-timezone.js` con 10 tests:
- ✅ Validación de configuración de TIMEZONE
- ✅ Formato ISO correcto (YYYY-MM-DDTHH:MM:SS)
- ✅ Conversión UTC-6 correcta
- ✅ Manejo de fechas pasadas y futuras
- ✅ Conversión de fechas del frontend

**Ejecutar**: `node backend/tests/test-timezone.js`

### Compatibilidad

- ✅ **Backward compatible**: Todas las funciones existentes mantienen su firma
- ✅ **Sin breaking changes**: El código existente sigue funcionando
- ✅ **Migrations no requeridas**: La base de datos ya usa `TIMESTAMP WITH TIME ZONE`

---

## 🖼️ Problema 2: Imágenes en el Storefront

### Análisis del Problema

Tras investigar el código, encontramos que:
1. **Imágenes diferentes**: El código ya usa la lógica correcta (`es_principal` → `imagenes[0]` → `imagen_url`)
2. **Imágenes cortadas**: El modal ya usa `object-contain` correctamente

**Conclusión**: El código de imágenes **ya estaba implementado correctamente**. Los problemas reportados probablemente eran:
- Datos inconsistentes en la base de datos
- Caché del navegador
- Imágenes con diferentes aspect ratios

### Mejoras Implementadas

#### 1. Validación de URLs de Imágenes

Creado `backend/utils/imageValidation.js` con funciones:

**`isValidImageUrl(imageUrl)`**
- Valida que la URL sea válida (http/https)
- Verifica extensión de imagen o dominio Cloudinary
- Previene URLs malformadas o inseguras

**`cleanImageArray(imagenes)`**
- Filtra imágenes con URLs inválidas
- Normaliza estructura de datos
- Asegura consistencia

**`selectPrimaryImage(imagenes, fallbackImageUrl)`**
- Selecciona la imagen principal correcta
- Maneja fallbacks apropiadamente
- Asegura que siempre haya una imagen si existe

**`ensureProductHasValidImages(product)`**
- Limpia y valida todas las imágenes de un producto
- Garantiza consistencia entre `imagen_url` e `imagenes[]`
- Previene errores de imágenes faltantes

#### 2. Integración en API Pública

Actualizado `backend/routes/public.js`:
```javascript
const { ensureProductHasValidImages } = require('../utils/imageValidation');

function transformToPublicProduct(joya, includeStock = false, varianteInfo = null) {
  let product = { /* ... */ };
  
  // Validar y limpiar imágenes
  product = ensureProductHasValidImages(product);
  
  return product;
}
```

**Beneficio**: Todos los productos en el storefront ahora tienen imágenes validadas.

#### 3. Mejoras en el Modal de Zoom

Actualizado `storefront/src/components/product/ProductImageGallery.tsx`:

**Antes**:
```tsx
<div className="relative max-w-5xl max-h-full">
  <Image className="object-contain" />
</div>
```

**Ahora**:
```tsx
<div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
  <Image 
    className="object-contain max-w-full max-h-full"
    style={{ maxWidth: '100%', maxHeight: '90vh' }}
  />
</div>
```

**Mejoras**:
- ✅ Constraints adicionales para prevenir overflow
- ✅ Mejor centrado con flexbox
- ✅ Inline styles como fallback
- ✅ Botón de cerrar mejorado con backdrop

### Testing

Creado `backend/tests/test-image-validation.js` con 10 tests:
- ✅ Validación de URLs de Cloudinary
- ✅ Validación de URLs estándar
- ✅ Rechazo de URLs inválidas
- ✅ Limpieza de arrays de imágenes
- ✅ Selección de imagen principal
- ✅ Manejo de fallbacks

**Ejecutar**: `node backend/tests/test-image-validation.js`

### Verificación en Producción

Para verificar que las imágenes funcionan correctamente:

1. **Backend**: Verificar logs de imágenes filtradas
2. **Storefront**: Inspeccionar network tab para ver URLs de imágenes
3. **Base de datos**: Asegurar que `imagenes_joya` table tenga `es_principal` correcto

```sql
-- Verificar imágenes principales
SELECT j.id, j.codigo, j.nombre, j.imagen_url, 
       COUNT(ij.id) as total_imagenes,
       COUNT(CASE WHEN ij.es_principal THEN 1 END) as imagenes_principales
FROM joyas j
LEFT JOIN imagenes_joya ij ON j.id = ij.id_joya
WHERE j.mostrar_en_storefront = true
GROUP BY j.id
HAVING COUNT(CASE WHEN ij.es_principal THEN 1 END) != 1;
```

---

## 📊 Resumen de Cambios

### Archivos Modificados
- ✅ `backend/utils/timezone.js` - Nueva implementación con date-fns-tz
- ✅ `backend/.env.example` - Variable TZ agregada
- ✅ `backend/package.json` - Dependencias date-fns agregadas
- ✅ `backend/routes/public.js` - Validación de imágenes integrada
- ✅ `storefront/src/components/product/ProductImageGallery.tsx` - Modal mejorado

### Archivos Nuevos
- ✅ `backend/utils/imageValidation.js` - Utilidades de validación de imágenes
- ✅ `backend/tests/test-timezone.js` - Tests de timezone
- ✅ `backend/tests/test-image-validation.js` - Tests de validación de imágenes

### NPM Packages Agregados
- `date-fns@^3.0.0` - Librería de utilidades de fechas
- `date-fns-tz@^2.0.0` - Extensión para zonas horarias

---

## 🚀 Deployment

### Railway (Backend)

No se requieren cambios adicionales en Railway. La variable `TZ` se puede configurar opcionalmente:

```bash
# En Railway Dashboard > Variables
TZ=America/Costa_Rica
```

Si no se configura, usa `America/Costa_Rica` por defecto.

### Vercel (Frontend/Storefront)

No se requieren cambios. El frontend ya maneja fechas correctamente usando los formateadores existentes.

---

## ✅ Checklist de Validación

### Timezone
- [x] Librería date-fns-tz instalada
- [x] Funciones de timezone actualizadas
- [x] Variable TZ documentada en .env.example
- [x] Tests creados y pasando
- [x] Backward compatibility verificada
- [ ] Validar en staging con datos reales
- [ ] Verificar facturas generadas con hora correcta

### Imágenes
- [x] Utilidades de validación creadas
- [x] Integración en API pública
- [x] Modal de zoom mejorado
- [x] Tests creados y pasando
- [ ] Validar en storefront con productos reales
- [ ] Verificar que imágenes no se corten al maximizar
- [ ] Confirmar que misma imagen se muestra en grid y detalle

---

## 🔧 Troubleshooting

### Si las horas aún están incorrectas:

1. Verificar variable TZ en el servidor:
```bash
echo $TZ
# Debe mostrar: America/Costa_Rica
```

2. Verificar zona horaria en PostgreSQL:
```sql
SHOW timezone;
SELECT now();
```

3. Verificar que el servidor use la librería actualizada:
```bash
cd backend
node -e "const tz = require('./utils/timezone'); console.log(tz.TIMEZONE);"
```

### Si las imágenes no se muestran:

1. Verificar que las URLs sean válidas en la base de datos:
```sql
SELECT id, codigo, imagen_url FROM joyas WHERE imagen_url IS NOT NULL LIMIT 5;
```

2. Verificar que imagenes_joya tenga registros:
```sql
SELECT COUNT(*) FROM imagenes_joya;
```

3. Verificar logs del backend para errores de validación

---

## 📚 Referencias

- [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- [date-fns Documentation](https://date-fns.org/)
- [date-fns-tz Documentation](https://github.com/marnusw/date-fns-tz)
- [PostgreSQL TIMESTAMP WITH TIME ZONE](https://www.postgresql.org/docs/current/datatype-datetime.html)
