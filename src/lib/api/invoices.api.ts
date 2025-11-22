/**
 * Invoices API
 * All invoice-related API calls
 */

import { apiClient, PaginatedResponse } from './client';
import type { Invoice } from '@/types';

export interface InvoiceFilters {
  search?: string;
  company?: string;
  client?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_status?: 'unpaid' | 'partial' | 'paid';
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export interface PaymentData {
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
}

export const invoicesApi = {
  /**
   * Get all invoices with optional filters
   */
  getAll: async (filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>> => {
    return apiClient.get<PaginatedResponse<Invoice>>('/invoices/', filters);
  },

  /**
   * Get a single invoice by ID
   */
  getById: async (id: string): Promise<Invoice> => {
    return apiClient.get<Invoice>(`/invoices/${id}/`);
  },

  /**
   * Create a new invoice
   */
  create: async (data: Partial<Invoice>): Promise<Invoice> => {
    return apiClient.post<Invoice>('/invoices/', data);
  },

  /**
   * Update an existing invoice
   */
  update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    return apiClient.put<Invoice>(`/invoices/${id}/`, data);
  },

  /**
   * Partially update an invoice
   */
  partialUpdate: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    return apiClient.patch<Invoice>(`/invoices/${id}/`, data);
  },

  /**
   * Delete an invoice
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/invoices/${id}/`);
  },

  /**
   * Add payment to an invoice
   */
  addPayment: async (id: string, payment: PaymentData): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/invoices/${id}/add_payment/`, payment);
  },

  /**
   * Update invoice status
   */
  updateStatus: async (id: string, status: InvoiceFilters['status']): Promise<Invoice> => {
    return apiClient.patch<Invoice>(`/invoices/${id}/`, { status });
  },

  /**
   * Generate invoice number
   */
  generateNumber: async (companyId: string): Promise<{ invoice_number: string }> => {
    return apiClient.get<{ invoice_number: string }>('/invoices/generate_number/', { 
      company: companyId 
    });
  },
};
