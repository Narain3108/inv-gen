/**
 * Quotations API
 * All quotation-related API calls
 */

import { apiClient } from './client';
import type { Quotation, Invoice } from '@/types';

export interface QuotationFilters {
  search?: string;
  company_id?: string;
  client_id?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  date_from?: string;
  date_to?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export const quotationsApi = {
  /**
   * Get all quotations with optional filters
   */
  getAll: async (filters?: QuotationFilters): Promise<Quotation[]> => {
    return apiClient.get<Quotation[]>('/quotations', filters);
  },

  /**
   * Get quotations by company ID
   * Used for dashboard and list views
   */
  getByCompanyId: async (companyId: string, limit: number = 50, offset: number = 0): Promise<Quotation[]> => {
    return apiClient.get<Quotation[]>('/quotations', { company_id: companyId, limit, offset });
  },

  /**
   * Get a single quotation by ID
   */
  getById: async (id: string): Promise<Quotation> => {
    return apiClient.get<Quotation>(`/quotations/${id}`);
  },

  /**
   * Create a new quotation
   */
  create: async (data: Partial<Quotation>): Promise<Quotation> => {
    return apiClient.post<Quotation>('/quotations', data);
  },

  /**
   * Update an existing quotation
   */
  update: async (id: string, data: Partial<Quotation>): Promise<Quotation> => {
    return apiClient.put<Quotation>(`/quotations/${id}`, data);
  },

  /**
   * Partially update a quotation
   */
  partialUpdate: async (id: string, data: Partial<Quotation>, companyId?: string): Promise<Quotation> => {
    const url = companyId ? `/quotations/${id}?companyId=${companyId}` : `/quotations/${id}`;
    return apiClient.patch<Quotation>(url, data);
  },

  /**
   * Delete a quotation
   */
  delete: async (id: string, companyId?: string): Promise<void> => {
    const url = companyId ? `/quotations/${id}?companyId=${companyId}` : `/quotations/${id}`;
    return apiClient.delete<void>(url);
  },

  /**
   * Convert quotation to invoice
   */
  convertToInvoice: async (id: string): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/quotations/${id}/convert_to_invoice`);
  },

  /**
   * Update quotation status
   */
  updateStatus: async (id: string, status: QuotationFilters['status'], companyId?: string): Promise<Quotation> => {
    const url = companyId ? `/quotations/${id}?companyId=${companyId}` : `/quotations/${id}`;
    return apiClient.patch<Quotation>(url, { status });
  },

  /**
   * Generate quotation number
   */
  generateNumber: async (companyId: string): Promise<{ quotation_number: string }> => {
    return apiClient.get<{ quotation_number: string }>('/quotations/generate_number', {
      company: companyId
    });
  },
};
