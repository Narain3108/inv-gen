/**
 * Invoice PDF Generator
 * Main module for generating invoice PDFs
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { InvoicePDFData, PDFDocumentDefinition } from './types';
import { buildCompanyHeader, buildInvoiceTitle, buildInvoiceInfo } from './header-builder';
import { buildAddressSection } from './address-builder';
import { buildItemsTable } from './items-table-builder';
import { buildTotalsSection } from './totals-builder';
import { buildBankDetails, buildTermsAndConditions, buildNotesSection, buildSignature } from './footer-builder';
import { getPageWatermark } from './watermark-builder';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || {};
}

/**
 * Generate and download invoice PDF
 */
export function generateInvoicePDF(data: InvoicePDFData): void {
  const { invoice, company, client, customization, copyType } = data;

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 60, right: 40, bottom: 60, left: 40 };

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: [
      // Watermark for duplicate copy (top right corner)
      ...getPageWatermark(copyType),

      // Header with company logo and details
      buildCompanyHeader(company, customization),

      // Invoice Title
      buildInvoiceTitle(customization, 'invoice'),

      // Invoice Number and Date
      buildInvoiceInfo(invoice, customization, 'invoice'),

      // Billing and Shipping Address
      buildAddressSection(client, customization),

      // Items Table
      buildItemsTable(invoice.items, customization),

      // Tax Summary and Totals
      ...buildTotalsSection(invoice, customization),

      // Bank Details
      ...buildBankDetails(company, customization),

      // Terms and Conditions
      ...buildTermsAndConditions(customization),

      // Notes
      ...buildNotesSection(customization),

      // Signature
      buildSignature(company, customization),
    ],
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: '#374151',
        fillColor: '#f3f4f6',
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  };

  // Generate and download PDF
  const copyLabel = copyType === 'duplicate' ? '_DUPLICATE' : '';
  const fileName = `Invoice_${invoice.invoiceNumber}${copyLabel}_${Date.now()}.pdf`;
  pdfMake.createPdf(docDefinition as any).download(fileName);
}

/**
 * Preview invoice PDF in new window
 */
export function previewInvoicePDF(data: InvoicePDFData): void {
  const { invoice, company, client, customization } = data;

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 60, right: 40, bottom: 60, left: 40 };

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: [
      // Header with company logo and details
      buildCompanyHeader(company, customization),

      // Invoice Title
      buildInvoiceTitle(customization, 'invoice'),

      // Invoice Number and Date
      buildInvoiceInfo(invoice, customization, 'invoice'),

      // Billing and Shipping Address
      buildAddressSection(client, customization),

      // Items Table
      buildItemsTable(invoice.items, customization),

      // Tax Summary and Totals
      ...buildTotalsSection(invoice, customization),

      // Bank Details
      ...buildBankDetails(company, customization),

      // Terms and Conditions
      ...buildTermsAndConditions(customization),

      // Notes
      ...buildNotesSection(customization),

      // Signature
      buildSignature(company, customization),
    ],
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: '#374151',
        fillColor: '#f3f4f6',
      },
    },
    defaultStyle: {
      font: 'Roboto',
    },
  };

  // Open PDF in new window
  pdfMake.createPdf(docDefinition as any).open();
}
