/**
 * PDF Helper Functions
 */

import { formatCurrency } from '@/utils/formatters';

/**
 * Safe currency formatter that handles undefined, null, and NaN values
 */
export const safeCurrency = (value: any): string => {
  const num = Number(value);
  if (isNaN(num) || value === undefined || value === null) {
    return formatCurrency(0);
  }
  return formatCurrency(num);
};

/**
 * Convert width string to number or keep as string for '*' and 'auto'
 */
export const parseWidth = (width: string | number | undefined): string | number => {
  if (!width) return 50;
  if (width === '*' || width === 'auto') return width;
  if (typeof width === 'string' && !isNaN(Number(width))) {
    return Number(width);
  }
  return typeof width === 'number' ? width : 50;
};

/**
 * Get font size based on customization setting
 */
export const getFontSize = (size?: 'small' | 'medium' | 'large', base: number = 20): number => {
  if (size === 'small') return base - 4;
  if (size === 'large') return base + 2;
  return base;
};
