/**
 * Global App Data Context
 * Centralized data management for companies, clients, and products
 * Prevents race conditions and ensures data is loaded once
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Company, Client, Product } from '@/types';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { companiesApi } from '@/lib/api/companies.api';
import { clientsApi } from '@/lib/api/clients.api';
import { productsApi } from '@/lib/api/products.api';
import { toast } from 'sonner';

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
  deleteClient: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const pathname = usePathname();
  
  // Define public pages where we shouldn't fetch app data
  const isPublicPage = React.useMemo(() => {
    const path = pathname || '';
    return ['/', '/onboarding'].includes(path) || path.startsWith('/auth/');
  }, [pathname]);
  
  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesInitialized, setCompaniesInitialized] = useState(false);
  
  // Clients state (global)
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsInitialized, setClientsInitialized] = useState(false);
  
  // Products state (company-specific)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsInitialized, setProductsInitialized] = useState(false);

  // Track user ID to detect user switches
  const [prevUserId, setPrevUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && user.id !== prevUserId) {
      // User changed (e.g. login as different user, or profile update)
      // Reset initialization flags to force reload
      setCompaniesInitialized(false);
      setClientsInitialized(false);
      setProductsInitialized(false);
      setPrevUserId(user.id);
    } else if (!user && prevUserId) {
      // Logout
      setPrevUserId(null);
    }
  }, [user, prevUserId]);

  // Load companies once on mount
  const loadCompanies = useCallback(async (force = false) => {
    if (!force && companiesInitialized && !companiesLoading) return; // Already loaded
    
    setCompaniesLoading(true);
    try {
      console.log('🏢 Loading companies...');
      const data = await companiesApi.getAll();
      
      setCompanies(data);
      console.log('✅ Companies loaded:', data.length);
      
      // DO NOT auto-select here - let Sidebar handle company selection
      // This prevents overriding persisted company from Zustand localStorage
      
      setCompaniesInitialized(true);
    } catch (error) {
      console.error('❌ Error loading companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  }, [companiesInitialized, companiesLoading]);

  // Load clients once on mount (global - not company-specific)
  const loadClients = useCallback(async (force = false) => {
    if (!force && clientsInitialized && !clientsLoading) return; // Already loaded
    
    setClientsLoading(true);
    try {
      console.log('👥 Loading clients...');
      const data = await clientsApi.getAll();
      
      setClients(data);
      console.log('✅ Clients loaded:', data.length);
      setClientsInitialized(true);
    } catch (error) {
      console.error('❌ Error loading clients:', error);
    } finally {
      setClientsLoading(false);
    }
  }, [clientsInitialized, clientsLoading]);

  // Load products for selected company
  const loadProducts = useCallback(async () => {
    if (!selectedCompany) {
      setProducts([]);
      setProductsInitialized(false);
      return;
    }

    // Safety check: Ensure selected company is actually in the loaded companies list
    // This prevents 403 errors when switching users with persisted selectedCompany
    if (companiesInitialized && companies.length > 0) {
        const isValid = companies.find(c => c.id === selectedCompany.id);
        if (!isValid) {
            console.log('⚠️ Skipping product load for invalid company:', selectedCompany.name);
            return;
        }
    }
    
    setProductsLoading(true);
    try {
      console.log('📦 Loading products for company:', selectedCompany.name);
      const data = await productsApi.getAll({ company_id: selectedCompany.id });
      
      setProducts(data);
      console.log('✅ Products loaded:', data.length);
      setProductsInitialized(true);
    } catch (error) {
      console.error('❌ Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [selectedCompany, companies, companiesInitialized]);

  // Initial load on mount
  useEffect(() => {
    if (authLoading) return;
    
    // Skip data fetching on public pages to prevent unnecessary API calls
    if (isPublicPage) return;

    if (user) {
      const initializeData = async () => {
        // Load companies and clients in parallel
        await Promise.all([
          loadCompanies(),
          loadClients(),
        ]);
      };
      
      initializeData();
    } else {
      // Clear data on logout
      setCompanies([]);
      setClients([]);
      setProducts([]);
      setCompaniesInitialized(false);
      setClientsInitialized(false);
      setProductsInitialized(false);
    }
  }, [user, authLoading, loadCompanies, loadClients, isPublicPage]);

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

  // Reload products when company changes
  useEffect(() => {
    if (companiesInitialized) {
      loadProducts();
    }
  }, [selectedCompany, companiesInitialized, loadProducts]);

  // Refresh methods
  const refreshCompanies = useCallback(async () => {
    setCompaniesInitialized(false);
    await loadCompanies(true);
  }, [loadCompanies]);

  const refreshClients = useCallback(async () => {
    setClientsInitialized(false);
    await loadClients(true);
  }, [loadClients]);

  const refreshProducts = useCallback(async () => {
    setProductsInitialized(false);
    await loadProducts();
  }, [loadProducts]);

  const deleteClient = useCallback(async (id: string) => {
    const previousClients = [...clients];
    setClients(prev => prev.filter(c => c.id !== id));
    
    try {
      await clientsApi.delete(id);
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
      setClients(previousClients);
      throw error;
    }
  }, [clients]);

  const deleteProduct = useCallback(async (id: string) => {
    const productToDelete = products.find(p => p.id === id);
    const previousProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== id));
    
    try {
      await productsApi.delete(id, productToDelete?.companyId);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      setProducts(previousProducts);
      throw error;
    }
  }, [products]);

  const value: AppDataContextType = {
    companies,
    companiesLoading,
    companiesInitialized,
    
    clients,
    clientsLoading,
    clientsInitialized,
    
    products,
    productsLoading,
    productsInitialized,
    
    refreshCompanies,
    refreshClients,
    refreshProducts,
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
