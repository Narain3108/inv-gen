
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

  signup: async (email: string, password: string, name: string, username: string): Promise<SignupResponse> => {
    return apiClient.post<SignupResponse>('/auth/signup', { email, password, name, username });
  },

  googleLogin: async (token: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/google', { token });
  },

  /**
   * Get CSRF token for current user
   */
  getCsrfToken: async (): Promise<{ csrf_token: string; user_id: string }> => {
    return apiClient.post<{ csrf_token: string; user_id: string }>('/auth/csrf-token');
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    return apiClient.post<void>('/auth/logout');
  },
};
