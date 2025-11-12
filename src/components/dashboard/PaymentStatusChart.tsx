/**
 * Payment Status Chart Component
 * Shows distribution of payment statuses
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentStatus } from '@/types';

interface PaymentData {
  status: PaymentStatus;
  count: number;
  amount: number;
}

interface PaymentStatusChartProps {
  data: PaymentData[];
  totalAmount: number;
}

export function PaymentStatusChart({ data, totalAmount }: PaymentStatusChartProps) {
  const statusConfig = {
    paid: { label: 'Paid', color: 'bg-green-500' },
    unpaid: { label: 'Unpaid', color: 'bg-red-500' },
    partially_paid: { label: 'Partially Paid', color: 'bg-yellow-500' },
    overdue: { label: 'Overdue', color: 'bg-orange-500' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => {
            const config = statusConfig[item.status];
            const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;

            return (
              <div key={item.status} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${config.color}`} />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <span className="text-muted-foreground">{item.count} invoices</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentage.toFixed(1)}%</span>
                  <span>₹{item.amount.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentStatusChart;
