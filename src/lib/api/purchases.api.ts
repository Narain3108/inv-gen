/**
 * Purchases API
 * All purchase-related API calls
 */

import { apiClient } from './client';
import type { Product } from '@/types';

export interface PurchaseItem {
  productName: string;
  productId?: string;
  hsn?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: number;
  cessRate: number;
  amount: number;
  hasSerialNumber: boolean;
  serialNumbers: string[];
  description?: string;
  categoryId?: string;
  itemCode?: string;
}

export interface PurchaseBill {
  id?: string;
  billDate: string;
  billNumber: string;
  vendorName?: string;
  companyId: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
}

export interface PurchaseFilters {
  company_id?: string;
  companyId?: string;
}

export const purchasesApi = {
  /**
   * Get all purchase bills
   */
  getAll: async (filters?: PurchaseFilters): Promise<PurchaseBill[]> => {
    return apiClient.get<PurchaseBill[]>('/purchases', filters);
  },

  /**
   * Get a single purchase bill by ID
   */
  getById: async (id: string): Promise<PurchaseBill> => {
    return apiClient.get<PurchaseBill>(`/purchases/${id}`);
  },

  /**
   * Create a new purchase bill
   */
  create: async (data: Partial<PurchaseBill>): Promise<PurchaseBill> => {
    return apiClient.post<PurchaseBill>('/purchases', data);
  },

  /**
   * Update a purchase bill
   */
  update: async (id: string, data: Partial<PurchaseBill>): Promise<PurchaseBill> => {
    return apiClient.put<PurchaseBill>(`/purchases/${id}`, data);
  },

  /**
   * Upload attachment for a purchase (server-side Cloudinary upload)
   */
  uploadAttachment: async (id: string, file: File): Promise<PurchaseBill> => {
    return apiClient.uploadFile<PurchaseBill>(`/purchases/${id}/attachment`, file);
  },

  /**
   * Delete a purchase bill
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/purchases/${id}`);
  },
};

