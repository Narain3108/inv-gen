/**
 * Purchase Form Component
 * Comprehensive form for creating/editing purchase bills
 * Modeled after InvoiceForm for consistency
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PurchaseBill, PurchaseItem, purchasesApi } from '@/lib/api/purchases.api';
import { Product, Client, Company, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { formatCurrency } from '@/utils/formatters';
import { SearchableClientDropdown } from '@/components/shared';
import { productsApi } from '@/lib/api/products.api';
import { clientsApi } from '@/lib/api/clients.api';
import SerialManager from '@/components/shared/SerialManager';
import { DocumentUpload } from '@/components/shared/DocumentUpload';

// Schema Definition (Inline for now to match backend)
const purchaseItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  hsn: z.string().min(1, "HSN is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
  discount: z.coerce.number().min(0).default(0),
  gstRate: z.coerce.number().min(0),
  cessRate: z.coerce.number().min(0).optional(),
  itemCode: z.string().optional(),
});

const purchaseFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Bill number is required"), // Mapped to billNumber
  referenceNumber: z.string().optional(),
  poNumber: z.string().optional(),
  poDate: z.string().optional(),
  ewayNumber: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  clientId: z.string().min(1, "Vendor is required"),
  items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  attachmentUrl: z.string().optional(),
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormProps {
  purchase?: PurchaseBill;
  companyId: string;
  company?: Company;
  products: Product[];
  clients: Client[]; // Vendors
  companyState: string;
  onSubmit: (data: any) => Promise<void>; // Using any to avoid strict type mismatch during transition
  onCancel?: () => void;
  onClientAdded?: (client: Client) => void;
}

export function PurchaseForm({
  purchase,
  companyId,
  company,
  products,
  clients,
  companyState,
  onSubmit,
  onCancel,
  onClientAdded,
}: PurchaseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [serialNumbers, setSerialNumbers] = useState<Record<string, string[]>>({});
  const [serialNumberErrors, setSerialNumberErrors] = useState<Record<string, string>>({});
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(purchase?.attachmentUrl);

  // Modal index to open serial manager for a row
  const [serialModalIndex, setSerialModalIndex] = useState<number | null>(null);

  // Sync localProducts with props.products
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema) as unknown as Resolver<PurchaseFormData>,
    defaultValues: purchase ? {
      invoiceNumber: purchase.invoiceNumber,
      referenceNumber: purchase.referenceNumber || '',
      poNumber: purchase.poNumber || '',
      poDate: purchase.poDate ? (typeof purchase.poDate === 'string' ? purchase.poDate.split('T')[0] : '') : '',
      ewayNumber: purchase.ewayNumber || '',
      clientId: purchase.clientId,
      date: purchase.date ? (typeof purchase.date === 'string' ? purchase.date.split('T')[0] : '') : new Date().toISOString().split('T')[0],
      items: purchase.items.map((item) => ({
        productId: item.productId || '',
        productName: item.productName || '',
        description: item.description || '',
        hsn: item.hsn || '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        gstRate: item.gstRate,
        cessRate: item.cessRate || 0,
        itemCode: item.itemCode || '',
      })),
      attachmentUrl: purchase.attachmentUrl,
    } : {
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: '', quantity: '', unit: 'Nos', unitPrice: 0, discount: 0, gstRate: 18 }],
    } as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Load existing serials if editing
  useEffect(() => {
    if (!purchase || !fields || fields.length === 0) return;

    const serialMap: Record<string, string[]> = {};
    fields.forEach((field, idx) => {
      const purItem = (purchase.items || [])[idx];
      if (!purItem) return;
      const product = localProducts.find((p) => p.id === purItem.productId);
      if (product?.hasSerialNumber === true && Array.isArray(purItem.serialNumbers) && purItem.serialNumbers.length > 0) {
        serialMap[field.id] = [...purItem.serialNumbers];
      }
    });

    if (Object.keys(serialMap).length > 0) setSerialNumbers((prev) => ({ ...prev, ...serialMap }));
  }, [purchase, localProducts, fields]);

  const watchItems = watch('items');
  const watchClientId = watch('clientId');

  // Update selected client when client ID changes
  useEffect(() => {
    if (watchClientId) {
      const client = clients.find(c => c.id === watchClientId);
      setSelectedClient(client || null);
    } else {
      setSelectedClient(null);
    }
  }, [watchClientId, clients]);

  // Handle product selection for an item
  const handleProductSelect = async (index: number, productId: string) => {
    const product = localProducts.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.productName`, product.productName);
      setValue(`items.${index}.description`, product.description || product.productName);
      setValue(`items.${index}.hsn`, product.hsn);
      setValue(`items.${index}.unit`, product.unit);
      setValue(`items.${index}.unitPrice`, product.price); // Default to selling price, user can change
      setValue(`items.${index}.gstRate`, product.gstRate);
      setValue(`items.${index}.cessRate`, product.cessRate || 0);
      setValue(`items.${index}.itemCode`, product.itemCode || '');
      
      // Fetch fresh product data
      try {
        const freshProduct = await productsApi.getById(productId);
        if (freshProduct) {
            setLocalProducts(prev => prev.map(p => p.id === freshProduct.id ? freshProduct : p));
        }
      } catch (error) {
        console.error("Failed to refresh product details", error);
      }
    }
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const item = watchItems?.[index];
    const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
    
    if (!product || quantity <= 0 || isNaN(quantity)) {
      return;
    }

    setValue(`items.${index}.quantity`, quantity);
    
    // If product has serial numbers, open serial manager if quantity increased
    if (product.hasSerialNumber) {
      const fieldId = fields?.[index]?.id;
      const currentSerials = fieldId ? (serialNumbers[fieldId] || []) : [];
      if (quantity > currentSerials.length) {
        setSerialModalIndex(index);
      }
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!watchItems) return null;

    const validItems = watchItems.reduce((acc: Array<{ item: any; index: number }>, item: any, idx: number) => {
      if (item.productId && item.quantity > 0 && item.unitPrice >= 0) {
        acc.push({ item, index: idx });
      }
      return acc;
    }, []);

    if (validItems.length === 0) return null;

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let totalTaxableAmount = 0;

    const clientState = selectedClient?.address?.state || '';
    const isInterState = companyState !== clientState;

    const processedItems: PurchaseItem[] = validItems.map(({ item, index }) => {
      const product = localProducts.find(p => p.id === item.productId);
      if (!product) return null;

      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      const gstRate = Number(item.gstRate) || 0;
      const cessRate = Number(item.cessRate) || 0;

      const baseAmount = quantity * unitPrice;
      const discountAmount = (baseAmount * discount) / 100;
      const taxableAmount = baseAmount - discountAmount;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let cess = 0;

      if (isInterState) {
        igst = (taxableAmount * gstRate) / 100;
      } else {
        const halfRate = gstRate / 2;
        cgst = (taxableAmount * halfRate) / 100;
        sgst = (taxableAmount * halfRate) / 100;
      }

      if (cessRate) {
        cess = (taxableAmount * cessRate) / 100;
      }

      const lineTotal = taxableAmount + cgst + sgst + igst + cess;

      subtotal += baseAmount;
      totalTaxableAmount += taxableAmount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCess += cess;

      const purchaseItem: any = {
        product_id: product.id,
        product_name: product.productName,
        description: item.description,
        hsn: item.hsn,
        quantity,
        unit: item.unit,
        unit_price: unitPrice,
        discount,
        gst_rate: gstRate,
        cess_rate: cessRate || 0,
        taxable_amount: taxableAmount,
        cgst,
        sgst,
        igst,
        cess,
        line_total: lineTotal,
        item_code: item.itemCode,
      };

      if (product.hasSerialNumber === true) {
        const key = fields?.[index]?.id;
        if (key && serialNumbers[key]) {
          purchaseItem.serial_numbers = serialNumbers[key];
        }
      }

      return purchaseItem;
    }).filter(Boolean) as PurchaseItem[];

    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const grandTotal = totalTaxableAmount + totalTax;

    const taxBreakdown = calculateTaxBreakdown(
      validItems.map(({ item }) => ({
        amount: Number(item.unitPrice) || 0,
        quantity: Number(item.quantity) || 0,
        gstRate: Number(item.gstRate) || 0,
        discount: Number(item.discount) || 0,
      })),
      companyState,
      clientState
    );

    return {
      items: processedItems,
      taxableAmount: totalTaxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalAmount: grandTotal,
      totalAmountInWords: '', 
      taxBreakdown,
    };
  };

  const totals = calculateTotals();

  const handleFormSubmit = async (data: PurchaseFormData) => {
    if (!totals || totals.items.length === 0) {
      toast.error('Please add valid items to the purchase bill');
      return;
    }

    // Validate serial numbers
    let hasSerialNumberError = false;
    const newErrors: Record<string, string> = {};

    watchItems.forEach((item: any, index: number) => {
      const product = localProducts.find((p) => p.id === item.productId);
      if (product?.hasSerialNumber === true) {
        const key = fields?.[index]?.id;
        const itemSerialNumbers = key ? (serialNumbers[key] || []) : [];
        const quantity = Number(item.quantity) || 0;

        if (itemSerialNumbers.length !== quantity) {
          if (key) newErrors[key] = `Please enter ${quantity} serial number(s) for ${product.productName || 'product'}`;
          hasSerialNumberError = true;
        } else if (itemSerialNumbers.some((sn) => !sn || sn.trim() === '')) {
          if (key) newErrors[key] = `Serial numbers cannot be empty`;
          hasSerialNumberError = true;
        }
      }
    });

    setSerialNumberErrors(newErrors);
    
    if (hasSerialNumberError) {
      toast.error('Please fill in all required serial numbers');
      return;
    }

    setIsLoading(true);
    try {
      const purchaseData = {
        bill_number: data.invoiceNumber,
        reference_number: data.referenceNumber || null,
        po_number: data.poNumber || null,
        po_date: data.poDate ? new Date(data.poDate).toISOString() : null,
        eway_number: data.ewayNumber || null,
        client_id: data.clientId,
        date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        company_id: companyId,
        items: totals.items,
        taxable_amount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total_amount: totals.totalAmount,
        total_amount_in_words: totals.totalAmountInWords,
        tax_breakdown: totals.taxBreakdown,
        status: 'draft',
        payment_status: 'unpaid',
        attachment_url: attachmentUrl,
      };

      await onSubmit(purchaseData);
      toast.success(purchase ? 'Purchase updated successfully' : 'Purchase created successfully');
    } catch (error: any) {
      console.error('Error saving purchase:', error);
      toast.error(error.response?.data?.detail || 'Failed to save purchase');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 animate-fade-in">
      {/* Purchase Details */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          <div className="space-y-4">
            {/* Row 1: Vendor, Bill Number, Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <SearchableClientDropdown
                  clients={clients}
                  selectedClientId={watch('clientId') || ''}
                  onClientSelect={(clientId) => setValue('clientId', clientId)}
                  onClientAdded={(newClient) => {
                    setValue('clientId', newClient.id);
                    clearErrors('clientId');
                    onClientAdded?.(newClient);
                  }}
                  label="Vendor"
                  required
                  error={errors.clientId?.message}
                  companyId={companyId}
                  placeholder="Search or select vendor..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Bill Number *</Label>
                <Input
                  id="invoiceNumber"
                  {...register('invoiceNumber')}
                  placeholder="Enter Bill Number"
                />
                {errors.invoiceNumber && (
                  <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Bill Date *</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
            </div>

            {/* Row 2: PO Number, PO Date, E-way Number, Reference Number */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number</Label>
                <Input
                  id="poNumber"
                  {...register('poNumber')}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="poDate">PO Date</Label>
                <Input
                  id="poDate"
                  type="date"
                  {...register('poDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ewayNumber">E-way Number</Label>
                <Input
                  id="ewayNumber"
                  {...register('ewayNumber')}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  {...register('referenceNumber')}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Bill Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          <DocumentUpload
            label="Bill Document"
            currentDocumentUrl={attachmentUrl}
            onDocumentUploaded={setAttachmentUrl}
            onDocumentRemoved={() => setAttachmentUrl(undefined)}
            className="mb-6"
          />
        </CardContent>
      </Card>

      {/* Purchase Items */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Purchase Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          {/* Desktop View */}
          <div className="hidden lg:block">
            <table className="w-full table-fixed">
              <thead className="border-b">
                <tr className="text-sm text-muted-foreground">
                  <th className="p-2 text-left w-64">Product/Service</th>
                  <th className="p-2 text-center w-24">Item Code</th>
                  <th className="p-2 text-center w-16">Qty</th>
                  <th className="p-2 text-center w-28">Unit</th>
                  <th className="p-2 text-right w-28">Unit Price</th>
                  <th className="p-2 text-center w-20">Discount %</th>
                  <th className="p-2 text-right w-32">Amount</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = watchItems?.[index];
                  const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
                  const quantity = Number(item?.quantity) || 0;
                  const unitPrice = Number(item?.unitPrice) || 0;
                  const discount = Number(item?.discount) || 0;
                  const amount = quantity * unitPrice * (1 - discount / 100);

                  return (
                    <React.Fragment key={field.id}>
                    <tr className="border-b align-middle">
                      <td className="p-2 w-64 align-top">
                        <Select
                          value={item?.productId || ''}
                          onValueChange={(value) => {
                            handleProductSelect(index, value);
                            setActiveRowIndex(index);
                          }}
                        >
                          <SelectTrigger className="w-full truncate">
                            <SelectValue placeholder="Select product" className="truncate" />
                          </SelectTrigger>
                          <SelectContent>
                            {localProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.productName} ({product.hsn})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {product?.hasSerialNumber === true && (
                          <div className="mt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setSerialModalIndex(index)}>
                              Manage Serials
                            </Button>
                            <div className="text-xs text-muted-foreground mt-1">
                              {(serialNumbers[field.id] || []).filter(Boolean).length} selected
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center w-24">
                        <span className="text-xs text-muted-foreground">{product?.itemCode || '—'}</span>
                      </td>
                      <td className="p-2 w-16">
                        <Controller
                          control={control}
                          name={`items.${index}.quantity` as const}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                field.onChange(val);
                                if (val && !isNaN(val as number) && val > 0) {
                                  handleQuantityChange(index, val as number);
                                }
                              }}
                              className="text-center w-full text-base font-medium"
                            />
                          )}
                        />
                      </td>
                      <td className="p-2 w-28">
                        <Controller
                          control={control}
                          name={`items.${index}.unit` as const}
                          render={({ field }) => (
                            <Input
                              list={`unit-options-${index}`}
                              {...field}
                              className="text-center w-full text-sm"
                            />
                          )}
                        />
                        <datalist id={`unit-options-${index}`}>
                          <option value="Nos" />
                          <option value="Pcs" />
                          <option value="Kgs" />
                        </datalist>
                      </td>
                      <td className="p-2 w-28">
                        <Controller
                          control={control}
                          name={`items.${index}.unitPrice` as const}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="text-right w-full text-base font-medium"
                            />
                          )}
                        />
                      </td>
                      <td className="p-2 w-20">
                        <Controller
                          control={control}
                          name={`items.${index}.discount` as const}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="text-center w-full text-base font-medium"
                            />
                          )}
                        />
                      </td>
                      <td className="p-2 w-32 text-right font-medium text-base">
                        {formatCurrency(amount)}
                      </td>
                      <td className="p-2 w-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 1}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="space-y-4 lg:hidden">
            {fields.map((field, index) => {
              const item = watchItems?.[index];
              const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
              const quantity = Number(item?.quantity) || 0;
              const unitPrice = Number(item?.unitPrice) || 0;
              const discount = Number(item?.discount) || 0;
              const amount = quantity * unitPrice * (1 - discount / 100);

              return (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-6 space-y-4">
                    <div className="absolute top-2 right-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Product/Service</Label>
                      <Select
                        value={item?.productId || ''}
                        onValueChange={(value) => {
                          handleProductSelect(index, value);
                          setActiveRowIndex(index);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {localProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.productName} ({product.hsn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {product?.hasSerialNumber === true && (
                        <div className="mt-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setSerialModalIndex(index)}>
                            Manage Serials
                          </Button>
                          <div className="text-xs text-muted-foreground mt-1">
                            {(serialNumbers[field.id] || []).filter(Boolean).length} selected
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font medium">Quantity</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.quantity` as const}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                field.onChange(val);
                                if (val && !isNaN(val as number) && val > 0) {
                                  handleQuantityChange(index, val as number);
                                }
                              }}
                              className="text-center text-lg font-semibold"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font medium">Unit Price</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.unitPrice` as const}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="text-right text-lg font-semibold"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              append({ productId: '', quantity: '', unit: 'Nos', unitPrice: 0, discount: 0, gstRate: 18 } as any);
              setActiveRowIndex(fields.length);
            }}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Tax Summary */}
      {totals && (
        <Card className="border-primary/30 shadow-md hover:shadow-lg transition-shadow duration-200 bg-gradient-to-br from-white to-primary/5">
          <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary to-accent border-b">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
              <div className="p-1.5 rounded-lg bg-white/20">
                <Calculator className="h-5 w-5" />
              </div>
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxable Amount:</span>
                <span className="font-medium">{formatCurrency(totals.taxableAmount)}</span>
              </div>
              {totals.cgst > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>CGST:</span>
                    <span className="font-medium">{formatCurrency(totals.cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>SGST:</span>
                    <span className="font-medium">{formatCurrency(totals.sgst)}</span>
                  </div>
                </>
              )}
              {totals.igst > 0 && (
                <div className="flex justify-between text-sm">
                  <span>IGST:</span>
                  <span className="font-medium">{formatCurrency(totals.igst)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Grand Total:</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <SerialManager
        open={serialModalIndex !== null}
        onClose={() => setSerialModalIndex(null)}
        productId={serialModalIndex !== null ? watchItems?.[serialModalIndex]?.productId : undefined}
        initialSelected={
          serialModalIndex !== null
            ? (fields?.[serialModalIndex]?.id ? (serialNumbers[fields[serialModalIndex].id] || []) : [])
            : []
        }
        quantity={serialModalIndex !== null ? Number(watchItems?.[serialModalIndex]?.quantity) || 0 : 0}
        fetchFromDb={false} // Important: We are adding new serials, not fetching existing ones
        claimFromDb={false}
        onSave={async (selected) => {
          if (serialModalIndex === null) return;
          const key = fields?.[serialModalIndex]?.id;
          if (!key) return;
          setSerialNumbers((prev) => ({ ...prev, [key]: selected }));
        }}
      />

      <div className="flex justify-end gap-3 pt-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="hover:scale-105 transition-transform">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !totals} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="font-semibold">{purchase ? 'Update Purchase' : 'Create Purchase'}</span>
        </Button>
      </div>
    </form>
  );
}

export default PurchaseForm;
