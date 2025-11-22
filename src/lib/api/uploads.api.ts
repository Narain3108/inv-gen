/**
 * Uploads API
 * File upload and Cloudinary integration
 */

import { apiClient } from './client';

export interface UploadResponse {
  url: string;
  public_id: string;
  format: string;
  resource_type: string;
  created_at: string;
}

export interface DeleteResponse {
  message: string;
  result: string;
}

export const uploadsApi = {
  /**
   * Upload a file to Cloudinary
   */
  uploadFile: async (
    file: File,
    folder?: string,
    resourceType?: 'image' | 'video' | 'raw' | 'auto'
  ): Promise<UploadResponse> => {
    return apiClient.uploadFile<UploadResponse>('/uploads/upload/', file, {
      folder: folder || 'invoice-generator',
      resource_type: resourceType || 'auto',
    });
  },

  /**
   * Upload company logo
   */
  uploadLogo: async (file: File): Promise<UploadResponse> => {
    return uploadsApi.uploadFile(file, 'logos', 'image');
  },

  /**
   * Upload invoice attachment
   */
  uploadInvoiceAttachment: async (file: File): Promise<UploadResponse> => {
    return uploadsApi.uploadFile(file, 'invoices', 'auto');
  },

  /**
   * Upload product image
   */
  uploadProductImage: async (file: File): Promise<UploadResponse> => {
    return uploadsApi.uploadFile(file, 'products', 'image');
  },

  /**
   * Delete a file from Cloudinary
   */
  deleteFile: async (publicId: string): Promise<DeleteResponse> => {
    return apiClient.post<DeleteResponse>('/uploads/delete/', { public_id: publicId });
  },
};
