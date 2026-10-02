import { apiClient } from './client';

export interface DiscountPolicy {
    id: string;
    company_id: string;
    name: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    condition_type: 'none' | 'min_qty' | 'min_amount';
    condition_value?: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export type DiscountPolicyCreate = Omit<DiscountPolicy, 'id' | 'company_id' | 'created_at' | 'updated_at'>;
export type DiscountPolicyUpdate = Partial<DiscountPolicyCreate>;

export const discountPoliciesApi = {
    getAll: async (): Promise<DiscountPolicy[]> => {
        return apiClient.get(`/discount-policies`);
    },

    create: async (data: DiscountPolicyCreate): Promise<DiscountPolicy> => {
        return apiClient.post(`/discount-policies`, data);
    },

    update: async (policyId: string, data: DiscountPolicyUpdate): Promise<DiscountPolicy> => {
        return apiClient.put(`/discount-policies/${policyId}`, data);
    },

    delete: async (policyId: string): Promise<void> => {
        return apiClient.delete(`/discount-policies/${policyId}`);
    }
};
