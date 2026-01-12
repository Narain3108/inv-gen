/**
 * Invoices Page
 * Manage invoices with PDF generation
 * Refactored using hooks and components for maintainability
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, Client, Company } from '@/types';
import { InvoiceForm, InvoiceList, InvoiceFilters, PaymentDialog, CustomizationDialog, CopyTypeDialog } from '@/components/invoices';
import { FilterBar, PageHeader, ExportButton, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { exportToExcel, exportToCSV, formatInvoicesForExport } from '@/lib/utils/export-utils';
import { invoicesApi } from '@/lib/api/invoices.api';
import { clientsApi } from '@/lib/api/clients.api';
import { companiesApi } from '@/lib/api/companies.api';
import { servicesApi } from '@/lib/api';
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
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { useInvoiceActions } from '@/hooks/useInvoiceActions';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { InvoicePageHeader } from '@/components/pages/invoices';
import { TableSkeleton } from '@/components/shared/Skeletons';

/**
 * Invoice filter configuration
 */
const createFilterConfig = (): FilterConfig<Invoice> => ({
  paymentStatus: (invoice, value) => invoice.paymentStatus === value,
  datePeriod: (invoice, value) => {
    if (!invoice.date) return false;
    const invoiceDate = typeof invoice.date === 'string' ? new Date(invoice.date) : invoice.date;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (value) {
      case 'today':
        return invoiceDate >= today;
      case 'this-week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return invoiceDate >= weekAgo;
      }
      case 'last-week': {
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return invoiceDate >= twoWeeksAgo && invoiceDate < weekAgo;
      }
      case 'this-month': {
        return invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear();
      }
      case 'last-month': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        return invoiceDate.getMonth() === lastMonth.getMonth() &&
          invoiceDate.getFullYear() === lastMonth.getFullYear();
      }
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return invoiceDate >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(today);
        quarterAgo.setMonth(quarterAgo.getMonth() - 3);
        return invoiceDate >= quarterAgo;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        return invoiceDate >= yearAgo;
      default:
        return true;
    }
  },
});

