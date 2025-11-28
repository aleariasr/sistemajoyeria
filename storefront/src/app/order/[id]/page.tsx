import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import OrderConfirmation from './OrderConfirmation';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Pedido #${id} Confirmado`,
    description: 'Tu pedido ha sido confirmado exitosamente.',
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  if (isNaN(orderId) || orderId <= 0) {
    notFound();
  }

  return (
    <div className="page-transition">
      <section className="section-spacing">
        <div className="max-w-2xl mx-auto container-padding">
          <OrderConfirmation orderId={orderId} />
        </div>
      </section>
    </div>
  );
}
