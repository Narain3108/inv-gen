/**
 * Product Categories API
 * All product category-related API calls (Global for User)
 */

import { apiClient } from './client';
import type { ProductCategory } from '@/types';

export interface CategoryFilters {
  search?: string;
  ordering?: string;
}

export const categoriesApi = {
  /**
   * Get all categories (Global for User)
   */
  getAll: async (filters?: CategoryFilters): Promise<ProductCategory[]> => {
    return apiClient.get<ProductCategory[]>('/categories', filters);
  },

  /**
   * Get a single category by ID
   */
  getById: async (categoryId: string): Promise<ProductCategory> => {
    return apiClient.get<ProductCategory>(`/categories/${categoryId}`);
  },

  /**
   * Create a new category
   */
  create: async (data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.post<ProductCategory>('/categories', data);
  },

  /**
   * Update an existing category
   */
  update: async (categoryId: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.put<ProductCategory>(`/categories/${categoryId}`, data);
  },

  /**
   * Delete a category
   */
  delete: async (categoryId: string): Promise<void> => {
    return apiClient.delete<void>(`/categories/${categoryId}`);
  },
};
