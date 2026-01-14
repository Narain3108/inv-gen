/**
 * useCompanies Hook
 * Manages global companies list - synced from React Query cache
 * This is a wrapper for backward compatibility.
 */

'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { Company } from '@/types';
import { useCompaniesQuery, useUpdateCompanyMutation } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';

interface CompaniesStore {
  companies: Company[];
  loading: boolean;
  // Note: These are kept for compatibility but now work with React Query
  setCompanies: (companies: Company[]) => void;
  setLoading: (loading: boolean) => void;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  removeCompany: (id: string) => void;
}

/**
 * Zustand store for global companies state.
 * This is synced automatically by useCompaniesSync() below.
 */
export const useCompaniesStore = create<CompaniesStore>((set) => ({
  companies: [],
  loading: false,

  setCompanies: (companies: Company[]) => set({ companies }),
  setLoading: (loading: boolean) => set({ loading }),

  addCompany: (company: Company) => {
    set((state) => ({
      companies: [...state.companies, company],
    }));
  },

  updateCompany: (id: string, updates: Partial<Company>) => {
    set((state) => ({
      companies: state.companies.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  removeCompany: (id: string) => {
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
    }));
  },
}));

/**
 * Hook that syncs React Query data to the Zustand store.
 * Use this hook at the top level of your app (e.g., in a layout or provider).
 */
export function useCompaniesSync() {
  const { data: companies, isLoading, refetch } = useCompaniesQuery();
  const store = useCompaniesStore();

  // Sync React Query data to Zustand store
  useEffect(() => {
    if (companies && companies !== store.companies) {
      store.setCompanies(companies);
    }
    if (isLoading !== store.loading) {
      store.setLoading(isLoading);
    }
  }, [companies, isLoading, store]);

  return {
    companies: companies || [],
    loading: isLoading,
    loadCompanies: refetch, // Now uses React Query refetch
    addCompany: store.addCompany,
    updateCompany: store.updateCompany,
    removeCompany: store.removeCompany,
  };
}

/**
 * Legacy hook for backward compatibility.
 * Prefer using useCompaniesQuery() directly for new code.
 */
export function useCompanies() {
  const store = useCompaniesStore();
  const queryClient = useQueryClient();

  return {
    companies: store.companies,
    loading: store.loading,
    loadCompanies: async () => {
      // Trigger React Query refetch instead of direct API call
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    addCompany: store.addCompany,
    updateCompany: store.updateCompany,
    removeCompany: store.removeCompany,
  };
};
