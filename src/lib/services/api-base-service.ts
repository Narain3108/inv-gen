/**
 * API-Based Base Service Class
 * 
 * Provides common CRUD operations using backend API
 * with proper error handling and type safety.
 * 
 * @module lib/services/api-base-service
 */

import { handleAsyncError } from '@/lib/errors/error-handler';

/**
 * Base service class with API-based CRUD operations
 */
export abstract class ApiBaseService<T extends { id?: string }> {
  constructor(
    protected api: {
      getAll: (filters?: any) => Promise<T[]>;
      getById: (id: string) => Promise<T>;
      create: (data: any) => Promise<T>;
      update: (id: string, data: any) => Promise<T>;
      delete: (id: string) => Promise<void>;
    }
  ) {}

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    return handleAsyncError(
      async () => {
        try {
          return await this.api.getById(id);
        } catch (error: any) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      },
      `Failed to fetch item`
    );
  }

  /**
   * Get all documents
   */
  async getAll(orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc'): Promise<T[]> {
    return handleAsyncError(
      () => this.api.getAll({ ordering: orderByField ? `${orderDirection === 'desc' ? '-' : ''}${orderByField}` : undefined }),
      `Failed to fetch items`
    );
  }

  /**
   * Get documents by company ID
   */
  async getByCompanyId(
    companyId: string,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<T[]> {
    return handleAsyncError(
      () => this.api.getAll({ 
        company_id: companyId,
        ordering: orderByField ? `${orderDirection === 'desc' ? '-' : ''}${orderByField}` : undefined 
      }),
      `Failed to fetch items for company`
    );
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return handleAsyncError(
      async () => {
        const result = await this.api.create(data);
        return result.id!;
      },
      `Failed to create item`
    );
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    return handleAsyncError(
      async () => {
        await this.api.update(id, data);
      },
      `Failed to update item`
    );
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    return handleAsyncError(
      () => this.api.delete(id),
      `Failed to delete item`
    );
  }

  /**
   * Query documents with custom filters
   */
  protected async query(filters: Record<string, any>): Promise<T[]> {
    return handleAsyncError(
      () => this.api.getAll(filters),
      `Failed to query items`
    );
  }
}
