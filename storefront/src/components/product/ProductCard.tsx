/**
 * Product Card Component
 * 
 * Elegant product display card with hover effects and add-to-cart.
 * Optimized for performance and touch devices.
 */

'use client';

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useCartStore } from '@/hooks/useCart';
import { formatPrice, optimizeCloudinaryImage } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  index?: number;
}

// Blur placeholder for images (base64 SVG - 600x600 gray rectangle)
const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y1ZjVmNSIvPjwvc3ZnPg==";

function ProductCardComponent({ product, index = 0 }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  
  // Detect touch device safely on client side only
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  useEffect(() => {
    // Only run on client side
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    // Prevent event from bubbling up to the Link
    e.preventDefault();
    e.stopPropagation();
    
    addItem(product, 1);
    toast.success(`${product.nombre} agregado al carrito`, {
      action: {
        label: 'Ver carrito',
        onClick: openCart,
      },
    });
  }, [product, addItem, openCart]);

  // Memoize URLs to prevent recalculation on every render
  const productUrl = useMemo(() => `/product/${product.id}`, [product.id]);
  const imageUrl = useMemo(() => {
    // Use first image from gallery if available, otherwise fallback to imagen_url
    const imagenPrincipal = product.imagenes?.[0]?.url || product.imagen_url;
    return optimizeCloudinaryImage(imagenPrincipal, {
      width: 800,
      height: 800,
      quality: 'auto:best',
      crop: 'fill',
      gravity: 'south',
    });
  }, [product.imagenes, product.imagen_url]);

  // Simplified animation config for better performance
  // Cap delay at 0.3s to avoid long waits for items further down the list
  const cardAnimation = useMemo(() => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: Math.min(index * 0.05, 0.3) }
  }), [index]);

  return (
    <motion.article
      {...cardAnimation}
      className="group"
    >
      <Link
        href={productUrl}
        className="block"
        aria-label={`Ver detalles de ${product.nombre}`}
      >
        {/* Image Container */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-primary-50 mb-4">
          <Image
            src={imageUrl}
            alt={product.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
          
          {/* Quick Add Button - Shows on hover (desktop only) */}
          {!isTouchDevice && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 
                         px-6 py-2.5 bg-primary-900 text-white text-sm font-medium 
                         rounded-full shadow-premium opacity-0 group-hover:opacity-100 
                         transition-all duration-300 transform translate-y-2 group-hover:translate-y-0
                         hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500
                         z-10"
              aria-label={`Agregar ${product.nombre} al carrito`}
              type="button"
            >
              Agregar al carrito
            </button>
          )}

          {/* Category Badge */}
          {product.categoria && (
            <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm text-primary-700 text-xs font-medium rounded-full">
              {product.categoria}
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <h3 className="font-medium text-primary-900 group-hover:text-gold-600 transition-colors duration-200 line-clamp-1">
            {product.nombre}
          </h3>
          
          {product.descripcion && (
            <p className="text-primary-500 text-sm line-clamp-1">
              {product.descripcion}
            </p>
          )}
          
          <p className="text-lg font-semibold text-primary-900 pt-1">
            {formatPrice(product.precio, product.moneda)}
          </p>
        </div>
      </Link>

      {/* Add to Cart Button for Touch Devices - Outside the Link */}
      {isTouchDevice && (
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full px-4 py-2.5 bg-primary-900 text-white text-sm font-medium 
                     rounded-lg shadow-md hover:bg-primary-800 active:bg-primary-950
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500
                     transition-colors duration-200"
          aria-label={`Agregar ${product.nombre} al carrito`}
          type="button"
        >
          Agregar al carrito
        </button>
      )}
    </motion.article>
  );
}

// Use React.memo to prevent unnecessary re-renders
export const ProductCard = React.memo(ProductCardComponent);

export default ProductCard;
