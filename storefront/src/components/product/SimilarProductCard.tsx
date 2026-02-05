/**
 * Mini Product Card for Similar Products Section
 * 
 * IMPORTANT: This is a display-only component for the "Similar Products" feature.
 * It does NOT touch or modify any existing product loading, variant selection, or cart logic.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/types';

interface MiniCardProps {
  item: Product;
}

export function SimilarProductCard({ item }: MiniCardProps) {
  // Build URL for detail page
  const targetUrl = item.variante_id 
    ? `/product/${item.id}?variante_id=${item.variante_id}`
    : `/product/${item.id}`;

  // Get display image
  const displayImage = item.imagenes?.find(i => i.es_principal)?.url || item.imagenes?.[0]?.url || item.imagen_url || '';

  // Simple price formatting
  const currencySymbol = item.moneda === 'CRC' ? '₡' : item.moneda === 'USD' ? '$' : '€';
  const formattedAmount = item.precio.toLocaleString('es-CR');

  return (
    <Link href={targetUrl} className="block hover:opacity-80 transition-opacity">
      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative w-full" style={{ paddingTop: '100%' }}>
          {displayImage ? (
            <Image
              src={displayImage}
              alt={item.nombre}
              fill
              className="object-cover"
              sizes="300px"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-3xl">📷</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            {item.nombre}
          </h4>
          <p className="text-base font-bold text-gray-900">
            {currencySymbol}{formattedAmount}
          </p>
        </div>
      </div>
    </Link>
  );
}
