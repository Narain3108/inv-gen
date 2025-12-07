
import { apiClient } from './client';
import { User } from '@/types';

export const usersApi = {
  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/users/me');
  },
  getById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },
  getBatch: async (ids: string[]): Promise<User[]> => {
    return apiClient.post<User[]>('/users/batch', { ids });
  },
  // Get all users (optionally backend supports filtering via query params)
  getAll: async (params?: Record<string, any>): Promise<User[]> => {
    return apiClient.get<User[]>('/users', params);
  },
  getByCompany: async (companyId: string): Promise<User[]> => {
    return apiClient.get<User[]>('/users', { company_id: companyId });
  },
  // Deprecated name kept for compatibility
  getOrgUsers: async (_orgId: string): Promise<User[]> => {
    return apiClient.get<User[]>(`/users`);
  },
  create: async (data: any): Promise<User> => {
    return apiClient.post<User>('/auth/users', data);
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/auth/users/${id}`, data);
  }
  ,
  delete: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/auth/users/${id}`);
  }
};
