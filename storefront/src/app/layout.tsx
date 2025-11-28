import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import { Header, Footer } from '@/components/layout';
import { CartDrawer } from '@/components/cart';
import { Toaster } from '@/components/ui';
import { STORE_CONFIG, SEO_DEFAULTS } from '@/lib/config';
import '@/styles/globals.css';

/**
 * Root Layout
 * 
 * The main layout wrapper for the Cuero&Perla storefront.
 * Includes header, footer, cart drawer, and toast notifications.
 */

export const metadata: Metadata = {
  title: {
    default: SEO_DEFAULTS.title,
    template: `%s | ${STORE_CONFIG.name}`,
  },
  description: SEO_DEFAULTS.description,
  keywords: SEO_DEFAULTS.keywords,
  authors: [{ name: STORE_CONFIG.name }],
  creator: STORE_CONFIG.name,
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    siteName: STORE_CONFIG.name,
    title: SEO_DEFAULTS.title,
    description: SEO_DEFAULTS.description,
    images: SEO_DEFAULTS.openGraph.images,
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_DEFAULTS.title,
    description: SEO_DEFAULTS.description,
    images: SEO_DEFAULTS.openGraph.images,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: STORE_CONFIG.logoOptimized.small,
    apple: STORE_CONFIG.logoOptimized.medium,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#171717',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
