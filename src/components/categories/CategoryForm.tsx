/**
 * Product Category Form Component
 * Form for creating/editing global product categories
 */

'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryFormSchema } from '@/lib/validations';
import { ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GST_RATES } from '@/lib/constants';

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: ProductCategory;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel?: () => void;
}

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: category
      ? {
          categoryName: category.categoryName,
          description: category.description,
          products: category.products || [],
          defaultGstRate: category.defaultGstRate,
        }
      : {
          categoryName: '',
          description: '',
          products: [],
          defaultGstRate: 18,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  const handleAddProduct = () => {
    append({ name: '', hsn: '', itemCode: '' });
  };

  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success(
        category ? 'Category updated successfully' : 'Category created successfully'
      );
    } catch (error) {
      console.error('Error submitting category:', error);
      toast.error('Failed to save category');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Category Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="categoryName">Category Name *</Label>
            <Input
              id="categoryName"
              {...register('categoryName', { required: true })}
              placeholder="e.g., Electronics, Textiles, Services"
            />
            {errors.categoryName && (
              <p className="text-sm text-red-500">Category name is required</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of this category"
              rows={2}
            />
          </div>

          {/* Default GST Rate */}
          <div className="space-y-2">
            <Label htmlFor="defaultGstRate">Default GST Rate *</Label>
            <Select
              value={watch('defaultGstRate')?.toString()}
              onValueChange={(value) => setValue('defaultGstRate', Number(value))}
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
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Products in Category</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={handleAddProduct}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products added yet. Click "Add Product" to begin.
            </p>
          ) : (
            fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="grid grid-cols-12 gap-3 items-start">
                  {/* Product Name */}
                  <div className="col-span-5 space-y-2">
                    <Label htmlFor={`products.${index}.name`} className="text-xs">
                      Product Name *
                    </Label>
                    <Input
                      id={`products.${index}.name`}
                      {...register(`products.${index}.name` as const, {
                        required: true,
                      })}
                      placeholder="e.g., Laptop, Cotton Shirt"
                    />
                    {errors.products?.[index]?.name && (
                      <p className="text-sm text-red-500">{errors.products?.[index]?.name?.message as any}</p>
                    )}
                  </div>

                  {/* HSN Code */}
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor={`products.${index}.hsn`} className="text-xs">
                      HSN/SAC Code *
                    </Label>
                    <Input
                      id={`products.${index}.hsn`}
                      {...register(`products.${index}.hsn` as const, {
                        required: true,
                      })}
                      placeholder="e.g., 8471"
                    />
                    {errors.products?.[index]?.hsn && (
                      <p className="text-sm text-red-500">{errors.products?.[index]?.hsn?.message as any}</p>
                    )}
                  </div>

                  {/* Item Code (Optional) */}
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor={`products.${index}.itemCode`} className="text-xs">
                      Item Code
                    </Label>
                    <Input
                      id={`products.${index}.itemCode`}
                      {...register(`products.${index}.itemCode` as const)}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
