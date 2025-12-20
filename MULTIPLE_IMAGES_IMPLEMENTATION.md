# Multiple Images Per Product - Implementation Summary

This document describes the complete implementation of multiple image support for products in the jewelry system.

## Overview

The system now supports uploading and displaying multiple images per product (joya), with features including:
- Drag-and-drop image reordering in POS
- Automatic primary image selection
- Image gallery with thumbnails and zoom in storefront
- Backward compatibility with single-image products

## Database Changes

### New Table: `imagenes_joya`

```sql
CREATE TABLE imagenes_joya (
  id SERIAL PRIMARY KEY,
  id_joya INTEGER NOT NULL REFERENCES joyas(id) ON DELETE CASCADE,
  imagen_url TEXT NOT NULL,
  orden_display INTEGER DEFAULT 0,
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- `orden_display`: Controls display order (0 = first/primary)
- `es_principal`: Marks the primary image for listings
- Automatic triggers keep `joyas.imagen_url` in sync with primary image
- Data migration from existing single images

### Migration File

Location: `backend/migrations/add-multiple-images-support.sql`

**To apply migration:**
1. Open Supabase SQL Editor
2. Copy and paste the migration SQL
3. Execute to create table, indexes, and triggers

## Backend Implementation

### New Model: `ImagenJoya.js`

Location: `backend/models/ImagenJoya.js`

**Methods:**
- `crear(imagenData)` - Create new image
- `obtenerPorJoya(id_joya)` - Get all images for a product
- `actualizarOrden(actualizaciones)` - Update order of multiple images
- `eliminar(id)` - Delete image
- `marcarComoPrincipal(id)` - Mark image as primary
- `actualizarImagenPrincipal(id_joya, imagen_url)` - Sync with joyas table

### New Routes: `imagenes-joya.js`

Location: `backend/routes/imagenes-joya.js`

**Endpoints:**
- `POST /api/imagenes-joya` - Add new image
- `GET /api/imagenes-joya/joya/:id` - Get all images
- `PUT /api/imagenes-joya/reordenar` - Reorder images
- `DELETE /api/imagenes-joya/:id` - Delete image
- `PUT /api/imagenes-joya/:id/principal` - Mark as primary

### Image Upload Endpoint

Location: `backend/routes/joyas.js`

**New endpoint:**
- `POST /api/joyas/upload-image` - Upload image to Cloudinary

### Public API Updates

Location: `backend/routes/public.js`

**Changes:**
- All product endpoints now include `imagenes` array
- Each image includes: `id`, `url`, `orden`, `es_principal`

**Updated endpoints:**
- `GET /api/public/products` - List with images
- `GET /api/public/products/featured` - Featured with images
- `GET /api/public/products/:id` - Detail with images

## Frontend POS Implementation

### New Component: `GaleriaImagenesJoya.js`

Location: `frontend/src/components/GaleriaImagenesJoya.js`

**Features:**
- Drag-and-drop reordering using `@dnd-kit`
- Visual indication of primary image
- Hover actions: mark as primary, delete
- File upload with validation
- Real-time updates

**Dependencies added:**
- `@dnd-kit/core`
- `@dnd-kit/sortable`
- `@dnd-kit/utilities`

### Integration with FormularioJoya

Location: `frontend/src/components/FormularioJoya.js`

**Changes:**
- Gallery component shown only in edit mode
- Integrated below single image uploader
- Auto-refresh on changes

**Usage:**
```jsx
{esEdicion && id && (
  <div className="card">
    <GaleriaImagenesJoya 
      idJoya={id}
      onCambio={cargarJoya}
    />
  </div>
)}
```

## Storefront Implementation

### New Component: `ProductImageGallery.tsx`

Location: `storefront/src/components/product/ProductImageGallery.tsx`

**Features:**
- Main image with click-to-zoom
- Thumbnail navigation
- Fullscreen modal with high-res images
- Framer Motion animations
- Cloudinary image optimization
- Responsive design

**Props:**
- `imagenes: ProductImage[]` - Array of images
- `productName: string` - Product name for alt text

### TypeScript Types

Location: `storefront/src/lib/types/index.ts`

**New interface:**
```typescript
export interface ProductImage {
  id: number;
  url: string;
  orden: number;
  es_principal: boolean;
}
```

**Updated Product interface:**
- Added: `imagenes: ProductImage[]`

### ProductDetail Updates

Location: `storefront/src/app/product/[id]/ProductDetail.tsx`

**Changes:**
- Replaced `ImageZoom` with `ProductImageGallery`
- Passes `product.imagenes` to gallery
- Removed hardcoded image URLs

### ProductCard Updates

Location: `storefront/src/components/product/ProductCard.tsx`

**Changes:**
- Uses first image from `product.imagenes` array
- Falls back to `product.imagen_url` if no images
- Optimized with `useMemo`

## Backward Compatibility

The implementation is fully backward compatible:

1. **Single Image Products:** Products with only `joyas.imagen_url` continue to work
2. **Empty Gallery:** If `imagenes` array is empty, falls back to `imagen_url`
3. **Migration:** Existing images automatically migrated to new table
4. **API:** Old endpoints still return `imagen_url` as primary image

## Usage Workflow

### POS - Adding Multiple Images

1. Create or edit a product
2. Save the product first (required for gallery)
3. Scroll to "Galería de Imágenes" section
4. Click "Agregar Imagen" to upload
5. Drag images to reorder
6. First image is always primary
7. Click ⭐ to mark a different image as primary
8. Click 🗑️ to delete an image

### Storefront - Viewing Gallery

1. Browse products (shows primary image)
2. Click product to view details
3. See main image with thumbnails below
4. Click thumbnails to change main image
5. Click main image to zoom fullscreen
6. Navigate with arrow keys (if implemented)

## Testing Checklist

- [ ] **Backend:**
  - [ ] Create image via API
  - [ ] Get images for product
  - [ ] Reorder images
  - [ ] Delete image (primary reassignment)
  - [ ] Mark as primary
  - [ ] Public API includes images

- [ ] **POS:**
  - [ ] Upload multiple images
  - [ ] Drag-and-drop reordering
  - [ ] Delete image
  - [ ] Mark as primary
  - [ ] Gallery shows correct order

- [ ] **Storefront:**
  - [ ] Product list shows primary image
  - [ ] Product detail shows gallery
  - [ ] Thumbnails work
  - [ ] Zoom modal works
  - [ ] Responsive on mobile

- [ ] **Edge Cases:**
  - [ ] Product with no images
  - [ ] Product with one image
  - [ ] Product with many images (10+)
  - [ ] Delete primary image
  - [ ] Reorder to change primary

## Security Considerations

1. **Authentication:** All image endpoints require `requireAuth` middleware
2. **File Validation:** 
   - File type validation (JPEG, PNG, GIF, WebP)
   - File size limit (5MB)
   - Multer sanitization
3. **SQL Injection:** Parameterized queries via Supabase
4. **XSS Prevention:** Image URLs stored as plain text, no HTML
5. **CSRF:** Covered by session cookie settings

## Performance Optimizations

1. **Cloudinary:** 
   - Automatic format conversion
   - Quality optimization
   - Size transformations
   - CDN delivery

2. **Storefront:**
   - Image lazy loading
   - Next.js Image optimization
   - Blur placeholders
   - Responsive images

3. **Database:**
   - Indexed queries on `id_joya`
   - Ordered results
   - Efficient joins

## Future Enhancements

Potential improvements:
- [ ] Image captions/alt text per image
- [ ] Image cropping/editing in POS
- [ ] Bulk upload multiple images at once
- [ ] Video support
- [ ] 360° product view
- [ ] AI-powered image optimization
- [ ] Automatic watermarking

## Troubleshooting

### Images not uploading
- Check Cloudinary credentials in environment variables
- Verify file size is under 5MB
- Check file format is supported
- Check browser console for errors

### Gallery not showing in POS
- Ensure product is saved first (gallery only shows in edit mode)
- Check browser console for API errors
- Verify authentication token is valid

### Images not displaying in storefront
- Check API response includes `imagenes` array
- Verify Cloudinary URLs are accessible
- Check browser console for CORS errors
- Verify Next.js Image domain is configured

### Drag-and-drop not working
- Check `@dnd-kit` dependencies are installed
- Verify browser supports drag events
- Check CSS is not interfering with drag handles

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs for API errors
3. Verify database migration was applied
4. Review this documentation
5. Contact development team

---

**Implementation Date:** December 19, 2025  
**Version:** 2.0.0  
**Status:** ✅ Complete and Ready for Testing
