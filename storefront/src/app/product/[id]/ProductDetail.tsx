/**
 * Product Detail Component (Client)
 * 
 * Displays full product information with add to cart functionality.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useProduct } from '@/hooks/useApi';
import { useCartStore } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatPrice, optimizeCloudinaryImage } from '@/lib/utils';

interface ProductDetailProps {
  productId: number;
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const { data: product, isLoading, error } = useProduct(productId);
  const { addItem, openCart } = useCartStore();

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-16 h-16 text-primary-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-primary-900 mb-2">
          Producto no encontrado
        </h2>
        <p className="text-primary-500 mb-6">
          Este producto no está disponible o no existe.
        </p>
        <Link href="/catalog">
          <Button variant="outline">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${product.nombre} agregado al carrito`, {
      action: {
        label: 'Ver carrito',
        onClick: openCart,
      },
    });
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && (!product.stock || newQuantity <= product.stock)) {
      setQuantity(newQuantity);
    }
  };

  const imageUrl = optimizeCloudinaryImage(product.imagen_url, {
    width: 1200,
    height: 1200,
    quality: 'auto:best',
    crop: 'fill',
  });

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link
              href="/"
              className="text-primary-500 hover:text-primary-900 transition-colors"
            >
              Inicio
            </Link>
          </li>
          <li className="text-primary-300">/</li>
          <li>
            <Link
              href="/catalog"
              className="text-primary-500 hover:text-primary-900 transition-colors"
            >
              Catálogo
            </Link>
          </li>
          <li className="text-primary-300">/</li>
          <li className="text-primary-900 font-medium">{product.nombre}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative aspect-square rounded-3xl overflow-hidden bg-primary-50"
        >
          <Image
            src={imageUrl}
            alt={product.nombre}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
          {product.categoria && (
            <span className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-sm text-primary-700 text-sm font-medium rounded-full shadow-sm">
              {product.categoria}
            </span>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          {/* Code */}
          <span className="text-primary-400 text-sm font-medium mb-2">
            {product.codigo}
          </span>

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            {product.nombre}
          </h1>

          {/* Price */}
          <p className="text-3xl font-bold text-primary-900 mb-6">
            {formatPrice(product.precio, product.moneda)}
          </p>

          {/* Description */}
          {product.descripcion && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-primary-900 mb-2 uppercase tracking-wider">
                Descripción
              </h2>
              <p className="text-primary-600 leading-relaxed">
                {product.descripcion}
              </p>
            </div>
          )}

          {/* Stock Status */}
          <div className="mb-8">
            {product.stock_disponible ? (
              <span className="inline-flex items-center gap-2 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Disponible
                {product.stock && product.stock <= 5 && (
                  <span className="text-orange-500 text-sm">
                    (Solo {product.stock} unidades)
                  </span>
                )}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Agotado
              </span>
            )}
          </div>

          {/* Quantity Selector */}
          {product.stock_disponible && (
            <div className="mb-8">
              <label className="text-sm font-semibold text-primary-900 mb-3 uppercase tracking-wider block">
                Cantidad
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-primary-200 rounded-full">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center text-primary-600 hover:text-primary-900 disabled:opacity-50 transition-colors"
                    aria-label="Reducir cantidad"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-lg font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={product.stock ? quantity >= product.stock : false}
                    className="w-12 h-12 flex items-center justify-center text-primary-600 hover:text-primary-900 disabled:opacity-50 transition-colors"
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add to Cart Button */}
          <div className="mt-auto space-y-4">
            <Button
              onClick={handleAddToCart}
              disabled={!product.stock_disponible}
              fullWidth
              size="xl"
            >
              {product.stock_disponible ? 'Agregar al carrito' : 'No disponible'}
            </Button>

            <Link href="/catalog">
              <Button variant="ghost" fullWidth>
                ← Seguir comprando
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
