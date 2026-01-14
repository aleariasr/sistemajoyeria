'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductImage } from '@/lib/types';
import { optimizeCloudinaryImage, getLowQualityPlaceholder } from '@/lib/utils';

interface ProductImageGalleryProps {
  imagenes: ProductImage[];
  productName: string;
  fallbackImageUrl?: string | null;
}

export function ProductImageGallery({ imagenes, productName, fallbackImageUrl }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    console.error('Error loading image at index:', index, imagenes[index]);
    setImageErrors(prev => new Set(prev).add(index));
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  // If no images in array but fallbackImageUrl exists, create a single-image array
  const imagenesDisplay = (!imagenes || imagenes.length === 0) && fallbackImageUrl
    ? [{ id: 0, url: fallbackImageUrl, orden: 0, es_principal: true }]
    : imagenes;

  if (!imagenesDisplay || imagenesDisplay.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center flex-col gap-3">
        <span className="text-6xl">🖼️</span>
        <span className="text-gray-400 text-sm">Sin imagen disponible</span>
      </div>
    );
  }

  const imagenActual = imagenesDisplay[selectedIndex];
  const hasError = imageErrors.has(selectedIndex);

  return (
    <div className="space-y-4">
      {/* Imagen Principal con Progressive Loading */}
      <motion.div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in"
        onClick={() => !hasError && setIsZoomed(true)}
        onKeyDown={(e) => {
          if (!hasError && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsZoomed(true);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Click to zoom image"
        whileHover={!hasError ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.2 }}
      >
        {hasError ? (
          <div className="w-full h-full flex items-center justify-center flex-col gap-3">
            <span className="text-6xl text-gray-300">🖼️</span>
            <span className="text-gray-400 text-sm">Error al cargar imagen</span>
          </div>
        ) : (
          <>
            {/* Low quality placeholder - loads instantly */}
            {!loadedImages.has(selectedIndex) && (
              <div className="absolute inset-0">
                <Image
                  src={getLowQualityPlaceholder(imagenActual.url, { width: 50, height: 50 })}
                  alt={`${productName} - Cargando...`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            {/* High quality image - loads progressively */}
            <Image
              src={optimizeCloudinaryImage(imagenActual.url, {
                width: 800,
                height: 800,
                quality: 'auto:good',
              })}
              alt={`${productName} - Imagen ${selectedIndex + 1}`}
              fill
              className={`object-cover transition-opacity duration-300 ${
                loadedImages.has(selectedIndex) ? 'opacity-100' : 'opacity-0'
              }`}
              priority={selectedIndex === 0}
              loading={selectedIndex === 0 ? 'eager' : 'lazy'}
              onError={() => handleImageError(selectedIndex)}
              onLoad={() => handleImageLoad(selectedIndex)}
            />
          </>
        )}
      </motion.div>

      {/* Thumbnails con Progressive Loading */}
      {imagenesDisplay.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagenesDisplay.map((imagen, index) => {
            const thumbnailHasError = imageErrors.has(index);
            return (
              <button
                key={imagen.id}
                onClick={() => setSelectedIndex(index)}
                className={`
                  relative aspect-square rounded-lg overflow-hidden
                  ${selectedIndex === index
                    ? 'ring-2 ring-blue-500'
                    : 'ring-1 ring-gray-200 hover:ring-gray-400'
                  }
                  transition-all
                `}
              >
                {thumbnailHasError ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-2xl text-gray-300">🖼️</span>
                  </div>
                ) : (
                  <Image
                    src={optimizeCloudinaryImage(imagen.url, {
                      width: 200,
                      height: 200,
                      quality: 'auto:eco',
                    })}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    loading="lazy"
                    onError={() => handleImageError(index)}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal Zoom - carga imagen de alta calidad cuando se abre */}
      <AnimatePresence>
        {isZoomed && !hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={optimizeCloudinaryImage(imagenActual.url, {
                  width: 1600,
                  height: 1600,
                  quality: 'auto:best',
                })}
                alt={`${productName} - Ampliada`}
                width={1600}
                height={1600}
                className="object-contain max-w-full max-h-[90vh]"
                onError={() => {
                  handleImageError(selectedIndex);
                  setIsZoomed(false);
                }}
              />
            </motion.div>
            <button
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-full w-12 h-12 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
              onClick={() => setIsZoomed(false)}
              aria-label="Close zoom view"
              type="button"
            >
              <span aria-hidden="true">×</span>
              <span className="sr-only">Close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
