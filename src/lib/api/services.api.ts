/**
 * Services API Client
 * Handles all service management related API calls
 * Follows DRY principle - consistent with other API modules
 */

import { apiClient } from './client';
import { Service, ServiceFormData, ServiceAttendData } from '@/types';

const SERVICES_ENDPOINT = '/services';

export const servicesApi = {
    /**
     * Get all services for a company
     * @param companyId - Company ID to fetch services for
     * @param options - Optional filters (status, assignedToMe)
     */
    getAll: async (
        companyId: string,
        options?: { status?: string; assignedToMe?: boolean; limit?: number }
    ): Promise<Service[]> => {
        const params: Record<string, any> = { company: companyId };
        if (options?.status) params.status = options.status;
        if (options?.assignedToMe) params.assignedToMe = options.assignedToMe;
        if (options?.limit) params.limit = options.limit;

        return apiClient.get<Service[]>(SERVICES_ENDPOINT, params);
    },

    /**
     * Get a specific service by ID
     * @param id - Service ID
     */
    getById: async (id: string): Promise<Service> => {
        return apiClient.get<Service>(`${SERVICES_ENDPOINT}/${id}`);
    },

    /**
     * Create a new service
     * @param data - Service form data
     */
    create: async (data: ServiceFormData): Promise<Service> => {
        return apiClient.post<Service>(SERVICES_ENDPOINT, data);
    },

    /**
     * Update a service (Admin only)
     * @param id - Service ID
     * @param data - Partial service data to update
     */
    update: async (id: string, data: Partial<ServiceFormData>): Promise<Service> => {
        return apiClient.put<Service>(`${SERVICES_ENDPOINT}/${id}`, data);
    },

    /**
     * Attend/Resolve a service (Employee action)
     * @param id - Service ID
     * @param data - Attendance/Resolution data
     */
    attend: async (id: string, data: ServiceAttendData): Promise<Service> => {
        return apiClient.patch<Service>(`${SERVICES_ENDPOINT}/${id}/attend`, data);
    },

    /**
     * Delete a service (Admin only)
     * @param id - Service ID
     */
    delete: async (id: string): Promise<void> => {
        return apiClient.delete(`${SERVICES_ENDPOINT}/${id}`);
    },

    /**
     * Generate next service number for a company
     * @param companyId - Company ID
     */
    generateNumber: async (companyId: string): Promise<{ service_number: string }> => {
        return apiClient.get<{ service_number: string }>(
            `${SERVICES_ENDPOINT}/generate_number`,
            { company: companyId }
        );
    },

    /**
     * Create an invoice from a resolved service
     * @param id - Service ID
     */
    createInvoice: async (id: string): Promise<{ message: string; invoiceId: string; invoiceNumber: string }> => {
        return apiClient.post<{ message: string; invoiceId: string; invoiceNumber: string }>(
            `${SERVICES_ENDPOINT}/${id}/create_invoice`,
            {}
        );
    },

    /**
     * Approve or reject a spare part request (Admin only)
     * @param serviceId - Service ID
     * @param requestId - Spare part request ID
     * @param data - Approval data including serialNumbers and action (approve/reject)
     */
    approveSpareRequest: async (
        serviceId: string,
        requestId: string,
        data: { action: 'approve' | 'reject'; serialNumbers?: string[]; rejectionReason?: string }
    ): Promise<Service> => {
        return apiClient.patch<Service>(
            `${SERVICES_ENDPOINT}/${serviceId}/approve_request/${requestId}`,
            data
        );
    },
};
