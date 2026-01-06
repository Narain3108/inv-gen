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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const tabsOrder = ['basic', 'contact', 'address', 'bank'] as const;
  type TabKey = typeof tabsOrder[number];
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  const goToNext = async () => {
    // Validate fields relevant to the current tab before moving
    const fieldsForTab: Record<TabKey, string[]> = {
      basic: ['clientName', 'gstin', 'pan'],
      contact: ['contact.phone', 'contact.email', 'contact.website'],
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
            {errors.address?.street && <li>Street: {errors.address.street.message}</li>}
            {errors.address?.city && <li>City: {errors.address.city.message}</li>}
            {errors.address?.state && <li>State: {errors.address.state.message}</li>}
            {errors.address?.pincode && <li>Pincode: {errors.address.pincode.message}</li>}
            {errors.contact?.phone && <li>Phone: {errors.contact.phone.message}</li>}
            {errors.contact?.email && <li>Email: {errors.contact.email.message}</li>}
            {errors.contact?.website && <li>Website: {errors.contact.website.message}</li>}
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
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GSTIN (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="gstin"
                {...register('gstin')}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchGSTIN}
                disabled={isFetchingGSTIN || !gstin}
              >
                {isFetchingGSTIN ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty for unregistered clients or B2C customers
            </p>
            {errors.gstin && (
              <p className="text-sm text-red-500">{errors.gstin.message}</p>
            )}
          </div>

          {/* Client Name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              {...register('clientName')}
              placeholder="Enter client name"
              autoComplete="off"
            />
            {errors.clientName && (
              <p className="text-sm text-red-500">{errors.clientName.message}</p>
            )}
          </div>

          {/* PAN (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="pan">PAN (Optional)</Label>
            <Input
              id="pan"
              {...register('pan')}
              placeholder="AAAAA0000A"
              maxLength={10}
            />
            {errors.pan && (
              <p className="text-sm text-red-500">{errors.pan.message}</p>
            )}
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact.phone">Phone *</Label>
            <Input
              id="contact.phone"
              {...register('contact.phone')}
              placeholder="+91 98765 43210"
              autoComplete="off"
            />
            {errors.contact?.phone && (
              <p className="text-sm text-red-500">{errors.contact.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="contact.email">Email *</Label>
            <Input
              id="contact.email"
              type="email"
              {...register('contact.email')}
              placeholder="client@example.com"
              autoComplete="off"
            />
            {errors.contact?.email && (
              <p className="text-sm text-red-500">{errors.contact.email.message}</p>
            )}
          </div>

          {/* Website (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="contact.website">Website (Optional)</Label>
            <Input
              id="contact.website"
              {...register('contact.website')}
              placeholder="https://example.com"
            />
            {errors.contact?.website && (
              <p className="text-sm text-red-500">{errors.contact.website.message}</p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="address.street">Street Address *</Label>
            <Textarea
              id="address.street"
              {...register('address.street')}
              placeholder="Building, Street, Area"
              rows={2}
            />
            {errors.address?.street && (
              <p className="text-sm text-red-500">{errors.address.street.message}</p>
            )}
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.city">City *</Label>
              <Input
                id="address.city"
                {...register('address.city')}
                placeholder="City"
              />
              {errors.address?.city && (
                <p className="text-sm text-red-500">{errors.address.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.state">State *</Label>
              <Select
                value={watch('address.state') || ''}
                onValueChange={(value) => setValue('address.state', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state.code} value={state.value}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.address?.state && (
                <p className="text-sm text-red-500">{errors.address.state.message}</p>
              )}
            </div>
          </div>

          {/* Pincode */}
          <div className="space-y-2">
            <Label htmlFor="address.pincode">Pincode *</Label>
            <Input
              id="address.pincode"
              {...register('address.pincode')}
              placeholder="400001"
              maxLength={6}
            />
            {errors.address?.pincode && (
              <p className="text-sm text-red-500">{errors.address.pincode.message}</p>
            )}
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="bankDetails.bankName">Bank Name</Label>
            <Input
              id="bankDetails.bankName"
              {...register('bankDetails.bankName')}
              placeholder="State Bank of India"
            />
            {errors.bankDetails?.bankName && (
              <p className="text-sm text-red-500">{errors.bankDetails.bankName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="bankDetails.accountNumber">Account Number</Label>
              <Input
                id="bankDetails.accountNumber"
                {...register('bankDetails.accountNumber')}
                placeholder="1234567890"
              />
              {errors.bankDetails?.accountNumber && (
                <p className="text-sm text-red-500">{errors.bankDetails.accountNumber.message}</p>
              )}
            </div>

            {/* IFSC Code */}
            <div className="space-y-2">
              <Label htmlFor="bankDetails.ifscCode">IFSC Code</Label>
              <Input
                id="bankDetails.ifscCode"
                {...register('bankDetails.ifscCode')}
                placeholder="SBIN0001234"
                maxLength={11}
              />
              {errors.bankDetails?.ifscCode && (
                <p className="text-sm text-red-500">{errors.bankDetails.ifscCode.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Account Holder Name */}
            <div className="space-y-2">
              <Label htmlFor="bankDetails.accountHolderName">Account Holder Name</Label>
              <Input
                id="bankDetails.accountHolderName"
                {...register('bankDetails.accountHolderName')}
                placeholder="Account holder name"
              />
              {errors.bankDetails?.accountHolderName && (
                <p className="text-sm text-red-500">{errors.bankDetails.accountHolderName.message}</p>
              )}
            </div>

            {/* UPI ID */}
            <div className="space-y-2">
              <Label htmlFor="bankDetails.upiId">UPI ID</Label>
              <Input
                id="bankDetails.upiId"
                {...register('bankDetails.upiId')}
                placeholder="client@upi"
              />
              {errors.bankDetails?.upiId && (
                <p className="text-sm text-red-500">{errors.bankDetails.upiId.message}</p>
              )}
            </div>
          </div>
        </CardContent>
          </Card>
        </TabsContent>

        
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
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
    </form>
  );
}

export default ClientForm;
