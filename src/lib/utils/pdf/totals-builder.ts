/**
 * PDF Totals Section Builder
 */

import { Invoice, Quotation } from '@/types';
import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';
import { amountToWords } from '@/lib/utils/number-to-words';
import { buildGSTBreakdownTable, buildSummaryTotals } from './gst-breakdown-builder';

/**
 * Build tax summary/totals section
 */
export const buildTotalsSection = (
  data: Invoice | Quotation,
  customization?: InvoiceCustomization
): any[] => {
  const showTaxable = customization?.totals?.showTaxableAmount !== false;
  const showCGST = customization?.totals?.showCGST !== false;
  const showSGST = customization?.totals?.showSGST !== false;
  const showIGST = customization?.totals?.showIGST !== false;
  const showAmountInWords = customization?.totals?.showAmountInWords !== false;
  const showGSTBreakdown = customization?.totals?.showGSTBreakdown !== false;

  // If GST breakdown is enabled and available, show detailed breakdown
  if (showGSTBreakdown && data.taxBreakdown && data.taxBreakdown.length > 0) {
    return [
      // Detailed GST Breakdown Table
      ...buildGSTBreakdownTable(data, customization),
      
      // Summary Totals (just grand total)
      ...buildSummaryTotals(data, customization),

      // Amount in Words
      ...(showAmountInWords ? [{
        text: `Amount in Words: ${data.totalAmountInWords || amountToWords(data.totalAmount)}`,
        fontSize: 9,
        bold: true,
        margin: [0, 10, 0, 20],
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
              ...(showTaxable ? [[
                { text: 'Taxable Amount:', fontSize: 9 },
                { text: safeCurrency(data.taxableAmount), fontSize: 9, alignment: 'right' },
              ]] : []),
              ...(showCGST && data.cgst > 0 ? [[
                { text: 'CGST:', fontSize: 9 },
                { text: safeCurrency(data.cgst), fontSize: 9, alignment: 'right' },
              ]] : []),
              ...(showSGST && data.sgst > 0 ? [[
                { text: 'SGST:', fontSize: 9 },
                { text: safeCurrency(data.sgst), fontSize: 9, alignment: 'right' },
              ]] : []),
              ...(showIGST && data.igst > 0 ? [[
                { text: 'IGST:', fontSize: 9 },
                { text: safeCurrency(data.igst), fontSize: 9, alignment: 'right' },
              ]] : []),
              [
                { text: 'Total:', fontSize: 11, bold: true },
                { text: safeCurrency(data.totalAmount), fontSize: 11, bold: true, alignment: 'right' },
              ],
            ],
          },
          layout: 'noBorders',
        },
      ],
      margin: [0, 10, 0, 10],
    },

    // Amount in Words
    ...(showAmountInWords ? [{
      text: `Amount in Words: ${data.totalAmountInWords || amountToWords(data.totalAmount)}`,
      fontSize: 9,
      bold: true,
      margin: [0, 10, 0, 20],
    }] : []),
  ];
};
