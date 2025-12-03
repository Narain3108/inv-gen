/**
 * Quotation PDF Generator
 * Main module for generating quotation PDFs
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { QuotationPDFData, PDFDocumentDefinition } from './types';
import { buildHeader } from './header-builder';
import { buildAddressSection } from './address-builder';
import { buildFixedItemsTable } from './items-table-builder';
import { buildTotalsSection } from './totals-builder';
import { buildHorizontalFooter, buildSignature } from './footer-builder';
import { formatDate } from '@/utils/formatters';
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
 * Generate and download quotation PDF
 */
export async function generateQuotationPDF(data: QuotationPDFData): Promise<void> {
  const { quotation, company, client, customization } = data;

  // Convert image URLs to base64
  const companyWithImages = await convertCompanyImagesToBase64(company);

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 20, right: 20, bottom: 20, left: 20 };

  // Chunk items for pagination (8 rows per page)
  const items = quotation.items || [];
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
    content.push(buildHeader(companyWithImages, quotation, customization, 'quotation'));

    // 2. Billing/Shipping Section
    content.push(buildAddressSection(client, customization, quotation));

    // 3. Items Table
    content.push(buildFixedItemsTable(chunk, startIndex));

    // 4. Footer Section
    if (isLastPage) {
      content.push(...buildTotalsSection(quotation, customization));
      
      // Validity Notice
      content.push({
        text: [
          { text: 'Note: ', bold: true, fontSize: 9, color: '#dc2626' },
          { text: 'This quotation is valid until ', fontSize: 9 },
          { text: formatDate(quotation.validUntil), fontSize: 9, bold: true, color: '#dc2626' },
          { text: '. Prices and availability are subject to change after this date.', fontSize: 9 },
        ],
        margin: [0, 10, 0, 10],
        background: '#fee2e2',
        fillColor: '#fee2e2',
      });

      // Horizontal Footer (Terms, Notes)
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

  // Generate and download PDF
  const fileName = `Quotation_${quotation.quotationNumber}_${Date.now()}.pdf`;
  pdfMake.createPdf(docDefinition as any).download(fileName);
}

/**
 * Preview quotation PDF in new window
 */
export async function previewQuotationPDF(data: QuotationPDFData): Promise<void> {
  const { quotation, company, client, customization } = data;

  // Convert image URLs to base64
  const companyWithImages = await convertCompanyImagesToBase64(company);

  console.log('📥 Previewing quotation with customization:', {
    hasCustomization: !!customization,
    pageSize: customization?.pageSize,
    margins: customization?.margins,
    columnsCount: customization?.table?.columns?.length,
  });

  // Apply customization for page settings
  const pageSize = customization?.pageSize || 'A4';
  const margins = customization?.margins || { top: 20, right: 20, bottom: 20, left: 20 };

  // Chunk items for pagination (8 rows per page)
  const items = quotation.items || [];
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
    content.push(buildHeader(companyWithImages, quotation, customization, 'quotation'));

    // 2. Billing/Shipping Section
    content.push(buildAddressSection(client, customization, quotation));

    // 3. Items Table
    content.push(buildFixedItemsTable(chunk, startIndex));

    // 4. Footer Section
    if (isLastPage) {
      content.push(...buildTotalsSection(quotation, customization));
      
      // Validity Notice
      content.push({
        text: [
          { text: 'Note: ', bold: true, fontSize: 9, color: '#dc2626' },
          { text: 'This quotation is valid until ', fontSize: 9 },
          { text: formatDate(quotation.validUntil), fontSize: 9, bold: true, color: '#dc2626' },
          { text: '. Prices and availability are subject to change after this date.', fontSize: 9 },
        ],
        margin: [0, 10, 0, 10],
        background: '#fee2e2',
        fillColor: '#fee2e2',
      });

      // Horizontal Footer (Terms, Notes)
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
