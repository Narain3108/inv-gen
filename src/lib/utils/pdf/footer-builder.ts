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
      fontSize: 10,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    {
      columns: [
        {
          width: '50%',
          stack: [
            { text: 'Our Bank Details:', fontSize: 9, bold: true, margin: [0, 0, 0, 3] },
            { text: `Bank: ${company.bankDetails.bankName}`, fontSize: 9 },
            { text: `Account No: ${company.bankDetails.accountNumber}`, fontSize: 9 },
            { text: `IFSC: ${company.bankDetails.ifscCode}`, fontSize: 9 },
            {
              text: company.bankDetails.upiId ? `UPI: ${company.bankDetails.upiId}` : '',
              fontSize: 9,
            },
          ],
        },
      ],
      margin: [0, 0, 0, 20],
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
      fontSize: 10,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    {
      text: termsText,
      fontSize: 9,
      margin: [0, 0, 0, 10],
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
      fontSize: 10,
      bold: true,
      margin: [0, 10, 0, 5],
    },
    {
      text: notesText,
      fontSize: 9,
      margin: [0, 0, 0, 20],
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
        width: 150,
        stack: signatureContent,
      },
    ],
    margin: [0, 20, 0, 0],
  };
};
