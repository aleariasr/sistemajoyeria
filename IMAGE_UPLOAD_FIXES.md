# Correcciones de Subida y Renderizado de Imágenes

## Resumen
Se han implementado mejoras significativas para solucionar problemas intermitentes con el manejo de imágenes en el sistema, tanto en el POS como en el Storefront.

## Cambios Realizados

### Backend

#### 1. **middleware/upload.js**
- ✅ **Límite de tamaño aumentado**: De 15MB comentado como 5MB a **50MB** para permitir imágenes de alta calidad de joyas
- ✅ **Mensajes de error mejorados**: Todos los errores ahora incluyen `errorType` para mejor manejo en el frontend
  - `FILE_TOO_LARGE`: Archivo excede 50MB
  - `UNEXPECTED_FILE`: Problema con el número de archivos
  - `MULTER_ERROR`: Otros errores de Multer
  - `VALIDATION_ERROR`: Error de validación de tipo de archivo

#### 2. **routes/imagenes-joya.js**
- ✅ **Validación de URL robusta**: 
  - Verifica que `imagen_url` no esté vacío
  - Valida formato de URL con constructor `URL()`
  - **Whitelist de dominios**: Solo permite URLs de Cloudinary (`cloudinary.com`, `res.cloudinary.com`)
- ✅ **Tipos de error específicos**: 
  - `MISSING_FIELDS`: Campos requeridos faltantes
  - `INVALID_URL`: URL vacía o no válida
  - `INVALID_URL_FORMAT`: URL con formato incorrecto
  - `DOMAIN_NOT_ALLOWED`: Dominio no autorizado
  - `SERVER_ERROR`: Error del servidor

#### 3. **routes/joyas.js** 
- ✅ **Endpoint `/upload-image` mejorado**:
  - Retorna información adicional: `width`, `height`, `format`
  - Mensajes de error más descriptivos
  - Tipo de error `NO_FILE` cuando no se proporciona archivo
  - Tipo de error `UPLOAD_ERROR` para errores de Cloudinary

#### 4. **cloudinary-config.js**
- ✅ **Configuración de calidad mejorada**:
  - `quality: 'auto:best'` por defecto
  - `fetch_format: 'auto'` para optimización automática
  - Responsive breakpoints para múltiples tamaños (200px-1000px)
- ✅ **Mensajes de error específicos de Cloudinary**:
  - HTTP 401: Credenciales inválidas
  - HTTP 400: Imagen corrupta o inválida
  - HTTP 420: Límite de uso excedido
- ✅ **Retorna metadatos adicionales**: width, height, format

### Frontend (POS)

#### 1. **components/GaleriaImagenesJoya.js**
- ✅ **Manejo de errores de carga de imagen**:
  - Estado `imageError` por imagen individual
  - Placeholder visual cuando la imagen falla: 🖼️ + "Error al cargar"
  - CSS para `.imagen-placeholder`
- ✅ **Mensajes de error mejorados en subida**:
  - Switch detallado basado en `errorType`
  - Mensajes específicos para cada tipo de error
  - Fallback a mensaje genérico si no hay tipo
- ✅ **Sin límite de tamaño en cliente**: Se eliminó validación de 5MB para permitir imágenes de alta calidad
- ✅ **Mensajes de error mejorados en operaciones**:
  - `cargarImagenes()`: Manejo de errores 404, 500, Network Error
  - `handleEliminar()`: Manejo de error 404 (imagen ya eliminada)
  - `handleMarcarPrincipal()`: Mensajes de error específicos
- ✅ **Validación de respuestas vacías**: Detecta y maneja respuestas vacías de la API
- ✅ **Mejor manejo de arrays**: Valida que response.data sea un array antes de usarlo

### Storefront

#### 1. **lib/utils/index.ts**
- ✅ **Nueva función `getLowQualityPlaceholder()`**: Genera URLs de Cloudinary con:
  - Tamaño pequeño (50x50 por defecto)
  - Calidad baja (`auto:low`)
  - Blur heavy (`e_blur:1000`)
  - Para carga instantánea como placeholder

#### 2. **components/product/ProductImageGallery.tsx**
- ✅ **Progressive Image Loading (LQIP)**:
  - Carga primero imagen de baja calidad (blur)
  - Luego carga imagen de calidad media (`auto:good`)
  - Modal zoom usa máxima calidad (`auto:best`)
  - Transición suave con `opacity` y `duration-300`
- ✅ **Error tracking por imagen**: Estado `Set<number>` para rastrear qué imágenes fallaron
- ✅ **Estado de carga por imagen**: Nuevo estado `loadedImages` para controlar transiciones
- ✅ **Placeholder mejorado**:
  - Vista principal: 🖼️ grande + "Error al cargar imagen" o "Sin imagen disponible"
  - Thumbnails: 🖼️ pequeño cuando falla la carga
- ✅ **Lazy loading implementado**:
  - Primera imagen: `loading="eager"` y `priority={true}`
  - Resto: `loading="lazy"` para mejor rendimiento
- ✅ **Protección contra zoom de imágenes rotas**:
  - Solo permite zoom si la imagen no tiene error
  - Cierra modal automáticamente si la imagen ampliada falla
- ✅ **Callback `onLoad`**: Detecta cuando la imagen de alta calidad termina de cargar

#### 3. **components/product/ProductCard.tsx**
- ✅ **Progressive Loading en tarjetas**:
  - Placeholder de baja calidad instantáneo
  - Imagen de calidad media carga progresivamente
  - Transición suave con fade-in
