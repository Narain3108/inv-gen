/**
 * useCompany Hook
 * Manages selected company state with localStorage persistence
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Company } from '@/types';

interface CompanyStore {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  clearSelectedCompany: () => void;
}

export const useCompany = create<CompanyStore>()(
  persist(
    (set) => ({
      selectedCompany: null,
      setSelectedCompany: (company) => set({ selectedCompany: company }),
      clearSelectedCompany: () => set({ selectedCompany: null }),
    }),
    {
      name: 'selected-company-storage',
    }
  )
);
