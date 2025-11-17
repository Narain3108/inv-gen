/**
 * Export Utilities
 * Functions for exporting data to Excel, CSV, and PDF formats
 */

import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Client, Product, Invoice, Quotation } from '@/types';

// ==================== Excel Export ====================

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...data.map(row => String(row[key] || '').length)
        )
      )
    }));
    worksheet['!cols'] = colWidths;
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}

// ==================== CSV Export ====================

export function exportToCSV(data: any[], filename: string) {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
}

// ==================== Format Data for Export ====================

export function formatClientsForExport(clients: Client[]) {
  return clients.map(client => ({
    'Client Name': client.clientName,
    'GSTIN': client.gstin || 'N/A',
    'Email': client.contact?.email || '',
    'Phone': client.contact?.phone || '',
    'Address': `${client.address?.street}, ${client.address?.city}, ${client.address?.state} - ${client.address?.pincode}`,
    'State': client.address?.state || '',
    'City': client.address?.city || '',
    'PAN': client.pan || 'N/A',
  }));
}

export function formatProductsForExport(products: Product[]) {
  return products.map(product => ({
    'Product Name': product.productName,
    'Item Code': product.itemCode || 'N/A',
    'HSN/SAC': product.hsn,
    'Type': product.type === 'product' ? 'Product' : 'Service',
    'Unit': product.unit,
    'Price': formatCurrency(product.price),
    'GST Rate': `${product.gstRate}%`,
    'Stock': product.type === 'product' ? (product.stock || 0) : 'N/A',
    'Description': product.description || '',
  }));
}

export function formatInvoicesForExport(invoices: Invoice[], clients: Client[]) {
  return invoices.map(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    return {
      'Invoice Number': invoice.invoiceNumber,
      'Client Name': client?.clientName || 'Unknown',
      'Date': formatDate(invoice.date),
      'Total Amount': formatCurrency(invoice.totalAmount),
      'Amount Paid': formatCurrency(invoice.amountPaid || 0),
      'Amount Pending': formatCurrency(invoice.amountPending || invoice.totalAmount),
      'Payment Status': invoice.paymentStatus === 'paid' ? 'Paid' : 
                       invoice.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Pending',
      'Taxable Amount': formatCurrency(invoice.taxableAmount),
      'CGST': formatCurrency(invoice.cgst || 0),
      'SGST': formatCurrency(invoice.sgst || 0),
      'IGST': formatCurrency(invoice.igst || 0),
      'Items Count': invoice.items?.length || 0,
    };
  });
}

export function formatQuotationsForExport(quotations: Quotation[], clients: Client[]) {
  return quotations.map(quotation => {
    const client = clients.find(c => c.id === quotation.clientId);
    const validUntil = quotation.validUntil?.toDate ? quotation.validUntil.toDate() : null;
    const isExpired = validUntil ? validUntil < new Date() : false;
    
    return {
      'Quotation Number': quotation.quotationNumber,
      'Client Name': client?.clientName || 'Unknown',
      'Date': formatDate(quotation.date),
      'Valid Until': validUntil ? formatDate(quotation.validUntil) : 'N/A',
      'Status': quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1),
      'Is Expired': isExpired ? 'Yes' : 'No',
      'Total Amount': formatCurrency(quotation.totalAmount),
      'Taxable Amount': formatCurrency(quotation.taxableAmount),
      'CGST': formatCurrency(quotation.cgst || 0),
      'SGST': formatCurrency(quotation.sgst || 0),
      'IGST': formatCurrency(quotation.igst || 0),
      'Items Count': quotation.items?.length || 0,
    };
  });
}
