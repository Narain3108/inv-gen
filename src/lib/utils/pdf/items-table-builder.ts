/**
 * PDF Items Table Builder
 */

import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';

/**
 * Build fixed items table section (8 rows per page logic handled by generator)
 */
export const buildFixedItemsTable = (items: any[], startIndex: number = 0): any => {
  // Updated columns: remove S.No column and merge GST% into GST Amt column
  const headers = [
    { text: 'Description', style: 'tableHeader', alignment: 'center' },
    { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center' },
    { text: 'Qty/Unit', style: 'tableHeader', alignment: 'center' },
    { text: 'Rate', style: 'tableHeader', alignment: 'center' },
    { text: 'Taxable Amt', style: 'tableHeader', alignment: 'center' },
    { text: 'GST Amt (GST%)', style: 'tableHeader', alignment: 'center' },
    { text: 'Amount', style: 'tableHeader', alignment: 'center' },
  ];

  // Widths adjusted: description gets more space (uses flexible '*')
  const widths = ['*', 45, 45, 55, 65, 70, 60];

  const body = [
    headers,
    ...items.map((item, index) => {
      // Calculate total GST for this item
      const gstAmount = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
      // Taxable amount per item (assume lineTotal includes taxes)
      const taxable = (typeof item.lineTotal === 'number') ? (item.lineTotal - gstAmount) : null;
      // GST percentage (if available on item)
      const gstPercent = item.gstRate ?? item.gst_rate ?? null;

      // Format GST amount with percentage in parentheses (e.g., 79.00(18%))
      const gstAmountStr = safeCurrency(gstAmount);
      const gstDisplay = gstPercent ? `${gstAmountStr}(${gstPercent}%)` : gstAmountStr;

      return [
        {
          text: [
            // Product name (bold)
            { text: item.description || (item.productName || ''), fontSize: 8, bold: true },
            // Product description (regular) - shown on next line if present
            item.productDescription ? { text: `\n${item.productDescription}`, fontSize: 7, color: '#333' } : '',
            // Serial numbers (regular, smaller) on next line if present
            item.serialNumbers?.length ? { text: `\nS.No: ${item.serialNumbers.join(', ')}`, fontSize: 7, color: '#333' } : ''
          ],
          alignment: 'left'
        },
        { text: item.hsn || '-', fontSize: 8, alignment: 'center' },
        { text: `${item.quantity || 0} ${item.unit || ''}`, fontSize: 8, alignment: 'center' },
        { text: safeCurrency(item.unitPrice), fontSize: 8, alignment: 'center' },
        { text: safeCurrency(taxable), fontSize: 8, alignment: 'center' },
        { text: gstDisplay, fontSize: 8, alignment: 'center' },
        { text: safeCurrency(item.lineTotal), fontSize: 8, alignment: 'center' },
      ];
    })
  ];

  // Fill empty rows if less than 8 items (optional, but good for "fixed template")
  // The generator will pass chunks of max 8. If < 8, we can fill.
  const remainingRows = 8 - items.length;
  if (remainingRows > 0) {
    for (let i = 0; i < remainingRows; i++) {
      body.push([
        { text: '', fontSize: 8, alignment: 'left' },
        { text: '', fontSize: 8, alignment: 'center' },
        { text: '', fontSize: 8, alignment: 'center' },
        { text: '', fontSize: 8, alignment: 'center' },
        { text: '', fontSize: 8, alignment: 'center' },
        { text: '', fontSize: 8, alignment: 'center' },
        { text: '', fontSize: 8, alignment: 'center' },
      ]);
    }
  }

  return {
    table: {
      headerRows: 1,
      widths: widths,
      body: body,
      heights: 18, // Fixed height for rows
    },
    layout: {
      hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 0.5,
      vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 1 : 0.5,
      hLineColor: '#e5e7eb',
      vLineColor: '#e5e7eb',
      paddingLeft: (i: number) => 2,
      paddingRight: (i: number) => 2,
      paddingTop: (i: number) => 2,
      paddingBottom: (i: number) => 2,
    },
    margin: [0, 5, 0, 5],
  };
};

// Deprecated but kept for compatibility
export const buildItemsTable = (items: any[], customization?: InvoiceCustomization): any => {
  return buildFixedItemsTable(items);
};
