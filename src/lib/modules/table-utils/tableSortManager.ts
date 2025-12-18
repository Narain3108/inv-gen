export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

export interface MultiSortConfig<T> {
  sorts: SortConfig<T>[];
}

export class TableSortManager<T> {
  private data: T[];
  private sortConfig: MultiSortConfig<T>;

  constructor(data: T[], initialSort?: SortConfig<T>) {
    this.data = data;
    this.sortConfig = {
      sorts: initialSort ? [initialSort] : []
    };
  }

  setData(data: T[]): void {
    this.data = data;
  }

  setSingleSort(field: keyof T, direction: SortDirection): void {
    this.sortConfig.sorts = [{ field, direction }];
  }

  addSort(field: keyof T, direction: SortDirection): void {
    // Remove existing sort for the same field
    this.sortConfig.sorts = this.sortConfig.sorts.filter(s => s.field !== field);
    // Add new sort
    this.sortConfig.sorts.push({ field, direction });
  }

  toggleSort(field: keyof T): void {
    const existingSort = this.sortConfig.sorts.find(s => s.field === field);
    
    if (!existingSort) {
      this.addSort(field, 'asc');
    } else if (existingSort.direction === 'asc') {
      this.addSort(field, 'desc');
    } else {
      this.removeSort(field);
    }
  }

  removeSort(field: keyof T): void {
    this.sortConfig.sorts = this.sortConfig.sorts.filter(s => s.field !== field);
  }

  clearSorts(): void {
    this.sortConfig.sorts = [];
  }

  private compareValues(a: any, b: any, direction: SortDirection): number {
    // Handle null/undefined values
    if (a == null && b == null) return 0;
    if (a == null) return direction === 'asc' ? -1 : 1;
    if (b == null) return direction === 'asc' ? 1 : -1;

    // Handle different data types
    if (typeof a === 'string' && typeof b === 'string') {
      const result = a.toLowerCase().localeCompare(b.toLowerCase());
      return direction === 'asc' ? result : -result;
    }

    if (typeof a === 'number' && typeof b === 'number') {
      const result = a - b;
      return direction === 'asc' ? result : -result;
    }

    if (a instanceof Date && b instanceof Date) {
      const result = a.getTime() - b.getTime();
      return direction === 'asc' ? result : -result;
    }

    // Handle boolean values
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      const result = a === b ? 0 : a ? 1 : -1;
      return direction === 'asc' ? result : -result;
    }

    // Fallback to string comparison
    const result = String(a).toLowerCase().localeCompare(String(b).toLowerCase());
    return direction === 'asc' ? result : -result;
  }

  getSortedData(): T[] {
    if (this.sortConfig.sorts.length === 0) {
      return [...this.data];
    }

    return [...this.data].sort((a, b) => {
      for (const sort of this.sortConfig.sorts) {
        const comparison = this.compareValues(
          a[sort.field],
          b[sort.field],
          sort.direction
        );
        
        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });
  }

  getSortConfig(): MultiSortConfig<T> {
    return { ...this.sortConfig };
  }

  getSortForField(field: keyof T): SortConfig<T> | null {
    return this.sortConfig.sorts.find(s => s.field === field) || null;
  }

  // Utility methods for common sorting patterns
  static createDateSort<T>(field: keyof T, direction: SortDirection = 'desc'): SortConfig<T> {
    return { field, direction };
  }

  static createAlphabeticalSort<T>(field: keyof T, direction: SortDirection = 'asc'): SortConfig<T> {
    return { field, direction };
  }

  static createNumericSort<T>(field: keyof T, direction: SortDirection = 'desc'): SortConfig<T> {
    return { field, direction };
  }

  // Method to get sort indicator for UI
  getSortIndicator(field: keyof T): '↑' | '↓' | '' {
    const sort = this.getSortForField(field);
    if (!sort) return '';
    return sort.direction === 'asc' ? '↑' : '↓';
  }
}