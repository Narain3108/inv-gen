/**
 * Quotation Form Component
 * Comprehensive form for creating/editing quotations (estimates)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quotationFormSchema } from '@/lib/validations';
import { Quotation, Product, Client, InvoiceItem, Company, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Calculator, FileText, MapPin, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatClientDropdownLabel } from '@/utils/formatters';
import { SearchableClientDropdown, SearchableProductDropdown } from '@/components/shared';
import SerialManager from '@/components/shared/SerialManager';
import { calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { generateQuotationNumber } from '@/lib/utils/numbering-utils';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients.api';

type QuotationFormData = z.infer<typeof quotationFormSchema>;

interface QuotationFormProps {
  quotation?: Quotation;
  companyId: string;
  company?: Company;
  products: Product[];
  clients: Client[];
  companyState: string;
  quotationCount?: number;
  onSubmit: (data: QuotationFormData) => Promise<void>;
  onCancel?: () => void;
  onClientAdded?: (client: Client) => void;
  onProductAdded?: (product: Product) => void;
}

export function QuotationForm({
  quotation,
  companyId,
  company,
  products,
  clients,
  companyState,
  quotationCount = 0,
  onSubmit,
  onCancel,
  onClientAdded,
  onProductAdded,
}: QuotationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  
  // Serial number management state
  const [serialModalIndex, setSerialModalIndex] = useState<number | null>(null);
  const [itemSerialNumbers, setItemSerialNumbers] = useState<Record<number, string[]>>({});

  // Sync localProducts with props.products
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Initialize serial numbers for existing quotation
  useEffect(() => {
    if (quotation?.items) {
      const serialMap: Record<number, string[]> = {};
      quotation.items.forEach((item, index) => {
        if (item.serialNumbers && item.serialNumbers.length > 0) {
          serialMap[index] = item.serialNumbers;
        }
      });
      setItemSerialNumbers(serialMap);
    }
  }, [quotation]);

  // Shipping Address State
  // default behavior changed: do NOT include shipping address unless user opts in
  const [shippingAddressMode, setShippingAddressMode] = useState<'none' | 'default' | 'select' | 'new'>('none');
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<string>('default');
  const [newShippingAddress, setNewShippingAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  // Calculate default valid until date (30 days from today)
  const getDefaultValidUntil = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationFormSchema) as any,
    defaultValues: quotation ? {
      quotationNumber: quotation.quotationNumber,
      clientId: quotation.clientId,
      date: quotation.date ? (typeof quotation.date === 'string' ? new Date(quotation.date).toISOString().split('T')[0] : quotation.date.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      validUntil: quotation.validUntil ? (typeof quotation.validUntil === 'string' ? new Date(quotation.validUntil).toISOString().split('T')[0] : quotation.validUntil.toISOString().split('T')[0]) : getDefaultValidUntil(),
      items: quotation.items.map((item) => ({
        productId: item.productId || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
    } : {
      date: new Date().toISOString().split('T')[0],
      validUntil: getDefaultValidUntil(),
      items: [{ productId: '' }],
    } as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const watchClientId = watch('clientId');

  // Auto-fill quotation number for new quotations
  useEffect(() => {
    if (!quotation && company) {
      console.log('Auto-filling quotation number, company config:', company.quotationNumbering);
      console.log('Current quotation count:', quotationCount);
      const autoNumber = generateQuotationNumber(company, quotationCount);
      console.log('Generated quotation number:', autoNumber);
      setValue('quotationNumber', autoNumber);
    }
  }, [quotation, company, quotationCount, setValue]);

  // Update selected client when client ID changes
  useEffect(() => {
    if (watchClientId) {
      const client = clients.find(c => c.id === watchClientId);
      setSelectedClient(client || null);
      // Reset shipping address selection
      setShippingAddressMode('default');
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
  const handleProductSelect = (index: number, productId: string) => {
    const product = localProducts.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.unitPrice`, product.price);
      
      // Clear serial numbers when product changes
      setItemSerialNumbers(prev => ({
        ...prev,
        [index]: []
      }));
    }
  };

  // Handle serial number management
  const handleSerialSave = async (index: number, serialNumbers: string[]) => {
    setItemSerialNumbers(prev => ({
      ...prev,
      [index]: serialNumbers
    }));
    setSerialModalIndex(null);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!watchItems || !selectedClient) return null;

    const validItems = watchItems.filter((item: any) => item.productId && item.quantity > 0 && item.unitPrice >= 0);
    if (validItems.length === 0) return null;

    let totalTaxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;

    const isInterState = companyState !== selectedClient.address.state;

    const processedItems: InvoiceItem[] = validItems.map((item: any, validIndex: number) => {
      const product = localProducts.find(p => p.id === item.productId);
      if (!product) return null;

      // Find the original index in watchItems
      const originalIndex = watchItems.findIndex((watchItem: any, index: number) => 
        watchItem === item
      );

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

      totalTaxableAmount += taxableAmount;
      totalCgst += cgst;
      totalSgst += sgst;
      totalIgst += igst;
      totalCess += cess;

      const quotationItem: any = {
        productId: product.id,
        description: product.productName,
        productDescription: product.description || '',
        hsn: product.hsn,
        quantity,
        unit: product.unit,
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
        quotationItem.itemCode = product.itemCode;
      }

      // Add serial numbers if product requires them and they are provided
      if (product.hasSerialNumber && originalIndex !== -1 && itemSerialNumbers[originalIndex]) {
        quotationItem.serialNumbers = itemSerialNumbers[originalIndex];
      }

      return quotationItem;
    }).filter(Boolean) as InvoiceItem[];

    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const grandTotal = totalTaxableAmount + totalTax;

    // Calculate tax breakdown by GST rate
    const taxBreakdown = calculateTaxBreakdown(
      validItems.map(item => ({
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
      totalAmountInWords: '',
      taxBreakdown, // Add GST breakdown by rate
    };
  };

  const totals = calculateTotals();

  const handleFormSubmit = async (data: QuotationFormData) => {
    if (!totals || totals.items.length === 0) {
      toast.error('Please add valid items to the quotation');
      return;
    }

    // Validate serial numbers for products that require them
    for (let i = 0; i < watchItems.length; i++) {
      const item = watchItems[i];
      if (!item.productId || !item.quantity || item.quantity <= 0 || !item.unitPrice || item.unitPrice < 0) {
        continue; // Skip invalid items
      }
      
      const product = localProducts.find(p => p.id === item.productId);
      if (product?.hasSerialNumber) {
        const serialNumbers = itemSerialNumbers[i] || [];
        const quantity = Number(item.quantity) || 0;
        if (serialNumbers.length !== quantity) {
          toast.error(`Please provide exactly ${quantity} serial number(s) for ${product.productName}`);
          return;
        }
      }
    }

    // Determine Shipping Address - only include when user opts in (shippingAddressMode !== 'none')
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
          await clientsApi.update(selectedClient.id, { shippingAddresses: updatedAddresses });
        } catch (err) {
          console.error('Failed to update client shipping addresses', err);
          toast.warning('Failed to save new shipping address to client profile');
        }
      }
    }

    setIsLoading(true);
    try {
      const quotationData = {
        quotationNumber: data.quotationNumber,
        clientId: data.clientId,
        date: data.date,
        validUntil: data.validUntil,
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
      };

      await onSubmit(quotationData as any);
      toast.success(quotation ? 'Quotation updated successfully' : 'Quotation created successfully');
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg).join(', ') 
            : error.response.data.detail)
        : 'Failed to save quotation';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 animate-fade-in">
      {/* Quotation Details */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <FileText className="h-5 w-5 text-primary" />
            Quotation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Quotation Number */}
            <div className="space-y-2">
              <Label htmlFor="quotationNumber">Quotation Number</Label>
              <Input
                id="quotationNumber"
                {...register('quotationNumber')}
                placeholder="QUO0001"
              />
              <p className="text-xs text-muted-foreground">
                Auto-filled, editable
              </p>
              {errors.quotationNumber && (
                <p className="text-sm text-red-500">{errors.quotationNumber.message}</p>
              )}
            </div>

            {/* Client Selection */}
            <div>
              <SearchableClientDropdown
                clients={clients}
                selectedClientId={watch('clientId') || ''}
                onClientSelect={(clientId) => setValue('clientId', clientId)}
                onClientAdded={(newClient) => {
                  // Set the newly created client as selected
                  setValue('clientId', newClient.id);
                  // Clear any validation errors
                  clearErrors('clientId');
                  // Call parent callback to refresh clients list
                  onClientAdded?.(newClient);
                }}
                label="Client"
                required
                error={errors.clientId?.message}
                companyId={companyId}
                placeholder="Search or select client..."
              />
            </div>

            {/* Shipping Address Selection (opt-in) */}
            {selectedClient && (
              <div className="col-span-1 md:col-span-2 space-y-3 border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </Label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Include</span>
                    <Switch
                      checked={shippingAddressMode !== 'none'}
                      onCheckedChange={(v: boolean) => setShippingAddressMode(v ? 'default' : 'none')}
                      aria-label="Include Shipping Address"
                    />
                  </div>
                </div>

                {shippingAddressMode === 'none' && (
                  <div className="text-sm text-muted-foreground p-2 bg-background rounded border">
                    <p className="italic">Shipping address will not be included in this quotation.</p>
                  </div>
                )}

                {shippingAddressMode !== 'none' && (
                  <>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Mode</Label>
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
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Street" 
                          value={newShippingAddress.street}
                          onChange={(e) => setNewShippingAddress({...newShippingAddress, street: e.target.value})}
                          className="col-span-2"
                        />
                        <Input 
                          placeholder="City" 
                          value={newShippingAddress.city}
                          onChange={(e) => setNewShippingAddress({...newShippingAddress, city: e.target.value})}
                        />
                        <Input 
                          placeholder="State" 
                          value={newShippingAddress.state}
                          onChange={(e) => setNewShippingAddress({...newShippingAddress, state: e.target.value})}
                        />
                        <Input 
                          placeholder="Pincode" 
                          value={newShippingAddress.pincode}
                          onChange={(e) => setNewShippingAddress({...newShippingAddress, pincode: e.target.value})}
                        />
                        <Input 
                          placeholder="Country" 
                          value={newShippingAddress.country}
                          onChange={(e) => setNewShippingAddress({...newShippingAddress, country: e.target.value})}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Quotation Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Quotation Date *</Label>
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

          <div className="grid grid-cols-1 gap-3">
            {/* Valid Until Date */}
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid Until * <span className="text-xs text-muted-foreground">(Default: 30 days)</span></Label>
              <Input
                id="validUntil"
                type="date"
                {...register('validUntil')}
              />
              {errors.validUntil && (
                <p className="text-sm text-red-500">{errors.validUntil.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Items */}
      <Card className="border-primary/20 shadow-sm hover:shadow-md transition-shadow duration-200 hover-lift">
        <CardHeader className="pb-3 pt-4 bg-gradient-to-r from-primary/5 to-accent/5 border-b">
          <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 pt-4">
          {/* Desktop View */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-sm text-muted-foreground">
                  <th className="p-2 text-left">Product/Service</th>
                  <th className="p-2 text-center w-24">Item Code</th>
                  <th className="p-2 text-center w-32">Quantity</th>
                  <th className="p-2 text-right w-36">Unit Price</th>
                  <th className="p-2 text-center w-32">Discount %</th>
                  <th className="p-2 text-right w-36">Amount</th>
                  <th className="p-2 text-center w-32">Serial</th>
                  <th className="p-2 w-16"></th>
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
                    <tr key={field.id} className="border-b">
                      <td className="p-2">
                        <SearchableProductDropdown
                          products={localProducts}
                          selectedProductId={item?.productId || ''}
                          onProductSelect={(productId) => handleProductSelect(index, productId)}
                          onProductAdded={(newProduct) => {
                            // Add to local products list
                            setLocalProducts(prev => [...prev, newProduct]);
                            // Call parent callback to refresh products list
                            onProductAdded?.(newProduct);
                            // Auto-select the new product
                            handleProductSelect(index, newProduct.id);
                          }}
                          companyId={companyId}
                          placeholder="Search or select product..."
                          className="min-w-[200px]"
                        />
                      </td>
                      <td className="p-2 text-center">
                        {product?.itemCode ? (
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {product.itemCode}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <Controller
                          control={control}
                          name={`items.${index}.quantity` as const}
                          defaultValue={item?.quantity ?? ''}
                          render={({ field }) => (
                            <div className="space-y-1">
                              <Input
                                type="number"
                                step="1"
                                min="1"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const newQuantity = e.target.value === '' ? '' : parseInt(e.target.value);
                                  if (newQuantity === '') {
                                    field.onChange('');
                                    return;
                                  }
                                  
                                  // Check stock before setting quantity
                                  if (product && product.type === 'product' && typeof product.stock === 'number') {
                                    if (newQuantity > product.stock) {
                                      toast.error(`Insufficient stock for ${product.productName}. Available: ${product.stock}, Required: ${newQuantity}`);
                                      return; // Don't update the field
                                    }
                                  }
                                  
                                  field.onChange(newQuantity);
                                  
                                  // Clear serial numbers if quantity changes for products with serial numbers
                                  if (product?.hasSerialNumber) {
                                    setItemSerialNumbers(prev => ({
                                      ...prev,
                                      [index]: []
                                    }));
                                  }
                                }}
                                className="text-center w-full text-base font-medium"
                              />
                              {product && product.type === 'product' && typeof product.stock === 'number' && (
                                <p className="text-xs text-muted-foreground text-center">
                                  Stock: {product.stock}
                                </p>
                              )}
                            </div>
                          )}
                        />
                      </td>
                      <td className="p-2 text-right">
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
                      <td className="p-2">
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
                      <td className="p-2 text-right font-medium text-base">
                        {formatCurrency(amount)}
                      </td>
                      <td className="p-2 text-center">
                        {product?.hasSerialNumber ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSerialModalIndex(index)}
                            disabled={!product || !quantity || quantity <= 0}
                            className="text-xs px-2 py-1"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                            {itemSerialNumbers[index]?.length > 0 && (
                              <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs">
                                {itemSerialNumbers[index].length}
                              </span>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-2">
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
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="space-y-4 lg:hidden">
            {fields.map((field, index) => {
              const item = watchItems?.[index];
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
                      <SearchableProductDropdown
                        products={localProducts}
                        selectedProductId={item?.productId || ''}
                        onProductSelect={(productId) => handleProductSelect(index, productId)}
                        onProductAdded={(newProduct) => {
                          // Add to local products list
                          setLocalProducts(prev => [...prev, newProduct]);
                          // Call parent callback to refresh products list
                          onProductAdded?.(newProduct);
                          // Auto-select the new product
                          handleProductSelect(index, newProduct.id);
                        }}
                        companyId={companyId}
                        label="Product/Service"
                        placeholder="Search or select product..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quantity</Label>
                        <Controller
                          control={control}
                          name={`items.${index}.quantity` as const}
                          defaultValue={item?.quantity ?? ''}
                          render={({ field }) => {
                            const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
                            return (
                              <div className="space-y-1">
                                <Input
                                  type="number"
                                  step="1"
                                  min="1"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const newQuantity = e.target.value === '' ? '' : parseInt(e.target.value);
                                    if (newQuantity === '') {
                                      field.onChange('');
                                      return;
                                    }
                                    
                                    // Check stock before setting quantity
                                    if (product && product.type === 'product' && typeof product.stock === 'number') {
                                      if (newQuantity > product.stock) {
                                        toast.error(`Insufficient stock for ${product.productName}. Available: ${product.stock}, Required: ${newQuantity}`);
                                        return; // Don't update the field
                                      }
                                    }
                                    
                                    field.onChange(newQuantity);
                                    
                                    // Clear serial numbers if quantity changes for products with serial numbers
                                    if (product?.hasSerialNumber) {
                                      setItemSerialNumbers(prev => ({
                                        ...prev,
                                        [index]: []
                                      }));
                                    }
                                  }}
                                  className="text-center text-lg font-semibold"
                                />
                                {product && product.type === 'product' && typeof product.stock === 'number' && (
                                  <p className="text-xs text-muted-foreground text-center">
                                    Stock: {product.stock}
                                  </p>
                                )}
                              </div>
                            );
                          }}
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

                    <div className="grid grid-cols-2 gap-4">
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
                              onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ productId: '' } as any)}
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
                <span>Estimated Total:</span>
                <span>{formatCurrency(totals.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="hover:scale-105 transition-transform">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !totals} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="font-semibold">{quotation ? 'Update Quotation' : 'Create Quotation'}</span>
        </Button>
      </div>

      {/* Serial Number Management Modal */}
      {serialModalIndex !== null && (() => {
        const item = watchItems?.[serialModalIndex];
        const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
        const quantity = Number(item?.quantity) || 0;
        
        return (
          <SerialManager
            open={true}
            onClose={() => setSerialModalIndex(null)}
            productId={product?.id}
            initialSelected={itemSerialNumbers[serialModalIndex] || []}
            quantity={quantity}
            fetchFromDb={false} // Don't fetch from DB for quotations
            claimFromDb={false} // Don't claim from DB for quotations
            onSave={(serialNumbers) => handleSerialSave(serialModalIndex, serialNumbers)}
          />
        );
      })()}
    </form>
  );
}

export default QuotationForm;
