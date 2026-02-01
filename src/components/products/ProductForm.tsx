/**
 * Product Form Component
 * Form for creating/editing products and services
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Form logic separated into tab content components
 * - DRY: Uses shared TabFormLayout component
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema } from '@/lib/validations';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, RefreshCw, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { GST_RATES, PRODUCT_UNITS } from '@/lib/constants';
import { fetchHSNDetails } from '@/lib/api/gst-api';
import { findCategoryByHSN, findCategoryByProductName } from '@/lib/services/product-category-service';
import { z } from 'zod';
import { TabFormLayout, TabConfig } from '@/components/shared/TabFormLayout';

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  companyId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
}

// ============================================================================
// Tab Content Components (Single Responsibility Principle)
// ============================================================================

interface BasicInfoTabProps {
  form: UseFormReturn<ProductFormData>;
  product?: Product;
  companyId: string;
  autoFilledFrom: string | null;
  setAutoFilledFrom: (v: string | null) => void;
}

/** Basic Information Tab Content */
function BasicInfoTab({ form, product, companyId, autoFilledFrom, setAutoFilledFrom }: BasicInfoTabProps) {
  const { register, setValue, watch, formState: { errors } } = form;
  const [isFetchingHSN, setIsFetchingHSN] = useState(false);

  const hsn = watch('hsn');
  const productType = watch('type');
  const productName = watch('productName');

  const currentGstRate = watch('gstRate');



  // Auto-fill from HSN match
  const autoFillFromCategory = async () => {
    try {
      const hsnMatch = await findCategoryByHSN(companyId, hsn);
      if (hsnMatch) {
        setValue('productName', hsnMatch.product.name);
        setValue('gstRate', hsnMatch.category.defaultGstRate);

        setAutoFilledFrom(hsnMatch.category.categoryName);
        toast.success(`Auto-filled from category: ${hsnMatch.category.categoryName}`, { duration: 3000 });
      }
    } catch (error) {
      console.error('Error auto-filling from category:', error);
    }
  };

  // Fetch HSN details
  const handleFetchHSN = async () => {
    if (!hsn || (hsn.length !== 4 && hsn.length !== 6 && hsn.length !== 8)) {
      toast.error('Please enter a valid HSN code (4, 6, or 8 digits)');
      return;
    }

    setIsFetchingHSN(true);
    try {
      const categoryMatch = await findCategoryByHSN(companyId, hsn);
      if (categoryMatch) {
        setValue('productName', categoryMatch.product.name);
        setValue('gstRate', categoryMatch.category.defaultGstRate);
        toast.success(`Auto-filled from category: ${categoryMatch.category.categoryName}`);
        setIsFetchingHSN(false);
        return;
      }

      const details = await fetchHSNDetails(hsn);
      if (details) {
        setValue('productName', details.description);
        setValue('gstRate', details.gstRate);
        toast.success('HSN details fetched successfully');
      } else {
        toast.error('Failed to fetch HSN details');
      }
    } catch (error) {
      toast.error('Error fetching HSN details');
    } finally {
      setIsFetchingHSN(false);
    }
  };

  // Auto-check categories when HSN changes
  React.useEffect(() => {
    if (!product && hsn && hsn.length >= 4) {
      autoFillFromCategory();
    }
  }, [hsn]);

  return (
    <div className="space-y-6">
      {/* Auto-filled Notice */}
      {autoFilledFrom && !product && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex gap-3">
            <Tag className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-900 mb-1">
                Product Details Auto-filled
              </h3>
              <p className="text-sm text-green-700">
                Details auto-filled from category: <strong>{autoFilledFrom}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Type */}
          <FloatingLabelSelect
            id="type"
            label="Type *"
            value={watch('type') || 'product'}
            onValueChange={(value: string) => setValue('type', value as 'product' | 'service')}
            error={errors.type?.message}
          >
            <SelectContent>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </FloatingLabelSelect>

          {/* Serial Number Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasSerialNumber"
              {...register('hasSerialNumber')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <Label htmlFor="hasSerialNumber" className="font-normal cursor-pointer">
              Has Serial Number
            </Label>
          </div>

          {/* HSN/SAC Code */}
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <FloatingLabelInput
                id="hsn"
                label={productType === 'product' ? 'HSN Code *' : 'SAC Code *'}
                {...register('hsn')}
                maxLength={8}
                error={errors.hsn?.message}
              />

            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleFetchHSN}
              disabled={isFetchingHSN || !hsn}
              className="mt-1"
            >
              {isFetchingHSN ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {/* Product Name */}
          <FloatingLabelInput
            id="productName"
            label="Name *"
            {...register('productName')}
            error={errors.productName?.message}
          />



          {/* Description */}
          <FloatingLabelTextarea
            id="description"
            label="Description"
            {...register('description')}
            rows={3}
            error={errors.description?.message}
          />

          {/* Unit */}
          <FloatingLabelSelect
            id="unit"
            label="Unit *"
            value={watch('unit') || 'Nos'}
            onValueChange={(value: string) => setValue('unit', value)}
            error={errors.unit?.message}
          >
            <SelectContent>
              {PRODUCT_UNITS.map((unit: string) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </FloatingLabelSelect>

          {/* Price */}
          <FloatingLabelInput
            id="price"
            type="number"
            label="Price (₹) *"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message}
          />

          {/* Stock (only for products) */}
          {watch('type') === 'product' && (
            <div>
              <FloatingLabelInput
                id="stock"
                type="number"
                label="Stock Quantity"
                step="1"
                min="0"
                {...register('stock')}
                defaultValue={product?.stock ?? ''}
                error={errors.stock?.message}
              />

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Tax Information Tab Content */
function TaxInfoTab({ form }: { form: UseFormReturn<ProductFormData> }) {
  const { register, setValue, watch, formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Information</CardTitle>

      </CardHeader>
      <CardContent className="space-y-4">
        {/* GST Rate */}
        <FloatingLabelSelect
          id="gstRate"
          label="GST Rate (%) *"
          value={watch('gstRate')?.toString() || '18'}
          onValueChange={(value: string) => setValue('gstRate', parseFloat(value))}
          error={errors.gstRate?.message}
        >
          <SelectContent>
            {GST_RATES.map((rate) => (
              <SelectItem key={rate.value} value={rate.value.toString()}>
                {rate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </FloatingLabelSelect>

        {/* Cess */}
        <div>
          <FloatingLabelInput
            id="cessRate"
            type="number"
            label="Cess (%)"
            step="0.01"
            {...register('cessRate', { valueAsNumber: true })}
            error={errors.cessRate?.message}
          />

        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Form Component
// ============================================================================

type TabKey = 'basic' | 'tax';

export function ProductForm({ product, companyId, onSubmit, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [autoFilledFrom, setAutoFilledFrom] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema) as any,
    defaultValues: product ? {
      productName: product.productName,
      description: product.description,

      hsn: product.hsn,
      type: product.type,
      unit: product.unit,
      price: product.price,
      gstRate: product.gstRate,
      cessRate: product.cessRate,
      stock: product.stock,
      hasSerialNumber: product.hasSerialNumber || false,
    } : {
      type: 'product',
      unit: 'Nos',
      gstRate: 18,
      cessRate: 0,
      hasSerialNumber: false,
    } as any,
  });

  const { handleSubmit, trigger } = form;

  // Tab navigation
  const tabsOrder: TabKey[] = ['basic', 'tax'];
  const fieldsPerTab: Record<TabKey, string[]> = {
    basic: ['productName', 'hsn', 'type', 'unit', 'price'],
    tax: ['gstRate', 'cessRate'],
  };

  const goToNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const valid = await trigger(fieldsPerTab[activeTab] as any);
    if (!valid) {
      toast.error('Please fix errors before proceeding');
      return;
    }
    const idx = tabsOrder.indexOf(activeTab);
    if (idx >= 0 && idx < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[idx + 1]);
    }
  };

  const goBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const idx = tabsOrder.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabsOrder[idx - 1]);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      const productData = {
        productName: data.productName,
        description: data.description || null,

        hsn: data.hsn || null,
        unit: data.unit,
        price: data.price,
        gstRate: data.gstRate,
        cessRate: data.cessRate || 0,
        stock: data.stock ?? 0,
        type: data.type,
        hasSerialNumber: data.hasSerialNumber || false,
      };

      await onSubmit(productData as any);
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
    } catch (error: any) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.detail
        ? (Array.isArray(error.response.data.detail)
          ? error.response.data.detail.map((e: any) => e.msg).join(', ')
          : error.response.data.detail)
        : 'Failed to save product';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: TabConfig[] = useMemo(() => [
    {
      key: 'basic',
      label: 'Basic Info',
      content: (
        <BasicInfoTab
          form={form}
          product={product}
          companyId={companyId}
          autoFilledFrom={autoFilledFrom}
          setAutoFilledFrom={setAutoFilledFrom}
        />
      ),
    },
    {
      key: 'tax',
      label: 'Tax & Compliance',
      content: <TaxInfoTab form={form} />,
    },
  ], [form, product, companyId, autoFilledFrom]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <TabFormLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabKey)}
        onNext={goToNext}
        onBack={goBack}
        isLoading={isLoading}
        submitLabel={product ? 'Update Product' : 'Create Product'}
        onCancel={onCancel}
      />
    </form>
  );
}

export default ProductForm;
