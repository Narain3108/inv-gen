'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { purchasesApi, PurchaseBill } from '@/lib/api/purchases.api';
import { clientsApi } from '@/lib/api/clients.api';
import type { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Calendar, Package, Pencil, Trash2, Eye, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { resolveVendorName } from '@/utils/vendor';
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
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPurchases = async () => {
    if (selectedCompany) {
      setIsLoading(true);
      try {
        const [purchasesData, clientsData] = await Promise.all([
          purchasesApi.getAll(selectedCompany.id),
          clientsApi.getAll({ company_id: selectedCompany.id })
        ]);
        setPurchases(purchasesData);
        setClients(clientsData);
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
          <div className="flex items-center gap-2">
            <Button onClick={() => router.push('/invoices/purchases/new')}>
              <Plus className="mr-2 h-4 w-4" /> New Purchase Bill
            </Button>
          </div>
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
              const displayNumber = (bill as any).invoiceNumber || (bill as any).billNumber || (bill as any).invoice_number || (bill as any).bill_number || '-';
              const displayDate = (bill as any).billDate || (bill as any).date || (bill as any).bill_date || '';
              const resolved = resolveVendorName(bill, clients, displayNumber);
              const vendorName = resolved.vendorName;
              const refNumber = (bill as any).referenceNumber || (bill as any).reference_number || (bill as any).ref_number;
              const poNumber = (bill as any).poNumber || (bill as any).po_number;
              const cgst = (bill as any).cgst || 0;
              const sgst = (bill as any).sgst || 0;
              const igst = (bill as any).igst || 0;
              const taxableAmount = (bill as any).taxableAmount || (bill as any).taxable_amount || 0;
              const totalTax = cgst + sgst + igst;
              
              return (
              <Card key={bill.id} className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary" onClick={() => setSelectedBill(bill)}>
                <CardContent className="p-4 sm:p-6">
                  {/* Header Section */}
                  <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-lg text-primary">{displayNumber}</span>
                        {poNumber && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">PO: {poNumber}</span>
                        )}
                        {refNumber && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Ref: {refNumber}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Package className="h-4 w-4" />
                          <span className="font-medium text-foreground">{vendorName}</span>
                        </div>
                        {resolved.source !== 'client' && (
                          <span className="text-xs ml-2 px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">{resolved.source}</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(displayDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {bill.items.length} Items
                        </span>
                      </div>
                    </div>
                    
                    {/* Amount Section */}
                    <div className="text-right sm:text-left space-y-1">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(bill.totalAmount)}</p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Taxable: {formatCurrency(taxableAmount)}</p>
                        {totalTax > 0 && <p>Tax: {formatCurrency(totalTax)}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {/* Items Preview */}
                  <div className="border-t pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Items</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {bill.items.slice(0, 3).map((item, idx) => {
                        const itemName = (item as any).productName || (item as any).product_name || (item as any).description || 'Item';
                        const itemQty = (item as any).quantity || (item as any).qty || 0;
                        const itemPrice = (item as any).unitPrice || (item as any).unit_price || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center bg-muted/40 p-2 rounded text-sm">
                            <span className="truncate flex-1 mr-2">{itemName}</span>
                            <div className="text-right">
                              <span className="font-semibold">×{itemQty}</span>
                              <span className="text-xs text-muted-foreground ml-1">@{formatCurrency(itemPrice)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {bill.items.length > 3 && (
                      <p className="text-xs text-center text-muted-foreground py-1">
                        +{bill.items.length - 3} more items
                      </p>
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
              const displayNumber = bill.invoiceNumber || bill.billNumber || bill.invoice_number || bill.bill_number || '-';
              const displayDate = bill.billDate || bill.date || bill.bill_date || '';
              const resolved = resolveVendorName(bill, clients, displayNumber);
              const vendor = resolved.vendorName;
              const creator = bill.createdByName || bill.createdBy || bill.created_by || 'Unknown';
              const total = bill.totalAmount || bill.total_amount || bill.total || 0;
              const taxableAmount = bill.taxableAmount || bill.taxable_amount || 0;
              const cgst = bill.cgst || 0;
              const sgst = bill.sgst || 0;
              const igst = bill.igst || 0;
              const refNumber = bill.referenceNumber || bill.reference_number;
              const poNumber = bill.poNumber || bill.po_number;
              const poDate = bill.poDate || bill.po_date;
              const ewayNumber = bill.ewayNumber || bill.eway_number;

              return (
              <div className="space-y-4">
                {/* Header with badges */}
                <div className="flex flex-wrap gap-2 pb-4 border-b">
                  {poNumber && (
                    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1">
                      <span className="text-xs text-blue-600 font-semibold">PO: {poNumber}</span>
                      {poDate && <span className="text-xs text-blue-500 ml-2">({formatDate(poDate)})</span>}
                    </div>
                  )}
                  {refNumber && (
                    <div className="bg-purple-50 border border-purple-200 rounded px-3 py-1">
                      <span className="text-xs text-purple-600 font-semibold">Ref: {refNumber}</span>
                    </div>
                  )}
                  {ewayNumber && (
                    <div className="bg-green-50 border border-green-200 rounded px-3 py-1">
                      <span className="text-xs text-green-600 font-semibold">E-way: {ewayNumber}</span>
                    </div>
                  )}
                </div>
                
                {/* Bill Header Info */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Bill Date</p>
                    <p className="font-semibold">{formatDate(displayDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Vendor</p>
                    <p className="font-semibold text-primary">{vendor}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Created By</p>
                    <p className="font-semibold">{creator}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Taxable Amount</p>
                    <p className="font-semibold">{formatCurrency(taxableAmount)}</p>
                  </div>
                  {cgst > 0 && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">CGST</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(cgst)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase">SGST</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(sgst)}</p>
                      </div>
                    </>
                  )}
                  {igst > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">IGST</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(igst)}</p>
                    </div>
                  )}
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-xs text-muted-foreground uppercase">Total Amount</p>
                    <p className="font-bold text-xl text-primary">{formatCurrency(total)}</p>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">Items ({selectedBill.items.length})</h4>
                  <div className="space-y-2">
                    {bill.items.map((item: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.productName || item.product_name || item.description || 'Item'}</p>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                              {(item.hsn || item.hsn_code) && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded">HSN: {item.hsn || item.hsn_code}</span>
                              )}
                              {(item.itemCode || item.item_code) && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded">Code: {item.itemCode || item.item_code}</span>
                              )}
                              {item.gstRate && (
                                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">GST: {item.gstRate}%</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary">{formatCurrency(item.amount || item.lineTotal || item.line_total || 0)}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity || item.qty || 0} {item.unit || 'Unit'} × {formatCurrency(item.unitPrice || item.unit_price || 0)}
                            </p>
                            {item.discount > 0 && (
                              <p className="text-xs text-green-600">-{item.discount}% disc</p>
                            )}
                          </div>
                        </div>
                        {item.hasSerialNumber && item.serialNumbers && item.serialNumbers.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium mb-1.5 text-muted-foreground">Serial Numbers:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.serialNumbers.map((sn: string, snIdx: number) => (
                                <span key={snIdx} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-mono">
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
