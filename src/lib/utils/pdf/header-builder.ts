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
  // Customization Flags (default to true if undefined)
  const showLogo = customization?.companyDetails?.showLogo !== false;
  const showName = customization?.companyDetails?.showName !== false;
  const showAddress = customization?.companyDetails?.showAddress !== false;
  const showGSTIN = customization?.companyDetails?.showGSTIN !== false;
  const showPhone = customization?.companyDetails?.showPhone !== false;
  const showEmail = customization?.companyDetails?.showEmail !== false;

  const headerTitle = customization?.header?.title || (type === 'invoice' ? 'TAX INVOICE' : 'QUOTATION');
  const titleFontSize = customization?.header?.fontSize === 'small' ? 14 : customization?.header?.fontSize === 'large' ? 22 : 18;

  const title = headerTitle;
  const documentNumber = type === 'invoice' ? (document as Invoice).invoiceNumber : (document as Quotation).quotationNumber;
  const dateLabel = customization?.header?.dateLabel || (type === 'invoice' ? 'Invoice Date' : 'Date');

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
            : showLogo && !company.logoUrl ? {
              text: (company.name || '').substring(0, 2).toUpperCase(),
              fontSize: 32,
              bold: true,
              color: customization?.colorScheme?.primary || '#3b82f6',
              alignment: 'left',
              width: 80,
            } : {}
        ],
        alignment: 'left'
      },

      // Middle Column: Company name, address, GSTIN, contact
      {
        width: '45%',
        stack: [
          showName ? { text: company.name || '', fontSize: 12, bold: true, alignment: 'left' } : {},
          showAddress && company.address?.street ? { text: company.address.street, fontSize: 9, alignment: 'left' } : {},
          showAddress && (company.address?.city || company.address?.state || company.address?.pincode)
            ? { text: `${company.address?.city || ''}${company.address?.city ? ', ' : ''}${company.address?.state || ''}${company.address?.pincode ? ' - ' + company.address?.pincode : ''}`, fontSize: 9, alignment: 'left' }
            : {},
          showGSTIN && company.gstin ? { text: `GSTIN: ${company.gstin}`, fontSize: 9, alignment: 'left' } : {},
          showEmail && company.contact?.email ? { text: `Email: ${company.contact.email}`, fontSize: 9, alignment: 'left' } : {},
          showPhone && company.contact?.phone ? { text: `Phone: ${company.contact.phone}`, fontSize: 9, alignment: 'left' } : {},
        ],
        alignment: 'center'
      },

      // Right Column: Title and Document Details (Invoice/Quotation info)
      {
        width: '35%',
        stack: [
          { text: title, fontSize: titleFontSize, bold: true, alignment: 'right', margin: [0, 5, 0, 2] },
          customization?.header?.showInvoiceNumber !== false ? { text: `${type === 'invoice' ? (customization?.header?.invoiceNumberLabel || 'Invoice No') : 'Quotation No'}: ${documentNumber || '-'}`, fontSize: 9, bold: true, alignment: 'right' } : {},
          // PO Number and PO Date (only for invoices, only if present)
          ...(type === 'invoice' && (document as Invoice).poNumber ? [
            { text: `PO No: ${(document as Invoice).poNumber}${(document as Invoice).poDate ? ' | Date: ' + formatDate((document as Invoice).poDate!) : ''}`, fontSize: 9, alignment: 'right' }
          ] : []),
          // E-way Number (only for invoices). If empty, render a fixed-width NBSP placeholder
          ...(type === 'invoice' ? [
            (() => {
              const raw = (document as Invoice).ewayNumber;
              const display = raw && String(raw).trim() ? String(raw).trim() : '\u00A0\u00A0\u00A0\u00A0\u00A0';
              // Render E-way in a two-column block constrained to a small fixed width on the right side
              // This prevents the E-way label from appearing flush to the extreme page edge when empty.
              return {
                columns: [
                  { width: '*', text: '' }, // flexible spacer
                  { width: 120, text: `E-way No: ${display}`, fontSize: 9, alignment: 'right' }
                ],
                columnGap: 6
              };
            })()
          ] : []),
          (document as any).referenceNumber ? { text: `Ref: ${(document as any).referenceNumber}`, fontSize: 9, alignment: 'right' } : {},
          customization?.header?.showDate !== false ? { text: `${dateLabel}: ${formatDate((document as any).date)}`, fontSize: 9, alignment: 'right' } : {},
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
