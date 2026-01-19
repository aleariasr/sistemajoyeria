import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from './ProductDetail';

interface ProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  // Validate ID
  if (isNaN(productId) || productId <= 0) {
    notFound();
  }

  // Get variante_id from searchParams if present
  const searchParamsResolved = await searchParams;
  const varianteId = searchParamsResolved.variante_id 
    ? parseInt(Array.isArray(searchParamsResolved.variante_id) ? searchParamsResolved.variante_id[0] : searchParamsResolved.variante_id, 10)
    : undefined;

  return (
    <div className="page-transition">
      <section className="section-spacing">
        <div className="max-w-7xl mx-auto container-padding">
          <ProductDetail productId={productId} varianteId={varianteId} />
        </div>
      </section>
    </div>
  );
}
