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
        const date = invoice.date.toDate();
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Last 6 Months Trend</span>
          {trend !== 0 && (
            <span className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend) > 0 && formatCurrency(Math.abs(trend))}
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        {monthlyData.map(({ month, revenue }) => {
          const percentage = (revenue / maxRevenue) * 100;
          return (
            <div key={month} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{month}</span>
                <span className="font-medium">{formatCurrency(revenue)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
