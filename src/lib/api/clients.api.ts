/**
 * Clients API
 * All client-related API calls
 */

import { apiClient } from './client';
import type { Client } from '@/types';

export interface ClientFilters {
  search?: string;
  company_id?: string;
  client_type?: 'individual' | 'business';
  ordering?: string;
}

export const clientsApi = {
  /**
   * Get all clients with optional filters
   */
  getAll: async (filters?: ClientFilters): Promise<Client[]> => {
    return apiClient.get<Client[]>('/clients', filters);
  },

  /**
   * Get a single client by ID
   */
  getById: async (id: string): Promise<Client> => {
    return apiClient.get<Client>(`/clients/${id}`);
  },

  /**
   * Create a new client
   */
  create: async (data: Partial<Client>): Promise<Client> => {
    return apiClient.post<Client>('/clients', data);
  },

  /**
   * Update an existing client
   */
  update: async (id: string, data: Partial<Client>): Promise<Client> => {
    return apiClient.put<Client>(`/clients/${id}`, data);
  },

  /**
   * Partially update a client
   */
  partialUpdate: async (id: string, data: Partial<Client>): Promise<Client> => {
    return apiClient.patch<Client>(`/clients/${id}`, data);
  },

  /**
   * Delete a client
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/clients/${id}/`);
  },
};
