/**
 * Clients Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserPlus } from 'lucide-react';
import { ClientForm, ClientList } from '@/components/clients';
import { Client } from '@/types';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';
import { z } from 'zod';
import { clientFormSchema } from '@/lib/validations';
import { useCompany } from '@/hooks/useCompany';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

type ClientFormData = z.infer<typeof clientFormSchema>;

function ClientsContent() {
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

  // Reload when component becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && selectedCompany) {
        loadClients();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedCompany]);

  const loadClients = async () => {
    if (!selectedCompany) return;

    setIsLoading(true);
    try {
      const clientsRef = collection(db, 'clients');
      // Load all clients globally - no company filtering
      const snapshot = await getDocs(clientsRef);
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(clientsData);
      console.log('Loaded global clients:', clientsData);
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
    if (!selectedCompany) return;

    try {
      // Don't add companyId - clients are global
      const clientData = {
        ...data,
      };

      if (editingClient) {
        // Update existing client
        const clientRef = doc(db, 'clients', editingClient.id);
        await updateDoc(clientRef, {
          ...clientData,
          updatedAt: serverTimestamp(),
        });
        toast.success('Client updated successfully');
      } else {
        // Create new client (global - no companyId)
        await addDoc(collection(db, 'clients'), {
          ...clientData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
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
      await deleteDoc(doc(db, 'clients', deletingClient.id));
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
    <DashboardLayout>
      <ClientsContent />
    </DashboardLayout>
  );
}
