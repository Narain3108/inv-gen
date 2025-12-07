/**
 * Audit API client
 */
import { apiClient } from './client';

export interface AuditFilters {
  company_id?: string;
  resource_type?: string;
  action?: string;
  limit?: number;
}

export const auditApi = {
  getAll: async (filters?: AuditFilters): Promise<any[]> => {
    return apiClient.get<any[]>('/audit', filters);
  },

  getByCompany: async (companyId: string, limit?: number): Promise<any[]> => {
    return apiClient.get<any[]>('/audit', { company_id: companyId, limit });
  }
};

export default auditApi;
