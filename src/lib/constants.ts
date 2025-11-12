/**
 * Constants - Indian States, GST Rates, Payment Modes, etc.
 */

// ==================== Indian States with Codes ====================

export const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir', value: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh', value: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab', value: 'Punjab' },
  { code: '04', name: 'Chandigarh', value: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand', value: 'Uttarakhand' },
  { code: '06', name: 'Haryana', value: 'Haryana' },
  { code: '07', name: 'Delhi', value: 'Delhi' },
  { code: '08', name: 'Rajasthan', value: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh', value: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar', value: 'Bihar' },
  { code: '11', name: 'Sikkim', value: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh', value: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland', value: 'Nagaland' },
  { code: '14', name: 'Manipur', value: 'Manipur' },
  { code: '15', name: 'Mizoram', value: 'Mizoram' },
  { code: '16', name: 'Tripura', value: 'Tripura' },
  { code: '17', name: 'Meghalaya', value: 'Meghalaya' },
  { code: '18', name: 'Assam', value: 'Assam' },
  { code: '19', name: 'West Bengal', value: 'West Bengal' },
  { code: '20', name: 'Jharkhand', value: 'Jharkhand' },
  { code: '21', name: 'Odisha', value: 'Odisha' },
  { code: '22', name: 'Chhattisgarh', value: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh', value: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat', value: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu', value: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra', value: 'Maharashtra' },
  { code: '29', name: 'Karnataka', value: 'Karnataka' },
  { code: '30', name: 'Goa', value: 'Goa' },
  { code: '31', name: 'Lakshadweep', value: 'Lakshadweep' },
  { code: '32', name: 'Kerala', value: 'Kerala' },
  { code: '33', name: 'Tamil Nadu', value: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry', value: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands', value: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana', value: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh', value: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh', value: 'Ladakh' },
] as const;

// ==================== GST Rates ====================

export const GST_RATES = [
  { value: 0, label: '0% (Exempted)' },
  { value: 0.25, label: '0.25%' },
  { value: 3, label: '3%' },
  { value: 5, label: '5%' },
  { value: 12, label: '12%' },
  { value: 18, label: '18%' },
  { value: 28, label: '28%' },
] as const;

// ==================== Unit Types ====================

export const UNIT_TYPES = [
  { value: 'Nos', label: 'Nos (Numbers)' },
  { value: 'Pcs', label: 'Pcs (Pieces)' },
  { value: 'Kgs', label: 'Kgs (Kilograms)' },
  { value: 'Gms', label: 'Gms (Grams)' },
  { value: 'Ltrs', label: 'Ltrs (Liters)' },
  { value: 'Mtrs', label: 'Mtrs (Meters)' },
  { value: 'Hrs', label: 'Hrs (Hours)' },
  { value: 'Days', label: 'Days' },
  { value: 'Box', label: 'Box' },
  { value: 'Set', label: 'Set' },
  { value: 'Dozen', label: 'Dozen' },
  { value: 'Sq Ft', label: 'Sq Ft (Square Feet)' },
  { value: 'Sq Mtr', label: 'Sq Mtr (Square Meter)' },
] as const;

// Simple array of units for form selects
export const PRODUCT_UNITS = UNIT_TYPES.map(u => u.value);

// ==================== Payment Modes ====================

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer / NEFT / RTGS' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'net_banking', label: 'Net Banking' },
] as const;

// ==================== Payment Status ====================

export const PAYMENT_STATUS = [
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'unpaid', label: 'Unpaid', color: 'red' },
  { value: 'partially_paid', label: 'Partially Paid', color: 'orange' },
  { value: 'overdue', label: 'Overdue', color: 'red' },
] as const;

// ==================== Invoice Status ====================

export const INVOICE_STATUS = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'sent', label: 'Sent', color: 'blue' },
  { value: 'viewed', label: 'Viewed', color: 'purple' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
] as const;

// ==================== Product Types ====================

export const PRODUCT_TYPES = [
  { value: 'product', label: 'Product (Goods)' },
  { value: 'service', label: 'Service' },
] as const;

// ==================== Default Invoice Terms ====================

export const DEFAULT_INVOICE_TERMS = `Payment Terms:
1. Payment is due within 30 days from the invoice date.
2. Please make payment to the bank account mentioned above.
3. Late payments may attract interest charges.
4. For any queries, please contact us.

Thank you for your business!`;

// ==================== Default Invoice Notes ====================

export const DEFAULT_INVOICE_NOTES = 'Thank you for your business. We appreciate your prompt payment.';

// ==================== Date Format ====================

export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATE_TIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const INVOICE_DATE_FORMAT = 'dd-MM-yyyy';

// ==================== Currency ====================

export const CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
} as const;

// ==================== Pagination ====================

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// ==================== File Upload ====================

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const ALLOWED_SIGNATURE_TYPES = ['image/png'];

// ==================== Invoice Number Format ====================

export const INVOICE_NUMBER_PREFIX = 'INV';
export const INVOICE_NUMBER_FORMAT = 'INV-YYYY-NNN'; // INV-2025-001

// ==================== Validation Patterns ====================

export const VALIDATION_PATTERNS = {
  gstin: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^[1-9][0-9]{5}$/,
  ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  upi: /^[\w.-]+@[\w.-]+$/,
} as const;

// ==================== Dummy Company Data for Testing ====================

export const DUMMY_COMPANY = {
  name: 'Blue Horizon Traders Pvt Ltd',
  address: {
    street: '12, Park View Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
  },
  gstin: '29ABCDE1234F1Z5',
  contact: {
    email: 'info@bluehorizontraders.com',
    phone: '+91 9876543210',
    website: 'www.bluehorizontraders.com',
  },
  bankDetails: {
    bankName: 'State Bank of India',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0001234',
    accountHolderName: 'Blue Horizon Traders Pvt Ltd',
    branch: 'Bengaluru Main Branch',
    upiId: 'bluehorizon@sbi',
  },
  pan: 'ABCDE1234F',
} as const;
