import type { Metadata } from 'next';
import CheckoutContent from './CheckoutContent';

export const metadata: Metadata = {
  title: 'Finalizar Compra',
  description: 'Completa tu información para finalizar tu pedido.',
};

export default function CheckoutPage() {
  return (
    <div className="page-transition">
      <section className="section-spacing">
        <div className="max-w-4xl mx-auto container-padding">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-8">
            Finalizar Compra
          </h1>
          <CheckoutContent />
        </div>
      </section>
    </div>
  );
}
