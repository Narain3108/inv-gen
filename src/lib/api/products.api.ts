/**
 * Products API
 * All product-related API calls
 */

import { apiClient } from './client';
import type { Product } from '@/types';

export interface ProductFilters {
  search?: string;
  company_id?: string;
  category?: string;
  type?: 'product' | 'service';
  ordering?: string;
}

export const productsApi = {
  /**
   * Get all products with optional filters
   */
  getAll: async (filters?: ProductFilters): Promise<Product[]> => {
    return apiClient.get<Product[]>('/products', filters);
  },

  /**
   * Get a single product by ID
   */
  getById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /**
   * Create a new product
   */
  create: async (data: Partial<Product>): Promise<Product> => {
    return apiClient.post<Product>('/products', data);
  },

  /**
   * Update an existing product
   */
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    return apiClient.put<Product>(`/products/${id}`, data);
  },

  /**
   * Partially update a product
   */
  partialUpdate: async (id: string, data: Partial<Product>): Promise<Product> => {
    return apiClient.patch<Product>(`/products/${id}`, data);
  },

  /**
   * Delete a product
   */
  delete: async (id: string, companyId?: string): Promise<void> => {
    const url = companyId ? `/products/${id}?companyId=${companyId}` : `/products/${id}`;
    return apiClient.delete<void>(url);
  },

  /**
   * Update product stock
   */
  updateStock: async (id: string, quantity: number): Promise<Product> => {
    return apiClient.patch<Product>(`/products/${id}/`, { 
      current_stock: quantity 
    });
  },

  /**
   * Get serial numbers for a product with optional status filter
   */
  getSerials: async (id: string, status?: 'used' | 'unused'): Promise<{
    productId: string;
    productName: string;
    hasSerialNumber: boolean;
    totalSerials: number;
    serials: Record<string, any>;
  }> => {
    const params = status ? { status } : {};
    return apiClient.get(`/products/${id}/serials`, params);
  },
};
