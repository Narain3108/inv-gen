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
 * Seed demo data for a user
 */
export const seedDemoData = async (userId: string): Promise<{
  success: boolean;
  message: string;
  data?: {
    company: Company;
    products: Product[];
    clients: Client[];
    invoicesCount: number;
  };
}> => {
  try {
    // Check if user already has data
    const companiesRef = collection(db, 'companies');
    const existingCompanies = await getDocs(
      query(companiesRef, where('userId', '==', userId))
    );

    if (!existingCompanies.empty) {
      return {
        success: false,
        message: 'Demo data already exists. Please delete existing data first.',
      };
    }

    // Create company
    const companyData = generateDemoCompany(userId);
    const companyRef = await addDoc(collection(db, 'companies'), companyData);
    const company: Company = { id: companyRef.id, ...companyData };

    // Create products
    const productsData = generateDemoProducts(userId, company.id);
    const products: Product[] = [];
    
    for (const productData of productsData) {
      const productRef = await addDoc(collection(db, 'products'), productData);
      products.push({ id: productRef.id, ...productData });
    }

    // Create clients
    const clientsData = generateDemoClients(userId, company.id);
    const clients: Client[] = [];
    
    for (const clientData of clientsData) {
      const clientRef = await addDoc(collection(db, 'clients'), clientData);
      clients.push({ id: clientRef.id, ...clientData });
    }

    // Create invoices
    const invoicesData = generateDemoInvoices(
      userId,
      company.id,
      company.state || company.address.state, // Use state or fallback to address state
      products,
      clients
    );

    for (const invoiceData of invoicesData) {
      await addDoc(collection(db, 'invoices'), invoiceData);
    }

    return {
      success: true,
      message: `Successfully created demo data: 1 company, ${products.length} products, ${clients.length} clients, and ${invoicesData.length} invoices`,
      data: {
        company,
        products,
        clients,
        invoicesCount: invoicesData.length,
      },
    };
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return {
      success: false,
      message: `Failed to create demo data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Clear all demo data for a user
 */
export const clearDemoData = async (userId: string): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const batch = writeBatch(db);
    let deleteCount = 0;

    // Delete companies
    const companiesSnapshot = await getDocs(
      query(collection(db, 'companies'), where('userId', '==', userId))
    );
    companiesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete products
    const productsSnapshot = await getDocs(
      query(collection(db, 'products'), where('userId', '==', userId))
    );
    productsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete clients
    const clientsSnapshot = await getDocs(
      query(collection(db, 'clients'), where('userId', '==', userId))
    );
    clientsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    // Delete invoices
    const invoicesSnapshot = await getDocs(
      query(collection(db, 'invoices'), where('userId', '==', userId))
    );
    invoicesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    await batch.commit();

    return {
      success: true,
      message: `Successfully deleted ${deleteCount} records`,
    };
  } catch (error) {
    console.error('Error clearing demo data:', error);
    return {
      success: false,
      message: `Failed to clear demo data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
