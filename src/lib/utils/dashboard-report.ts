/**
 * Dashboard Report Generator
 * Generate comprehensive PDF reports from dashboard data
 */

import { formatCurrency, formatDate } from '@/utils/formatters';
import { Invoice, Quotation, Client, Product, Company } from '@/types';

interface DashboardData {
  company: Company;
  stats: {
    totalRevenue: number;
    revenueGrowth: number;
    totalInvoices: number;
    invoicesGrowth: number;
    pendingAmount: number;
    paidAmount: number;
    totalClients: number;
    totalProducts: number;
    lowStockProducts: number;
    totalQuotations: number;
    averageInvoiceValue: number;
    paymentRate: number;
  };
  invoices: Invoice[];
  quotations: Quotation[];
  clients: Client[];
  products: Product[];
  timeFilter: string;
}

export function generateDashboardReport(data: DashboardData): string {
  const { company, stats, invoices, quotations, clients, products, timeFilter } = data;
  const reportDate = new Date().toLocaleString();
  
  // Calculate additional metrics
  const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid').length;
  const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'pending').length;
  const partiallyPaidInvoices = invoices.filter(inv => inv.paymentStatus === 'partially_paid').length;
  
  const topClients = getTopClients(invoices, clients, 5);
  const lowStockProducts = products.filter(p => p.type === 'product' && typeof p.stock === 'number' && p.stock < 10);
  
  // Build report text
  let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                          BUSINESS DASHBOARD REPORT                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

Company: ${company.name}
${company.gstin ? `GSTIN: ${company.gstin}` : ''}
Report Period: ${getTimeFilterLabel(timeFilter)}
Generated On: ${reportDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 KEY PERFORMANCE INDICATORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 REVENUE METRICS
  Total Revenue:              ${formatCurrency(stats.totalRevenue).padStart(20)}
  Revenue Growth:             ${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(2)}%
  Average Invoice Value:      ${formatCurrency(stats.averageInvoiceValue).padStart(20)}

💳 PAYMENT METRICS
  Amount Collected:           ${formatCurrency(stats.paidAmount).padStart(20)}
  Amount Pending:             ${formatCurrency(stats.pendingAmount).padStart(20)}
  Collection Rate:            ${stats.paymentRate.toFixed(2)}%

📄 INVOICE STATISTICS
  Total Invoices:             ${stats.totalInvoices.toString().padStart(20)}
  Paid Invoices:              ${paidInvoices.toString().padStart(20)}
  Partially Paid:             ${partiallyPaidInvoices.toString().padStart(20)}
  Pending Invoices:           ${pendingInvoices.toString().padStart(20)}
  Invoice Growth:             ${stats.invoicesGrowth >= 0 ? '+' : ''}${stats.invoicesGrowth.toFixed(2)}%

👥 CLIENT METRICS
  Total Clients:              ${stats.totalClients.toString().padStart(20)}
  Active Clients:             ${topClients.length.toString().padStart(20)}

📦 PRODUCT METRICS
  Total Products:             ${stats.totalProducts.toString().padStart(20)}
  Low Stock Items:            ${stats.lowStockProducts.toString().padStart(20)}

📋 QUOTATION METRICS
  Total Quotations:           ${stats.totalQuotations.toString().padStart(20)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 TOP 5 CLIENTS BY REVENUE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  topClients.forEach((client, index) => {
    report += `\n${index + 1}. ${client.name.padEnd(40)} ${formatCurrency(client.totalAmount).padStart(20)}`;
  });

  if (lowStockProducts.length > 0) {
    report += `\n
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  LOW STOCK ALERTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    
    lowStockProducts.slice(0, 10).forEach((product, index) => {
      report += `\n${index + 1}. ${product.productName.padEnd(40)} Stock: ${(product.stock || 0).toString().padStart(5)}`;
    });
  }

  report += `\n
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 PAYMENT STATUS BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status          Count         Percentage
─────────────────────────────────────────
Paid            ${paidInvoices.toString().padStart(5)}         ${((paidInvoices / stats.totalInvoices) * 100).toFixed(1)}%
Partially Paid  ${partiallyPaidInvoices.toString().padStart(5)}         ${((partiallyPaidInvoices / stats.totalInvoices) * 100).toFixed(1)}%
Pending         ${pendingInvoices.toString().padStart(5)}         ${((pendingInvoices / stats.totalInvoices) * 100).toFixed(1)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RECENT INVOICES (Last 10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  invoices.slice(0, 10).forEach((invoice, index) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const statusIcon = invoice.paymentStatus === 'paid' ? '✓' : 
                      invoice.paymentStatus === 'partially_paid' ? '◐' : '○';
    report += `\n${statusIcon} ${invoice.invoiceNumber.padEnd(20)} ${(client?.clientName || 'Unknown').padEnd(30)} ${formatCurrency(invoice.totalAmount).padStart(15)}`;
  });

  report += `\n
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FINANCIAL SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Billed:               ${formatCurrency(stats.totalRevenue).padStart(20)}
Total Collected:            ${formatCurrency(stats.paidAmount).padStart(20)}
Outstanding:                ${formatCurrency(stats.pendingAmount).padStart(20)}
Collection Efficiency:      ${stats.paymentRate.toFixed(2)}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Report
Generated by Invoice Management System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return report;
}

function getTopClients(invoices: Invoice[], clients: Client[], limit: number = 5) {
  const clientTotals = new Map<string, number>();
  
  invoices.forEach(invoice => {
    const current = clientTotals.get(invoice.clientId) || 0;
    clientTotals.set(invoice.clientId, current + invoice.totalAmount);
  });
  
  const topClientIds = Array.from(clientTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return topClientIds.map(([clientId, totalAmount]) => {
    const client = clients.find(c => c.id === clientId);
    return {
      id: clientId,
      name: client?.clientName || 'Unknown Client',
      totalAmount,
    };
  });
}

function getTimeFilterLabel(filter: string): string {
  const labels: Record<string, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    quarter: 'This Quarter',
    year: 'This Year',
    all: 'All Time',
  };
  return labels[filter] || filter;
}

export function downloadTextReport(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
