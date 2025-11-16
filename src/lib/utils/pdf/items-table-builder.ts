/**
 * PDF Items Table Builder
 */

import { InvoiceCustomization } from '@/types/customization';
import { getTableStructure } from './table-structure';
import { buildInvoiceItemRow } from './table-rows';

/**
 * Build items table section
 */
export const buildItemsTable = (items: any[], customization?: InvoiceCustomization): any => {
  const tableStructure = getTableStructure(customization);

  return {
    table: {
      headerRows: 1,
      widths: tableStructure.widths,
      body: [
        // Header row
        tableStructure.headers,
        // Item rows
        ...items.map(item => buildInvoiceItemRow(item, customization)),
      ],
    },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? '#f3f4f6' : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e5e7eb',
      vLineColor: () => '#e5e7eb',
    },
    margin: [0, 10, 0, 10],
  };
};
