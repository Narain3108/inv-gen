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
import { Invoice, Product, Client, Company, InvoiceItem } from '@/types';
import { InvoiceForm, InvoiceList } from '@/components/invoices';
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
  const [initialized, setInitialized] = useState(false);

  // Load companies on mount
  useEffect(() => {
    const init = async () => {
      await loadCompanies();
      setInitialized(true);
    };
    init();
  }, []); // Empty dependency - only run once on mount

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

      // Load invoices - Only filter by companyId (no orderBy to avoid index requirement)
      const invoicesRef = collection(db, 'invoices');
      const invoicesQuery = query(
        invoicesRef,
        where('companyId', '==', selectedCompany.id)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
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
      setInvoices(invoicesData);

      // Load products - Filter by companyId
      const productsRef = collection(db, 'products');
      const productsQuery = query(
        productsRef,
        where('companyId', '==', selectedCompany.id)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
      setProducts(productsData);

      // Load clients - Filter by companyId
      const clientsRef = collection(db, 'clients');
      const clientsQuery = query(
        clientsRef,
        where('companyId', '==', selectedCompany.id)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(clientsData);
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
      
      return;
    }

    // Company is selected, load data
    if (selectedCompany) {
      loadData();
    }
  }, [selectedCompany, initialized, companies.length, loadData]);

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
        // Update existing invoice
        const invoiceRef = doc(db, 'invoices', editingInvoice.id);
        await updateDoc(invoiceRef, {
          ...invoiceData,
          updatedAt: Timestamp.now(),
        });
        toast.success('Invoice updated successfully');
      } else {
        // Create new invoice
        await addDoc(collection(db, 'invoices'), {
          ...invoiceData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.success('Invoice created successfully');
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading invoices...</p>
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
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
