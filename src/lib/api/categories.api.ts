/**
 * Product Categories API
 * All product category-related API calls (subcollection under companies)
 */

import { apiClient } from './client';
import type { ProductCategory } from '@/types';

export interface CategoryFilters {
  search?: string;
  ordering?: string;
}

export const categoriesApi = {
  /**
   * Get all categories for a company
   */
  getByCompanyId: async (companyId: string, filters?: CategoryFilters): Promise<ProductCategory[]> => {
    return apiClient.get<ProductCategory[]>(`/companies/${companyId}/product-categories`, filters);
  },

  /**
   * Get a single category by ID
   */
  getById: async (companyId: string, categoryId: string): Promise<ProductCategory> => {
    return apiClient.get<ProductCategory>(`/companies/${companyId}/product-categories/${categoryId}`);
  },

  /**
   * Create a new category
   */
  create: async (companyId: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.post<ProductCategory>(`/companies/${companyId}/product-categories`, data);
  },

  /**
   * Update an existing category
   */
  update: async (companyId: string, categoryId: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    return apiClient.put<ProductCategory>(`/companies/${companyId}/product-categories/${categoryId}`, data);
  },

  /**
   * Delete a category
   */
  delete: async (companyId: string, categoryId: string): Promise<void> => {
    return apiClient.delete<void>(`/companies/${companyId}/product-categories/${categoryId}`);
  },
};
