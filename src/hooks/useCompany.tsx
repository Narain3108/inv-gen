/**
 * useCompany Hook
 * Manages selected company state - pure Firestore, no localStorage
 */

'use client';

import { create } from 'zustand';
import { Company } from '@/types';

interface CompanyStore {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  clearSelectedCompany: () => void;
}

export const useCompany = create<CompanyStore>((set) => ({
  selectedCompany: null,
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  clearSelectedCompany: () => set({ selectedCompany: null }),
}));
