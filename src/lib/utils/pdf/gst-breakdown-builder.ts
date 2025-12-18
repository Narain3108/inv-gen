/**
 * PDF GST Breakdown Builder
 * Creates detailed GST breakdown table by tax rate
 */

import { Invoice, Quotation, TaxBreakdown } from '@/types';
import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';
import { calculateRoundOff, applyRoundOff } from '@/utils/helpers';

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
    { text: 'Taxable Amt', fontSize: 8, bold: true, alignment: 'center' },
  ];

  if (!isInterState) {
    // Intra-state: Show CGST and SGST
    if (showCGST) headers.push({ text: 'CGST', fontSize: 8, bold: true, alignment: 'center' });
    if (showSGST) headers.push({ text: 'SGST', fontSize: 8, bold: true, alignment: 'center' });
  } else {
    // Inter-state: Show IGST
    if (showIGST) headers.push({ text: 'IGST', fontSize: 8, bold: true, alignment: 'center' });
  }

  // Build table rows
  const rows = data.taxBreakdown.map((breakdown: TaxBreakdown) => {
    const row = [
      { text: `${breakdown.rate}%`, fontSize: 8, alignment: 'center' },
      { text: safeCurrency(breakdown.taxableAmount), fontSize: 8, alignment: 'center' },
    ];

    if (!isInterState) {
      if (showCGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.cgst)}`, 
          fontSize: 8, 
          alignment: 'center' 
        });
      }
      if (showSGST) {
        row.push({ 
          text: `${safeCurrency(breakdown.sgst)}`, 
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

    // omit totalTax column here (we show totals in the right-side mini totals table)

    return row;
  });

  // Build compact left table (GST breakdown) WITHOUT Total Tax column
  const leftWidths: any[] = [];
  // widths: Rate | Taxable | CGST/IGST | SGST (if present)
  leftWidths.push(40); // GST Rate
  leftWidths.push(80); // Taxable Amount fixed width to save horizontal space
  if (!isInterState) {
    if (showCGST) leftWidths.push(45);
    if (showSGST) leftWidths.push(45);
  } else {
    if (showIGST) leftWidths.push(60);
  }

  // Left table header and body use slightly smaller font to make it compact
  // Adjusted column widths: Rate | Taxable | CGST/IGST | SGST (if present)
  // Taxable column reduced from flexible '*' to fixed 80 to save horizontal space
  const leftTable = {
    stack: [
      { text: 'GST Breakdown', fontSize: 8, bold: true, margin: [0, 0, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: leftWidths,
          body: [headers, ...rows],
        },
        layout: {
          fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
          hLineWidth: () => 0.4,
          vLineWidth: () => 0.4,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
    ],
  };

  // Build compact right summary (mini totals) - reuse logic from buildSummaryTotals but compacted
  const rightBody: any[] = [];
  rightBody.push([
    { text: 'Sub Total', fontSize: 8 },
    { text: safeCurrency(data.taxableAmount), fontSize: 8, alignment: 'right' },
  ]);

  if (data.igst && data.igst > 0) {
    rightBody.push([
      { text: `IGST`, fontSize: 8 },
      { text: safeCurrency(data.igst), fontSize: 8, alignment: 'right' },
    ]);
  } else {
    rightBody.push([
      { text: `SGST`, fontSize: 8 },
      { text: safeCurrency((data as any).sgst), fontSize: 8, alignment: 'right' },
    ]);
    rightBody.push([
      { text: `CGST`, fontSize: 8 },
      { text: safeCurrency((data as any).cgst), fontSize: 8, alignment: 'right' },
    ]);
  }

  if (customization?.totals?.showRoundOff !== false) {
    rightBody.push([
      { text: 'Round off', fontSize: 8 },
      { text: safeCurrency(calculateRoundOff(data.totalAmount)), fontSize: 8, alignment: 'right' },
    ]);
  }

  // Grand total highlighted
  rightBody.push([
    { text: 'Total', fontSize: 9, bold: true, fillColor: '#f59e0b', color: '#fff', margin: [0, 2, 0, 2] },
    { text: safeCurrency(applyRoundOff(data.totalAmount)), fontSize: 9, bold: true, alignment: 'right', fillColor: '#f59e0b', color: '#fff', margin: [0, 2, 0, 2] },
  ]);

  const rightTable = {
    stack: [
      { text: '', fontSize: 8, margin: [0, 0, 0, 4] },
      {
        table: {
          widths: ['*', 70],
          body: rightBody,
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 3,
          paddingRight: () => 3,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
    ],
  };

  // Return a single columns row: left (GST breakdown) and right (mini totals), each half width
  return [
    {
      columns: [
        { width: '50%', stack: [leftTable] },
        { width: '50%', stack: [rightTable] },
      ],
      columnGap: 8,
      margin: [0, 0, 0, 6],
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
      // Build a compact totals table similar to invoice layout
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 260,
            table: {
              widths: ['*', 90],
              body: [
                [
                  { text: 'Sub Total', fontSize: 9 },
                  { text: safeCurrency(data.taxableAmount), fontSize: 9, alignment: 'right' },
                ],
                // Determine if inter-state or intra-state and show corresponding tax rows
                ...(data.igst && data.igst > 0 ? [
                  [
                    { text: `IGST @ ${data.taxBreakdown && data.taxBreakdown.length === 1 ? data.taxBreakdown[0].rate + '%' : ''}`, fontSize: 9 },
                    { text: safeCurrency(data.igst), fontSize: 9, alignment: 'right' },
                  ]
                ] : [
                  [
                    { text: `SGST @ ${data.taxBreakdown && data.taxBreakdown.length === 1 ? data.taxBreakdown[0].rate / 2 + '%' : ''}`, fontSize: 9 },
                    { text: safeCurrency((data as any).sgst), fontSize: 9, alignment: 'right' },
                  ],
                  [
                    { text: `CGST @ ${data.taxBreakdown && data.taxBreakdown.length === 1 ? data.taxBreakdown[0].rate / 2 + '%' : ''}`, fontSize: 9 },
                    { text: safeCurrency((data as any).cgst), fontSize: 9, alignment: 'right' },
                  ],
                ]),
                // Round off
                ...(customization?.totals?.showRoundOff !== false ? [[
                  { text: 'Round off', fontSize: 9 },
                  { text: safeCurrency(calculateRoundOff(data.totalAmount)), fontSize: 9, alignment: 'right' },
                ]] : []),
                // Grand total (highlighted)
                [
                  { text: 'Total', fontSize: 10, bold: true, fillColor: '#f59e0b', color: '#fff' },
                  { text: safeCurrency(applyRoundOff(data.totalAmount)), fontSize: 10, bold: true, alignment: 'right', fillColor: '#f59e0b', color: '#fff' },
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
