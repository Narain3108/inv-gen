/**
 * Seed Database Script
 * Add demo data to Firestore for testing
 */

import { collection, addDoc, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase/config';
import {
  generateDemoCompany,
  generateDemoProducts,
  generateDemoClients,
  generateDemoInvoices,
} from '@/lib/demo-data';
import { Company, Product, Client } from '@/types';

/**
 * Seed demo data - DEPRECATED
 * This function is no longer used - all data is now real Firestore data
 */
export const seedDemoData = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return {
    success: false,
    message: 'Demo data functionality has been removed. Please create your data manually.',
  };
};

/**
 * Clear all data - DEPRECATED
 * This function is no longer used - use Firestore console to manage data
 */
export const clearDemoData = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  return {
    success: false,
    message: 'Demo data functionality has been removed. Please manage your data through the UI.',
  };
};
