
import { apiClient } from './client';
import { User } from '@/types';

export const usersApi = {
  getMe: async (): Promise<User> => {
    return apiClient.get<User>('/users/me');
  },
  getById: async (id: string): Promise<User> => {
    // Fallback to /me if requesting own profile, or if backend doesn't support /:id
    return apiClient.get<User>('/users/me');
  },
  getOrgUsers: async (orgId: string): Promise<User[]> => {
    return apiClient.get<User[]>(`/auth/org/${orgId}/users`);
  },
  create: async (data: any): Promise<User> => {
    return apiClient.post<User>('/auth/users', data);
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/auth/users/${id}`, data);
  }
};
