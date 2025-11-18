/**
 * Dashboard PDF Report Generator
 * Professional PDF reports using pdfMake with charts and tables
 * 
 * @note: Some pdfMake type assertions are used to handle complex nested structures
 */

// @ts-nocheck - pdfMake has complex types that require flexibility

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { Invoice, Quotation, Client, Product, Company } from '@/types';

// Register fonts
if (pdfMake.vfs === undefined) {
  pdfMake.vfs = (pdfFonts as any).vfs;
}

interface DashboardStats {
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
}

interface DashboardReportData {
  company: Company;
  stats: DashboardStats;
  invoices: Invoice[];
  quotations: Quotation[];
  clients: Client[];
  products: Product[];
  timeFilter: string;
}

interface TopClient {
  id: string;
  name: string;
  totalAmount: number;
  invoiceCount: number;
}

/**
 * Generate Dashboard PDF Report
 */
export async function generateDashboardPDFReport(data: DashboardReportData): Promise<void> {
  const { company, stats, invoices, quotations, clients, products, timeFilter } = data;
  
  const docDefinition = createDocumentDefinition(data);
  
  pdfMake.createPdf(docDefinition).download(
    `Dashboard-Report-${company.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
  );
}

/**
 * Preview Dashboard PDF Report
 */
export async function previewDashboardPDFReport(data: DashboardReportData): Promise<void> {
  const docDefinition = createDocumentDefinition(data);
  pdfMake.createPdf(docDefinition).open();
}

/**
 * Create PDF Document Definition
 */
function createDocumentDefinition(data: DashboardReportData): TDocumentDefinitions {
  const { company, stats, invoices, quotations, clients, products, timeFilter } = data;
  
  const reportDate = new Date();
  const topClients = getTopClients(invoices, clients, 5);
  const lowStockProducts = products
    .filter(p => p.type === 'product' && typeof p.stock === 'number' && p.stock < 10)
    .sort((a, b) => (a.stock || 0) - (b.stock || 0))
    .slice(0, 10);
  
  const paymentBreakdown = getPaymentBreakdown(invoices);
  const gstBreakdown = getGSTBreakdown(invoices);
  const recentInvoices = invoices.slice(0, 10);

  return {
    pageSize: 'A4',
    pageMargins: [40, 100, 40, 60],
    
    header: (currentPage, pageCount) => createHeader(company, reportDate, timeFilter, currentPage, pageCount),
    footer: (currentPage, pageCount) => createFooter(currentPage, pageCount),
    
    content: [
      // Title
      {
        text: 'BUSINESS DASHBOARD REPORT',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20],
      },
      
      // Report Info
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'Report Period:', style: 'label' },
              { text: getTimeFilterLabel(timeFilter), style: 'value', margin: [0, 0, 0, 10] },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'Generated On:', style: 'label' },
              { text: formatDate(reportDate), style: 'value', margin: [0, 0, 0, 10] },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      },
      
      // Key Performance Indicators
      createKPISection(stats),
      
      // Financial Summary
      createFinancialSummary(stats, paymentBreakdown),
      
      // GST Collection
      createGSTSection(gstBreakdown),
      
      // Top Clients
      createTopClientsSection(topClients),
      
      // Payment Status Breakdown
      createPaymentStatusSection(paymentBreakdown),
      
      // Recent Invoices
      createRecentInvoicesSection(recentInvoices, clients),
      
      // Low Stock Alerts (if any)
      ...(lowStockProducts.length > 0 ? [createLowStockSection(lowStockProducts)] : []),
      
      // Quotation Metrics (if any)
      ...(quotations.length > 0 ? [createQuotationSection(quotations)] : []),
    ],
    
    styles: getStyles(),
    
    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
  };
}

/**
 * Create PDF Header
 */
function createHeader(
  company: Company,
  reportDate: Date,
  timeFilter: string,
  currentPage: number,
  pageCount: number
): Content {
  return {
    margin: [40, 20, 40, 0],
    stack: [
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: company.name, style: 'companyName' },
              { text: company.gstin ? `GSTIN: ${company.gstin}` : '', style: 'companyInfo' },
            ],
          },
          {
            width: 'auto',
            stack: [
              { text: `Page ${currentPage} of ${pageCount}`, style: 'pageNumber', alignment: 'right' },
              { text: new Date().toLocaleString(), style: 'companyInfo', alignment: 'right' },
            ],
          },
        ],
      },
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
            lineColor: '#3b82f6',
          },
        ],
        margin: [0, 10, 0, 0],
      },
    ],
  };
}

/**
 * Create PDF Footer
 */
function createFooter(currentPage: number, pageCount: number): Content {
  return {
    margin: [40, 0, 40, 20],
    stack: [
      {
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 515,
            y2: 0,
            lineWidth: 0.5,
            lineColor: '#cccccc',
          },
        ],
      },
      {
        text: 'Generated by Invoice Management System',
        alignment: 'center',
        style: 'footer',
        margin: [0, 10, 0, 0],
      },
    ],
  };
}

/**
 * Create KPI Section
 */
function createKPISection(stats: DashboardStats): Content {
  return {
    stack: [
      { text: 'KEY PERFORMANCE INDICATORS', style: 'sectionHeader' },
      {
        table: {
          widths: ['50%', '50%'],
          body: [
            [
              {
                stack: [
                  { text: 'Revenue Metrics', style: 'subHeader', margin: [0, 0, 0, 10] },
                  ...createMetricRow('Total Revenue', formatCurrency(stats.totalRevenue)),
                  ...createMetricRow('Revenue Growth', `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(2)}%`),
                  ...createMetricRow('Avg Invoice Value', formatCurrency(stats.averageInvoiceValue)),
                ],
                border: [true, true, false, true],
                margin: 5,
              },
              {
                stack: [
                  { text: 'Payment Metrics', style: 'subHeader', margin: [0, 0, 0, 10] },
                  ...createMetricRow('Amount Collected', formatCurrency(stats.paidAmount)),
                  ...createMetricRow('Amount Pending', formatCurrency(stats.pendingAmount)),
                  ...createMetricRow('Collection Rate', `${stats.paymentRate.toFixed(2)}%`),
                ],
                border: [false, true, true, true],
                margin: 5,
              },
            ],
            [
              {
                stack: [
                  { text: 'Invoice Statistics', style: 'subHeader', margin: [0, 0, 0, 10] },
                  ...createMetricRow('Total Invoices', stats.totalInvoices.toString()),
                  ...createMetricRow('Invoice Growth', `${stats.invoicesGrowth >= 0 ? '+' : ''}${stats.invoicesGrowth.toFixed(2)}%`),
                ],
                border: [true, false, false, true],
                margin: 5,
              },
              {
                stack: [
                  { text: 'Business Metrics', style: 'subHeader', margin: [0, 0, 0, 10] },
                  ...createMetricRow('Total Clients', stats.totalClients.toString()),
                  ...createMetricRow('Total Products', stats.totalProducts.toString()),
                  ...(stats.lowStockProducts > 0 ? createMetricRow('Low Stock Items', stats.lowStockProducts.toString(), true) : []),
                ],
                border: [false, false, true, true],
                margin: 5,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#e5e7eb',
          vLineColor: () => '#e5e7eb',
        },
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create Financial Summary Section
 */
function createFinancialSummary(stats: DashboardStats, breakdown: any): Content {
  return {
    stack: [
      { text: 'FINANCIAL SUMMARY', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Total Billed', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: formatCurrency(stats.totalRevenue), style: 'tableHeader', alignment: 'right', fillColor: '#f3f4f6' },
            ],
            [
              { text: 'Total Collected', style: 'tableCell' },
              { text: formatCurrency(stats.paidAmount), style: 'tableCell', alignment: 'right', color: '#10b981' },
            ],
            [
              { text: 'Outstanding Amount', style: 'tableCell' },
              { text: formatCurrency(stats.pendingAmount), style: 'tableCell', alignment: 'right', color: '#f59e0b' },
            ],
            [
              { text: 'Collection Efficiency', style: 'tableCell', fillColor: '#f9fafb' },
              { text: `${stats.paymentRate.toFixed(2)}%`, style: 'tableCell', alignment: 'right', fillColor: '#f9fafb', bold: true },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create GST Section
 */
function createGSTSection(gstData: any): Content {
  return {
    stack: [
      { text: 'GST COLLECTION SUMMARY', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Tax Type', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Amount', style: 'tableHeader', alignment: 'right', fillColor: '#f3f4f6' },
            ],
            [
              { text: 'CGST Collected', style: 'tableCell' },
              { text: formatCurrency(gstData.cgst), style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'SGST Collected', style: 'tableCell' },
              { text: formatCurrency(gstData.sgst), style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'IGST Collected', style: 'tableCell' },
              { text: formatCurrency(gstData.igst), style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Total GST', style: 'tableCell', fillColor: '#f9fafb', bold: true },
              { text: formatCurrency(gstData.total), style: 'tableCell', alignment: 'right', fillColor: '#f9fafb', bold: true },
            ],
            [
              { text: 'Taxable Amount', style: 'tableCell' },
              { text: formatCurrency(gstData.taxable), style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Effective GST Rate', style: 'tableCell' },
              { text: `${gstData.effectiveRate.toFixed(2)}%`, style: 'tableCell', alignment: 'right' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create Top Clients Section
 */
function createTopClientsSection(topClients: TopClient[]): Content {
  return {
    stack: [
      { text: 'TOP 5 CLIENTS BY REVENUE', style: 'sectionHeader' },
      {
        table: {
          widths: ['auto', '*', 'auto', 'auto'],
          body: [
            [
              { text: '#', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Client Name', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Invoices', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' },
              { text: 'Total Revenue', style: 'tableHeader', alignment: 'right', fillColor: '#f3f4f6' },
            ],
            ...topClients.map((client, index) => [
              { text: (index + 1).toString(), style: 'tableCell' },
              { text: client.name, style: 'tableCell' },
              { text: client.invoiceCount.toString(), style: 'tableCell', alignment: 'center' },
              { text: formatCurrency(client.totalAmount), style: 'tableCell', alignment: 'right' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create Payment Status Section
 */
function createPaymentStatusSection(breakdown: any): Content {
  const total = breakdown.paid + breakdown.partiallyPaid + breakdown.pending;
  
  return {
    stack: [
      { text: 'PAYMENT STATUS BREAKDOWN', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Status', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Count', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' },
              { text: 'Percentage', style: 'tableHeader', alignment: 'right', fillColor: '#f3f4f6' },
            ],
            [
              { text: 'Paid', style: 'tableCell', color: '#10b981' },
              { text: breakdown.paid.toString(), style: 'tableCell', alignment: 'center' },
              { text: total > 0 ? `${((breakdown.paid / total) * 100).toFixed(1)}%` : '0%', style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Partially Paid', style: 'tableCell', color: '#f59e0b' },
              { text: breakdown.partiallyPaid.toString(), style: 'tableCell', alignment: 'center' },
              { text: total > 0 ? `${((breakdown.partiallyPaid / total) * 100).toFixed(1)}%` : '0%', style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Pending', style: 'tableCell', color: '#ef4444' },
              { text: breakdown.pending.toString(), style: 'tableCell', alignment: 'center' },
              { text: total > 0 ? `${((breakdown.pending / total) * 100).toFixed(1)}%` : '0%', style: 'tableCell', alignment: 'right' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create Recent Invoices Section
 */
function createRecentInvoicesSection(invoices: Invoice[], clients: Client[]): Content {
  return {
    stack: [
      { text: 'RECENT INVOICES (Last 10)', style: 'sectionHeader' },
      {
        table: {
          widths: ['auto', '*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Invoice #', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Client', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Date', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Amount', style: 'tableHeader', alignment: 'right', fillColor: '#f3f4f6' },
              { text: 'Status', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' },
            ],
            ...invoices.map(invoice => {
              const client = clients.find(c => c.id === invoice.clientId);
              const statusColor = invoice.paymentStatus === 'paid' ? '#10b981' : 
                                 invoice.paymentStatus === 'partially_paid' ? '#f59e0b' : '#ef4444';
              const statusText = invoice.paymentStatus === 'paid' ? 'Paid' : 
                                invoice.paymentStatus === 'partially_paid' ? 'Partial' : 'Pending';
              
              return [
                { text: invoice.invoiceNumber, style: 'tableCell', fontSize: 8 },
                { text: client?.clientName || 'Unknown', style: 'tableCell', fontSize: 8 },
                { text: formatDate(invoice.date), style: 'tableCell', fontSize: 8 },
                { text: formatCurrency(invoice.totalAmount), style: 'tableCell', alignment: 'right', fontSize: 8 },
                { text: statusText, style: 'tableCell', alignment: 'center', fontSize: 8, color: statusColor },
              ];
            }),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create Low Stock Section
 */
function createLowStockSection(products: Product[]): Content {
  return {
    stack: [
      { text: 'LOW STOCK ALERTS', style: 'sectionHeader' },
      {
        table: {
          widths: ['auto', '*', 'auto', 'auto'],
          body: [
            [
              { text: '#', style: 'tableHeader', fillColor: '#fef3c7' },
              { text: 'Product Name', style: 'tableHeader', fillColor: '#fef3c7' },
              { text: 'Current Stock', style: 'tableHeader', alignment: 'center', fillColor: '#fef3c7' },
              { text: 'Unit', style: 'tableHeader', alignment: 'center', fillColor: '#fef3c7' },
            ],
            ...products.map((product, index) => [
              { text: (index + 1).toString(), style: 'tableCell' },
              { text: product.productName, style: 'tableCell' },
              { text: (product.stock || 0).toString(), style: 'tableCell', alignment: 'center', color: product.stock === 0 ? '#ef4444' : '#f59e0b' },
              { text: product.unit, style: 'tableCell', alignment: 'center' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Create Quotation Section
 */
function createQuotationSection(quotations: Quotation[]): Content {
  const converted = quotations.filter(q => q.status === 'converted').length;
  const pending = quotations.filter(q => q.status === 'pending').length;
  const rejected = quotations.filter(q => q.status === 'rejected').length;
  const expired = quotations.filter(q => q.status === 'expired').length;
  const total = quotations.length;
  const conversionRate = total > 0 ? (converted / total) * 100 : 0;
  
  return {
    stack: [
      { text: 'QUOTATION PERFORMANCE', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto', 'auto'],
          body: [
            [
              { text: 'Status', style: 'tableHeader', fillColor: '#f3f4f6' },
              { text: 'Count', style: 'tableHeader', alignment: 'center', fillColor: '#f3f4f6' },
              { text: 'Percentage', style: 'tableHeader', alignment: 'right', fillColor: '#f3f4f6' },
            ],
            [
              { text: 'Converted to Invoice', style: 'tableCell', color: '#10b981' },
              { text: converted.toString(), style: 'tableCell', alignment: 'center' },
              { text: `${((converted / total) * 100).toFixed(1)}%`, style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Pending', style: 'tableCell', color: '#3b82f6' },
              { text: pending.toString(), style: 'tableCell', alignment: 'center' },
              { text: `${((pending / total) * 100).toFixed(1)}%`, style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Rejected', style: 'tableCell', color: '#ef4444' },
              { text: rejected.toString(), style: 'tableCell', alignment: 'center' },
              { text: `${((rejected / total) * 100).toFixed(1)}%`, style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Expired', style: 'tableCell', color: '#f59e0b' },
              { text: expired.toString(), style: 'tableCell', alignment: 'center' },
              { text: `${((expired / total) * 100).toFixed(1)}%`, style: 'tableCell', alignment: 'right' },
            ],
            [
              { text: 'Conversion Rate', style: 'tableCell', fillColor: '#f9fafb', bold: true },
              { text: total.toString(), style: 'tableCell', alignment: 'center', fillColor: '#f9fafb' },
              { text: `${conversionRate.toFixed(1)}%`, style: 'tableCell', alignment: 'right', fillColor: '#f9fafb', bold: true, color: '#10b981' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
    ],
  };
}

/**
 * Helper Functions
 */
function createMetricRow(label: string, value: string, isWarning: boolean = false): Content[] {
  return [
    {
      columns: [
        { text: label, style: 'metricLabel', width: '*' },
        { text: value, style: 'metricValue', width: 'auto', color: isWarning ? '#f59e0b' : undefined },
      ],
      margin: [0, 2, 0, 2],
    },
  ];
}

function getTopClients(invoices: Invoice[], clients: Client[], limit: number = 5): TopClient[] {
  const clientMap = new Map<string, { totalAmount: number; invoiceCount: number }>();
  
  invoices.forEach(invoice => {
    const current = clientMap.get(invoice.clientId) || { totalAmount: 0, invoiceCount: 0 };
    clientMap.set(invoice.clientId, {
      totalAmount: current.totalAmount + invoice.totalAmount,
      invoiceCount: current.invoiceCount + 1,
    });
  });
  
  return Array.from(clientMap.entries())
    .map(([clientId, data]) => {
      const client = clients.find(c => c.id === clientId);
      return {
        id: clientId,
        name: client?.clientName || 'Unknown Client',
        totalAmount: data.totalAmount,
        invoiceCount: data.invoiceCount,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

function getPaymentBreakdown(invoices: Invoice[]) {
  return {
    paid: invoices.filter(inv => inv.paymentStatus === 'paid').length,
    partiallyPaid: invoices.filter(inv => inv.paymentStatus === 'partially_paid').length,
    pending: invoices.filter(inv => inv.paymentStatus === 'pending').length,
  };
}

function getGSTBreakdown(invoices: Invoice[]) {
  const totals = {
    cgst: 0,
    sgst: 0,
    igst: 0,
    taxable: 0,
  };
  
  invoices.forEach(invoice => {
    totals.cgst += invoice.cgst || 0;
    totals.sgst += invoice.sgst || 0;
    totals.igst += invoice.igst || 0;
    totals.taxable += invoice.taxableAmount || 0;
  });
  
  const total = totals.cgst + totals.sgst + totals.igst;
  const effectiveRate = totals.taxable > 0 ? (total / totals.taxable) * 100 : 0;
  
  return {
    ...totals,
    total,
    effectiveRate,
  };
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

/**
 * PDF Styles
 */
function getStyles() {
  return {
    header: {
      fontSize: 18,
      bold: true,
      color: '#1f2937',
    },
    companyName: {
      fontSize: 14,
      bold: true,
      color: '#1f2937',
    },
    companyInfo: {
      fontSize: 9,
      color: '#6b7280',
      margin: [0, 2, 0, 0],
    },
    pageNumber: {
      fontSize: 9,
      color: '#6b7280',
    },
    sectionHeader: {
      fontSize: 12,
      bold: true,
      color: '#3b82f6',
      margin: [0, 15, 0, 10],
      decoration: 'underline',
      decorationColor: '#3b82f6',
    },
    subHeader: {
      fontSize: 11,
      bold: true,
      color: '#1f2937',
    },
    label: {
      fontSize: 9,
      color: '#6b7280',
    },
    value: {
      fontSize: 10,
      bold: true,
      color: '#1f2937',
    },
    metricLabel: {
      fontSize: 9,
      color: '#6b7280',
    },
    metricValue: {
      fontSize: 10,
      bold: true,
      color: '#1f2937',
    },
    tableHeader: {
      fontSize: 9,
      bold: true,
      color: '#374151',
    },
    tableCell: {
      fontSize: 9,
      color: '#1f2937',
    },
    footer: {
      fontSize: 8,
      color: '#9ca3af',
    },
  };
}
