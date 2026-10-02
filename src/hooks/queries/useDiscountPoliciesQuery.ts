import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query/keys';
import { useCompany } from '@/hooks/useCompany';
import type { DiscountPolicy, DiscountPolicyCreate, DiscountPolicyUpdate } from '@/lib/api/discounts.api';

export function useDiscountPoliciesQuery() {
    const queryClient = useQueryClient();

    const policiesQuery = useQuery({
        queryKey: ['discounts'],
        queryFn: () => api.discountPolicies.getAll(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const createMutation = useMutation({
        mutationFn: (data: DiscountPolicyCreate) => api.discountPolicies.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: DiscountPolicyUpdate }) => 
            api.discountPolicies.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.discountPolicies.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discounts'] });
        }
    });

    return {
        policies: policiesQuery.data || [],
        isLoading: policiesQuery.isLoading,
        error: policiesQuery.error,
        createPolicy: createMutation.mutateAsync,
        updatePolicy: updateMutation.mutateAsync,
        deletePolicy: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
