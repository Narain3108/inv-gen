/**
 * PDF Generation Types
 */

import { Invoice, Company, Client, Quotation } from '@/types';
import { InvoiceCustomization } from '@/types/customization';

export interface InvoicePDFData {
  invoice: Invoice;
  company: Company;
  client: Client;
  customization?: InvoiceCustomization;
}

export interface QuotationPDFData {
  quotation: Quotation;
  company: Company;
  client: Client;
  customization?: InvoiceCustomization;
}

export interface TableStructure {
  widths: (number | string)[];
  headers: any[];
}

export interface PDFDocumentDefinition {
  pageSize: string;
  pageMargins: number[];
  content: any[];
  styles?: any;
  defaultStyle?: any;
}
