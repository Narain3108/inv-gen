/**
 * Customization Service
 * Handles CRUD operations for invoice/quotation customizations
 */

import {
  InvoiceCustomization,
  DEFAULT_INVOICE_CUSTOMIZATION,
  DEFAULT_QUOTATION_CUSTOMIZATION,
} from '@/types/customization';
import { customizationsApi } from '@/lib/api/customizations.api';
import { companiesApi } from '@/lib/api/companies.api';

/**
 * Load customization for a specific company and type
 */
export async function loadCustomization(
  companyId: string,
  type: 'invoice' | 'quotation'
): Promise<InvoiceCustomization> {
  try {
    // First, fetch company data to get terms and notes
    const company = await companiesApi.getById(companyId);
    
    let companyTerms = '';
    let companyNotes = '';
    
    if (company) {
      companyTerms = company.termsAndConditions || '';
      companyNotes = company.additionalNotes || '';
    }

    // Then fetch customization from API (returns single object)
    const customization = await customizationsApi.getByCompanyId(companyId, type);

    if (customization && customization.id !== 'default') {
      const data = customization as InvoiceCustomization;
      
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
    
    // Use API to create or update customization
    await customizationsApi.createOrUpdate(companyId, {
      ...customization,
      companyId,
      type,
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
