/**
 * Revenue Chart Component
 * Monthly revenue trend visualization
 */

'use client';

import React, { useMemo } from 'react';
import { Invoice } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueChartProps {
  invoices: Invoice[];
}

export function RevenueChart({ invoices }: RevenueChartProps) {
  const monthlyData = useMemo(() => {
    const data: Record<string, number> = {};
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      data[key] = 0;
    }
    
    // Calculate revenue per month
    invoices.forEach(invoice => {
      if (invoice.date) {
        let date: Date;
        if (invoice.date instanceof Date) {
          date = invoice.date;
        } else if (typeof invoice.date === 'string') {
          date = new Date(invoice.date);
        } else if (typeof invoice.date === 'object' && (invoice.date as any)._seconds) {
          date = new Date((invoice.date as any)._seconds * 1000);
        } else if (typeof invoice.date === 'object' && (invoice.date as any).toDate) {
          date = (invoice.date as any).toDate();
        } else {
          return; // Skip invalid dates
        }
        
        if (isNaN(date.getTime())) return; // Skip invalid dates
        
        const key = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (key in data) {
          data[key] += invoice.totalAmount || 0;
        }
      }
    });
    
    return Object.entries(data).map(([month, revenue]) => ({ month, revenue }));
  }, [invoices]);

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);
  const trend = monthlyData.length >= 2 
    ? monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 2].revenue
    : 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-xs sm:text-sm font-medium">Last 6 Months Trend</span>
        {trend !== 0 && (
          <div className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
            trend > 0 
              ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(trend) > 0 && formatCurrency(Math.abs(trend))}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {monthlyData.map(({ month, revenue }) => {
          const percentage = (revenue / maxRevenue) * 100;
          return (
            <div key={month} className="space-y-1.5 group">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground font-medium">{month}</span>
                <span className="font-semibold text-foreground tabular-nums">{formatCurrency(revenue)}</span>
              </div>
              <div className="h-2 sm:h-2.5 bg-muted dark:bg-muted/50 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] transition-all duration-500 group-hover:bg-[length:100%_auto] rounded-full"
                  style={{ width: `${percentage}%` }}
                />
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
