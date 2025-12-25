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
import { purchasesApi } from '@/lib/api/purchases.api';
import { toast } from 'sonner';

export default function NewPurchasePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { products, clients, refreshProducts } = useAppData();

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

  const handleSubmit = async (data: any) => {
    try {
      await purchasesApi.create(data);
      // Refresh products to update stock quantities
      await refreshProducts();
      router.push('/invoices/purchases');
    } catch (error) {
      console.error('Failed to create purchase', error);
      throw error; // Re-throw to let form handle error display if needed
    }
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
            company={selectedCompany}
            products={products}
            clients={clients}
            companyState={selectedCompany.address?.state || ''}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
