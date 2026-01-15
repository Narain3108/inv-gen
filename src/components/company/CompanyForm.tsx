/**
 * Company Form Component
 * Form for creating/editing company details
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Form logic separated into tab content components
 * - Open/Closed: Tab content can be extended without modifying core structure
 * - DRY: Uses shared TabFormLayout component
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema } from '@/lib/validations';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { INDIAN_STATES } from '@/lib/constants';
import { fetchGSTINDetails } from '@/lib/api/gst-api';
import { z } from 'zod';
import { ImageUpload } from '@/components/shared/ImageUpload';
import { NumberingConfig } from '@/components/shared/NumberingConfig';
import { TabFormLayout, TabConfig } from '@/components/shared/TabFormLayout';

type CompanyFormData = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel?: () => void;
}

// ============================================================================
// Tab Content Components (Single Responsibility Principle)
// ============================================================================

interface TabContentProps {
  form: UseFormReturn<CompanyFormData>;
  company?: Company;
}

/** Basic Information Tab Content */
function BasicInfoTab({ form, company }: TabContentProps & {
  onFetchGSTIN: () => void;
  isFetchingGSTIN: boolean;
}) {
  const { register, formState: { errors }, watch, setValue } = form;

  return (
    <div className="space-y-6">
      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                onClick={arguments[0].onFetchGSTIN}
                disabled={arguments[0].isFetchingGSTIN}
              >
                {arguments[0].isFetchingGSTIN ? (
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
    </div>
  );
}

/** Bank Details Tab Content */
function BankDetailsTab({ form }: TabContentProps) {
  const { register, formState: { errors } } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Details</CardTitle>
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

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
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
  );
}

/** Settings Tab Content (Numbering Configurations) */
interface SettingsTabProps {
  invoicePrefix: string;
  invoiceSuffix: string;
  invoiceOrder: string;
  quotationPrefix: string;
  quotationSuffix: string;
  quotationOrder: string;
  servicePrefix: string;
  serviceSuffix: string;
  serviceOrder: string;
  company?: Company;
  setInvoicePrefix: (v: string) => void;
  setInvoiceSuffix: (v: string) => void;
  setInvoiceOrder: (v: string) => void;
  setQuotationPrefix: (v: string) => void;
  setQuotationSuffix: (v: string) => void;
  setQuotationOrder: (v: string) => void;
  setServicePrefix: (v: string) => void;
  setServiceSuffix: (v: string) => void;
  setServiceOrder: (v: string) => void;
}

function SettingsTab(props: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <NumberingConfig
        title="Invoice Numbering"
        description="Configure how invoice numbers are generated automatically"
        prefix={props.invoicePrefix}
        suffix={props.invoiceSuffix}
        order={props.invoiceOrder}
        nextNumber={props.company?.invoiceNumbering?.nextNumber || 1}
        onPrefixChange={props.setInvoicePrefix}
        onSuffixChange={props.setInvoiceSuffix}
        onOrderChange={props.setInvoiceOrder}
      />

      <NumberingConfig
        title="Quotation Numbering"
        description="Configure how quotation numbers are generated automatically"
        prefix={props.quotationPrefix}
        suffix={props.quotationSuffix}
        order={props.quotationOrder}
        nextNumber={props.company?.quotationNumbering?.nextNumber || 1}
        onPrefixChange={props.setQuotationPrefix}
        onSuffixChange={props.setQuotationSuffix}
        onOrderChange={props.setQuotationOrder}
      />

      <NumberingConfig
        title="Service Numbering"
        description="Configure how service numbers are generated automatically"
        prefix={props.servicePrefix}
        suffix={props.serviceSuffix}
        order={props.serviceOrder}
        nextNumber={props.company?.serviceNumbering?.nextNumber || 1}
        onPrefixChange={props.setServicePrefix}
        onSuffixChange={props.setServiceSuffix}
        onOrderChange={props.setServiceOrder}
      />
    </div>
  );
}

/** Branding Tab Content */
interface BrandingTabProps extends TabContentProps {
  logoUrl: string;
  signatureUrl: string;
  setLogoUrl: (url: string) => void;
  setSignatureUrl: (url: string) => void;
}

