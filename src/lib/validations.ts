/**
 * Zod Validation Schemas
 * Form validation schemas for all entities
 */

import { z } from 'zod';
import { VALIDATION_PATTERNS } from '@/lib/constants';

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
  website: z.string().optional().refine((val) => !val || val === '' || z.string().url().safeParse(val).success, {
    message: 'Invalid website URL',
  }),
});

// ==================== Bank Details Schema ====================

export const bankDetailsSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required').optional().or(z.literal('')),
  accountNumber: z.string().min(9, 'Invalid account number').max(18).optional().or(z.literal('')),
  ifscCode: z.string().regex(VALIDATION_PATTERNS.ifsc, 'Invalid IFSC code').optional().or(z.literal('')),
  accountHolderName: z.string().min(2, 'Account holder name is required').optional().or(z.literal('')),
  branch: z.string().optional().or(z.literal('')),
  upiId: z.string().regex(VALIDATION_PATTERNS.upi, 'Invalid UPI ID').optional().or(z.literal('')),
}).optional();

// ==================== Company Schema ====================

export const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name is required').max(200),
  gstin: z.string().regex(VALIDATION_PATTERNS.gstin, 'Invalid GSTIN format').optional().or(z.literal('')),
  address: addressSchema,
  contact: contactSchema,
  bankDetails: bankDetailsSchema.optional(),
  pan: z.string().regex(VALIDATION_PATTERNS.pan, 'Invalid PAN format').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid logo URL').optional().or(z.literal('')),
  signatureUrl: z.string().url('Invalid signature URL').optional().or(z.literal('')),
  termsAndConditions: z.string().max(1000, 'Terms must be less than 1000 characters').optional().or(z.literal('')),
  additionalNotes: z.string().max(500, 'Notes must be less than 500 characters').optional().or(z.literal('')),
});

// ==================== Product Schema ====================

export const productFormSchema = z.object({
  productName: z.string().min(2, 'Product/Service name is required').max(200),
  description: z.string().max(500).optional(),
  itemCode: z.string().length(5, 'Item code must be exactly 5 digits').regex(/^\d{5}$/, 'Item code must contain only digits').optional().or(z.literal('')),
  hsn: z.string().min(4, 'HSN/SAC code is required (min 4 digits)').max(8),
  unit: z.string().min(1, 'Unit is required'),
  price: z.number().min(0, 'Price must be positive'),
  gstRate: z.number().min(0).max(28),
  cessRate: z.number().min(0).max(100).optional(),
  stock: z.number().min(0).optional(),
  type: z.enum(['product', 'service']),
  hasSerialNumber: z.boolean().optional(),
});

// ==================== Client Schema ====================

export const clientFormSchema = z.object({
  clientName: z.string().min(2, 'Client name is required').max(200),
  gstin: z.string().regex(VALIDATION_PATTERNS.gstin, 'Invalid GSTIN format').optional().or(z.literal('')),
  address: addressSchema,
  contact: contactSchema,
  pan: z.string().regex(VALIDATION_PATTERNS.pan, 'Invalid PAN format').optional().or(z.literal('')),
  bankDetails: bankDetailsSchema.optional(),
  billingAddress: addressSchema.nullish(),
  shippingAddress: addressSchema.nullish(),
});

// ==================== Invoice Item Schema ====================

export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  hsn: z.string().min(4, 'HSN/SAC is required'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
  discount: z.number().min(0).max(100).optional(),
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
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Invoice date is required'), // Store as string, convert to Date in handler
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Price must be a positive number'),
    discount: z.number().min(0).max(100).optional().default(0),
  })).min(1, 'At least one item is required'),
});

// ==================== Quotation Schema ====================

export const quotationFormSchema = z.object({
  quotationNumber: z.string().optional(),
  clientId: z.string().min(1, 'Client is required'),
  date: z.string().min(1, 'Quotation date is required'),
  validUntil: z.string().min(1, 'Valid until date is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Price must be a positive number'),
    discount: z.number().min(0).max(100).optional().default(0),
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
