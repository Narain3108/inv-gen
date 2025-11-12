/**
 * Invoice Form Component
 * Comprehensive form for creating/editing invoices
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema } from '@/lib/validations';
import { Invoice, Product, Client, InvoiceItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { calculateInvoiceTotals } from '@/lib/utils/tax-calculator';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { PAYMENT_MODES } from '@/lib/constants';
import { z } from 'zod';

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface InvoiceFormProps {
  invoice?: Invoice;
  companyId: string;
  products: Product[];
  clients: Client[];
  companyState: string;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  onCancel?: () => void;
}

export function InvoiceForm({
  invoice,
  companyId,
  products,
  clients,
  companyState,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
      clientId: invoice.clientId,
      date: invoice.date?.toDate ? new Date(invoice.date.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: invoice.items.map((item) => ({
        productId: item.productId || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
      notes: invoice.notes,
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

      return {
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
    }).filter(Boolean) as InvoiceItem[];

    const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
    const grandTotal = totalTaxableAmount + totalTax;

    return {
      items: processedItems,
      taxableAmount: totalTaxableAmount,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      totalAmount: grandTotal,
      totalAmountInWords: '', // This will be generated on the server
    };
  };

  const totals = calculateTotals();

  const handleFormSubmit = async (data: InvoiceFormData) => {
    if (!totals || totals.items.length === 0) {
      toast.error('Please add valid items to the invoice');
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        invoiceNumber: data.invoiceNumber,
        clientId: data.clientId,
        date: data.date,
        notes: data.notes,
        terms: data.terms,
        companyId,
        ...totals,
      };

      await onSubmit(invoiceData as any);
      toast.success(invoice ? 'Invoice updated successfully' : 'Invoice created successfully');
    } catch (error) {
      toast.error('Failed to save invoice');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Basic invoice information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Invoice Number */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                {...register('invoiceNumber')}
                placeholder="INV-0001"
              />
              {errors.invoiceNumber && (
                <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
              )}
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={watch('clientId') || ''}
                onValueChange={(value) => setValue('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.clientName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500">{errors.clientId.message}</p>
              )}
            </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          <CardDescription>Add products/services to the invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-sm text-muted-foreground">
                  <th className="p-2 text-left">Product/Service</th>
                  <th className="p-2 text-center w-24">Qty</th>
                  <th className="p-2 text-right w-32">Price</th>
                  <th className="p-2 text-center w-24">Disc %</th>
                  <th className="p-2 text-right w-32">Amount</th>
                  <th className="p-2 w-12"></th>
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
                    <tr key={field.id} className="border-b">
                      <td className="p-2">
                        <Select
                          value={item?.productId || ''}
                          onValueChange={(value) => handleProductSelect(index, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.productName} ({product.hsn})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="1"
                          min="1"
                          value={item?.quantity || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setValue(`items.${index}.quantity`, val, { shouldValidate: true, shouldDirty: true });
                          }}
                          className="text-center"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(unitPrice)}
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
                          className="text-center"
                        />
                      </td>
                      <td className="p-2 text-right font-medium">
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
                  );
                })}
              </tbody>
            </table>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
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

      {/* Payment & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes or instructions"
              rows={2}
            />
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              {...register('terms')}
              placeholder="Payment terms, delivery terms, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading || !totals}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}

export default InvoiceForm;