function BrandingTab({ form, logoUrl, signatureUrl, setLogoUrl, setSignatureUrl }: BrandingTabProps) {
  const { register, setValue, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      {/* Terms and Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Defaults</CardTitle>
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

      {/* Image Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Main Form Component
// ============================================================================

type TabKey = 'basic' | 'bank' | 'settings' | 'branding';

export function CompanyForm({ company, onSubmit, onCancel }: CompanyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGSTIN, setIsFetchingGSTIN] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('basic');

  // Image URLs
  const [logoUrl, setLogoUrl] = useState<string>(company?.logoUrl || '');
  const [signatureUrl, setSignatureUrl] = useState<string>(company?.signatureUrl || '');

  // Numbering Configuration States
  const [invoicePrefix, setInvoicePrefix] = useState(company?.invoiceNumbering?.prefix || '');
  const [invoiceSuffix, setInvoiceSuffix] = useState(company?.invoiceNumbering?.suffix || '');
  const [invoiceOrder, setInvoiceOrder] = useState(company?.invoiceNumbering?.order || 'prefix,number,suffix');

  const [quotationPrefix, setQuotationPrefix] = useState(company?.quotationNumbering?.prefix || '');
  const [quotationSuffix, setQuotationSuffix] = useState(company?.quotationNumbering?.suffix || '');
  const [quotationOrder, setQuotationOrder] = useState(company?.quotationNumbering?.order || 'prefix,number,suffix');

  const [servicePrefix, setServicePrefix] = useState(company?.serviceNumbering?.prefix || '');
  const [serviceSuffix, setServiceSuffix] = useState(company?.serviceNumbering?.suffix || '');
  const [serviceOrder, setServiceOrder] = useState(company?.serviceNumbering?.order || 'prefix,number,suffix');

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema) as any,
    defaultValues: company ? {
      name: company.name,
      gstin: company.gstin || '',
      pan: company.pan || '',
      website: company.website || '',
      logoUrl: company.logoUrl || '',
      address: company.address || { country: 'India', street: '', city: '', state: '', pincode: '' },
      contact: company.contact || { phone: '', email: '' },
      bankDetails: company.bankDetails || {},
      termsAndConditions: company.termsAndConditions || '',
      additionalNotes: company.additionalNotes || '',
    } : {
      address: { country: 'India' },
      termsAndConditions: '',
      additionalNotes: '',
    } as any,
  });

  const { handleSubmit, trigger, watch, setValue } = form;

  // Tab navigation order and validation fields per tab
  const tabsOrder: TabKey[] = ['basic', 'bank', 'settings', 'branding'];
  const fieldsPerTab: Record<TabKey, string[]> = {
    basic: ['name', 'gstin', 'pan', 'address.street', 'address.city', 'address.state', 'address.pincode', 'contact.phone', 'contact.email'],
    bank: ['bankDetails.bankName', 'bankDetails.accountNumber', 'bankDetails.ifscCode'],
    settings: [],
    branding: ['termsAndConditions', 'additionalNotes'],
  };

  // Auto-fetch GSTIN details
  const handleFetchGSTIN = async () => {
    const gstin = (watch('gstin') ?? '').toString().trim().toUpperCase();
    if (!gstin || gstin.length !== 15) {
      toast.error('Please enter a valid 15-character GSTIN');
      return;
    }

    setValue('gstin', gstin);
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

  // Navigate to next tab with validation
  const goToNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const currentFields = fieldsPerTab[activeTab] || [];
    const valid = await trigger(currentFields as any);
    if (!valid) {
      toast.error('Please fix errors on this tab before proceeding');
      return;
    }

    const idx = tabsOrder.indexOf(activeTab);
    if (idx >= 0 && idx < tabsOrder.length - 1) {
      setActiveTab(tabsOrder[idx + 1]);
    }
  };

  // Navigate to previous tab
  const goBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const idx = tabsOrder.indexOf(activeTab);
    if (idx > 0) {
      setActiveTab(tabsOrder[idx - 1]);
    }
  };

  // Submit handler
  const handleFormSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);
    try {
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
        invoiceNumbering: { prefix: invoicePrefix, suffix: invoiceSuffix, order: invoiceOrder },
        quotationNumbering: { prefix: quotationPrefix, suffix: quotationSuffix, order: quotationOrder },
        serviceNumbering: { prefix: servicePrefix, suffix: serviceSuffix, order: serviceOrder },
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

  // Build tabs configuration
  const tabs: TabConfig[] = useMemo(() => [
    {
      key: 'basic',
      label: 'Basic Info',
      content: (
        <BasicInfoTab
          form={form}
          company={company}
          onFetchGSTIN={handleFetchGSTIN}
          isFetchingGSTIN={isFetchingGSTIN}
        />
      ),
      fieldsToValidate: fieldsPerTab.basic,
    },
    {
      key: 'bank',
      label: 'Bank Details',
      content: <BankDetailsTab form={form} company={company} />,
      fieldsToValidate: fieldsPerTab.bank,
    },
    {
      key: 'settings',
      label: 'Settings',
      content: (
        <SettingsTab
          invoicePrefix={invoicePrefix}
          invoiceSuffix={invoiceSuffix}
          invoiceOrder={invoiceOrder}
          quotationPrefix={quotationPrefix}
          quotationSuffix={quotationSuffix}
          quotationOrder={quotationOrder}
          servicePrefix={servicePrefix}
          serviceSuffix={serviceSuffix}
          serviceOrder={serviceOrder}
          company={company}
          setInvoicePrefix={setInvoicePrefix}
          setInvoiceSuffix={setInvoiceSuffix}
          setInvoiceOrder={setInvoiceOrder}
          setQuotationPrefix={setQuotationPrefix}
          setQuotationSuffix={setQuotationSuffix}
          setQuotationOrder={setQuotationOrder}
          setServicePrefix={setServicePrefix}
          setServiceSuffix={setServiceSuffix}
          setServiceOrder={setServiceOrder}
        />
      ),
      fieldsToValidate: fieldsPerTab.settings,
    },
    {
      key: 'branding',
      label: 'Branding',
      content: (
        <BrandingTab
          form={form}
          company={company}
          logoUrl={logoUrl}
          signatureUrl={signatureUrl}
          setLogoUrl={setLogoUrl}
          setSignatureUrl={setSignatureUrl}
        />
      ),
      fieldsToValidate: fieldsPerTab.branding,
    },
  ], [form, company, isFetchingGSTIN, logoUrl, signatureUrl, invoicePrefix, invoiceSuffix, invoiceOrder, quotationPrefix, quotationSuffix, quotationOrder, servicePrefix, serviceSuffix, serviceOrder]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <TabFormLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabKey)}
        onNext={goToNext}
        onBack={goBack}
        isLoading={isLoading}
        submitLabel={company ? 'Update Company' : 'Create Company'}
        onCancel={onCancel}
      />
    </form>
  );
}

export default CompanyForm;
