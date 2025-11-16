/**
 * Customization Service
 * Handles CRUD operations for invoice/quotation customizations
 */

import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  InvoiceCustomization,
  DEFAULT_INVOICE_CUSTOMIZATION,
  DEFAULT_QUOTATION_CUSTOMIZATION,
} from '@/types/customization';
import { Company } from '@/types';

/**
 * Load customization for a specific company and type
 */
export async function loadCustomization(
  companyId: string,
  type: 'invoice' | 'quotation'
): Promise<InvoiceCustomization> {
  try {
    // First, fetch company data to get terms and notes
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    
    let companyTerms = '';
    let companyNotes = '';
    
    if (companySnap.exists()) {
      const companyData = companySnap.data() as Company;
      companyTerms = companyData.termsAndConditions || '';
      companyNotes = companyData.additionalNotes || '';
    }

    // Then fetch customization
    const docRef = doc(db, 'customizations', `${companyId}_${type}`);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as InvoiceCustomization;
      
      // Ensure all columns have valid width values
      if (data.table && data.table.columns) {
        console.log('📋 Validating column widths from Firestore...');
        
        data.table.columns = data.table.columns.map((col, index) => {
          // Get default width from DEFAULT_INVOICE_COLUMNS
          const defaults = type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION;
          const defaultCol = defaults.table.columns.find(dc => dc.id === col.id);
          
          // Determine the final width value
          let finalWidth = col.width;
          if (!finalWidth || finalWidth === '') {
            finalWidth = defaultCol?.width || (col.id === 'description' ? '*' : '50');
            console.log(`  ⚠️ Column '${col.id}' missing width, using fallback: ${finalWidth}`);
          }
          
          return {
            ...col,
            width: finalWidth,
          };
        });
        
        console.log('✅ All column widths validated');
      }
      
      // Update footer with company's actual terms and notes
      if (data.footer) {
        data.footer.termsText = companyTerms;
        data.footer.thankYouText = companyNotes;
      }
      
      return data;
    }

    // Return defaults if no customization exists, with company's terms and notes
    console.log('📋 No customization found, using defaults with company data');
    const defaults = type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION;
    
    return {
      ...defaults,
      companyId,
      footer: {
        ...defaults.footer,
        termsText: companyTerms,
        thankYouText: companyNotes,
      },
    };
  } catch (error) {
    console.error('❌ Error loading customization:', error);
    throw error;
  }
}

/**
 * Save customization for a specific company and type
 */
export async function saveCustomization(
  companyId: string,
  type: 'invoice' | 'quotation',
  customization: InvoiceCustomization
): Promise<void> {
  try {
    const docRef = doc(db, 'customizations', `${companyId}_${type}`);
    
    // Ensure all columns have width property before saving
    if (customization.table && customization.table.columns) {
      console.log('📋 Validating columns before saving...');
      
      const defaults = type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION;
      customization.table.columns = customization.table.columns.map(col => {
        const defaultCol = defaults.table.columns.find(dc => dc.id === col.id);
        const finalWidth = col.width || defaultCol?.width || (col.id === 'description' ? '*' : '50');
        
        if (!col.width) {
          console.log(`  ⚠️ Column '${col.id}' missing width, adding: ${finalWidth}`);
        }
        
        return {
          ...col,
          width: finalWidth,
        };
      });
      
      console.log('✅ All columns validated for saving');
    }
    
    await setDoc(docRef, {
      ...customization,
      companyId,
      type,
      updatedAt: serverTimestamp(),
      createdAt: customization.createdAt || serverTimestamp(),
    });
    
    console.log('✅ Customization saved successfully');
  } catch (error) {
    console.error('❌ Error saving customization:', error);
    throw error;
  }
}

/**
 * Get default customization for a type
 */
export function getDefaultCustomization(
  companyId: string,
  type: 'invoice' | 'quotation'
): InvoiceCustomization {
  return {
    ...(type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION),
    companyId,
  };
}

/**
 * Reset customization to defaults
 */
export async function resetCustomization(
  companyId: string,
  type: 'invoice' | 'quotation'
): Promise<void> {
  const defaultCustomization = getDefaultCustomization(companyId, type);
  await saveCustomization(companyId, type, defaultCustomization);
}
