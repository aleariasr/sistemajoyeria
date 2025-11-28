import type { Metadata } from 'next';
import CartContent from './CartContent';

export const metadata: Metadata = {
  title: 'Carrito de Compras',
  description: 'Revisa los productos en tu carrito y procede al pago.',
};

export default function CartPage() {
  return (
    <div className="page-transition">
      <section className="section-spacing">
        <div className="max-w-4xl mx-auto container-padding">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-8">
            Carrito de Compras
          </h1>
          <CartContent />
        </div>
      </section>
    </div>
  );
}
