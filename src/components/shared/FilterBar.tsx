/**
 * FilterBar Component
 * Reusable filter bar with clear filters button and results count
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface FilterBarProps {
  children: React.ReactNode;
  activeFilterCount?: number;
  onClearFilters?: () => void;
  className?: string;
  resultsCount?: number;
  totalCount?: number;
}

export function FilterBar({
  children,
  activeFilterCount = 0,
  onClearFilters,
  className = '',
  resultsCount,
  totalCount,
}: FilterBarProps) {
  const showResultsCount = resultsCount !== undefined && totalCount !== undefined;
  
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        
        <div className="flex-1 flex flex-wrap items-center gap-2">
          {children}
        </div>
        
        {activeFilterCount > 0 && onClearFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
      
      {showResultsCount && (
        <div className="text-sm text-muted-foreground px-1">
          Showing <span className="font-semibold text-foreground">{resultsCount}</span> of{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> results
          {activeFilterCount > 0 && (
            <span className="ml-1">(filtered)</span>
          )}
        </div>
      )}
    </div>
  );
}
