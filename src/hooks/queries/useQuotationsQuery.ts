/**
 * useQuotationsQuery
 * React Query hook for fetching and caching quotations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '@/lib/api/quotations.api';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { Quotation } from '@/types';
import { toast } from 'sonner';

// Add quotations to queryKeys if not already present
const quotationKeys = {
    all: ['quotations'] as const,
    byCompany: (companyId: string) => ['quotations', 'company', companyId] as const,
    byId: (id: string) => ['quotations', id] as const,
};

/**
 * Fetch quotations for a company
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function useQuotationsQuery(companyId: string | undefined) {
    return useQuery({
        queryKey: quotationKeys.byCompany(companyId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await quotationsApi.getByCompanyId(companyId, 100, 0);
            return data;
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.SHORT,
        refetchOnMount: 'always',
    });
}

/**
 * Fetch a single quotation by ID
 */
export function useQuotationQuery(quotationId: string | undefined) {
    return useQuery({
        queryKey: quotationKeys.byId(quotationId || ''),
        queryFn: async () => {
            if (!quotationId) return null;
            return quotationsApi.getById(quotationId);
        },
        enabled: !!quotationId,
        staleTime: STALE_TIME.SHORT,
    });
}

/**
 * Mutation for creating a quotation
 */
export function useCreateQuotationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (quotationData: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>) => {
            return quotationsApi.create(quotationData);
        },
        onSuccess: (newQuotation) => {
            queryClient.invalidateQueries({ queryKey: quotationKeys.byCompany(newQuotation.companyId) });
            toast.success('Quotation created successfully');
        },
        onError: (error) => {
            console.error('Error creating quotation:', error);
            toast.error('Failed to create quotation');
        },
    });
}

/**
 * Mutation for updating a quotation
 */
export function useUpdateQuotationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Quotation> }) => {
            return quotationsApi.update(id, data);
        },
        onSuccess: (updatedQuotation) => {
            queryClient.setQueryData(
                quotationKeys.byId(updatedQuotation.id),
                updatedQuotation
            );
            queryClient.invalidateQueries({ queryKey: quotationKeys.byCompany(updatedQuotation.companyId) });
            toast.success('Quotation updated successfully');
        },
        onError: (error) => {
            console.error('Error updating quotation:', error);
            toast.error('Failed to update quotation');
        },
    });
}

/**
 * Mutation for deleting a quotation with optimistic update
 */
export function useDeleteQuotationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
            await quotationsApi.delete(id);
            return { id, companyId };
        },
        onMutate: async ({ id, companyId }) => {
            await queryClient.cancelQueries({ queryKey: quotationKeys.byCompany(companyId) });

            const previousQuotations = queryClient.getQueryData<Quotation[]>(
                quotationKeys.byCompany(companyId)
            );

            queryClient.setQueryData<Quotation[]>(
                quotationKeys.byCompany(companyId),
                (old) => old?.filter((q) => q.id !== id) || []
            );

            return { previousQuotations, companyId };
        },
        onError: (err, { companyId }, context) => {
            if (context?.previousQuotations) {
                queryClient.setQueryData(
                    quotationKeys.byCompany(companyId),
                    context.previousQuotations
                );
            }
            toast.error('Failed to delete quotation');
        },
        onSuccess: () => {
            toast.success('Quotation deleted successfully');
        },
    });
}

/**
 * Prefetch quotations for a company (for link prefetching)
 */
export function usePrefetchQuotations() {
    const queryClient = useQueryClient();

    return (companyId: string) => {
        queryClient.prefetchQuery({
            queryKey: quotationKeys.byCompany(companyId),
            queryFn: () => quotationsApi.getByCompanyId(companyId, 100, 0),
            staleTime: STALE_TIME.SHORT,
        });
    };
}
