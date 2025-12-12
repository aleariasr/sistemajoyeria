/**
 * Store configuration and branding constants
 * 
 * This file contains all the branding and configuration for the Cuero&Perla storefront.
 */

export const STORE_CONFIG = {
  name: 'Cuero&Perla',
  tagline: 'Joyería Artesanal de Calidad',
  description: 'Descubre nuestra exclusiva colección de joyería artesanal. Piezas únicas de cuero y perlas elaboradas con la más alta calidad.',
  logo: 'https://res.cloudinary.com/dekqptpft/image/upload/v1763754027/CYP_FB-1_smbu4s.jpg',
  // Optimized versions of the logo using Cloudinary transformations
  logoOptimized: {
    small: 'https://res.cloudinary.com/dekqptpft/image/upload/c_fill,w_100,h_100,q_auto,f_auto/v1763754027/CYP_FB-1_smbu4s.jpg',
    medium: 'https://res.cloudinary.com/dekqptpft/image/upload/c_fill,w_200,h_200,q_auto,f_auto/v1763754027/CYP_FB-1_smbu4s.jpg',
    large: 'https://res.cloudinary.com/dekqptpft/image/upload/c_fill,w_400,h_400,q_auto,f_auto/v1763754027/CYP_FB-1_smbu4s.jpg',
  },
  currency: {
    code: 'CRC',
    symbol: '₡',
    locale: 'es-CR',
  },
  contact: {
    email: 'contacto@cueroyperla.com',
    phone: '+506 0000-0000',
  },
  social: {
    facebook: 'https://facebook.com/cueroyperla',
    instagram: 'https://instagram.com/cuero_y_perla',
  },
} as const;

/**
 * SEO metadata defaults
 */
export const SEO_DEFAULTS = {
  title: `${STORE_CONFIG.name} | ${STORE_CONFIG.tagline}`,
  description: STORE_CONFIG.description,
  keywords: ['joyería', 'cuero', 'perlas', 'artesanal', 'Costa Rica', 'accesorios', 'moda'] as string[],
  openGraph: {
    type: 'website' as const,
    locale: 'es_CR',
    siteName: STORE_CONFIG.name,
    images: [
      {
        url: STORE_CONFIG.logo,
        width: 1200,
        height: 630,
        alt: STORE_CONFIG.name,
      },
    ],
  },
};
