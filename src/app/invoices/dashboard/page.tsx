/**
 * Dashboard Page
 * Comprehensive analytics and insights dashboard
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Users,
  Package,
  Calendar,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
import { invoicesApi } from '@/lib/api/invoices.api';
import { quotationsApi } from '@/lib/api/quotations.api';
import { Invoice, Quotation, Product, Client } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import {
  PaymentStatusChart,
  RecentActivity,
  RecentInvoices,
  StatsCard,
  TopClients,
  RevenueChart,
  GSTSummary,
  QuotationMetrics,
} from '@/components/dashboard';
import { ExportButton } from '@/components/shared';
import { generateDashboardPDFReport, previewDashboardPDFReport } from '@/lib/utils/dashboard-pdf';

type TimeFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalInvoices: number;
  invoicesGrowth: number;
  pendingAmount: number;
  paidAmount: number;
  totalClients: number;
  clientsGrowth: number;
  totalProducts: number;
  lowStockProducts: number;
  totalQuotations: number;
  quotationsGrowth: number;
  averageInvoiceValue: number;
  paymentRate: number;
}

function DashboardContent() {
  const { selectedCompany } = useCompany();
  const { clients, products, companies, companiesInitialized } = useAppData();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load invoices and quotations
  const loadData = async () => {
    // Ensure company is selected and valid
    if (!selectedCompany) return;

    // If companies are initialized, verify the selected company exists in the user's company list
    // This prevents "Failed to load dashboard data" errors when switching users
    if (companiesInitialized) {
      const isValidCompany = companies.find(c => c.id === selectedCompany.id);
      if (!isValidCompany) {
        console.log('⚠️ Skipping dashboard load - selected company not in user list');
        return;
      }
    } else {
      // If not initialized yet, wait
      return;
    }

    try {
      setLoading(true);

      // Load invoices and quotations in parallel
      const [invoicesData, quotationsData] = await Promise.all([
        invoicesApi.getByCompanyId(selectedCompany.id),
        quotationsApi.getByCompanyId(selectedCompany.id)
      ]);

      // Normalize invoice objects to a consistent frontend shape so downstream
      // dashboard calculations don't get zeros due to differing field names.
      const normalizeInvoice = (inv: any) => {
        const total = inv?.totalAmount ?? inv?.total ?? inv?.total_amount ?? inv?.grand_total ?? 0;
        const amountPaid = inv?.amountPaid ?? inv?.amount_paid ?? inv?.paidAmount ?? 0;
        const createdAt = inv?.createdAt ?? inv?.created_at ?? inv?.date ?? null;
        const paidAt = inv?.paidAt ?? inv?.paid_at ?? null;
        const clientId = inv?.clientId ?? inv?.client_id ?? inv?.client ?? null;
        // Payment status is the key field for dashboard calculations
        const paymentStatus = inv?.paymentStatus ?? inv?.payment_status ?? 'pending';
        const invoiceStatus = inv?.status ?? inv?.invoice_status ?? 'draft';
        // Tax fields
        const taxableAmount = inv?.taxableAmount ?? inv?.taxable_amount ?? 0;
        const cgst = inv?.cgst ?? 0;
        const sgst = inv?.sgst ?? 0;
        const igst = inv?.igst ?? 0;

        return {
          ...inv,
          // canonical numeric fields
          total: Number(total) || 0,
          totalAmount: Number(total) || 0,
          amountPaid: Number(amountPaid) || 0,
          amountPending: Math.max(0, (Number(total) || 0) - (Number(amountPaid) || 0)),
          // canonical date fields (leave Firestore Timestamp as-is so getFilteredData handles it)
          createdAt: createdAt,
          paidAt: paidAt,
          date: createdAt,
          // canonical ids/status - IMPORTANT: set BOTH status and paymentStatus
          clientId,
          status: invoiceStatus,
          paymentStatus: paymentStatus,
          // Tax fields for GST summary
          taxableAmount: Number(taxableAmount) || 0,
          cgst: Number(cgst) || 0,
          sgst: Number(sgst) || 0,
          igst: Number(igst) || 0,
        } as any;
      };

      const normalizedInvoices = (invoicesData || []).map(normalizeInvoice);
      const normalizedQuotations = (quotationsData || []).map((q: any) => ({ ...q }));

      setInvoices(normalizedInvoices);
      setQuotations(normalizedQuotations);

      if (process.env.NODE_ENV === 'development') {
        console.debug('[Dashboard] Normalized sample invoice:', normalizedInvoices[0] || null);
      }

      // Debugging: log counts and sample invoice to help diagnose zero-values
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Dashboard] Loaded invoices count:', (invoicesData || []).length);
        console.debug('[Dashboard] Loaded quotations count:', (quotationsData || []).length);
        if (invoicesData && invoicesData.length > 0) {
          console.debug('[Dashboard] Sample invoice:', invoicesData[0]);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setInvoices([]);
      setQuotations([]);

      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompany || !companiesInitialized) return;
    loadData();
  }, [selectedCompany, companiesInitialized]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  const handleExportReport = async () => {
    if (!selectedCompany) return false;

    try {
      await generateDashboardPDFReport({
        company: selectedCompany,
        stats,
        invoices: getFilteredData(invoices),
        quotations: getFilteredData(quotations),
        clients,
        products,
        timeFilter,
      });

      toast.success('Dashboard report generated successfully');
      return true;
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast.error('Failed to generate PDF report');
      return false;
    }
  };

  const handlePreviewReport = async () => {
    if (!selectedCompany) return;

    try {
      await previewDashboardPDFReport({
        company: selectedCompany,
        stats,
        invoices: getFilteredData(invoices),
        quotations: getFilteredData(quotations),
        clients,
        products,
        timeFilter,
      });
    } catch (error) {
      console.error('Error previewing PDF report:', error);
      toast.error('Failed to preview PDF report');
    }
  };

  // Filter data based on time period
  const getFilteredData = (data: any[], dateField: string = 'createdAt') => {
    const now = new Date();
    // Create fresh Date objects to avoid mutation issues
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return data.filter((item) => {
      // Try multiple date fields for compatibility
      const rawDate = item[dateField] || item.createdAt || item.date || item.created_at;
      if (!rawDate) return false;

      const itemDate = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);

      switch (timeFilter) {
        case 'today':
          return itemDate >= startOfDay;
        case 'week':
          return itemDate >= startOfWeek;
        case 'month':
          return itemDate >= startOfMonth;
        case 'quarter':
          return itemDate >= startOfQuarter;
        case 'year':
          return itemDate >= startOfYear;
        case 'all':
        default:
          return true;
      }
    });
  };

  // Calculate dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    const filteredInvoices = getFilteredData(invoices);
    const filteredQuotations = getFilteredData(quotations);

    if (process.env.NODE_ENV === 'development') {
      console.debug('[Dashboard] filteredInvoices length:', filteredInvoices.length);
      console.debug('[Dashboard] filteredInvoices sample:', filteredInvoices[0] || null);
      console.debug('[Dashboard] filteredQuotations length:', filteredQuotations.length);
    }
    // Helper to read invoice numeric fields with common fallback keys
    const readNum = (inv: any, ...keys: string[]) => {
      for (const k of keys) {
        if (inv && inv[k] !== undefined && inv[k] !== null) return Number(inv[k]) || 0;
      }
      return 0;
    };

    // Total revenue
    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + readNum(inv, 'totalAmount', 'total', 'total_amount'), 0);

    // Paid and pending amounts
    const paidAmount = filteredInvoices.reduce((sum, inv) => sum + readNum(inv, 'amountPaid', 'amount_paid', 'paid_amount'), 0);
    const pendingAmount = filteredInvoices.reduce((sum, inv) => {
      const total = readNum(inv, 'totalAmount', 'total', 'total_amount');
      const paid = readNum(inv, 'amountPaid', 'amount_paid', 'paid_amount');
      return sum + Math.max(0, total - paid);
    }, 0);

    // Average invoice value
    const averageInvoiceValue = filteredInvoices.length > 0
      ? totalRevenue / filteredInvoices.length
      : 0;

    // Payment rate
    const paymentRate = totalRevenue > 0
      ? (paidAmount / totalRevenue) * 100
      : 0;

    // Growth calculations (compare with previous period)
    const getPreviousPeriod = () => {
      const now = new Date();
      switch (timeFilter) {
        case 'today':
          return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case 'week':
          return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case 'month':
          return new Date(now.getFullYear(), now.getMonth() - 1, 1);
        case 'quarter':
          return new Date(now.getFullYear(), now.getMonth() - 3, 1);
        case 'year':
          return new Date(now.getFullYear() - 1, 0, 1);
        default:
          return new Date(0);
      }
    };

    const previousPeriodStart = getPreviousPeriod();
    const previousInvoices = invoices.filter((inv) => {
      if (!inv.date) return false;
      const invDate = (inv.date && typeof (inv.date as any).toDate === 'function')
        ? (inv.date as any).toDate()
        : (inv.date instanceof Date ? inv.date : new Date(inv.date as any));
      return invDate < previousPeriodStart;
    });

    const previousRevenue = previousInvoices.reduce((sum, inv) => sum + readNum(inv, 'totalAmount', 'total', 'total_amount'), 0);
    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const invoicesGrowth = previousInvoices.length > 0
      ? ((filteredInvoices.length - previousInvoices.length) / previousInvoices.length) * 100
      : 0;

    // Low stock products
    const lowStockProducts = products.filter(
      (p) => p.type === 'product' && typeof p.stock === 'number' && p.stock < 5
    ).length;

    return {
      totalRevenue,
      revenueGrowth,
      totalInvoices: filteredInvoices.length,
      invoicesGrowth,
      pendingAmount,
      paidAmount,
      totalClients: clients.length,
      clientsGrowth: 0, // Can be calculated similarly
      totalProducts: products.length,
      lowStockProducts,
      totalQuotations: filteredQuotations.length,
      quotationsGrowth: 0,
      averageInvoiceValue,
      paymentRate,
    };
  }, [invoices, quotations, clients, products, timeFilter]);

  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Analytics and insights for your business"
        />
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Please select a company to view dashboard
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Analytics and insights for your business"
        />
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Analytics for ${selectedCompany.name}`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Mobile: Full-width select */}
          <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile: Horizontal button group */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewReport}
              className="flex-1 sm:flex-initial text-primary hover:text-primary dark:border-primary/30 dark:hover:border-primary/50 h-10"
            >
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportReport}
              className="flex-1 sm:flex-initial h-10"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download PDF</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="dark:border-primary/30 dark:hover:border-primary/50 h-10 w-10 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </PageHeader>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueGrowth}
          icon={DollarSign}
          trend={stats.revenueGrowth >= 0 ? 'up' : 'down'}
          className="col-span-2 lg:col-span-1"
        />
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices.toString()}
          change={stats.invoicesGrowth}
          icon={FileText}
          trend={stats.invoicesGrowth >= 0 ? 'up' : 'down'}
          className="col-span-2 lg:col-span-1"
        />
        <StatsCard
          title="Amount Pending"
          value={formatCurrency(stats.pendingAmount)}
          icon={Clock}
          iconColor="text-orange-500 dark:text-orange-400"
        />
        <StatsCard
          title="Amount Received"
          value={formatCurrency(stats.paidAmount)}
          icon={CheckCircle2}
          iconColor="text-green-500 dark:text-green-400"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-200 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active clients
            </p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-200 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.totalProducts}</div>
            {stats.lowStockProducts > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                <p className="text-xs text-orange-500 dark:text-orange-400">
                  {stats.lowStockProducts} low stock
                </p>
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Charts and Tables */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-2 border-primary/10 dark:border-primary/20 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Payment Status</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Overview of invoice payment statuses
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <PaymentStatusChart invoices={getFilteredData(invoices)} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 border-2 border-primary/10 dark:border-primary/20 overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Top Clients</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Clients by total invoice value
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <TopClients invoices={getFilteredData(invoices)} clients={clients} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue and GST Analysis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart invoices={invoices} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>GST Collection</CardTitle>
            <CardDescription>
              Tax collection breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GSTSummary invoices={getFilteredData(invoices)} />
          </CardContent>
        </Card>
      </div>

      {/* Quotation Metrics */}
      {quotations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quotation Performance</CardTitle>
            <CardDescription>
              Quotation conversion and status metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuotationMetrics quotations={getFilteredData(quotations)} />
          </CardContent>
        </Card>
      )}

      {/* Recent Activity and Invoices */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentInvoices
          invoices={invoices.slice(0, 5)}
          clients={clients}
        />
        <RecentActivity
          invoices={invoices}
          quotations={quotations}
          clients={clients}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
