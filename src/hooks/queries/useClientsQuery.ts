/**
 * useClientsQuery
 * React Query hook for fetching and caching clients
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api/clients.api';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { Client } from '@/types';
import { toast } from 'sonner';

/**
 * Fetch all clients for a company
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function useClientsQuery(companyId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.clients.byCompany(companyId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await clientsApi.getAll({ company_id: companyId });
            return data;
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.MEDIUM,
        refetchOnMount: 'always', // Always refetch when component mounts
    });
}

/**
 * Mutation for creating a client
 */
export function useCreateClientMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
            return clientsApi.create(clientData);
        },
        onSuccess: (_newClient, variables) => {
            // Use the companyId from the input variables
            const companyId = (variables as any).companyId;
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.clients.byCompany(companyId) });
            }
            toast.success('Client created successfully');
        },
        onError: (error) => {
            console.error('Error creating client:', error);
            toast.error('Failed to create client');
        },
    });
}

/**
 * Mutation for updating a client
 */
export function useUpdateClientMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
            return clientsApi.update(id, data);
        },
        onSuccess: (_updatedClient, { data }) => {
            // Get companyId from the data we sent for update
            const companyId = (data as any).companyId;
            if (companyId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.clients.byCompany(companyId) });
            }
            toast.success('Client updated successfully');
        },
        onError: (error) => {
            console.error('Error updating client:', error);
            toast.error('Failed to update client');
        },
    });
}

/**
 * Mutation for deleting a client with optimistic update
 */
export function useDeleteClientMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
            await clientsApi.delete(id);
            return { id, companyId };
        },
        onMutate: async ({ id, companyId }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.clients.byCompany(companyId) });

            // Snapshot previous value
            const previousClients = queryClient.getQueryData<Client[]>(
                queryKeys.clients.byCompany(companyId)
            );

            // Optimistically remove the client
            queryClient.setQueryData<Client[]>(
                queryKeys.clients.byCompany(companyId),
                (old) => old?.filter((c) => c.id !== id) || []
            );

            return { previousClients, companyId };
        },
        onError: (err, { companyId }, context) => {
            // Rollback on error
            if (context?.previousClients) {
                queryClient.setQueryData(
                    queryKeys.clients.byCompany(companyId),
                    context.previousClients
                );
            }
            toast.error('Failed to delete client');
        },
        onSuccess: () => {
            toast.success('Client deleted successfully');
        },
    });
}
