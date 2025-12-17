"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { PurchaseForm } from '@/components/purchases/PurchaseForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { purchasesApi, PurchaseBill } from '@/lib/api/purchases.api';
import { toast } from 'sonner';

export default function EditPurchaseClient() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const { refreshProducts } = useAppData();
  const [isLoading, setIsLoading] = useState(true);
  const [purchase, setPurchase] = useState<PurchaseBill | null>(null);

  const purchaseId = params.id as string;

  useEffect(() => {
    const loadPurchase = async () => {
      if (!purchaseId) return;
      try {
        const data = await purchasesApi.getById(purchaseId);
        setPurchase(data);
      } catch (error) {
        console.error("Failed to load purchase", error);
        toast.error("Failed to load purchase details");
        router.push('/invoices/purchases');
      } finally {
        setIsLoading(false);
      }
    };
    loadPurchase();
  }, [purchaseId, router]);

  if (!user) return null;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!selectedCompany || (purchase && purchase.companyId !== selectedCompany.id)) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6 text-center">
          <h2 className="text-xl font-semibold">Access Denied or Invalid Company</h2>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/invoices/purchases')}>
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSuccess = async () => {
    await refreshProducts();
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
            <h1 className="text-2xl font-bold">Edit Purchase Bill</h1>
          </div>

          {purchase && (
            <PurchaseForm
              companyId={selectedCompany.id}
              onSuccess={handleSuccess}
              onCancel={() => router.back()}
              initialData={purchase}
              purchaseId={purchaseId}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
