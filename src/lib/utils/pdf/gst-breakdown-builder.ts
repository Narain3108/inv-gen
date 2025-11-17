/**
 * PDF GST Breakdown Builder
 * Creates detailed GST breakdown table by tax rate
 */

import { Invoice, Quotation, TaxBreakdown } from '@/types';
import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';

/**
 * Build GST breakdown table showing CGST/SGST/IGST for each rate
 */
export const buildGSTBreakdownTable = (
  data: Invoice | Quotation,
  customization?: InvoiceCustomization
): any[] => {
  // Check if GST breakdown should be shown
  const showGSTBreakdown = customization?.totals?.showGSTBreakdown !== false;
  const showCGST = customization?.totals?.showCGST !== false;
  const showSGST = customization?.totals?.showSGST !== false;
  const showIGST = customization?.totals?.showIGST !== false;

  // Return empty if no breakdown or disabled
  if (!showGSTBreakdown || !data.taxBreakdown || data.taxBreakdown.length === 0) {
    return [];
  }

  const isInterState = data.igst > 0;

  // Build table headers
  const headers = [
    { text: 'GST Rate', fontSize: 9, bold: true, alignment: 'center' },
    { text: 'Taxable Amount', fontSize: 9, bold: true, alignment: 'right' },
  ];

  if (!isInterState) {
    // Intra-state: Show CGST and SGST
    if (showCGST) headers.push({ text: 'CGST', fontSize: 9, bold: true, alignment: 'right' });
    if (showSGST) headers.push({ text: 'SGST', fontSize: 9, bold: true, alignment: 'right' });
  } else {
    // Inter-state: Show IGST
    if (showIGST) headers.push({ text: 'IGST', fontSize: 9, bold: true, alignment: 'right' });
  }

  headers.push({ text: 'Total Tax', fontSize: 9, bold: true, alignment: 'right' });

  // Build table rows
  const rows = data.taxBreakdown.map((breakdown: TaxBreakdown) => {
    const row = [
      { text: `${breakdown.rate}%`, fontSize: 9, alignment: 'center' },
      { text: safeCurrency(breakdown.taxableAmount), fontSize: 9, alignment: 'right' },
    ];

    if (!isInterState) {
      if (showCGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.cgst)} (${breakdown.rate / 2}%)`, 
          fontSize: 9, 
          alignment: 'right' 
        });
      }
      if (showSGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.sgst)} (${breakdown.rate / 2}%)`, 
          fontSize: 9, 
          alignment: 'right' 
        });
      }
    } else {
      if (showIGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.igst)} (${breakdown.rate}%)`, 
          fontSize: 9, 
          alignment: 'right' 
        });
      }
    }

    row.push({ text: safeCurrency(breakdown.totalTax), fontSize: 9, alignment: 'right' } as any);

    return row;
  });

  // Calculate column widths based on what's shown
  let widths: any[] = [60, 80];
  if (!isInterState) {
    if (showCGST) widths.push(80);
    if (showSGST) widths.push(80);
  } else {
    if (showIGST) widths.push(80);
  }
  widths.push(70);

  return [
    {
      text: 'GST Breakdown',
      fontSize: 10,
      bold: true,
      margin: [0, 15, 0, 5],
    },
    {
      table: {
        headerRows: 1,
        widths,
        body: [headers, ...rows],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return rowIndex === 0 ? '#f3f4f6' : null;
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 10],
    },
  ];
};

/**
 * Build summary totals (used after GST breakdown)
 */
export const buildSummaryTotals = (
  data: Invoice | Quotation,
  customization?: InvoiceCustomization
): any[] => {
  const showGSTBreakdown = customization?.totals?.showGSTBreakdown !== false;

  // If GST breakdown is shown, only show grand total in summary
  if (showGSTBreakdown && data.taxBreakdown && data.taxBreakdown.length > 0) {
    return [
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 250,
            table: {
              widths: ['*', 80],
              body: [
                [
                  { text: 'Grand Total:', fontSize: 11, bold: true },
                  { text: safeCurrency(data.totalAmount), fontSize: 11, bold: true, alignment: 'right' },
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 5, 0, 10],
      },
    ];
  }

  // Otherwise, return empty (totals-builder will handle it)
  return [];
};
