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
import { useForm, UseFormReturn, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema } from '@/lib/validations';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { FloatingLabelSelect } from '@/components/ui/floating-label-select';
import { Label } from '@/components/ui/label';
import { SelectContent, SelectItem } from '@/components/ui/select';
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
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <FloatingLabelInput
                id="gstin"
                label="GSTIN (Optional)"
                {...register('gstin')}
                maxLength={15}
                className="uppercase"
                error={errors.gstin?.message}
              />
            </div>

          </div>

          {/* Company Name */}
          <FloatingLabelInput
            id="name"
            label="Legal Name *"
            {...register('name')}
            error={errors.name?.message}
          />


        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FloatingLabelInput
            id="address.street"
            label="Street Address *"
            {...register('address.street')}
            error={errors.address?.street?.message}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FloatingLabelInput
              id="address.city"
              label="City *"
              {...register('address.city')}
              error={errors.address?.city?.message}
            />

            <Controller
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FloatingLabelSelect
                  id="address.state"
                  label="State *"
                  value={field.value || ''}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  error={errors.address?.state?.message}
                >
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </FloatingLabelSelect>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FloatingLabelInput
              id="address.pincode"
              label="Pincode *"
              {...register('address.pincode')}
              maxLength={6}
              error={errors.address?.pincode?.message}
            />

            <FloatingLabelInput
              id="address.country"
              label="Country *"
              {...register('address.country')}
              defaultValue="India"
              readOnly
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FloatingLabelInput
            id="contact.phone"
            label="Phone *"
            {...register('contact.phone')}
            type="tel"
            error={errors.contact?.phone?.message}
          />

          <FloatingLabelInput
            id="contact.email"
            label="Email *"
            {...register('contact.email')}
            type="email"
            error={errors.contact?.email?.message}
          />
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
        <FloatingLabelInput
          id="bankDetails.bankName"
          label="Bank Name"
          {...register('bankDetails.bankName')}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FloatingLabelInput
            id="bankDetails.accountNumber"
            label="Account Number"
            {...register('bankDetails.accountNumber')}
          />

          <FloatingLabelInput
            id="bankDetails.ifscCode"
            label="IFSC Code"
            {...register('bankDetails.ifscCode')}
            className="uppercase"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FloatingLabelInput
            id="bankDetails.accountHolderName"
            label="Account Holder Name"
            {...register('bankDetails.accountHolderName')}
          />

          <FloatingLabelInput
            id="bankDetails.branch"
            label="Branch"
            {...register('bankDetails.branch')}
          />
        </div>

        <FloatingLabelInput
          id="bankDetails.upiId"
          label="UPI ID"
          {...register('bankDetails.upiId')}
        />
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
        description=""
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
        description=""
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
        description=""
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
          <div>
            <FloatingLabelTextarea
              id="termsAndConditions"
              label="Terms & Conditions"
              {...register('termsAndConditions')}
              rows={5}
              error={errors.termsAndConditions?.message}
            />
            <p className="text-xs text-muted-foreground mt-1">
              These terms will appear on all invoices for this company
            </p>
          </div>

          <div>
            <FloatingLabelTextarea
              id="additionalNotes"
              label="Additional Notes"
              {...register('additionalNotes')}
              rows={3}
              error={errors.additionalNotes?.message}
            />
            <p className="text-xs text-muted-foreground mt-1">
              These notes will appear on all invoices for this company
            </p>
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
      address: { country: 'India', street: '', city: '', state: '', pincode: '' },
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

  // Form validation error handler
  const onFormError = (errors: any) => {
    console.log('Form validation errors:', errors);

    // Collect all error messages
    const errorMessages: string[] = [];

    // Helper to extract messages recursively
    const extractErrors = (obj: any, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const error = obj[key];
        // If it has a message property, it's an error object
        if (error?.message) {
          // Format field name for better readability
          // e.g., 'address.street' -> 'Address Street'
          const fieldName = (prefix + key)
            .replace(/([A-Z])/g, ' $1') // Space before caps
            .replace(/\./g, ' > ')      // Replace dots with arrows
            .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter

          errorMessages.push(`${fieldName}: ${error.message}`);
        } else if (typeof error === 'object' && error !== null) {
          // Recurse for nested objects (like address, bankDetails)
          extractErrors(error, `${prefix}${key}.`);
        }
      });
    };

    extractErrors(errors);

    if (errorMessages.length > 0) {
      // Show summary toast
      toast.error('', {
        description: (
          <div className="flex flex-col gap-1 mt-2 max-h-[300px] overflow-y-auto">
            <p className="font-medium mb-1">Please fix the following:</p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              {errorMessages.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ul>
          </div>
        ),
        duration: 5000,
      });
    } else {
      toast.error('Please fix the errors in the form before submitting.');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit, onFormError)}>
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
