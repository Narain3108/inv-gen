/**
 * Product Form Component
 * Form for creating/editing products and services
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productFormSchema } from '@/lib/validations';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { GST_RATES, PRODUCT_UNITS } from '@/lib/constants';
import { fetchHSNDetails } from '@/lib/api/gst-api';
import { z } from 'zod';

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  companyId: string;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
}

export function ProductForm({ product, companyId, onSubmit, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHSN, setIsFetchingHSN] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
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
    } : {
      type: 'product',
      unit: 'Nos',
      gstRate: 18,
      cessRate: 0,
      stock: 0,
    } as any,
  });

  const hsn = watch('hsn');
  const productType = watch('type');

  // Auto-fetch HSN details
  const handleFetchHSN = async () => {
    if (!hsn || (hsn.length !== 4 && hsn.length !== 6 && hsn.length !== 8)) {
      toast.error('Please enter a valid HSN code (4, 6, or 8 digits)');
      return;
    }

    setIsFetchingHSN(true);
    try {
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

  const handleFormSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success(product ? 'Product updated successfully' : 'Product created successfully');
    } catch (error) {
      toast.error('Failed to save product');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Enter the product or service details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Product Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={watch('type') || 'product'}
              onValueChange={(value) => setValue('type', value as 'product' | 'service')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* HSN/SAC Code */}
          <div className="space-y-2">
            <Label htmlFor="hsn">{productType === 'product' ? 'HSN Code' : 'SAC Code'} *</Label>
            <div className="flex gap-2">
              <Input
                id="hsn"
                {...register('hsn')}
                placeholder={productType === 'product' ? 'e.g., 12345678' : 'e.g., 998311'}
                maxLength={8}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchHSN}
                disabled={isFetchingHSN || !hsn}
              >
                {isFetchingHSN ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {productType === 'product' 
                ? 'HSN code for products (4, 6, or 8 digits)'
                : 'SAC code for services (6 digits)'}
            </p>
            {errors.hsn && (
              <p className="text-sm text-red-500">{errors.hsn.message}</p>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="productName">Name *</Label>
            <Input
              id="productName"
              {...register('productName')}
              placeholder="Enter product/service name"
            />
            {errors.productName && (
              <p className="text-sm text-red-500">{errors.productName.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter product description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">Unit *</Label>
            <Select
              value={watch('unit') || 'Nos'}
              onValueChange={(value) => setValue('unit', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_UNITS.map((unit: string) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unit && (
              <p className="text-sm text-red-500">{errors.unit.message}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (₹) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tax Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Information</CardTitle>
          <CardDescription>GST and tax details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GST Rate */}
          <div className="space-y-2">
            <Label htmlFor="gstRate">GST Rate (%) *</Label>
            <Select
              value={watch('gstRate')?.toString() || '18'}
              onValueChange={(value) => setValue('gstRate', parseFloat(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select GST rate" />
              </SelectTrigger>
              <SelectContent>
                {GST_RATES.map((rate) => (
                  <SelectItem key={rate.value} value={rate.value.toString()}>
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.gstRate && (
              <p className="text-sm text-red-500">{errors.gstRate.message}</p>
            )}
          </div>

          {/* Cess */}
          <div className="space-y-2">
            <Label htmlFor="cessRate">Cess (%)</Label>
            <Input
              id="cessRate"
              type="number"
              step="0.01"
              {...register('cessRate', { valueAsNumber: true })}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Additional cess percentage, if applicable
            </p>
            {errors.cessRate && (
              <p className="text-sm text-red-500">{errors.cessRate.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stock Information (Only for Products) */}
      {productType === 'product' && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Information</CardTitle>
            <CardDescription>Inventory and stock management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock</Label>
              <Input
                id="stock"
                type="number"
                {...register('stock', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-red-500">{errors.stock.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
