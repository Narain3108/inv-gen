/**
 * API Layer - Central Export
 * Import all API modules and re-export for easy access
 * 
 * Usage:
 * import { companiesApi, clientsApi } from '@/lib/api';
 * 
 * const companies = await companiesApi.getAll();
 * const client = await clientsApi.getById(id);
 */

export { apiClient, ApiError } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

export { companiesApi } from './companies.api';
export type { CompanyFilters } from './companies.api';

export { clientsApi } from './clients.api';
export type { ClientFilters } from './clients.api';

export { productsApi } from './products.api';
export type { ProductFilters } from './products.api';

export { categoriesApi } from './categories.api';
export type { CategoryFilters } from './categories.api';

export { invoicesApi } from './invoices.api';
export type { InvoiceFilters, PaymentData } from './invoices.api';

export { quotationsApi } from './quotations.api';
export type { QuotationFilters } from './quotations.api';

export { uploadsApi } from './uploads.api';
export type { UploadResponse, DeleteResponse } from './uploads.api';

export { customizationsApi } from './customizations.api';
export { auditApi } from './audit.api';
export type { AuditFilters } from './audit.api';

// Import for centralized API object
import { companiesApi } from './companies.api';
import { clientsApi } from './clients.api';
import { productsApi } from './products.api';
import { categoriesApi } from './categories.api';
import { invoicesApi } from './invoices.api';
import { quotationsApi } from './quotations.api';
import { uploadsApi } from './uploads.api';
import { customizationsApi } from './customizations.api';
import { auditApi } from './audit.api';

/**
 * Centralized API object for convenience
 */
export const api = {
  companies: companiesApi,
  clients: clientsApi,
  products: productsApi,
  categories: categoriesApi,
  invoices: invoicesApi,
  quotations: quotationsApi,
  uploads: uploadsApi,
  customizations: customizationsApi,
  audit: auditApi,
};
