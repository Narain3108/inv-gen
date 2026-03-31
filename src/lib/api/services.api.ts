/**
 * Services API Client
 * Handles all service management related API calls
 * Follows DRY principle - consistent with other API modules
 */

import { apiClient } from './client';
import { Service, ServiceFormData, ServiceAttendData } from '@/types';

/** Shape returned by GET /services/:id/invoice_prefill */
export interface ServiceInvoicePrefillItem {
    productId: string | null;
    productName: string;
    hsn: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    gstRate: number;
    serialNumbers: string[];
}

export interface ServiceInvoicePrefill {
    serviceId: string;
    clientId: string;
    clientName: string;
    referenceNumber: string;
    serviceType: string;
    problemDescription: string;
    resolution: { actionTaken: string | null; observation: string | null };
    items: ServiceInvoicePrefillItem[];
}

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
     * Get invoice prefill data from a resolved service
     * @param id - Service ID
     */
    getInvoicePrefill: async (id: string): Promise<ServiceInvoicePrefill> => {
        return apiClient.get<ServiceInvoicePrefill>(
            `${SERVICES_ENDPOINT}/${id}/invoice_prefill`
        );
    },

    /**
     * Link a newly created invoice back to a service
     * @param serviceId - Service ID
     * @param invoiceId - Invoice ID to link
     */
    linkInvoice: async (
        serviceId: string,
        invoiceId: string
    ): Promise<{ message: string; invoiceId: string }> => {
        return apiClient.patch<{ message: string; invoiceId: string }>(
            `${SERVICES_ENDPOINT}/${serviceId}/link_invoice?invoiceId=${encodeURIComponent(invoiceId)}`,
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
