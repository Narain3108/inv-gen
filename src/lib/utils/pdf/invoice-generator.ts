/**
 * Invoice PDF Generator
 * Main module for generating invoice PDFs
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { InvoicePDFData, PDFDocumentDefinition } from './types';
import { buildHeader } from './header-builder';
import { buildAddressSection } from './address-builder';
import { buildFixedItemsTable } from './items-table-builder';
import { buildTotalsSection } from './totals-builder';
import { buildHorizontalFooter, buildSignature } from './footer-builder';
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
  const margins = customization?.margins || { top: 20, right: 20, bottom: 20, left: 20 };

  // Chunk items for pagination (8 rows per page)
  const items = invoice.items || [];
  const itemsPerPage = 8;
  const chunks = [];
  if (items.length === 0) {
    chunks.push([]);
  } else {
    for (let i = 0; i < items.length; i += itemsPerPage) {
      chunks.push(items.slice(i, i + itemsPerPage));
    }
  }

  const content: any[] = [];

  // Add watermark
  content.push(...getPageWatermark(copyType));

  // Build pages
  chunks.forEach((chunk, index) => {
    const isLastPage = index === chunks.length - 1;
    const startIndex = index * itemsPerPage;

    // 1. Header Section (Repeated on every page)
    content.push(buildHeader(companyWithImages, invoice, customization, 'invoice'));

    // Small vertical spacer (~5 points) between header and addresses
    content.push({ text: '', margin: [0, 5, 0, 0] });

    // 2. Billing/Shipping Section (Repeated on every page for fixed template)
    content.push(buildAddressSection(client, customization, invoice));

    // Add a little extra space after addresses before the items table
    content.push({ text: '', margin: [0, 4, 0, 0] });

    // 3. Items Table (Chunked)
    content.push(buildFixedItemsTable(chunk, startIndex));

    // 4. Footer Section (Only on last page)
    if (isLastPage) {
      // Tax Breakdown & Totals
      content.push(...buildTotalsSection(invoice, customization));
      
      // Horizontal Footer (Bank, Terms, Notes)
      const horizontalFooter = buildHorizontalFooter(companyWithImages, customization);
      if (horizontalFooter) {
        content.push(horizontalFooter);
      }
      
      // Signature
      content.push(buildSignature(companyWithImages, customization));
    } else {
      // Add page break if not last page
      content.push({ text: '', pageBreak: 'after' });
    }
  });

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
        fillColor: '#f3f4f6',
      },
      defaultStyle: {
        font: 'Roboto'
      }
    },
    defaultStyle: {
      fontSize: 10,
      font: 'Roboto'
    }
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
  const margins = customization?.margins || { top: 20, right: 20, bottom: 20, left: 20 };

  // Chunk items for pagination (8 rows per page)
  const items = invoice.items || [];
  const itemsPerPage = 8;
  const chunks = [];
  if (items.length === 0) {
    chunks.push([]);
  } else {
    for (let i = 0; i < items.length; i += itemsPerPage) {
      chunks.push(items.slice(i, i + itemsPerPage));
    }
  }

  const content: any[] = [];

  // Build pages
  chunks.forEach((chunk, index) => {
    const isLastPage = index === chunks.length - 1;
    const startIndex = index * itemsPerPage;

    // 1. Header Section
    content.push(buildHeader(companyWithImages, invoice, customization, 'invoice'));

    // 2. Billing/Shipping Section
    content.push(buildAddressSection(client, customization, invoice));

    // 3. Items Table
    content.push(buildFixedItemsTable(chunk, startIndex));

    // 4. Footer Section
    if (isLastPage) {
      content.push(...buildTotalsSection(invoice, customization));
      
      // Horizontal Footer (Bank, Terms, Notes)
      const horizontalFooter = buildHorizontalFooter(companyWithImages, customization);
      if (horizontalFooter) {
        content.push(horizontalFooter);
      }

      content.push(buildSignature(companyWithImages, customization));
    } else {
      content.push({ text: '', pageBreak: 'after' });
    }
  });

  const docDefinition: PDFDocumentDefinition = {
    pageSize,
    pageMargins: [margins.left, margins.top, margins.right, margins.bottom],
    content: content,
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black',
        fillColor: '#f3f4f6',
      },
      defaultStyle: {
        font: 'Roboto'
      }
    },
    defaultStyle: {
      fontSize: 10,
      font: 'Roboto'
    }
  };

  // Open PDF in new window
  pdfMake.createPdf(docDefinition as any).open();
}
