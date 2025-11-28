/**
 * API Client for the Cuero&Perla Storefront
 * 
 * Features:
 * - Automatic JSON handling
 * - Error normalization
 * - Retry logic with exponential backoff
 * - Timeout handling
 * - TypeScript strict types
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  Product,
  ProductsResponse,
  FeaturedProductsResponse,
  CategoriesResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  Order,
  ApiError,
} from '../types';

/**
 * Get the API base URL from environment or default
 */
const getApiUrl = (): string => {
  // NEXT_PUBLIC_* variables are available on both client and server in Next.js
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Development default - backend runs on port 3001
  return 'http://localhost:3001/api';
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
