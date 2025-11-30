'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CompanyForm } from '@/components/company/CompanyForm';
import { companiesApi } from '@/lib/api/companies.api';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { setSelectedCompany } = useCompany();
  const { refreshCompanies } = useAppData();

  const handleCreateCompany = async (data: any) => {
    try {
      // Create the company
      const newCompany = await companiesApi.create(data);

      // Update global state
      await refreshCompanies();
      setSelectedCompany(newCompany);

      toast.success('Company profile set up successfully!');
      
      if (user?.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/invoices/dashboard');
      }
    } catch (error) {
      console.error('Error creating company:', error);
      // Error handling is already done in CompanyForm but we can add extra safety
    }
  };

  return (
    <div className="space-y-6">
       <CompanyForm onSubmit={handleCreateCompany} />
    </div>
  );
}
