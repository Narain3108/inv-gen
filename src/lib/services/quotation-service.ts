/**
 * Quotation Service
 * 
 * Business logic for quotation management with validation,
 * tax calculations, and PDF generation.
 * 
 * @module lib/services/quotation-service
 */

import { Quotation } from '@/types';
import { ApiBaseService } from './api-base-service';
import { ValidationError, NotFoundError } from '@/lib/errors/error-handler';
import { calculateInvoiceTotals } from '@/lib/utils/tax-calculator';
import { amountToWords } from '@/lib/utils/number-to-words';
import { quotationsApi } from '@/lib/api/quotations.api';

/**
 * Service for managing quotations
 */
class QuotationService extends ApiBaseService<Quotation> {
  constructor() {
    super(quotationsApi);
  }

  /**
   * Validate quotation data
   */
  private validateQuotationData(data: Partial<Quotation>): void {
    if (data.items && data.items.length === 0) {
      throw new ValidationError('Quotation must have at least one item', 'items');
    }

    if (data.items) {
      data.items.forEach((item, index) => {
        if (item.quantity <= 0) {
          throw new ValidationError(`Item ${index + 1}: Quantity must be greater than 0`, 'items');
        }
        if (item.unitPrice < 0) {
          throw new ValidationError(`Item ${index + 1}: Unit price cannot be negative`, 'items');
        }
      });
    }

    if (data.totalAmount !== undefined && data.totalAmount < 0) {
      throw new ValidationError('Total amount cannot be negative', 'totalAmount');
    }
  }

  /**
   * Calculate quotation totals with tax
   */
  calculateTotals(
    items: NonNullable<Quotation['items']>,
    companyState: string,
    clientState: string
  ): {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
  } {
    // Convert QuotationItems to the format expected by tax calculator
    const calculatorItems = items.map(item => ({
      amount: item.unitPrice,
      quantity: item.quantity,
      gstRate: item.gstRate,
      discount: item.discount,
    }));

    const result = calculateInvoiceTotals(calculatorItems, companyState, clientState);
    
    return {
      taxableAmount: result.taxableAmount,
      cgst: result.cgst,
      sgst: result.sgst,
      igst: result.igst,
      totalAmount: result.grandTotal,
    };
  }

  /**
   * Create quotation with automatic calculations
   */
  async createWithCalculations(
    data: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'totalAmountInWords' | 'taxableAmount' | 'cgst' | 'sgst' | 'igst'>,
    companyState: string,
    clientState: string
  ): Promise<string> {
    this.validateQuotationData(data);

    const totals = this.calculateTotals(data.items, companyState, clientState);

    const quotationData = {
      ...data,
      ...totals,
      totalAmountInWords: amountToWords(totals.totalAmount),
    };

    return this.create(quotationData as Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Update quotation with recalculations
   */
  async updateWithCalculations(
    id: string,
    data: Partial<Quotation>,
    companyState: string,
    clientState: string
  ): Promise<void> {
    this.validateQuotationData(data);

    let updateData = { ...data };

    if (data.items) {
      const totals = this.calculateTotals(data.items, companyState, clientState);
      updateData = {
        ...updateData,
        ...totals,
        totalAmountInWords: amountToWords(totals.totalAmount),
      };
    }

    return this.update(id, updateData as Partial<Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'>>);
  }

  /**
   * Get quotations for a date range
   */
  async getByDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Quotation[]> {
    const allQuotations = await this.getByCompanyId(companyId, 'date', 'desc');
    
    return allQuotations.filter(quotation => {
      const quotationDate = typeof quotation.date === 'string' 
        ? new Date(quotation.date) 
        : new Date(quotation.date);
      
      return quotationDate >= startDate && quotationDate <= endDate;
    });
  }

  /**
   * Get quotations by client
   */
  async getByClient(clientId: string): Promise<Quotation[]> {
    return this.query({ client_id: clientId });
  }

  /**
   * Get latest quotation number for company
   */
  async getLatestQuotationNumber(companyId: string): Promise<string> {
    const quotations = await this.getByCompanyId(companyId, 'createdAt', 'desc');
    
    if (quotations.length === 0) {
      const year = new Date().getFullYear();
      return `QUO-${year}-001`;
    }

    const lastQuotation = quotations[0];
    const lastNumber = lastQuotation.quotationNumber;
    
    // Extract number and increment
    const match = lastNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      const year = new Date().getFullYear();
      return `QUO-${year}-${String(num).padStart(3, '0')}`;
    }

    const year = new Date().getFullYear();
    return `QUO-${year}-001`;
  }

  /**
   * Calculate total value for a company
   */
  async getTotalValue(companyId: string): Promise<number> {
    const quotations = await this.getByCompanyId(companyId);
    return quotations.reduce((sum, quotation) => sum + (quotation.totalAmount || 0), 0);
  }

  /**
   * Get quotation statistics
   */
  async getStatistics(companyId: string): Promise<{
    totalQuotations: number;
    totalValue: number;
    averageQuotationValue: number;
    acceptedCount: number;
    rejectedCount: number;
    pendingCount: number;
  }> {
    const quotations = await this.getByCompanyId(companyId);

    const totalQuotations = quotations.length;
    const totalValue = quotations.reduce((sum, quot) => sum + (quot.totalAmount || 0), 0);
    const averageQuotationValue = totalQuotations > 0 ? totalValue / totalQuotations : 0;
    
    const acceptedCount = quotations.filter(q => q.status === 'accepted').length;
    const rejectedCount = quotations.filter(q => q.status === 'rejected').length;
    const pendingCount = quotations.filter(q => ['pending', 'sent'].includes(q.status as string)).length;

    return {
      totalQuotations,
      totalValue,
      averageQuotationValue,
      acceptedCount,
      rejectedCount,
      pendingCount,
    };
  }
}

// Export singleton instance
export const quotationService = new QuotationService();
