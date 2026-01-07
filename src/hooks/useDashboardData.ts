/**
 * useDashboardData Hook
 * Manages dashboard data loading, filtering, and statistics calculation
 * Following Single Responsibility Principle
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Invoice, Quotation, Product, Client, Company } from '@/types';
import { invoicesApi } from '@/lib/api/invoices.api';
import { quotationsApi } from '@/lib/api/quotations.api';
import { toast } from 'sonner';

export type TimeFilter = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface DashboardStats {
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

interface UseDashboardDataConfig {
    selectedCompany: Company | null;
    companies: Company[];
    companiesInitialized: boolean;
    clients: Client[];
    products: Product[];
}

interface UseDashboardDataReturn {
    invoices: Invoice[];
    quotations: Quotation[];
    loading: boolean;
    refreshing: boolean;
    timeFilter: TimeFilter;
    setTimeFilter: (filter: TimeFilter) => void;
    stats: DashboardStats;
    getFilteredData: <T extends { createdAt?: any; date?: any; created_at?: any }>(data: T[], dateField?: string) => T[];
    handleRefresh: () => Promise<void>;
    loadData: () => Promise<void>;
}

/**
 * Normalize invoice objects to consistent shape for dashboard calculations
 */
function normalizeInvoice(inv: any): Invoice {
    const total = inv?.totalAmount ?? inv?.total ?? inv?.total_amount ?? inv?.grand_total ?? 0;
    const amountPaid = inv?.amountPaid ?? inv?.amount_paid ?? inv?.paidAmount ?? 0;
    const createdAt = inv?.createdAt ?? inv?.created_at ?? inv?.date ?? null;
    const paidAt = inv?.paidAt ?? inv?.paid_at ?? null;
    const clientId = inv?.clientId ?? inv?.client_id ?? inv?.client ?? null;
    const paymentStatus = inv?.paymentStatus ?? inv?.payment_status ?? 'pending';
    const invoiceStatus = inv?.status ?? inv?.invoice_status ?? 'draft';
    const taxableAmount = inv?.taxableAmount ?? inv?.taxable_amount ?? 0;
    const cgst = inv?.cgst ?? 0;
    const sgst = inv?.sgst ?? 0;
    const igst = inv?.igst ?? 0;

    return {
        ...inv,
        total: Number(total) || 0,
        totalAmount: Number(total) || 0,
        amountPaid: Number(amountPaid) || 0,
        amountPending: Math.max(0, (Number(total) || 0) - (Number(amountPaid) || 0)),
        createdAt,
        paidAt,
        date: createdAt,
        clientId,
        status: invoiceStatus,
        paymentStatus,
        taxableAmount: Number(taxableAmount) || 0,
        cgst: Number(cgst) || 0,
        sgst: Number(sgst) || 0,
        igst: Number(igst) || 0,
    } as any;
}

/**
 * Helper to read numeric fields with fallback keys
 */
function readNum(obj: any, ...keys: string[]): number {
    for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return Number(obj[k]) || 0;
    }
    return 0;
}

