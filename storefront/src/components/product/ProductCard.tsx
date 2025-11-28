/**
 * Product Card Component
 * 
 * Elegant product display card with hover effects and add-to-cart.
 */

'use client';

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

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem(product, 1);
    toast.success(`${product.nombre} agregado al carrito`, {
      action: {
        label: 'Ver carrito',
        onClick: openCart,
      },
    });
  };

  const productUrl = `/product/${product.id}`;
  const imageUrl = optimizeCloudinaryImage(product.imagen_url, {
    width: 600,
    height: 600,
    quality: 'auto',
    crop: 'fill',
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
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
          />
          
          {/* Quick Add Button - Shows on hover */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 
                       px-6 py-2.5 bg-primary-900 text-white text-sm font-medium 
                       rounded-full shadow-premium opacity-0 group-hover:opacity-100 
                       transition-all duration-300 transform translate-y-2 group-hover:translate-y-0
                       hover:bg-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            aria-label={`Agregar ${product.nombre} al carrito`}
          >
            Agregar al carrito
          </motion.button>

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
    </motion.article>
  );
}

export default ProductCard;
