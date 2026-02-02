/**
 * Dashboard Page
 * Comprehensive analytics and insights dashboard
 * Refactored to use useDashboardData hook and extracted components
 */

'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Package,
} from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { useAppData } from '@/contexts/AppDataContext';
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
  ServiceOverviewWidget,
  EmployeePerformanceWidget,
} from '@/components/dashboard';
import { DashboardHeader, SecondaryMetrics } from '@/components/pages/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { generateDashboardPDFReport, previewDashboardPDFReport } from '@/lib/utils/dashboard-pdf';
import { DashboardSkeleton } from '@/components/shared/Skeletons';

function DashboardContent() {
  const { selectedCompany } = useCompany();
  const { clients, products, companies, companiesInitialized } = useAppData();

  const {
    invoices,
    quotations,
    loading,
    refreshing,
    timeFilter,
    setTimeFilter,
    stats,
    getFilteredData,
    handleRefresh,
  } = useDashboardData({
    selectedCompany,
    companies,
    companiesInitialized,
    clients,
    products,
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

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
      {/* Header with Time Filter and Actions */}
      <DashboardHeader
        companyName={selectedCompany.name}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        onPreviewReport={handlePreviewReport}
        onExportReport={handleExportReport}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Key Metrics Cards - All 6 in One Row */}
      <div className="flex flex-nowrap overflow-x-auto pb-2 -mx-4 px-4 lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0 lg:mx-0 lg:px-0 gap-2">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueGrowth}
          icon={DollarSign}
          trend={stats.revenueGrowth >= 0 ? 'up' : 'down'}
          className="min-w-[140px] lg:min-w-0"
        />
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices.toString()}
          change={stats.invoicesGrowth}
          icon={FileText}
          trend={stats.invoicesGrowth >= 0 ? 'up' : 'down'}
          className="min-w-[140px] lg:min-w-0"
        />
        <StatsCard
          title="Amount Pending"
          value={formatCurrency(stats.pendingAmount)}
          icon={Clock}
          iconColor="text-orange-500 dark:text-orange-400"
          className="min-w-[140px] lg:min-w-0"
        />
        <StatsCard
          title="Amount Received"
          value={formatCurrency(stats.paidAmount)}
          icon={CheckCircle2}
          iconColor="text-green-500 dark:text-green-400"
          className="min-w-[140px] lg:min-w-0"
        />
        <StatsCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          icon={Users}
          iconColor="text-blue-500 dark:text-blue-400"
          className="min-w-[140px] lg:min-w-0"
        />
        <StatsCard
          title="Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          iconColor="text-purple-500 dark:text-purple-400"
          className="min-w-[140px] lg:min-w-0"
        />
      </div>

      {/* Secondary Metrics */}
      <SecondaryMetrics stats={stats} />

      {/* Service & Performance Widgets */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        {/* <ServiceOverviewWidget companyId={selectedCompany.id} /> */}

      </div>

      {/* Charts and Tables */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 overflow-hidden border-2 border-black dark:border-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Payment Status</CardTitle>

          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <PaymentStatusChart invoices={getFilteredData(invoices)} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 overflow-hidden border-2 border-black dark:border-white">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Top Clients</CardTitle>

          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <TopClients invoices={getFilteredData(invoices)} clients={clients} />
          </CardContent>
        </Card>
      </div>

      {/* Revenue and GST Analysis */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-2 border-black dark:border-white">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>

          </CardHeader>
          <CardContent>
            <RevenueChart invoices={invoices} />
          </CardContent>
        </Card>
        <Card className="col-span-3 border-2 border-black dark:border-white">
          <CardHeader>
            <CardTitle>GST Collection</CardTitle>

          </CardHeader>
          <CardContent>
            <GSTSummary invoices={getFilteredData(invoices)} />
          </CardContent>
        </Card>
      </div>

      {/* Quotation Metrics */}
      {quotations.length > 0 && (
        <Card className="border-2 border-black dark:border-white">
          <CardHeader>
            <CardTitle>Quotation Performance</CardTitle>

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
