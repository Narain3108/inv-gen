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
import { companiesApi } from '@/lib/api/companies.api';
import { servicesApi } from '@/lib/api';
import { useInvoicesQuery, useClientsQuery, useDeleteInvoiceMutation } from '@/hooks/queries';
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
  const { user } = useAuth();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, companiesInitialized, products } = useAppData();
  const router = useRouter();
  const searchParams = useSearchParams();

  // React Query for invoices and clients
  const { data: invoices = [], isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoicesQuery(selectedCompany?.id);
  const { data: clients = [], isLoading: clientsLoading, refetch: refetchClients } = useClientsQuery(selectedCompany?.id);
  const deleteInvoiceMutation = useDeleteInvoiceMutation();

  const loading = invoicesLoading || clientsLoading;

  // Local state
  const [company, setCompany] = useState<Company | null>(null);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);

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

  // Refresh data function - now just triggers React Query refetch
  const refreshData = React.useCallback(async () => {
    await Promise.all([refetchInvoices(), refetchClients()]);
  }, [refetchInvoices, refetchClients]);

  // Invoice actions hook
  const actions = useInvoiceActions({
    selectedCompany,
    company,
    products,
    clients,
    invoices,
    onInvoicesChange: (newInvoices: Invoice[]) => {
      // React Query handles state now, the hook will call refetch after mutations
    },
    onRefreshInvoices: refreshData,
    onRefreshClients: async () => { await refetchClients(); },
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

  // Load company data when selected
  useEffect(() => {
    if (selectedCompany) {
      setCompany(selectedCompany);
    }
  }, [selectedCompany]);

  // Handle serviceId query param — fetch prefill data (step 1)
  useEffect(() => {
    const serviceId = searchParams?.get('serviceId');
    if (!serviceId || !selectedCompany || loading || clients.length === 0) return;

    const fetchServicePrefill = async () => {
      try {
        // Clear query param to prevent re-trigger
        router.replace('/invoices/invoices');

        const prefill = await servicesApi.getInvoicePrefill(serviceId);

        // Map prefill items to InvoiceForm item format
        // Filter to only keep items with a matching product in the company's product list,
        // because the form's zod schema requires productId to be non-empty.
        const formItems = prefill.items
          .map((item) => {
            const matchedProduct = products.find(
              (p) => p.id === item.productId || p.productName === item.productName
            );
            if (!matchedProduct) return null; // No matching product — skip
            return {
              productId: matchedProduct.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: 0,
            };
          })
          .filter(Boolean) as { productId: string; quantity: number; unitPrice: number; discount: number }[];

        // Build serial numbers map (index → serial array)
        // Re-index after filtering to match the final items array
        const serialsMap: Record<string, string[]> = {};
        let finalIdx = 0;
        prefill.items.forEach((item) => {
          const matchedProduct = products.find(
            (p) => p.id === item.productId || p.productName === item.productName
          );
          if (!matchedProduct) return; // Was filtered out
          if (item.serialNumbers?.length) {
            serialsMap[String(finalIdx)] = item.serialNumbers;
          }
          finalIdx++;
        });

        setPendingServiceId(serviceId);
        setPrefillData({
          clientId: prefill.clientId,
          referenceNumber: prefill.referenceNumber,
          items: formItems.length > 0 ? formItems : [{ productId: '' }],
          _serialNumbers: serialsMap,
          _serviceId: serviceId,
        });

        toast.info(`Creating invoice for Service ${prefill.referenceNumber}`);
      } catch (error: any) {
        console.error('Failed to load service prefill data', error);
        toast.error(error?.message || 'Failed to load service details for billing');
      }
    };

    fetchServicePrefill();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedCompany, loading, clients, products, router]);

  // Open the invoice dialog once prefillData is ready (step 2)
  // This separate effect ensures React has committed the prefillData state
  // before the InvoiceForm mounts and reads it as defaultValues.
  useEffect(() => {
    if (prefillData && pendingServiceId && !actions.isDialogOpen) {
      actions.handleAddInvoice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillData, pendingServiceId]);


  const handleInvoiceChange = async () => {
    await refreshData();
  };

  /**
   * Wrapper around actions.handleSubmit that also links the invoice to the
   * source service (if the form was opened via the "Bill" button).
   */
  const handleSubmitWithServiceLink = async (data: any) => {
    const createdInvoice = await actions.handleSubmit(data);

    if (createdInvoice?.id && pendingServiceId) {
      try {
        await servicesApi.linkInvoice(pendingServiceId, createdInvoice.id);
        toast.success('Invoice linked to service');
      } catch (err) {
        console.error('Failed to link invoice to service:', err);
        toast.error('Invoice created but failed to link to service');
      } finally {
        setPendingServiceId(null);
        setPrefillData(null);
      }
    }
  };

  // Custom delete handler using React Query mutation for proper cache invalidation
  const handleDeleteInvoice = async () => {
    if (!actions.deleteInvoice?.id) return;

    deleteInvoiceMutation.mutate(
      { id: actions.deleteInvoice.id, companyId: actions.deleteInvoice.companyId },
      {
        onSettled: () => {
          actions.setDeleteInvoice(null);
        }
      }
    );
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
      <InvoicePageHeader
        onAddInvoice={() => actions.handleAddInvoice()}
        onOpenCustomization={() => actions.setIsCustomizationDialogOpen(true)}
        onExportExcel={handleExportExcel}
        onExportCSV={handleExportCSV}
      />

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
        <InvoiceList
          invoices={filteredInvoices}
          clients={clients}
          onEdit={actions.handleEditInvoice}
          onDelete={actions.setDeleteInvoice}
          onView={actions.handleViewInvoice}
          onDownload={actions.handleDownloadInvoice}
          onPayment={actions.handleOpenPaymentDialog}
        />
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={actions.isDialogOpen} onOpenChange={actions.setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
              onSubmit={handleSubmitWithServiceLink}
              onCancel={() => actions.setIsDialogOpen(false)}
              prefillData={prefillData}
              onClientAdded={(newClient) => {
                setTimeout(() => {
                  refetchClients();
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
            <AlertDialogAction onClick={handleDeleteInvoice}>Delete</AlertDialogAction>
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
          company={selectedCompany} // Pass full company object
          type="invoice"
          onSave={refreshData}
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

