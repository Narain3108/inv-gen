/**
 * Invoice Service
 * 
 * Business logic for invoice management with validation,
 * tax calculations, and PDF generation.
 * 
 * @module lib/services/invoice-service
 */

import { Invoice, InvoiceItem, Client, Product, Company } from '@/types';
import { BaseService } from './base-service';
import { ValidationError, NotFoundError } from '@/lib/errors/error-handler';
import { calculateInvoiceTotals } from '@/lib/utils/tax-calculator';
import { amountToWords } from '@/lib/utils/number-to-words';
import { Timestamp } from 'firebase/firestore';

/**
 * Service for managing invoices
 */
class InvoiceService extends BaseService<Invoice> {
  constructor() {
    super('invoices');
  }

  /**
   * Validate invoice data
   */
  private validateInvoiceData(data: Partial<Invoice>): void {
    if (data.items && data.items.length === 0) {
      throw new ValidationError('Invoice must have at least one item', 'items');
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
   * Calculate invoice totals with tax
   */
  calculateTotals(
    items: InvoiceItem[],
    companyState: string,
    clientState: string
  ): {
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalAmount: number;
  } {
    // Convert InvoiceItems to the format expected by tax calculator
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
   * Create invoice with automatic calculations
   */
  async createWithCalculations(
    data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount' | 'totalAmountInWords' | 'taxableAmount' | 'cgst' | 'sgst' | 'igst'>,
    companyState: string,
    clientState: string
  ): Promise<string> {
    this.validateInvoiceData(data);

    const totals = this.calculateTotals(data.items, companyState, clientState);

    const invoiceData = {
      ...data,
      ...totals,
      totalAmountInWords: amountToWords(totals.totalAmount),
    };

    return this.create(invoiceData as Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>);
  }

  /**
   * Update invoice with recalculations
   */
  async updateWithCalculations(
    id: string,
    data: Partial<Invoice>,
    companyState: string,
    clientState: string
  ): Promise<void> {
    this.validateInvoiceData(data);

    let updateData = { ...data };

    if (data.items) {
      const totals = this.calculateTotals(data.items, companyState, clientState);
      updateData = {
        ...updateData,
        ...totals,
        totalAmountInWords: amountToWords(totals.totalAmount),
      };
    }

    return this.update(id, updateData as Partial<Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>>);
  }

  /**
   * Get invoices for a date range
   */
  async getByDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Invoice[]> {
    const allInvoices = await this.getByCompanyId(companyId, 'date', 'desc');
    
    return allInvoices.filter(invoice => {
      const invoiceDate = invoice.date instanceof Timestamp 
        ? invoice.date.toDate() 
        : new Date(invoice.date);
      
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }

  /**
   * Get invoices by client
   */
  async getByClient(clientId: string): Promise<Invoice[]> {
    return this.query('clientId', '==', clientId, 'date', 'desc');
  }

  /**
   * Get latest invoice number for company
   */
  async getLatestInvoiceNumber(companyId: string): Promise<string> {
    const invoices = await this.getByCompanyId(companyId, 'createdAt', 'desc');
    
    if (invoices.length === 0) {
      const year = new Date().getFullYear();
      return `INV-${year}-001`;
    }

    const lastInvoice = invoices[0];
    const lastNumber = lastInvoice.invoiceNumber;
    
    // Extract number and increment
    const match = lastNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      const year = new Date().getFullYear();
      return `INV-${year}-${String(num).padStart(3, '0')}`;
    }

    const year = new Date().getFullYear();
    return `INV-${year}-001`;
  }

  /**
   * Calculate total revenue for a company
   */
  async getTotalRevenue(companyId: string): Promise<number> {
    const invoices = await this.getByCompanyId(companyId);
    return invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  }

  /**
   * Get invoice statistics
   */
  async getStatistics(companyId: string): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    totalTax: number;
    averageInvoiceValue: number;
  }> {
    const invoices = await this.getByCompanyId(companyId);

    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalTax = invoices.reduce((sum, inv) => 
      sum + (inv.cgst || 0) + (inv.sgst || 0) + (inv.igst || 0), 0
    );
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;

    return {
      totalInvoices,
      totalRevenue,
      totalTax,
      averageInvoiceValue,
    };
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
