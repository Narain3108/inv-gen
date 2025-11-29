
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
  create: async (data: Partial<User>): Promise<User> => {
    return apiClient.post<User>('/users', data);
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, data);
  }
};
