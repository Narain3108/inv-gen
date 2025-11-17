/**
 * GST Collection Summary Component
 * Shows CGST, SGST, IGST breakdown
 */

'use client';

import React, { useMemo } from 'react';
import { Invoice } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GSTSummaryProps {
  invoices: Invoice[];
}

export function GSTSummary({ invoices }: GSTSummaryProps) {
  const gstData = useMemo(() => {
    const totals = {
      cgst: 0,
      sgst: 0,
      igst: 0,
      taxable: 0,
    };
    
    invoices.forEach(invoice => {
      totals.cgst += invoice.cgst || 0;
      totals.sgst += invoice.sgst || 0;
      totals.igst += invoice.igst || 0;
      totals.taxable += invoice.taxableAmount || 0;
    });
    
    const totalGST = totals.cgst + totals.sgst + totals.igst;
    const effectiveRate = totals.taxable > 0 ? (totalGST / totals.taxable) * 100 : 0;
    
    return {
      ...totals,
      total: totalGST,
      effectiveRate,
    };
  }, [invoices]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <div className="text-xs text-muted-foreground mb-1">CGST Collected</div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(gstData.cgst)}
          </div>
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <div className="text-xs text-muted-foreground mb-1">SGST Collected</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(gstData.sgst)}
          </div>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
          <div className="text-xs text-muted-foreground mb-1">IGST Collected</div>
          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(gstData.igst)}
          </div>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
          <div className="text-xs text-muted-foreground mb-1">Total GST</div>
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(gstData.total)}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Taxable Amount</div>
            <div className="text-2xl font-bold mt-1">{formatCurrency(gstData.taxable)}</div>
          </div>
          <Badge variant="secondary" className="text-sm">
            Avg Rate: {gstData.effectiveRate.toFixed(2)}%
          </Badge>
        </div>
      </div>
    </div>
  );
}
