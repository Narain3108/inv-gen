/**
 * useServicesQuery
 * React Query hook for fetching and caching services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { Service, ServiceAttendData } from '@/types';
import { toast } from 'sonner';

/**
 * Fetch all services for a company
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function useServicesQuery(companyId: string | undefined, status?: string) {
    return useQuery({
        // Use base key for partial matching during invalidation
        queryKey: queryKeys.services.byCompany(companyId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await servicesApi.getAll(companyId, { status });
            return data;
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.SHORT, // Services change frequently
        refetchOnMount: 'always', // Always refetch when component mounts
    });
}

/**
 * Fetch services assigned to current user (My Tasks)
 * Uses refetchOnMount to ensure fresh data when navigating back
 */
export function useMyTasksQuery(companyId: string | undefined, userId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.services.myTasks(companyId || '', userId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await servicesApi.getAll(companyId, { assignedToMe: true });
            return data;
        },
        enabled: !!companyId && !!userId,
        staleTime: STALE_TIME.SHORT,
        refetchOnMount: 'always', // Always refetch when component mounts
    });
}

/**
 * Fetch a single service by ID
 */
export function useServiceQuery(serviceId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.services.byId(serviceId || ''),
        queryFn: async () => {
            if (!serviceId) return null;
            return servicesApi.getById(serviceId);
        },
        enabled: !!serviceId,
        staleTime: STALE_TIME.SHORT,
    });
}

/**
 * Mutation for attending a service
 */
export function useAttendServiceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: ServiceAttendData }) => {
            return servicesApi.attend(id, data);
        },
        onSuccess: (updatedService) => {
            // Update the specific service in cache
            queryClient.setQueryData(
                queryKeys.services.byId(updatedService.id),
                updatedService
            );
            // Invalidate all service lists for this company (including myTasks with any userId)
            queryClient.invalidateQueries({
                queryKey: queryKeys.services.byCompany(updatedService.companyId),
            });
            // Invalidate all myTasks queries (partial match on company)
            queryClient.invalidateQueries({
                queryKey: ['services', 'my-tasks', updatedService.companyId],
            });
            toast.success(updatedService.status === 'closed' ? 'Service marked as resolved!' : 'Service attendance recorded');
        },
        onError: (error) => {
            console.error('Error attending service:', error);
            toast.error('Failed to record attendance');
        },
    });
}

/**
 * Mutation for creating a service
 */
export function useCreateServiceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (serviceData: any) => {
            return servicesApi.create(serviceData);
        },
        onSuccess: (newService) => {
            // Invalidate all service queries for this company
            queryClient.invalidateQueries({ queryKey: queryKeys.services.byCompany(newService.companyId) });
            // Also invalidate myTasks since the new service might be assigned to the current user
            queryClient.invalidateQueries({ queryKey: ['services', 'my-tasks', newService.companyId] });
            toast.success('Service created successfully');
        },
        onError: (error) => {
            console.error('Error creating service:', error);
            toast.error('Failed to create service');
        },
    });
}

/**
 * Mutation for batch deleting services with optimistic updates
 */
export function useDeleteServicesMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ serviceIds, companyId }: { serviceIds: string[]; companyId: string }) => {
            await servicesApi.batchDelete(serviceIds);
            return { serviceIds, companyId };
        },
        onMutate: async ({ serviceIds, companyId }) => {
            // Cancel outgoing queries to prevent overwriting optimistic update
            await queryClient.cancelQueries({ queryKey: queryKeys.services.byCompany(companyId) });
            await queryClient.cancelQueries({ queryKey: ['services', 'my-tasks', companyId] });

            // Snapshot previous services for company
            const previousServices = queryClient.getQueryData<Service[]>(
                queryKeys.services.byCompany(companyId)
            );

            // Snapshot previous my-tasks
            const queryCache = queryClient.getQueryCache();
            const myTasksQueries = queryCache.findAll({ queryKey: ['services', 'my-tasks', companyId] });
            const previousMyTasks = myTasksQueries.map(q => ({
                queryKey: q.queryKey,
                data: q.state.data as Service[] | undefined
            }));

            // Optimistically update the company's services cache
            queryClient.setQueryData<Service[]>(
                queryKeys.services.byCompany(companyId),
                (old) => old?.filter((service) => !serviceIds.includes(service.id)) || []
            );

            // Optimistically update any my-tasks queries
            previousMyTasks.forEach(({ queryKey }) => {
                queryClient.setQueryData<Service[]>(
                    queryKey,
                    (old) => old?.filter((service) => !serviceIds.includes(service.id)) || []
                );
            });

            return { previousServices, previousMyTasks, companyId };
        },
        onError: (err, { companyId }, context) => {
            // Rollback company services
            if (context?.previousServices) {
                queryClient.setQueryData(
                    queryKeys.services.byCompany(companyId),
                    context.previousServices
                );
            }
            // Rollback my tasks
            if (context?.previousMyTasks) {
                context.previousMyTasks.forEach(({ queryKey, data }) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
            toast.error('Failed to delete services');
        },
        onSuccess: (_data, { serviceIds, companyId }) => {
            toast.success(`Successfully deleted ${serviceIds.length} service(s)`);
            // Invalidate to fetch fresh data from backend
            queryClient.invalidateQueries({ queryKey: queryKeys.services.byCompany(companyId) });
            queryClient.invalidateQueries({ queryKey: ['services', 'my-tasks', companyId] });
        },
    });
}


/**
 * Prefetch services for a company (for link prefetching)
 */
export function usePrefetchServices() {
    const queryClient = useQueryClient();

    return (companyId: string) => {
        queryClient.prefetchQuery({
            queryKey: queryKeys.services.byCompany(companyId),
            queryFn: () => servicesApi.getAll(companyId),
            staleTime: STALE_TIME.SHORT,
        });
    };
}
