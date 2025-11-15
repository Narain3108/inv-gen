/**
 * Client Service
 * 
 * Business logic for client management with validation
 * and error handling.
 * 
 * @module lib/services/client-service
 */

import { Client } from '@/types';
import { BaseService } from './base-service';
import { ValidationError } from '@/lib/errors/error-handler';

/**
 * Service for managing clients
 */
class ClientService extends BaseService<Client> {
  constructor() {
    super('clients');
  }

  /**
   * Validate client data before creating/updating
   */
  private validateClientData(data: Partial<Client>): void {
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

    if (data.contact?.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.contact.email)) {
        throw new ValidationError('Invalid email format', 'contact.email');
      }
    }
  }

  /**
   * Create a new client with validation
   */
  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    this.validateClientData(data);
    return super.create(data);
  }

  /**
   * Update client with validation
   */
  async update(id: string, data: Partial<Omit<Client, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    this.validateClientData(data);
    return super.update(id, data);
  }

  /**
   * Search clients by name
   */
  async searchByName(searchTerm: string, companyId: string): Promise<Client[]> {
    const clients = await this.getByCompanyId(companyId);
    const lowerSearch = searchTerm.toLowerCase();
    
    return clients.filter(client =>
      client.clientName.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Get client state from address
   */
  getClientState(client: Client): string {
    return client.address?.state || '';
  }
}

// Export singleton instance
export const clientService = new ClientService();
