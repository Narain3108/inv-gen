/**
 * Quotations Page
 * Manage quotations with PDF generation and convert-to-invoice functionality
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Quotation, Product, Client, Company, QuotationStatus } from '@/types';
import { QuotationForm } from '@/components/quotations/QuotationForm';
import { QuotationList } from '@/components/quotations/QuotationList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Loader2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useCompanies } from '@/hooks/useCompanies';
import { generateQuotationPDF } from '@/lib/utils/pdf-generator';
import { amountToWords } from '@/lib/utils/number-to-words';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';

function QuotationsContent() {
  const router = useRouter();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, loading: companiesLoading, loadCompanies } = useCompanies();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();
  const [deleteQuotation, setDeleteQuotation] = useState<Quotation | null>(null);
  const [convertingQuotation, setConvertingQuotation] = useState<Quotation | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
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
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany, initialized, setSelectedCompany]);

  // Generate auto quotation number
  const generateQuotationNumber = async (): Promise<string> => {
    if (!selectedCompany) return 'QUO-0001';
    
    const quotationsRef = collection(db, 'quotations');
    const q = query(quotationsRef, where('companyId', '==', selectedCompany.id));
    const snapshot = await getDocs(q);
    
    const number = snapshot.size + 1;
    const year = new Date().getFullYear();
    return `QUO-${year}-${String(number).padStart(4, '0')}`;
  };

  // Load data
  const loadData = React.useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      setCompany(selectedCompany);

      // Load quotations
      const quotationsRef = collection(db, 'quotations');
      const quotationsQuery = query(
        quotationsRef,
        where('companyId', '==', selectedCompany.id)
      );
      const quotationsSnapshot = await getDocs(quotationsQuery);
      const quotationsData = quotationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Quotation[];
      
      // Sort by date
      quotationsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
      setQuotations(quotationsData);

      // Load products
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

      // Load clients (global)
      const clientsRef = collection(db, 'clients');
      const clientsSnapshot = await getDocs(clientsRef);
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
  }, [selectedCompany]);

  useEffect(() => {
    if (!initialized) return;

    if (companies.length === 0) {
      router.push('/invoices/settings/company');
      toast.error('Please create a company first.');
      return;
    }

    if (selectedCompany) {
      loadData();
    }
  }, [selectedCompany, initialized, companies.length, loadData, router]);

  const handleAddQuotation = () => {
    if (products.length === 0) {
      toast.error('Please add products first');
      return;
    }

    if (clients.length === 0) {
      toast.error('Please add clients first');
      return;
    }

    setEditingQuotation(undefined);
    setIsDialogOpen(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!selectedCompany) return;

    try {
      const quotationNumber = editingQuotation?.quotationNumber || await generateQuotationNumber();
      
      // Clean up quotation items to remove undefined values
      const cleanedItems = data.items.map((item: any) => {
        const cleanItem = { ...item };
        // Remove itemCode if it's undefined or empty
        if (!cleanItem.itemCode) {
          delete cleanItem.itemCode;
        }
        return cleanItem;
      });

      const quotationData = {
        ...data,
        items: cleanedItems,
        quotationNumber,
        companyId: selectedCompany.id,
        status: editingQuotation?.status || 'pending' as QuotationStatus,
        date: Timestamp.fromDate(new Date(data.date)),
        validUntil: Timestamp.fromDate(new Date(data.validUntil)),
        totalAmountInWords: amountToWords(data.totalAmount),
      };

      if (editingQuotation?.id) {
        const quotationRef = doc(db, 'quotations', editingQuotation.id);
        await updateDoc(quotationRef, {
          ...quotationData,
          updatedAt: Timestamp.now(),
        });
        toast.success('Quotation updated successfully');
      } else {
        await addDoc(collection(db, 'quotations'), {
          ...quotationData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        toast.success('Quotation created successfully');
      }

      setIsDialogOpen(false);
      setEditingQuotation(undefined);
      await loadData();
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast.error('Failed to save quotation');
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deleteQuotation) return;

    try {
      await deleteDoc(doc(db, 'quotations', deleteQuotation.id));
      toast.success('Quotation deleted successfully');
      setDeleteQuotation(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error('Failed to delete quotation');
    }
  };

  const handleViewQuotation = (quotation: Quotation) => {
    if (!company) return;
    const client = clients.find(c => c.id === quotation.clientId);
    if (client) {
      generateQuotationPDF({ quotation, company, client });
    }
  };

  const handleDownloadQuotation = (quotation: Quotation) => {
    handleViewQuotation(quotation);
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    // Generate suggested invoice number
    const invoicesRef = collection(db, 'invoices');
    const q = query(invoicesRef, where('companyId', '==', selectedCompany?.id || ''));
    const snapshot = await getDocs(q);
    const number = snapshot.size + 1;
    const year = new Date().getFullYear();
    const suggestedNumber = `INV-${year}-${String(number).padStart(4, '0')}`;
    
    setInvoiceNumber(suggestedNumber);
    setConvertingQuotation(quotation);
  };

  const confirmConvertToInvoice = async () => {
    if (!convertingQuotation || !invoiceNumber.trim() || !selectedCompany) {
      toast.error('Please provide an invoice number');
      return;
    }

    try {
      // Check if invoice number already exists
      const invoicesRef = collection(db, 'invoices');
      const q = query(
        invoicesRef,
        where('companyId', '==', selectedCompany.id),
        where('invoiceNumber', '==', invoiceNumber.trim())
      );
      const existingInvoices = await getDocs(q);
      
      if (!existingInvoices.empty) {
        toast.error('Invoice number already exists');
        return;
      }

      // Create invoice from quotation
      const invoiceData = {
        invoiceNumber: invoiceNumber.trim(),
        companyId: convertingQuotation.companyId,
        clientId: convertingQuotation.clientId,
        date: Timestamp.now(), // Use current date for invoice
        items: convertingQuotation.items,
        totalAmount: convertingQuotation.totalAmount,
        totalAmountInWords: convertingQuotation.totalAmountInWords,
        taxableAmount: convertingQuotation.taxableAmount,
        cgst: convertingQuotation.cgst,
        sgst: convertingQuotation.sgst,
        igst: convertingQuotation.igst,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const invoiceRef = await addDoc(collection(db, 'invoices'), invoiceData);

      // Update quotation status to converted
      const quotationRef = doc(db, 'quotations', convertingQuotation.id);
      await updateDoc(quotationRef, {
        status: 'converted' as QuotationStatus,
        convertedToInvoiceId: invoiceRef.id,
        updatedAt: Timestamp.now(),
      });

      toast.success('Quotation converted to invoice successfully');
      setConvertingQuotation(null);
      setInvoiceNumber('');
      await loadData();
      
      // Navigate to invoices page
      router.push('/invoices/invoices');
    } catch (error) {
      console.error('Error converting quotation:', error);
      toast.error('Failed to convert quotation to invoice');
    }
  };

  const handleUpdateStatus = async (quotation: Quotation, status: QuotationStatus) => {
    try {
      const quotationRef = doc(db, 'quotations', quotation.id);
      await updateDoc(quotationRef, {
        status,
        updatedAt: Timestamp.now(),
      });
      toast.success(`Quotation marked as ${status}`);
      await loadData();
    } catch (error) {
      console.error('Error updating quotation status:', error);
      toast.error('Failed to update quotation status');
    }
  };

  if (loading || companiesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Quotations
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage price estimates for clients
          </p>
        </div>
        <Button 
          onClick={handleAddQuotation} 
          className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Quotation
        </Button>
      </div>

      {/* Quotations List */}
      <QuotationList
        quotations={quotations}
        clients={clients}
        onEdit={handleEditQuotation}
        onDelete={setDeleteQuotation}
        onView={handleViewQuotation}
        onDownload={handleDownloadQuotation}
        onConvertToInvoice={handleConvertToInvoice}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
            </DialogTitle>
            <DialogDescription>
              {editingQuotation
                ? 'Update the quotation details below'
                : 'Fill in the details to create a new quotation'}
            </DialogDescription>
          </DialogHeader>
          <QuotationForm
            quotation={editingQuotation}
            companyId={selectedCompany?.id || ''}
            products={products}
            clients={clients}
            companyState={selectedCompany?.address?.state || ''}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingQuotation(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteQuotation} onOpenChange={() => setDeleteQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation {deleteQuotation?.quotationNumber}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuotation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Invoice Dialog */}
      <AlertDialog open={!!convertingQuotation} onOpenChange={() => {
        setConvertingQuotation(null);
        setInvoiceNumber('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Quotation to Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Convert quotation {convertingQuotation?.quotationNumber} to a tax invoice.
              Please provide an invoice number.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-2024-0001"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConvertingQuotation(null);
              setInvoiceNumber('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConvertToInvoice}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Convert to Invoice
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <DashboardLayout>
      <QuotationsContent />
    </DashboardLayout>
  );
}
