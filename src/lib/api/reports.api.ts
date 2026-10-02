import { apiClient } from './client';

export const reportsApi = {
  /**
   * Export GSTR-1 JSON for a given company and period.
   * @param companyId Company ID
   * @param period Financial Period in MMYYYY format (e.g. 082026)
   */
  exportGstr1: async (companyId: string, period: string): Promise<any> => {
    return apiClient.get<any>(`/reports/${companyId}/gstr1`, { period }, true);
  },
};
