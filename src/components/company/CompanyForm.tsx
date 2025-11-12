/**
 * Company Form Component
 * Form for creating/editing company details
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema } from '@/lib/validations';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES } from '@/lib/constants';
import { fetchGSTINDetails } from '@/lib/api/gst-api';
import Image from 'next/image';
import { z } from 'zod';

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel?: () => void;
}

export function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGSTIN, setIsFetchingGSTIN] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(company?.logoUrl || '');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema) as any,
    defaultValues: company ? {
      name: company.name,
      gstin: company.gstin,
      pan: company.pan,
      website: company.website,
      logoUrl: company.logoUrl,
      address: company.address,
      contact: company.contact,
      bankDetails: company.bankDetails,
    } : {
      address: {
        country: 'India',
      },
    } as any,
  });

  const gstin = watch('gstin');

  // Auto-fetch GSTIN details
  const handleFetchGSTIN = async () => {
    if (!gstin || gstin.length !== 15) {
      toast.error('Please enter a valid 15-character GSTIN');
      return;
    }

    setIsFetchingGSTIN(true);
    try {
      const details = await fetchGSTINDetails(gstin);
      if (details) {
        setValue('name', details.legalName);
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

  const handleFormSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      toast.success(company ? 'Company updated successfully' : 'Company created successfully');
    } catch (error) {
      toast.error('Failed to save company');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter your company's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Logo URL */}
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Company Logo (Google Drive Link)</Label>
            <Input
              id="logoUrl"
              {...register('logoUrl')}
              placeholder="https://drive.google.com/uc?id=YOUR_FILE_ID"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              Upload your logo to Google Drive, make it publicly accessible, and paste the direct link here.
              <br />
              Example: https://drive.google.com/uc?id=YOUR_FILE_ID
            </p>
            {watch('logoUrl') && (
              <div className="mt-2 rounded-lg border p-2">
                <p className="mb-2 text-xs font-medium">Logo Preview:</p>
                <div className="relative h-24 w-24 rounded-lg border bg-white">
                  <Image
                    src={watch('logoUrl') || ''}
                    alt="Company logo preview"
                    fill
                    className="rounded-lg object-contain p-2"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="14">Invalid URL</text></svg>';
                    }}
                  />
                </div>
              </div>
            )}
            {errors.logoUrl && (
              <p className="text-sm text-red-500">{errors.logoUrl.message}</p>
            )}
          </div>

          {/* GSTIN */}
          <div className="space-y-2">
            <Label htmlFor="gstin">GSTIN (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="gstin"
                {...register('gstin')}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
                className="uppercase"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchGSTIN}
                disabled={isFetchingGSTIN}
              >
                {isFetchingGSTIN ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  'Auto-fill'
                )}
              </Button>
            </div>
            {errors.gstin && (
              <p className="text-sm text-red-500">{errors.gstin.message}</p>
            )}
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Legal Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="ABC Private Limited"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* PAN */}
          <div className="space-y-2">
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              {...register('pan')}
              placeholder="AAAAA0000A"
              maxLength={10}
              className="uppercase"
            />
            {errors.pan && (
              <p className="text-sm text-red-500">{errors.pan.message}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://example.com"
              type="url"
            />
            {errors.website && (
              <p className="text-sm text-red-500">{errors.website.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Company's registered address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address.street">Street Address *</Label>
            <Input
              id="address.street"
              {...register('address.street')}
              placeholder="123, Main Street, Building Name"
            />
            {errors.address?.street && (
              <p className="text-sm text-red-500">{errors.address.street.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address.city">City *</Label>
              <Input
                id="address.city"
                {...register('address.city')}
                placeholder="Mumbai"
              />
              {errors.address?.city && (
                <p className="text-sm text-red-500">{errors.address.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.state">State *</Label>
              <select
                id="address.state"
                {...register('address.state')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.address?.state && (
                <p className="text-sm text-red-500">{errors.address.state.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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

            <div className="space-y-2">
              <Label htmlFor="address.country">Country *</Label>
              <Input
                id="address.country"
                {...register('address.country')}
                defaultValue="India"
                readOnly
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>How to reach your company</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact.phone">Phone *</Label>
            <Input
              id="contact.phone"
              {...register('contact.phone')}
              placeholder="+91 98765 43210"
              type="tel"
            />
            {errors.contact?.phone && (
              <p className="text-sm text-red-500">{errors.contact.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact.email">Email *</Label>
            <Input
              id="contact.email"
              {...register('contact.email')}
              placeholder="contact@company.com"
              type="email"
            />
            {errors.contact?.email && (
              <p className="text-sm text-red-500">{errors.contact.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
          <CardDescription>For payment collection (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bankDetails.bankName">Bank Name</Label>
            <Input
              id="bankDetails.bankName"
              {...register('bankDetails.bankName')}
              placeholder="HDFC Bank"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankDetails.accountNumber">Account Number</Label>
            <Input
              id="bankDetails.accountNumber"
              {...register('bankDetails.accountNumber')}
              placeholder="1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankDetails.ifscCode">IFSC Code</Label>
            <Input
              id="bankDetails.ifscCode"
              {...register('bankDetails.ifscCode')}
              placeholder="HDFC0001234"
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankDetails.accountHolderName">Account Holder Name</Label>
            <Input
              id="bankDetails.accountHolderName"
              {...register('bankDetails.accountHolderName')}
              placeholder="ABC Private Limited"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankDetails.branch">Branch</Label>
            <Input
              id="bankDetails.branch"
              {...register('bankDetails.branch')}
              placeholder="Andheri East"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankDetails.upiId">UPI ID</Label>
            <Input
              id="bankDetails.upiId"
              {...register('bankDetails.upiId')}
              placeholder="company@upi"
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>{company ? 'Update Company' : 'Create Company'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
