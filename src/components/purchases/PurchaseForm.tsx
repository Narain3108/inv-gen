/**
 * Purchase Form Component
 * Form for adding products via purchase bills
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Product, ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Calculator, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { GST_RATES, PRODUCT_UNITS } from '@/lib/constants';
import { purchasesApi, PurchaseBill } from '@/lib/api/purchases.api';
import { productsApi } from '@/lib/api/products.api';
import { categoriesApi } from '@/lib/api/categories.api';
import SerialManager from '@/components/shared/SerialManager';
import { DocumentUpload } from '@/components/shared/DocumentUpload';
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductForm } from '@/components/products/ProductForm';
import { SearchableProductDropdown } from '@/components/shared/SearchableProductDropdown';
import { useAppData } from '@/contexts/AppDataContext';

// Schema Definition
const purchaseItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  productId: z.string().optional(), // Optional because it might be a new product
  hsn: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
  gstRate: z.coerce.number().min(0),
  cessRate: z.coerce.number().min(0).optional(),
  amount: z.coerce.number().optional(),
  hasSerialNumber: z.boolean(),
  serialNumbers: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  itemCode: z.string().nullable().optional(),
}).strict();


const purchaseFormSchema = z.object({
  billDate: z.string().min(1, "Bill date is required"),
  billNumber: z.string().min(1, "Bill number is required"),
  vendorName: z.string().optional(),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  totalAmount: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return Number(val);
  }, z.number().optional()),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: PurchaseBill;
  purchaseId?: string;
}

export function PurchaseForm({ companyId, onSuccess, onCancel, initialData, purchaseId }: PurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(
    (initialData as any)?.attachmentUrl
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  // Serial modal index for purchase items
  const [purchaseSerialModalIndex, setPurchaseSerialModalIndex] = useState<number | null>(null);
  const [purchaseSerials, setPurchaseSerials] = useState<Record<number, string[]>>({});

  // App data context for real-time updates
  const { refreshProducts } = useAppData();

  // Local products state for real-time updates
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  // Load products and categories for autocomplete
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          productsApi.getAll({ company_id: companyId }),
          categoriesApi.getAll()
        ]);
        setProducts(productsData);
        setLocalProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load data", error);
        toast.error("Failed to load products/categories");
      }
    };
    loadData();
  }, [companyId]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      billDate: new Date().toISOString().split('T')[0],
      billNumber: '',
      vendorName: '',
      items: [{ 
        productName: '', 
        quantity: 1, 
        unit: 'Nos', 
        unitPrice: 0, 
        gstRate: 18, 
        cessRate: 0, 
        amount: 0, 
        hasSerialNumber: false, 
        serialNumbers: [],
        productId: undefined,
        hsn: undefined,
        description: undefined,
        categoryId: undefined,
        itemCode: undefined,
      }],
      totalAmount: 0,
      notes: '',
    },
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        billDate: initialData.billDate ? initialData.billDate.split('T')[0] : new Date().toISOString().split('T')[0],
        attachmentUrl: (initialData as any)?.attachmentUrl,
        // Ensure items are mapped correctly if needed, though PurchaseBill and PurchaseFormData are similar
        items: initialData.items.map(item => ({
          ...item,
          productId: item.productId,
          description: item.description,
          categoryId: item.categoryId ?? undefined,
          itemCode: item.itemCode ?? undefined,
          // Ensure defaults for optional fields
          hsn: item.hsn,
          serialNumbers: item.serialNumbers || [],
        }))
      });
      // Initialize local serials map so modal shows existing serials by index
      const map: Record<number, string[]> = {};
      (initialData.items || []).forEach((it, idx) => {
        if (it.serialNumbers && Array.isArray(it.serialNumbers) && it.serialNumbers.length > 0) {
          map[idx] = it.serialNumbers as string[];
        }
      });
      if (Object.keys(map).length > 0) setPurchaseSerials(map);
    }
  }, [initialData, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const totalAmount = useWatch({ control, name: 'totalAmount' });

  // Calculate totals whenever items change (guard against undefined watch)
  useEffect(() => {
    const items = Array.isArray(watchItems) ? watchItems : [];
    const total = items.reduce((sum, item) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      const gst = Number(item?.gstRate) || 0;
      const cess = Number(item?.cessRate) || 0;

      const base = qty * price;
      const tax = base * (gst / 100);
      const cessAmount = base * (cess / 100);

      return sum + base + tax + cessAmount;
    }, 0);

    setValue('totalAmount', total);
  }, [watchItems, setValue]);

  // Keep each item's `amount` field in sync so zod sees a numeric value for validation
  useEffect(() => {
    const items = Array.isArray(watchItems) ? watchItems : [];
    items.forEach((item, idx) => {
      const qty = Number(item?.quantity) || 0;
      const price = Number(item?.unitPrice) || 0;
      const gst = Number(item?.gstRate) || 0;
      const cess = Number(item?.cessRate) || 0;

      const base = qty * price;
      const tax = base * (gst / 100);
      const cessAmount = base * (cess / 100);
      const amount = base + tax + cessAmount;

      // Only update if different to avoid extra renders
      const current = item?.amount;
      if (typeof current !== 'number' || Number(current) !== Number(amount)) {
        setValue(`items.${idx}.amount`, amount);
      }
    });
  }, [watchItems, setValue]);

  const handleProductSelect = (index: number, productName: string, product?: Product) => {
    setValue(`items.${index}.productName`, productName);
    
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.hsn`, product.hsn);
      setValue(`items.${index}.unit`, product.unit);
      setValue(`items.${index}.unitPrice`, product.price); // Default to selling price, user can change
      setValue(`items.${index}.gstRate`, product.gstRate);
      setValue(`items.${index}.cessRate`, product.cessRate || 0);
      setValue(`items.${index}.hasSerialNumber`, product.hasSerialNumber || false);
      setValue(`items.${index}.categoryId`, product.categoryId ?? undefined);
      setValue(`items.${index}.itemCode`, product.itemCode ?? undefined);
      toast.success(`Auto-filled details for ${product.productName}`);
    } else {
      // Reset ID if new product name typed
      setValue(`items.${index}.productId`, undefined);
      setValue(`items.${index}.hsn`, undefined);
      setValue(`items.${index}.categoryId`, undefined);
      setValue(`items.${index}.itemCode`, undefined);
    }
  };

  /**
   * Handle quantity change with immediate serial number management
   * For PurchaseForm: No stock validation (we're adding stock)
   * Auto-opens serial manager if serials are incomplete
   */
  const handleQuantityChange = (index: number, quantity: number) => {
    const item = watchItems?.[index];
    const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
    
    if (!product || quantity <= 0 || isNaN(quantity)) {
      return;
    }

    // Update quantity for PurchaseForm (do not auto-create empty serials)
    setValue(`items.${index}.quantity`, quantity);

    // Handle serial number array for purchases
    // ONLY open serial modal if product has hasSerialNumber === true
    if (product.hasSerialNumber === true) {
      const currentSerials = item.serialNumbers || [];

      // If existing serials are more than new quantity, truncate; do NOT auto-extend with empty strings
      let adjustedSerials = [...currentSerials];
      if (adjustedSerials.length > quantity) {
        adjustedSerials.splice(quantity);
        setValue(`items.${index}.serialNumbers`, adjustedSerials);
      }

      // Auto-open serial modal if serials are incomplete (filled count != quantity)
      const filledSerials = (currentSerials || []).filter(s => s && s.trim()).length;
      if (filledSerials !== quantity && quantity > 0) {
        setTimeout(() => {
          setPurchaseSerialModalIndex(index);
        }, 300);
      }
    }
  };



  // Purchase serial modal now delegated to shared SerialManager component

  const onSubmit = async (data: PurchaseFormData) => {
    // Validate serial numbers
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (item.hasSerialNumber) {
        if (!item.serialNumbers || item.serialNumbers.length !== item.quantity) {
          toast.error(`Item ${i + 1} (${item.productName}): Please enter all ${item.quantity} serial numbers`);
          return;
        }
        if (item.serialNumbers.some(s => !s.trim())) {
          toast.error(`Item ${i + 1}: Serial numbers cannot be empty`);
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      // Compute per-item amount server expects (base + tax + cess)
      const itemsWithAmounts = (data.items || []).map((it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unitPrice) || 0;
        const gst = Number(it.gstRate) || 0;
        const cess = Number(it.cessRate) || 0;
        const base = qty * price;
        const tax = base * (gst / 100);
        const cessAmount = base * (cess / 100);
        return {
          ...it,
          amount: base + tax + cessAmount,
        };
      });

      const payload = {
        ...data,
        companyId,
        items: itemsWithAmounts,
        totalAmount: itemsWithAmounts.reduce((s, it) => s + Number(it.amount || 0), 0),
        attachmentUrl: attachmentUrl, // Include client-uploaded attachment URL
      } as any;

      // Save purchase with the attachment URL (no server-side upload needed)
      if (purchaseId) {
        await purchasesApi.update(purchaseId, payload);
        toast.success("Purchase bill updated successfully");
      } else {
        await purchasesApi.create(payload);
        toast.success("Purchase bill created successfully");
      }

      // Set flag for purchase list to refresh
      localStorage.setItem('purchase-created', 'true');
      
      onSuccess();
    } catch (error) {
      console.error("Error saving purchase:", error);
      toast.error("Failed to save purchase bill");
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errs: any) => {
    try {
      console.error('Validation errors', errs);
      
      // Safely extract error messages without JSON.stringify to avoid circular structure
      const extractErrorMessage = (errorObj: any): string => {
        if (typeof errorObj === 'string') return errorObj;
        if (errorObj?.message) return errorObj.message;
        if (Array.isArray(errorObj)) {
          const firstError = errorObj.find(e => e && typeof e === 'object');
          if (firstError) return extractErrorMessage(firstError);
        }
        if (typeof errorObj === 'object' && errorObj !== null) {
          const keys = Object.keys(errorObj);
          if (keys.length > 0) {
            return extractErrorMessage(errorObj[keys[0]]);
          }
        }
        return 'Validation error';
      };

      // Try to surface the first error path and message
      const firstKey = Object.keys(errs)[0];
      if (firstKey) {
        const firstErr = (errs as any)[firstKey];
        const msg = extractErrorMessage(firstErr);
        toast.error(msg || 'Please fix validation errors in the form');
      } else {
        toast.error('Please fix validation errors in the form');
      }
    } catch (e) {
      console.error('Failed to process validation errors', e);
      toast.error('Please fix validation errors in the form');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6 w-full max-w-none sm:max-w-6xl mx-auto px-2 sm:px-6 py-6 min-h-screen">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billNumber">Bill Number *</Label>
            <Input id="billNumber" {...register('billNumber')} placeholder="e.g. INV-001" />
            {errors.billNumber && <p className="text-sm text-red-500">{errors.billNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="billDate">Bill Date *</Label>
            <Input id="billDate" type="date" {...register('billDate')} />
            {errors.billDate && <p className="text-sm text-red-500">{errors.billDate.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2 md:col-span-1">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input id="vendorName" {...register('vendorName')} placeholder="Supplier Name" />
          </div>
          <div className="sm:col-span-2 md:col-span-3">
            <DocumentUpload
              label="Purchase Bill Attachment (Optional)"
              currentDocumentUrl={attachmentUrl}
              onDocumentUploaded={(url) => {
                setAttachmentUrl(url);
                setValue('attachmentUrl', url);
              }}
              onDocumentRemoved={() => {
                setAttachmentUrl(undefined);
                setValue('attachmentUrl', undefined);
              }}
              folder="purchase-bills"
              maxSize={3}
            />
          </div>
        </CardContent>
      </Card>

      <SerialManager
        open={purchaseSerialModalIndex !== null}
        onClose={() => setPurchaseSerialModalIndex(null)}
        productId={purchaseSerialModalIndex !== null ? watchItems?.[purchaseSerialModalIndex]?.productId : undefined}
        initialSelected={purchaseSerialModalIndex !== null ? (purchaseSerials[purchaseSerialModalIndex] || watchItems?.[purchaseSerialModalIndex]?.serialNumbers || []) : []}
        quantity={purchaseSerialModalIndex !== null ? Number(watchItems?.[purchaseSerialModalIndex]?.quantity) || 0 : 0}
        fetchFromDb={false}
        claimFromDb={false}
        onSave={async (selected) => {
          if (purchaseSerialModalIndex === null) return;
          const idx = purchaseSerialModalIndex;
          // Save into the form field
          setValue(`items.${idx}.serialNumbers`, selected as any);
          // Keep local map in sync so reopening modal shows latest values
          setPurchaseSerials(prev => ({ ...prev, [idx]: selected }));

          // If productId exists, append these serials to product pool in DB
          const productId = watchItems?.[idx]?.productId;
          if (productId) {
            try {
              const prod = await productsApi.getById(productId);
              const existingPool = prod.serialNumbers || [];
              const toAdd = selected.filter((s) => !existingPool.includes(s));
              if (toAdd.length > 0) {
                const updated = [...existingPool, ...toAdd];
                await productsApi.update(productId, { serialNumbers: updated });
              }
              toast.success('Serials saved to product and purchase item');
            } catch (err) {
              console.error('Failed to update product serials', err);
              toast.warning('Saved to purchase item but failed to update product serial pool');
            }
          } else {
            toast.success('Serials saved to purchase item');
          }
        }}
      />

      <Card>
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle>Items</CardTitle>
            <CardDescription className="hidden sm:block">Add products from the bill.</CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => {
            append({ 
              productName: '', 
              quantity: 1, 
              unit: 'Nos', 
              unitPrice: 0, 
              gstRate: 18, 
              cessRate: 0, 
              amount: 0, 
              hasSerialNumber: false, 
              serialNumbers: [],
              productId: undefined,
              hsn: undefined,
              description: undefined,
              categoryId: undefined,
              itemCode: undefined,
            });
            setActiveRowIndex(fields.length); // Set the newly added row as active
          }}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const item = watchItems[index];
            const quantity = Number(item.quantity) || 0;
            const hasSerial = item.hasSerialNumber === true;

            return (
              <div key={field.id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm relative">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>

                <div className="space-y-3">
                  {/* First Row: Product Name + Serial Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3 space-y-1.5">
                      <SearchableProductDropdown
                        products={products}
                        selectedProductName={item.productName}
                        onProductSelect={(productName, product) => {
                          handleProductSelect(index, productName, product);
                          setActiveRowIndex(index);
                        }}
                        onProductAdded={(newProduct) => {
                          // Update local products list
                          setProducts(prev => [...prev, newProduct]);
                        }}
                        placeholder="Search or type product name..."
                        label="Product Name"
                        required
                        companyId={companyId}
                        className="w-full"
                      />
                    </div>
                    {hasSerial && (
                      <div className="space-y-1.5 flex flex-col justify-end">
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setPurchaseSerialModalIndex(index)} 
                          className={`h-9 ${
                            (item.serialNumbers || []).filter(Boolean).length === quantity && quantity > 0
                              ? 'border-green-500 bg-green-50 hover:bg-green-100'
                              : 'border-blue-500 bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          S# ({(item.serialNumbers || []).filter(Boolean).length}/{quantity})
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Second Row: HSN, Qty, Unit, Price, GST, Amount */}
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-3">
                    {/* HSN */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">HSN</Label>
                      <Input className="h-9 w-full" {...register(`items.${index}.hsn`)} placeholder="HSN" />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Qty</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        className={`h-9 w-full ${
                          hasSerial && quantity > 0 && 
                          (item.serialNumbers || []).filter(Boolean).length !== quantity 
                            ? 'border-blue-500 ring-1 ring-blue-200' 
                            : ''
                        }`}
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 0;
                          if (newQuantity > 0) {
                            handleQuantityChange(index, newQuantity);
                          }
                        }}
                      />
                    </div>

                    {/* Unit */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <Controller
                        control={control}
                        name={`items.${index}.unit` as const}
                        defaultValue={item?.unit ?? 'Nos'}
                        render={({ field }) => (
                          <>
                            <Input
                              list={`unit-options-${index}`}
                              {...field}
                              className="h-9 w-full"
                              placeholder="Unit"
                            />
                            <datalist id={`unit-options-${index}`}>
                              <option value="Nos" />
                              <option value="Pcs" />
                              <option value="Kgs" />
                              <option value="Gms" />
                              <option value="Ltrs" />
                              <option value="Mtrs" />
                              <option value="Hrs" />
                              <option value="Days" />
                              <option value="Box" />
                              <option value="Set" />
                            </datalist>
                          </>
                        )}
                      />
                    </div>

                    {/* Price */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="h-9 w-full"
                        {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                      />
                    </div>

                    {/* GST */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">GST %</Label>
                      <Select
                        value={item.gstRate !== undefined ? String(item.gstRate) : "18"}
                        onValueChange={(val) => setValue(`items.${index}.gstRate`, Number(val))}
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GST_RATES.map(r => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 sm:col-span-3 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <div className="h-9 flex items-center justify-end px-3 rounded-md border bg-muted/50 text-sm font-medium w-full">
                        {(() => {
                          const qty = Number(item?.quantity) || 0;
                          const price = Number(item?.unitPrice) || 0;
                          const gst = Number(item?.gstRate) || 0;
                          const cess = Number(item?.cessRate) || 0;
                          const base = qty * price;
                          const tax = base * (gst / 100);
                          const cessAmount = base * (cess / 100);
                          const amt = base + tax + cessAmount;
                          return formatCurrency(amt);
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Serial Number Toggle & Section - Only show if this row is active */}
                {activeRowIndex === index && (
                <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex items-center gap-2 min-w-fit">
                        <Label className="text-xs font-medium">Has Serial No?</Label>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <input 
                                    type="radio" 
                                    checked={hasSerial} 
                                    onChange={() => setValue(`items.${index}.hasSerialNumber`, true)}
                                    className="w-3.5 h-3.5 accent-primary"
                                /> Yes
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                                <input 
                                    type="radio" 
                                    checked={!hasSerial} 
                                    onChange={() => setValue(`items.${index}.hasSerialNumber`, false)}
                                    className="w-3.5 h-3.5 accent-primary"
                                /> No
                            </label>
                        </div>
                    </div>

                    {hasSerial && (
                        <div className="flex-1 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
                            <Label className="text-xs text-blue-900 mb-2 block font-medium">
                                Enter Serial Numbers ({quantity})
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {Array.from({ length: quantity }).map((_, sIdx) => (
                                    <Input
                                        key={sIdx}
                                        placeholder={`Serial #${sIdx + 1}`}
                                  className="h-8 text-sm bg-white w-full"
                                        value={item.serialNumbers?.[sIdx] || ''}
                                        onChange={(e) => {
                                            const newSerials = [...(item.serialNumbers || [])];
                                            newSerials[sIdx] = e.target.value;
                                            setValue(`items.${index}.serialNumbers`, newSerials);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                )}
              </div>
            );
          })}
          
          {fields.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No items added yet</p>
              <Button type="button" variant="link" onClick={() => append({ 
                productName: '', quantity: 1, unit: 'Nos', unitPrice: 0, gstRate: 18, cessRate: 0, amount: 0, hasSerialNumber: false, serialNumbers: []
              })}>
                Add your first item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 left-0 right-0 p-4 bg-background border-t sm:static sm:bg-transparent sm:border-0 sm:p-0 z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 max-w-4xl mx-auto">
            <div className="flex justify-between w-full sm:w-auto sm:block text-right">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(Number(totalAmount) || 0)}</p>
            </div>
            <div className="grid grid-cols-2 sm:flex w-full sm:w-auto gap-3">
              <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">Cancel</Button>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Bill
              </Button>
            </div>
        </div>
      </div>


    </form>
  );
}
