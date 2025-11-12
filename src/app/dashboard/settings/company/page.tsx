/**
 * Company Settings Page
 * Manage company profiles
 */

'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { CompanyForm, CompanyList } from '@/components/company';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Plus, Building2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Company } from '@/types';
import { createDocument, getUserDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firestore-helpers';
import { toast } from 'sonner';
import { z } from 'zod';
import { companyFormSchema } from '@/lib/validations';
import { useCompany } from '@/hooks/useCompany';

type CompanyFormData = z.infer<typeof companyFormSchema>;

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const { selectedCompany, setSelectedCompany } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  // Load companies
  useEffect(() => {
    loadCompanies();
  }, [user]);

  const loadCompanies = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await getUserDocuments<Company>('companies', user.uid);
      setCompanies(data);

      // Set first company as selected if none selected
      if (data.length > 0 && !selectedCompany) {
        setSelectedCompany(data[0]);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = () => {
    setEditingCompany(undefined);
    setIsFormOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsFormOpen(true);
  };

  const handleDeleteCompany = (companyId: string) => {
    setCompanyToDelete(companyId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    try {
      await deleteDocument('companies', companyToDelete);
      toast.success('Company deleted successfully');
      
      // If deleted company was selected, select another one
      if (selectedCompany?.id === companyToDelete) {
        const remaining = companies.filter(c => c.id !== companyToDelete);
        setSelectedCompany(remaining.length > 0 ? remaining[0] : null);
      }
      
      await loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('Failed to delete company');
    } finally {
      setDeleteConfirmOpen(false);
      setCompanyToDelete(null);
    }
  };

  const handleSubmit = async (data: CompanyFormData) => {
    if (!user) return;

    try {
      // Extract state from GSTIN (first 2 digits) or use address state
      let state = data.address.state;
      if (data.gstin && data.gstin.length >= 2) {
        const gstinStateCode = data.gstin.substring(0, 2);
        // You could map GSTIN state codes to state names here if needed
        // For now, we'll use the address state
      }

      const companyData = {
        ...data,
        userId: user.uid,
        state: state, // Store state for tax calculation
      };

      if (editingCompany) {
        // Update existing company
        await updateDocument('companies', editingCompany.id, companyData);
        toast.success('Company updated successfully');
      } else {
        // Create new company
        const id = await createDocument('companies', companyData);
        
        // Set as selected if it's the first company
        if (companies.length === 0) {
          const newCompany = { id, ...companyData } as Company;
          setSelectedCompany(newCompany);
        }
        
        toast.success('Company created successfully');
      }

      setIsFormOpen(false);
      setEditingCompany(undefined);
      await loadCompanies();
    } catch (error) {
      console.error('Error saving company:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">Loading companies...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            icon={Building2}
            title="Company Management"
            description="Manage your company profiles and details"
          >
            <Button onClick={handleCreateCompany}>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </PageHeader>

          <CompanyList
            companies={companies}
            selectedCompanyId={selectedCompany?.id}
            onSelect={setSelectedCompany}
            onEdit={handleEditCompany}
            onDelete={handleDeleteCompany}
          />

          {/* Company Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? 'Edit Company' : 'Create New Company'}
                </DialogTitle>
                <DialogDescription>
                  {editingCompany
                    ? 'Update your company information below.'
                    : 'Add a new company to your account.'}
                </DialogDescription>
              </DialogHeader>
              <CompanyForm
                company={editingCompany}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingCompany(undefined);
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <ConfirmDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={confirmDelete}
            title="Delete Company"
            description="Are you sure you want to delete this company? This action cannot be undone and will also delete all associated products, clients, and invoices."
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
