/**
 * Formatter Utilities
 * 
 * Centralized formatting functions for currency, dates, numbers, and text.
 * All formatters follow Indian standards and conventions.
 * 
 * @module utils/formatters
 */

import { format } from 'date-fns';
import { CURRENCY, DATE_FORMAT, DATE_TIME_FORMAT, INVOICE_DATE_FORMAT } from '@/lib/constants';
import { Timestamp } from 'firebase/firestore';

// ==================== Currency Formatting ====================

/**
 * Format number as Indian currency (₹)
 * 
 * @param amount - Amount to format
 * @returns Formatted currency string (e.g., "₹1,234.56")
 * 
 * @example
 * formatCurrency(1234.56) // "₹1,234.56"
 * formatCurrency(0) // "₹0.00"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency in compact form (Lakhs/Crores)
 * 
 * @param amount - Amount to format
 * @returns Compact currency string (e.g., "₹1.23Cr")
 * 
 * @example
 * formatCurrencyCompact(12345678) // "₹1.23Cr"
 * formatCurrencyCompact(123456) // "₹1.23L"
 * formatCurrencyCompact(1234) // "₹1.23K"
 */
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

/**
 * Format number with specified decimal places
 * 
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(123.456, 2) // "123.46"
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

/**
 * Format quantity (removes decimal if whole number)
 * 
 * @param quantity - Quantity to format
 * @returns Formatted quantity string
 * 
 * @example
 * formatQuantity(5) // "5"
 * formatQuantity(5.5) // "5.50"
 */
export const formatQuantity = (quantity: number): string => {
  return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
};

/**
 * Format percentage
 * 
 * @param value - Percentage value
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(18) // "18%"
 */
export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

// ==================== Date Formatting ====================

/**
 * Format date in standard format (DD/MM/YYYY)
 * 
 * @param date - Date object or Firestore Timestamp
 * @returns Formatted date string
 * 
 * @example
 * formatDate(new Date()) // "15/11/2025"
 */
export const formatDate = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, DATE_FORMAT);
};

/**
 * Format date and time
 * 
 * @param date - Date object or Firestore Timestamp
 * @returns Formatted date-time string
 * 
 * @example
 * formatDateTime(new Date()) // "15/11/2025 14:30"
 */
export const formatDateTime = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, DATE_TIME_FORMAT);
};

/**
 * Format date for invoices (DD-MM-YYYY)
 * 
 * @param date - Date object or Firestore Timestamp
 * @returns Formatted invoice date string
 * 
 * @example
 * formatInvoiceDate(new Date()) // "15-11-2025"
 */
export const formatInvoiceDate = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, INVOICE_DATE_FORMAT);
};

/**
 * Format date for HTML input fields (YYYY-MM-DD)
 * 
 * @param date - Date object or Firestore Timestamp
 * @returns ISO date string
 * 
 * @example
 * formatDateForInput(new Date()) // "2025-11-15"
 */
export const formatDateForInput = (date: Date | Timestamp): string => {
  const dateObj = date instanceof Timestamp ? date.toDate() : date;
  return format(dateObj, 'yyyy-MM-dd');
};

/**
 * Format date to Indian format (DD/MM/YYYY)
 * 
 * @param date - Date object or Firestore Timestamp
 * @returns Indian formatted date string
 * 
 * @example
 * formatDateIndian(new Date()) // "15/11/2025"
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
 * 
 * @param date - Date to get financial year for (defaults to current date)
 * @returns Financial year string (e.g., "2024-25")
 * 
 * @example
 * getFinancialYear(new Date('2025-01-15')) // "2024-25"
 * getFinancialYear(new Date('2025-05-15')) // "2025-26"
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

/**
 * Format GSTIN with spaces for readability
 * 
 * @param gstin - GSTIN string (15 characters)
 * @returns Formatted GSTIN string
 * 
 * @example
 * formatGSTIN("29ABCDE1234F1Z5") // "29 ABCDE 1234 F 1Z 5"
 */
export const formatGSTIN = (gstin: string): string => {
  if (gstin.length !== 15) return gstin;
  return `${gstin.slice(0, 2)} ${gstin.slice(2, 7)} ${gstin.slice(7, 11)} ${gstin.slice(11, 12)} ${gstin.slice(12, 14)} ${gstin.slice(14)}`;
};

/**
 * Extract state code from GSTIN (first 2 digits)
 * 
 * @param gstin - GSTIN string
 * @returns State code or empty string
 * 
 * @example
 * extractStateFromGSTIN("29ABCDE1234F1Z5") // "29"
 */
export const extractStateFromGSTIN = (gstin: string): string => {
  if (gstin.length < 2) return '';
  return gstin.slice(0, 2);
};

// ==================== Phone Formatting ====================

/**
 * Format phone number with country code
 * 
 * @param phone - Phone number string
 * @returns Formatted phone number
 * 
 * @example
 * formatPhone("9876543210") // "+91 9876543210"
 */
export const formatPhone = (phone: string): string => {
  if (phone.startsWith('+91')) return phone;
  if (phone.length === 10) return `+91 ${phone}`;
  return phone;
};

// ==================== Text Formatting ====================

/**
 * Truncate text to specified length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 * 
 * @example
 * truncateText("Long text here", 8) // "Long tex..."
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Capitalize first letter of string
 * 
 * @param text - Text to capitalize
 * @returns Capitalized text
 * 
 * @example
 * capitalizeFirst("hello") // "Hello"
 */
export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalize first letter of each word
 * 
 * @param text - Text to capitalize
 * @returns Title-cased text
 * 
 * @example
 * capitalizeWords("hello world") // "Hello World"
 */
export const capitalizeWords = (text: string): string => {
  return text
    .split(' ')
    .map((word) => capitalizeFirst(word))
    .join(' ');
};

// ==================== File Size Formatting ====================

/**
 * Format file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 * 
 * @example
 * formatFileSize(1536) // "1.50 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
