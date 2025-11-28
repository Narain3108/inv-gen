
import { apiClient } from './client';
import { User } from '@/types';

export const usersApi = {
  getById: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },
  create: async (data: Partial<User>): Promise<User> => {
    return apiClient.post<User>('/users', data);
  },
  update: async (id: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/users/${id}`, data);
  }
};
