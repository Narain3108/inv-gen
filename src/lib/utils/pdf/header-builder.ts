/**
 * PDF Header Section Builder
 */

import { Company, Client, Invoice, Quotation } from '@/types';
import { InvoiceCustomization } from '@/types/customization';
import { formatDate } from '@/utils/formatters';
import { getFontSize } from './helpers';

/**
 * Build company header section
 */
export const buildCompanyHeader = (company: Company, customization?: InvoiceCustomization): any => {
  const showLogo = customization?.companyDetails?.showLogo !== false;
  const showAddress = customization?.companyDetails?.showAddress !== false;
  const showGSTIN = customization?.companyDetails?.showGSTIN !== false;
  const showPhone = customization?.companyDetails?.showPhone !== false;
  const showEmail = customization?.companyDetails?.showEmail !== false;

  return {
    columns: [
      showLogo && company.logoUrl
        ? {
            image: company.logoUrl,
            width: 80,
            height: 80,
            alignment: 'left',
          }
        : {
            text: company.name.substring(0, 2).toUpperCase(),
            fontSize: 32,
            bold: true,
            color: customization?.colorScheme?.primary || '#3b82f6',
            alignment: 'center',
            width: 100,
          },
      {
        width: '*',
        stack: [
          { text: company.name, fontSize: 18, bold: true },
          ...(showAddress ? [
            { text: company.address.street, fontSize: 9, margin: [0, 2, 0, 0] },
            {
              text: `${company.address.city}, ${company.address.state} - ${company.address.pincode}`,
              fontSize: 9,
            },
          ] : []),
          ...(showGSTIN && company.gstin ? [{
            text: `GSTIN: ${company.gstin}`,
            fontSize: 9,
            margin: [0, 2, 0, 0]
          }] : []),
          ...(showPhone ? [{
            text: `Phone: ${company.contact.phone}`,
            fontSize: 9
          }] : []),
          ...(showEmail ? [{
            text: `Email: ${company.contact.email}`,
            fontSize: 9
          }] : []),
          {
            text: `Place of Supply: ${company.address.state}`,
            fontSize: 9,
            margin: [0, 2, 0, 0],
            bold: true
          },
        ],
        alignment: 'right',
      },
    ],
  };
};

/**
 * Build invoice title section
 */
export const buildInvoiceTitle = (customization?: InvoiceCustomization, type: 'invoice' | 'quotation' = 'invoice'): any => {
  const defaultTitle = type === 'invoice' ? 'TAX INVOICE' : 'QUOTATION';
  const title = customization?.header?.title || defaultTitle;
  const fontSize = getFontSize(customization?.header?.fontSize, 20);

  return {
    text: title,
    fontSize,
    bold: true,
    alignment: 'center',
    margin: [0, 20, 0, 15],
    color: customization?.colorScheme?.primary || '#000000',
  };
};

/**
 * Build invoice number and date section
 */
export const buildInvoiceInfo = (
  data: { invoiceNumber?: string; quotationNumber?: string; date: any; validUntil?: any },
  customization?: InvoiceCustomization,
  type: 'invoice' | 'quotation' = 'invoice'
): any => {
  const showNumber = customization?.header?.showInvoiceNumber !== false;
  const showDate = customization?.header?.showDate !== false;
  const showDueDate = customization?.header?.showDueDate !== false;

  const numberLabel = customization?.header?.invoiceNumberLabel || (type === 'invoice' ? 'Invoice No' : 'Quotation No');
  const dateLabel = customization?.header?.dateLabel || 'Date';
  const dueDateLabel = customization?.header?.dueDateLabel || (type === 'quotation' ? 'Valid Until' : 'Due Date');

  const number = type === 'invoice' ? data.invoiceNumber : data.quotationNumber;

  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        stack: [
          ...(showNumber && number ? [{
            text: [
              { text: `${numberLabel}: `, fontSize: 10, color: '#4b5563' },
              { text: number, fontSize: 10, bold: true },
            ],
            alignment: 'right',
          }] : []),
          ...(showDate ? [{
            text: [
              { text: `${dateLabel}: `, fontSize: 10, color: '#4b5563' },
              { text: data.date?.toDate ? formatDate(data.date.toDate()) : 'N/A', fontSize: 10, bold: true },
            ],
            alignment: 'right',
            margin: [0, 3, 0, 0],
          }] : []),
          ...(showDueDate && data.validUntil ? [{
            text: [
              { text: `${dueDateLabel}: `, fontSize: 10, color: '#4b5563' },
              { text: data.validUntil?.toDate ? formatDate(data.validUntil.toDate()) : 'N/A', fontSize: 10, bold: true },
            ],
            alignment: 'right',
            margin: [0, 3, 0, 0],
          }] : []),
        ],
      },
    ],
    margin: [0, 0, 0, 15],
  };
};
