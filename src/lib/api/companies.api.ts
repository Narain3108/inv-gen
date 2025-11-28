/**
 * Companies API
 * All company-related API calls
 */

import { apiClient } from './client';
import type { Company } from '@/types';

export interface CompanyFilters {
  search?: string;
  ordering?: string;
}

export const companiesApi = {
  /**
   * Get all companies
   */
  getAll: async (filters?: CompanyFilters): Promise<Company[]> => {
    return apiClient.get<Company[]>('/companies', filters);
  },

  /**
   * Get a single company by ID
   */
  getById: async (id: string): Promise<Company> => {
    return apiClient.get<Company>(`/companies/${id}`);
  },

  /**
   * Create a new company
   */
  create: async (data: Partial<Company>): Promise<Company> => {
    return apiClient.post<Company>('/companies', data);
  },

  /**
   * Update an existing company
   */
  update: async (id: string, data: Partial<Company>): Promise<Company> => {
    return apiClient.put<Company>(`/companies/${id}`, data);
  },

  /**
   * Partially update a company
   */
  partialUpdate: async (id: string, data: Partial<Company>): Promise<Company> => {
    return apiClient.patch<Company>(`/companies/${id}`, data);
  },

  /**
   * Delete a company
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/companies/${id}`);
  },
};
