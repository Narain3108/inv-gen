export interface VendorAnalysisRow {
  id: string;
  vendorName: string;
  source: string;
  hasVendor: boolean;
  isBillNameAsVendor?: boolean;
}

export function resolveVendorName(bill: any, clients: any[] = [], displayNumber: string = '-') {
  const clientId = bill.clientId || bill.client_id;
  const vendor = clients.find((c) => c.id === clientId);

  if (vendor) {
    const name = (vendor as any).clientName || (vendor as any).name || (vendor as any).companyName || 'Unnamed Vendor';
    return { vendorName: name, hasVendor: true, source: 'client' };
  }

  if (clientId) {
    return { vendorName: `Unknown Vendor (ID: ${String(clientId).substring(0, 8)}...)`, hasVendor: false, source: 'missing_client' };
  }

  const legacyVendorName = bill.vendorName || bill.vendor_name || '';
  const isBillNameAsVendor = legacyVendorName && legacyVendorName === displayNumber;

  if (legacyVendorName && typeof legacyVendorName === 'string' && legacyVendorName.trim() !== '' && !isBillNameAsVendor) {
    return { vendorName: legacyVendorName, hasVendor: false, source: 'legacy' };
  }

  return { vendorName: 'Vendor Not Specified', hasVendor: false, source: 'none', isBillNameAsVendor };
}

export function analyzeVendors(purchases: any[], clients: any[]): VendorAnalysisRow[] {
  return purchases.map((bill) => {
    const displayNumber = bill.invoiceNumber || bill.billNumber || bill.invoice_number || bill.bill_number || '-';
    const result = resolveVendorName(bill, clients, displayNumber);
    return {
      id: bill.id,
      vendorName: result.vendorName,
      source: result.source,
      hasVendor: !!result.hasVendor,
      isBillNameAsVendor: !!result.isBillNameAsVendor,
    };
  });
}
