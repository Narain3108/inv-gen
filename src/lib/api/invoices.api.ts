/**
 * Invoices API
 * All invoice-related API calls
 */

import { apiClient } from './client';
import type { Invoice } from '@/types';

export interface InvoiceFilters {
  search?: string;
  company_id?: string;
  client_id?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_status?: 'unpaid' | 'partial' | 'paid';
  date_from?: string;
  date_to?: string;
  ordering?: string;
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
  getAll: async (filters?: InvoiceFilters): Promise<Invoice[]> => {
    return apiClient.get<Invoice[]>('/invoices', filters);
  },

  /**
   * Get invoices by company ID
   */
  getByCompanyId: async (companyId: string): Promise<Invoice[]> => {
    return apiClient.get<Invoice[]>('/invoices', { company_id: companyId });
  },

  /**
   * Get a single invoice by ID
   */
  getById: async (id: string): Promise<Invoice> => {
    return apiClient.get<Invoice>(`/invoices/${id}`);
  },

  /**
   * Create a new invoice
   */
  create: async (data: Partial<Invoice>): Promise<Invoice> => {
    return apiClient.post<Invoice>('/invoices', data);
  },

  /**
   * Update an existing invoice
   */
  update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    return apiClient.put<Invoice>(`/invoices/${id}`, data);
  },

  /**
   * Partially update an invoice
   */
  partialUpdate: async (id: string, data: Partial<Invoice>, companyId?: string): Promise<Invoice> => {
    const url = companyId ? `/invoices/${id}?companyId=${companyId}` : `/invoices/${id}`;
    return apiClient.patch<Invoice>(url, data);
  },

  /**
   * Delete an invoice
   */
  delete: async (id: string, companyId?: string): Promise<void> => {
    const url = companyId ? `/invoices/${id}?companyId=${companyId}` : `/invoices/${id}`;
    return apiClient.delete<void>(url);
  },

  /**
   * Add payment to an invoice
   */
  addPayment: async (id: string, payment: PaymentData): Promise<Invoice> => {
    return apiClient.post<Invoice>(`/invoices/${id}/add_payment`, payment);
  },

  /**
   * Update invoice status
   */
  updateStatus: async (id: string, status: InvoiceFilters['status'], companyId?: string): Promise<Invoice> => {
    const url = companyId ? `/invoices/${id}?companyId=${companyId}` : `/invoices/${id}`;
    return apiClient.patch<Invoice>(url, { status });
  },

  /**
   * Generate invoice number
   */
  generateNumber: async (companyId: string): Promise<{ invoice_number: string }> => {
    return apiClient.get<{ invoice_number: string }>('/invoices/generate_number', { 
      company: companyId 
    });
  },
};
