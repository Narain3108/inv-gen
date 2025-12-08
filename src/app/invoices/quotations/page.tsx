/**
 * Quotations Page
 * Manage quotations with PDF generation and convert-to-invoice functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Quotation, Product, Client, Company, QuotationStatus } from '@/types';
import { QuotationForm, QuotationList, QuotationFilters } from '@/components/quotations';
import { CustomizationDialog } from '@/components/invoices';
import { FilterBar, ExportButton } from '@/components/shared';
import { exportToExcel, exportToCSV, formatQuotationsForExport } from '@/lib/utils/export-utils';
import { Button } from '@/components/ui/button';
import { loadCustomization } from '@/lib/services/customization-service';
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
import { Plus, Loader2, Settings } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useCompanies } from '@/hooks/useCompanies';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { generateQuotationPDF, previewQuotationPDF } from '@/lib/utils/pdf-generator';
import { amountToWords } from '@/lib/utils/number-to-words';
import { generateQuotationNumber, generateInvoiceNumber } from '@/lib/utils/numbering-utils';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';
import { quotationsApi } from '@/lib/api/quotations.api';
import { productsApi } from '@/lib/api/products.api';
import { clientsApi } from '@/lib/api/clients.api';
import { invoicesApi } from '@/lib/api/invoices.api';
import { companiesApi } from '@/lib/api/companies.api';

function QuotationsContent() {
  const router = useRouter();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, loading: companiesLoading, loadCompanies } = useCompanies();
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();
  const [deleteQuotation, setDeleteQuotation] = useState<Quotation | null>(null);
  const [convertingQuotation, setConvertingQuotation] = useState<Quotation | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);

  // Filter configuration
  const filterConfig: FilterConfig<Quotation> = {
    status: (quotation, value) => quotation.status === value,
    converted: (quotation, value) => {
      if (value === 'converted') return quotation.status === 'converted';
      if (value === 'not-converted') return quotation.status !== 'converted';
      return true;
    },
    validity: (quotation, value) => {
      if (!quotation.validUntil) return false;
      const validDate = typeof quotation.validUntil === 'string' ? new Date(quotation.validUntil) : quotation.validUntil;
      const now = new Date();
      const daysUntilExpiry = Math.ceil((validDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (value === 'valid') return daysUntilExpiry > 0;
      if (value === 'expired') return daysUntilExpiry <= 0;
      if (value === 'expiring-soon') return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
      return true;
    },
    minAmount: (quotation, value) => quotation.totalAmount >= value,
    maxAmount: (quotation, value) => quotation.totalAmount <= value,
  };

  const {
    filters,
    filteredData: filteredQuotations,
    updateFilter,
    clearFilters,
    activeFilterCount,
  } = useFilters(quotations, filterConfig);

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
  const generateQuotationNumberAuto = async (): Promise<string> => {
    if (!selectedCompany || !company) return 'QUO0001';
    
    return generateQuotationNumber(company);
  };

  // Reload fresh company data from API
  const reloadCompanyData = React.useCallback(async () => {
    if (!selectedCompany?.id) return;
    
    try {
      const freshCompanyData = await companiesApi.getById(selectedCompany.id);
      console.log('🔄 Reloaded company data:', freshCompanyData.quotationNumbering);
      setCompany(freshCompanyData);
      setSelectedCompany(freshCompanyData);
    } catch (error) {
      console.error('Error reloading company data:', error);
    }
  }, [selectedCompany, setSelectedCompany]);

  // Load data
  const loadData = React.useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      // Fetch fresh company data to ensure we have latest details (address, etc)
      const freshCompany = await companiesApi.getById(selectedCompany.id);
      setCompany(freshCompany);
      
      // Update global store if stale
      if (JSON.stringify(freshCompany) !== JSON.stringify(selectedCompany)) {
        console.log('🔄 Updating stale selected company in store');
        setSelectedCompany(freshCompany);
      }

      // Load quotations using API
      const quotationsData = await quotationsApi.getAll({ company_id: selectedCompany.id });
      
      // Sort by createdAt date
      quotationsData.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setQuotations(quotationsData);

      // Load products using API
      const productsData = await productsApi.getAll({ company_id: selectedCompany.id });
      setProducts(productsData);

      // Load clients using API
      const clientsData = await clientsApi.getAll();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]);

  // Check for companies on mount only
  // Load data when company is selected
  useEffect(() => {
    if (!initialized) return;

    if (companies.length === 0 && selectedCompany === null) {
      return;
    }

    if (selectedCompany && companies.length > 0) {
      // Validate company access before loading to prevent 403s
      const isValidCompany = companies.find(c => c.id === selectedCompany.id);
      
      if (isValidCompany) {
        loadData();
      } else {
        console.log('⚠️ Skipping quotation load for invalid/stale company:', selectedCompany.name);
      }
    }
  }, [selectedCompany, initialized, companies, loadData]);

  const handleAddQuotation = async () => {
    // Check if company exists
    if (companies.length === 0) {
      toast.error('Please create a company first');
      router.push('/invoices/settings/company');
      return;
    }

    if (products.length === 0) {
      toast.error('Please add products first');
      return;
    }

    if (clients.length === 0) {
      toast.error('Please add clients first');
      return;
    }

    // Reload fresh company data to get latest quotationNumbering config
    await reloadCompanyData();

    setEditingQuotation(undefined);
    setIsDialogOpen(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!selectedCompany || !company) return;

    try {
      // Use quotation number from form (already auto-filled) or generate if somehow empty
      let quotationNumber = data.quotationNumber?.trim();
      if (!quotationNumber) {
        // Count existing quotations for this company
        const quotationCount = quotations.length;
        quotationNumber = generateQuotationNumber(company, quotationCount);
        console.log(`🔢 Auto-generated quotation number: ${quotationNumber} (based on ${quotationCount} existing quotations)`);
      }
      
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
        company_id: selectedCompany.id,
        status: editingQuotation?.status || 'pending' as QuotationStatus,
        date: new Date(data.date).toISOString(),
        validUntil: new Date(data.validUntil).toISOString(),
        totalAmountInWords: amountToWords(data.totalAmount),
      };

      if (editingQuotation?.id) {
        await quotationsApi.update(editingQuotation.id, quotationData);
        toast.success('Quotation updated successfully');
      } else {
        await quotationsApi.create(quotationData);
        
        // Increment quotation counter in company if using auto-numbering
        if (!editingQuotation && !data.quotationNumber?.trim() && company.quotationNumbering) {
          const newNextNumber = quotations.length + 2; // +2 because we just added one
          await companiesApi.update(selectedCompany.id, {
            quotationNumbering: {
              ...company.quotationNumbering,
              nextNumber: newNextNumber,
            },
          });
          console.log(`📈 Updated company quotation counter to: ${newNextNumber}`);
        }
        
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

    // Optimistic Update
    const previousQuotations = [...quotations];
    setQuotations(prev => prev.filter(q => q.id !== deleteQuotation.id));
    setDeleteQuotation(null);
    toast.success('Quotation deleted successfully');

    try {
      await quotationsApi.delete(deleteQuotation.id, deleteQuotation.companyId);
    } catch (error) {
      console.error('Error deleting quotation:', error);
      toast.error('Failed to delete quotation');
      // Revert
      setQuotations(previousQuotations);
    }
  };

  const handleViewQuotation = async (quotation: Quotation) => {
    // Get fresh company data from selectedCompany context
    const currentCompany = selectedCompany || company;
    if (!currentCompany) return;
    
    const client = clients.find(c => c.id === quotation.clientId);
    if (client) {
      console.log('📥 Loading customization for quotation:', currentCompany.id);
      console.log('🖼️ Logo URL:', currentCompany.logoUrl);
      console.log('✍️ Signature URL:', currentCompany.signatureUrl);
      
      // Load customization settings
      const customization = await loadCustomization(currentCompany.id, 'quotation');
      
      console.log('📋 Loaded quotation customization:', {
        hasCustomization: !!customization,
        pageSize: customization?.pageSize,
        margins: customization?.margins,
        columnsCount: customization?.table?.columns?.filter(c => c.enabled).length,
        termsText: customization?.footer?.termsText ? 'Yes' : 'No',
        thankYouText: customization?.footer?.thankYouText ? 'Yes' : 'No',
      });
      
      await previewQuotationPDF({ quotation, company: currentCompany, client, customization });
    }
  };

  const handleDownloadQuotation = async (quotation: Quotation) => {
    // Get fresh company data from selectedCompany context
    const currentCompany = selectedCompany || company;
    if (!currentCompany) return;
    
    const client = clients.find(c => c.id === quotation.clientId);
    if (client) {
      console.log('📥 Loading customization for quotation download:', currentCompany.id);
      console.log('🖼️ Logo URL:', currentCompany.logoUrl);
      console.log('✍️ Signature URL:', currentCompany.signatureUrl);
      
      // Load customization settings
      const customization = await loadCustomization(currentCompany.id, 'quotation');
      
      console.log('📋 Loaded quotation customization for download');
      
      await generateQuotationPDF({ quotation, company: currentCompany, client, customization });
    }
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    if (!selectedCompany) return;

    // Reload fresh company data to ensure we use latest numbering config
    // We fetch directly from API to bypass any stale state
    let currentCompany = company;
    try {
      currentCompany = await companiesApi.getById(selectedCompany.id);
      setCompany(currentCompany);
      setSelectedCompany(currentCompany);
    } catch (e) {
      console.error("Failed to reload company data", e);
    }

    // Generate invoice number from backend
    try {
      const { invoice_number } = await invoicesApi.generateNumber(selectedCompany.id);
      setInvoiceNumber(invoice_number);
    } catch (e) {
      console.error("Failed to generate invoice number", e);
      toast.error("Failed to generate invoice number");
    }

    setConvertingQuotation(quotation);
  };

  const confirmConvertToInvoice = async () => {
    if (!convertingQuotation || !invoiceNumber.trim() || !selectedCompany) {
      toast.error('Please provide an invoice number');
      return;
    }

    try {
      // Check if invoice number already exists using API
      const existingInvoices = await invoicesApi.getAll({ 
        company_id: selectedCompany.id,
        invoiceNumber: invoiceNumber.trim()
      });
      
      if (existingInvoices.length > 0) {
        toast.error('Invoice number already exists');
        return;
      }

      // Create invoice from quotation
      const invoiceData = {
        invoiceNumber: invoiceNumber.trim(),
        referenceNumber: convertingQuotation.quotationNumber,
        companyId: convertingQuotation.companyId,
        company_id: convertingQuotation.companyId,
        clientId: convertingQuotation.clientId,
        client_id: convertingQuotation.clientId,
        date: new Date().toISOString(), // Use current date for invoice
        items: convertingQuotation.items,
        totalAmount: convertingQuotation.totalAmount,
        totalAmountInWords: convertingQuotation.totalAmountInWords,
        taxableAmount: convertingQuotation.taxableAmount,
        cgst: convertingQuotation.cgst,
        sgst: convertingQuotation.sgst,
        igst: convertingQuotation.igst,
        // Preserve tax breakdown (GST split) from quotation if present
        taxBreakdown: convertingQuotation.taxBreakdown || undefined,
        paymentStatus: 'pending' as const,
        amountPaid: 0,
        amountPending: convertingQuotation.totalAmount,
        payments: [],
      };

      const newInvoice = await invoicesApi.create(invoiceData);

      // Update quotation status to converted
      await quotationsApi.partialUpdate(convertingQuotation.id, {
        status: 'converted' as QuotationStatus,
        convertedToInvoiceId: newInvoice.id,
      }, convertingQuotation.companyId);

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
      // Filter out 'pending' and 'converted' statuses which are not supported by the API
      let validStatus = status === 'pending' ? 'draft' : status;
      if (validStatus === 'converted') {
        toast.error('Use "Convert to Invoice" to change status to converted');
        return;
      }
      await quotationsApi.updateStatus(quotation.id, validStatus as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired', quotation.companyId);
      toast.success(`Quotation marked as ${status}`);
      await loadData();
    } catch (error) {
      console.error('Error updating quotation status:', error);
      toast.error('Failed to update quotation status');
    }
  };

  const handleExportExcel = async () => {
    const data = formatQuotationsForExport(filteredQuotations, clients);
    return exportToExcel(data, `quotations-${new Date().toISOString().split('T')[0]}`, 'Quotations');
  };

  const handleExportCSV = async () => {
    const data = formatQuotationsForExport(filteredQuotations, clients);
    return exportToCSV(data, `quotations-${new Date().toISOString().split('T')[0]}`);
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
        <div className="flex gap-2">
          <ExportButton
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
          />
          <Button 
            variant="outline"
            onClick={() => setIsCustomizationDialogOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Customize Bill
          </Button>
          <Button 
            onClick={handleAddQuotation} 
            className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar 
        activeFilterCount={activeFilterCount} 
        onClearFilters={clearFilters}
        resultsCount={filteredQuotations.length}
        totalCount={quotations.length}
      >
        <QuotationFilters
          quotations={quotations}
          onFilterChange={updateFilter}
          filters={filters}
        />
      </FilterBar>

      {/* Quotations List */}
      <QuotationList
        quotations={filteredQuotations}
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
            company={company}
            products={products}
            clients={clients}
            companyState={selectedCompany?.address?.state || ''}
            quotationCount={quotations.length}
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

      {/* Customization Dialog */}
      {selectedCompany && (
        <CustomizationDialog
          open={isCustomizationDialogOpen}
          onOpenChange={setIsCustomizationDialogOpen}
          companyId={selectedCompany.id}
          type="quotation"
          onSave={loadData}
        />
      )}
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
