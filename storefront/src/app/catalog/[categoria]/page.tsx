import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryCatalogContent from './CategoryCatalogContent';

interface CategoryPageProps {
  params: Promise<{ categoria: string }>;
}

// Category name mapping for titles
const categoryTitles: Record<string, string> = {
  todos: 'Toda la Colección',
  anillos: 'Anillos',
  aretes: 'Aretes',
  collares: 'Collares',
  pulseras: 'Pulseras',
  dijes: 'Dijes',
  pendientes: 'Pendientes',
  sets: 'Sets',
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { categoria } = await params;
  const categoryName = categoryTitles[categoria.toLowerCase()] || categoria;
  
  return {
    title: `${categoryName} - Catálogo`,
    description: `Explora nuestra colección de ${categoryName.toLowerCase()}. Joyería artesanal de alta calidad.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoria } = await params;
  
  // Normalize category to lowercase for consistency
  const normalizedCategory = categoria.toLowerCase();
  
  // Get category display name
  const categoryDisplay = categoryTitles[normalizedCategory] || categoria;

  return (
    <div className="page-transition">
      {/* Page Header */}
      <section className="bg-primary-50 py-12 md:py-16">
        <div className="max-w-7xl mx-auto container-padding">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
            {categoryDisplay}
          </h1>
          <p className="text-lg text-primary-600 max-w-2xl">
            {normalizedCategory === 'todos' 
              ? 'Explora todas nuestras piezas artesanales. Cada una cuenta una historia única.'
              : `Descubre nuestra selección de ${categoryDisplay.toLowerCase()}. Piezas únicas de alta calidad.`
            }
          </p>
        </div>
      </section>

      {/* Catalog Content */}
      <section className="section-spacing">
        <div className="max-w-7xl mx-auto container-padding">
          <CategoryCatalogContent initialCategory={normalizedCategory} />
        </div>
      </section>
    </div>
  );
}
