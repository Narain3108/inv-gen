/**
 * useCompanies Hook
 * Manages global companies list - synced from React Query cache
 * Updated: Mutations now update React Query cache directly for consistency.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { Company } from '@/types';
import { useCompaniesQuery } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';

interface CompaniesStore {
  companies: Company[];
  loading: boolean;
  setCompanies: (companies: Company[]) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Zustand store for global companies state.
 * Synced automatically by useCompaniesSync() below.
 */
export const useCompaniesStore = create<CompaniesStore>((set) => ({
  companies: [],
  loading: false,
  setCompanies: (companies: Company[]) => set({ companies }),
  setLoading: (loading: boolean) => set({ loading }),
}));

/**
 * Hook that syncs React Query data to the Zustand store.
 * Use this hook at the top level of your app (e.g., in a layout or provider).
 */
export function useCompaniesSync() {
  const { data: companies, isLoading, refetch } = useCompaniesQuery();
  const store = useCompaniesStore();
  const queryClient = useQueryClient();

  // Sync React Query data to Zustand store
  useEffect(() => {
    if (companies && companies !== store.companies) {
      store.setCompanies(companies);
    }
    if (isLoading !== store.loading) {
      store.setLoading(isLoading);
    }
  }, [companies, isLoading, store]);

  // Add company - updates both RQ cache and Zustand store
  const addCompany = useCallback((company: Company) => {
    // Update React Query cache first
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => {
      return old ? [...old, company] : [company];
    });
    // Zustand will auto-sync via the useEffect above
  }, [queryClient]);

  // Update company - updates both RQ cache and Zustand store
  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => {
      return old ? old.map((c) => (c.id === id ? { ...c, ...updates } : c)) : [];
    });
  }, [queryClient]);

  // Remove company - updates both RQ cache and Zustand store
  const removeCompany = useCallback((id: string) => {
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => {
      return old ? old.filter((c) => c.id !== id) : [];
    });
  }, [queryClient]);

  return {
    companies: companies || [],
    loading: isLoading,
    loadCompanies: refetch,
    addCompany,
    updateCompany,
    removeCompany,
  };
}

/**
 * Legacy hook for backward compatibility.
 * Uses the newer mutation logic via useCompaniesSync.
 */
export function useCompanies() {
  const store = useCompaniesStore();
  const queryClient = useQueryClient();

  const addCompany = useCallback((company: Company) => {
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => {
      return old ? [...old, company] : [company];
    });
  }, [queryClient]);

  const updateCompany = useCallback((id: string, updates: Partial<Company>) => {
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => {
      return old ? old.map((c) => (c.id === id ? { ...c, ...updates } : c)) : [];
    });
  }, [queryClient]);

  const removeCompany = useCallback((id: string) => {
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => {
      return old ? old.filter((c) => c.id !== id) : [];
    });
  }, [queryClient]);

  return {
    companies: store.companies,
    loading: store.loading,
    loadCompanies: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    addCompany,
    updateCompany,
    removeCompany,
  };
}
