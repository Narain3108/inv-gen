export interface FilterConfig<T> {
  field: keyof T;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
  secondValue?: any; // For 'between' operator
}

export interface FilterState<T> {
  filters: FilterConfig<T>[];
  searchQuery: string;
  searchFields: (keyof T)[];
}

export class TableFilterEngine<T> {
  private data: T[];
  private filterState: FilterState<T>;

  constructor(data: T[], initialState?: Partial<FilterState<T>>) {
    this.data = data;
    this.filterState = {
      filters: [],
      searchQuery: '',
      searchFields: [],
      ...initialState
    };
  }

  setData(data: T[]): void {
    this.data = data;
  }

  addFilter(filter: FilterConfig<T>): void {
    // Remove existing filter for the same field
    this.filterState.filters = this.filterState.filters.filter(f => f.field !== filter.field);
    this.filterState.filters.push(filter);
  }

  removeFilter(field: keyof T): void {
    this.filterState.filters = this.filterState.filters.filter(f => f.field !== field);
  }

  clearFilters(): void {
    this.filterState.filters = [];
  }

  setSearch(query: string, fields: (keyof T)[]): void {
    this.filterState.searchQuery = query;
    this.filterState.searchFields = fields;
  }

  clearSearch(): void {
    this.filterState.searchQuery = '';
    this.filterState.searchFields = [];
  }

  private applyFilter(item: T, filter: FilterConfig<T>): boolean {
    const value = item[filter.field];
    const filterValue = filter.value;

    switch (filter.operator) {
      case 'equals':
        return value === filterValue;
      
      case 'contains':
        return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      
      case 'startsWith':
        return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
      
      case 'endsWith':
        return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
      
      case 'gt':
        return Number(value) > Number(filterValue);
      
      case 'lt':
        return Number(value) < Number(filterValue);
      
      case 'gte':
        return Number(value) >= Number(filterValue);
      
      case 'lte':
        return Number(value) <= Number(filterValue);
      
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);
      
      case 'between':
        const numValue = Number(value);
        const min = Number(filterValue);
        const max = Number(filter.secondValue);
        return numValue >= min && numValue <= max;
      
      default:
        return true;
    }
  }

  private applySearch(item: T): boolean {
    if (!this.filterState.searchQuery || this.filterState.searchFields.length === 0) {
      return true;
    }

    const query = this.filterState.searchQuery.toLowerCase();
    return this.filterState.searchFields.some(field => {
      const value = String(item[field]).toLowerCase();
      return value.includes(query);
    });
  }

  getFilteredData(): T[] {
    return this.data.filter(item => {
      // Apply all filters
      const passesFilters = this.filterState.filters.every(filter => 
        this.applyFilter(item, filter)
      );

      // Apply search
      const passesSearch = this.applySearch(item);

      return passesFilters && passesSearch;
    });
  }

  getFilterState(): FilterState<T> {
    return { ...this.filterState };
  }

  // Utility methods for common filter patterns
  static createDateRangeFilter<T>(
    field: keyof T, 
    startDate: Date, 
    endDate: Date
  ): FilterConfig<T> {
    return {
      field,
      operator: 'between',
      value: startDate.getTime(),
      secondValue: endDate.getTime()
    };
  }

  static createStatusFilter<T>(
    field: keyof T, 
    statuses: string[]
  ): FilterConfig<T> {
    return {
      field,
      operator: 'in',
      value: statuses
    };
  }

  static createAmountRangeFilter<T>(
    field: keyof T, 
    min: number, 
    max: number
  ): FilterConfig<T> {
    return {
      field,
      operator: 'between',
      value: min,
      secondValue: max
    };
  }
}