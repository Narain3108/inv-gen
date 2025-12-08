/**
 * Zod Validation Schemas
 * Form validation schemas for all entities
 */

import { z } from 'zod';
import { VALIDATION_PATTERNS } from '@/lib/constants';

// ==================== Auth Schemas ====================

export const orgLoginSchema = z.object({
  orgCode: z.string().min(3, 'Organization Code is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const orgSignupSchema = z.object({
  orgName: z.string().min(2, 'Organization Name is required'),
  orgCode: z.string().min(3, 'Organization Code must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens and underscores allowed'),
  orgPassword: z.string().min(6, 'Organization Password must be at least 6 characters'),
  adminName: z.string().min(2, 'Admin Name is required'),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z.string().min(6, 'Admin Password must be at least 6 characters'),
  confirmAdminPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmAdminPassword, {
  message: "Passwords don't match",
  path: ["confirmAdminPassword"],
});

export const subUserFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'employee']),
  allowedCompanyIds: z.array(z.string()),
});

export type OrgLoginValues = z.infer<typeof orgLoginSchema>;
export type UserLoginValues = z.infer<typeof userLoginSchema>;
export type OrgSignupValues = z.infer<typeof orgSignupSchema>;
export type SubUserFormValues = z.infer<typeof subUserFormSchema>;

// ==================== Signup Schema (User) ====================
export const signupSchema = z.object({
  username: z.string().min(3, 'Username is required').regex(/^[a-zA-Z0-9_\-]+$/, 'Only letters, numbers, hyphens and underscores allowed'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type SignupValues = z.infer<typeof signupSchema>;

// ==================== Address Schema ====================

export const addressSchema = z.object({
  street: z.string().min(3, 'Street address is required').max(200),
  city: z.string().min(2, 'City is required').max(100),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(VALIDATION_PATTERNS.pincode, 'Invalid pincode'),
  country: z.string().optional().default('India'),
});

// ==================== Contact Schema ====================

export const contactSchema = z.object({
  phone: z.string().regex(VALIDATION_PATTERNS.phone, 'Invalid phone number'),
  email: z.string().email('Invalid email address'),
  website: z.string().url().optional().or(z.literal('')).nullish(),
});

// ==================== Bank Details Schema ====================

export const bankDetailsSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required').optional().or(z.literal('')).nullish(),
  accountNumber: z.string().min(9, 'Invalid account number').max(18).optional().or(z.literal('')).nullish(),
  ifscCode: z.string().regex(VALIDATION_PATTERNS.ifsc, 'Invalid IFSC code').optional().or(z.literal('')).nullish(),
  accountHolderName: z.string().min(2, 'Account holder name is required').optional().or(z.literal('')).nullish(),
  branch: z.string().optional().or(z.literal('')).nullish(),
  upiId: z.string().regex(VALIDATION_PATTERNS.upi, 'Invalid UPI ID').optional().or(z.literal('')).nullish(),
}).optional().nullable();

// ==================== Company Schema ====================

export const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(200),
  // Preprocess GSTIN: trim and uppercase but do NOT enforce format validation here
  gstin: z.preprocess((val) => typeof val === 'string' ? val.trim().toUpperCase() : val,
    z.string().optional().or(z.literal('')).nullish()
  ),
  address: addressSchema,
  contact: contactSchema,
  bankDetails: bankDetailsSchema,
  // Preprocess PAN: trim and uppercase but do NOT enforce format validation here
  pan: z.preprocess((val) => typeof val === 'string' ? val.trim().toUpperCase() : val,
    z.string().optional().or(z.literal('')).nullish()
  ),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')).nullish(),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')).nullish(),
  signatureUrl: z.string().url('Invalid signature URL').optional().or(z.literal('')).nullish(),
  termsAndConditions: z.string().max(1000, 'Terms must be less than 1000 characters').optional().or(z.literal('')).nullish(),
  additionalNotes: z.string().max(500, 'Notes must be less than 500 characters').optional().or(z.literal('')).nullish(),
});

// ==================== Category Schema ====================

