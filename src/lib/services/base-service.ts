/**
 * Base Service Class
 * 
 * Provides common CRUD operations for Firestore collections
 * with proper error handling and type safety.
 * 
 * @module lib/services/base-service
 */

import { DocumentData } from 'firebase/firestore';
import {
  getDocument,
  getAllDocuments,
  queryDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getCompanyDocuments,
} from '@/lib/firebase/firestore-helpers';
import { handleAsyncError } from '@/lib/errors/error-handler';

/**
 * Base service class with CRUD operations
 */
export abstract class BaseService<T extends DocumentData> {
  constructor(protected collectionName: string) {}

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    return handleAsyncError(
      () => getDocument<T>(this.collectionName, id),
      `Failed to fetch ${this.collectionName}`
    );
  }

  /**
   * Get all documents
   */
  async getAll(orderByField?: string, orderDirection: 'asc' | 'desc' = 'desc'): Promise<T[]> {
    return handleAsyncError(
      () => getAllDocuments<T>(this.collectionName, orderByField, orderDirection),
      `Failed to fetch ${this.collectionName}`
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
      () => getCompanyDocuments<T>(this.collectionName, companyId, orderByField, orderDirection),
      `Failed to fetch ${this.collectionName} for company`
    );
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return handleAsyncError(
      () => createDocument<T>(this.collectionName, data),
      `Failed to create ${this.collectionName}`
    );
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    return handleAsyncError(
      () => updateDocument<T>(this.collectionName, id, data),
      `Failed to update ${this.collectionName}`
    );
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    return handleAsyncError(
      () => deleteDocument(this.collectionName, id),
      `Failed to delete ${this.collectionName}`
    );
  }

  /**
   * Query documents with custom filters
   */
  protected async query(
    field: string,
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=',
    value: unknown,
    orderByField?: string,
    orderDirection: 'asc' | 'desc' = 'desc'
  ): Promise<T[]> {
    return handleAsyncError(
      () => queryDocuments<T>(this.collectionName, field, operator, value, orderByField, orderDirection),
      `Failed to query ${this.collectionName}`
    );
  }
}
