export interface DashboardMetrics {
  totalRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  activeClients: number;
  averageInvoiceValue: number;
  paymentRate: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  percentage?: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface RevenueBreakdown {
  period: string;
  revenue: number;
  invoiceCount: number;
  averageValue: number;
}

export class DashboardDataTransformer {
  static transformInvoicesToMetrics(invoices: any[]): DashboardMetrics {
    const totalInvoices = invoices.length;
    // Use paymentStatus field (not status) for payment-related filtering
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid').length;
    const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'pending' || inv.paymentStatus === 'partially_paid').length;
    const overdueInvoices = invoices.filter(inv => inv.paymentStatus === 'overdue').length;

    // Total revenue from all invoices (not just paid)
    const totalRevenue = invoices
      .reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);

    const uniqueClients = new Set(invoices.map(inv => inv.clientId)).size;
    const activeClients = new Set(
      invoices
        .filter(inv => {
          const rawDate = inv.createdAt || inv.date || inv.created_at;
          if (!rawDate) return false;
          const invoiceDate = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          return invoiceDate >= threeMonthsAgo;
        })
        .map(inv => inv.clientId)
    ).size;

    const averageInvoiceValue = totalInvoices > 0
      ? invoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0) / totalInvoices
      : 0;

    const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

    return {
      totalRevenue,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalClients: uniqueClients,
      activeClients,
      averageInvoiceValue,
      paymentRate
    };
  }

  static transformToStatusChart(invoices: any[]): ChartDataPoint[] {
    // Use paymentStatus for payment-related charts
    const statusCounts = invoices.reduce((acc, inv) => {
      const status = inv.paymentStatus || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = invoices.length;
    const colors = {
      paid: '#10B981',
      pending: '#F59E0B',
      partially_paid: '#F59E0B',
      overdue: '#EF4444',
      draft: '#6B7280'
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      label: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
      value: count as number,
      color: colors[status as keyof typeof colors] || '#6B7280',
      percentage: total > 0 ? Math.round(((count as number) / total) * 100) : 0
    }));
  }

  static transformToRevenueChart(invoices: any[], period: 'daily' | 'weekly' | 'monthly' = 'monthly'): TimeSeriesData[] {
    // Use paymentStatus for filtering paid invoices
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');

    const groupedData = paidInvoices.reduce((acc, inv) => {
      const rawDate = inv.paidAt || inv.createdAt || inv.date || inv.created_at;
      if (!rawDate) return acc;
      const date = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
      let key: string;

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      acc[key] = (acc[key] || 0) + (inv.totalAmount || inv.total || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value: value as number,
        label: this.formatDateLabel(date, period)
      }));
  }

  static transformToTopClientsChart(invoices: any[], clients: any[], limit: number = 5): ChartDataPoint[] {
    // Use paymentStatus for filtering paid invoices
    const clientRevenue = invoices
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((acc, inv) => {
        acc[inv.clientId] = (acc[inv.clientId] || 0) + (inv.totalAmount || inv.total || 0);
        return acc;
      }, {} as Record<string, number>);

    const clientMap = clients.reduce((acc, client) => {
      acc[client.id] = client.name || client.clientName || client.companyName || 'Unknown Client';
      return acc;
    }, {} as Record<string, string>);

    return Object.entries(clientRevenue)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, limit)
      .map(([clientId, revenue]) => ({
        label: clientMap[clientId] || 'Unknown Client',
        value: revenue as number
      }));
  }

  static transformToRevenueBreakdown(invoices: any[], period: 'monthly' | 'quarterly' = 'monthly'): RevenueBreakdown[] {
    // Use paymentStatus for filtering paid invoices
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid');

    const groupedData = paidInvoices.reduce((acc, inv) => {
      const rawDate = inv.paidAt || inv.createdAt || inv.date || inv.created_at;
      if (!rawDate) return acc;
      const date = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
      let key: string;

      if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      }

      if (!acc[key]) {
        acc[key] = { revenue: 0, invoiceCount: 0 };
      }

      acc[key].revenue += inv.totalAmount || inv.total || 0;
      acc[key].invoiceCount += 1;

      return acc;
    }, {} as Record<string, { revenue: number; invoiceCount: number }>);

    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => {
        const typedData = data as { revenue: number; invoiceCount: number };
        return {
          period,
          revenue: typedData.revenue,
          invoiceCount: typedData.invoiceCount,
          averageValue: typedData.invoiceCount > 0 ? typedData.revenue / typedData.invoiceCount : 0
        };
      });
  }

  static transformToPaymentTrends(invoices: any[]): TimeSeriesData[] {
    // Use paymentStatus for filtering paid invoices
    const monthlyPayments = invoices
      .filter(inv => inv.paymentStatus === 'paid' && (inv.paidAt || inv.createdAt))
      .reduce((acc, inv) => {
        const rawDate = inv.paidAt || inv.createdAt;
        const date = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(monthlyPayments)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        value: value as number,
        label: this.formatDateLabel(date, 'monthly')
      }));
  }

  private static formatDateLabel(date: string, period: 'daily' | 'weekly' | 'monthly'): string {
    switch (period) {
      case 'daily':
        return new Date(date).toLocaleDateString();
      case 'weekly':
        return `Week of ${new Date(date).toLocaleDateString()}`;
      case 'monthly':
        const [year, month] = date.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short'
        });
      default:
        return date;
    }
  }

  // Utility methods for common dashboard calculations
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  static calculateAveragePaymentTime(invoices: any[]): number {
    // Use paymentStatus for filtering paid invoices
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'paid' && inv.paidAt && inv.createdAt);

    if (paidInvoices.length === 0) return 0;

    const totalDays = paidInvoices.reduce((sum, inv) => {
      const createdRaw = inv.createdAt;
      const paidRaw = inv.paidAt;
      const created = createdRaw.toDate ? createdRaw.toDate() : new Date(createdRaw);
      const paid = paidRaw.toDate ? paidRaw.toDate() : new Date(paidRaw);
      const days = Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / paidInvoices.length);
  }

  static getTopPerformingPeriod(revenueData: TimeSeriesData[]): TimeSeriesData | null {
    if (revenueData.length === 0) return null;
    return revenueData.reduce((max, current) =>
      current.value > max.value ? current : max
    );
  }
}