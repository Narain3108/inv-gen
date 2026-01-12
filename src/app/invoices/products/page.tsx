/**
 * Products Page
 */

'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { FilterBar, ExportButton } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ProductForm, ProductList, ProductFilters } from '@/components/products';
import { Product } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { productFormSchema } from '@/lib/validations';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { exportToExcel, exportToCSV, formatProductsForExport } from '@/lib/utils/export-utils';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { productsApi } from '@/lib/api/products.api';
import { TableSkeleton } from '@/components/shared/Skeletons';

type ProductFormData = z.infer<typeof productFormSchema>;

function ProductsContent() {
  const { selectedCompany } = useCompany();
  const { products, productsLoading, refreshProducts, deleteProduct } = useAppData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Filter configuration
  const filterConfig: FilterConfig<Product> = {
    unit: (product, value) => product.unit === value,
    gstRate: (product, value) => product.gstRate === parseFloat(value),
    stockStatus: (product, value) => {
      if (product.type === 'service') return value === 'service';
      const stock = product.stock || 0;
      if (value === 'in-stock') return stock > 10;
      if (value === 'low-stock') return stock > 0 && stock <= 10;
      if (value === 'out-of-stock') return stock === 0;
      return true;
    },
    minPrice: (product, value) => product.price >= value,
    maxPrice: (product, value) => product.price <= value,
  };

  const {
    filters,
    filteredData: filteredProducts,
    updateFilter,
    clearFilters,
    activeFilterCount,
  } = useFilters(products, filterConfig);

  if (productsLoading && products.length === 0) {
      return (
        <div className="space-y-6">
          <PageHeader
            title="Products & Services"
            description="Manage your product inventory and services"
          >
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </PageHeader>
          <TableSkeleton />
        </div>
      );
  }

  const handleOpenForm = (product?: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  const handleSubmit = async (data: ProductFormData) => {
    if (!selectedCompany) return;

    try {
      // Filter out undefined values and null values
      // Remove itemCode if it's empty or undefined
      const cleanData = { ...data };
      if (!cleanData.itemCode || cleanData.itemCode.trim() === '') {
        delete cleanData.itemCode;
      }
      
      // Remove null values and replace with undefined
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key as keyof typeof cleanData] === null) {
          delete cleanData[key as keyof typeof cleanData];
        }
      });

      if (editingProduct) {
        // Update existing product using API - don't send companyId
        console.log('Updating product:', editingProduct.id, cleanData);
        await productsApi.update(editingProduct.id, cleanData as Partial<Product>);
        toast.success('Product updated successfully');
      } else {
        // Create new product using API - include companyId
        const productData: Partial<Product> = {
          ...cleanData,
          companyId: selectedCompany.id,
        } as Partial<Product>;
        console.log('Creating new product:', productData);
        const newProduct = await productsApi.create(productData);
        console.log('Created product with ID:', newProduct.id);
        toast.success('Product created successfully');
      }

      handleCloseForm();
      await refreshProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    const productToDelete = deletingProduct;
    setDeletingProduct(null);

    try {
      await deleteProduct(productToDelete.id);
    } catch (error) {
      // Error handled in context
    }
  };

  const handleExportExcel = async () => {
    const data = formatProductsForExport(filteredProducts);
    return exportToExcel(data, `products-${new Date().toISOString().split('T')[0]}`, 'Products');
  };

  const handleExportCSV = async () => {
    const data = formatProductsForExport(filteredProducts);
    return exportToCSV(data, `products-${new Date().toISOString().split('T')[0]}`);
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
        <div className="flex gap-2">
          <ExportButton
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
          />
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </PageHeader>

      {/* Filter Bar */}
      <FilterBar 
        activeFilterCount={activeFilterCount} 
        onClearFilters={clearFilters}
        resultsCount={filteredProducts.length}
        totalCount={products.length}
      >
        <ProductFilters
          products={products}
          onFilterChange={updateFilter}
          filters={filters}
        />
      </FilterBar>

      {productsLoading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : (
        <ProductList
          products={filteredProducts}
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
    <DashboardLayout>
      <ProductsContent />
    </DashboardLayout>
  );
}

