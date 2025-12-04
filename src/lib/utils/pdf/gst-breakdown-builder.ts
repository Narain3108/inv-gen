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
    { text: 'GST Rate', fontSize: 8, bold: true, alignment: 'center' },
    { text: 'Taxable Amount', fontSize: 8, bold: true, alignment: 'center' },
  ];

  if (!isInterState) {
    // Intra-state: Show CGST and SGST
    if (showCGST) headers.push({ text: 'CGST', fontSize: 8, bold: true, alignment: 'center' });
    if (showSGST) headers.push({ text: 'SGST', fontSize: 8, bold: true, alignment: 'center' });
  } else {
    // Inter-state: Show IGST
    if (showIGST) headers.push({ text: 'IGST', fontSize: 8, bold: true, alignment: 'center' });
  }

  headers.push({ text: 'Total Tax', fontSize: 8, bold: true, alignment: 'center' });

  // Build table rows
  const rows = data.taxBreakdown.map((breakdown: TaxBreakdown) => {
    const row = [
      { text: `${breakdown.rate}%`, fontSize: 8, alignment: 'center' },
      { text: safeCurrency(breakdown.taxableAmount), fontSize: 8, alignment: 'center' },
    ];

    if (!isInterState) {
      if (showCGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.cgst)} (${breakdown.rate / 2}%)`, 
          fontSize: 8, 
          alignment: 'center' 
        });
      }
      if (showSGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.sgst)} (${breakdown.rate / 2}%)`, 
          fontSize: 8, 
          alignment: 'center' 
        });
      }
    } else {
      if (showIGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.igst)} (${breakdown.rate}%)`, 
          fontSize: 8, 
          alignment: 'center' 
        });
      }
    }

    row.push({ text: safeCurrency(breakdown.totalTax), fontSize: 8, alignment: 'center' } as any);

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
      fontSize: 9,
      bold: true,
      margin: [0, 5, 0, 2],
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
        paddingLeft: () => 4,
        paddingRight: () => 4,
        paddingTop: () => 2,
        paddingBottom: () => 2,
      },
      margin: [0, 0, 0, 5],
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
                  { text: 'Grand Total:', fontSize: 10, bold: true },
                  { text: safeCurrency(data.totalAmount), fontSize: 10, bold: true, alignment: 'right' },
                ],
              ],
            },
            layout: 'noBorders',
          },
        ],
        margin: [0, 2, 0, 5],
      },
    ];
  }

  // Otherwise, return empty (totals-builder will handle it)
  return [];
};
