/**
 * Global App Data Context
 * Centralized data management for companies, clients, and products
 * Prevents race conditions and ensures data is loaded once
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Company, Client, Product } from '@/types';
import { useCompany } from '@/hooks/useCompany';

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
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { selectedCompany, setSelectedCompany } = useCompany();
  
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

  // Load companies once on mount
  const loadCompanies = useCallback(async () => {
    if (companiesInitialized && !companiesLoading) return; // Already loaded
    
    setCompaniesLoading(true);
    try {
      console.log('🏢 Loading companies...');
      const snapshot = await getDocs(collection(db, 'companies'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];
      
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
  const loadClients = useCallback(async () => {
    if (clientsInitialized && !clientsLoading) return; // Already loaded
    
    setClientsLoading(true);
    try {
      console.log('👥 Loading clients...');
      const snapshot = await getDocs(collection(db, 'clients'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      
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
    
    setProductsLoading(true);
    try {
      console.log('📦 Loading products for company:', selectedCompany.name);
      const q = query(
        collection(db, 'products'),
        where('companyId', '==', selectedCompany.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      
      setProducts(data);
      console.log('✅ Products loaded:', data.length);
      setProductsInitialized(true);
    } catch (error) {
      console.error('❌ Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, [selectedCompany]);

  // Initial load on mount
  useEffect(() => {
    const initializeData = async () => {
      // Load companies and clients in parallel
      await Promise.all([
        loadCompanies(),
        loadClients(),
      ]);
    };
    
    initializeData();
  }, []); // Only run once on mount

  // Reload products when company changes
  useEffect(() => {
    if (companiesInitialized) {
      loadProducts();
    }
  }, [selectedCompany, companiesInitialized, loadProducts]);

  // Refresh methods
  const refreshCompanies = useCallback(async () => {
    setCompaniesInitialized(false);
    await loadCompanies();
  }, [loadCompanies]);

  const refreshClients = useCallback(async () => {
    setClientsInitialized(false);
    await loadClients();
  }, [loadClients]);

  const refreshProducts = useCallback(async () => {
    setProductsInitialized(false);
    await loadProducts();
  }, [loadProducts]);

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
