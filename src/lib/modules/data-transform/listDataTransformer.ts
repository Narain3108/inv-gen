export interface ListDisplayConfig<T> {
  fields: (keyof T)[];
  formatters?: Partial<Record<keyof T, (value: any, item: T) => string>>;
  sorters?: Partial<Record<keyof T, (a: any, b: any) => number>>;
  filters?: Partial<Record<keyof T, (value: any, filterValue: any) => boolean>>;
}

export interface TransformedListItem<T> {
  original: T;
  display: Record<string, string>;
  searchableText: string;
  sortableValues: Record<string, any>;
}

export interface ListSummary {
  totalItems: number;
  visibleItems: number;
  summaryStats: Record<string, any>;
}

export class ListDataTransformer<T> {
  private config: ListDisplayConfig<T>;

  constructor(config: ListDisplayConfig<T>) {
    this.config = config;
  }

  transformItems(items: T[]): TransformedListItem<T>[] {
    return items.map(item => this.transformSingleItem(item));
  }

  private transformSingleItem(item: T): TransformedListItem<T> {
    const display: Record<string, string> = {};
    const sortableValues: Record<string, any> = {};
    const searchableTexts: string[] = [];

    for (const field of this.config.fields) {
      const value = item[field];
      const formatter = this.config.formatters?.[field];
      
      // Format display value
      const displayValue = formatter ? formatter(value, item) : this.defaultFormatter(value);
      display[String(field)] = displayValue;
      
      // Store sortable value (original or custom)
      const sorter = this.config.sorters?.[field];
      sortableValues[String(field)] = sorter ? value : this.getSortableValue(value);
      
      // Add to searchable text
      searchableTexts.push(displayValue.toLowerCase());
    }

    return {
      original: item,
      display,
      searchableText: searchableTexts.join(' '),
      sortableValues
    };
  }

  private defaultFormatter(value: any): string {
    if (value == null) return '';
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    return String(value);
  }

  private getSortableValue(value: any): any {
    if (value instanceof Date) {
      return value.getTime();
    }
    
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    
    return value;
  }

  // Static methods for common list transformations
  static transformInvoiceList(invoices: any[]): TransformedListItem<any>[] {
    const config: ListDisplayConfig<any> = {
      fields: ['invoiceNumber', 'clientName', 'total', 'status', 'dueDate', 'createdAt'],
      formatters: {
        total: (value) => `$${value?.toLocaleString() || '0'}`,
        dueDate: (value) => value ? new Date(value).toLocaleDateString() : 'No due date',
        createdAt: (value) => new Date(value).toLocaleDateString(),
        status: (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown'
      }
    };
    
    const transformer = new ListDataTransformer(config);
    return transformer.transformItems(invoices);
  }

  static transformClientList(clients: any[]): TransformedListItem<any>[] {
    const config: ListDisplayConfig<any> = {
      fields: ['name', 'companyName', 'email', 'phone', 'totalInvoices', 'totalRevenue', 'lastInvoiceDate'],
      formatters: {
        totalRevenue: (value) => `$${value?.toLocaleString() || '0'}`,
        totalInvoices: (value) => `${value || 0} invoices`,
        lastInvoiceDate: (value) => value ? new Date(value).toLocaleDateString() : 'No invoices',
        phone: (value) => value || 'No phone',
        email: (value) => value || 'No email'
      }
    };
    
    const transformer = new ListDataTransformer(config);
    return transformer.transformItems(clients);
  }

  static transformProductList(products: any[]): TransformedListItem<any>[] {
    const config: ListDisplayConfig<any> = {
      fields: ['name', 'description', 'price', 'category', 'isActive', 'createdAt'],
      formatters: {
        price: (value) => `$${value?.toLocaleString() || '0'}`,
        isActive: (value) => value ? 'Active' : 'Inactive',
        createdAt: (value) => new Date(value).toLocaleDateString(),
        description: (value) => value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'No description'
      }
    };
    
    const transformer = new ListDataTransformer(config);
    return transformer.transformItems(products);
  }

  static transformPaymentList(payments: any[]): TransformedListItem<any>[] {
    const config: ListDisplayConfig<any> = {
      fields: ['invoiceNumber', 'amount', 'paymentMethod', 'paymentDate', 'status', 'reference'],
      formatters: {
        amount: (value) => `$${value?.toLocaleString() || '0'}`,
        paymentDate: (value) => new Date(value).toLocaleDateString(),
        paymentMethod: (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown',
        status: (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || 'Unknown',
        reference: (value) => value || 'No reference'
      }
    };
    
    const transformer = new ListDataTransformer(config);
    return transformer.transformItems(payments);
  }

  // Method to generate list summary
  static generateListSummary<T>(
    items: T[],
    visibleItems: T[],
    summaryFields: (keyof T)[]
  ): ListSummary {
    const summaryStats: Record<string, any> = {};

    for (const field of summaryFields) {
      const values = visibleItems.map(item => item[field]).filter(v => v != null);
      
      if (values.length === 0) {
        summaryStats[String(field)] = { count: 0, sum: 0, average: 0 };
        continue;
      }

      const numericValues = values.filter(v => typeof v === 'number');
      
      if (numericValues.length > 0) {
        const sum = numericValues.reduce((acc, val) => acc + val, 0);
        summaryStats[String(field)] = {
          count: numericValues.length,
          sum,
          average: sum / numericValues.length,
          min: Math.min(...numericValues),
          max: Math.max(...numericValues)
        };
      } else {
        summaryStats[String(field)] = {
          count: values.length,
          uniqueValues: new Set(values).size
        };
      }
    }

    return {
      totalItems: items.length,
      visibleItems: visibleItems.length,
      summaryStats
    };
  }

  // Method to group items by a field
  static groupItemsByField<T>(
    items: TransformedListItem<T>[],
    field: keyof T
  ): Record<string, TransformedListItem<T>[]> {
    return items.reduce((groups, item) => {
      const value = String(item.original[field] || 'Unknown');
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    }, {} as Record<string, TransformedListItem<T>[]>);
  }

  // Method to get field statistics
  static getFieldStatistics<T>(
    items: TransformedListItem<T>[],
    field: keyof T
  ): {
    totalCount: number;
    uniqueValues: number;
    mostCommon: { value: any; count: number } | null;
    distribution: Record<string, number>;
  } {
    const values = items.map(item => item.original[field]);
    const distribution = values.reduce((acc, value) => {
      const key = String(value);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)[0];

    return {
      totalCount: values.length,
      uniqueValues: Object.keys(distribution).length,
      mostCommon: mostCommon ? { value: mostCommon[0], count: mostCommon[1] } : null,
      distribution
    };
  }

  // Method to export list data to CSV format
  static exportToCSV<T>(
    items: TransformedListItem<T>[],
    fields: (keyof T)[],
    filename?: string
  ): string {
    const headers = fields.map(field => String(field));
    const rows = items.map(item => 
      fields.map(field => {
        const value = item.display[String(field)] || '';
        // Escape commas and quotes for CSV
        return value.includes(',') || value.includes('"') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }
}