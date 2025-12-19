'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductImage {
  id: number;
  url: string;
  orden: number;
  es_principal: boolean;
}

interface ProductImageGalleryProps {
  imagenes: ProductImage[];
  productName: string;
}

/**
 * Optimize Cloudinary image URL
 */
function optimizeCloudinaryImage(
  url: string | null, 
  options: { width?: number; height?: number; quality?: string; crop?: string; gravity?: string } = {}
): string {
  if (!url) return '/placeholder-product.jpg';
  
  // Only optimize Cloudinary URLs
  if (!url.includes('cloudinary.com')) return url;
  
  const { width = 800, height = 800, quality = 'auto:best', crop, gravity } = options;
  
  try {
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return url;
    
    let transforms = [`w_${width}`, `h_${height}`, `q_${quality}`, 'f_auto'];
    if (crop) transforms.push(`c_${crop}`);
    if (gravity) transforms.push(`g_${gravity}`);
    
    return `${urlParts[0]}/upload/${transforms.join(',')}/${urlParts[1]}`;
  } catch {
    return url;
  }
}

export function ProductImageGallery({ imagenes, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!imagenes || imagenes.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
        <span className="text-gray-400">Sin imagen</span>
      </div>
    );
  }

  const imagenActual = imagenes[selectedIndex];

  return (
    <div className="space-y-4">
      {/* Imagen Principal */}
      <motion.div
        className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 cursor-zoom-in"
        onClick={() => setIsZoomed(true)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <Image
          src={optimizeCloudinaryImage(imagenActual.url, {
            width: 800,
            height: 800,
            quality: 'auto:best',
          })}
          alt={`${productName} - Imagen ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority={selectedIndex === 0}
        />
      </motion.div>

      {/* Thumbnails */}
      {imagenes.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagenes.map((imagen, index) => (
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
              <Image
                src={optimizeCloudinaryImage(imagen.url, {
                  width: 200,
                  height: 200,
                  quality: 'auto:good',
                })}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal Zoom */}
      <AnimatePresence>
        {isZoomed && (
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
              className="relative max-w-5xl max-h-full"
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
                className="object-contain"
              />
            </motion.div>
            <button
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
              onClick={() => setIsZoomed(false)}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
