import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from './ProductDetail';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  // For dynamic metadata, we could fetch the product here
  // For now, return generic metadata
  return {
    title: 'Detalle del Producto',
    description: 'Ver información detallada de este producto',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  // Validate ID
  if (isNaN(productId) || productId <= 0) {
    notFound();
  }

  return (
    <div className="page-transition">
      <section className="section-spacing">
        <div className="max-w-7xl mx-auto container-padding">
          <ProductDetail productId={productId} />
        </div>
      </section>
    </div>
  );
}
