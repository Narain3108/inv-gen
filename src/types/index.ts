/**
 * Core TypeScript Type Definitions
 * All types used across the Invoice Billing System
 */

// ==================== User Types ====================

import { ROLES } from '@/lib/constants';

export type UserRole = typeof ROLES[keyof typeof ROLES];

export interface Organization {
  id: string;
  name: string;
  orgCode: string; // Unique ID for login
  createdAt: string | Date;
  updatedAt?: string | Date;
  ownerId: string; // Super Admin ID
}

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  photoURL?: string;
  role: UserRole;
  organizationId: string;
  allowedCompanyIds: string[]; // Empty for Super Admin (implies all)
  createdAt: string | Date;
  updatedAt?: string | Date;
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

export interface NumberingConfig {
  prefix: string;
  suffix: string;
  order: string;
  nextNumber: number;
}

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
  invoiceNumbering?: NumberingConfig;
  quotationNumbering?: NumberingConfig;
  serviceNumbering?: NumberingConfig;
  createdAt: string | Date;
  updatedAt?: string | Date;
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
  invoiceNumbering?: {
    prefix: string;
    suffix: string;
    order: string;
  };
  quotationNumbering?: {
    prefix: string;
    suffix: string;
    order: string;
  };
  serviceNumbering?: {
    prefix: string;
    suffix: string;
    order: string;
  };
}

// ==================== Product/Service Types ====================

export interface ProductCategory {
  id: string;
  categoryName: string;
  description?: string;
  products: CategoryProduct[];
  defaultGstRate: number; // Default GST rate for this category
  createdBy?: string; // user id of creator (optional)
  createdByUsername?: string; // snapshot username for display (optional)
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CategoryProduct {
  name: string;
  hsn: string;
  itemCode?: string;
}

export interface ProductCategoryFormData {
  categoryName: string;
  description?: string;
  products: CategoryProduct[];
  defaultGstRate: number;
}

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
  serialNumbers?: string[]; // Available serial numbers
  categoryId?: string; // Reference to global product category
  createdBy?: string; // user id of creator
  createdByUsername?: string; // snapshot of creator username for display
  createdByRole?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
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
  companyId?: string; // Optional now as clients are global
  clientName: string;
  gstin?: string;
  address: Address;
  contact: Contact;
  pan?: string;
  bankDetails?: BankDetails;
  billingAddress?: Address;
  shippingAddress?: Address;
  shippingAddresses?: Address[];
  autoFetched?: boolean;
  createdBy?: string;
  createdByUsername?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
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
  productDescription?: string;
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
  rate: number; // GST rate (5, 12, 18, 28, etc.)
  taxableAmount: number; // Taxable amount for this rate
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalTax: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string | Date;
  paymentMode?: PaymentMode;
  referenceNumber?: string;
  notes?: string;
  recordedAt: string | Date;
}

export type InvoicePaymentStatus = 'pending' | 'partially_paid' | 'paid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  referenceNumber?: string;
  poNumber?: string;
  poDate?: string | Date;
  ewayNumber?: string;
  companyId: string;
  clientId: string;
  createdBy?: string;
  createdByUsername?: string;
  date: string | Date;
  shippingAddress?: Address;
  items: InvoiceItem[];
  totalAmount: number;
  totalAmountInWords: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxBreakdown?: TaxBreakdown[]; // GST breakdown by rate (5%, 12%, 18%, 28%, etc.)
  // Payment tracking fields
  paymentStatus: InvoicePaymentStatus;
  amountPaid: number;
  amountPending: number;
  payments: PaymentRecord[];
  createdAt: string | Date;
  updatedAt: string | Date;
  // Service linking (for invoices created from services)
  sourceType?: 'service' | 'manual';
  serviceId?: string;
  serviceNumber?: string;
  serviceDetails?: {
    problemDescription?: string;
    actionTaken?: string;
    attendedBy?: string;
    attendedAt?: string;
  };
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
  createdBy?: string;
  createdByUsername?: string;
  date: string | Date;
  validUntil: string | Date; // Validity period for quotation
  status: QuotationStatus;
  shippingAddress?: Address;
  items: InvoiceItem[]; // Same structure as invoice items
  totalAmount: number;
  totalAmountInWords: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxBreakdown?: TaxBreakdown[]; // GST breakdown by rate (5%, 12%, 18%, 28%, etc.)
  convertedToInvoiceId?: string; // Reference to invoice if converted
  createdAt: string | Date;
  updatedAt: string | Date;
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
  lastInvoiceDate: string | Date;
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

// ==================== Service Management Types ====================

export type ServiceType =
  | 'warranty'
  | 'per_call'
  | 'amc'
  | 'new_installation';

export type ServiceStatusType =
  | 'open'
  | 'pending'
  | 'closed';

export interface ServiceResolution {
  observation?: string;
  actionTaken?: string;
  isSolved: boolean;
  attendedBy?: string;
  attendedByName?: string;
  attendedAt?: string | Date;
  clientSignatureUrl?: string;
  proofDocumentUrl?: string;
}

export interface Service {
  id: string;
  serviceNumber: string;
  companyId: string;
  clientId: string;
  clientName?: string;
  clientAddress?: Address;

  // Call details
  callDate: string | Date;
  serviceType: ServiceType;
  problemDescription: string;
  initialSolution?: string;

  // Service location
  serviceAddress?: Address;

  // Assignment
  assignedToIds: string[];
  assignedToNames: string[];
  assignedDate: string | Date;
  assignedTime: string;

  // Status & Resolution
  status: ServiceStatusType;
  resolution?: ServiceResolution;  // Latest resolution (backwards compat)
  serviceHistory?: ServiceResolution[];  // All attendance history

  // Invoice Integration
  invoiceId?: string;

  // Spare Parts Workflow
  sparePartRequests?: SparePartRequest[];  // Pending/approved/rejected requests
  usedParts?: UsedPart[];  // Parts consumed directly (Admin)
  approvedParts?: UsedPart[];  // Parts approved after request

  // Audit
  createdBy?: string;
  createdByName?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface ServiceFormData {
  companyId: string;
  clientId: string;
  callDate: Date;
  serviceType: ServiceType;
  problemDescription: string;
  initialSolution?: string;
  useClientAddress: boolean;
  serviceAddress?: Address;
  assignedToIds: string[];
  assignedDate: Date;
  assignedTime: string;
}

export interface ServiceAttendData {
  observation?: string;
  actionTaken?: string;
  isSolved: boolean;
  clientSignatureUrl?: string;
  proofDocumentUrl?: string;
  // Parts used directly by Admin
  usedParts?: UsedPart[];
  // Parts requested by Employee (requires approval)
  sparePartRequests?: SparePartRequest[];
}

// Used Part (Admin direct consumption)
export interface UsedPart {
  productId: string;
  productName: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  gstRate?: number;
  serialNumbers?: string[];
}

// Spare Part Request (Employee requests, Admin approves)
export type SparePartRequestStatus = 'pending' | 'approved' | 'rejected';

export interface SparePartRequest {
  id?: string;
  productId: string;
  productName: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  gstRate?: number;
  status: SparePartRequestStatus;
  requestedBy?: string;
  requestedByName?: string;
  requestedAt?: string | Date;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string | Date;
  serialNumbers?: string[];
  rejectionReason?: string;
}

// For inline invoice creation during service attendance (Legacy)
export interface InlineInvoiceItem {
  productId: string;
  productName?: string;
  description?: string;
  hsn?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  discount?: number;
  gstRate?: number;
}

