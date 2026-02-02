'use client';

/**
 * Purchase History Page
 * Lists all purchase bills with table/card responsive layout
 * Refactored to use PurchaseList component for consistency with InvoiceList
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { PurchaseBill } from '@/lib/api/purchases.api';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Eye, Download, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { resolveVendorName } from '@/utils/vendor';
import { TableSkeleton } from '@/components/shared/Skeletons';
import { DashboardLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { usePurchasesQuery, useDeletePurchaseMutation, useClientsQuery } from '@/hooks/queries';
import { PurchaseList } from '@/components/purchases';
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

// ==================== Helper Functions ====================

const getDisplayNumber = (bill: any) => bill.invoiceNumber || bill.billNumber || bill.invoice_number || bill.bill_number || '-';
const getDisplayDate = (bill: any) => bill.billDate || bill.date || bill.bill_date || '';

// ==================== Main Page Component ====================

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();

  // React Query for data
  const { data: purchases = [], isLoading: purchasesLoading, refetch: refetchPurchases } = usePurchasesQuery(selectedCompany?.id);
  const { data: clients = [], isLoading: clientsLoading } = useClientsQuery(selectedCompany?.id);
  const deletePurchaseMutation = useDeletePurchaseMutation();

  const isLoading = purchasesLoading || clientsLoading;

  // Local state
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseBill | null>(null);

  // Refresh on storage event (when returning from new purchase page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'purchase-created') {
        refetchPurchases();
        localStorage.removeItem('purchase-created');
      }
    };

    const handleFocus = () => {
      if (localStorage.getItem('purchase-created')) {
        refetchPurchases();
        localStorage.removeItem('purchase-created');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchPurchases]);

  if (!user) return null;

  const canEdit = user.role === 'super_admin' || user.role === 'admin';

  // Handlers
  const handleView = (bill: PurchaseBill) => setSelectedBill(bill);
  const handleEdit = (bill: PurchaseBill) => {
    if (bill.id) router.push(`/invoices/purchases/${bill.id}/edit`);
  };
  const handleDelete = async () => {
    if (!deleteTarget?.id || !selectedCompany) return;
    try {
      await deletePurchaseMutation.mutateAsync({ id: deleteTarget.id, companyId: selectedCompany.id });
    } catch (error) {
      console.error("Failed to delete purchase", error);
    } finally {
      setDeleteTarget(null);
    }
  };

  // No company selected
  if (!selectedCompany && !isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Purchase History"
            description="Track and manage your purchase bills"
          >
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase Bill
            </Button>
          </PageHeader>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              Please select a company to view purchases
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Loading state
  if (isLoading && purchases.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Purchase History"
            description="Track and manage your purchase bills"
          />
          <TableSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Purchase History"
          description="Track and manage your purchase bills"
        >
          <Button onClick={() => router.push('/invoices/purchases/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Bill
          </Button>
        </PageHeader>

        {/* Purchase List (Table/Cards) */}
        <PurchaseList
          purchases={purchases}
          clients={clients}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          canEdit={canEdit}
        />

        {/* Details Dialog */}
        <PurchaseDetailsDialog
          bill={selectedBill}
          clients={clients}
          canEdit={canEdit}
          onClose={() => setSelectedBill(null)}
          onEdit={handleEdit}
          onDelete={(bill) => {
            setSelectedBill(null);
            setDeleteTarget(bill);
          }}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the purchase bill
                and revert stock quantities for all items.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

// ==================== Purchase Details Dialog ====================

interface PurchaseDetailsDialogProps {
  bill: PurchaseBill | null;
  clients: any[];
  canEdit: boolean;
  onClose: () => void;
  onEdit: (bill: PurchaseBill) => void;
  onDelete: (bill: PurchaseBill) => void;
}

function PurchaseDetailsDialog({
  bill,
  clients,
  canEdit,
  onClose,
  onEdit,
  onDelete,
}: PurchaseDetailsDialogProps) {
  if (!bill) return null;

  const b = bill as any;
  const displayNumber = getDisplayNumber(b);
  const displayDate = getDisplayDate(b);
  const resolved = resolveVendorName(b, clients, displayNumber);
  const vendor = resolved.vendorName;
  const creator = b.createdByName || b.createdBy || b.created_by || 'Unknown';
  const total = b.totalAmount || b.total_amount || b.total || 0;
  const taxableAmount = b.taxableAmount || b.taxable_amount || 0;
  const cgst = b.cgst || 0;
  const sgst = b.sgst || 0;
  const igst = b.igst || 0;
  const refNumber = b.referenceNumber || b.reference_number;
  const poNumber = b.poNumber || b.po_number;
  const poDate = b.poDate || b.po_date;
  const ewayNumber = b.ewayNumber || b.eway_number;

  return (
    <Dialog open={!!bill} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Bill: {displayNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Badges */}
          {(poNumber || refNumber || ewayNumber) && (
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
          )}

          {/* Bill Info Grid */}
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
            <h4 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
              Items ({bill.items.length})
            </h4>
            <div className="space-y-2">
              {b.items.map((item: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {item.productName || item.product_name || item.description || 'Item'}
                      </p>
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
                      <p className="font-bold text-primary">
                        {formatCurrency(item.amount || item.lineTotal || item.line_total || 0)}
                      </p>
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

          {/* Notes */}
          {bill.notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notes</p>
              <p className="p-3 bg-muted/20 rounded text-sm">{bill.notes}</p>
            </div>
          )}

          {/* Attachment */}
          {b.attachmentUrl && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Attached Document</p>
              <div className="p-3 bg-muted/20 rounded flex items-start gap-4">
                {(b.attachmentUrl.includes('.pdf') || b.attachmentUrl.includes('resource_type/raw')) ? (
                  <div className="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-red-600" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img src={b.attachmentUrl} alt="attachment" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{b.attachmentUrl.split('/').slice(-1)[0]}</p>
                  <p className="text-xs text-muted-foreground mt-1">Uploaded document</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(b.attachmentUrl, '_blank')}
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
                        link.href = b.attachmentUrl as string;
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
        </div>

        {/* Actions Footer */}
        {canEdit && (
          <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
            <Button variant="destructive" onClick={() => onDelete(bill)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Bill
            </Button>
            <Button onClick={() => onEdit(bill)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Bill
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
