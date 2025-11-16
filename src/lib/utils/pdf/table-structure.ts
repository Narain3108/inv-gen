/**
 * PDF Table Structure Builder
 */

import { InvoiceCustomization, DEFAULT_INVOICE_CUSTOMIZATION } from '@/types/customization';
import { TableStructure } from './types';
import { parseWidth } from './helpers';

/**
 * Get table structure for invoice items based on customization
 */
export const getTableStructure = (customization?: InvoiceCustomization): TableStructure => {
  console.log('📊 getTableStructure called');

  // Default structure - fallback
  const defaultStructure: TableStructure = {
    widths: ['*', 45, 40, 30, 50, 40, 40, 40, 60] as any[],
    headers: [
      { text: 'Description', style: 'tableHeader' },
      { text: 'Item Code', style: 'tableHeader' },
      { text: 'HSN', style: 'tableHeader' },
      { text: 'Qty', style: 'tableHeader' },
      { text: 'Rate', style: 'tableHeader' },
      { text: 'Disc', style: 'tableHeader' },
      { text: 'GST %', style: 'tableHeader' },
      { text: 'Tax', style: 'tableHeader' },
      { text: 'Amount', style: 'tableHeader' },
    ],
  };

  if (!customization?.table?.columns || !Array.isArray(customization.table.columns)) {
    console.log('⚠️ No valid customization, using defaults');
    return defaultStructure;
  }

  try {
    const widths: any[] = [];
    const headers: any[] = [];

    // Filter and sort enabled columns
    const enabledColumns = customization.table.columns
      .filter(col => col && col.enabled === true && col.id !== 'sno')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log(`📋 Enabled columns: ${enabledColumns.length}`);

    if (enabledColumns.length === 0) {
      console.log('⚠️ No enabled columns, using defaults');
      return defaultStructure;
    }

    // Build widths and headers from enabled columns
    enabledColumns.forEach(col => {
      headers.push({ text: col.label || '', style: 'tableHeader' });

      // Parse width with proper type conversion
      let width: string | number = parseWidth(col.width);

      // Special case for description - always flexible
      if (col.id === 'description') {
        width = '*';
      }

      widths.push(width);
    });

    console.log('✅ Custom structure:', { widthCount: widths.length, headerCount: headers.length });
    return { widths, headers };
  } catch (error) {
    console.error('❌ Error building table structure:', error);
    return defaultStructure;
  }
};
