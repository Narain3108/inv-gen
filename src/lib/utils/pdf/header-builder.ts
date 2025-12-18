/**
 * PDF Header Section Builder
 */

import { Company, Client, Invoice, Quotation } from '@/types';
import { InvoiceCustomization } from '@/types/customization';
import { formatDate } from '@/utils/formatters';
import { getFontSize } from './helpers';

/**
 * Build 3-column header section
 */
export const buildHeader = (
  company: Company, 
  document: Invoice | Quotation, 
  customization?: InvoiceCustomization,
  type: 'invoice' | 'quotation' = 'invoice'
): any => {
  const showLogo = customization?.companyDetails?.showLogo !== false;
  const title = type === 'invoice' ? 'TAX INVOICE' : 'QUOTATION';
  const documentNumber = type === 'invoice' ? (document as Invoice).invoiceNumber : (document as Quotation).quotationNumber;
  const dateLabel = type === 'invoice' ? 'Invoice Date' : 'Date';
  
  return {
    columns: [
      // Left Column: Logo
      {
        width: '20%',
        stack: [
          showLogo && company.logoUrl
            ? {
                image: company.logoUrl,
                width: 80,
                height: 80,
                alignment: 'left',
              }
            : {
                text: (company.name || '').substring(0, 2).toUpperCase(),
                fontSize: 32,
                bold: true,
                color: customization?.colorScheme?.primary || '#3b82f6',
                alignment: 'left',
                width: 80,
              }
        ],
        alignment: 'left'
      },

      // Middle Column: Company name, address, GSTIN, contact
      {
        width: '45%',
        stack: [
          { text: company.name || '', fontSize: 12, bold: true, alignment: 'left' },
          company.address?.street ? { text: company.address.street, fontSize: 9, alignment: 'left' } : {},
          (company.address?.city || company.address?.state || company.address?.pincode)
            ? { text: `${company.address?.city || ''}${company.address?.city ? ', ' : ''}${company.address?.state || ''}${company.address?.pincode ? ' - ' + company.address?.pincode : ''}`, fontSize: 9, alignment: 'left' }
            : {},
          company.gstin ? { text: `GSTIN: ${company.gstin}`, fontSize: 9, alignment: 'left' } : {},
          company.contact?.email ? { text: `Email: ${company.contact.email}`, fontSize: 9, alignment: 'left' } : {},
          company.contact?.phone ? { text: `Phone: ${company.contact.phone}`, fontSize: 9, alignment: 'left' } : {},
        ],
        alignment: 'center'
      },

      // Right Column: Title and Document Details (Invoice/Quotation info)
      {
        width: '35%',
        stack: [
          { text: title, fontSize: 16, bold: true, alignment: 'right', margin: [0, 5, 0, 2] },
          { text: `${type === 'invoice' ? 'Invoice No' : 'Quotation No'}: ${documentNumber || '-'}`, fontSize: 9, bold: true, alignment: 'right' },
          (document as any).referenceNumber ? { text: `Ref: ${(document as any).referenceNumber}`, fontSize: 9, alignment: 'right' } : {},
          { text: `${dateLabel}: ${formatDate((document as any).date)}`, fontSize: 9, alignment: 'right' },
        ],
        alignment: 'right'
      }
    ],
    margin: [0, 0, 0, 10]
  };
};

// Deprecated builders kept for compatibility if needed, but we will use buildHeader
export const buildCompanyHeader = (company: Company, customization?: InvoiceCustomization): any => {
  return {}; 
};

export const buildInvoiceTitle = (customization?: InvoiceCustomization, type: 'invoice' | 'quotation' = 'invoice'): any => {
  return {};
};

export const buildInvoiceInfo = (
  data: { invoiceNumber?: string; quotationNumber?: string; referenceNumber?: string; date: any; validUntil?: any },
  customization?: InvoiceCustomization,
  type: 'invoice' | 'quotation' = 'invoice'
): any => {
  return {};
};
