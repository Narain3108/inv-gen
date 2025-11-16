/**
 * PDF Table Row Builder
 */

import { InvoiceCustomization } from '@/types/customization';
import { safeCurrency } from './helpers';

/**
 * Build table row for an invoice item based on customization
 */
export const buildInvoiceItemRow = (item: any, customization?: InvoiceCustomization): any[] => {
  console.log('🔨 buildInvoiceItemRow for:', item.description);

  // Default row structure (9 cells)
  const defaultRow = [
    {
      text: [
        { text: item.description || '', fontSize: 9 },
        ...(item.serialNumbers && item.serialNumbers.length > 0
          ? [{ text: `\nSerial Nos: ${item.serialNumbers.join(', ')}`, fontSize: 8, color: '#1e40af', italics: true }]
          : []
        )
      ],
    },
    { text: item.itemCode || '—', fontSize: 8, alignment: 'center', color: item.itemCode ? '#000000' : '#9ca3af' },
    { text: item.hsn || '—', fontSize: 9, alignment: 'center' },
    { text: `${item.quantity || 0} ${item.unit || ''}`, fontSize: 9, alignment: 'center' },
    { text: safeCurrency(item.unitPrice), fontSize: 9, alignment: 'right' },
    { text: item.discount ? `${item.discount}%` : '-', fontSize: 9, alignment: 'center' },
    { text: `${item.gstRate || 0}%`, fontSize: 9, alignment: 'center' },
    { text: safeCurrency((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0)), fontSize: 9, alignment: 'right' },
    { text: safeCurrency(item.lineTotal), fontSize: 9, alignment: 'right' },
  ];

  if (!customization?.table?.columns || !Array.isArray(customization.table.columns)) {
    console.log('  ✅ Using default row (9 cells)');
    return defaultRow;
  }

  try {
    const row: any[] = [];
    const showSerialNumbers = customization.table.showSerialNumbers !== false;

    // Get enabled columns (same as headers)
    const enabledColumns = customization.table.columns
      .filter(col => col && col.enabled === true && col.id !== 'sno')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Build row based on enabled columns
    enabledColumns.forEach(col => {
      let cellContent: any = { text: '', fontSize: 9 };

      switch (col.id) {
        case 'description':
          cellContent = {
            text: [
              { text: item.description || '', fontSize: 9 },
              ...(showSerialNumbers && item.serialNumbers && item.serialNumbers.length > 0
                ? [{ text: `\nSerial Nos: ${item.serialNumbers.join(', ')}`, fontSize: 8, color: '#1e40af', italics: true }]
                : []
              )
            ],
          };
          break;
        case 'itemCode':
          cellContent = { text: item.itemCode || '—', fontSize: 8, alignment: 'center', color: item.itemCode ? '#000000' : '#9ca3af' };
          break;
        case 'hsn':
          cellContent = { text: item.hsn || '—', fontSize: 9, alignment: 'center' };
          break;
        case 'quantity':
          cellContent = { text: `${item.quantity || 0}`, fontSize: 9, alignment: 'center' };
          break;
        case 'unit':
          cellContent = { text: item.unit || '', fontSize: 9, alignment: 'center' };
          break;
        case 'rate':
          cellContent = { text: safeCurrency(item.unitPrice), fontSize: 9, alignment: 'right' };
          break;
        case 'discount':
          cellContent = { text: item.discount ? `${item.discount}%` : '-', fontSize: 9, alignment: 'center' };
          break;
        case 'gst':
          cellContent = { text: `${item.gstRate || 0}%`, fontSize: 9, alignment: 'center' };
          break;
        case 'tax':
          cellContent = { text: safeCurrency((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0)), fontSize: 9, alignment: 'right' };
          break;
        case 'amount':
          cellContent = { text: safeCurrency(item.lineTotal), fontSize: 9, alignment: 'right' };
          break;
        default:
          cellContent = { text: '', fontSize: 9 };
      }

      row.push(cellContent);
    });

    console.log(`  ✅ Custom row (${row.length} cells) for ${enabledColumns.length} columns`);
    return row;
  } catch (error) {
    console.error('  ❌ Error building table row:', error);
    return defaultRow;
  }
};
