/**
 * VariantSelector Component
 * 
 * Displays available variants of a product and allows customer to select one.
 * When a variant is selected, the main product image changes to show the variant.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ProductVariant } from '@/lib/types';
import { motion } from 'framer-motion';

interface VariantSelectorProps {
  variants: ProductVariant[];
  currentVariantId?: number;
  onVariantSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  currentVariantId,
  onVariantSelect,
}: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState(currentVariantId || variants[0]?.id);

  // Update selectedId if variants change or currentVariantId is provided
  useEffect(() => {
    if (currentVariantId) {
      setSelectedId(currentVariantId);
    } else if (variants.length > 0 && !selectedId) {
      setSelectedId(variants[0].id);
    }
  }, [currentVariantId, variants, selectedId]);

  if (!variants || variants.length === 0) {
    return null;
  }

  const handleSelect = (variant: ProductVariant) => {
    setSelectedId(variant.id);
    onVariantSelect(variant);
  };

  // Get selected variant once to avoid repeated find() calls
  const selectedVariant = variants.find(v => v.id === selectedId);

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-primary-900 mb-4 uppercase tracking-wider">
        Diseños Disponibles ({variants.length})
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {variants.map((variant, index) => {
          const isSelected = variant.id === selectedId;
          
          return (
            <motion.button
              key={variant.id}
              type="button"
              onClick={() => handleSelect(variant)}
              className={`
                relative aspect-square rounded-lg overflow-hidden
                border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-primary-500 ring-2 ring-primary-500 ring-offset-2' 
                  : 'border-primary-200 hover:border-primary-400'
                }
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Seleccionar ${variant.nombre}`}
              title={variant.nombre}
            >
              {/* Variant Image */}
              <div className="relative w-full h-full">
                <Image
                  src={variant.imagen_url}
                  alt={variant.nombre}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 16vw, 12vw"
                />
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 bg-primary-500/10 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Variant Name */}
      {selectedVariant && (
        <motion.div
          key={selectedId}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-primary-50 rounded-lg"
        >
          <p className="text-sm text-primary-700">
            <span className="font-semibold">Diseño seleccionado:</span>{' '}
            {selectedVariant.nombre}
          </p>
          {selectedVariant.descripcion && (
            <p className="text-xs text-primary-600 mt-1">
              {selectedVariant.descripcion}
            </p>
          )}
        </motion.div>
      )}

      {/* Info about shared stock */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          ℹ️ Todos los diseños comparten el mismo precio y stock. 
          El inventario se descuenta del producto principal sin importar qué diseño elijas.
        </p>
      </div>
    </div>
  );
}