export const categoryFormSchema = z.object({
  categoryName: z.string().min(2, 'Category name is required').max(200),
  description: z.string().max(500).optional().or(z.literal('')).nullish(),
  products: z.array(z.object({
    name: z.string().min(1, 'Product name is required'),
    hsn: z.string().min(1, 'HSN/SAC is required'),
    itemCode: z.string().optional().or(z.literal('')).nullish(),
  })).min(1, 'At least one product is required'),
  defaultGstRate: z.number().min(0).max(100),
});

// ==================== Product Schema ====================

export const productFormSchema = z.object({
  productName: z.string().min(2, 'Product/Service name is required').max(200),
  description: z.string().max(500).optional().nullish(),
  itemCode: z.string().length(5, 'Item code must be exactly 5 digits').regex(/^\d{5}$/, 'Item code must contain only digits').optional().or(z.literal('')).nullish(),
  hsn: z.string().min(4, 'HSN/SAC code is required (min 4 digits)').max(8),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().min(0, 'Price must be positive'),
  gstRate: z.number().min(0).max(28),
  cessRate: z.number().min(0).max(100).optional().nullish(),
  // Allow `stock` input to be empty in the form (user can type),
  // but when present it must be a number >= 0. Preprocess empty string -> undefined,
  // and convert numeric strings to numbers for validation.
  stock: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0).optional().nullish()),
  type: z.enum(['product', 'service']),
  hasSerialNumber: z.boolean().optional().nullish(),
});

// ==================== Client Schema ====================

export const clientFormSchema = z.object({
  clientName: z.string().min(2, 'Client name is required').max(200),
  // Normalize client GSTIN before validating
  gstin: z.preprocess((val) => typeof val === 'string' ? val.trim().toUpperCase() : val,
    z.string().optional().or(z.literal('')).nullish()
  ),
  address: addressSchema,
  contact: contactSchema,
  // Normalize PAN before validating
  pan: z.preprocess((val) => typeof val === 'string' ? val.trim().toUpperCase() : val,
    z.string().optional().or(z.literal('')).nullish()
  ),
  bankDetails: bankDetailsSchema,
  billingAddress: addressSchema.nullish(),
  shippingAddress: addressSchema.nullish(),
});

// ==================== Invoice Item Schema ====================

export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  hsn: z.string().min(4, 'HSN/SAC is required'),
  quantity: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0.01, 'Quantity must be greater than 0')),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0, 'Unit price must be positive')),
  discount: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isNaN(n) ? val : n;
    }
    return val;
  }, z.number().min(0).max(100).optional()),
  gstRate: z.number().min(0).max(28),
  cessRate: z.number().min(0).max(100).optional(),
  cgst: z.number(),
  sgst: z.number(),
  igst: z.number(),
  cess: z.number().optional(),
  lineTotal: z.number(),
});

// ==================== Invoice Schema ====================

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Invoice date is required'), // Store as string, convert to Date in handler
  shippingAddress: addressSchema.optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product'),
    quantity: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    }, z.number().min(0.01, 'Quantity must be greater than 0')),
    unitPrice: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    }, z.number().min(0, 'Price must be a positive number')),
    discount: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    }, z.number().min(0).max(100).optional()),
  })).min(1, 'At least one item is required'),
});

// ==================== Quotation Schema ====================

export const quotationFormSchema = z.object({
  quotationNumber: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Quotation date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  shippingAddress: addressSchema.optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product'),
    quantity: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    }, z.number().min(0.01, 'Quantity must be greater than 0')),
    unitPrice: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    }, z.number().min(0, 'Price must be a positive number')),
    discount: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      if (typeof val === 'string') {
        const n = Number(val);
        return Number.isNaN(n) ? val : n;
      }
      return val;
    }, z.number().min(0).max(100).optional()),
  })).min(1, 'At least one item is required'),
});

// ==================== Login Schema ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// ==================== Register Schema ====================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ==================== Type Exports ====================

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type QuotationFormValues = z.infer<typeof quotationFormSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
