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

### Storefront

#### 1. **components/product/ProductImageGallery.tsx**
- ✅ **Error tracking por imagen**: Estado `Set<number>` para rastrear qué imágenes fallaron
- ✅ **Placeholder mejorado**:
  - Vista principal: 🖼️ grande + "Error al cargar imagen" o "Sin imagen disponible"
  - Thumbnails: 🖼️ pequeño cuando falla la carga
- ✅ **Lazy loading implementado**:
  - Primera imagen: `loading="eager"` y `priority={true}`
  - Resto: `loading="lazy"` para mejor rendimiento
- ✅ **Protección contra zoom de imágenes rotas**:
  - Solo permite zoom si la imagen no tiene error
  - Cierra modal automáticamente si la imagen ampliada falla
- ✅ **Callback `onError` en todas las imágenes**: Main, thumbnails y modal zoom

#### 2. **components/product/ProductCard.tsx**
- ✅ **Estado `imageError` individual**: Cada tarjeta rastrea su propio error
- ✅ **Placeholder en tarjetas**: 🖼️ + "Sin imagen" cuando falla la carga
- ✅ **Callback `onError`**: Detecta y maneja fallos de carga de imagen

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

## Problemas Conocidos Pendientes

### Para investigar (necesita información del usuario):
- ¿Problemas específicos con la galería del POS?
- ¿Drag & drop funciona correctamente?
- ¿Imágenes se renderizan en el storefront?

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

### Storefront
1. Producto sin imágenes → Debe mostrar "Sin imagen disponible"
2. Imagen de Cloudinary rota → Debe mostrar placeholder
3. Cambiar entre thumbnails → Lazy loading debe funcionar
4. Click en zoom con imagen rota → No debe abrir modal

## Compatibilidad

- ✅ Node.js >= 20.0.0
- ✅ React 18
- ✅ Next.js 14
- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Cloudinary API v2

## Próximos Pasos

1. [ ] Instalar dependencias y probar en desarrollo
2. [ ] Verificar problemas específicos reportados con la galería
3. [ ] Testing manual de todos los flujos de imágenes
4. [ ] Considerar agregar retry logic para fallos de red temporales
5. [ ] Considerar agregar compresión de imágenes del lado del cliente antes de subir