function InvoicesContent() {
  const { user } = useAuth(); // Add user auth check
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, companiesInitialized, products } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefillData, setPrefillData] = useState<any>(null);

  // Filter hook
  const {
    filters,
    filteredData: filteredInvoices,
    updateFilter,
    clearFilters,
    activeFilterCount,
  } = useFilters(invoices, createFilterConfig());

  // Set company when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      setCompany(selectedCompany);
    }
  }, [selectedCompany]);

  // Reload fresh company data
  const reloadCompanyData = React.useCallback(async () => {
    if (!selectedCompany?.id) return;
    try {
      const freshCompanyData = await companiesApi.getById(selectedCompany.id);
      if (freshCompanyData) {
        setCompany(freshCompanyData);
        setSelectedCompany(freshCompanyData);
      }
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
      // Fetch fresh company data, FIRST PAGE of invoices, and all clients
      const [invoicesData, clientsData] = await Promise.all([
        invoicesApi.getByCompanyId(selectedCompany.id, LIMIT, 0),
        clientsApi.getAll({ company_id: selectedCompany.id })
      ]);

      // Ensure company state is synced
      setCompany(selectedCompany);

      // Backend already sorts by createdAt DESC, so no need to sort here
      setInvoices(invoicesData);
      setClients(clientsData);

      // Reset pagination state
      setOffset(0);
      setHasMore(invoicesData.length === LIMIT);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany]); // Removed setSelectedCompany from deps as it's not directly used here

  // Load more invoices
  const handleLoadMore = async () => {
    if (!selectedCompany || loadingMore) return;

    const newOffset = offset + LIMIT;
    setLoadingMore(true);
    try {
      const moreInvoices = await invoicesApi.getByCompanyId(selectedCompany.id, LIMIT, newOffset);

      if (moreInvoices.length > 0) {
        setInvoices(prev => [...prev, ...moreInvoices]);
        setOffset(newOffset);
        setHasMore(moreInvoices.length === LIMIT);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more invoices:', error);
      toast.error('Failed to load more invoices');
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

  // Load invoices when company is ready
  useEffect(() => {
    if (!companiesInitialized) return;
    if (companies.length === 0 && selectedCompany === null) return;

    if (selectedCompany && companies.length > 0) {
      const isValidCompany = companies.find(c => c.id === selectedCompany.id);
      if (isValidCompany) {
        loadInitialData(); // Changed from loadInvoices()
      }
    }
  }, [selectedCompany, companiesInitialized, companies, loadInitialData]); // Changed loadInvoices to loadInitialData

  // Invoice actions hook
  const actions = useInvoiceActions({
    selectedCompany,
    company,
    products,
    clients,
    invoices,
    onInvoicesChange: setInvoices,
    onRefreshInvoices: loadInitialData, // Changed from loadInvoices
    onRefreshClients: refreshClients,
    reloadCompanyData,
  });

  // Export handlers
  const handleExportExcel = async () => {
    const data = formatInvoicesForExport(filteredInvoices, clients);
    return exportToExcel(data, `invoices-${new Date().toISOString().split('T')[0]}`, 'Invoices');
  };

  const handleExportCSV = async () => {
    const data = formatInvoicesForExport(filteredInvoices, clients);
    return exportToCSV(data, `invoices-${new Date().toISOString().split('T')[0]}`);
  };

  // Initial data load
  useEffect(() => {
    loadInitialData();
  }, [selectedCompany?.id, loadInitialData]);

  // Handle createFor query param
  useEffect(() => {
    const createForServiceId = searchParams?.get('createFor');
    if (createForServiceId && selectedCompany && !loading && clients.length > 0) {
      const initInvoiceFromService = async () => {
        try {
          // Clear query param to prevent loop/re-trigger
          router.replace('/invoices/invoices');

          const service = await servicesApi.getById(createForServiceId);
          if (service && service.companyId === selectedCompany.id) {
            setPrefillData({
              clientId: service.clientId,
              referenceNumber: service.serviceNumber,
            });
            await actions.handleAddInvoice();
            toast.info(`Creating invoice for Service ${service.serviceNumber}`);
          }
        } catch (error) {
          console.error("Failed to load service for invoice creation", error);
          toast.error("Failed to load service details");
        }
      };

      initInvoiceFromService();
    }
  }, [searchParams, selectedCompany, loading, clients, actions, router]);

  const handleInvoiceChange = async () => {
    await loadInitialData();
  };

  // Check for selected company first - prevents infinite loading when no company is selected
  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Invoices"
          description="Manage and track your invoices"
        >
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </PageHeader>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Please select a company to manage invoices
          </p>
        </div>
      </div>
    );
  }

  // Loading state - only show when companies are being initialized
  if (!companiesInitialized) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Manage and track your invoices"
      >
        <div className="flex gap-2">
          <ExportButton
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
          />
          <Button onClick={() => actions.handleAddInvoice()}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </PageHeader>

      {/* Filter Bar */}
      <FilterBar
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        resultsCount={filteredInvoices.length}
        totalCount={invoices.length}
      >
        <InvoiceFilters
          invoices={invoices}
          onFilterChange={updateFilter}
          filters={filters}
        />
      </FilterBar>

      {/* Show skeleton when actively loading data for a selected company */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <>
          <InvoiceList
            invoices={filteredInvoices}
            clients={clients}
            onEdit={actions.handleEditInvoice}
            onDelete={actions.setDeleteInvoice}
            onView={actions.handleViewInvoice}
            onDownload={actions.handleDownloadInvoice}
            onPayment={actions.handleOpenPaymentDialog}
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
                  <>Building invoice list...</>
                ) : (
                  <>Load More Invoices</>
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={actions.isDialogOpen} onOpenChange={actions.setIsDialogOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] max-h-[98vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {actions.editingInvoice ? 'Edit Invoice' : 'New Invoice'}
            </DialogTitle>
            <DialogDescription>
              {actions.editingInvoice
                ? 'Update the invoice details below.'
                : 'Create a new invoice for your client.'}
            </DialogDescription>
          </DialogHeader>
          {company && (
            <InvoiceForm
              invoice={actions.editingInvoice}
              companyId={selectedCompany!.id}
              company={company}
              products={products}
              clients={clients}
              companyState={company.state || company.address.state}
              invoiceCount={invoices.length}
              onSubmit={actions.handleSubmit}
              onCancel={() => actions.setIsDialogOpen(false)}
              prefillData={prefillData}
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
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!actions.deleteInvoice} onOpenChange={() => actions.setDeleteInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {actions.deleteInvoice?.invoiceNumber}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={actions.handleDeleteInvoice}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={actions.isPaymentDialogOpen}
        onOpenChange={actions.setIsPaymentDialogOpen}
        invoice={actions.paymentInvoice}
        onSubmit={actions.handleRecordPayment}
      />

      {/* Customization Dialog */}
      {selectedCompany && (
        <CustomizationDialog
          open={actions.isCustomizationDialogOpen}
          onOpenChange={actions.setIsCustomizationDialogOpen}
          companyId={selectedCompany.id}
          type="invoice"
          onSave={loadInitialData}
        />
      )}

      {/* Copy Type Dialog */}
      <CopyTypeDialog
        open={actions.isCopyTypeDialogOpen}
        onOpenChange={actions.setIsCopyTypeDialogOpen}
        onSelectCopyType={actions.handleCopyTypeSelected}
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
