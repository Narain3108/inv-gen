/**
 * Clients Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { ClientForm, ClientList } from '@/components/clients';
import { useAuth } from '@/lib/firebase/auth-context';
import { Client } from '@/types';
import { createDocument, getUserCompanyDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firestore-helpers';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientFormSchema } from '@/lib/validations';
import { useCompany } from '@/hooks/useCompany';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

type ClientFormData = z.infer<typeof clientFormSchema>;

function ClientsContent() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      loadClients();
    }
  }, [selectedCompany]);

  const loadClients = async () => {
    if (!selectedCompany || !user) return;

    setIsLoading(true);
    try {
      const data = await getUserCompanyDocuments('clients', user.uid, selectedCompany.id);
      setClients(data as Client[]);
    } catch (error) {
      console.error('Error loading clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (client?: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingClient(undefined);
  };

  const handleSubmit = async (data: ClientFormData) => {
    if (!user || !selectedCompany) return;

    try {
      const clientData = {
        ...data,
        companyId: selectedCompany.id,
        userId: user.uid,
      };

      if (editingClient) {
        // Update existing client
        await updateDocument('clients', editingClient.id, clientData);
        toast.success('Client updated successfully');
      } else {
        // Create new client
        await createDocument('clients', clientData);
        toast.success('Client created successfully');
      }

      handleCloseForm();
      await loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;

    try {
      await deleteDocument('clients', deletingClient.id);
      toast.success('Client deleted successfully');
      setDeletingClient(null);
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
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
        <Button onClick={() => handleOpenForm()}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="text-center py-12">Loading clients...</div>
      ) : (
        <ClientList
          clients={clients}
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
    <ProtectedRoute>
      <DashboardLayout>
        <ClientsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
