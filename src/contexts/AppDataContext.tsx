/**
 * Global App Data Context
 * Centralized data management for companies, clients, and products
 * Powered by React Query under the hood to ensure instant reactive updates
 * and solve split-brain state issues between React Query and Context.
 */

'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Company, Client, Product } from '@/types';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { STALE_TIME } from '@/lib/query';
import { useDeleteClientMutation, useDeleteProductMutation } from '@/hooks/queries';
import { companiesApi } from '@/lib/api/companies.api';
import { clientsApi } from '@/lib/api/clients.api';
import { productsApi } from '@/lib/api/products.api';

interface AppDataContextType {
  // Companies
  companies: Company[];
  companiesLoading: boolean;
  companiesInitialized: boolean;

  // Clients (global - not company-specific)
  clients: Client[];
  clientsLoading: boolean;
  clientsInitialized: boolean;

  // Products (filtered by selected company)
  products: Product[];
  productsLoading: boolean;
  productsInitialized: boolean;

  // Methods
  refreshCompanies: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  addCompany: (company: Company) => void;
  deleteClient: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Define public pages where we shouldn't fetch app data
  const isPublicPage = React.useMemo(() => {
    const path = pathname || '';
    return ['/', '/onboarding'].includes(path) || path.startsWith('/auth/');
  }, [pathname]);

  // Companies Query
  const { 
    data: companies = [], 
    isLoading: companiesLoading, 
    isSuccess: companiesInitialized 
  } = useQuery({
    queryKey: queryKeys.companies.all,
    queryFn: async () => {
      return companiesApi.getAll();
    },
    enabled: !isPublicPage && !!user && !authLoading,
    staleTime: STALE_TIME.LONG,
  });

  // Clients Query (scoped by current selected company)
  const { 
    data: clients = [], 
    isLoading: clientsLoading, 
    isSuccess: clientsInitialized 
  } = useQuery({
    queryKey: queryKeys.clients.byCompany(selectedCompany?.id || ''),
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      return clientsApi.getAll({ company_id: selectedCompany.id });
    },
    enabled: !isPublicPage && !!user && !authLoading && !!selectedCompany?.id,
    staleTime: STALE_TIME.MEDIUM,
  });

  // Products Query
  const { 
    data: products = [], 
    isLoading: productsLoading, 
    isSuccess: productsInitialized 
  } = useQuery({
    queryKey: queryKeys.products.byCompany(selectedCompany?.id || ''),
    queryFn: async () => {
      if (!selectedCompany?.id) return [];
      return productsApi.getAll({ company_id: selectedCompany.id });
    },
    enabled: !isPublicPage && !!user && !authLoading && !!selectedCompany?.id,
    staleTime: STALE_TIME.MEDIUM,
  });

  // Validate selected company against loaded companies
  useEffect(() => {
    if (!companiesInitialized || companiesLoading) return;

    if (selectedCompany) {
      const isValid = companies.find(c => c.id === selectedCompany.id);
      if (!isValid) {
        console.log('⚠️ Selected company not found in allowed list. Resetting...');
        if (companies.length > 0) {
          setSelectedCompany(companies[0]);
        } else {
          setSelectedCompany(null);
        }
      }
    } else if (companies.length > 0) {
      // Auto-select first company if none selected
      console.log('👉 Auto-selecting first company:', companies[0].name);
      setSelectedCompany(companies[0]);
    }
  }, [companies, companiesInitialized, companiesLoading, selectedCompany, setSelectedCompany]);

  // Refresh methods
  const refreshCompanies = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  }, [queryClient]);

  const refreshClients = useCallback(async () => {
    if (selectedCompany?.id) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.clients.byCompany(selectedCompany.id) });
    }
  }, [queryClient, selectedCompany]);

  const refreshProducts = useCallback(async () => {
    if (selectedCompany?.id) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.byCompany(selectedCompany.id) });
    }
  }, [queryClient, selectedCompany]);

  const addCompany = useCallback((company: Company) => {
    queryClient.setQueryData<Company[]>(queryKeys.companies.all, (old) => [...(old || []), company]);
    if (!selectedCompany) {
      setSelectedCompany(company);
    }
  }, [queryClient, selectedCompany, setSelectedCompany]);

  // Mutations with optimistic updates
  const deleteClientMutation = useDeleteClientMutation();
  const deleteClient = useCallback(async (id: string) => {
    if (!selectedCompany?.id) return;
    await deleteClientMutation.mutateAsync({ id, companyId: selectedCompany.id });
  }, [deleteClientMutation, selectedCompany]);

  const deleteProductMutation = useDeleteProductMutation();
  const deleteProduct = useCallback(async (id: string) => {
    if (!selectedCompany?.id) return;
    await deleteProductMutation.mutateAsync({ id, companyId: selectedCompany.id });
  }, [deleteProductMutation, selectedCompany]);

  const value: AppDataContextType = {
    companies,
    companiesLoading: companiesLoading && companies.length === 0, // only true if no data exists yet
    companiesInitialized,

    clients,
    clientsLoading: clientsLoading && clients.length === 0,
    clientsInitialized,

    products,
    productsLoading: productsLoading && products.length === 0,
    productsInitialized,

    refreshCompanies,
    refreshClients,
    refreshProducts,
    addCompany,
    deleteClient,
    deleteProduct,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}
