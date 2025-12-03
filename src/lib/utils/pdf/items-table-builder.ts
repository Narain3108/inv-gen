/**
 * PDF Items Table Builder
 */

import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';

/**
 * Build fixed items table section (8 rows per page logic handled by generator)
 */
export const buildFixedItemsTable = (items: any[], startIndex: number = 0): any => {
  const headers = [
    { text: 'S.No', style: 'tableHeader', alignment: 'center' },
    { text: 'Description', style: 'tableHeader', alignment: 'left' },
    { text: 'HSN/SAC', style: 'tableHeader', alignment: 'center' },
    { text: 'Qty/Unit', style: 'tableHeader', alignment: 'center' },
    { text: 'Rate', style: 'tableHeader', alignment: 'right' },
    { text: 'GST Amt', style: 'tableHeader', alignment: 'right' },
    { text: 'Amount', style: 'tableHeader', alignment: 'right' },
  ];

  const widths = [25, '*', 50, 50, 55, 55, 60];

  const body = [
    headers,
    ...items.map((item, index) => {
      // Calculate total GST for this item
      const gstAmount = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
      
      return [
        { text: (startIndex + index + 1).toString(), fontSize: 8, alignment: 'center' },
        { 
          text: [
            { text: item.description || '', fontSize: 8, bold: true },
            item.serialNumbers?.length ? { text: `\nS.No: ${item.serialNumbers.join(', ')}`, fontSize: 7, italics: true, color: '#555' } : ''
          ],
          alignment: 'left' 
        },
        { text: item.hsn || '-', fontSize: 8, alignment: 'center' },
        { text: `${item.quantity || 0} ${item.unit || ''}`, fontSize: 8, alignment: 'center' },
        { text: safeCurrency(item.unitPrice), fontSize: 8, alignment: 'right' },
        { text: safeCurrency(gstAmount), fontSize: 8, alignment: 'right' },
        { text: safeCurrency(item.lineTotal), fontSize: 8, alignment: 'right' },
      ];
    })
  ];

  // Fill empty rows if less than 8 items (optional, but good for "fixed template")
  // The generator will pass chunks of max 8. If < 8, we can fill.
  const remainingRows = 8 - items.length;
  if (remainingRows > 0) {
    for (let i = 0; i < remainingRows; i++) {
      body.push([
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
        { text: '', fontSize: 8 },
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
