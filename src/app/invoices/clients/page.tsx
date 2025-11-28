/**
 * Clients Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { FilterBar, ExportButton } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { ClientForm, ClientList, ClientFilters } from '@/components/clients';
import { Client } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientFormSchema } from '@/lib/validations';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { exportToExcel, exportToCSV, formatClientsForExport } from '@/lib/utils/export-utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { clientsApi } from '@/lib/api/clients.api';

type ClientFormData = z.infer<typeof clientFormSchema>;

function ClientsContent() {
  const { selectedCompany } = useCompany();
  const { clients, clientsLoading, refreshClients } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Filter configuration
  const filterConfig: FilterConfig<Client> = {
    state: (client, value) => client.address?.state === value,
    city: (client, value) => client.address?.city === value,
  };

  const {
    filters,
    filteredData: filteredClients,
    updateFilter,
    clearFilters,
    activeFilterCount,
  } = useFilters(clients, filterConfig);

  const handleOpenForm = (client?: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(undefined);
  };

  const handleSubmit = async (data: ClientFormData) => {
    if (!selectedCompany) return;

    try {
      // Clients are global in backend
      const clientData = {
        ...data,
      };

      if (editingClient) {
        // Update existing client using API
        await clientsApi.update(editingClient.id, clientData);
        toast.success('Client updated successfully');
      } else {
        // Create new client using API
        await clientsApi.create(clientData);
        toast.success('Client created successfully');
      }

      handleCloseForm();
      await refreshClients();
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;

    try {
      await clientsApi.delete(deletingClient.id);
      toast.success('Client deleted successfully');
      setDeletingClient(null);
      await refreshClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleExportExcel = async () => {
    const data = formatClientsForExport(filteredClients);
    return exportToExcel(data, `clients-${new Date().toISOString().split('T')[0]}`, 'Clients');
  };

  const handleExportCSV = async () => {
    const data = formatClientsForExport(filteredClients);
    return exportToCSV(data, `clients-${new Date().toISOString().split('T')[0]}`);
  };

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Clients"
          description="Manage your client relationships"
        >
          <Button disabled>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </PageHeader>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Please select a company to manage clients
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage your client relationships"
      >
        <div className="flex gap-2">
          <ExportButton
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
          />
          <Button onClick={() => handleOpenForm()}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </PageHeader>

      {/* Filter Bar */}
      <FilterBar 
        activeFilterCount={activeFilterCount} 
        onClearFilters={clearFilters}
        resultsCount={filteredClients.length}
        totalCount={clients.length}
      >
        <ClientFilters
          clients={clients}
          onFilterChange={updateFilter}
          filters={filters}
        />
      </FilterBar>

      {clientsLoading ? (
        <div className="text-center py-12">Loading clients...</div>
      ) : (
        <ClientList
          clients={filteredClients}
          onEdit={handleOpenForm}
          onDelete={(client) => setDeletingClient(client)}
        />
      )}

      {/* Client Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Update the client details below.'
                : 'Add a new client to your database.'}
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            client={editingClient}
            companyId={selectedCompany.id}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingClient}
        onOpenChange={(open) => !open && setDeletingClient(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        description={`Are you sure you want to delete "${deletingClient?.clientName}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <DashboardLayout>
      <ClientsContent />
    </DashboardLayout>
  );
}
