/**
 * Product Detail Component (Client)
 * 
 * Displays full product information with add to cart functionality.
 * Each variant appears as a completely independent product (no variant selector).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useProduct } from '@/hooks/useApi';
import { useCartStore } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { SetComponents } from '@/components/product/SetComponents';
import { formatPrice } from '@/lib/utils';

interface ProductDetailProps {
  productId: number;
  varianteId?: number;
}

export default function ProductDetail({ productId, varianteId }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(productId, varianteId);
  const { addItem, openCart } = useCartStore();

  // No need to restore catalogUrl anymore - we'll use navigate back
  // which preserves all state automatically

  const handleBackToCatalog = () => {
    // Use browser back navigation to preserve filters and scroll position
    router.back();
  };

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
        <Button onClick={handleBackToCatalog} variant="outline">
          Volver al catálogo
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    // Product already has variant info embedded if it's a variant
    // (comes from API as a "virtual product" with variante_id already set)
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
            <button
              onClick={handleBackToCatalog}
              className="text-primary-500 hover:text-primary-900 transition-colors"
            >
              Catálogo
            </button>
          </li>
          <li className="text-primary-300">/</li>
          <li className="text-primary-900 font-medium">{product.nombre}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image Gallery with Zoom */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <ProductImageGallery 
            imagenes={product.imagenes || []}
            productName={product.nombre}
            fallbackImageUrl={product.imagen_url}
          />
          {product.categoria && (
            <span className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-sm text-primary-700 text-sm font-medium rounded-full shadow-sm pointer-events-none z-10">
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

          {/* Set Information Badge */}
          {product.es_producto_compuesto && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📦 <strong>Este es un set completo</strong> que incluye múltiples piezas. 
                Las piezas individuales también están disponibles por separado en el catálogo.
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
                    (Solo {product.stock} {product.es_producto_compuesto ? 'sets' : 'unidades'})
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
              {product.stock_disponible 
                ? (product.es_producto_compuesto ? 'Agregar set completo al carrito' : 'Agregar al carrito')
                : 'No disponible'
              }
            </Button>

            <Button variant="ghost" fullWidth onClick={handleBackToCatalog}>
              ← Seguir comprando
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Set Components - Show if this is a composite product */}
      {product.es_producto_compuesto && (
        <SetComponents setId={product.id} setName={product.nombre} />
      )}
    </div>
  );
}
