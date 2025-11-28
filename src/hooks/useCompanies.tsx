/**
 * useCompanies Hook
 * Manages global companies list - uses backend API
 */

'use client';

import { create } from 'zustand';
import { Company } from '@/types';
import { companiesApi } from '@/lib/api/companies.api';

interface CompaniesStore {
  companies: Company[];
  loading: boolean;
  loadCompanies: () => Promise<void>;
  addCompany: (company: Company) => void;
  updateCompany: (id: string, company: Partial<Company>) => void;
  removeCompany: (id: string) => void;
}

export const useCompanies = create<CompaniesStore>((set, get) => ({
  companies: [],
  loading: false,
  
  loadCompanies: async () => {
    // Prevent multiple simultaneous loads
    if (get().loading) return;
    
    set({ loading: true });
    try {
      const data = await companiesApi.getAll();
      console.log('Loaded companies from API:', data);
      set({ companies: data, loading: false });
    } catch (error) {
      console.error('Error loading companies:', error);
      set({ loading: false });
    }
  },

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
