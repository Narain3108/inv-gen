/**
 * Quotations Page
 * Manage quotations with PDF generation and convert-to-invoice functionality
 * Refactored using hooks and components for maintainability
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Quotation, Product, Client, Company, QuotationStatus } from '@/types';
import { QuotationForm, QuotationList, QuotationFilters } from '@/components/quotations';
import { CustomizationDialog } from '@/components/invoices';
import { FilterBar } from '@/components/shared';
import { exportToExcel, exportToCSV, formatQuotationsForExport } from '@/lib/utils/export-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useCompanies } from '@/hooks/useCompanies';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { useQuotationActions } from '@/hooks/useQuotationActions';
import { DashboardLayout } from '@/components/layout';
import { toast } from 'sonner';
import { quotationsApi } from '@/lib/api/quotations.api';
import { productsApi } from '@/lib/api/products.api';
import { clientsApi } from '@/lib/api/clients.api';
import { companiesApi } from '@/lib/api/companies.api';
import { QuotationPageHeader } from '@/components/pages/quotations';
import { TableSkeleton } from '@/components/shared/Skeletons';

/**
 * Quotation filter configuration
 */
const createFilterConfig = (): FilterConfig<Quotation> => ({
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
});

function QuotationsContent() {
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, loading: companiesLoading, loadCompanies } = useCompanies();

  // Local state
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Filter hook
  const {
    filters,
    filteredData: filteredQuotations,
    updateFilter,
    clearFilters,
    activeFilterCount,
  } = useFilters(quotations, createFilterConfig());

  // Load companies on mount
  useEffect(() => {
    const init = async () => {
      await loadCompanies();
      setInitialized(true);
    };
    init();
  }, []);

  // Auto-select first company
  useEffect(() => {
    if (initialized && !selectedCompany && companies.length > 0) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany, initialized, setSelectedCompany]);

  // Reload company data
  const reloadCompanyData = React.useCallback(async () => {
    if (!selectedCompany?.id) return;
    try {
      const freshCompanyData = await companiesApi.getById(selectedCompany.id);
      setCompany(freshCompanyData);
      setSelectedCompany(freshCompanyData);
    } catch (error) {
      console.error('Error reloading company data:', error);
    }
  }, [selectedCompany, setSelectedCompany]);

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 50;

  // Load initial data
  const loadInitialData = React.useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      // PERFORMANCE FIX: Use selectedCompany from context instead of refetching
      // Also fetch related data in parallel
      const [quotationsData, productsData, clientsData] = await Promise.all([
        quotationsApi.getByCompanyId(selectedCompany.id, LIMIT, 0),
        productsApi.getAll({ company_id: selectedCompany.id }),
        clientsApi.getAll({ company_id: selectedCompany.id })
      ]);

      // Ensure company state is synced
      setCompany(selectedCompany);

      // Backend already sorts by createdAt DESC
      setQuotations(quotationsData);
      setProducts(productsData);
      setClients(clientsData);

      // Reset pagination state
      setOffset(0);
      setHasMore(quotationsData.length === LIMIT);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, setSelectedCompany]);

  // Load more quotations
  const handleLoadMore = async () => {
    if (!selectedCompany || loadingMore) return;

    const newOffset = offset + LIMIT;
    setLoadingMore(true);
    try {
      const moreQuotations = await quotationsApi.getByCompanyId(selectedCompany.id, LIMIT, newOffset);

      if (moreQuotations.length > 0) {
        setQuotations(prev => [...prev, ...moreQuotations]);
        setOffset(newOffset);
        setHasMore(moreQuotations.length === LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more quotations:', error);
      toast.error('Failed to load more quotations');
    } finally {
      setLoadingMore(false);
    }
  };

  // Refresh clients
  const refreshClients = async () => {
    if (!selectedCompany) return;
    try {
      const clientsData = await clientsApi.getAll({ company_id: selectedCompany.id });
      setClients(clientsData);
    } catch (error) {
      console.error('Error refreshing clients:', error);
    }
  };

  // Load data when company is ready
  useEffect(() => {
    if (!initialized) return;
    if (companies.length === 0 && selectedCompany === null) return;

    if (selectedCompany && companies.length > 0) {
      const isValidCompany = companies.find(c => c.id === selectedCompany.id);
      if (isValidCompany) {
        loadInitialData();
      }
    }
  }, [selectedCompany, initialized, companies, loadInitialData]);

  // Quotation actions hook
  const actions = useQuotationActions({
    selectedCompany,
    company,
    products,
    clients,
    quotations,
    onQuotationsChange: setQuotations,
    onRefreshData: loadInitialData,
    reloadCompanyData,
    setCompany,
    setSelectedCompany,
  });

  // Export handlers
  const handleExportExcel = async () => {
    const data = formatQuotationsForExport(filteredQuotations, clients);
    return exportToExcel(data, `quotations-${new Date().toISOString().split('T')[0]}`, 'Quotations');
  };

  const handleExportCSV = async () => {
    const data = formatQuotationsForExport(filteredQuotations, clients);
    return exportToCSV(data, `quotations-${new Date().toISOString().split('T')[0]}`);
  };

  // Check for selected company first - prevents infinite loading when no company is selected
  if (!selectedCompany) {
    return (
      <div className="space-y-6 p-6">
        <QuotationPageHeader
          onAddQuotation={() => { }}
          onOpenCustomization={() => { }}
          onExportExcel={async () => false}
          onExportCSV={async () => false}
        />
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Please select a company to manage quotations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <QuotationPageHeader
        onAddQuotation={actions.handleAddQuotation}
        onOpenCustomization={() => actions.setIsCustomizationDialogOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
      />

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

      {/* Show skeleton when actively loading data for a selected company */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          {/* Quotations List */}
          <QuotationList
            quotations={filteredQuotations}
            clients={clients}
            onEdit={actions.handleEditQuotation}
            onDelete={actions.setDeleteQuotation}
            onView={actions.handleViewQuotation}
            onDownload={actions.handleDownloadQuotation}
            onConvertToInvoice={actions.handleConvertToInvoice}
            onUpdateStatus={actions.handleUpdateStatus}
          />

          {/* Pagination: Load More Button */}
          {hasMore && !activeFilterCount && (
            <div className="flex justify-center pt-4 pb-8">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full md:w-auto min-w-[200px]"
              >
                {loadingMore ? (
                  <>Building quotation list...</>
                ) : (
                  <>Load More Quotations</>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={actions.isDialogOpen} onOpenChange={actions.setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actions.editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
            </DialogTitle>
            <DialogDescription>
              {actions.editingQuotation
                ? 'Update the quotation details below'
                : 'Fill in the details to create a new quotation'}
            </DialogDescription>
          </DialogHeader>
          <QuotationForm
            quotation={actions.editingQuotation}
            companyId={selectedCompany?.id || ''}
            company={company}
            products={products}
            clients={clients}
            companyState={selectedCompany?.address?.state || ''}
            quotationCount={quotations.length}
            onSubmit={actions.handleSubmit}
            onCancel={() => {
              actions.setIsDialogOpen(false);
            }}
            onClientAdded={(newClient) => {
              setTimeout(() => {
                setClients(prev => {
                  if (prev.find(c => c.id === newClient.id)) return prev;
                  return [...prev, newClient];
                });
                refreshClients();
              }, 0);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!actions.deleteQuotation} onOpenChange={() => actions.setDeleteQuotation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation {actions.deleteQuotation?.quotationNumber}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={actions.handleDeleteQuotation}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert to Invoice Dialog */}
      <AlertDialog open={!!actions.convertingQuotation} onOpenChange={() => {
        actions.setConvertingQuotation(null);
        actions.setInvoiceNumber('');
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert Quotation to Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Convert quotation {actions.convertingQuotation?.quotationNumber} to a tax invoice.
              Please provide an invoice number.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="invoiceNumber">Invoice Number *</Label>
            <Input
              id="invoiceNumber"
              value={actions.invoiceNumber}
              onChange={(e) => actions.setInvoiceNumber(e.target.value)}
              placeholder="INV-2024-0001"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              actions.setConvertingQuotation(null);
              actions.setInvoiceNumber('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={actions.confirmConvertToInvoice}
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
          open={actions.isCustomizationDialogOpen}
          onOpenChange={actions.setIsCustomizationDialogOpen}
          companyId={selectedCompany.id}
          type="quotation"
          onSave={loadInitialData}
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
