/**
 * Product Categories Settings Page
 * Global product categories management (accessible by all companies)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Tag } from 'lucide-react';
import { CategoryForm, CategoryList } from '@/components/categories';
import { ProductCategory, ProductCategoryFormData } from '@/types';
import {
  fetchProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from '@/lib/services/product-category-service';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

function CategoriesContent() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | undefined>();
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null);

  // Load categories
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchProductCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load product categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenForm = (category?: ProductCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCategory(undefined);
  };

  const handleSubmit = async (data: ProductCategoryFormData) => {
    try {
      if (editingCategory) {
        await updateProductCategory(editingCategory.id, data);
      } else {
        await createProductCategory(data);
      }

      handleCloseForm();
      await loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      await deleteProductCategory(deletingCategory.id);
      toast.success('Category deleted successfully');
      setDeletingCategory(null);
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        description="Manage global product categories to auto-fill GST rates for all companies"
        icon={Tag}
      >
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </PageHeader>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Tag className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Global Product Categories
            </h3>
            <p className="text-sm text-blue-700">
              Categories created here are accessible by all companies. When adding a product, if
              the HSN code or product name matches a category, the GST rate will be auto-filled.
            </p>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <CategoryList
        categories={categories}
        loading={loading}
        onEdit={handleOpenForm}
        onDelete={setDeletingCategory}
      />

      {/* Category Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Product Category' : 'Create Product Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details and products.'
                : 'Create a new global category to organize products and auto-fill GST rates.'}
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={() => setDeletingCategory(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deletingCategory?.categoryName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <DashboardLayout>
      <CategoriesContent />
    </DashboardLayout>
  );
}
