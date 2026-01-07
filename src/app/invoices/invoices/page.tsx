/**
 * Invoices Page
 * Manage invoices with PDF generation
 * Refactored using hooks and components for maintainability
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Invoice, Client, Company } from '@/types';
import { InvoiceForm, InvoiceList, InvoiceFilters, PaymentDialog, CustomizationDialog, CopyTypeDialog } from '@/components/invoices';
import { FilterBar } from '@/components/shared';
import { exportToExcel, exportToCSV, formatInvoicesForExport } from '@/lib/utils/export-utils';
import { invoicesApi } from '@/lib/api/invoices.api';
import { clientsApi } from '@/lib/api/clients.api';
import { companiesApi } from '@/lib/api/companies.api';
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
import { InvoicePageHeader } from '@/components/pages/invoices';

/**
 * Invoice filter configuration
 */
const createFilterConfig = (): FilterConfig<Invoice> => ({
  paymentStatus: (invoice, value) => invoice.paymentStatus === value,
  datePeriod: (invoice, value) => {
    if (!invoice.date) return false;
    const invoiceDate = typeof invoice.date === 'string' ? new Date(invoice.date) : invoice.date;
    const now = new Date();

    switch (value) {
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
      case 'this-year': {
        return invoiceDate.getFullYear() === now.getFullYear();
      }
      case 'last-year': {
        return invoiceDate.getFullYear() === now.getFullYear() - 1;
      }
      default:
        return true;
    }
  },
  month: (invoice, value) => {
    if (!invoice.date) return false;
    const invoiceDate = typeof invoice.date === 'string' ? new Date(invoice.date) : invoice.date;
    const monthYear = invoiceDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return monthYear === value;
  },
  year: (invoice, value) => {
    if (!invoice.date) return false;
    const invoiceDate = typeof invoice.date === 'string' ? new Date(invoice.date) : invoice.date;
    return invoiceDate.getFullYear() === parseInt(value);
  },
  minAmount: (invoice, value) => invoice.totalAmount >= value,
  maxAmount: (invoice, value) => invoice.totalAmount <= value,
});

function InvoicesContent() {
  const { selectedCompany, setSelectedCompany } = useCompany();
  const { companies, companiesInitialized, products } = useAppData();

  // Local state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Load invoices
  const loadInvoices = React.useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    try {
      const freshCompany = await companiesApi.getById(selectedCompany.id);
      setCompany(freshCompany);

      if (JSON.stringify(freshCompany) !== JSON.stringify(selectedCompany)) {
        setSelectedCompany(freshCompany);
      }

      const invoicesData = await invoicesApi.getByCompanyId(selectedCompany.id);
      invoicesData.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setInvoices(invoicesData);

      const clientsData = await clientsApi.getAll({ company_id: selectedCompany.id });
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, setSelectedCompany]);

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
        loadInvoices();
      }
    }
  }, [selectedCompany, companiesInitialized, companies, loadInvoices]);

  // Invoice actions hook
  const actions = useInvoiceActions({
    selectedCompany,
    company,
    products,
    clients,
    invoices,
    onInvoicesChange: setInvoices,
    onRefreshInvoices: loadInvoices,
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

  // Loading state
  if (loading || !companiesInitialized) {
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
      <InvoicePageHeader
        onAddInvoice={actions.handleAddInvoice}
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

      {/* Invoice List */}
      <InvoiceList
        invoices={filteredInvoices}
        clients={clients}
        onEdit={actions.handleEditInvoice}
        onDelete={actions.setDeleteInvoice}
        onView={actions.handleViewInvoice}
        onDownload={actions.handleDownloadInvoice}
        onPayment={actions.handleOpenPaymentDialog}
      />

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
          onSave={loadInvoices}
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
