/**
 * Quotations API
 * All quotation-related API calls
 */

import { apiClient, PaginatedResponse } from './client';
import type { Quotation, Invoice } from '@/types';

export interface QuotationFilters {
  search?: string;
  company?: string;
  client?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export const quotationsApi = {
  /**
   * Get all quotations with optional filters
   */
  getAll: async (filters?: QuotationFilters): Promise<PaginatedResponse<Quotation>> => {
    return apiClient.get<PaginatedResponse<Quotation>>('/quotations/', filters);
  },

  /**
   * Get a single quotation by ID
   */
  getById: async (id: string): Promise<Quotation> => {
    return apiClient.get<Quotation>(`/quotations/${id}/`);
  },

  /**
   * Create a new quotation
   */
  create: async (data: Partial<Quotation>): Promise<Quotation> => {
    return apiClient.post<Quotation>('/quotations/', data);
  },

  /**
   * Update an existing quotation
   */
  update: async (id: string, data: Partial<Quotation>): Promise<Quotation> => {
    return apiClient.put<Quotation>(`/quotations/${id}/`, data);
  },

  /**
   * Partially update a quotation
   */
  partialUpdate: async (id: string, data: Partial<Quotation>): Promise<Quotation> => {
    return apiClient.patch<Quotation>(`/quotations/${id}/`, data);
  },

  /**
   * Delete a quotation
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/quotations/${id}/`);
  },

  /**
   * Convert quotation to invoice
   */
  convertToInvoice: async (id: string): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/quotations/${id}/convert_to_invoice/`);
  },

  /**
   * Update quotation status
   */
  updateStatus: async (id: string, status: QuotationFilters['status']): Promise<Quotation> => {
    return apiClient.patch<Quotation>(`/quotations/${id}/`, { status });
  },

  /**
   * Generate quotation number
   */
  generateNumber: async (companyId: string): Promise<{ quotation_number: string }> => {
    return apiClient.get<{ quotation_number: string }>('/quotations/generate_number/', { 
      company: companyId 
    });
  },
};
