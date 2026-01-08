/**
 * API Client for the Cuero&Perla Storefront
 * 
 * Features:
 * - Automatic JSON handling
 * - Error normalization
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - TypeScript strict types
 * - Auto-detection of local network IPs for mobile device access
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  Product,
  ProductsResponse,
  FeaturedProductsResponse,
  CategoriesResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  ApiError,
  ComponentsResponse,
} from '../types';

/**
 * Get the API base URL from environment or auto-detect for local development
 * 
 * Priority:
 * 1. NEXT_PUBLIC_API_URL environment variable (production)
 * 2. Auto-detection based on current hostname (local development)
 */
const getApiUrl = (): string => {
  // 1. Environment variable has highest priority
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 2. Server-side rendering: use localhost
  if (typeof window === 'undefined') {
    return 'http://localhost:3001/api';
  }
  
  // 3. Client-side: detect based on hostname
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If on Vercel production, warn about missing config
  if (hostname.includes('vercel.app')) {
    console.warn('⚠️ NEXT_PUBLIC_API_URL no configurada. Configure esta variable para producción.');
    return '/api'; // Will cause 404 but better than hardcoding
  }
  
  // If localhost or 127.0.0.1
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // If local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  // This allows mobile devices on the same network to connect
  // Note: \d{1,3} technically allows 0-999 but invalid IPs won't resolve
  const localIpPattern = /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3})$/;
  if (localIpPattern.test(hostname)) {
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // Fallback: use current hostname with port 3001
  return `${protocol}//${hostname}:3001/api`;
};

/**
 * Default timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 15000;

/**
 * Maximum retry attempts for failed requests
 */
const MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (ms)
 */
const RETRY_DELAY = 1000;

/**
 * Create configured axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: getApiUrl(),
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
    // Enable credentials (cookies) for cross-origin requests
    // Required for Safari compatibility with session cookies
    withCredentials: true,
  });

  // Request interceptor for logging in development
  client.interceptors.request.use(
    (config) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error normalization
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      const normalizedError = normalizeError(error);
      return Promise.reject(normalizedError);
    }
  );

  return client;
};

/**
 * Normalize API errors into a consistent format
 */
const normalizeError = (error: AxiosError<ApiError>): Error => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.error || `Error ${error.response.status}`;
    return new Error(message);
  } else if (error.request) {
    // Request made but no response
    if (error.code === 'ECONNABORTED') {
      return new Error('La solicitud tardó demasiado. Por favor, intenta de nuevo.');
    }
    return new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
  }
  // Error setting up request
  return new Error(error.message || 'Error desconocido');
};

/**
 * Retry logic with exponential backoff
 */
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
        throw error;
      }
      
      if (attempt < retries) {
        const delay = RETRY_DELAY * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Create the API client instance
const apiClient = createApiClient();

/**
 * Public API endpoints for the storefront
 */
export const api = {
  /**
   * Get all products with optional filtering
   */
  async getProducts(params?: {
    search?: string;
    category?: string;
    price_min?: number;
    price_max?: number;
    page?: number;
    per_page?: number;
    shuffle?: boolean;
  }): Promise<ProductsResponse> {
    return withRetry(async () => {
      const response = await apiClient.get<ProductsResponse>('/public/products', {
        params: {
          busqueda: params?.search,
          categoria: params?.category,
          precio_min: params?.price_min,
          precio_max: params?.price_max,
          pagina: params?.page,
          por_pagina: params?.per_page,
          shuffle: params?.shuffle,
        },
      });
      return response.data;
    });
  },

  /**
   * Get featured products for homepage
   */
  async getFeaturedProducts(): Promise<FeaturedProductsResponse> {
    return withRetry(async () => {
      const response = await apiClient.get<FeaturedProductsResponse>('/public/products/featured');
      return response.data;
    });
  },

  /**
   * Get a single product by ID
   */
  async getProduct(id: number): Promise<Product> {
    return withRetry(async () => {
      const response = await apiClient.get<Product>(`/public/products/${id}`);
      return response.data;
    });
  },

  /**
   * Get components for a composite product (set)
   */
  async getProductComponents(id: number): Promise<ComponentsResponse> {
    return withRetry(async () => {
      const response = await apiClient.get<ComponentsResponse>(`/public/products/${id}/componentes`);
      return response.data;
    });
  },

  /**
   * Get all product categories
   */
  async getCategories(): Promise<CategoriesResponse> {
    return withRetry(async () => {
      const response = await apiClient.get<CategoriesResponse>('/public/categories');
      return response.data;
    });
  },

  /**
   * Create a new order
   */
  async createOrder(order: CreateOrderRequest): Promise<CreateOrderResponse> {
    // No retry for order creation to prevent duplicates
    const response = await apiClient.post<CreateOrderResponse>('/public/orders', order);
    return response.data;
  },

  /**
   * Get order details by ID
   */
  async getOrder(id: number): Promise<Order> {
    return withRetry(async () => {
      const response = await apiClient.get<Order>(`/public/orders/${id}`);
      return response.data;
    });
  },
};

export default api;
