/**
 * Client Form Component
 * Form for creating/editing client details
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema } from '@/lib/validations';
import { FieldValidators } from '@/lib/modules/form-handling';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES } from '@/lib/constants';
import { fetchGSTINDetails } from '@/lib/api/gst-api';
import { z } from 'zod';

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: Client;
  companyId?: string; // Optional as clients are global
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel?: () => void;
}

export function ClientForm({ client, companyId, onSubmit, onCancel }: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGSTIN, setIsFetchingGSTIN] = useState(false);
  const [hasGST, setHasGST] = useState(!!client?.gstin); // Initialize based on existing GSTIN

  // Form default values
  const defaultValues = client ? {
    clientName: client.clientName,
    gstin: client.gstin || '',
    pan: client.pan || '',
    address: client.address,
    contact: {
      ...client.contact,
      website: client.contact.website || '',
    },
    billingAddress: client.billingAddress || undefined,
  } : {
    gstin: '',
    pan: '',
    address: {
      country: 'India',
    },
    contact: {
      website: '',
    },
    billingAddress: undefined,
  } as any;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues,
  });

  const gstin = watch('gstin');

  // Auto-fetch GSTIN details
  const handleFetchGSTIN = async () => {
    const gst = (gstin ?? '').toString().trim().toUpperCase();
    if (!gst || gst.length !== 15) {
      toast.error('Please enter a valid 15-character GSTIN');
      return;
    }

    // normalize back to the form
    setValue('gstin', gst);

    setIsFetchingGSTIN(true);
    try {
      const details = await fetchGSTINDetails(gst);
      if (details) {
        setValue('clientName', details.legalName);
        setValue('address.state', details.stateName);
        setValue('address.pincode', details.pincode);
        toast.success('GSTIN details fetched successfully');
      } else {
        toast.error('Failed to fetch GSTIN details');
      }
    } catch (error) {
      toast.error('Error fetching GSTIN details');
    } finally {
      setIsFetchingGSTIN(false);
    }
  };

  const handleFormSubmit = async (data: ClientFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Form errors:', errors);

    setIsLoading(true);
    try {
      // Company address acts as the billing address. Always copy primary address
      data.billingAddress = data.address;

      // Ensure backend gets an empty shippingAddresses array for new clients
      if (!client) {
        // @ts-ignore - shippingAddresses may not be defined in the form type
        data.shippingAddresses = [];
      }

      await onSubmit(data);
      toast.success(client ? 'Client updated successfully' : 'Client created successfully');
    } catch (error) {
      toast.error('Failed to save client');
      console.error('Submit error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabsOrder = ['basic', 'address', 'bank'] as const;
  type TabKey = typeof tabsOrder[number];
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const goToNext = async (event?: React.MouseEvent<HTMLButtonElement>) => {
    // Explicitly prevent any form submission behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Validate fields relevant to the current tab before moving
    const fieldsForTab: Record<TabKey, string[]> = {
      basic: ['clientName', 'gstin', 'pan', 'contact.phone', 'contact.email'],
      address: ['address.street', 'address.city', 'address.state', 'address.pincode'],
      bank: ['bankDetails.bankName', 'bankDetails.accountNumber', 'bankDetails.ifscCode'],
    };

    const toValidate = fieldsForTab[activeTab] || [];
    const valid = await trigger(toValidate as any);
    if (!valid) {
      toast.error('Please fix errors on this tab before proceeding');
      return;
    }

    const idx = tabsOrder.indexOf(activeTab);
    if (idx >= 0 && idx < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[idx + 1]);
    }
  };

  const goBack = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const idx = tabsOrder.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabsOrder[idx - 1]);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Debug: Show all validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4">
          <p className="font-semibold text-red-800">Please fix the following errors:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
            {errors.clientName && <li>Client Name: {errors.clientName.message}</li>}
            {errors.gstin && <li>GSTIN: {errors.gstin.message}</li>}
            {errors.pan && <li>PAN: {errors.pan.message}</li>}
            {errors.contact?.phone && <li>Phone: {errors.contact.phone.message}</li>}
            {errors.contact?.email && <li>Email: {errors.contact.email.message}</li>}
            {errors.address?.street && <li>Street: {errors.address.street.message}</li>}
            {errors.address?.city && <li>City: {errors.address.city.message}</li>}
            {errors.address?.state && <li>State: {errors.address.state.message}</li>}
            {errors.address?.pincode && <li>Pincode: {errors.address.pincode.message}</li>}
            {errors.billingAddress?.street && <li>Billing Street: {errors.billingAddress.street.message}</li>}
            {errors.billingAddress?.city && <li>Billing City: {errors.billingAddress.city.message}</li>}
            {errors.billingAddress?.state && <li>Billing State: {errors.billingAddress.state.message}</li>}
            {errors.billingAddress?.pincode && <li>Billing Pincode: {errors.billingAddress.pincode.message}</li>}
            {errors.billingAddress?.street && <li>Billing Street: {errors.billingAddress.street.message}</li>}
            {errors.billingAddress?.city && <li>Billing City: {errors.billingAddress.city.message}</li>}
            {errors.billingAddress?.state && <li>Billing State: {errors.billingAddress.state.message}</li>}
            {errors.billingAddress?.pincode && <li>Billing Pincode: {errors.billingAddress.pincode.message}</li>}
          </ul>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* GST Registration Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasGST"
                  checked={hasGST}
                  onChange={(e) => {
                    setHasGST(e.target.checked);
                    if (!e.target.checked) {
                      setValue('gstin', ''); // Clear GSTIN when unchecking
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="hasGST" className="font-normal cursor-pointer">
                  GST registered
                </Label>
              </div>

              {/* GSTIN Input - Only shown when hasGST is true */}
              {hasGST && (
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <FloatingLabelInput
                      id="gstin"
                      label="GSTIN *"
                      {...register('gstin')}
                      maxLength={15}
                      autoComplete="off"
                      error={errors.gstin?.message}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Click the search icon to auto-fill details from GSTIN
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFetchGSTIN}
                    disabled={isFetchingGSTIN || !gstin}
                    className="mt-1"
                  >
                    {isFetchingGSTIN ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}

              {/* Client Name */}
              <FloatingLabelInput
                id="clientName"
                label="Client Name *"
                {...register('clientName')}
                autoComplete="off"
                error={errors.clientName?.message}
              />

              {/* PAN (Optional) */}
              <FloatingLabelInput
                id="pan"
                label="PAN (Optional)"
                {...register('pan')}
                maxLength={10}
                error={errors.pan?.message}
              />

              {/* Phone */}
              <FloatingLabelInput
                id="contact.phone"
                label="Phone *"
                {...register('contact.phone')}
                autoComplete="off"
                error={errors.contact?.phone?.message}
              />

              {/* Email */}
              <FloatingLabelInput
                id="contact.email"
                type="email"
                label="Email *"
                {...register('contact.email')}
                autoComplete="off"
                error={errors.contact?.email?.message}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Street */}
              <FloatingLabelTextarea
                id="address.street"
                label="Street Address *"
                {...register('address.street')}
                rows={2}
                error={errors.address?.street?.message}
              />

              {/* City and State */}
              <div className="grid grid-cols-2 gap-4">
                <FloatingLabelInput
                  id="address.city"
                  label="City *"
                  {...register('address.city')}
                  error={errors.address?.city?.message}
                />

                <FloatingLabelSelect
                  id="address.state"
                  label="State *"
                  value={watch('address.state') || ''}
                  onValueChange={(value: string) => setValue('address.state', value)}
                  error={errors.address?.state?.message}
                >
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.value}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </FloatingLabelSelect>
              </div>

              {/* Pincode */}
              <FloatingLabelInput
                id="address.pincode"
                label="Pincode *"
                {...register('address.pincode')}
                maxLength={6}
                error={errors.address?.pincode?.message}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Name */}
              <FloatingLabelInput
                id="bankDetails.bankName"
                label="Bank Name"
                {...register('bankDetails.bankName')}
                error={errors.bankDetails?.bankName?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Account Number */}
                <FloatingLabelInput
                  id="bankDetails.accountNumber"
                  label="Account Number"
                  {...register('bankDetails.accountNumber')}
                  error={errors.bankDetails?.accountNumber?.message}
                />

                {/* IFSC Code */}
                <FloatingLabelInput
                  id="bankDetails.ifscCode"
                  label="IFSC Code"
                  {...register('bankDetails.ifscCode')}
                  maxLength={11}
                  error={errors.bankDetails?.ifscCode?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Account Holder Name */}
                <FloatingLabelInput
                  id="bankDetails.accountHolderName"
                  label="Account Holder Name"
                  {...register('bankDetails.accountHolderName')}
                  error={errors.bankDetails?.accountHolderName?.message}
                />

                {/* UPI ID */}
                <FloatingLabelInput
                  id="bankDetails.upiId"
                  label="UPI ID"
                  {...register('bankDetails.upiId')}
                  error={errors.bankDetails?.upiId?.message}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-between">
        <div>
          {activeTab !== 'basic' && (
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {activeTab !== 'bank' ? (
            <Button type="button" onClick={goToNext} className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary">
              Next
            </Button>
          ) : (
            <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {client ? 'Update Client' : 'Create Client'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

export default ClientForm;
