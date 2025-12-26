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

  const loadPurchases = async () => {
    if (selectedCompany) {
      setIsLoading(true);
      try {
        const data = await purchasesApi.getAll(selectedCompany.id);
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

  useEffect(() => {
    loadPurchases();
  }, [selectedCompany]);

  // Listen for storage events to refresh when returning from new purchase page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'purchase-created') {
        loadPurchases();
        localStorage.removeItem('purchase-created');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check on focus in case we're in the same tab
    const handleFocus = () => {
      if (localStorage.getItem('purchase-created')) {
        loadPurchases();
        localStorage.removeItem('purchase-created');
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedCompany]);

  if (!user) return null;

  const canEdit = user.role === 'super_admin' || user.role === 'admin';

  const handleDelete = async () => {
    if (!deleteId || !selectedCompany) return;
    try {
      await purchasesApi.delete(deleteId, selectedCompany.id);
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
            {purchases.map((bill) => {
              const displayNumber = (bill as any).invoiceNumber || (bill as any).billNumber || (bill as any).invoice_number || '-';
              const displayDate = (bill as any).billDate || (bill as any).date || (bill as any).bill_date || '';
              return (
              <Card key={bill.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedBill(bill)}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{displayNumber}</span>
                            {((bill as any).vendorName || (bill as any).vendor_name) && <span className="text-muted-foreground text-sm">from {(bill as any).vendorName || (bill as any).vendor_name}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(displayDate)}</span>
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
                            <span>{(item as any).productName || (item as any).product_name || (item as any).description || 'Item'}</span>
                            <span className="font-medium">x{(item as any).quantity || (item as any).qty || 0}</span>
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
              );
            })}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Bill: {(selectedBill as any)?.invoiceNumber || (selectedBill as any)?.billNumber || (selectedBill as any)?.invoice_number || ''}</DialogTitle>
            </DialogHeader>
            {selectedBill && (() => {
              const bill = selectedBill as any;
              const displayNumber = bill.invoiceNumber || bill.billNumber || bill.invoice_number || '-';
              const displayDate = bill.billDate || bill.date || bill.bill_date || '';
              const vendor = bill.vendorName || bill.vendor_name || (bill.client && bill.client.name) || 'N/A';
              const creator = bill.createdByName || bill.createdBy || bill.created_by || 'N/A';
              const total = bill.totalAmount || bill.total_amount || bill.total || 0;

              return (
              <div className="space-y-6">
                {/* Bill Header Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Bill Date</p>
                    <p className="font-semibold text-base">{formatDate(displayDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendor</p>
                    <p className="font-semibold text-base">{vendor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-semibold text-base">{creator}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-semibold text-base text-primary">{formatCurrency(total)}</p>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h4 className="font-semibold mb-3">Items ({selectedBill.items.length})</h4>
                  <div className="space-y-3">
                    {bill.items.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{item.productName || item.product_name || item.description || 'Item'}</p>
                            {(item.hsn || item.hsn) && <p className="text-sm text-muted-foreground">HSN: {item.hsn || item.hsn}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.amount || item.lineTotal || item.line_total || 0)}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity || item.qty || 0} {item.unit || ''}</p>
                          </div>
                        </div>
                        {item.gstRate && <p className="text-sm text-muted-foreground">GST: {item.gstRate}%</p>}
                        {item.hasSerialNumber && item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-sm font-medium mb-2">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.serialNumbers.map((sn: string, snIdx: number) => (
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
                {bill.attachmentUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Attached Document</p>
                    <div className="p-3 bg-muted/20 rounded flex items-start gap-4">
                      {(
                        bill.attachmentUrl.includes('.pdf') || bill.attachmentUrl.includes('resource_type/raw')
                      ) ? (
                        <div className="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-red-600" />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                          <img src={bill.attachmentUrl} alt="attachment" className="h-full w-full object-cover" />
                        </div>
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{bill.attachmentUrl.split('/').slice(-1)[0]}</p>
                        <p className="text-xs text-muted-foreground mt-1">Uploaded document</p>

                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(bill.attachmentUrl, '_blank')}
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
                              link.href = bill.attachmentUrl as string;
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
              );
            })()}
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
