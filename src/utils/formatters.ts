/**
 * Formatter Utilities
 * Date, currency, number formatting functions
 */

import { format } from 'date-fns';
import { CURRENCY, DATE_FORMAT, DATE_TIME_FORMAT, INVOICE_DATE_FORMAT } from '@/lib/constants';
import { Timestamp } from 'firebase/firestore';

// ==================== Currency Formatting ====================

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 10000000) {
    return `${CURRENCY.symbol}${(amount / 10000000).toFixed(2)}Cr`;
  } else if (amount >= 100000) {
    return `${CURRENCY.symbol}${(amount / 100000).toFixed(2)}L`;
  } else if (amount >= 1000) {
    return `${CURRENCY.symbol}${(amount / 1000).toFixed(2)}K`;
  }
  return formatCurrency(amount);
};

// ==================== Number Formatting ====================

export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

export const formatQuantity = (quantity: number): string => {
  return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
};

export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

// ==================== Date Formatting ====================

export const formatDate = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, DATE_FORMAT);
};

export const formatDateTime = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, DATE_TIME_FORMAT);
};

export const formatInvoiceDate = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, INVOICE_DATE_FORMAT);
};

export const formatDateForInput = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Format date to Indian format (DD/MM/YYYY)
 */
export function formatDateIndian(date: Date | Timestamp): string {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Get financial year from date (April to March)
 */
export function getFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  if (month >= 4) {
    return `${year}-${(year + 1).toString().substring(2)}`;
  } else {
    return `${year - 1}-${year.toString().substring(2)}`;
  }
}

// ==================== GSTIN Formatting ====================

export const formatGSTIN = (gstin: string): string => {
  if (gstin.length !== 15) return gstin;
  return `${gstin.slice(0, 2)} ${gstin.slice(2, 7)} ${gstin.slice(7, 11)} ${gstin.slice(11, 12)} ${gstin.slice(12, 14)} ${gstin.slice(14)}`;
};

export const extractStateFromGSTIN = (gstin: string): string => {
  if (gstin.length < 2) return '';
  return gstin.slice(0, 2);
};

// ==================== Phone Formatting ====================

export const formatPhone = (phone: string): string => {
  if (phone.startsWith('+91')) return phone;
  if (phone.length === 10) return `+91 ${phone}`;
  return phone;
};

// ==================== Text Formatting ====================

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

// ==================== File Size Formatting ====================

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
