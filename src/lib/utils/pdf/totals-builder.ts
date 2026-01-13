/**
 * PDF Totals Section Builder
 */

import { Invoice, Quotation } from '@/types';
import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';
import { amountToWords } from '@/lib/utils/number-to-words';
import { buildGSTBreakdownTable } from './gst-breakdown-builder';

/**
 * Build tax summary/totals section
 */
export const buildTotalsSection = (
  data: Invoice | Quotation,
  customization?: InvoiceCustomization
): any[] => {
  // Fixed Layout: Always show standard tax fields
  const showGSTBreakdown = customization?.totals?.showGSTBreakdown !== false;
  // Always show Amount in Words
  const showAmountInWords = true;

  // If GST breakdown is enabled and available, show detailed breakdown
  if (showGSTBreakdown && data.taxBreakdown && data.taxBreakdown.length > 0) {
    return [
      // Detailed GST Breakdown Table (includes mini totals on the right)
      ...buildGSTBreakdownTable(data, customization),

      // Amount in Words
      ...(showAmountInWords ? [{
        text: `Amount in Words: ${data.totalAmountInWords || amountToWords(data.totalAmount)}`,
        fontSize: 8,
        bold: true,
        margin: [0, 5, 0, 10],
      }] : []),
    ];
  }

  // Otherwise, show simple totals (legacy format)
  return [
    // Tax Summary
    {
      columns: [
        { width: '*', text: '' },
        {
          width: 250,
          table: {
            widths: ['*', 80],
            body: [
              // Always show Taxable Amount
              [{
                text: 'Taxable Amount:', fontSize: 8, alignment: 'center'
              },
              { text: safeCurrency(data.taxableAmount), fontSize: 8, alignment: 'center' }],

              // Show taxes if > 0
              ...(data.cgst > 0 ? [[
                { text: 'CGST:', fontSize: 8, alignment: 'center' },
                { text: safeCurrency(data.cgst), fontSize: 8, alignment: 'center' },
              ]] : []),
              ...(data.sgst > 0 ? [[
                { text: 'SGST:', fontSize: 8, alignment: 'center' },
                { text: safeCurrency(data.sgst), fontSize: 8, alignment: 'center' },
              ]] : []),
              ...(data.igst > 0 ? [[
                { text: 'IGST:', fontSize: 8, alignment: 'center' },
                { text: safeCurrency(data.igst), fontSize: 8, alignment: 'center' },
              ]] : []),
              [
                { text: 'Total:', fontSize: 10, bold: true, fillColor: '#f3f4f6', alignment: 'center' },
                { text: safeCurrency(data.totalAmount), fontSize: 10, bold: true, alignment: 'center', fillColor: '#f3f4f6' },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
      margin: [0, 5, 0, 5],
    },

    // Amount in Words
    ...(showAmountInWords ? [{
      text: `Amount in Words: ${data.totalAmountInWords || amountToWords(data.totalAmount)}`,
      fontSize: 8,
      bold: true,
      margin: [0, 5, 0, 10],
    }] : []),
  ];
};