- ✅ **Estado `imageLoaded` individual**: Cada tarjeta rastrea su propio estado de carga
- ✅ **Placeholder en tarjetas**: 🖼️ + "Sin imagen" cuando falla la carga
- ✅ **Callbacks `onError` y `onLoad`**: Detecta y maneja fallos y éxitos de carga de imagen
- ✅ **Optimización de calidad**: Usa `auto:good` en lugar de `auto:best` para mejor balance carga/calidad

### Configuración

#### 1. **.gitignore**
- ✅ **Exclusión de archivos temporales**: 
  - `backend/tmp/`
  - `**/tmp/uploads/`

## Características de Seguridad

1. **Whitelist de dominios**: Solo se permiten URLs de Cloudinary para prevenir inyección de URLs maliciosas
2. **Validación de tipo de archivo**: Solo imágenes (jpeg, jpg, png, gif, webp, heic, heif)
3. **Límite de tamaño razonable**: 50MB para balance entre calidad y seguridad
4. **Limpieza de archivos temporales**: Los archivos se eliminan después de subirlos a Cloudinary

## Mejoras de UX

1. **Mensajes de error claros**: Los usuarios ven exactamente qué salió mal
2. **Placeholders visuales**: Íconos amigables (🖼️) en lugar de imágenes rotas
3. **Lazy loading**: Mejor rendimiento en páginas con muchas imágenes
4. **Sin límite artificial en cliente**: Permite fotografías de alta calidad de joyas
5. **Progressive Loading (LQIP)**: 
   - Las imágenes cargan primero en baja calidad (instantáneo)
   - Luego mejoran a calidad media/alta progresivamente
   - Mejor experiencia en conexiones lentas
   - Reduce sensación de espera

## Técnica de Progressive Loading

El sistema implementa **LQIP (Low Quality Image Placeholder)** usando Cloudinary:

### Storefront
1. **Paso 1 - Placeholder instantáneo**: Carga imagen 50x50 con blur pesado
2. **Paso 2 - Calidad media**: Carga imagen optimizada 800x800 con `auto:good`
3. **Paso 3 - Zoom (opcional)**: Si el usuario hace zoom, carga 1600x1600 con `auto:best`

### Ventajas
- ✅ Percepción de carga instantánea
- ✅ Reduce bandwidth inicial
- ✅ Mejor experiencia en redes lentas (3G/4G)
- ✅ Mantiene calidad alta para ver detalles cuando se necesita
- ✅ Layout estable (no hay saltos de contenido)

## Problemas Resueltos

### Problema 1: "Error inesperado al cargar imágenes"
**Causa**: API retornando respuesta vacía `""` en lugar de array
**Solución**: 
- Validación de tipo de respuesta en `cargarImagenes()`
- Manejo específico de respuestas vacías
- Log en consola para debugging
- Fallback a array vacío

### Problema 2: "Respuesta inesperada de la API de imágenes: ''"
**Causa**: Response.data no es un array como se espera
**Solución**:
- Verificación `Array.isArray()` antes de usar datos
- Manejo explícito de respuestas no válidas
- Log descriptivo en consola
- Previene crashes por datos inesperados

### Problema 3: No se pueden agregar imágenes
**Solución**:
- Mejor manejo de errores con tipos específicos
- Validación de idJoya antes de operaciones
- Mensajes claros según el tipo de error
- Fallback graceful en todos los casos

### Problema 4: Imágenes cargan lento en conexiones lentas
**Solución**:
- Implementación de Progressive Loading (LQIP)
- Placeholder blur instantáneo
- Carga progresiva de calidad media → alta
- Optimización de thumbnails con `auto:eco`

## Testing Recomendado

### Backend
```bash
# Test de subida con imagen válida
curl -X POST http://localhost:3001/api/joyas/upload-image \
  -H "Cookie: connect.sid=..." \
  -F "imagen=@test-image.jpg"

# Test de validación de URL
curl -X POST http://localhost:3001/api/imagenes-joya \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json" \
  -d '{"id_joya": 1, "imagen_url": "https://malicious-site.com/image.jpg"}'
  # Debe rechazar con DOMAIN_NOT_ALLOWED
```

### Frontend
1. Subir imagen > 50MB → Debe mostrar "Tamaño máximo: 50MB"
2. Subir archivo .txt → Debe mostrar "Formato de archivo no válido"
3. URL de imagen rota → Debe mostrar placeholder 🖼️
4. Sin conexión → Debe mostrar "Error de conexión"
5. Respuesta vacía de API → Debe manejar sin crash

### Storefront
1. Producto sin imágenes → Debe mostrar "Sin imagen disponible"
2. Imagen de Cloudinary rota → Debe mostrar placeholder
3. Cambiar entre thumbnails → Lazy loading debe funcionar
4. Click en zoom con imagen rota → No debe abrir modal
5. **Conexión lenta** → Debe cargar blur primero, luego mejorar calidad
6. **Scroll rápido** → Solo imágenes visibles deben cargar en alta calidad

## Compatibilidad

- ✅ Node.js >= 20.0.0
- ✅ React 18
- ✅ Next.js 14
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Cloudinary API v2
- ✅ Redes lentas (3G/4G) - Progressive Loading

## Próximos Pasos

1. [x] Validar respuestas vacías de API
2. [x] Implementar Progressive Loading (LQIP)
3. [ ] Probar en desarrollo con imágenes reales
4. [ ] Monitorear logs de Cloudinary para optimizaciones
5. [ ] Considerar implementar retry logic para fallos de red temporales
6. [ ] Considerar agregar loading skeleton animado
