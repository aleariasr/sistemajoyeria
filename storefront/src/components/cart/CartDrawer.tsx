/**
 * Cart Drawer Component
 * 
 * Slide-out cart panel with item management and checkout link.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { formatPrice, optimizeCloudinaryImage } from '@/lib/utils';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Carrito de compras"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
              <h2 className="text-xl font-semibold text-primary-900">
                Carrito ({itemCount})
              </h2>
              <button
                onClick={closeCart}
                className="p-2 rounded-full hover:bg-primary-50 transition-colors"
                aria-label="Cerrar carrito"
              >
                <svg
                  className="w-6 h-6 text-primary-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-primary-200 mx-auto mb-4"
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
                  <h3 className="text-lg font-medium text-primary-900 mb-2">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-primary-500 mb-6">
                    ¡Explora nuestra colección y encuentra algo especial!
                  </p>
                  <Button onClick={closeCart} variant="outline">
                    <Link href="/catalog">Ver productos</Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <motion.li
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-4"
                    >
                      {/* Product Image */}
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-primary-50 flex-shrink-0">
                        <Image
                          src={optimizeCloudinaryImage(item.product.imagen_url, {
                            width: 200,
                            height: 200,
                            quality: 'auto:best',
                          })}
                          alt={item.product.nombre}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.product.id}`}
                          onClick={closeCart}
                          className="text-primary-900 font-medium hover:text-gold-600 transition-colors line-clamp-1"
                        >
                          {item.product.nombre}
                        </Link>
                        <p className="text-primary-600 mt-1">
                          {formatPrice(item.product.precio, item.product.moneda)}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border border-primary-200 rounded-full">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-primary-600 hover:text-primary-900 transition-colors"
                              aria-label="Reducir cantidad"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="w-8 h-8 flex items-center justify-center text-primary-600 hover:text-primary-900 transition-colors"
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-primary-400 hover:text-red-500 transition-colors"
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
                      <div className="text-right">
                        <p className="font-semibold text-primary-900">
                          {formatPrice(
                            item.product.precio * item.quantity,
                            item.product.moneda
                          )}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-primary-100 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-primary-600">Subtotal</span>
                  <span className="text-xl font-semibold text-primary-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="text-sm text-primary-500">
                  Impuestos y envío calculados al finalizar
                </p>
                <Link href="/checkout" onClick={closeCart}>
                  <Button fullWidth size="lg">
                    Finalizar compra
                  </Button>
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block text-center text-primary-600 hover:text-primary-900 font-medium transition-colors"
                >
                  Ver carrito completo
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartDrawer;
