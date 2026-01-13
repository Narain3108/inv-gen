/**
 * useUsersQuery
 * React Query hook for fetching and caching users
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users.api';
import { STALE_TIME } from '@/lib/query';
import { User } from '@/types';
import { toast } from 'sonner';

// User query keys
const userKeys = {
    all: ['users'] as const,
    byId: (id: string) => ['users', id] as const,
};

/**
 * Fetch all users (RBAC-filtered by backend)
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function useUsersQuery() {
    return useQuery({
        queryKey: userKeys.all,
        queryFn: async () => {
            const data = await usersApi.getAll();
            return data;
        },
        staleTime: STALE_TIME.SHORT,
        refetchOnMount: 'always',
    });
}

/**
 * Mutation for creating a user
 */
export function useCreateUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }) => {
            return usersApi.create(userData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            toast.success('User created successfully');
        },
        onError: (error: any) => {
            console.error('Error creating user:', error);
            toast.error(error.message || 'Failed to create user');
        },
    });
}

/**
 * Mutation for updating a user
 */
export function useUpdateUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
            return usersApi.update(id, data);
        },
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(userKeys.byId(updatedUser.id), updatedUser);
            queryClient.invalidateQueries({ queryKey: userKeys.all });
            toast.success('User updated successfully');
        },
        onError: (error: any) => {
            console.error('Error updating user:', error);
            toast.error(error.message || 'Failed to update user');
        },
    });
}

/**
 * Mutation for deleting a user with optimistic update
 */
export function useDeleteUserMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await usersApi.delete(id);
            return id;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: userKeys.all });

            const previousUsers = queryClient.getQueryData<User[]>(userKeys.all);

            queryClient.setQueryData<User[]>(
                userKeys.all,
                (old) => old?.filter((u) => u.id !== id) || []
            );

            return { previousUsers };
        },
        onError: (err, id, context) => {
            if (context?.previousUsers) {
                queryClient.setQueryData(userKeys.all, context.previousUsers);
            }
            toast.error('Failed to delete user');
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
        },
    });
}
