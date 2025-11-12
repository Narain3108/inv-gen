/**
 * Helper Utilities
 * General helper functions
 */

import { INVOICE_NUMBER_PREFIX } from '@/lib/constants';

// ==================== Invoice Number Generation ====================

export const generateInvoiceNumber = (lastInvoiceNumber?: string): string => {
  const year = new Date().getFullYear();
  
  if (!lastInvoiceNumber) {
    return `${INVOICE_NUMBER_PREFIX}-${year}-001`;
  }
  
  // Extract number from last invoice (e.g., "INV-2025-001" -> 1)
  const parts = lastInvoiceNumber.split('-');
  const lastNumber = parseInt(parts[parts.length - 1] || '0', 10);
  const newNumber = lastNumber + 1;
  
  // Pad with zeros (001, 002, etc.)
  const paddedNumber = newNumber.toString().padStart(3, '0');
  
  return `${INVOICE_NUMBER_PREFIX}-${year}-${paddedNumber}`;
};

// ==================== Round Off Calculation ====================

export const calculateRoundOff = (amount: number): number => {
  const rounded = Math.round(amount);
  return rounded - amount;
};

export const applyRoundOff = (amount: number): number => {
  return Math.round(amount);
};

// ==================== Validation Helpers ====================

export const validateGSTIN = (gstin: string): boolean => {
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
};

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, '').slice(-10));
};

// ==================== Array Helpers ====================

export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// ==================== Debounce ====================

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// ==================== Sleep ====================

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Apply percentage to value
 */
export function applyPercentage(value: number, percentage: number): number {
  return (value * percentage) / 100;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ==================== File Helpers ====================

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};

// ==================== Color Helpers ====================

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    paid: 'green',
    unpaid: 'red',
    partially_paid: 'orange',
    overdue: 'red',
    draft: 'gray',
    sent: 'blue',
    viewed: 'purple',
    cancelled: 'red',
  };
  
  return colors[status] || 'gray';
};

// ==================== Search Filter ====================

export const searchFilter = <T>(
  items: T[],
  searchQuery: string,
  searchKeys: (keyof T)[]
): T[] => {
  if (!searchQuery.trim()) return items;
  
  const query = searchQuery.toLowerCase();
  
  return items.filter((item) =>
    searchKeys.some((key) => {
      const value = item[key];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(query);
      }
      if (typeof value === 'number') {
        return value.toString().includes(query);
      }
      return false;
    })
  );
};

// ==================== Deep Clone ====================

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// ==================== Generate Random ID ====================

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
