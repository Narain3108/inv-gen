/**
 * useProductsQuery
 * React Query hook for fetching and caching products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products.api';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { Product } from '@/types';
import { toast } from 'sonner';

/**
 * Fetch all products for a company
 * Uses refetchOnMount to ensure fresh data when navigating back to the page
 */
export function useProductsQuery(companyId: string | undefined) {
    return useQuery({
        queryKey: queryKeys.products.byCompany(companyId || ''),
        queryFn: async () => {
            if (!companyId) return [];
            const data = await productsApi.getAll({ company_id: companyId });
            return data;
        },
        enabled: !!companyId,
        staleTime: STALE_TIME.MEDIUM,
        refetchOnMount: 'always', // Always refetch when component mounts
    });
}

/**
 * Mutation for creating a product
 */
export function useCreateProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
            return productsApi.create(productData);
        },
        onSuccess: (newProduct) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(newProduct.companyId) });
            toast.success('Product created successfully');
        },
        onError: (error) => {
            console.error('Error creating product:', error);
            toast.error('Failed to create product');
        },
    });
}

/**
 * Mutation for updating a product
 */
export function useUpdateProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            return productsApi.update(id, data);
        },
        onSuccess: (updatedProduct) => {
            // Use companyId from the returned product
            if (updatedProduct.companyId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(updatedProduct.companyId) });
            }
            toast.success('Product updated successfully');
        },
        onError: (error) => {
            console.error('Error updating product:', error);
            toast.error('Failed to update product');
        },
    });
}

/**
 * Mutation for deleting a product with optimistic update
 */
export function useDeleteProductMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
            await productsApi.delete(id, companyId);
            return { id, companyId };
        },
        onMutate: async ({ id, companyId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.products.byCompany(companyId) });

            const previousProducts = queryClient.getQueryData<Product[]>(
                queryKeys.products.byCompany(companyId)
            );

            queryClient.setQueryData<Product[]>(
                queryKeys.products.byCompany(companyId),
                (old) => old?.filter((p) => p.id !== id) || []
            );

            return { previousProducts, companyId };
        },
        onError: (err, { companyId }, context) => {
            if (context?.previousProducts) {
                queryClient.setQueryData(
                    queryKeys.products.byCompany(companyId),
                    context.previousProducts
                );
            }
            toast.error('Failed to delete product');
        },
        onSuccess: () => {
            toast.success('Product deleted successfully');
        },
    });
}