export function useDashboardData({
    selectedCompany,
    companies,
    companiesInitialized,
    clients,
    products,
}: UseDashboardDataConfig): UseDashboardDataReturn {
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load data function
    const loadData = useCallback(async () => {
        if (!selectedCompany) return;

        if (companiesInitialized) {
            const isValidCompany = companies.find(c => c.id === selectedCompany.id);
            if (!isValidCompany) {
                console.log('⚠️ Skipping dashboard load - selected company not in user list');
                return;
            }
        } else {
            return;
        }

        try {
            setLoading(true);
            const [invoicesData, quotationsData] = await Promise.all([
                invoicesApi.getByCompanyId(selectedCompany.id),
                quotationsApi.getByCompanyId(selectedCompany.id)
            ]);

            const normalizedInvoices = (invoicesData || []).map(normalizeInvoice);
            const normalizedQuotations = (quotationsData || []).map((q: any) => ({ ...q }));

            setInvoices(normalizedInvoices);
            setQuotations(normalizedQuotations);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setInvoices([]);
            setQuotations([]);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [selectedCompany, companiesInitialized, companies]);

    // Load on mount and company change
    useEffect(() => {
        if (!selectedCompany || !companiesInitialized) return;
        loadData();
    }, [selectedCompany, companiesInitialized, loadData]);

    // Refresh handler
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
        toast.success('Dashboard refreshed');
    }, [loadData]);

    // Filter data based on time period
    const getFilteredData = useCallback(<T extends { createdAt?: any; date?: any; created_at?: any }>(
        data: T[],
        dateField: string = 'createdAt'
    ): T[] => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return data.filter((item: any) => {
            const rawDate = item[dateField] || item.createdAt || item.date || item.created_at;
            if (!rawDate) return false;

            const itemDate = rawDate.toDate ? rawDate.toDate() : new Date(rawDate);

            switch (timeFilter) {
                case 'today': return itemDate >= startOfDay;
                case 'week': return itemDate >= startOfWeek;
                case 'month': return itemDate >= startOfMonth;
                case 'quarter': return itemDate >= startOfQuarter;
                case 'year': return itemDate >= startOfYear;
                case 'all':
                default: return true;
            }
        });
    }, [timeFilter]);

    // Calculate dashboard statistics
    const stats: DashboardStats = useMemo(() => {
        const filteredInvoices = getFilteredData(invoices);
        const filteredQuotations = getFilteredData(quotations);

        // Total revenue
        const totalRevenue = filteredInvoices.reduce(
            (sum, inv) => sum + readNum(inv, 'totalAmount', 'total', 'total_amount'), 0
        );

        // Paid and pending amounts
        const paidAmount = filteredInvoices.reduce(
            (sum, inv) => sum + readNum(inv, 'amountPaid', 'amount_paid', 'paid_amount'), 0
        );
        const pendingAmount = filteredInvoices.reduce((sum, inv) => {
            const total = readNum(inv, 'totalAmount', 'total', 'total_amount');
            const paid = readNum(inv, 'amountPaid', 'amount_paid', 'paid_amount');
            return sum + Math.max(0, total - paid);
        }, 0);

        // Average invoice value
        const averageInvoiceValue = filteredInvoices.length > 0
            ? totalRevenue / filteredInvoices.length : 0;

        // Payment rate
        const paymentRate = totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0;

        // Growth calculations
        const getPreviousPeriod = () => {
            const now = new Date();
            switch (timeFilter) {
                case 'today': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
                case 'week': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                case 'month': return new Date(now.getFullYear(), now.getMonth() - 1, 1);
                case 'quarter': return new Date(now.getFullYear(), now.getMonth() - 3, 1);
                case 'year': return new Date(now.getFullYear() - 1, 0, 1);
                default: return new Date(0);
            }
        };

        const previousPeriodStart = getPreviousPeriod();
        const previousInvoices = invoices.filter((inv: any) => {
            if (!inv.date) return false;
            const invDate = inv.date?.toDate ? inv.date.toDate()
                : (inv.date instanceof Date ? inv.date : new Date(inv.date));
            return invDate < previousPeriodStart;
        });

        const previousRevenue = previousInvoices.reduce(
            (sum, inv) => sum + readNum(inv, 'totalAmount', 'total', 'total_amount'), 0
        );
        const revenueGrowth = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
        const invoicesGrowth = previousInvoices.length > 0
            ? ((filteredInvoices.length - previousInvoices.length) / previousInvoices.length) * 100 : 0;

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
            clientsGrowth: 0,
            totalProducts: products.length,
            lowStockProducts,
            totalQuotations: filteredQuotations.length,
            quotationsGrowth: 0,
            averageInvoiceValue,
            paymentRate,
        };
    }, [invoices, quotations, clients, products, timeFilter, getFilteredData]);

    return {
        invoices,
        quotations,
        loading,
        refreshing,
        timeFilter,
        setTimeFilter,
        stats,
        getFilteredData,
        handleRefresh,
        loadData,
    };
}

export default useDashboardData;
