/**
 * Centralized Error Messages
 * 
 * All user-facing error messages in one place for consistency
 * and easy maintenance/localization.
 * 
 * @module lib/errors/error-messages
 */

export const ERROR_MESSAGES = {
  // Generic errors
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Authentication errors
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_IN_USE: 'This email is already registered',
    WEAK_PASSWORD: 'Password must be at least 6 characters',
    USER_NOT_FOUND: 'No account found with this email',
    ACCOUNT_DISABLED: 'This account has been disabled',
    TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please try again later',
    SIGN_OUT_FAILED: 'Failed to sign out. Please try again',
  },
  
  // Company errors
  COMPANY: {
    NOT_FOUND: 'Company not found',
    LOAD_FAILED: 'Failed to load companies',
    CREATE_FAILED: 'Failed to create company',
    UPDATE_FAILED: 'Failed to update company',
    DELETE_FAILED: 'Failed to delete company',
    NO_COMPANY_SELECTED: 'Please select a company first',
    INVALID_GSTIN: 'Invalid GSTIN format',
  },
  
  // Client errors
  CLIENT: {
    NOT_FOUND: 'Client not found',
    LOAD_FAILED: 'Failed to load clients',
    CREATE_FAILED: 'Failed to create client',
    UPDATE_FAILED: 'Failed to update client',
    DELETE_FAILED: 'Failed to delete client',
    REQUIRED: 'Please select a client',
  },
  
  // Product errors
  PRODUCT: {
    NOT_FOUND: 'Product not found',
    LOAD_FAILED: 'Failed to load products',
    CREATE_FAILED: 'Failed to create product',
    UPDATE_FAILED: 'Failed to update product',
    DELETE_FAILED: 'Failed to delete product',
    REQUIRED: 'Please select a product',
    NO_PRODUCTS: 'Please add products first',
  },
  
  // Invoice errors
  INVOICE: {
    NOT_FOUND: 'Invoice not found',
    LOAD_FAILED: 'Failed to load invoices',
    CREATE_FAILED: 'Failed to create invoice',
    UPDATE_FAILED: 'Failed to update invoice',
    DELETE_FAILED: 'Failed to delete invoice',
    PDF_FAILED: 'Failed to generate PDF',
    NO_ITEMS: 'Please add at least one item',
    INVALID_ITEMS: 'Please add valid items to the invoice',
    NO_CLIENTS: 'Please add clients first',
  },
  
  // Quotation errors
  QUOTATION: {
    NOT_FOUND: 'Quotation not found',
    LOAD_FAILED: 'Failed to load quotations',
    CREATE_FAILED: 'Failed to create quotation',
    UPDATE_FAILED: 'Failed to update quotation',
    DELETE_FAILED: 'Failed to delete quotation',
    CONVERT_FAILED: 'Failed to convert quotation to invoice',
  },
  
  // Validation errors
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email address',
    INVALID_PHONE: 'Invalid phone number',
    INVALID_PINCODE: 'Invalid pincode',
    INVALID_GSTIN: 'Invalid GSTIN format',
    INVALID_PAN: 'Invalid PAN format',
    INVALID_IFSC: 'Invalid IFSC code',
    INVALID_UPI: 'Invalid UPI ID',
    INVALID_DATE: 'Invalid date',
    MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
    MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
    MIN_VALUE: (min: number) => `Must be at least ${min}`,
    MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  },
  
  // File upload errors
  UPLOAD: {
    FILE_TOO_LARGE: 'File size exceeds maximum limit',
    INVALID_TYPE: 'Invalid file type',
    UPLOAD_FAILED: 'File upload failed',
  },
} as const;

/**
 * Success messages for user feedback
 */
export const SUCCESS_MESSAGES = {
  // Authentication
  AUTH: {
    SIGN_IN: 'Successfully signed in',
    SIGN_OUT: 'Successfully signed out',
    SIGN_UP: 'Account created successfully',
  },
  
  // Company
  COMPANY: {
    CREATED: 'Company created successfully',
    UPDATED: 'Company updated successfully',
    DELETED: 'Company deleted successfully',
  },
  
  // Client
  CLIENT: {
    CREATED: 'Client created successfully',
    UPDATED: 'Client updated successfully',
    DELETED: 'Client deleted successfully',
  },
  
  // Product
  PRODUCT: {
    CREATED: 'Product created successfully',
    UPDATED: 'Product updated successfully',
    DELETED: 'Product deleted successfully',
  },
  
  // Invoice
  INVOICE: {
    CREATED: 'Invoice created successfully',
    UPDATED: 'Invoice updated successfully',
    DELETED: 'Invoice deleted successfully',
    PDF_GENERATED: 'PDF generated successfully',
  },
  
  // Quotation
  QUOTATION: {
    CREATED: 'Quotation created successfully',
    UPDATED: 'Quotation updated successfully',
    DELETED: 'Quotation deleted successfully',
    CONVERTED: 'Quotation converted to invoice successfully',
  },
} as const;
