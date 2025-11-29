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
import { z } from 'zod';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { NumberingConfig } from '@/components/shared/NumberingConfig';

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
  const [signatureUrl, setSignatureUrl] = useState<string>(company?.signatureUrl || '');
  
  const [invoicePrefix, setInvoicePrefix] = useState(company?.invoiceNumbering?.prefix || '');
  const [invoiceSuffix, setInvoiceSuffix] = useState(company?.invoiceNumbering?.suffix || '');
  const [invoiceOrder, setInvoiceOrder] = useState(company?.invoiceNumbering?.order || 'prefix,number,suffix');
  
  const [quotationPrefix, setQuotationPrefix] = useState(company?.quotationNumbering?.prefix || '');
  const [quotationSuffix, setQuotationSuffix] = useState(company?.quotationNumbering?.suffix || '');
  const [quotationOrder, setQuotationOrder] = useState(company?.quotationNumbering?.order || 'prefix,number,suffix');

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
      termsAndConditions: company.termsAndConditions || '',
      additionalNotes: company.additionalNotes || '',
    } : {
      address: {
        country: 'India',
      },
      termsAndConditions: '',
      additionalNotes: '',
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
      // Explicitly construct payload to match backend schema
      const companyData = {
        name: data.name,
        gstin: data.gstin || null,
        pan: data.pan || null,
        address: data.address,
        contact: data.contact,
        bankDetails: data.bankDetails || null,
        logoUrl: logoUrl || null,
        signatureUrl: signatureUrl || null,
        website: data.website || null,
        termsAndConditions: data.termsAndConditions || null,
        additionalNotes: data.additionalNotes || null,
        invoiceNumbering: {
          prefix: invoicePrefix,
          suffix: invoiceSuffix,
          order: invoiceOrder,
        },
        quotationNumbering: {
          prefix: quotationPrefix,
          suffix: quotationSuffix,
          order: quotationOrder,
        },
      };

      await onSubmit(companyData as any);
      toast.success(company ? 'Company updated successfully' : 'Company created successfully');
    } catch (error: any) {
      console.error('Error saving company:', error);
      const errorMessage = error.response?.data?.detail 
        ? (Array.isArray(error.response.data.detail) 
            ? error.response.data.detail.map((e: any) => e.msg).join(', ') 
            : error.response.data.detail)
        : 'Failed to save company';
      toast.error(errorMessage);
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
          {/* Company Logo Upload */}
          <ImageUpload
            label="Company Logo"
            currentImageUrl={logoUrl}
            onImageUploaded={(url) => {
              setLogoUrl(url);
              setValue('logoUrl', url);
            }}
            onImageRemoved={() => {
              setLogoUrl('');
              setValue('logoUrl', '');
            }}
          />

          {/* Company Signature Upload */}
          <ImageUpload
            label="Authorized Signature"
            currentImageUrl={signatureUrl}
            onImageUploaded={(url) => {
              setSignatureUrl(url);
              setValue('signatureUrl', url);
            }}
            onImageRemoved={() => {
              setSignatureUrl('');
              setValue('signatureUrl', '');
            }}
          />
       
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

      {/* Invoice Numbering Configuration */}
      <NumberingConfig
        title="Invoice Numbering"
        description="Configure how invoice numbers are generated automatically"
        prefix={invoicePrefix}
        suffix={invoiceSuffix}
        order={invoiceOrder}
        nextNumber={company?.invoiceNumbering?.nextNumber || 1}
        onPrefixChange={setInvoicePrefix}
        onSuffixChange={setInvoiceSuffix}
        onOrderChange={setInvoiceOrder}
      />

      {/* Quotation Numbering Configuration */}
      <NumberingConfig
        title="Quotation Numbering"
        description="Configure how quotation numbers are generated automatically"
        prefix={quotationPrefix}
        suffix={quotationSuffix}
        order={quotationOrder}
        nextNumber={company?.quotationNumbering?.nextNumber || 1}
        onPrefixChange={setQuotationPrefix}
        onSuffixChange={setQuotationSuffix}
        onOrderChange={setQuotationOrder}
      />

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Defaults</CardTitle>
          <CardDescription>Default terms and notes for all invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
            <textarea
              id="termsAndConditions"
              {...register('termsAndConditions')}
              placeholder="E.g., Payment due within 30 days, Subject to Mumbai jurisdiction, etc."
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              These terms will appear on all invoices for this company
            </p>
            {errors.termsAndConditions && (
              <p className="text-sm text-red-500">{errors.termsAndConditions.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <textarea
              id="additionalNotes"
              {...register('additionalNotes')}
              placeholder="E.g., Thank you for your business, Contact us for support, etc."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              These notes will appear on all invoices for this company
            </p>
            {errors.additionalNotes && (
              <p className="text-sm text-red-500">{errors.additionalNotes.message}</p>
            )}
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
        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold">
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
