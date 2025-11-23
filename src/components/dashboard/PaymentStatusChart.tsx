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
        color: 'bg-green-500 dark:bg-green-400',
        bgColor: 'bg-green-50 dark:bg-green-500/10',
        textColor: 'text-green-600 dark:text-green-400',
      },
      {
        status: 'partially_paid',
        label: 'Partially Paid',
        count: partiallyPaid.length,
        amount: partiallyPaidAmount,
        percentage: totalAmount > 0 ? (partiallyPaidAmount / totalAmount) * 100 : 0,
        color: 'bg-yellow-500 dark:bg-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
        textColor: 'text-yellow-600 dark:text-yellow-400',
      },
      {
        status: 'pending',
        label: 'Pending',
        count: pending.length,
        amount: pendingAmount,
        percentage: totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0,
        color: 'bg-orange-500 dark:bg-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-500/10',
        textColor: 'text-orange-600 dark:text-orange-400',
      },
    ];
  }, [invoices]);

  return (
    <div className="space-y-3 sm:space-y-4">
      {stats.map((item) => (
        <div key={item.status} className={`space-y-2 p-3 sm:p-4 rounded-xl ${item.bgColor} border border-transparent hover:border-current transition-all duration-300 group`}>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full ${item.color} shadow-sm group-hover:scale-110 transition-transform`} />
              <span className="font-semibold text-foreground">{item.label}</span>
            </div>
            <span className={`text-xs sm:text-sm font-medium ${item.textColor}`}>
              {item.count} {item.count === 1 ? 'invoice' : 'invoices'}
            </span>
          </div>
          <div className="h-2 sm:h-2.5 w-full bg-background dark:bg-muted/30 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full ${item.color} transition-all duration-500 ease-out group-hover:shadow-lg rounded-full`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-sm font-medium">
            <span className={item.textColor}>{item.percentage.toFixed(1)}%</span>
            <span className="text-foreground tabular-nums">{formatCurrency(item.amount)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PaymentStatusChart;
