/**
 * Payment Status Chart Component
 * Shows distribution of payment statuses
 */

'use client';

import React, { useMemo } from 'react';
import { Invoice } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface PaymentStatusChartProps {
  invoices: Invoice[];
}

export function PaymentStatusChart({ invoices }: PaymentStatusChartProps) {
  const stats = useMemo(() => {
    const paid = invoices.filter(inv => inv.paymentStatus === 'paid');
    const partiallyPaid = invoices.filter(inv => inv.paymentStatus === 'partially_paid');
    const pending = invoices.filter(inv => inv.paymentStatus === 'pending');

    const paidAmount = paid.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const partiallyPaidAmount = partiallyPaid.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pendingAmount = pending.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalAmount = paidAmount + partiallyPaidAmount + pendingAmount;

    return [
      {
        status: 'paid',
        label: 'Paid',
        count: paid.length,
        amount: paidAmount,
        percentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
        color: 'bg-green-500',
      },
      {
        status: 'partially_paid',
        label: 'Partially Paid',
        count: partiallyPaid.length,
        amount: partiallyPaidAmount,
        percentage: totalAmount > 0 ? (partiallyPaidAmount / totalAmount) * 100 : 0,
        color: 'bg-yellow-500',
      },
      {
        status: 'pending',
        label: 'Pending',
        count: pending.length,
        amount: pendingAmount,
        percentage: totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0,
        color: 'bg-orange-500',
      },
    ];
  }, [invoices]);

  return (
    <div className="space-y-4">
      {stats.map((item) => (
        <div key={item.status} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${item.color}`} />
              <span className="font-medium">{item.label}</span>
            </div>
            <span className="text-muted-foreground">{item.count} invoices</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${item.color} transition-all duration-300`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{item.percentage.toFixed(1)}%</span>
            <span>{formatCurrency(item.amount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PaymentStatusChart;
