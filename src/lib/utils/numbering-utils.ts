import { Company } from '@/types';

export const generateInvoiceNumber = (company: Company, invoiceCount: number = 0): string => {
  try {
    const config = company?.invoiceNumbering;
    
    if (!config || typeof config !== 'object') {
      const nextNum = invoiceCount + 1;
      return `INV${String(nextNum).padStart(4, '0')}`;
    }
    
    const prefix = config.prefix ?? '';
    const suffix = config.suffix ?? '';
    const order = config.order ?? 'prefix,number,suffix';
    
    // Use stored nextNumber if valid, otherwise calculate from invoice count
    let nextNumber: number;
    if (typeof config.nextNumber === 'number' && !isNaN(config.nextNumber) && config.nextNumber > 0) {
      nextNumber = config.nextNumber;
    } else {
      nextNumber = invoiceCount + 1;
    }
    
    console.log('📊 Invoice generation:', { 
      invoiceCount, 
      storedNextNumber: config.nextNumber, 
      calculatedNextNumber: nextNumber,
      prefix,
      suffix,
      order
    });
    
    const paddedNumber = String(nextNumber).padStart(3, '0');
    
    const components: Record<string, string> = {
      'prefix': prefix,
      'number': paddedNumber,
      'suffix': suffix,
    };
    
    const orderParts = order.split(',').map(p => p.trim().toLowerCase());
    
    const result = orderParts
      .map(part => {
        const value = components[part];
        return value !== undefined ? value : '';
      })
      .join('');
    
    if (!result || result.trim() === '') {
      return `INV${String(nextNumber).padStart(4, '0')}`;
    }
    
    console.log('✅ Generated invoice number:', result);
    return result;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    const nextNum = invoiceCount + 1;
    return `INV${String(nextNum).padStart(4, '0')}`;
  }
};

export const generateQuotationNumber = (company: Company, quotationCount: number = 0): string => {
  try {
    const config = company?.quotationNumbering;
    
    if (!config || typeof config !== 'object') {
      const nextNum = quotationCount + 1;
      return `QUO${String(nextNum).padStart(4, '0')}`;
    }
    
    const prefix = config.prefix ?? '';
    const suffix = config.suffix ?? '';
    const order = config.order ?? 'prefix,number,suffix';
    
    // Use stored nextNumber if valid, otherwise calculate from quotation count
    let nextNumber: number;
    if (typeof config.nextNumber === 'number' && !isNaN(config.nextNumber) && config.nextNumber > 0) {
      nextNumber = config.nextNumber;
    } else {
      nextNumber = quotationCount + 1;
    }
    
    console.log('📊 Quotation generation:', { 
      quotationCount, 
      storedNextNumber: config.nextNumber, 
      calculatedNextNumber: nextNumber,
      prefix,
      suffix,
      order
    });
    
    const paddedNumber = String(nextNumber).padStart(3, '0');
    
    const components: Record<string, string> = {
      'prefix': prefix,
      'number': paddedNumber,
      'suffix': suffix,
    };
    
    const orderParts = order.split(',').map(p => p.trim().toLowerCase());
    
    const result = orderParts
      .map(part => {
        const value = components[part];
        return value !== undefined ? value : '';
      })
      .join('');
    
    if (!result || result.trim() === '') {
      return `QUO${String(nextNumber).padStart(4, '0')}`;
    }
    
    console.log('✅ Generated quotation number:', result);
    return result;
  } catch (error) {
    console.error('Error generating quotation number:', error);
    const nextNum = quotationCount + 1;
    return `QUO${String(nextNum).padStart(4, '0')}`;
  }
};
