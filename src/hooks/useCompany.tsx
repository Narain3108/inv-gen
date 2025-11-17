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
      setSelectedCompany: (company) => {
        console.log('🏢 [Zustand Store] Setting selected company:', company?.name, company ? `(ID: ${company.id})` : '(null)');
        set({ selectedCompany: company });
      },
      clearSelectedCompany: () => {
        console.log('🏢 [Zustand Store] Clearing selected company');
        set({ selectedCompany: null });
      },
    }),
    {
      name: 'selected-company-storage',
      skipHydration: false,
      // Add onRehydrateStorage to log when state is restored
      onRehydrateStorage: () => {
        console.log('💾 [Zustand Persist] Starting hydration from localStorage...');
        return (state, error) => {
          if (error) {
            console.error('❌ [Zustand Persist] Hydration error:', error);
          } else {
            console.log('✅ [Zustand Persist] Hydration complete. Company:', state?.selectedCompany?.name || 'none');
          }
        };
      },
    }
  )
);
