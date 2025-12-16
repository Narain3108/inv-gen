/**
 * Invoice and Quotation Customization Types
 */

export interface InvoiceColumn {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  width?: string;
}

export interface AddressFormat {
  showBillingAddress: boolean;
  showShippingAddress: boolean;
  billingLabel: string;
  shippingLabel: string;
  showGSTIN: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

export interface CompanyDetailsFormat {
  showLogo: boolean;
  showName: boolean;
  showAddress: boolean;
  showGSTIN: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showPAN: boolean;
  showBankDetails: boolean;
}

export interface InvoiceHeaderFormat {
  title: string;
  fontSize: 'small' | 'medium' | 'large';
  showInvoiceNumber: boolean;
  showDate: boolean;
  showDueDate: boolean;
  invoiceNumberLabel: string;
  dateLabel: string;
  dueDateLabel: string;
}

export interface TableFormat {
  showItemCode: boolean;
  showDescription: boolean;
  showHSN: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  showRate: boolean;
  showDiscount: boolean;
  showGST: boolean;
  showTax: boolean;
  showAmount: boolean;
  showSerialNumbers: boolean;
  columns: InvoiceColumn[];
}

export interface TotalsFormat {
  showTaxableAmount: boolean;
  showCGST: boolean;
  showSGST: boolean;
  showIGST: boolean;
  showCess: boolean;
  showDiscount: boolean;
  showRoundOff: boolean;
  showAmountInWords: boolean;
  showGSTBreakdown: boolean; // Show CGST/SGST/IGST breakdown by GST rate
}

export interface FooterFormat {
  showTermsAndConditions: boolean;
  termsText: string;
  showSignature: boolean;
  signatureLabel: string;
  showSeal: boolean;
  showThankYouNote: boolean;
  thankYouText: string;
  remarksText?: string;
}

export interface InvoiceCustomization {
  id?: string;
  companyId: string;
  type: 'invoice' | 'quotation';
  
  // Layout settings
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Company details
  companyDetails: CompanyDetailsFormat;

  // Header
  header: InvoiceHeaderFormat;

  // Address format
  addresses: AddressFormat;

  // Table format
  table: TableFormat;

  // Totals section
  totals: TotalsFormat;

  // Footer
  footer: FooterFormat;

  // Additional settings
  showPageNumbers: boolean;
  watermark?: string;
  colorScheme: {
    primary: string;
    secondary: string;
    text: string;
  };

  createdAt?: any;
  updatedAt?: any;
}

export const DEFAULT_INVOICE_COLUMNS: InvoiceColumn[] = [
  { id: 'sno', label: 'S.No', enabled: true, order: 0, width: '40' },
  { id: 'description', label: 'Description', enabled: true, order: 1, width: '*' },
  { id: 'itemCode', label: 'Item Code', enabled: true, order: 2, width: '45' },
  { id: 'hsn', label: 'HSN/SAC', enabled: true, order: 3, width: '40' },
  { id: 'quantity', label: 'Qty', enabled: true, order: 4, width: '30' },
  { id: 'unit', label: 'Unit', enabled: false, order: 5, width: '30' },
  { id: 'rate', label: 'Rate', enabled: true, order: 6, width: '50' },
  { id: 'discount', label: 'Disc %', enabled: true, order: 7, width: '40' },
  { id: 'gst', label: 'GST %', enabled: true, order: 8, width: '40' },
  { id: 'tax', label: 'Tax', enabled: true, order: 9, width: '40' },
  { id: 'amount', label: 'Amount', enabled: true, order: 10, width: '60' },
];

export const DEFAULT_INVOICE_CUSTOMIZATION: Omit<InvoiceCustomization, 'id' | 'companyId'> = {
  type: 'invoice',
  pageSize: 'A4',
  orientation: 'portrait',
  margins: { top: 60, right: 40, bottom: 60, left: 40 },
  
  companyDetails: {
    showLogo: true,
    showName: true,
    showAddress: true,
    showGSTIN: true,
    showPhone: true,
    showEmail: true,
    showPAN: false,
    showBankDetails: true,
  },

  header: {
    title: 'TAX INVOICE',
    fontSize: 'large',
    showInvoiceNumber: true,
    showDate: true,
    showDueDate: false,
    invoiceNumberLabel: 'Invoice No',
    dateLabel: 'Date',
    dueDateLabel: 'Due Date',
  },

  addresses: {
    showBillingAddress: true,
    showShippingAddress: true,
    billingLabel: 'BILLING ADDRESS',
    shippingLabel: 'SHIPPING ADDRESS',
    showGSTIN: true,
    showPhone: true,
    showEmail: false,
  },

  table: {
    showItemCode: true,
    showDescription: true,
    showHSN: true,
    showQuantity: true,
    showUnit: false,
    showRate: true,
    showDiscount: true,
    showGST: true,
    showTax: true,
    showAmount: true,
    showSerialNumbers: true,
    columns: DEFAULT_INVOICE_COLUMNS,
  },

  totals: {
    showTaxableAmount: true,
    showCGST: true,
    showSGST: true,
    showIGST: true,
    showCess: true,
    showDiscount: false,
    showRoundOff: false,
    showAmountInWords: true,
    showGSTBreakdown: true, // Show detailed GST breakdown by rate
  },

  footer: {
    showTermsAndConditions: true,
    termsText: 'Payment terms: Due within 30 days\nLate payments subject to 1.5% monthly interest',
    showSignature: true,
    signatureLabel: 'Authorized Signatory',
    showSeal: false,
    showThankYouNote: true,
    thankYouText: 'Thank you for your business!',
  },

  showPageNumbers: true,
  colorScheme: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    text: '#000000',
  },
};

export const DEFAULT_QUOTATION_CUSTOMIZATION: Omit<InvoiceCustomization, 'id' | 'companyId'> = {
  ...DEFAULT_INVOICE_CUSTOMIZATION,
  type: 'quotation',
  header: {
    title: 'QUOTATION',
    fontSize: 'large',
    showInvoiceNumber: true,
    showDate: true,
    showDueDate: true,
    invoiceNumberLabel: 'Quotation No',
    dateLabel: 'Date',
    dueDateLabel: 'Valid Until',
  },
  footer: {
    ...DEFAULT_INVOICE_CUSTOMIZATION.footer,
    termsText: 'This quotation is valid for 30 days from the date of issue.\\nPrices are subject to change without notice.',
    thankYouText: 'We look forward to serving you!',
  },
  totals: {
    ...DEFAULT_INVOICE_CUSTOMIZATION.totals,
    showGSTBreakdown: true,
  },
};
