/**
 * Core TypeScript Type Definitions
 * All types used across the Invoice Billing System
 */

import { Timestamp } from 'firebase/firestore';

// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ==================== Address Types ====================

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

// ==================== Contact Types ====================

export interface Contact {
  phone: string;
  email: string;
  website?: string;
}

// ==================== Bank Details Types ====================

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  branch?: string;
  upiId?: string;
}

// ==================== Company Types ====================

export interface Company {
  id: string;
  name: string;
  gstin?: string; // Optional GSTIN
  state?: string; // State for tax determination - derived from GSTIN or address
  address: Address;
  contact: Contact;
  bankDetails?: BankDetails;
  logoUrl?: string;
  signatureUrl?: string;
  pan?: string;
  website?: string;
  termsAndConditions?: string; // Default terms for all invoices
  additionalNotes?: string; // Default notes for all invoices
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CompanyFormData {
  name: string;
  gstin?: string;
  address: Address;
  contact: Contact;
  bankDetails?: BankDetails;
  pan?: string;
  website?: string;
  termsAndConditions?: string;
  additionalNotes?: string;
}

// ==================== Product/Service Types ====================

export interface Product {
  id: string;
  companyId: string;
  productName: string;
  description?: string;
  itemCode?: string; // Optional 5-digit auto-generated item code
  hsn: string; // HSN for goods, SAC for services
  unit: string; // Nos, Kgs, Liters, Hours, etc.
  price: number;
  gstRate: number; // 0, 5, 12, 18, 28
  cessRate?: number;
  stock?: number;
  type: 'product' | 'service';
  hasSerialNumber?: boolean; // Whether this product requires serial numbers
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProductFormData {
  productName: string;
  description?: string;
  itemCode?: string;
  hsn: string;
  unit: string;
  price: number;
  gstRate: number;
  cessRate?: number;
  stock?: number;
  type: 'product' | 'service';
  hasSerialNumber?: boolean;
}

// ==================== Client Types ====================

export interface Client {
  id: string;
  companyId: string;
  clientName: string;
  gstin?: string;
  address: Address;
  contact: Contact;
  pan?: string;
  bankDetails?: BankDetails;
  billingAddress?: Address;
  shippingAddress?: Address;
  autoFetched?: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface ClientFormData {
  clientName: string;
  gstin?: string;
  address: Address;
  contact: Contact;
  pan?: string;
  bankDetails?: BankDetails;
  billingAddress?: Address;
  shippingAddress?: Address;
}

// ==================== Invoice Types ====================

export interface InvoiceItem {
  productId?: string;
  itemCode?: string; // Optional item code from product
  description: string;
  hsn: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  gstRate: number;
  cessRate?: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
  lineTotal: number;
  serialNumbers?: string[]; // Serial numbers for products that require them
}

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMode?: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  recordedAt: Timestamp;
}

export type InvoicePaymentStatus = 'pending' | 'partially_paid' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  clientId: string;
  date: Timestamp;
  items: InvoiceItem[];
  totalAmount: number;
  totalAmountInWords: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  // Payment tracking fields
  paymentStatus: InvoicePaymentStatus;
  amountPaid: number;
  amountPending: number;
  payments: PaymentRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface InvoiceFormData {
  clientId: string;
  date: Date;
  items: InvoiceItem[];
  paymentMode?: PaymentMode;
}

// ==================== Quotation Types ====================

export type QuotationStatus = 
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'converted'
  | 'expired';

export interface Quotation {
  id: string;
  quotationNumber: string;
  companyId: string;
  clientId: string;
  date: Timestamp;
  validUntil: Timestamp; // Validity period for quotation
  status: QuotationStatus;
  items: InvoiceItem[]; // Same structure as invoice items
  totalAmount: number;
  totalAmountInWords: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  convertedToInvoiceId?: string; // Reference to invoice if converted
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface QuotationFormData {
  clientId: string;
  date: Date;
  validUntil: Date;
  items: InvoiceItem[];
}

// ==================== Enums & Constants ====================

export type PaymentMode = 
  | 'cash'
  | 'upi'
  | 'bank_transfer'
  | 'cheque'
  | 'credit_card'
  | 'debit_card'
  | 'net_banking';

export type PaymentStatus = 
  | 'paid'
  | 'unpaid'
  | 'partially_paid'
  | 'overdue';

export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'cancelled';

export interface PaymentFormData {
  amount: number;
  paymentDate: string;
  paymentMode?: PaymentMode;
  referenceNumber?: string;
  notes?: string;
}

export type UnitType = 
  | 'Nos'
  | 'Pcs'
  | 'Kgs'
  | 'Gms'
  | 'Ltrs'
  | 'Mtrs'
  | 'Hrs'
  | 'Days'
  | 'Box'
  | 'Set';

// ==================== GST API Response Types ====================

export interface GSTINResponse {
  gstin: string;
  legalName: string;
  tradeName: string;
  status: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  stateCode: string;
  registrationDate: string;
}

export interface HSNResponse {
  hsn: string;
  description: string;
  gstRate: number;
  type: 'goods' | 'services';
}

// ==================== Report Types ====================

export interface SalesReport {
  period: string;
  totalSales: number;
  totalTax: number;
  invoiceCount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
}

export interface ClientStatistics {
  clientId: string;
  clientName: string;
  totalInvoices: number;
  totalAmount: number;
  lastInvoiceDate: Timestamp;
}

export interface ProductStatistics {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  invoiceCount: number;
}

// ==================== Form State Types ====================

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

// ==================== Utility Types ====================

export interface SelectOption {
  value: string;
  label: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface FilterState {
  searchQuery: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}
