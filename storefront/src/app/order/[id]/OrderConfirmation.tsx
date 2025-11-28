/**
 * Order Confirmation Component (Client)
 * 
 * Displays order confirmation details after successful checkout.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useOrder } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPrice, formatDate, optimizeCloudinaryImage } from '@/lib/utils';
import { STORE_CONFIG } from '@/lib/config';

interface OrderConfirmationProps {
  orderId: number;
}

export default function OrderConfirmation({ orderId }: OrderConfirmationProps) {
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !order) {
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
          Pedido no encontrado
        </h2>
        <p className="text-primary-500 mb-6">
          No pudimos encontrar este pedido.
        </p>
        <Link href="/">
          <Button variant="outline">Volver al inicio</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
      </motion.div>

      {/* Confirmation Message */}
      <h1 className="text-3xl font-bold text-primary-900 mb-2">
        ¡Gracias por tu pedido!
      </h1>
      <p className="text-primary-600 mb-8">
        Tu pedido ha sido recibido y está siendo procesado.
      </p>

      {/* Order Number */}
      <div className="bg-primary-50 rounded-2xl p-6 mb-8">
        <p className="text-sm text-primary-500 mb-1">Número de pedido</p>
        <p className="text-3xl font-bold text-primary-900">#{order.id}</p>
        <p className="text-sm text-primary-500 mt-2">
          {formatDate(order.date)}
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-2xl border border-primary-100 p-6 text-left mb-8">
        <h2 className="text-lg font-semibold text-primary-900 mb-4">
          Resumen del Pedido
        </h2>

        <ul className="divide-y divide-primary-100 mb-6">
          {order.items.map((item) => (
            <li key={item.id} className="py-4 flex gap-4">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                {item.product_image ? (
                  <Image
                    src={optimizeCloudinaryImage(item.product_image, {
                      width: 128,
                      height: 128,
                    })}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-300">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary-900">{item.product_name}</p>
                <p className="text-sm text-primary-500">Cant: {item.quantity}</p>
              </div>
              <p className="font-medium text-primary-900">
                {formatPrice(item.subtotal)}
              </p>
            </li>
          ))}
        </ul>

        <div className="border-t border-primary-100 pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-primary-600">Subtotal</span>
            <span className="text-primary-900">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-primary-900">Total</span>
            <span className="text-primary-900">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gold-50 rounded-2xl p-6 mb-8 text-left">
        <h2 className="text-lg font-semibold text-primary-900 mb-3">
          ¿Qué sigue?
        </h2>
        <ul className="space-y-2 text-primary-600">
          <li className="flex items-start gap-2">
            <span className="text-gold-600 mt-0.5">•</span>
            Recibirás un correo de confirmación con los detalles de tu pedido.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-600 mt-0.5">•</span>
            Nos pondremos en contacto contigo para coordinar el pago y la entrega.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-600 mt-0.5">•</span>
            Si tienes preguntas, contáctanos en {STORE_CONFIG.contact.email}
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/catalog">
          <Button variant="outline" size="lg">
            Seguir comprando
          </Button>
        </Link>
        <Link href="/">
          <Button size="lg">Volver al inicio</Button>
        </Link>
      </div>
    </motion.div>
  );
}
