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
import { Company } from '@/types';
import { cloudinaryUrlToBase64 } from '@/lib/services/cloudinary-service';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || {};
}

/**
 * Convert company images (logo and signature) to base64
 */
async function convertCompanyImagesToBase64(company: Company): Promise<Company> {
  const companyWithImages = { ...company };

  // Convert logo URL to base64
  if (company.logoUrl && company.logoUrl.startsWith('http')) {
    try {
      console.log('\n🖼️ LOGO CONVERSION STARTING');
      console.log('Original URL:', company.logoUrl);
      
      const base64Logo = await cloudinaryUrlToBase64(company.logoUrl);
      companyWithImages.logoUrl = base64Logo;
      
      console.log('✅ LOGO CONVERTED');
      console.log('Format:', base64Logo.substring(0, 30));
      console.log('Size:', Math.round(base64Logo.length / 1024), 'KB\n');
    } catch (error) {
      console.error('\n❌ LOGO CONVERSION FAILED');
      console.error('Error:', error);
      console.error('Proceeding without logo\n');
      companyWithImages.logoUrl = undefined;
    }
  } else if (company.logoUrl?.startsWith('data:image/')) {
    console.log('✅ Logo already in base64 format');
  }

  // Convert signature URL to base64
  if (company.signatureUrl && company.signatureUrl.startsWith('http')) {
    try {
      console.log('\n✍️ SIGNATURE CONVERSION STARTING');
      console.log('Original URL:', company.signatureUrl);
      
      const base64Signature = await cloudinaryUrlToBase64(company.signatureUrl);
      companyWithImages.signatureUrl = base64Signature;
      
      console.log('✅ SIGNATURE CONVERTED');
      console.log('Format:', base64Signature.substring(0, 30));
      console.log('Size:', Math.round(base64Signature.length / 1024), 'KB\n');
    } catch (error) {
      console.error('\n❌ SIGNATURE CONVERSION FAILED');
      console.error('Error:', error);
      console.error('Proceeding without signature\n');
      companyWithImages.signatureUrl = undefined;
    }
  } else if (company.signatureUrl?.startsWith('data:image/')) {
    console.log('✅ Signature already in base64 format');
  }

  return companyWithImages;
}

/**
 * Generate and download invoice PDF
 */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<void> {
  const { invoice, company, client, customization, copyType } = data;

  // Convert image URLs to base64
  const companyWithImages = await convertCompanyImagesToBase64(company);

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
      buildCompanyHeader(companyWithImages, customization),

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
      ...buildBankDetails(companyWithImages, customization),

      // Terms and Conditions
      ...buildTermsAndConditions(customization),

      // Notes
      ...buildNotesSection(customization),

      // Signature
      buildSignature(companyWithImages, customization),
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
export async function previewInvoicePDF(data: InvoicePDFData): Promise<void> {
  const { invoice, company, client, customization } = data;

  // Convert image URLs to base64
  const companyWithImages = await convertCompanyImagesToBase64(company);

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 60, right: 40, bottom: 60, left: 40 };

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: [
      // Header with company logo and details
      buildCompanyHeader(companyWithImages, customization),

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
      ...buildBankDetails(companyWithImages, customization),

      // Terms and Conditions
      ...buildTermsAndConditions(customization),

      // Notes
      ...buildNotesSection(customization),

      // Signature
      buildSignature(companyWithImages, customization),
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
