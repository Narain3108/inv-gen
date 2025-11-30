
import { apiClient } from './client';
import { Organization, User } from '@/types';
import { OrgLoginValues, OrgSignupValues, SubUserFormValues } from '@/lib/validations';

export interface OrgLoginResponse {
  organization: Organization;
  token: string; // Temporary token for Org session
}

export interface UserLoginResponse {
  user: User;
  token: string; // User session token
}

export const organizationApi = {
  // Step 1: Login to Organization
  login: async (data: OrgLoginValues): Promise<OrgLoginResponse> => {
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[organizationApi] login payload', data);
    }
    return apiClient.post<OrgLoginResponse>('/auth/org/login', data);
  },

  // Get Organization Details (Verification)
  getOrganization: async (orgId: string): Promise<Organization> => {
    return apiClient.get<Organization>(`/auth/org/${orgId}`);
  },

  // Create new Organization (Signup)
  create: async (data: OrgSignupValues): Promise<OrgLoginResponse> => {
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[organizationApi] create org payload', data);
    }
    return apiClient.post<OrgLoginResponse>('/auth/org/signup', data);
  },

  // Step 2: Login as User (within Org context)
  loginUser: async (data: { email: string; password: string; orgId: string }): Promise<UserLoginResponse> => {
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[organizationApi] loginUser payload', data);
    }
    return apiClient.post<UserLoginResponse>('/auth/user/login', data);
  },

  // Super Admin: Create Sub-User
  createSubUser: async (data: SubUserFormValues & { orgId: string }): Promise<User> => {
    const { orgId, ...rest } = data;
    const payload = { ...rest, organizationId: orgId };
    if (typeof window !== 'undefined' && (window as any).DEBUG_API) {
      console.debug('[organizationApi] createSubUser payload', payload);
    }
    return apiClient.post<User>('/auth/users', payload);
  },

  // Super Admin: Get All Users
  getUsers: async (orgId: string): Promise<User[]> => {
    return apiClient.get<User[]>(`/auth/org/${orgId}/users`);
  },

  // Super Admin: Update User
  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(`/auth/users/${userId}`, data);
  },

  // Super Admin: Delete User
  deleteUser: async (userId: string): Promise<void> => {
    return apiClient.delete<void>(`/auth/users/${userId}`);
  }
};
