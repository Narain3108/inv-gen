
import { apiClient } from './client';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
  displayName: string;
}

export interface SignupResponse {
  message: string;
  uid: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', { email, password });
  },

  signup: async (email: string, password: string, name: string): Promise<SignupResponse> => {
    return apiClient.post<SignupResponse>('/auth/signup', { email, password, name });
  },
};
