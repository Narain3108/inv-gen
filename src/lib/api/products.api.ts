/**
 * Products API
 * All product-related API calls
 */

import { apiClient, PaginatedResponse } from './client';
import type { Product } from '@/types';

export interface ProductFilters {
  search?: string;
  company?: string;
  category?: string;
  type?: 'product' | 'service';
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const productsApi = {
  /**
   * Get all products with optional filters
   */
  getAll: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    return apiClient.get<PaginatedResponse<Product>>('/products/', filters);
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/products/${id}/`);
  },

  /**
   * Create a new product
   */
  create: async (data: Partial<Product>): Promise<Product> => {
    return apiClient.post<Product>('/products/', data);
  },

  /**
   * Update an existing product
   */
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    return apiClient.put<Product>(`/products/${id}/`, data);
  },

  /**
   * Partially update a product
   */
  partialUpdate: async (id: string, data: Partial<Product>): Promise<Product> => {
    return apiClient.patch<Product>(`/products/${id}/`, data);
  },

  /**
   * Delete a product
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/products/${id}/`);
  },

  /**
   * Update product stock
   */
  updateStock: async (id: string, quantity: number): Promise<Product> => {
    return apiClient.patch<Product>(`/products/${id}/`, { 
      current_stock: quantity 
    });
  },
};
