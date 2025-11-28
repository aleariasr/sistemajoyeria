/**
 * Checkout Content Component (Client)
 * 
 * Checkout form with customer information and order submission.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { formatPrice, optimizeCloudinaryImage } from '@/lib/utils';
import type { Customer } from '@/lib/types';

interface FormData extends Customer {
  notes: string;
}

interface FormErrors {
  nombre?: string;
  telefono?: string;
  email?: string;
  cedula?: string;
  direccion?: string;
}

export default function CheckoutContent() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const createOrder = useCreateOrder();
  const subtotal = getSubtotal();

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    telefono: '',
    email: '',
    cedula: '',
    direccion: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Redirect if cart is empty
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
        <p className="text-primary-500 mb-8">
          Agrega productos antes de proceder al checkout.
        </p>
        <Link href="/catalog">
          <Button size="lg">Ver productos</Button>
        </Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Ingresa un número de teléfono válido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    try {
      const orderItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const result = await createOrder.mutateAsync({
        customer: {
          nombre: formData.nombre,
          telefono: formData.telefono,
          email: formData.email,
          cedula: formData.cedula || undefined,
          direccion: formData.direccion || undefined,
        },
        items: orderItems,
        notes: formData.notes || undefined,
      });

      // Clear cart and redirect to confirmation
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
      router.push(`/order/${result.order.id}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al procesar tu pedido. Por favor, intenta de nuevo.'
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-primary-100 p-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-6">
              Información de Contacto
            </h2>
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                error={errors.nombre}
                required
                autoComplete="name"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  error={errors.telefono}
                  required
                  autoComplete="tel"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                  autoComplete="email"
                />
              </div>
              <Input
                label="Cédula (opcional)"
                name="cedula"
                value={formData.cedula}
                onChange={handleChange}
                error={errors.cedula}
              />
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white rounded-2xl border border-primary-100 p-6">
            <h2 className="text-xl font-semibold text-primary-900 mb-6">
              Información de Entrega
            </h2>
            <div className="space-y-4">
              <Input
                label="Dirección (opcional)"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                error={errors.direccion}
                autoComplete="street-address"
              />
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-primary-700 mb-2"
                >
                  Notas adicionales (opcional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Instrucciones especiales para tu pedido..."
                  className="w-full px-4 py-3 border-2 border-primary-200 rounded-xl
                             focus:outline-none focus:border-primary-900 transition-colors
                             placeholder:text-primary-400 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-primary-50 rounded-2xl p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-primary-900 mb-6">
              Tu Pedido
            </h2>

            {/* Items List */}
            <ul className="space-y-4 mb-6 max-h-64 overflow-y-auto scrollbar-elegant">
              {items.map((item) => (
                <li key={item.product.id} className="flex gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    <Image
                      src={optimizeCloudinaryImage(item.product.imagen_url, {
                        width: 112,
                        height: 112,
                      })}
                      alt={item.product.nombre}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary-900 line-clamp-1">
                      {item.product.nombre}
                    </p>
                    <p className="text-sm text-primary-500">
                      Cant: {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-primary-900">
                    {formatPrice(item.product.precio * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-primary-200 pt-4 space-y-2">
              <div className="flex justify-between text-primary-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-primary-600">
                <span>Envío</span>
                <span>A coordinar</span>
              </div>
            </div>

            <div className="border-t border-primary-200 pt-4 mt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-primary-900">Total</span>
                <span className="text-2xl font-bold text-primary-900">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={createOrder.isPending}
            >
              Confirmar Pedido
            </Button>

            <Link
              href="/cart"
              className="block text-center mt-4 text-primary-600 hover:text-primary-900 font-medium transition-colors"
            >
              ← Volver al carrito
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
