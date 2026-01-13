/**
 * PrefetchableLink
 * A Next.js Link wrapper that prefetches data on hover
 * Provides the "instant load" feel without fetching everything upfront
 */

'use client';

import Link, { LinkProps } from 'next/link';
import { useCallback, type ReactNode, type MouseEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';
import { queryKeys, STALE_TIME } from '@/lib/query';
import { invoicesApi } from '@/lib/api/invoices.api';
import { servicesApi } from '@/lib/api';
import { clientsApi } from '@/lib/api/clients.api';
import { productsApi } from '@/lib/api/products.api';

type DataPrefetchType = 'invoices' | 'services' | 'clients' | 'products' | 'my-tasks' | 'dashboard';

interface PrefetchableLinkProps extends Omit<LinkProps, 'prefetch'> {
    children: ReactNode;
    /** Data types to prefetch on hover */
    dataPrefetch?: DataPrefetchType | DataPrefetchType[];
    /** Enable Next.js route prefetching */
    prefetchRoute?: boolean;
    className?: string;
}

/**
 * Link component that prefetches specified data on hover
 * Usage: <PrefetchableLink href="/invoices/invoices" prefetch="invoices">Invoices</PrefetchableLink>
 */
export function PrefetchableLink({
    children,
    dataPrefetch,
    prefetchRoute = true,
    className,
    ...linkProps
}: PrefetchableLinkProps) {
    const queryClient = useQueryClient();
    const { selectedCompany } = useCompany();

    const handleMouseEnter = useCallback(
        (e: MouseEvent<HTMLAnchorElement>) => {
            if (!selectedCompany?.id || !dataPrefetch) return;

            const companyId = selectedCompany.id;
            const prefetchTypes = Array.isArray(dataPrefetch) ? dataPrefetch : [dataPrefetch];

            prefetchTypes.forEach((type) => {
                switch (type) {
                    case 'invoices':
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.invoices.byCompany(companyId),
                            queryFn: () => invoicesApi.getByCompanyId(companyId, 50, 0),
                            staleTime: STALE_TIME.SHORT,
                        });
                        break;

                    case 'services':
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.services.byCompany(companyId),
                            queryFn: () => servicesApi.getAll(companyId),
                            staleTime: STALE_TIME.SHORT,
                        });
                        break;

                    case 'my-tasks':
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.services.byCompany(companyId),
                            queryFn: () => servicesApi.getAll(companyId, { assignedToMe: true }),
                            staleTime: STALE_TIME.SHORT,
                        });
                        break;

                    case 'clients':
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.clients.byCompany(companyId),
                            queryFn: () => clientsApi.getAll({ company_id: companyId }),
                            staleTime: STALE_TIME.MEDIUM,
                        });
                        break;

                    case 'products':
                        queryClient.prefetchQuery({
                            queryKey: queryKeys.products.byCompany(companyId),
                            queryFn: () => productsApi.getAll({ company_id: companyId }),
                            staleTime: STALE_TIME.MEDIUM,
                        });
                        break;

                    case 'dashboard':
                        // Dashboard has its own complex data fetching, skip for now
                        break;
                }
            });
        },
        [queryClient, selectedCompany, dataPrefetch]
    );

    return (
        <Link
            {...linkProps}
            prefetch={prefetchRoute}
            className={className}
            onMouseEnter={handleMouseEnter}
        >
            {children}
        </Link>
    );
}

export default PrefetchableLink;
