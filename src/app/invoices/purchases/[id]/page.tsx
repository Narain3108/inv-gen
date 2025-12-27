"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { purchasesApi } from '@/lib/api/purchases.api';
import { useCompany } from '@/hooks/useCompany';
import { clientsApi } from '@/lib/api/clients.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { resolveVendorName } from '@/utils/vendor';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';

export default function PurchaseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [bill, setBill] = useState<any | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || !selectedCompany) return;
      setIsLoading(true);
      try {
        const [b, cs] = await Promise.all([
          purchasesApi.getById(id, selectedCompany.id),
          clientsApi.getAll({ company_id: selectedCompany.id })
        ]);
        setBill(b);
        setClients(cs);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load purchase');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) return <DashboardLayout><div className="p-6">Loading...</div></DashboardLayout>;
  if (!bill) return <DashboardLayout><div className="p-6">Purchase not found</div></DashboardLayout>;

  const displayNumber = bill.invoiceNumber || bill.billNumber || bill.invoice_number || bill.bill_number || '-';
  const displayDate = bill.billDate || bill.date || bill.bill_date || '';
  const resolved = resolveVendorName(bill, clients, displayNumber);

  return (
    <DashboardLayout>
      <div className="w-full py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Purchase: {displayNumber}</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.back()}>Back</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Bill Date</p>
                    <p className="font-semibold">{formatDate(displayDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Total</p>
                    <p className="font-semibold">{formatCurrency(bill.totalAmount || bill.total || 0)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2">Items</h4>
                  <div className="space-y-2">
                    {bill.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg bg-muted/20">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{item.productName || item.product_name || item.description || 'Item'}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity || item.qty || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(item.amount || item.lineTotal || item.line_total || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground uppercase">Vendor</p>
                <p className="font-bold text-lg text-primary">{resolved.vendorName}</p>
                {resolved.source !== 'client' && (
                  <p className="text-xs text-muted-foreground mt-2">Source: {resolved.source}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
// (Removed server-only placeholder exports — this is a client-only page.)
