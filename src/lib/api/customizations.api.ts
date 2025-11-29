/**
 * Customizations API
 * All customization-related API calls (subcollection under companies)
 */

import { apiClient } from './client';
import type { InvoiceCustomization } from '@/types/customization';

export const customizationsApi = {
  /**
   * Get customization for a company (returns single object, not array)
   */
  getByCompanyId: async (companyId: string, type: 'invoice' | 'quotation' = 'invoice'): Promise<InvoiceCustomization> => {
    // Backend will use x-user-id to find user, then companyId to find company
    return apiClient.get<InvoiceCustomization>(`/companies/${companyId}/customizations?type=${type}`);
  },

  /**
   * Get a single customization by ID
   */
  getById: async (companyId: string, customizationId: string): Promise<InvoiceCustomization> => {
    return apiClient.get<InvoiceCustomization>(`/companies/${companyId}/customizations/${customizationId}`);
  },

  /**
   * Create or update a customization
   */
  createOrUpdate: async (companyId: string, data: Partial<InvoiceCustomization>): Promise<InvoiceCustomization> => {
    return apiClient.post<InvoiceCustomization>(`/companies/${companyId}/customizations`, data);
  },

  /**
   * Update an existing customization
   */
  update: async (companyId: string, customizationId: string, data: Partial<InvoiceCustomization>): Promise<InvoiceCustomization> => {
    return apiClient.put<InvoiceCustomization>(`/companies/${companyId}/customizations/${customizationId}`, data);
  },

  /**
   * Delete a customization
   */
  delete: async (companyId: string, customizationId: string): Promise<void> => {
    return apiClient.delete<void>(`/companies/${companyId}/customizations/${customizationId}`);
  },
};
