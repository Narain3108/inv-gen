/**
 * useCompanies Hook
 * Manages global companies list with real-time updates
 */

'use client';

import { create } from 'zustand';
import { Company } from '@/types';
import { getUserDocuments } from '@/lib/firebase/firestore-helpers';

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
    set({ loading: true });
    try {
      const data = await getUserDocuments<Company>('companies', 'default-user');
      console.log('Loaded companies from Firestore:', data);
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
