import type { Metadata } from 'next';
import CatalogContent from './CatalogContent';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Explora nuestra colección completa de joyería artesanal. Filtros por categoría, precio y más.',
};

export default function CatalogPage() {
  return (
    <div className="page-transition">
      {/* Page Header */}
      <section className="bg-primary-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto container-padding">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            Nuestra Colección
          </h1>
          <p className="text-lg text-primary-600 max-w-2xl">
            Explora todas nuestras piezas artesanales. Cada una cuenta una historia única.
          </p>
        </div>
      </section>

      {/* Catalog Content */}
      <section className="section-spacing">
        <div className="max-w-7xl mx-auto container-padding">
          <CatalogContent />
        </div>
      </section>
    </div>
  );
}
