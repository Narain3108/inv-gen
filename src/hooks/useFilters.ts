/**
 * Generic Filter Hook
 * Reusable hook for filtering any list of data
 */

import { useState, useMemo, useCallback } from 'react';

export type FilterConfig<T> = {
  [key: string]: (item: T, value: any) => boolean;
};

export function useFilters<T>(
  data: T[],
  filterConfig: FilterConfig<T>
) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters(prev => {
      if (value === null || value === undefined || value === '' || value === 'all') {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const filteredData = useMemo(() => {
    if (Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        const filterFn = filterConfig[key];
        return filterFn ? filterFn(item, value) : true;
      });
    });
  }, [data, filters, filterConfig]);

  const activeFilterCount = Object.keys(filters).length;
  const hasActiveFilters = activeFilterCount > 0;

  return {
    filters,
    filteredData,
    updateFilter,
    clearFilters,
    activeFilterCount,
    hasActiveFilters,
  };
}
