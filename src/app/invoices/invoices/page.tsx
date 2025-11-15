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
  const { companies, loading: companiesLoading, loadCompanies } = useCompanies();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
  const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load companies on mount
  useEffect(() => {
    const init = async () => {
      await loadCompanies();
      setInitialized(true);
    };
    init();
  }, []);

  // Auto-select first company if none selected
  useEffect(() => {
    if (initialized && !selectedCompany && companies.length > 0) {
      console.log('Auto-selecting first company:', companies[0]);
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany, initialized, setSelectedCompany]);

  // Define loadData function with useCallback to prevent infinite loops
  const loadData = React.useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      // Set company
      setCompany(selectedCompany);

      // Load all data in parallel to avoid race conditions
      console.log('📡 Fetching invoices, products, and clients in parallel...');
      const [invoicesSnapshot, productsSnapshot, clientsSnapshot] = await Promise.all([
        // Load invoices - Only filter by companyId
        getDocs(
          query(
            collection(db, 'invoices'),
            where('companyId', '==', selectedCompany.id)
          )
        ),
        // Load products - Filter by companyId
        getDocs(
          query(
            collection(db, 'products'),
            where('companyId', '==', selectedCompany.id)
          )
        ),
        // Load clients - Global (no company filtering)
        getDocs(collection(db, 'clients')),
      ]);

      console.log('✅ Firestore queries completed');
      console.log('📊 Invoices docs:', invoicesSnapshot.docs.length);
      console.log('📦 Products docs:', productsSnapshot.docs.length);
      console.log('👥 Clients docs:', clientsSnapshot.docs.length);

      // Process invoices
      const invoicesData = invoicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];
      // Sort in memory instead of in query
      invoicesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Process products
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];

      // Process clients
      const clientsData = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];

      console.log('✅ Processed data:');
      console.log('  - Invoices:', invoicesData.length);
      console.log('  - Products:', productsData.length);
      console.log('  - Clients:', clientsData.length, clientsData.map(c => ({ id: c.id, name: c.clientName })));

      // Set all state together after all data is loaded
      setInvoices(invoicesData);
      setProducts(productsData);
      setClients(clientsData);
      
      console.log('✅ All state updated successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]); // Only depends on selectedCompany

  // Load data when company is selected OR redirect if no companies
  useEffect(() => {
    // Not initialized yet, wait
    if (!initialized) {
      return;
    }

    // No companies exist, redirect to create one
    if (companies.length === 0) {
      router.push('/invoices/settings/company');
      toast.error('Please create a company first.');
      return;
    }

    // Company is selected, load data
    if (selectedCompany) {
      loadData();
    }
  }, [selectedCompany, initialized, companies.length, loadData, router]);

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
      const invoiceData = {
        ...data,
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
      loadData();
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
      loadData();
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
      loadData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  if (loading || !initialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // Don't render until we have clients data loaded (even if empty array)
  if (clients === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading client data...</p>
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
