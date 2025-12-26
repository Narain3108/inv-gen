/**
 * Purchases API
 * All purchase-related API calls
 */

import { apiClient } from './client';
import type { Address } from '@/types';

export interface PurchaseItem {
  id?: string;
  productId?: string;
  productName?: string; // For display if needed, but backend uses productId
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  gstRate: number;
  cessRate: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  cess?: number;
  lineTotal?: number;
  serialNumbers?: string[];
  itemCode?: string;
}

export interface PurchaseBill {
  id?: string;
  invoiceNumber: string; // Mapped to billNumber in backend alias
  referenceNumber?: string;
  poNumber?: string;
  poDate?: string;
  ewayNumber?: string;
  date: string; // ISO Date
  clientId: string;
  companyId: string;
  shippingAddress?: Address;
  
  items: PurchaseItem[];
  
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  totalAmountInWords?: string;
  taxBreakdown?: any[];
  
  status: string;
  paymentStatus: string;
  notes?: string;
  
  attachmentUrl?: string;
  attachmentPublicId?: string;
  
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdByName?: string;
}

export const purchasesApi = {
  /**
   * Get all purchase bills
   */
  getAll: async (companyId: string) => {
    const response = await apiClient.get<PurchaseBill[]>('/purchases', { companyId }, true);
    return response;
  },

  /**
   * Get a single purchase bill
   */
  getById: async (id: string, companyId: string) => {
    const response = await apiClient.get<PurchaseBill>(`/purchases/${id}`, { companyId }, true);
    return response;
  },

  /**
   * Create a new purchase bill
   */
  create: async (data: Partial<PurchaseBill>) => {
    const response = await apiClient.post<PurchaseBill>('/purchases', data, true);
    return response;
  },

  /**
   * Update a purchase bill
   */
  update: async (id: string, data: Partial<PurchaseBill>, companyId?: string) => {
    const company = companyId || data.companyId;
    if (!company) {
      throw new Error('Company ID is required for update');
    }
    const response = await apiClient.put<PurchaseBill>(`/purchases/${id}`, data, true, { companyId: company });
    return response;
  },

  /**
   * Delete a purchase bill
   */
  delete: async (id: string, companyId: string) => {
    console.log('[purchases.api] Deleting purchase:', id, 'companyId:', companyId);
    await apiClient.delete(`/purchases/${id}`, { companyId });
  },
};

