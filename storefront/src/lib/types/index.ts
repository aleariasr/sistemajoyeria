/**
 * Shared TypeScript types for the storefront application.
 * These types match the API responses from the backend public routes.
 */

/**
 * Product type as returned by the public API
 */
export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  precio: number;
  moneda: 'CRC' | 'USD' | 'EUR';
  stock_disponible: boolean;
  stock?: number; // Only available in product detail
  imagen_url: string | null;
  slug: string;
}

/**
 * Cart item with product and quantity
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Customer information for checkout
 */
export interface Customer {
  nombre: string;
  telefono: string;
  email: string;
  cedula?: string;
  direccion?: string;
}

/**
 * Order item for API submission
 */
export interface OrderItem {
  product_id: number;
  quantity: number;
}

/**
 * Order creation request
 */
export interface CreateOrderRequest {
  customer: Customer;
  items: OrderItem[];
  payment_method?: string;
  notes?: string;
}

/**
 * Order response from API
 */
export interface Order {
  id: number;
  date: string;
  total: number;
  subtotal: number;
  discount: number;
  payment_method: string;
  notes: string | null;
  items: OrderItemDetail[];
}

/**
 * Order item detail from API
 */
export interface OrderItemDetail {
  id: number;
  product_name: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

/**
 * API response for products list
 */
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * API response for featured products
 */
export interface FeaturedProductsResponse {
  products: Product[];
}

/**
 * API response for categories
 */
export interface CategoriesResponse {
  categories: string[];
}

/**
 * API response for order creation
 */
export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: {
    id: number;
    total: number;
    items_count: number;
    customer_name: string;
  };
}

/**
 * Generic API error response
 */
export interface ApiError {
  error: string;
}

/**
 * Image zoom component props
 */
export interface ImageZoomProps {
  src: string;
  alt: string;
  highResSrc?: string;
  className?: string;
  priority?: boolean;
}
