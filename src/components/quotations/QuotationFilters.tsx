/**
 * Quotation Filters Component
 * Filters: amount range, converted status, validity status, expired
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
import { Quotation } from '@/types';

interface QuotationFiltersProps {
  quotations: Quotation[];
  onFilterChange: (key: string, value: any) => void;
  filters: Record<string, any>;
}

export function QuotationFilters({ quotations, onFilterChange, filters }: QuotationFiltersProps) {
  return (
    <>
      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFilterChange('status', value)}
      >
        <SelectTrigger className="w-[170px] bg-card">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="converted">Converted</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>

      {/* Converted Filter */}
      <Select
        value={filters.converted || 'all'}
        onValueChange={(value) => onFilterChange('converted', value)}
      >
        <SelectTrigger className="w-[170px] bg-card">
          <SelectValue placeholder="Conversion Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Quotations</SelectItem>
          <SelectItem value="converted">Converted to Invoice</SelectItem>
          <SelectItem value="not-converted">Not Converted</SelectItem>
        </SelectContent>
      </Select>

      {/* Validity Filter */}
      <Select
        value={filters.validity || 'all'}
        onValueChange={(value) => onFilterChange('validity', value)}
      >
        <SelectTrigger className="w-[170px] bg-card">
          <SelectValue placeholder="Validity Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Validity</SelectItem>
          <SelectItem value="valid">Valid</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="expiring-soon">Expiring Soon (7 days)</SelectItem>
        </SelectContent>
      </Select>

      {/* Amount Range Filters */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min Amount"
          value={filters.minAmount || ''}
          onChange={(e) => onFilterChange('minAmount', e.target.value ? parseFloat(e.target.value) : null)}
          className="w-[130px] bg-card"
          min="0"
          step="0.01"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max Amount"
          value={filters.maxAmount || ''}
          onChange={(e) => onFilterChange('maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
          className="w-[130px] bg-card"
          min="0"
          step="0.01"
        />
      </div>
    </>
  );
}
