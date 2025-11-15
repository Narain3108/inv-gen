/**
 * Invoices Page
 * Manage invoices with PDF generation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Invoice, Product, Client, Company, InvoiceItem, PaymentFormData } from '@/types';
import { InvoiceForm, InvoiceList, PaymentDialog } from '@/components/invoices';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from '@/components/ui/alert-dialog';
import { Plus } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useCompanies } from '@/hooks/useCompanies';
import { useAppData } from '@/contexts/AppDataContext';
import { generateInvoicePDF, previewInvoicePDF } from '@/lib/utils/pdf-generator';
import { amountToWords } from '@/lib/utils/number-to-words';
import { DashboardLayout } from '@/components/layout';
import { z } from 'zod';
import { invoiceFormSchema } from '@/lib/validations';
import { toast } from 'sonner';

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

function InvoicesContent() {
  const router = useRouter();
  const { selectedCompany, setSelectedCompany } = useCompany();
  
  // Use global data context for companies, clients, and products
  const {
    companies,
    companiesLoading,
    companiesInitialized,
    clients,
    clientsLoading,
    clientsInitialized,
    products,
    productsLoading,
    productsInitialized,
    refreshProducts,
  } = useAppData();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // Set company when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      setCompany(selectedCompany);
    }
  }, [selectedCompany]);

  // Define loadData function - only loads invoices now
  const loadInvoices = React.useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      console.log('📡 Fetching invoices for company:', selectedCompany.name);
      
      const invoicesSnapshot = await getDocs(
        query(
          collection(db, 'invoices'),
          where('companyId', '==', selectedCompany.id)
        )
      );

      const invoicesData = invoicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];
      
      // Sort in memory
      invoicesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setInvoices(invoicesData);
      console.log('✅ Invoices loaded:', invoicesData.length);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  // Load invoices when company is selected and global data is ready
  useEffect(() => {
    if (!companiesInitialized || !clientsInitialized) {
      return; // Wait for global data to load
    }

    if (companies.length === 0) {
      router.push('/invoices/settings/company');
      toast.error('Please create a company first.');
      return;
    }

    if (selectedCompany) {
      loadInvoices();
    }
  }, [selectedCompany, companiesInitialized, clientsInitialized, companies.length, loadInvoices, router]);

  const handleAddInvoice = () => {
    if (products.length === 0) {
      toast.error('Please add products first');
      return;
    }

    if (clients.length === 0) {
      toast.error('Please add clients first');
      return;
    }

    setEditingInvoice(undefined);
    setIsDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!selectedCompany) return;

    try {
      // Clean up invoice items to remove undefined values
      const cleanedItems = data.items.map((item: any) => {
        const cleanItem = { ...item };
        // Remove itemCode if it's undefined or empty
        if (!cleanItem.itemCode) {
          delete cleanItem.itemCode;
        }
        return cleanItem;
      });

      const invoiceData = {
        ...data,
        items: cleanedItems,
        companyId: selectedCompany.id,
        date: Timestamp.fromDate(new Date(data.date)),
        totalAmountInWords: amountToWords(data.totalAmount),
      };

      if (editingInvoice?.id) {
        // Update existing invoice - preserve payment data
        const invoiceRef = doc(db, 'invoices', editingInvoice.id);
        await updateDoc(invoiceRef, {
          ...invoiceData,
          // Preserve existing payment tracking fields
          paymentStatus: editingInvoice.paymentStatus || 'pending',
          amountPaid: editingInvoice.amountPaid || 0,
          amountPending: editingInvoice.amountPending ?? invoiceData.totalAmount,
          payments: editingInvoice.payments || [],
          updatedAt: Timestamp.now(),
        });
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice with payment tracking initialized
        await addDoc(collection(db, 'invoices'), {
          ...invoiceData,
          paymentStatus: 'pending',
          amountPaid: 0,
          amountPending: invoiceData.totalAmount,
          payments: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        // Deduct stock for each product in the invoice
        for (const item of data.items) {
          if (item.productId) {
            const product = products.find(p => p.id === item.productId);
            if (product && product.type === 'product' && typeof product.stock === 'number') {
              const newStock = product.stock - item.quantity;
              const productRef = doc(db, 'products', item.productId);
              await updateDoc(productRef, {
                stock: Math.max(0, newStock), // Ensure stock doesn't go negative
                updatedAt: Timestamp.now(),
              });
            }
          }
        }

        toast.success('Invoice created and stock updated successfully');
      }

      setIsDialogOpen(false);
      await Promise.all([
        loadInvoices(),
        refreshProducts(), // Refresh products to update stock
      ]);
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoice?.id) return;

    try {
      await deleteDoc(doc(db, 'invoices', deleteInvoice.id));
      toast.success('Invoice deleted successfully');
      setDeleteInvoice(null);
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    if (!company) return;
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) {
      toast.error('Client not found for this invoice.');
      return;
    }

    const pdfData = { invoice, company, client };
    previewInvoicePDF(pdfData as any);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (!company) return;
    const client = clients.find(c => c.id === invoice.clientId);
    if (!client) {
      toast.error('Client not found for this invoice.');
      return;
    }
    
    const pdfData = { invoice, company, client };
    generateInvoicePDF(pdfData as any);
  };

  const handleOpenPaymentDialog = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = async (paymentData: PaymentFormData) => {
    if (!paymentInvoice?.id) return;

    try {
      const invoiceRef = doc(db, 'invoices', paymentInvoice.id);
      
      // Round amounts to 2 decimal places to avoid floating point issues
      const roundTo2Decimals = (num: number) => Math.round(num * 100) / 100;
      
      // Create payment record
      const newPayment = {
        id: `payment_${Date.now()}`,
        amount: roundTo2Decimals(paymentData.amount),
        paymentDate: Timestamp.fromDate(new Date(paymentData.paymentDate)),
        paymentMode: paymentData.paymentMode,
        referenceNumber: paymentData.referenceNumber || '',
        notes: paymentData.notes || '',
        recordedAt: Timestamp.now(),
      };

      // Get current invoice data with defaults for existing invoices
      const currentPayments = paymentInvoice.payments || [];
      const currentAmountPaid = roundTo2Decimals(paymentInvoice.amountPaid || 0);
      const totalAmount = roundTo2Decimals(paymentInvoice.totalAmount);
      
      // Calculate new payment totals with proper rounding
      const newAmountPaid = roundTo2Decimals(currentAmountPaid + paymentData.amount);
      const newAmountPending = roundTo2Decimals(totalAmount - newAmountPaid);
      
      // Determine payment status with tolerance for floating point errors
      let newPaymentStatus: 'pending' | 'partially_paid' | 'paid';
      if (newAmountPending <= 0.01 || Math.abs(newAmountPending) < 0.01) { // Consider paid if pending is less than 1 paisa or negligible
        newPaymentStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partially_paid';
      } else {
        newPaymentStatus = 'pending';
      }

      // Update invoice with new payment - set pending to 0 if it's negligible
      await updateDoc(invoiceRef, {
        payments: [...currentPayments, newPayment],
        amountPaid: newAmountPaid,
        amountPending: newAmountPending <= 0.01 ? 0 : Math.max(0, newAmountPending),
        paymentStatus: newPaymentStatus,
        updatedAt: Timestamp.now(),
      });

      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      setPaymentInvoice(null);
      loadInvoices();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  if (loading || !companiesInitialized || !clientsInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Create and manage your invoices
          </p>
        </div>
        <Button onClick={handleAddInvoice}>
          <Plus className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
        clients={clients}
        onEdit={handleEditInvoice}
        onDelete={setDeleteInvoice}
        onView={handleViewInvoice}
        onDownload={handleDownloadInvoice}
        onPayment={handleOpenPaymentDialog}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingInvoice ? 'Edit Invoice' : 'New Invoice'}
            </DialogTitle>
            <DialogDescription>
              {editingInvoice
                ? 'Update the invoice details below.'
                : 'Create a new invoice for your client.'}
            </DialogDescription>
          </DialogHeader>
          {company && (
            <InvoiceForm
              invoice={editingInvoice}
              companyId={selectedCompany!.id}
              products={products}
              clients={clients}
              companyState={company.state || company.address.state}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoice} onOpenChange={() => setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {deleteInvoice?.invoiceNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        invoice={paymentInvoice}
        onSubmit={handleRecordPayment}
      />
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <InvoicesContent />
    </DashboardLayout>
  );
}
