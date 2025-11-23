/**
 * Utility to initialize default numbering config for existing companies
 * Run this once if you have companies without invoiceNumbering/quotationNumbering
 */

import { doc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function initializeCompanyNumbering() {
  try {
    const companiesSnapshot = await getDocs(collection(db, 'companies'));
    
    for (const companyDoc of companiesSnapshot.docs) {
      const companyData = companyDoc.data();
      
      const updates: any = {};
      
      // Initialize invoice numbering if missing
      if (!companyData.invoiceNumbering) {
        updates.invoiceNumbering = {
          prefix: '',
          suffix: '',
          order: 'prefix,number,suffix',
          nextNumber: 1,
        };
      }
      
      // Initialize quotation numbering if missing
      if (!companyData.quotationNumbering) {
        updates.quotationNumbering = {
          prefix: '',
          suffix: '',
          order: 'prefix,number,suffix',
          nextNumber: 1,
        };
      }
      
      // Update if there are any missing fields
      if (Object.keys(updates).length > 0) {
        console.log(`Initializing numbering for company: ${companyData.name}`);
        const companyRef = doc(db, 'companies', companyDoc.id);
        await updateDoc(companyRef, updates);
        console.log(`✅ Updated company: ${companyData.name}`);
      }
    }
    
    console.log('✅ All companies initialized with numbering config');
    return true;
  } catch (error) {
    console.error('Error initializing company numbering:', error);
    return false;
  }
}
