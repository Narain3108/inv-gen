/**
 * Products Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ProductForm, ProductList } from '@/components/products';
import { useAuth } from '@/lib/firebase/auth-context';
import { Product } from '@/types';
import { createDocument, getUserCompanyDocuments, updateDocument, deleteDocument } from '@/lib/firebase/firestore-helpers';
import { toast } from 'sonner';
import { z } from 'zod';
import { productFormSchema } from '@/lib/validations';
import { useCompany } from '@/hooks/useCompany';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

type ProductFormData = z.infer<typeof productFormSchema>;

function ProductsContent() {
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      loadProducts();
    }
  }, [selectedCompany]);

  const loadProducts = async () => {
    if (!selectedCompany || !user) return;

    setIsLoading(true);
    try {
      const data = await getUserCompanyDocuments('products', user.uid, selectedCompany.id);
      setProducts(data as Product[]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (product?: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  const handleSubmit = async (data: ProductFormData) => {
    if (!user || !selectedCompany) return;

    try {
      const productData = {
        ...data,
        companyId: selectedCompany.id,
        userId: user.uid,
      };

      if (editingProduct) {
        // Update existing product
        await updateDocument('products', editingProduct.id, productData);
        toast.success('Product updated successfully');
      } else {
        // Create new product
        await createDocument('products', productData);
        toast.success('Product created successfully');
      }

      handleCloseForm();
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      await deleteDocument('products', deletingProduct.id);
      toast.success('Product deleted successfully');
      setDeletingProduct(null);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Products & Services"
          description="Manage your products and services catalog"
        >
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </PageHeader>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Please select a company to manage products
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & Services"
        description="Manage your products and services catalog"
      >
        <Button onClick={() => handleOpenForm()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : (
        <ProductList
          products={products}
          onEdit={handleOpenForm}
          onDelete={(product) => setDeletingProduct(product)}
        />
      )}

      {/* Product Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the product/service details below.'
                : 'Add a new product or service to your catalog.'}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            companyId={selectedCompany.id}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deletingProduct?.productName}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ProductsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

