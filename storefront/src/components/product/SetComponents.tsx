/**
 * SetComponents Component
 * 
 * Displays all components/pieces of a product set with their stock status
 * and allows adding individual available pieces to cart
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { useCartStore } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { formatPrice } from '@/lib/utils';
import type { ProductComponent, ComponentsResponse } from '@/lib/types';

interface SetComponentsProps {
  setId: number;
  setName: string;
}

export function SetComponents({ setId, setName }: SetComponentsProps) {
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [stockSet, setStockSet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    loadComponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: ComponentsResponse = await api.getProductComponents(setId);
      setComponents(data.componentes || []);
      setStockSet(data.stock_set || 0);
    } catch (err) {
      console.error('Error loading components:', err);
      setError('No se pudieron cargar los componentes del set');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComponent = (component: ProductComponent) => {
    // Convert component to Product format for cart
    const product = {
      id: component.id,
      codigo: component.codigo,
      nombre: component.nombre,
      descripcion: component.descripcion,
      categoria: null,
      precio: component.precio,
      moneda: component.moneda,
      stock_disponible: component.stock_disponible,
      stock: component.stock,
      imagen_url: component.imagen_url,
      imagenes: [],
      slug: '',
      es_producto_compuesto: false,
    };

    addItem(product, 1);
    toast.success(`${component.nombre} agregado al carrito`, {
      action: {
        label: 'Ver carrito',
        onClick: openCart,
      },
    });
  };

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-primary-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-primary-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-primary-200 rounded"></div>
            <div className="h-20 bg-primary-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (components.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8"
    >
      <div className="bg-primary-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary-900">
            🔍 Piezas que componen este set
          </h3>
          {stockSet > 0 ? (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {stockSet} {stockSet === 1 ? 'set disponible' : 'sets disponibles'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              Set temporalmente agotado
            </span>
          )}
        </div>

        <div className="space-y-4">
          {components.map((component, index) => (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`flex items-center gap-4 p-4 bg-white rounded-lg border-2 transition-all ${
                component.es_activo && component.stock_disponible
                  ? 'border-primary-200 hover:border-primary-300'
                  : 'border-gray-200 opacity-75'
              }`}
            >
              {/* Component Image */}
              {component.imagen_url ? (
                <div className="relative w-20 h-20 rounded-md overflow-hidden">
                  <Image
                    src={component.imagen_url}
                    alt={component.nombre}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-primary-100 rounded-md flex items-center justify-center text-3xl">
                  💎
                </div>
              )}

              {/* Component Info */}
              <div className="flex-1">
                <h4 className="font-semibold text-primary-900 mb-1">
                  {component.nombre}
                </h4>
                <p className="text-sm text-primary-600 mb-2">
                  {formatPrice(component.precio, component.moneda)}
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-primary-500">
                    Código: {component.codigo}
                  </span>
                  {component.cantidad_requerida > 1 && (
                    <span className="text-primary-500">
                      × {component.cantidad_requerida} unidades por set
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status and Action */}
              <div className="flex flex-col items-end gap-2">
                {component.es_activo ? (
                  component.stock_disponible ? (
                    <>
                      <span className="inline-flex items-center gap-2 text-green-600 text-sm font-medium">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        {component.stock} disponible{component.stock === 1 ? '' : 's'}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAddComponent(component)}
                        className="whitespace-nowrap"
                      >
                        Agregar pieza
                      </Button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-red-600 text-sm font-medium">
                      <span className="w-2 h-2 bg-red-500 rounded-full" />
                      Agotado
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    No disponible
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
