'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { purchasesApi, PurchaseBill } from '@/lib/api/purchases.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Calendar, Package, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [purchases, setPurchases] = useState<PurchaseBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const loadPurchases = async () => {
      if (selectedCompany) {
        setIsLoading(true);
        try {
          const data = await purchasesApi.getAll({ company_id: selectedCompany.id });
          setPurchases(data);
        } catch (error) {
          console.error("Failed to load purchases", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    loadPurchases();
  }, [selectedCompany]);

  if (!user) return null;

  const canEdit = user.role === 'super_admin' || user.role === 'admin';

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await purchasesApi.delete(deleteId);
      toast.success('Purchase bill deleted');
      setPurchases(prev => prev.filter(p => p.id !== deleteId));
      setSelectedBill(null);
    } catch (error) {
      console.error("Failed to delete purchase", error);
      toast.error('Failed to delete purchase bill');
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (bill: PurchaseBill) => {
    if (!bill.id) return;
    router.push(`/invoices/purchases/${bill.id}/edit`);
  };

  if (!selectedCompany && !isLoading) {
    return (
      <DashboardLayout>
        <div className="w-full py-6 text-center">
          <h2 className="text-xl font-semibold">Please select a company to view purchases</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Purchase History</h1>
          <Button onClick={() => router.push('/invoices/purchases/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Purchase Bill
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : purchases.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No purchase bills found</h3>
              <p className="text-muted-foreground mb-4">Add your first purchase bill to track inventory.</p>
              <Button onClick={() => router.push('/invoices/purchases/new')}>
                Add Purchase Bill
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {purchases.map((bill) => (
              <Card key={bill.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBill(bill)}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{bill.billNumber}</span>
                          {bill.vendorName && <span className="text-muted-foreground text-sm">from {bill.vendorName}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(bill.billDate)}</span>
                          <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {bill.items.length} Items</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(bill.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                    </div>
                  </div>
                  
                  {/* Preview Items */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      {bill.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between bg-muted/30 p-2 rounded">
                              <span>{item.productName}</span>
                              <span className="font-medium">x{item.quantity}</span>
                          </div>
                      ))}
                      {bill.items.length > 3 && (
                          <div className="text-muted-foreground p-2 text-xs flex items-center">
                              +{bill.items.length - 3} more items
                          </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Bill: {selectedBill?.billNumber}</DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-6">
                {/* Bill Header Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Bill Date</p>
                    <p className="font-semibold text-base">{formatDate(selectedBill.billDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-semibold text-base">{selectedBill.vendorName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-semibold text-base">{selectedBill.createdByName || selectedBill.createdBy || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-base text-primary">{formatCurrency(selectedBill.totalAmount)}</p>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h4 className="font-semibold mb-3">Items ({selectedBill.items.length})</h4>
                  <div className="space-y-3">
                    {selectedBill.items.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.hsn && <p className="text-sm text-muted-foreground">HSN: {item.hsn}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.amount || 0)}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} {item.unit}</p>
                          </div>
                        </div>
                        {item.gstRate && <p className="text-sm text-muted-foreground">GST: {item.gstRate}%</p>}
                        {item.hasSerialNumber && item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.serialNumbers.map((sn, snIdx) => (
                                <span key={snIdx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                  {sn}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                {selectedBill.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="p-3 bg-muted/20 rounded text-sm">{selectedBill.notes}</p>
                  </div>
                )}

                {/* Attachment Section */}
                {selectedBill.attachmentUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Attached Document</p>
                    <div className="p-3 bg-muted/20 rounded flex items-start gap-4">
                      {(
                        selectedBill.attachmentUrl.includes('.pdf') || selectedBill.attachmentUrl.includes('resource_type/raw')
                      ) ? (
                        <div className="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-red-600" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                          <img src={selectedBill.attachmentUrl} alt="attachment" className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{selectedBill.attachmentUrl.split('/').slice(-1)[0]}</p>
                        <p className="text-xs text-muted-foreground mt-1">Uploaded document</p>

                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(selectedBill.attachmentUrl, '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedBill.attachmentUrl as string;
                              link.download = '';
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions Footer */}
                {canEdit && (
                  <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        if (selectedBill.id) {
                          setDeleteId(selectedBill.id);
                          setSelectedBill(null); // Close details dialog
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Bill
                    </Button>
                    <Button onClick={() => handleEdit(selectedBill)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edit Bill
                    </Button>
                  </DialogFooter>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the purchase bill and revert the stock quantities for all items in this bill.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
