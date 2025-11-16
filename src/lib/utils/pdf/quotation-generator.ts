/**
 * Quotation PDF Generator
 * Main module for generating quotation PDFs
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { QuotationPDFData, PDFDocumentDefinition } from './types';
import { buildCompanyHeader, buildInvoiceTitle, buildInvoiceInfo } from './header-builder';
import { buildAddressSection } from './address-builder';
import { buildItemsTable } from './items-table-builder';
import { buildTotalsSection } from './totals-builder';
import { buildTermsAndConditions, buildNotesSection, buildSignature } from './footer-builder';
import { formatDate } from '@/utils/formatters';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || {};
}

/**
 * Generate and download quotation PDF
 */
export function generateQuotationPDF(data: QuotationPDFData): void {
  const { quotation, company, client, customization } = data;

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 60, right: 40, bottom: 60, left: 40 };

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: [
      // Header with company logo and details
      buildCompanyHeader(company, customization),

      // Quotation Title
      buildInvoiceTitle(customization, 'quotation'),

      // Quotation Number and Date
      buildInvoiceInfo(quotation, customization, 'quotation'),

      // Billing and Shipping Address
      buildAddressSection(client, customization),

      // Items Table
      buildItemsTable(quotation.items, customization),

      // Tax Summary and Totals
      ...buildTotalsSection(quotation, customization),

      // Quotation Validity Notice
      {
        text: [
          { text: 'Note: ', bold: true, fontSize: 9, color: '#dc2626' },
          { text: 'This quotation is valid until ', fontSize: 9 },
          { text: quotation.validUntil?.toDate ? formatDate(quotation.validUntil.toDate()) : 'N/A', fontSize: 9, bold: true, color: '#dc2626' },
          { text: '. Prices and availability are subject to change after this date.', fontSize: 9 },
        ],
        margin: [0, 10, 0, 10],
        background: '#fee2e2',
        fillColor: '#fee2e2',
      },

      // Terms and Conditions
      ...buildTermsAndConditions(customization),

      // Additional Notes
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
  const fileName = `Quotation_${quotation.quotationNumber}_${Date.now()}.pdf`;
  pdfMake.createPdf(docDefinition as any).download(fileName);
}

/**
 * Preview quotation PDF in new window
 */
export function previewQuotationPDF(data: QuotationPDFData): void {
  const { quotation, company, client, customization } = data;

  console.log('📥 Previewing quotation with customization:', {
    hasCustomization: !!customization,
    pageSize: customization?.pageSize,
    margins: customization?.margins,
    columnsCount: customization?.table?.columns?.length,
  });

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 60, right: 40, bottom: 60, left: 40 };

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: [
      // Header with company logo and details
      buildCompanyHeader(company, customization),

      // Quotation Title
      buildInvoiceTitle(customization, 'quotation'),

      // Quotation Number and Date
      buildInvoiceInfo(quotation, customization, 'quotation'),

      // Billing and Shipping Address
      buildAddressSection(client, customization),

      // Items Table
      buildItemsTable(quotation.items, customization),

      // Tax Summary and Totals
      ...buildTotalsSection(quotation, customization),

      // Quotation Validity Notice
      {
        text: [
          { text: 'Note: ', bold: true, fontSize: 9, color: '#dc2626' },
          { text: 'This quotation is valid until ', fontSize: 9 },
          { text: quotation.validUntil?.toDate ? formatDate(quotation.validUntil.toDate()) : 'N/A', fontSize: 9, bold: true, color: '#dc2626' },
          { text: '. Prices and availability are subject to change after this date.', fontSize: 9 },
        ],
        margin: [0, 10, 0, 10],
        background: '#fee2e2',
        fillColor: '#fee2e2',
      },

      // Terms and Conditions
      ...buildTermsAndConditions(customization),

      // Additional Notes
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
