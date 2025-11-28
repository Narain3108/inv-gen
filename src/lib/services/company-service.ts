/**
 * Company Service
 * 
 * Business logic for company management with validation
 * and error handling.
 * 
 * @module lib/services/company-service
 */

import { Company } from '@/types';
import { ApiBaseService } from './api-base-service';
import { ValidationError } from '@/lib/errors/error-handler';
import { companiesApi } from '@/lib/api/companies.api';

/**
 * Service for managing companies
 */
class CompanyService extends ApiBaseService<Company> {
  constructor() {
    super(companiesApi);
  }

  /**
   * Validate company data before creating/updating
   */
  private validateCompanyData(data: Partial<Company>): void {
    if (data.gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(data.gstin)) {
        throw new ValidationError('Invalid GSTIN format', 'gstin');
      }
    }

    if (data.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(data.pan)) {
        throw new ValidationError('Invalid PAN format', 'pan');
      }
    }
  }

  /**
   * Create a new company with validation
   */
  async create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.validateCompanyData(data);
    return super.create(data);
  }

  /**
   * Update company with validation
   */
  async update(id: string, data: Partial<Omit<Company, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.validateCompanyData(data);
    return super.update(id, data);
  }

  /**
   * Get company state from GSTIN or address
   */
  getCompanyState(company: Company): string {
    if (company.state) return company.state;
    if (company.address?.state) return company.address.state;
    
    // Extract from GSTIN if available
    if (company.gstin && company.gstin.length >= 2) {
      // You can map state codes to state names here
      return company.gstin.substring(0, 2);
    }
    
    return '';
  }
}

// Export singleton instance
export const companyService = new CompanyService();
