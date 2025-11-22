/**
 * Categories API
 * All product category-related API calls
 */

import { apiClient, PaginatedResponse } from './client';
import type { ProductCategory } from '@/types';

export interface CategoryFilters {
  search?: string;
  company?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const categoriesApi = {
  /**
   * Get all categories with optional filters
   */
  getAll: async (filters?: CategoryFilters): Promise<PaginatedResponse<ProductCategory>> => {
    return apiClient.get<PaginatedResponse<ProductCategory>>('/categories/', filters);
  },

  /**
   * Get a single category by ID
   */
  getById: async (id: string): Promise<ProductCategory> => {
    return apiClient.get<ProductCategory>(`/categories/${id}/`);
  },

  /**
   * Create a new category
   */
  create: async (data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.post<ProductCategory>('/categories/', data);
  },

  /**
   * Update an existing category
   */
  update: async (id: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.put<ProductCategory>(`/categories/${id}/`, data);
  },

  /**
   * Partially update a category
   */
  partialUpdate: async (id: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.patch<ProductCategory>(`/categories/${id}/`, data);
  },

  /**
   * Delete a category
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/categories/${id}/`);
  },
};
