'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { PurchaseForm } from '@/components/purchases/PurchaseForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';

export default function NewPurchasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { refreshProducts } = useAppData();

  if (!user) {
    return null;
  }

  if (!selectedCompany) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 text-center">
          <h2 className="text-xl font-semibold">Please select a company to create a purchase bill</h2>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/invoices/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSuccess = async () => {
    // Refresh products to update stock quantities
    await refreshProducts();
    // Navigate back to purchases list
    router.push('/invoices/purchases');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="bg-background rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">New Purchase Bill</h1>
          </div>

          <PurchaseForm
            companyId={selectedCompany.id}
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
