/**
 * Product Service
 * 
 * Business logic for product/service management with validation
 * and error handling.
 * 
 * @module lib/services/product-service
 */

import { Product } from '@/types';
import { BaseService } from './base-service';
import { ValidationError } from '@/lib/errors/error-handler';

/**
 * Service for managing products and services
 */
class ProductService extends BaseService<Product> {
  constructor() {
    super('products');
  }

  /**
   * Validate product data before creating/updating
   */
  private validateProductData(data: Partial<Product>): void {
    if (data.price !== undefined && data.price < 0) {
      throw new ValidationError('Price cannot be negative', 'price');
    }

    if (data.gstRate !== undefined && (data.gstRate < 0 || data.gstRate > 28)) {
      throw new ValidationError('GST rate must be between 0 and 28', 'gstRate');
    }

    if (data.cessRate !== undefined && (data.cessRate < 0 || data.cessRate > 100)) {
      throw new ValidationError('Cess rate must be between 0 and 100', 'cessRate');
    }

    if (data.stock !== undefined && data.stock < 0) {
      throw new ValidationError('Stock cannot be negative', 'stock');
    }

    if (data.hsn) {
      // HSN should be 4-8 digits
      if (!/^\d{4,8}$/.test(data.hsn)) {
        throw new ValidationError('HSN/SAC code must be 4-8 digits', 'hsn');
      }
    }
  }

  /**
   * Create a new product with validation
   */
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.validateProductData(data);
    return super.create(data);
  }

  /**
   * Update product with validation
   */
  async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.validateProductData(data);
    return super.update(id, data);
  }

  /**
   * Search products by name
   */
  async searchByName(searchTerm: string, companyId: string): Promise<Product[]> {
    const products = await this.getByCompanyId(companyId);
    const lowerSearch = searchTerm.toLowerCase();
    
    return products.filter(product =>
      product.productName.toLowerCase().includes(lowerSearch) ||
      product.description?.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Get products by type
   */
  async getByType(companyId: string, type: 'product' | 'service'): Promise<Product[]> {
    const products = await this.getByCompanyId(companyId);
    return products.filter(product => product.type === type);
  }

  /**
   * Update stock quantity
   */
  async updateStock(id: string, quantity: number): Promise<void> {
    if (quantity < 0) {
      throw new ValidationError('Stock quantity cannot be negative', 'stock');
    }
    
    return this.update(id, { stock: quantity });
  }

  /**
   * Reduce stock after sale
   */
  async reduceStock(id: string, quantity: number): Promise<void> {
    const product = await this.getById(id);
    if (!product) {
      throw new ValidationError('Product not found', 'id');
    }

    const currentStock = product.stock || 0;
    const newStock = currentStock - quantity;

    if (newStock < 0) {
      throw new ValidationError('Insufficient stock', 'stock');
    }

    return this.updateStock(id, newStock);
  }
}

// Export singleton instance
export const productService = new ProductService();
