/**
 * PDF Footer Section Builder
 */

import { Company } from '@/types';
import { InvoiceCustomization } from '@/types/customization';

/**
 * Build bank details section
 */
export const buildBankDetails = (company: Company, customization?: InvoiceCustomization): any[] => {
  const showBankDetails = customization?.companyDetails?.showBankDetails !== false;

  if (!company.bankDetails || !showBankDetails) {
    return [];
  }

  return [
    {
      text: 'Bank Details:',
      fontSize: 9,
      bold: true,
      margin: [0, 5, 0, 2],
      alignment: 'center'
    },
    {
      columns: [
        {
          width: '100%',
          stack: [
            { text: 'Our Bank Details:', fontSize: 8, bold: true, margin: [0, 0, 0, 2], alignment: 'center' },
            { text: `Bank: ${company.bankDetails.bankName}`, fontSize: 8, alignment: 'center' },
            { text: `Account No: ${company.bankDetails.accountNumber}`, fontSize: 8, alignment: 'center' },
            { text: `IFSC: ${company.bankDetails.ifscCode}`, fontSize: 8, alignment: 'center' },
            {
              text: company.bankDetails.upiId ? `UPI: ${company.bankDetails.upiId}` : '',
              fontSize: 8,
              alignment: 'center'
            },
          ],
          alignment: 'center'
        },
      ],
      margin: [0, 0, 0, 10],
    },
  ];
};

/**
 * Build terms and conditions section
 */
export const buildTermsAndConditions = (customization?: InvoiceCustomization): any[] => {
  const showTerms = customization?.footer?.showTermsAndConditions !== false;
  const termsText = customization?.footer?.termsText;

  if (!showTerms || !termsText) {
    return [];
  }

  return [
    {
      text: 'Terms & Conditions:',
      fontSize: 9,
      bold: true,
      margin: [0, 5, 0, 2],
    },
    {
      text: termsText,
      fontSize: 8,
      margin: [0, 0, 0, 5],
    },
  ];
};

/**
 * Build notes/thank you section
 */
export const buildNotesSection = (customization?: InvoiceCustomization): any[] => {
  const showNotes = customization?.footer?.showThankYouNote !== false;
  const notesText = customization?.footer?.thankYouText;

  if (!showNotes || !notesText) {
    return [];
  }

  return [
    {
      text: 'Notes:',
      fontSize: 9,
      bold: true,
      margin: [0, 5, 0, 2],
    },
    {
      text: notesText,
      fontSize: 8,
      margin: [0, 0, 0, 10],
    },
  ];
};

/**
 * Build signature section
 */
export const buildSignature = (company: Company, customization?: InvoiceCustomization): any => {
  const showSignature = customization?.footer?.showSignature !== false;
  const signatureLabel = customization?.footer?.signatureLabel || 'Authorized Signatory';

  if (!showSignature) {
    return { text: '', margin: [0, 20, 0, 0] };
  }

  // Build signature content - image if available, otherwise text
  const signatureContent: any[] = [];

  // Add signature image if available
  if (company.signatureUrl) {
    signatureContent.push({
      image: company.signatureUrl,
      width: 120,
      height: 40,
      alignment: 'center',
      margin: [0, 0, 0, 5],
    });
  } else {
    // Add space for manual signature if no image
    signatureContent.push({
      text: '____________________',
      fontSize: 9,
      alignment: 'center',
      margin: [0, 30, 0, 5],
    });
  }

  // Add signature label
  signatureContent.push({
    text: signatureLabel,
    fontSize: 9,
    alignment: 'center',
    margin: [0, 0, 0, 2],
  });

  // Add company name
  signatureContent.push({
    text: company.name,
    fontSize: 9,
    bold: true,
    alignment: 'center',
  });

  return {
    columns: [
      { width: '*', text: '' },
      {
        width: 200,
        stack: signatureContent,
      },
    ],
    margin: [0, 10, 0, 0],
  };
};

/**
 * Build horizontal footer section (Bank, Terms, Notes side-by-side)
 */
export const buildHorizontalFooter = (company: Company, customization?: InvoiceCustomization): any => {
  const showBankDetails = customization?.companyDetails?.showBankDetails !== false;
  const showTerms = customization?.footer?.showTermsAndConditions !== false;
  const termsText = customization?.footer?.termsText;
  const showNotes = customization?.footer?.showThankYouNote !== false;
  const notesText = customization?.footer?.thankYouText;

  const columns = [];

  // Bank Details Column
  if (showBankDetails && company.bankDetails) {
    columns.push({
      width: '*',
      stack: [
        // Title with light background to highlight bank subheading
        {
          table: {
            widths: ['*'],
            body: [[{ text: 'Bank Details', fontSize: 9, bold: true, fillColor: '#f3f4f6', margin: [4, 2, 4, 2] }]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 4]
        },
        { text: `Bank: ${company.bankDetails.bankName}`, fontSize: 8 },
        { text: `A/c No: ${company.bankDetails.accountNumber}`, fontSize: 8 },
        { text: `IFSC: ${company.bankDetails.ifscCode}`, fontSize: 8 },
        ...(company.bankDetails.upiId ? [{ text: `UPI: ${company.bankDetails.upiId}`, fontSize: 8 }] : []),
      ]
    });
  }

  // Terms Column
  if (showTerms && termsText) {
    columns.push({
      width: '*',
      stack: [
        { text: 'Terms & Conditions:', fontSize: 9, bold: true, margin: [0, 0, 0, 2] },
        { text: termsText, fontSize: 8 },
      ],
      margin: [10, 0, 0, 0] // Left margin to separate
    });
  }

  // Notes Column
  if (showNotes && notesText) {
    columns.push({
      width: '*',
      stack: [
        { text: 'Notes:', fontSize: 9, bold: true, margin: [0, 0, 0, 2] },
        { text: notesText, fontSize: 8 },
      ],
      margin: [10, 0, 0, 0]
    });
  }

  if (columns.length === 0) return [];

  return {
    columns: columns,
    margin: [0, 10, 0, 5]
  };
};
