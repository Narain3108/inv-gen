/**
 * Quotation Conversion Rate Component
 * Shows quotation to invoice conversion metrics
 */

'use client';

import React, { useMemo } from 'react';
import { Quotation } from '@/types';
import { FileCheck, FileX, Clock, TrendingUp } from 'lucide-react';

interface QuotationMetricsProps {
  quotations: Quotation[];
}

export function QuotationMetrics({ quotations }: QuotationMetricsProps) {
  const metrics = useMemo(() => {
    const total = quotations.length;
    const converted = quotations.filter(q => q.status === 'converted').length;
    const pending = quotations.filter(q => q.status === 'pending').length;
    const rejected = quotations.filter(q => q.status === 'rejected').length;
    const expired = quotations.filter(q => q.status === 'expired').length;
    
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;
    
    return {
      total,
      converted,
      pending,
      rejected,
      expired,
      conversionRate,
    };
  }, [quotations]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <FileCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          <div>
            <div className="text-xs text-muted-foreground">Converted</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{metrics.converted}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
          <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <div className="text-xs text-muted-foreground">Pending</div>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{metrics.pending}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
          <FileX className="h-8 w-8 text-red-600 dark:text-red-400" />
          <div>
            <div className="text-xs text-muted-foreground">Rejected</div>
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{metrics.rejected}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
          <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          <div>
            <div className="text-xs text-muted-foreground">Expired</div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">{metrics.expired}</div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Conversion Rate</div>
            <div className="text-3xl font-bold mt-1">{metrics.conversionRate.toFixed(1)}%</div>
          </div>
          <TrendingUp className="h-8 w-8 text-primary" />
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          {metrics.converted} of {metrics.total} quotations converted to invoices
        </div>
      </div>
    </div>
  );
}
