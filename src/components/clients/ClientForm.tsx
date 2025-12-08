/**
 * Client Form Component
 * Form for creating/editing client details
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientFormSchema } from '@/lib/validations';
import { Client } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [sameBillingAddress, setSameBillingAddress] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema) as any,
    defaultValues: client ? {
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
      billingAddress: undefined, // Don't initialize billing address
    } as any,
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
    console.log('Same billing address:', sameBillingAddress);
    
    setIsLoading(true);
    try {
      // If billing address is same as shipping, copy it; otherwise make it undefined
      if (sameBillingAddress) {
        data.billingAddress = data.address;
      } else {
        // Only include billing address if user unchecked the box
        // If still same, remove it to avoid validation
        if (!data.billingAddress || Object.keys(data.billingAddress).length === 0) {
          data.billingAddress = undefined;
        }
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
      
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Enter the client's basic details</CardDescription>
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

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Client contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact.phone">Phone *</Label>
            <Input
              id="contact.phone"
              {...register('contact.phone')}
              placeholder="+91 98765 43210"
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

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
          <CardDescription>Where should we ship the goods/invoice?</CardDescription>
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

      {/* Bank Details (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details (Optional)</CardTitle>
          <CardDescription>Client's bank account information for payments</CardDescription>
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

      {/* Billing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Address</CardTitle>
          <CardDescription>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sameBillingAddress"
                checked={sameBillingAddress}
                onChange={(e) => setSameBillingAddress(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="sameBillingAddress" className="text-sm cursor-pointer">
                Same as shipping address
              </label>
            </div>
          </CardDescription>
        </CardHeader>
        {!sameBillingAddress && (
          <CardContent className="space-y-4">
            {/* Billing Street */}
            <div className="space-y-2">
              <Label htmlFor="billingAddress.street">Street Address *</Label>
              <Textarea
                id="billingAddress.street"
                {...register('billingAddress.street')}
                placeholder="Building, Street, Area"
                rows={2}
              />
              {errors.billingAddress?.street && (
                <p className="text-sm text-red-500">{errors.billingAddress.street.message}</p>
              )}
            </div>

            {/* Billing City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingAddress.city">City *</Label>
                <Input
                  id="billingAddress.city"
                  {...register('billingAddress.city')}
                  placeholder="City"
                />
                {errors.billingAddress?.city && (
                  <p className="text-sm text-red-500">{errors.billingAddress.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingAddress.state">State *</Label>
                <Select
                  value={watch('billingAddress.state') || ''}
                  onValueChange={(value) => setValue('billingAddress.state', value)}
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
                {errors.billingAddress?.state && (
                  <p className="text-sm text-red-500">{errors.billingAddress.state.message}</p>
                )}
              </div>
            </div>

            {/* Billing Pincode */}
            <div className="space-y-2">
              <Label htmlFor="billingAddress.pincode">Pincode *</Label>
              <Input
                id="billingAddress.pincode"
                {...register('billingAddress.pincode')}
                placeholder="400001"
                maxLength={6}
              />
              {errors.billingAddress?.pincode && (
                <p className="text-sm text-red-500">{errors.billingAddress.pincode.message}</p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {client ? 'Update Client' : 'Create Client'}
        </Button>
      </div>
    </form>
  );
}

export default ClientForm;
