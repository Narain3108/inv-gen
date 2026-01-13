/**
 * React Query Provider
 * Configures global query client with stale-while-revalidate defaults
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

// Default stale times (in milliseconds)
const STALE_TIME = {
    SHORT: 1 * 60 * 1000,     // 1 minute - for volatile data (invoices, services)
    MEDIUM: 5 * 60 * 1000,    // 5 minutes - for semi-stable data (clients, products)
    LONG: 30 * 60 * 1000,     // 30 minutes - for stable data (companies, users)
};

// Cache times (how long to keep in cache after query is no longer active)
const GC_TIME = {
    DEFAULT: 10 * 60 * 1000,  // 10 minutes
};

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Stale-while-revalidate: Show cached data immediately, fetch in background
                staleTime: STALE_TIME.MEDIUM,
                gcTime: GC_TIME.DEFAULT,

                // Retry failed queries 3 times with exponential backoff
                retry: 3,
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

                // Refetch on window focus (when user returns to tab)
                refetchOnWindowFocus: true,

                // Don't refetch on mount if data is fresh
                refetchOnMount: false,
            },
            mutations: {
                // Retry mutations once on failure
                retry: 1,
            },
        },
    });
}

// For server-side rendering support
let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
    if (typeof window === 'undefined') {
        // Server: always create a new query client
        return makeQueryClient();
    }
    // Browser: reuse existing client
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
    // Use useState to ensure the QueryClient is only created once per component mount
    const [queryClient] = useState(() => getQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

export { STALE_TIME, GC_TIME };
