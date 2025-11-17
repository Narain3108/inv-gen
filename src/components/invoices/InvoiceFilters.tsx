/**
 * Invoice Filters Component
 * Filters: amount range, payment status, date (month/year/week)
 */

'use client';

import React, { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Invoice } from '@/types';

interface InvoiceFiltersProps {
  invoices: Invoice[];
  onFilterChange: (key: string, value: any) => void;
  filters: Record<string, any>;
}

export function InvoiceFilters({ invoices, onFilterChange, filters }: InvoiceFiltersProps) {
  // Extract unique months and years
  const { months, years } = useMemo(() => {
    const monthsSet = new Set<string>();
    const yearsSet = new Set<number>();

    invoices.forEach(invoice => {
      if (invoice.date) {
        const date = invoice.date.toDate();
        const year = date.getFullYear();
        const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        yearsSet.add(year);
        monthsSet.add(month);
      }
    });

    return {
      months: Array.from(monthsSet).sort().reverse(),
      years: Array.from(yearsSet).sort((a, b) => b - a),
    };
  }, [invoices]);

  return (
    <>
      {/* Payment Status Filter */}
      <Select
        value={filters.paymentStatus || 'all'}
        onValueChange={(value) => onFilterChange('paymentStatus', value)}
      >
        <SelectTrigger className="w-[170px] bg-background">
          <SelectValue placeholder="All Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Payment Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="partially_paid">Partially Paid</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Period Filter */}
      <Select
        value={filters.datePeriod || 'all'}
        onValueChange={(value) => onFilterChange('datePeriod', value)}
      >
        <SelectTrigger className="w-[170px] bg-background">
          <SelectValue placeholder="All Time" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="this-week">This Week</SelectItem>
          <SelectItem value="last-week">Last Week</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="last-month">Last Month</SelectItem>
          <SelectItem value="this-year">This Year</SelectItem>
          <SelectItem value="last-year">Last Year</SelectItem>
        </SelectContent>
      </Select>

      {/* Month Filter */}
      {months.length > 0 && (
        <Select
          value={filters.month || 'all'}
          onValueChange={(value) => onFilterChange('month', value)}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(month => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Year Filter */}
      {years.length > 0 && (
        <Select
          value={filters.year || 'all'}
          onValueChange={(value) => onFilterChange('year', value)}
        >
          <SelectTrigger className="w-[130px] bg-background">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Amount Range Filters */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min Amount"
          value={filters.minAmount || ''}
          onChange={(e) => onFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
          className="w-[130px] bg-background"
          min="0"
          step="0.01"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max Amount"
          value={filters.maxAmount || ''}
          onChange={(e) => onFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
          className="w-[130px] bg-background"
          min="0"
          step="0.01"
        />
      </div>
    </>
  );
}
