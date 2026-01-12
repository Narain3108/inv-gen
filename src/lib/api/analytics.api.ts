/**
 * Analytics API Client
 * Provides access to performance metrics and dashboard analytics
 */

import { apiClient as api } from './client';

export interface EmployeeMetrics {
    employeeId: string;
    companyId: string;
    summary: {
        totalAttended: number;
        onTime: number;
        delayed: number;
        onTimePercentage: number;
    };
    pieChart: {
        labels: string[];
        data: number[];
        colors: string[];
    };
    activityHeatmap: Record<string, number>;
}

export interface DashboardAnalytics {
    companyId: string;
    serviceOverview: {
        open: number;
        pending: number;
        closed: number;
        total: number;
    };
    recentActivity: Array<{
        serviceNumber: string;
        action: string;
        by: string;
        at: string;
        clientName: string;
    }>;
    topPerformers: Array<{
        id: string;
        name: string;
        attended: number;
        solved: number;
    }>;
}

export const analyticsApi = {
    /**
     * Get performance metrics for an employee
     */
    getEmployeeMetrics: async (
        employeeId: string,
        companyId: string
    ): Promise<EmployeeMetrics> => {
        return api.get<EmployeeMetrics>(`/analytics/employee/${employeeId}`, { companyId });
    },

    /**
     * Get dashboard analytics for a company
     */
    getDashboardAnalytics: async (companyId: string): Promise<DashboardAnalytics> => {
        return api.get<DashboardAnalytics>('/analytics/dashboard', { companyId });
    },
};
