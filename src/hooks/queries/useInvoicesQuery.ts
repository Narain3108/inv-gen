/**
 * useInvoicesQuery
 * React Query hook for fetching and caching invoices
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoices.api';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { Invoice } from '@/types';
import { toast } from 'sonner';

/**
 * Fetch invoices for a company with pagination
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function useInvoicesQuery(companyId: string | undefined, limit = 50, offset = 0) {
    return useQuery({
        // Use base key for partial matching during invalidation
        queryKey: queryKeys.invoices.byCompany(companyId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await invoicesApi.getByCompanyId(companyId, limit, offset);
            return data;
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.SHORT, // Invoices change frequently
        refetchOnMount: 'always', // Always refetch when component mounts
    });
}

/**
 * Fetch a single invoice by ID
 */
export function useInvoiceQuery(invoiceId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.invoices.byId(invoiceId || ''),
        queryFn: async () => {
            if (!invoiceId) return null;
            return invoicesApi.getById(invoiceId);
        },
        enabled: !!invoiceId,
        staleTime: STALE_TIME.SHORT,
    });
}

/**
 * Mutation for creating an invoice
 */
export function useCreateInvoiceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
            return invoicesApi.create(invoiceData);
        },
        onSuccess: (newInvoice) => {
            // Invalidate invoice list to trigger refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(newInvoice.companyId) });
            toast.success('Invoice created successfully');
        },
        onError: (error) => {
            console.error('Error creating invoice:', error);
            toast.error('Failed to create invoice');
        },
    });
}

/**
 * Mutation for updating an invoice (PATCH)
 */
export function useUpdateInvoiceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data, companyId }: { id: string; data: Partial<Invoice>; companyId: string }) => {
            return invoicesApi.partialUpdate(id, data, companyId);
        },
        onSuccess: (updatedInvoice, { companyId }) => {
            // Update the specific invoice in cache
            queryClient.setQueryData(
                queryKeys.invoices.byId(updatedInvoice.id),
                updatedInvoice
            );
            // Invalidate the list
            queryClient.invalidateQueries({ queryKey: queryKeys.invoices.byCompany(companyId) });
        },
        onError: (error) => {
            console.error('Error updating invoice:', error);
            toast.error('Failed to update invoice');
        },
    });
}

/**
 * Mutation for deleting an invoice with optimistic update
 */
export function useDeleteInvoiceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
            await invoicesApi.delete(id, companyId);
            return { id, companyId };
        },
        onMutate: async ({ id, companyId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.invoices.byCompany(companyId) });

            // Get all cached queries for this company's invoices
            const queryKey = queryKeys.invoices.byCompany(companyId);

            // Snapshot for rollback
            const previousData = queryClient.getQueriesData({ queryKey });

            // Optimistically remove from all matching queries
            queryClient.setQueriesData<Invoice[]>(
                { queryKey },
                (old) => old?.filter((inv) => inv.id !== id) || []
            );

            return { previousData, companyId };
        },
        onError: (err, { companyId }, context) => {
            // Rollback on error
            if (context?.previousData) {
                context.previousData.forEach(([key, data]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            toast.error('Failed to delete invoice');
        },
        onSuccess: () => {
            toast.success('Invoice deleted successfully');
        },
    });
}

/**
 * Prefetch invoices for a company (for link prefetching)
 */
export function usePrefetchInvoices() {
    const queryClient = useQueryClient();

    return (companyId: string) => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.invoices.byCompany(companyId),
            queryFn: () => invoicesApi.getByCompanyId(companyId, 50, 0),
            staleTime: STALE_TIME.SHORT,
        });
    };
}
