/**
 * Invoice Form Component
 * Comprehensive form for creating/editing invoices
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema } from '@/lib/validations';
import { Invoice, Product, Client, Company, InvoiceItem, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Calculator, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { calculateInvoiceTotals, calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { formatCurrency, formatDate, formatClientDropdownLabel } from '@/utils/formatters';
import { PAYMENT_MODES } from '@/lib/constants';
import { generateInvoiceNumber } from '@/lib/utils/numbering-utils';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients.api';

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
}: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [serialNumbers, setSerialNumbers] = useState<Record<number, string[]>>({});
  const [serialNumberErrors, setSerialNumberErrors] = useState<Record<number, string>>({});
  
  // Shipping Address State
  const [shippingAddressMode, setShippingAddressMode] = useState<'default' | 'select' | 'new'>('default');
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
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: invoice ? {
      invoiceNumber: invoice.invoiceNumber,
      referenceNumber: invoice.referenceNumber || '',
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
      items: [{ productId: '', quantity: 1, unitPrice: 0, discount: 0 }],
    } as any,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

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
    if (!invoice && company) {
      console.log('Auto-filling invoice number, company config:', company.invoiceNumbering);
      console.log('Current invoice count:', invoiceCount);
      const autoNumber = generateInvoiceNumber(company, invoiceCount);
      console.log('Generated invoice number:', autoNumber);
      setValue('invoiceNumber', autoNumber);
    }
  }, [invoice, company, invoiceCount, setValue]);

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
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.unitPrice`, product.price);
      // The rest of the fields are not in the form, they will be calculated
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!watchItems || !selectedClient) return null;

    const validItems = watchItems.filter((item: any) => item.productId && item.quantity > 0 && item.unitPrice >= 0);
    if (validItems.length === 0) return null;

    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let totalTaxableAmount = 0;

    const isInterState = companyState !== selectedClient.address.state;

    const processedItems: InvoiceItem[] = validItems.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
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
        invoiceItem.itemCode = product.itemCode;
      }

      // Only add serialNumbers if product has serial numbers
      if (product.hasSerialNumber && serialNumbers[validItems.indexOf(item)]) {
        invoiceItem.serialNumbers = serialNumbers[validItems.indexOf(item)];
      }

      return invoiceItem;
    }).filter(Boolean) as InvoiceItem[];

    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const grandTotal = totalTaxableAmount + totalTax;

    // Calculate tax breakdown by GST rate
    const taxBreakdown = calculateTaxBreakdown(
      validItems.map(item => ({
        amount: Number(item.unitPrice) || 0,
        quantity: Number(item.quantity) || 0,
        gstRate: products.find(p => p.id === item.productId)?.gstRate || 0,
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
      const product = products.find(p => p.id === item.productId);
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
    const newErrors: Record<number, string> = {};
    
    watchItems.forEach((item: any, index: number) => {
      const product = products.find(p => p.id === item.productId);
      if (product?.hasSerialNumber) {
        const itemSerialNumbers = serialNumbers[index] || [];
        const quantity = Number(item.quantity) || 0;
        
        if (itemSerialNumbers.length !== quantity) {
          newErrors[index] = `Please enter ${quantity} serial number(s) for ${product.productName}`;
          hasSerialNumberError = true;
        } else if (itemSerialNumbers.some(sn => !sn || sn.trim() === '')) {
          newErrors[index] = `Serial numbers cannot be empty`;
          hasSerialNumberError = true;
        }
      }
    });
    
    setSerialNumberErrors(newErrors);
    
    if (hasSerialNumberError) {
      toast.error('Please fill in all required serial numbers');
      return;
    }

    // Determine Shipping Address
    let finalShippingAddress = selectedClient?.shippingAddress;

    if (shippingAddressMode === 'select' && selectedClient?.shippingAddresses) {
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
        clientId: data.clientId,
        date: data.date,
        companyId,
        shippingAddress: finalShippingAddress,
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
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg).join(', ') 
            : error.response.data.detail)
        : 'Failed to save invoice';
      toast.error(errorMessage);
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
          <div className="grid grid-cols-2 gap-3">
            {/* Invoice Number */}
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

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                {...register('referenceNumber')}
                placeholder="Optional (e.g. PO Number)"
              />
              <p className="text-xs text-muted-foreground">
                Optional reference
              </p>
            </div>

            {/* Client Selection */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={watch('clientId') || ''}
                onValueChange={(value) => setValue('clientId', value)}
              >
                <SelectTrigger className="min-w-[260px] sm:min-w-[320px] md:min-w-[360px]">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="w-[320px] sm:w-[380px]">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="text-sm">
                      <span className="block max-w-[300px] truncate">
                        {formatClientDropdownLabel(client, { maxLength: 64 })}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500">{errors.clientId.message}</p>
              )}
            </div>

            {/* Shipping Address Selection */}
            {selectedClient && (
              <div className="col-span-2 space-y-3 border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </Label>
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
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Invoice Date */}
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
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-sm text-muted-foreground">
                  <th className="p-2 text-left">Product/Service</th>
                  <th className="p-2 text-center w-24">Item Code</th>
                  <th className="p-2 text-center w-32">Quantity</th>
                  <th className="p-2 text-right w-36">Unit Price</th>
                  <th className="p-2 text-center w-32">Discount %</th>
                  <th className="p-2 text-right w-36">Amount</th>
                  <th className="p-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const item = watchItems?.[index];
                  const product = item?.productId ? products.find(p => p.id === item.productId) : null;
                  const quantity = Number(item?.quantity) || 0;
                  const unitPrice = Number(item?.unitPrice) || 0;
                  const discount = Number(item?.discount) || 0;
                  const amount = quantity * unitPrice * (1 - discount / 100);

                  return (
                    <React.Fragment key={field.id}>
                    <tr className="border-b">
                      <td className="p-2">
                        <Select
                          value={item?.productId || ''}
                          onValueChange={(value) => handleProductSelect(index, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => {
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
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          max={product?.type === 'product' && typeof product.stock === 'number' ? product.stock : undefined}
                          value={item?.quantity || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxQty = product?.type === 'product' && typeof product.stock === 'number' ? product.stock : Infinity;
                            if (val > maxQty) {
                              toast.error(`Only ${maxQty} units available in stock`);
                              return;
                            }
                            setValue(`items.${index}.quantity`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-center w-full text-base font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item?.unitPrice || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setValue(`items.${index}.unitPrice`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-right w-full text-base font-medium"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item?.discount || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setValue(`items.${index}.discount`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-center w-full text-base font-medium"
                        />
                      </td>
                      <td className="p-2 text-right font-medium text-base">
                        {formatCurrency(amount)}
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
                    {/* Serial Numbers Row (if product requires serial numbers) */}
                    {product?.hasSerialNumber && (
                      <tr>
                        <td colSpan={9} className="p-3 bg-blue-50 border-t-2 border-blue-200">
                          <div className="space-y-3">
                            <Label className="text-sm font-semibold text-blue-900">
                              Serial Numbers for {product.productName} ({quantity} required)
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {Array.from({ length: quantity }, (_, i) => {
                                const currentSerialNumbers = serialNumbers[index] || [];
                                return (
                                  <div key={i} className="space-y-1">
                                    <Label className="text-xs text-blue-800">Serial #{i + 1}</Label>
                                    <Input
                                      type="text"
                                      placeholder={`SN${String(i + 1).padStart(3, '0')}`}
                                      value={currentSerialNumbers[i] || ''}
                                      onChange={(e) => {
                                        const newSerialNumbers = [...(serialNumbers[index] || Array(quantity).fill(''))];
                                        newSerialNumbers[i] = e.target.value;
                                        setSerialNumbers(prev => ({ ...prev, [index]: newSerialNumbers }));
                                        setSerialNumberErrors(prev => {
                                          const newErrors = { ...prev };
                                          delete newErrors[index];
                                          return newErrors;
                                        });
                                      }}
                                      className="text-sm"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            {serialNumberErrors[index] && (
                              <p className="text-sm text-red-600 font-medium">{serialNumberErrors[index]}</p>
                            )}
                            <p className="text-xs text-blue-700">
                              Filled: {(serialNumbers[index] || []).filter(sn => sn && sn.trim()).length} / {quantity}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
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
              const product = item?.productId ? products.find(p => p.id === item.productId) : null;
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
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => {
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
                    </div>

                    {/* Quantity and Unit Price Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quantity</Label>
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          max={product?.type === 'product' && typeof product.stock === 'number' ? product.stock : undefined}
                          value={item?.quantity || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            const maxQty = product?.type === 'product' && typeof product.stock === 'number' ? product.stock : Infinity;
                            if (val > maxQty) {
                              toast.error(`Only ${maxQty} units available in stock`);
                              return;
                            }
                            setValue(`items.${index}.quantity`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-center text-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Unit Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item?.unitPrice || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setValue(`items.${index}.unitPrice`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-right text-lg font-semibold"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Discount and Amount Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Discount %</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item?.discount || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setValue(`items.${index}.discount`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-center text-lg font-semibold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount</Label>
                        <div className="h-10 flex items-center justify-center border rounded-md bg-primary/5 px-3">
                          <span className="font-bold text-lg text-primary">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Serial Numbers Section (if product requires serial numbers) */}
                    {product?.hasSerialNumber && (
                      <div className="space-y-3 pt-3 border-t-2 border-blue-200 bg-blue-50 -mx-6 px-6 pb-4 mt-4">
                        <Label className="text-sm font-semibold text-blue-900">
                          Serial Numbers for {product.productName} ({quantity} required)
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                          {Array.from({ length: quantity }, (_, i) => {
                            const currentSerialNumbers = serialNumbers[index] || [];
                            return (
                              <div key={i} className="space-y-1">
                                <Label className="text-xs text-blue-800">Serial Number #{i + 1}</Label>
                                <Input
                                  type="text"
                                  placeholder={`Enter serial number ${i + 1}`}
                                  value={currentSerialNumbers[i] || ''}
                                  onChange={(e) => {
                                    const newSerialNumbers = [...(serialNumbers[index] || Array(quantity).fill(''))];
                                    newSerialNumbers[i] = e.target.value;
                                    setSerialNumbers(prev => ({ ...prev, [index]: newSerialNumbers }));
                                    setSerialNumberErrors(prev => {
                                      const newErrors = { ...prev };
                                      delete newErrors[index];
                                      return newErrors;
                                    });
                                  }}
                                  className="text-base"
                                />
                              </div>
                            );
                          })}
                        </div>
                        {serialNumberErrors[index] && (
                          <p className="text-sm text-red-600 font-medium">{serialNumberErrors[index]}</p>
                        )}
                        <p className="text-xs text-blue-700 font-medium">
                          Filled: {(serialNumbers[index] || []).filter(sn => sn && sn.trim()).length} / {quantity}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ productId: '', quantity: 1, unitPrice: 0, discount: 0 } as any)}
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
