/**
 * Number to Words Converter (Indian System)
 * 
 * Convert numbers to words for invoice amounts
 * Supports Indian numbering system (Lakhs, Crores)
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
];

const teens = [
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

/**
 * Convert a number less than 100 to words
 */
function convertTensToWords(num: number): string {
  if (num < 10) {
    return ones[num];
  } else if (num >= 10 && num < 20) {
    return teens[num - 10];
  } else {
    const ten = Math.floor(num / 10);
    const one = num % 10;
    return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
  }
}

/**
 * Convert a number less than 1000 to words
 */
function convertHundredsToWords(num: number): string {
  if (num === 0) return '';

  const hundred = Math.floor(num / 100);
  const remainder = num % 100;

  let result = '';

  if (hundred > 0) {
    result += ones[hundred] + ' Hundred';
  }

  if (remainder > 0) {
    if (result !== '') {
      result += ' ';
    }
    result += convertTensToWords(remainder);
  }

  return result;
}

/**
 * Convert number to words (Indian system with Lakhs and Crores)
 */
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero';

  // Handle negative numbers
  const isNegative = num < 0;
  num = Math.abs(num);

  // Split into integer and decimal parts
  const parts = num.toFixed(2).split('.');
  const integerPart = parseInt(parts[0]);
  const decimalPart = parseInt(parts[1]);

  let words = '';

  // Process integer part
  if (integerPart === 0) {
    words = 'Zero';
  } else {
    const crores = Math.floor(integerPart / 10000000);
    const lakhs = Math.floor((integerPart % 10000000) / 100000);
    const thousands = Math.floor((integerPart % 100000) / 1000);
    const hundreds = integerPart % 1000;

    if (crores > 0) {
      words += convertHundredsToWords(crores) + ' Crore ';
    }

    if (lakhs > 0) {
      words += convertHundredsToWords(lakhs) + ' Lakh ';
    }

    if (thousands > 0) {
      words += convertHundredsToWords(thousands) + ' Thousand ';
    }

    if (hundreds > 0) {
      words += convertHundredsToWords(hundreds);
    }

    words = words.trim();
  }

  // Add decimal part (paise)
  if (decimalPart > 0) {
    words += ' and ' + convertTensToWords(decimalPart) + ' Paise';
  }

  // Add "Rupees" and handle negative
  if (isNegative) {
    return 'Minus ' + words + ' Rupees Only';
  }

  return words + ' Rupees Only';
}

/**
 * Convert amount to words for invoice
 */
export function amountToWords(amount: number): string {
  return numberToWordsIndian(amount);
}

/**
 * Format number in Indian numbering system
 * Example: 1,00,00,000 (1 Crore)
 */
export function formatIndianNumber(num: number): string {
  const numStr = num.toString();
  const lastThree = numStr.substring(numStr.length - 3);
  const otherNumbers = numStr.substring(0, numStr.length - 3);

  if (otherNumbers !== '') {
    return (
      otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
    );
  } else {
    return lastThree;
  }
}
