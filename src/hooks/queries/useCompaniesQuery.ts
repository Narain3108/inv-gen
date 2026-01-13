/**
 * useCompaniesQuery
 * React Query hook for fetching and caching companies
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api/companies.api';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { Company } from '@/types';
import { toast } from 'sonner';

/**
 * Fetch all companies the user has access to
 */
export function useCompaniesQuery() {
    return useQuery({
        queryKey: queryKeys.companies.all,
        queryFn: async () => {
            const data = await companiesApi.getAll();
            return data;
        },
        staleTime: STALE_TIME.LONG, // Companies rarely change
    });
}

/**
 * Fetch a single company by ID
 */
export function useCompanyQuery(companyId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.companies.byId(companyId || ''),
        queryFn: async () => {
            if (!companyId) return null;
            return companiesApi.getById(companyId);
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.LONG,
    });
}

/**
 * Mutation for updating a company
 */
export function useUpdateCompanyMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
            return companiesApi.update(id, data);
        },
        onSuccess: (updatedCompany) => {
            // Update the specific company in cache
            queryClient.setQueryData(
                queryKeys.companies.byId(updatedCompany.id),
                updatedCompany
            );
            // Invalidate the list to trigger background refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
            toast.success('Company updated successfully');
        },
        onError: (error) => {
            console.error('Error updating company:', error);
            toast.error('Failed to update company');
        },
    });
}
