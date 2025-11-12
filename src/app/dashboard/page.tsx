/**
 * Dashboard Page
 * Analytics and overview
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { 
  StatsCard, 
  RecentActivity, 
  PaymentStatusChart, 
  RecentInvoices, 
  TopClients 
} from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { 
  IndianRupee, 
  FileText, 
  Users, 
  TrendingUp,
  Plus,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { useCompany } from '@/hooks/useCompany';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Invoice, Client, PaymentStatus } from '@/types';
import { toast } from 'sonner';

interface DashboardStats {
  totalRevenue: number;
  totalInvoices: number;
  totalClients: number;
  paidAmount: number;
  unpaidAmount: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
}

interface PaymentData {
  status: PaymentStatus;
  count: number;
  amount: number;
}

interface ClientRevenue {
  clientId: string;
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalInvoices: 0,
    totalClients: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    monthlyRevenue: 0,
    monthlyGrowth: 0,
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [topClients, setTopClients] = useState<ClientRevenue[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!selectedCompany) {
      router.push('/dashboard/settings/company');
      return;
    }

    loadDashboardData();
  }, [user, selectedCompany]);

  const loadDashboardData = async () => {
    if (!user || !selectedCompany) return;

    setLoading(true);
    try {
      // Load invoices
      const invoicesRef = collection(db, 'invoices');
      const invoicesQuery = query(
        invoicesRef,
        where('userId', '==', user.uid),
        where('companyId', '==', selectedCompany.id)
      );
      const invoicesSnapshot = await getDocs(invoicesQuery);
      const invoicesData = invoicesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invoice[];
      setInvoices(invoicesData);

      // Load clients
      const clientsRef = collection(db, 'clients');
      const clientsQuery = query(
        clientsRef,
        where('userId', '==', user.uid)
      );
      const clientsSnapshot = await getDocs(clientsQuery);
      const clientsData = clientsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Client[];
      setClients(clientsData);

      // Calculate statistics
      calculateStats(invoicesData, clientsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoices: Invoice[], clients: Client[]) => {
    // Total revenue
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    
    // Paid and unpaid amounts - simplified (no payment status tracking)
    const paidAmount = totalRevenue;
    const unpaidAmount = 0;

    // Monthly revenue (current month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyRevenue = invoices
      .filter(inv => {
        const invDate = inv.date.toDate();
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Previous month revenue for growth calculation
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const lastMonthRevenue = invoices
      .filter(inv => {
        const invDate = inv.date.toDate();
        return invDate.getMonth() === lastMonth && invDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    setStats({
      totalRevenue,
      totalInvoices: invoices.length,
      totalClients: clients.length,
      paidAmount,
      unpaidAmount,
      monthlyRevenue,
      monthlyGrowth,
    });

    // Payment status distribution - simplified without payment status
    const paymentStatusData: PaymentData[] = [
      { status: 'paid', count: invoices.length, amount: totalRevenue },
    ];

    setPaymentData(paymentStatusData);

    // Top clients by revenue
    const clientRevenueMap = new Map<string, ClientRevenue>();
    
    invoices.forEach(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      if (client) {
        const existing = clientRevenueMap.get(inv.clientId);
        if (existing) {
          existing.totalRevenue += inv.totalAmount;
          existing.invoiceCount++;
        } else {
          clientRevenueMap.set(inv.clientId, {
            clientId: inv.clientId,
            clientName: client.clientName,
            totalRevenue: inv.totalAmount,
            invoiceCount: 1,
          });
        }
      }
    });

    const topClientsList = Array.from(clientRevenueMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    setTopClients(topClientsList);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    router.push('/dashboard/invoices');
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invoices">
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          description="All time earnings"
          icon={IndianRupee}
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          description="This month"
          icon={TrendingUp}
          trend={{ 
            value: Math.abs(stats.monthlyGrowth), 
            isPositive: stats.monthlyGrowth >= 0 
          }}
        />
        <StatsCard
          title="Total Invoices"
          value={stats.totalInvoices}
          description="Invoices generated"
          icon={FileText}
        />
        <StatsCard
          title="Active Clients"
          value={stats.totalClients}
          description="Registered clients"
          icon={Users}
        />
      </div>

      {/* Payment Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Paid Amount"
          value={formatCurrency(stats.paidAmount)}
          description="Successfully collected"
          icon={CreditCard}
        />
        <StatsCard
          title="Unpaid Amount"
          value={formatCurrency(stats.unpaidAmount)}
          description="Pending collection"
          icon={CreditCard}
        />
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <PaymentStatusChart 
          data={paymentData} 
          totalAmount={stats.totalRevenue} 
        />
        <TopClients clients={topClients} />
      </div>

      {/* Recent Invoices */}
      <RecentInvoices 
        invoices={invoices} 
        clients={clients}
        onViewInvoice={handleViewInvoice}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
