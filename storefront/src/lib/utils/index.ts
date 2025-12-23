/**
 * Utility functions for the Cuero&Perla Storefront
 * 
 * Price formatting, image optimization, and other helpers.
 */

import { STORE_CONFIG } from '../config';

/**
 * Format a price value according to the store's currency settings
 */
export function formatPrice(
  price: number,
  currency: 'CRC' | 'USD' | 'EUR' = 'CRC'
): string {
  const currencyMap = {
    CRC: { code: 'CRC', locale: 'es-CR', symbol: '₡' },
    USD: { code: 'USD', locale: 'en-US', symbol: '$' },
    EUR: { code: 'EUR', locale: 'de-DE', symbol: '€' },
  };

  const config = currencyMap[currency];
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    // Fallback for environments without Intl support
    return `${config.symbol}${price.toLocaleString()}`;
  }
}

/**
 * Cloudinary image optimization URL builder
 * Transforms Cloudinary URLs to include optimization parameters
 */
export function optimizeCloudinaryImage(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best';
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    crop?: 'fill' | 'fit' | 'scale' | 'pad' | 'thumb';
    gravity?: string;
    dpr?: 'auto' | '1.0' | '2.0' | '3.0';
  } = {}
): string {
  // Return placeholder if no URL
  if (!url) {
    return '/placeholder-product.svg';
  }

  // Check if it's a Cloudinary URL with proper structure
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  // Ensure the URL has exactly one /upload/ segment to avoid malformed URLs
  const uploadCount = (url.match(/\/upload\//g) || []).length;
  if (uploadCount !== 1) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto:best',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto',
    dpr = 'auto',
  } = options;

  // Build transformation string
  const transforms: string[] = [];
  
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);
  if (dpr) transforms.push(`dpr_${dpr}`);
  transforms.push(`q_${quality}`);
  transforms.push(`f_${format}`);

  const transformString = transforms.join(',');

  // Insert transformations into URL after /upload/
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Generate a low-quality placeholder image URL for progressive loading
 * Creates a blurred, low-quality version that loads quickly
 */
export function getLowQualityPlaceholder(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
  } = {}
): string {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return '/placeholder-product.svg';
  }

  const uploadCount = (url.match(/\/upload\//g) || []).length;
  if (uploadCount !== 1) {
    return url;
  }

  const { width = 50, height = 50 } = options;

  // Create a small, blurred, low-quality version for instant loading
  const transforms: string[] = [
    `w_${width}`,
    `h_${height}`,
    'c_fill',
    'q_auto:low',
    'f_auto',
    'e_blur:1000', // Heavy blur effect
  ];

  const transformString = transforms.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Create a URL-friendly slug from text
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}

/**
 * Check if we're running on the server (SSR)
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Combine class names conditionally (like clsx but simpler)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate meta title with store name
 */
export function generateMetaTitle(pageTitle?: string): string {
  if (!pageTitle) return STORE_CONFIG.name;
  return `${pageTitle} | ${STORE_CONFIG.name}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}
