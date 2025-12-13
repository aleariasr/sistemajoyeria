/**
 * Cart Content Component (Client)
 * 
 * Full cart page with item management and checkout link.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { formatPrice, optimizeCloudinaryImage } from '@/lib/utils';

export default function CartContent() {
  const { items, removeItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="w-20 h-20 text-primary-200 mx-auto mb-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
          />
        </svg>
        <h2 className="text-2xl font-semibold text-primary-900 mb-3">
          Tu carrito está vacío
        </h2>
        <p className="text-primary-500 mb-8 max-w-md mx-auto">
          Parece que aún no has agregado nada a tu carrito. ¡Explora nuestra colección!
        </p>
        <Link href="/catalog">
          <Button size="lg">Ver productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <span className="text-primary-500">
            {items.length} producto{items.length !== 1 && 's'}
          </span>
          <button
            onClick={clearCart}
            className="text-sm text-primary-500 hover:text-red-500 transition-colors"
          >
            Vaciar carrito
          </button>
        </div>

        <AnimatePresence mode="popLayout">
          <ul className="divide-y divide-primary-100">
            {items.map((item) => (
              <motion.li
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="py-6 first:pt-0"
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  <Link
                    href={`/product/${item.product.id}`}
                    className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-primary-50 flex-shrink-0"
                  >
                    <Image
                      src={optimizeCloudinaryImage(item.product.imagen_url, {
                        width: 400,
                        height: 400,
                        quality: 'auto:best',
                      })}
                      alt={item.product.nombre}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.product.id}`}
                      className="text-lg font-medium text-primary-900 hover:text-gold-600 transition-colors line-clamp-1"
                    >
                      {item.product.nombre}
                    </Link>
                    
                    {item.product.categoria && (
                      <p className="text-sm text-primary-500 mt-1">
                        {item.product.categoria}
                      </p>
                    )}

                    <p className="text-lg font-semibold text-primary-900 mt-2">
                      {formatPrice(item.product.precio, item.product.moneda)}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center border-2 border-primary-200 rounded-full">
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="w-10 h-10 flex items-center justify-center text-primary-600 hover:text-primary-900 transition-colors"
                          aria-label="Reducir cantidad"
                        >
                          −
                        </button>
                        <span className="w-10 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="w-10 h-10 flex items-center justify-center text-primary-600 hover:text-primary-900 transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-primary-400 hover:text-red-500 transition-colors p-2"
                        aria-label={`Eliminar ${item.product.nombre} del carrito`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right hidden sm:block">
                    <p className="text-lg font-semibold text-primary-900">
                      {formatPrice(
                        item.product.precio * item.quantity,
                        item.product.moneda
                      )}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-primary-50 rounded-2xl p-6 sticky top-24">
          <h2 className="text-xl font-semibold text-primary-900 mb-6">
            Resumen del Pedido
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-primary-600">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-primary-600">
              <span>Envío</span>
              <span>A calcular</span>
            </div>
          </div>

          <div className="border-t border-primary-200 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-primary-900">Total</span>
              <span className="text-2xl font-bold text-primary-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="text-sm text-primary-500 mt-1">
              Impuestos incluidos
            </p>
          </div>

          <Link href="/checkout">
            <Button fullWidth size="lg">
              Proceder al pago
            </Button>
          </Link>

          <Link
            href="/catalog"
            className="block text-center mt-4 text-primary-600 hover:text-primary-900 font-medium transition-colors"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
