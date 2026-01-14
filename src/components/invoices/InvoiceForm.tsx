/**
 * Invoice Form Component
 * Comprehensive form for creating/editing invoices
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema } from '@/lib/validations';
import { FieldValidators } from '@/lib/modules/form-handling';
import { Invoice, Product, Client, Company, InvoiceItem, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Calculator, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { calculateInvoiceTotals, calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { formatCurrency, formatDate, formatClientDropdownLabel } from '@/utils/formatters';
import { SearchableClientDropdown } from '@/components/shared';
import { PAYMENT_MODES } from '@/lib/constants';
import { generateInvoiceNumber } from '@/lib/utils/numbering-utils';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients.api';
import { productsApi } from '@/lib/api/products.api';
import { invoicesApi } from '@/lib/api/invoices.api';
import SerialManager from '@/components/shared/SerialManager';
import { OutOfStockDialog } from '@/components/shared/OutOfStockDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { TotalsSummary } from '@/components/forms/shared';

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  companyId: string;
  company?: Company;
  products: Product[];
  clients: Client[];
  companyState: string;
  invoiceCount?: number;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel?: () => void;
  onClientAdded?: (client: Client) => void;
  prefillData?: Partial<InvoiceFormData>;
}

export function InvoiceForm({
  invoice,
  companyId,
  company,
  products,
  clients,
  companyState,
  invoiceCount = 0,
  onSubmit,
  onCancel,
  onClientAdded,
  prefillData,
}: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [serialNumbers, setSerialNumbers] = useState<Record<string, string[]>>({});
  const [serialNumberErrors, setSerialNumberErrors] = useState<Record<string, string>>({});
  const [originalItems, setOriginalItems] = useState<Record<string, { productId: string; quantity: number }>>({});
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);

  // Modal index to open serial manager for a row
  const [serialModalIndex, setSerialModalIndex] = useState<number | null>(null);

  // Out of Stock Dialog State
  const [outOfStockDialogOpen, setOutOfStockDialogOpen] = useState(false);
  const [outOfStockData, setOutOfStockData] = useState<{
    product: Product;
    requestedQuantity: number;
    availableStock: number;
    itemIndex: number;
  } | null>(null);

  // Sync localProducts with props.products
  // We use localProducts to allow optimistic updates and refreshing of product data (e.g. serial numbers)
  // without waiting for the parent to re-fetch everything.
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // (moved) If editing an existing invoice, load its serial numbers into local state so the SerialManager
  // shows the already-saved serials for each item when editing.
  // This effect was moved below to run after `fields` is declared by useFieldArray.

  // Shipping Address State (opt-in)
  const [shippingAddressMode, setShippingAddressMode] = useState<'none' | 'default' | 'select' | 'new'>('none');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<string>('default');
  const [newShippingAddress, setNewShippingAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: invoice ? {
      invoiceNumber: invoice.invoiceNumber,
      referenceNumber: invoice.referenceNumber || '',
      poNumber: invoice.poNumber || '',
      poDate: (() => {
        if (!invoice.poDate) return '';
        if (typeof invoice.poDate === 'string') return invoice.poDate.split('T')[0];
        const dateObj = invoice.poDate instanceof Date ? invoice.poDate : new Date(invoice.poDate);
        return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
      })(),
      ewayNumber: invoice.ewayNumber || '',
      clientId: invoice.clientId,
      date: (() => {
        if (!invoice.date) return new Date().toISOString().split('T')[0];
        if (typeof invoice.date === 'string') return invoice.date.split('T')[0];
        const dateObj = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
        return isNaN(dateObj.getTime()) ? new Date().toISOString().split('T')[0] : dateObj.toISOString().split('T')[0];
      })(),
      items: invoice.items.map((item) => ({
        productId: item.productId || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
    } : {
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: '' }],
      ...prefillData,
    } as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // If editing an existing invoice, load its serial numbers into local state so the SerialManager
  // shows the already-saved serials for each item when editing.
  // Use stable `fields` ids as keys so reorder/add/remove doesn't break mappings.
  useEffect(() => {
    if (!invoice || !fields || fields.length === 0) return;

    const serialMap: Record<string, string[]> = {};
    const origItems: Record<string, { productId: string; quantity: number }> = {};

    // Map invoice items to current field ids by index
    fields.forEach((field, idx) => {
      const invItem = (invoice.items || [])[idx];
      if (!invItem) return;
      const product = localProducts.find((p) => p.id === invItem.productId);
      if (product?.hasSerialNumber === true && Array.isArray(invItem.serialNumbers) && invItem.serialNumbers.length > 0) {
        serialMap[field.id] = [...invItem.serialNumbers];
      }
      origItems[field.id] = {
        productId: invItem.productId || '',
        quantity: Number(invItem.quantity || 0)
      };
    });

    if (Object.keys(serialMap).length > 0) setSerialNumbers((prev) => ({ ...prev, ...serialMap }));
    setOriginalItems((prev) => ({ ...prev, ...origItems }));
  }, [invoice, localProducts, fields]);

  const watchItems = watch('items');
  const watchClientId = watch('clientId');

  const generateInvoiceNumberPreview = () => {
    if (!company?.invoiceNumbering) {
      return 'INV0001';
    }

    const { prefix, suffix, order, nextNumber } = company.invoiceNumbering;
    const components: Record<string, string> = {
      prefix: prefix || '',
      number: String(nextNumber).padStart(3, '0'),
      suffix: suffix || '',
    };

    const orderParts = order.split(',').map(p => p.trim());
    const numberParts = orderParts.map(part => components[part] || '');

    const result = numberParts.join('');

    if (!result || result.trim() === '') {
      return `INV${String(nextNumber).padStart(4, '0')}`;
    }

    return result;
  };

  // Auto-fill invoice number for new invoices
  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!invoice && companyId) {
        try {
          console.log('Fetching next invoice number from backend...');
          const { invoice_number } = await invoicesApi.generateNumber(companyId);
          console.log('Fetched invoice number:', invoice_number);
          setValue('invoiceNumber', invoice_number);
        } catch (error) {
          console.error('Failed to fetch invoice number:', error);
          // Fallback to local if backend fails
          if (company) {
            const autoNumber = generateInvoiceNumber(company, invoiceCount);
            setValue('invoiceNumber', autoNumber);
          }
        }
      }
    };

    fetchNextNumber();
  }, [invoice, companyId, company, invoiceCount, setValue]);

  // Update selected client when client ID changes
  useEffect(() => {
    if (watchClientId) {
      const client = clients.find(c => c.id === watchClientId);
      setSelectedClient(client || null);
      // Reset shipping address selection
      setShippingAddressMode('none');
      setSelectedAddressIndex('default');
      setNewShippingAddress({
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
      });
    } else {
      setSelectedClient(null);
    }
  }, [watchClientId, clients]);

  // Handle product selection for an item
  const handleProductSelect = async (index: number, productId: string) => {
    const product = localProducts.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.unitPrice`, product.price);
      setValue(`items.${index}.unit`, product.unit);

      // Fetch fresh product data to ensure serial numbers list is up to date (no auto-fill)
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

  /**
   * Handle quantity change with stock validation and serial number management
   * Immediate validation - triggers as soon as quantity is entered
   */
  const handleQuantityChange = (index: number, quantity: number) => {
    const item = watchItems?.[index];
    const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;

    if (!product || quantity <= 0 || isNaN(quantity)) {
      return;
    }

    // If editing an existing invoice, perform delta-based validation
    const isEdit = !!invoice;
    const fieldId = fields?.[index]?.id;

    if (isEdit && product.type === 'product') {
      // Logic: available_for_edit = s_db + q_old (if product matches)
      const origItem = fieldId ? originalItems[fieldId] : null;
      const q_old = (origItem && origItem.productId === product.id) ? origItem.quantity : 0;
      const s_db = product.stock !== undefined ? product.stock : 0;
      const available_for_edit = s_db + q_old;

      if (quantity > available_for_edit) {
        setError(`items.${index}.quantity` as any, {
          type: 'manual',
          message: `Insufficient stock for ${product.productName || 'product'}. Max available: ${available_for_edit} (Stock: ${s_db} + Original: ${q_old})`,
        });
        toast.error(`Insufficient stock for ${product.productName || 'product'}. Max available: ${available_for_edit}`);
        return;
      } else {
        clearErrors(`items.${index}.quantity` as any);
      }
    } else if (!isEdit && product.type === 'product') {
      // Non-edit (create) behavior: check absolute stock against requested quantity
      if (product.stock !== undefined && quantity > product.stock) {
        setOutOfStockData({
          product,
          requestedQuantity: quantity,
          availableStock: product.stock,
          itemIndex: index,
        });
        setOutOfStockDialogOpen(true);
        return; // Don't proceed to serial manager if out of stock
      }
    }

    // Update quantity in form
    setValue(`items.${index}.quantity`, quantity);

    // If product has serial numbers, open serial manager if quantity increased
    if (product.hasSerialNumber) {
      const currentSerials = fieldId ? (serialNumbers[fieldId] || []) : [];
      if (quantity > currentSerials.length) {
        setSerialModalIndex(index);
      }
    }
  };

  /**
   * Handle out of stock proceed anyway
   * User can proceed with insufficient stock, then manage serials if needed
   */
  const handleOutOfStockProceed = () => {
    if (outOfStockData) {
      // After user proceeds with out-of-stock quantity, check if serial numbers are needed
      if (outOfStockData.product.hasSerialNumber) {
        setSerialModalIndex(outOfStockData.itemIndex);
      }
      // Close the dialog and reset state
      setOutOfStockDialogOpen(false);
      setOutOfStockData(null);
    }
  };

  const closeSerialModal = () => setSerialModalIndex(null);

  // No automatic serial auto-fill; user must manage serials via the modal.


  // Calculate totals
  const calculateTotals = () => {
    if (!watchItems || !selectedClient) return null;

    // Build list of valid items, preserving original indices so serial numbers map correctly
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

    const isInterState = companyState !== selectedClient.address.state;

    const processedItems: InvoiceItem[] = validItems.map(({ item, index }) => {
      const product = localProducts.find(p => p.id === item.productId);
      if (!product) return null;

      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;

      const baseAmount = quantity * unitPrice;
      const discountAmount = (baseAmount * discount) / 100;
      const taxableAmount = baseAmount - discountAmount;

      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let cess = 0;

      if (isInterState) {
        igst = (taxableAmount * product.gstRate) / 100;
      } else {
        const halfRate = product.gstRate / 2;
        cgst = (taxableAmount * halfRate) / 100;
        sgst = (taxableAmount * halfRate) / 100;
      }

      if (product.cessRate) {
        cess = (taxableAmount * product.cessRate) / 100;
      }

      const lineTotal = taxableAmount + cgst + sgst + igst + cess;

      subtotal += baseAmount; // Subtotal is pre-discount
      totalTaxableAmount += taxableAmount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCess += cess;

      const invoiceItem: any = {
        productId: product.id,
        description: product.productName,
        productDescription: product.description || '',
        hsn: product.hsn,
        quantity,
        unit: item.unit || product.unit,
        unitPrice,
        discount,
        gstRate: product.gstRate,
        cessRate: product.cessRate || 0,
        taxableAmount,
        cgst,
        sgst,
        igst,
        cess,
        lineTotal,
      };

      // Only add itemCode if product has one
      if (product.itemCode) {
        invoiceItem.itemCode = product.itemCode;
      }

      // ONLY include serial numbers if product has hasSerialNumber === true
      if (product.hasSerialNumber === true) {
        const key = fields?.[index]?.id;
        if (key && serialNumbers[key]) {
          invoiceItem.serialNumbers = serialNumbers[key];
        }
      }

      return invoiceItem;
    }).filter(Boolean) as InvoiceItem[];

    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const grandTotal = totalTaxableAmount + totalTax;

    // Calculate tax breakdown by GST rate
    const taxBreakdown = calculateTaxBreakdown(
      validItems.map(({ item }) => ({
        amount: Number(item.unitPrice) || 0,
        quantity: Number(item.quantity) || 0,
        gstRate: localProducts.find(p => p.id === item.productId)?.gstRate || 0,
        discount: Number(item.discount) || 0,
      })),
      companyState,
      selectedClient.address.state
    );

    return {
      items: processedItems,
      taxableAmount: totalTaxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalAmount: grandTotal,
      totalAmountInWords: '', // This will be generated on the server
      taxBreakdown, // Add GST breakdown by rate
    };
  };

  const totals = calculateTotals();

  const handleFormSubmit = async (data: InvoiceFormData) => {
    if (!totals || totals.items.length === 0) {
      toast.error('Please add valid items to the invoice');
      return;
    }

    // Validate stock availability for products
    let hasStockError = false;
    watchItems.forEach((item: any) => {
      const product = localProducts.find(p => p.id === item.productId);
      if (product && product.type === 'product' && typeof product.stock === 'number') {
        const quantity = Number(item.quantity) || 0;
        if (quantity > product.stock) {
          toast.error(`Insufficient stock for ${product.productName}. Available: ${product.stock}, Required: ${quantity}`);
          hasStockError = true;
        }
      }
    });

    if (hasStockError) {
      return;
    }

    // Validate serial numbers for products that require them
    let hasSerialNumberError = false;
    const newErrors: Record<string, string> = {};

    watchItems.forEach((item: any, index: number) => {
      const product = localProducts.find((p) => p.id === item.productId);
      // ONLY validate serials for products with hasSerialNumber explicitly set to true
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

    // Determine Shipping Address - only include when opted-in
    let finalShippingAddress: Address | undefined = undefined;

    if (shippingAddressMode === 'default') {
      finalShippingAddress = selectedClient?.shippingAddress || selectedClient?.address;
    } else if (shippingAddressMode === 'select' && selectedClient?.shippingAddresses) {
      const index = parseInt(selectedAddressIndex);
      if (!isNaN(index) && selectedClient.shippingAddresses[index]) {
        finalShippingAddress = selectedClient.shippingAddresses[index];
      }
    } else if (shippingAddressMode === 'new') {
      // Validate new address
      if (!newShippingAddress.street || !newShippingAddress.city || !newShippingAddress.state || !newShippingAddress.pincode) {
        toast.error('Please fill in all shipping address fields');
        return;
      }
      finalShippingAddress = newShippingAddress;

      // Update client with new address
      if (selectedClient) {
        try {
          const updatedAddresses = [...(selectedClient.shippingAddresses || []), newShippingAddress];
          // We don't await this to block invoice creation, but we should probably await it to ensure data consistency
          // Or we can fire and forget, but let's await to be safe
          await clientsApi.update(selectedClient.id, { shippingAddresses: updatedAddresses });
        } catch (err) {
          console.error('Failed to update client shipping addresses', err);
          toast.warning('Failed to save new shipping address to client profile');
        }
      }
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        referenceNumber: data.referenceNumber,
        poNumber: data.poNumber,
        poDate: data.poDate,
        ewayNumber: data.ewayNumber,
        clientId: data.clientId,
        date: data.date,
        companyId,
        shippingAddress: shippingAddressMode === 'none' ? null : finalShippingAddress,
        items: totals.items,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        totalAmount: totals.totalAmount,
        totalAmountInWords: totals.totalAmountInWords,
        taxBreakdown: totals.taxBreakdown,
        status: 'draft',
        paymentStatus: 'unpaid',
      };

      await onSubmit(invoiceData as any);
      toast.success(invoice ? 'Invoice updated successfully' : 'Invoice created successfully');
    } catch (error: any) {
      console.error('Error saving invoice:', error);

      // Handle 409 Conflict for serial number unavailability
      if (error.response?.status === 409) {
        const detail = error.response?.data?.detail || '';
        if (detail.includes('Serial numbers no longer available')) {
          toast.error(
            `Some serial numbers are no longer available and may have been used in another invoice. Please refresh the product serial list and try again.`,
            { duration: 6000 }
          );
        } else {
          toast.error(detail || 'Conflict occurred while saving invoice');
        }
      } else {
        const errorMessage = error.response?.data?.detail
          ? (Array.isArray(error.response.data.detail)
            ? error.response.data.detail.map((e: any) => e.msg).join(', ')
            : error.response.data.detail)
          : 'Failed to save invoice';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 animate-fade-in">
      {/* Invoice Details */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          <div className="space-y-4">
            {/* Row 1: Client, Invoice Number, Invoice Date */}
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
                  label="Client"
                  required
                  error={errors.clientId?.message}
                  companyId={companyId}
                  placeholder="Search or select client..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  {...register('invoiceNumber')}
                  placeholder={generateInvoiceNumberPreview()}
                />
                <p className="text-xs text-muted-foreground">
                  Auto-filled, editable
                </p>
                {errors.invoiceNumber && (
                  <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date *</Label>
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
                <p className="text-xs text-muted-foreground">
                  Purchase Order Number (if any)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="poDate">PO Date</Label>
                <Input
                  id="poDate"
                  type="date"
                  {...register('poDate')}
                />
                <p className="text-xs text-muted-foreground">
                  Purchase Order Date (if any)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ewayNumber">E-way Number</Label>
                <Input
                  id="ewayNumber"
                  {...register('ewayNumber')}
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  E-way bill number (if any)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  {...register('referenceNumber')}
                  placeholder="Optional"
                />
                <p className="text-xs text-muted-foreground">
                  Optional reference
                </p>
              </div>
            </div>

            {/* Row 3: Shipping Address (opt-in) */}
            {selectedClient && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Include Shipping Address
                  </Label>
                  <Switch
                    checked={shippingAddressMode !== 'none'}
                    onCheckedChange={(v: boolean) => setShippingAddressMode(v ? 'default' : 'none')}
                    aria-label="Include Shipping Address"
                  />
                </div>

                {shippingAddressMode !== 'none' && (
                  <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Shipping Address</Label>
                      <Select
                        value={shippingAddressMode}
                        onValueChange={(val: any) => setShippingAddressMode(val)}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default Address</SelectItem>
                          {selectedClient.shippingAddresses && selectedClient.shippingAddresses.length > 0 && (
                            <SelectItem value="select">Select Saved Address</SelectItem>
                          )}
                          <SelectItem value="new">Add New Address</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {shippingAddressMode === 'default' && (
                      <div className="text-sm text-muted-foreground p-2 bg-background rounded border">
                        {selectedClient.shippingAddress ? (
                          <>
                            <p>{selectedClient.shippingAddress.street}</p>
                            <p>{selectedClient.shippingAddress.city}, {selectedClient.shippingAddress.state} - {selectedClient.shippingAddress.pincode}</p>
                            <p>{selectedClient.shippingAddress.country}</p>
                          </>
                        ) : (
                          <p className="italic">Using billing address as shipping address</p>
                        )}
                      </div>
                    )}

                    {shippingAddressMode === 'select' && selectedClient.shippingAddresses && (
                      <Select
                        value={selectedAddressIndex}
                        onValueChange={setSelectedAddressIndex}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedClient.shippingAddresses.map((addr, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              {addr.street}, {addr.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {shippingAddressMode === 'new' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder="Street"
                          value={newShippingAddress.street}
                          onChange={(e) => setNewShippingAddress({ ...newShippingAddress, street: e.target.value })}
                          className="col-span-2"
                        />
                        <Input
                          placeholder="City"
                          value={newShippingAddress.city}
                          onChange={(e) => setNewShippingAddress({ ...newShippingAddress, city: e.target.value })}
                        />
                        <Input
                          placeholder="State"
                          value={newShippingAddress.state}
                          onChange={(e) => setNewShippingAddress({ ...newShippingAddress, state: e.target.value })}
                        />
                        <Input
                          placeholder="Pincode"
                          value={newShippingAddress.pincode}
                          onChange={(e) => setNewShippingAddress({ ...newShippingAddress, pincode: e.target.value })}
                        />
                        <Input
                          placeholder="Country"
                          value={newShippingAddress.country}
                          onChange={(e) => setNewShippingAddress({ ...newShippingAddress, country: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Invoice Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          {/* Desktop View - Hidden on Mobile */}
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
                              {localProducts.map((product) => {
                                const isOutOfStock = product.type === 'product' && typeof product.stock === 'number' && product.stock === 0;
                                return (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                    disabled={isOutOfStock}
                                  >
                                    {product.productName} ({product.hsn}){isOutOfStock ? ' - Out of Stock' : ''}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          {/* Manage Serials Button - Only for products with serial numbers */}
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
                          {product?.itemCode ? (
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                              {product.itemCode}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 w-16">
                          <Controller
                            control={control}
                            name={`items.${index}.quantity` as const}
                            defaultValue={item?.quantity ?? ''}
                            render={({ field }) => (
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                max={product?.type === 'product' && typeof product.stock === 'number' ? product.stock : undefined}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const newQuantity = e.target.value === '' ? '' : parseInt(e.target.value);
                                  field.onChange(newQuantity);
                                  // Call handleQuantityChange immediately for any valid number
                                  if (newQuantity && !isNaN(newQuantity) && newQuantity > 0) {
                                    handleQuantityChange(index, newQuantity);
                                  }
                                }}
                                className={`text-center w-full text-base font-medium ${product?.type === 'product' &&
                                  typeof product.stock === 'number' &&
                                  field.value &&
                                  !isNaN(field.value as number) &&
                                  (field.value as number) > product.stock
                                  ? 'border-red-500'
                                  : ''
                                  }`}
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 w-28">
                          <Controller
                            control={control}
                            name={`items.${index}.unit` as const}
                            defaultValue={item?.unit ?? product?.unit ?? 'Nos'}
                            render={({ field }) => (
                              <Input
                                list={`unit-options-${index}`}
                                {...field}
                                value={field.value ?? ''}
                                className="text-center w-full text-sm"
                                placeholder="Unit"
                              />
                            )}
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
                        </td>
                        <td className="p-2 w-28">
                          <Controller
                            control={control}
                            name={`items.${index}.unitPrice` as const}
                            defaultValue={item?.unitPrice ?? ''}
                            render={({ field }) => (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="text-right w-full text-base font-medium"
                                placeholder="0.00"
                              />
                            )}
                          />
                        </td>
                        <td className="p-2 w-20">
                          <Controller
                            control={control}
                            name={`items.${index}.discount` as const}
                            defaultValue={item?.discount ?? 0}
                            render={({ field }) => (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                {...field}
                                value={field.value ?? ''}
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
                      {/* Serial input moved to modal — no inline inputs here */}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Card Layout */}
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
                    {/* Delete Button - Top Right */}
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

                    {/* Product Selection */}
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
                          {localProducts.map((product) => {
                            const isOutOfStock = product.type === 'product' && typeof product.stock === 'number' && product.stock === 0;
                            return (
                              <SelectItem
                                key={product.id}
                                value={product.id}
                                disabled={isOutOfStock}
                              >
                                {product.productName} ({product.hsn}){isOutOfStock ? ' - Out of Stock' : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {/* Manage Serials Button - Only for products with serial numbers */}
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

                    {/* Quantity and Unit Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font medium">Quantity</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.quantity` as const}
                          defaultValue={item?.quantity ?? ''}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="1"
                              min="1"
                              max={product?.type === 'product' && typeof product.stock === 'number' ? product.stock : undefined}
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? '' : parseInt(e.target.value);
                                field.onChange(value);
                                if (value && !isNaN(value as number) && (value as number) > 0) {
                                  handleQuantityChange(index, value as number);
                                }
                              }}
                              className={`text-center text-lg font-semibold ${product?.type === 'product' &&
                                typeof product.stock === 'number' &&
                                field.value &&
                                !isNaN(field.value as number) &&
                                (field.value as number) > product.stock
                                ? 'border-red-500'
                                : ''
                                }`}
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font medium">Unit Price</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.unitPrice` as const}
                          defaultValue={item?.unitPrice ?? ''}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                              className="text-right text-lg font-semibold"
                              placeholder="0.00"
                            />
                          )}
                        />
                      </div>
                    </div>

                    {/* Discount and Amount Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Discount %</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.discount` as const}
                          defaultValue={item?.discount ?? 0}
                          render={({ field }) => (
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                              className="text-center text-lg font-semibold"
                            />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount</Label>
                        <div className="h-10 flex items-center justify-center border rounded-md bg-primary/5 px-3">
                          <span className="font-bold text-lg text-primary">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Serial management via modal only — inline inputs removed */}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              append({ productId: '' } as any);
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
        <TotalsSummary
          taxableAmount={totals.taxableAmount}
          cgst={totals.cgst}
          sgst={totals.sgst}
          igst={totals.igst}
          totalAmount={totals.totalAmount}
          taxBreakdown={totals.taxBreakdown}
          isInterState={companyState !== selectedClient?.address?.state}
        />
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
        fetchFromDb={true}
        claimFromDb={true}
        onSave={async (selected) => {
          if (serialModalIndex === null) return;
          const key = fields?.[serialModalIndex]?.id;
          if (!key) return;
          setSerialNumbers((prev) => ({ ...prev, [key]: selected }));
          const productId = watchItems?.[serialModalIndex]?.productId;
          if (productId) {
            try {
              const fresh = await productsApi.getById(productId);
              setLocalProducts((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
            } catch (err) {
              console.error('Failed to refresh product after claiming serials', err);
            }
          }
        }}
      />

      {/* Out of Stock Dialog */}
      {outOfStockData && (
        <OutOfStockDialog
          isOpen={outOfStockDialogOpen}
          onClose={() => {
            setOutOfStockDialogOpen(false);
            setOutOfStockData(null);
          }}
          product={{
            ...outOfStockData.product,
            name: outOfStockData.product.productName,
          }}
          availableStock={outOfStockData.availableStock}
          requestedQuantity={outOfStockData.requestedQuantity}
          onProceedAnyway={handleOutOfStockProceed}
          isInvoice={true}
        />
      )}

      <div className="flex justify-end gap-3 pt-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="hover:scale-105 transition-transform">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !totals} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="font-semibold">{invoice ? 'Update Invoice' : 'Create Invoice'}</span>
        </Button>
      </div>
    </form>
  );
}

export default InvoiceForm;
