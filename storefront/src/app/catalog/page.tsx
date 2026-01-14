import { redirect } from 'next/navigation';

export default function CatalogPage() {
  // Redirect to /catalog/todos to use category-based routing
  redirect('/catalog/todos');
}
