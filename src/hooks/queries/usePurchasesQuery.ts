/**
 * usePurchasesQuery
 * React Query hook for fetching and caching purchase bills
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi, PurchaseBill } from '@/lib/api/purchases.api';
import { STALE_TIME } from '@/lib/query';
import { toast } from 'sonner';

// Purchase query keys
const purchaseKeys = {
    all: ['purchases'] as const,
    byCompany: (companyId: string) => ['purchases', 'company', companyId] as const,
    byId: (id: string) => ['purchases', id] as const,
};

/**
 * Fetch purchases for a company
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function usePurchasesQuery(companyId: string | undefined) {
    return useQuery({
        queryKey: purchaseKeys.byCompany(companyId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await purchasesApi.getAll(companyId);
            return data;
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.SHORT,
        refetchOnMount: 'always',
    });
}

/**
 * Mutation for creating a purchase
 */
export function useCreatePurchaseMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (purchaseData: Omit<PurchaseBill, 'id' | 'createdAt' | 'updatedAt'>) => {
            return purchasesApi.create(purchaseData);
        },
        onSuccess: (newPurchase) => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.byCompany(newPurchase.companyId) });
            // Also invalidate products since purchases affect stock
            queryClient.invalidateQueries({ queryKey: ['products', 'company', newPurchase.companyId] });
            toast.success('Purchase bill created successfully');
        },
        onError: (error) => {
            console.error('Error creating purchase:', error);
            toast.error('Failed to create purchase bill');
        },
    });
}

/**
 * Mutation for updating a purchase
 */
export function useUpdatePurchaseMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, companyId, data }: { id: string; companyId: string; data: Partial<PurchaseBill> }) => {
            return purchasesApi.update(id, data, companyId);
        },
        onSuccess: (updatedPurchase, { companyId }) => {
            queryClient.invalidateQueries({ queryKey: purchaseKeys.byCompany(companyId) });
            queryClient.invalidateQueries({ queryKey: ['products', 'company', companyId] });
            toast.success('Purchase bill updated successfully');
        },
        onError: (error) => {
            console.error('Error updating purchase:', error);
            toast.error('Failed to update purchase bill');
        },
    });
}

/**
 * Mutation for deleting a purchase with optimistic update
 */
export function useDeletePurchaseMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
            await purchasesApi.delete(id, companyId);
            return { id, companyId };
        },
        onMutate: async ({ id, companyId }) => {
            await queryClient.cancelQueries({ queryKey: purchaseKeys.byCompany(companyId) });

            const previousPurchases = queryClient.getQueryData<PurchaseBill[]>(
                purchaseKeys.byCompany(companyId)
            );

            queryClient.setQueryData<PurchaseBill[]>(
                purchaseKeys.byCompany(companyId),
                (old) => old?.filter((p) => p.id !== id) || []
            );

            return { previousPurchases, companyId };
        },
        onError: (err, { companyId }, context) => {
            if (context?.previousPurchases) {
                queryClient.setQueryData(
                    purchaseKeys.byCompany(companyId),
                    context.previousPurchases
                );
            }
            toast.error('Failed to delete purchase bill');
        },
        onSuccess: (_, { companyId }) => {
            // Also invalidate products since deleting purchases affects stock
            queryClient.invalidateQueries({ queryKey: ['products', 'company', companyId] });
            toast.success('Purchase bill deleted successfully');
        },
    });
}
