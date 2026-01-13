/**
 * PDF Footer Section Builder
 */

import { Company } from '@/types';
import { InvoiceCustomization } from '@/types/customization';

/**
 * Build bank details section
 */
export const buildBankDetails = (company: Company, customization?: InvoiceCustomization): any[] => {
  // Customization Flag (default to true if undefined)
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
          // build stack dynamically to include only present fields
          stack: [
            ((): any => {
              const stack: any[] = [];
              stack.push({ text: 'Our Bank Details:', fontSize: 8, bold: true, margin: [0, 0, 0, 2], alignment: 'center' });
              if (company.bankDetails.bankName) stack.push({ text: `Bank: ${company.bankDetails.bankName}`, fontSize: 8, alignment: 'center' });
              if (company.bankDetails.accountHolderName) stack.push({ text: `Account Holder: ${company.bankDetails.accountHolderName}`, fontSize: 8, alignment: 'center' });
              if (company.bankDetails.accountNumber) stack.push({ text: `Account No: ${company.bankDetails.accountNumber}`, fontSize: 8, alignment: 'center' });
              if (company.bankDetails.ifscCode) stack.push({ text: `IFSC: ${company.bankDetails.ifscCode}`, fontSize: 8, alignment: 'center' });
              if (company.bankDetails.upiId) stack.push({ text: `UPI: ${company.bankDetails.upiId}`, fontSize: 8, alignment: 'center' });
              return stack;
            })(),
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
export const buildTermsAndConditions = (customization?: InvoiceCustomization, company?: Company): any[] => {
  const showTerms = customization?.footer?.showTermsAndConditions !== false;
  // Use customization text, or fallback to company terms if empty/undefined
  const termsText = customization?.footer?.termsText || company?.termsAndConditions;

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

// Note: buildNotesSection removed as per user request to not use notes/thank you text.

/**
 * Build bank details section
 */
// ... (keeping existing buildBankDetails)
// Actually I need to be careful not to delete buildBankDetails or buildTermsAndConditions which are above.
// I will target the specific lines for buildNotesSection and buildHorizontalFooter updates.

// Removing buildNotesSection function completely.
// And updating buildHorizontalFooter.

/**
 * Build signature section
 */
export const buildSignature = (company: Company, customization?: InvoiceCustomization): any => {
  // Customization Flag (default to true if undefined)
  const showSignature = customization?.footer?.showSignature !== false;
  const signatureLabel = customization?.footer?.signatureLabel || 'Authorized Signatory';

  if (!showSignature) {
    return { text: '', margin: [0, 20, 0, 0] };
  }

  // Build signature content - image if available, otherwise text
  const signatureContent: any[] = [];

  // Add 'For: <Company Name>' above signature image (as per design)
  signatureContent.push({
    text: `For: ${company.name}`,
    fontSize: 9,
    bold: true,
    alignment: 'center',
    margin: [0, 0, 0, 6],
  });

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

  // Add signature label below signature
  signatureContent.push({
    text: signatureLabel,
    fontSize: 9,
    alignment: 'center',
    margin: [0, 0, 0, 2],
  });

  // Build left remarks column (small text), align vertically with signature
  const remarksText = customization?.footer?.remarksText ?? 'Remarks:';
  const leftColumn = {
    width: '*',
    stack: [
      { text: remarksText, fontSize: 9, italics: false, margin: [0, 6, 0, 0] }
    ],
    alignment: 'left'
  };

  return {
    columns: [
      leftColumn,
      {
        width: 200,
        stack: signatureContent,
      },
    ],
    margin: [0, 10, 0, 0],
  };
};

/**
 * Build horizontal footer section (Bank, Terms side-by-side)
 */
export const buildHorizontalFooter = (company: Company, customization?: InvoiceCustomization): any => {
  const showBankDetails = customization?.companyDetails?.showBankDetails !== false;
  const showTerms = customization?.footer?.showTermsAndConditions !== false;
  // Fallback to company terms if customization is empty
  const termsText = customization?.footer?.termsText || company.termsAndConditions;

  // Ensure a two-column layout: Terms (left) and Bank Details (right).
  // If either is missing, keep an empty placeholder so bank header doesn't span full width.
  const leftColumn = (showTerms && termsText) ? {
    width: '50%',
    stack: [
      { text: 'Terms & Conditions:', fontSize: 9, bold: true, margin: [0, 0, 0, 2] },
      { text: termsText, fontSize: 8 },
    ],
    margin: [0, 0, 10, 0]
  } : { width: '50%', text: '' };

  const rightColumn = (showBankDetails && company.bankDetails) ? {
    width: '50%',
    stack: [
      {
        table: {
          widths: ['*'],
          body: [[{ text: 'Bank Details', fontSize: 9, bold: true, fillColor: '#f3f4f6', margin: [4, 2, 4, 2] }]]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 4]
      },
      // dynamically include only present fields (right-aligned)
      ...(company.bankDetails.bankName ? [{ text: `Bank: ${company.bankDetails.bankName}`, fontSize: 8, alignment: 'right' }] : []),
      ...(company.bankDetails.accountHolderName ? [{ text: `Account Holder: ${company.bankDetails.accountHolderName}`, fontSize: 8, alignment: 'right' }] : []),
      ...(company.bankDetails.accountNumber ? [{ text: `A/c No: ${company.bankDetails.accountNumber}`, fontSize: 8, alignment: 'right' }] : []),
      ...(company.bankDetails.ifscCode ? [{ text: `IFSC: ${company.bankDetails.ifscCode}`, fontSize: 8, alignment: 'right' }] : []),
      ...(company.bankDetails.upiId ? [{ text: `UPI: ${company.bankDetails.upiId}`, fontSize: 8, alignment: 'right' }] : []),
    ],
    margin: [10, 0, 0, 0]
  } : { width: '50%', text: '' };

  const columns = [leftColumn, rightColumn];

  if (columns.length === 0) return [];

  return {
    columns: columns,
    margin: [0, 10, 0, 5]
  };
};
