/**
 * PDF Generation Helper
 * Generate and download PDFs from invoice data stored in Firestore
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Invoice, Company, Client } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { amountToWords } from '@/lib/utils/number-to-words';

// Initialize pdfMake fonts
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = (pdfFonts as any).pdfMake?.vfs || {};
}

interface InvoicePDFData {
  invoice: Invoice;
  company: Company;
  client: Client;
}

/**
 * Generate PDF from invoice data
 */
export function generateInvoicePDF(data: InvoicePDFData): void {
  const { invoice, company, client } = data;

  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Header with company logo and details
      {
        columns: [
          company.logoUrl
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
                color: '#3b82f6',
                alignment: 'center',
                width: 100,
              },
          {
            width: '*',
            stack: [
              { text: company.name, fontSize: 18, bold: true },
              { text: company.address.street, fontSize: 9, margin: [0, 2, 0, 0] },
              {
                text: `${company.address.city}, ${company.address.state} - ${company.address.pincode}`,
                fontSize: 9,
              },
              { text: company.gstin ? `GSTIN: ${company.gstin}` : '', fontSize: 9, margin: [0, 2, 0, 0] },
              { text: `Phone: ${company.contact.phone}`, fontSize: 9 },
              { text: `Email: ${company.contact.email}`, fontSize: 9 },
              { text: `Place of Supply: ${company.address.state}`, fontSize: 9, margin: [0, 2, 0, 0], bold: true },
            ],
            alignment: 'right',
          },
        ],
      },

      // Invoice Title
      {
        text: 'TAX INVOICE',
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 20],
      },

      // Invoice and Client Details
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Bill To:', fontSize: 10, bold: true, margin: [0, 0, 0, 5] },
              { text: client.clientName, fontSize: 11, bold: true },
              { text: client.address.street, fontSize: 9 },
              {
                text: `${client.address.city}, ${client.address.state} - ${client.address.pincode}`,
                fontSize: 9,
              },
              {
                text: client.gstin ? `GSTIN: ${client.gstin}` : '',
                fontSize: 9,
                margin: [0, 2, 0, 0],
              },
              { text: `Phone: ${client.contact.phone}`, fontSize: 9 },
              { text: `Place of Supply: ${client.address.state}`, fontSize: 9, margin: [0, 4, 0, 0], bold: true },
            ],
          },
          {
            width: '50%',
            stack: [
              {
                text: [
                  { text: 'Invoice No: ', fontSize: 9 },
                  { text: invoice.invoiceNumber, fontSize: 9, bold: true },
                ],
                alignment: 'right',
              },
              {
                text: [
                  { text: 'Date: ', fontSize: 9 },
                  { text: invoice.date?.toDate ? formatDate(invoice.date.toDate()) : 'N/A', fontSize: 9, bold: true },
                ],
                alignment: 'right',
                margin: [0, 2, 0, 0],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Invoice Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 40, 30, 50, 40, 40, 40, 60],
          body: [
            // Header
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'HSN', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader' },
              { text: 'Rate', style: 'tableHeader' },
              { text: 'Disc', style: 'tableHeader' },
              { text: 'GST %', style: 'tableHeader' },
              { text: 'Tax', style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader' },
            ],
            // Items
            ...invoice.items.map((item) => [
              { text: item.description, fontSize: 9 },
              { text: item.hsn, fontSize: 9, alignment: 'center' },
              { text: `${item.quantity} ${item.unit}`, fontSize: 9, alignment: 'center' },
              { text: formatCurrency(item.unitPrice), fontSize: 9, alignment: 'right' },
              { text: item.discount ? `${item.discount}%` : '-', fontSize: 9, alignment: 'center' },
              { text: `${item.gstRate}%`, fontSize: 9, alignment: 'center' },
              { text: formatCurrency(item.cgst + item.sgst + item.igst), fontSize: 9, alignment: 'right' },
              { text: formatCurrency(item.lineTotal), fontSize: 9, alignment: 'right' },
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
      },

      // Tax Summary
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 250,
            table: {
              widths: ['*', 80],
              body: [
                [
                  { text: 'Taxable Amount:', fontSize: 9 },
                  { text: formatCurrency(invoice.taxableAmount), fontSize: 9, alignment: 'right' },
                ],
                ...(invoice.cgst > 0
                  ? [
                      [
                        { text: 'CGST:', fontSize: 9 },
                        { text: formatCurrency(invoice.cgst), fontSize: 9, alignment: 'right' },
                      ],
                      [
                        { text: 'SGST:', fontSize: 9 },
                        { text: formatCurrency(invoice.sgst), fontSize: 9, alignment: 'right' },
                      ],
                    ]
                  : []),
                ...(invoice.igst > 0
                  ? [
                      [
                        { text: 'IGST:', fontSize: 9 },
                        { text: formatCurrency(invoice.igst), fontSize: 9, alignment: 'right' },
                      ],
                    ]
                  : []),
                [
                  { text: 'Total:', fontSize: 11, bold: true },
                  { text: formatCurrency(invoice.totalAmount), fontSize: 11, bold: true, alignment: 'right' },
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 10, 0, 10],
      },

      // Amount in Words
      {
        text: `Amount in Words: ${invoice.totalAmountInWords || amountToWords(invoice.totalAmount)}`,
        fontSize: 9,
        bold: true,
        margin: [0, 10, 0, 20],
      },

      // Bank Details
      ...(company.bankDetails || client.bankDetails
        ? [
            {
              text: 'Bank Details:',
              fontSize: 10,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              columns: [
                // Company Bank Details
                ...(company.bankDetails
                  ? [
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
                    ]
                  : []),
                // Client Bank Details
                ...(client.bankDetails
                  ? [
                      {
                        width: company.bankDetails ? '50%' : '100%',
                        stack: [
                          { text: 'Client Bank Details:', fontSize: 9, bold: true, margin: [0, 0, 0, 3] },
                          { text: `Bank: ${client.bankDetails.bankName}`, fontSize: 9 },
                          { text: `Account No: ${client.bankDetails.accountNumber}`, fontSize: 9 },
                          { text: `IFSC: ${client.bankDetails.ifscCode}`, fontSize: 9 },
                          {
                            text: client.bankDetails.upiId ? `UPI: ${client.bankDetails.upiId}` : '',
                            fontSize: 9,
                          },
                        ],
                      },
                    ]
                  : []),
              ],
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Terms and Conditions
      ...(invoice.terms
        ? [
            {
              text: 'Terms & Conditions:',
              fontSize: 10,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              text: invoice.terms || '',
              fontSize: 9,
              margin: [0, 0, 0, 10],
            },
          ]
        : []),

      // Notes
      ...(invoice.notes
        ? [
            {
              text: 'Notes:',
              fontSize: 10,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              text: invoice.notes || '',
              fontSize: 9,
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Signature
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 150,
            stack: [
              { text: 'Authorized Signatory', fontSize: 9, alignment: 'center', margin: [0, 40, 0, 0] },
              { text: company.name, fontSize: 9, bold: true, alignment: 'center' },
            ],
          },
        ],
        margin: [0, 20, 0, 0],
      },
    ],
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: 'black',
        fillColor: '#f3f4f6',
        alignment: 'center',
      },
    },
  };

  // Generate and download PDF
  pdfMake.createPdf(docDefinition).download(`Invoice_${invoice.invoiceNumber}.pdf`);
}

/**
 * Open PDF in new tab for preview
 */
export function previewInvoicePDF(data: InvoicePDFData): void {
  const { invoice, company, client } = data;
  
  const docDefinition: any = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Header with company logo and details
      {
        columns: [
          company.logoUrl
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
                color: '#3b82f6',
                alignment: 'center',
                width: 100,
              },
          {
            width: '*',
            stack: [
              { text: company.name, fontSize: 18, bold: true },
              { text: company.address.street, fontSize: 9, margin: [0, 2, 0, 0] },
              {
                text: `${company.address.city}, ${company.address.state} - ${company.address.pincode}`,
                fontSize: 9,
              },
              { text: company.gstin ? `GSTIN: ${company.gstin}` : '', fontSize: 9, margin: [0, 2, 0, 0] },
              { text: `Phone: ${company.contact.phone}`, fontSize: 9 },
              { text: `Email: ${company.contact.email}`, fontSize: 9 },
            ],
            alignment: 'right',
          },
        ],
      },

      // Invoice Title
      {
        text: 'TAX INVOICE',
        fontSize: 20,
        bold: true,
        alignment: 'center',
        margin: [0, 20, 0, 20],
      },

      // Invoice and Client Details
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Bill To:', fontSize: 10, bold: true, margin: [0, 0, 0, 5] },
              { text: client.clientName, fontSize: 11, bold: true },
              { text: client.address.street, fontSize: 9 },
              {
                text: `${client.address.city}, ${client.address.state} - ${client.address.pincode}`,
                fontSize: 9,
              },
              {
                text: client.gstin ? `GSTIN: ${client.gstin}` : '',
                fontSize: 9,
                margin: [0, 2, 0, 0],
              },
              { text: `Phone: ${client.contact.phone}`, fontSize: 9 },
              { text: `Place of Supply: ${client.address.state}`, fontSize: 9, margin: [0, 4, 0, 0], bold: true },
            ],
          },
          {
            width: '50%',
            stack: [
              {
                text: [
                  { text: 'Invoice No: ', fontSize: 9 },
                  { text: invoice.invoiceNumber, fontSize: 9, bold: true },
                ],
                alignment: 'right',
              },
              {
                text: [
                  { text: 'Date: ', fontSize: 9 },
                  { text: invoice.date?.toDate ? formatDate(invoice.date.toDate()) : 'N/A', fontSize: 9, bold: true },
                ],
                alignment: 'right',
                margin: [0, 2, 0, 0],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },

      // Invoice Items Table
      {
        table: {
          headerRows: 1,
          widths: ['*', 40, 30, 50, 40, 40, 40, 60],
          body: [
            // Header
            [
              { text: 'Description', style: 'tableHeader' },
              { text: 'HSN', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader' },
              { text: 'Rate', style: 'tableHeader' },
              { text: 'Disc', style: 'tableHeader' },
              { text: 'GST %', style: 'tableHeader' },
              { text: 'Tax', style: 'tableHeader' },
              { text: 'Amount', style: 'tableHeader' },
            ],
            // Items
            ...invoice.items.map((item) => [
              { text: item.description, fontSize: 9 },
              { text: item.hsn, fontSize: 9, alignment: 'center' },
              { text: item.quantity.toString(), fontSize: 9, alignment: 'center' },
              { text: formatCurrency(item.unitPrice), fontSize: 9, alignment: 'right' },
              { text: `${item.discount || 0}%`, fontSize: 9, alignment: 'center' },
              { text: `${item.gstRate}%`, fontSize: 9, alignment: 'center' },
              {
                text: formatCurrency(item.cgst + item.sgst + item.igst + (item.cess || 0)),
                fontSize: 9,
                alignment: 'right',
              },
              { text: formatCurrency(item.lineTotal), fontSize: 9, alignment: 'right' },
            ]),
          ],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
      },

      // Tax Summary
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 250,
            table: {
              widths: ['*', 80],
              body: [
                [
                  { text: 'Taxable Amount:', fontSize: 9 },
                  { text: formatCurrency(invoice.taxableAmount), fontSize: 9, alignment: 'right' },
                ],
                ...(invoice.cgst > 0
                  ? [
                      [
                        { text: 'CGST:', fontSize: 9 },
                        { text: formatCurrency(invoice.cgst), fontSize: 9, alignment: 'right' },
                      ],
                      [
                        { text: 'SGST:', fontSize: 9 },
                        { text: formatCurrency(invoice.sgst), fontSize: 9, alignment: 'right' },
                      ],
                    ]
                  : []),
                ...(invoice.igst > 0
                  ? [
                      [
                        { text: 'IGST:', fontSize: 9 },
                        { text: formatCurrency(invoice.igst), fontSize: 9, alignment: 'right' },
                      ],
                    ]
                  : []),
                [
                  { text: 'Total:', fontSize: 11, bold: true },
                  { text: formatCurrency(invoice.totalAmount), fontSize: 11, bold: true, alignment: 'right' },
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 10, 0, 10],
      },

      // Amount in Words
      {
        text: `Amount in Words: ${invoice.totalAmountInWords || amountToWords(invoice.totalAmount)}`,
        fontSize: 9,
        bold: true,
        margin: [0, 10, 0, 20],
      },

      // Bank Details
      ...(company.bankDetails || client.bankDetails
        ? [
            {
              text: 'Bank Details:',
              fontSize: 10,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              columns: [
                ...(company.bankDetails
                  ? [
                      {
                        width: client.bankDetails ? '50%' : '100%',
                        stack: [
                          { text: 'Our Bank Details:', fontSize: 9, bold: true, margin: [0, 0, 0, 3] },
                          { text: `Bank: ${company.bankDetails.bankName}`, fontSize: 9 },
                          { text: `Account No: ${company.bankDetails.accountNumber}`, fontSize: 9 },
                          { text: `IFSC: ${company.bankDetails.ifscCode}`, fontSize: 9 },
                          ...(company.bankDetails.accountHolderName
                            ? [{ text: `Account Holder: ${company.bankDetails.accountHolderName}`, fontSize: 9 }]
                            : []),
                          ...(company.bankDetails.upiId
                            ? [{ text: `UPI: ${company.bankDetails.upiId}`, fontSize: 9 }]
                            : []),
                        ],
                      },
                    ]
                  : []),
                ...(client.bankDetails
                  ? [
                      {
                        width: company.bankDetails ? '50%' : '100%',
                        stack: [
                          { text: 'Client Bank Details:', fontSize: 9, bold: true, margin: [0, 0, 0, 3] },
                          { text: `Bank: ${client.bankDetails.bankName}`, fontSize: 9 },
                          { text: `Account No: ${client.bankDetails.accountNumber}`, fontSize: 9 },
                          { text: `IFSC: ${client.bankDetails.ifscCode}`, fontSize: 9 },
                          ...(client.bankDetails.accountHolderName
                            ? [{ text: `Account Holder: ${client.bankDetails.accountHolderName}`, fontSize: 9 }]
                            : []),
                          ...(client.bankDetails.upiId
                            ? [{ text: `UPI: ${client.bankDetails.upiId}`, fontSize: 9 }]
                            : []),
                        ],
                      },
                    ]
                  : []),
              ],
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Terms and Conditions
      ...(invoice.terms
        ? [
            {
              text: 'Terms & Conditions:',
              fontSize: 10,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              text: invoice.terms || '',
              fontSize: 9,
              margin: [0, 0, 0, 10],
            },
          ]
        : []),

      // Notes
      ...(invoice.notes
        ? [
            {
              text: 'Notes:',
              fontSize: 10,
              bold: true,
              margin: [0, 10, 0, 5],
            },
            {
              text: invoice.notes || '',
              fontSize: 9,
              margin: [0, 0, 0, 20],
            },
          ]
        : []),

      // Signature
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 150,
            stack: [
              { text: 'Authorized Signatory', fontSize: 9, alignment: 'center', margin: [0, 40, 0, 0] },
              { text: company.name, fontSize: 9, bold: true, alignment: 'center' },
            ],
          },
        ],
        margin: [0, 20, 0, 0],
      },
    ],
    styles: {
      tableHeader: {
        bold: true,
        fontSize: 9,
        color: 'black',
        fillColor: '#f3f4f6',
        alignment: 'center',
      },
    },
  };

  pdfMake.createPdf(docDefinition).open();
}
