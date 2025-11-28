/**
 * Product Filters Component
 * Filters: unit type, category, GST rate, stock status, price range
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
import { Product } from '@/types';

interface ProductFiltersProps {
  products: Product[];
  onFilterChange: (key: string, value: any) => void;
  filters: Record<string, any>;
}

export function ProductFilters({ products, onFilterChange, filters }: ProductFiltersProps) {
  // Extract unique values
  const { units, gstRates, categories } = useMemo(() => {
    const unitsSet = new Set<string>();
    const gstRatesSet = new Set<number>();
    const categoriesSet = new Set<string>();

    products.forEach(product => {
      if (product.unit) unitsSet.add(product.unit);
      if (product.gstRate !== undefined && product.gstRate !== null) gstRatesSet.add(product.gstRate);
      if (product.categoryId) categoriesSet.add(product.categoryId);
    });

    return {
      units: Array.from(unitsSet).sort(),
      gstRates: Array.from(gstRatesSet).sort((a, b) => a - b),
      categories: Array.from(categoriesSet).sort(),
    };
  }, [products]);

  return (
    <>
      {/* Unit Type Filter */}
      <Select
        value={filters.unit || 'all'}
        onValueChange={(value) => onFilterChange('unit', value)}
      >
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="All Units" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Units</SelectItem>
          {units.map(unit => (
            <SelectItem key={unit} value={unit}>
              {unit}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* GST Rate Filter */}
      <Select
        value={filters.gstRate || 'all'}
        onValueChange={(value) => onFilterChange('gstRate', value)}
      >
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="All GST Rates" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All GST Rates</SelectItem>
          {gstRates.map(rate => (
            <SelectItem key={rate} value={rate.toString()}>
              {rate}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Stock Status Filter */}
      <Select
        value={filters.stockStatus || 'all'}
        onValueChange={(value) => onFilterChange('stockStatus', value)}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="All Stock Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stock Status</SelectItem>
          <SelectItem value="in-stock">In Stock</SelectItem>
          <SelectItem value="low-stock">Low Stock (&lt; 10)</SelectItem>
          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          <SelectItem value="service">Service (No Stock)</SelectItem>
        </SelectContent>
      </Select>

      {/* Price Range Filters */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice || ''}
          onChange={(e) => onFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : null)}
          className="w-[120px] bg-background"
          min="0"
          step="0.01"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice || ''}
          onChange={(e) => onFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : null)}
          className="w-[120px] bg-background"
          min="0"
          step="0.01"
        />
      </div>
    </>
  );
}
