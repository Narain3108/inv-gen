export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export class PaginationHandler<T> {
  private data: T[];
  private config: PaginationConfig;

  constructor(data: T[], initialConfig?: Partial<PaginationConfig>) {
    this.data = data;
    this.config = {
      page: 1,
      pageSize: 10,
      totalItems: data.length,
      ...initialConfig
    };
  }

  setData(data: T[]): void {
    this.data = data;
    this.config.totalItems = data.length;
    // Reset to first page if current page is out of bounds
    const totalPages = this.getTotalPages();
    if (this.config.page > totalPages && totalPages > 0) {
      this.config.page = 1;
    }
  }

  setPage(page: number): void {
    const totalPages = this.getTotalPages();
    this.config.page = Math.max(1, Math.min(page, totalPages));
  }

  setPageSize(pageSize: number): void {
    const oldPageSize = this.config.pageSize;
    const oldPage = this.config.page;
    
    // Calculate the first item index of the current page
    const currentFirstItemIndex = (oldPage - 1) * oldPageSize;
    
    // Calculate what page this item would be on with the new page size
    const newPage = Math.floor(currentFirstItemIndex / pageSize) + 1;
    
    this.config.pageSize = Math.max(1, pageSize);
    this.config.page = newPage;
  }

  nextPage(): boolean {
    if (this.hasNextPage()) {
      this.config.page++;
      return true;
    }
    return false;
  }

  previousPage(): boolean {
    if (this.hasPreviousPage()) {
      this.config.page--;
      return true;
    }
    return false;
  }

  firstPage(): void {
    this.config.page = 1;
  }

  lastPage(): void {
    this.config.page = this.getTotalPages();
  }

  private getTotalPages(): number {
    return Math.ceil(this.config.totalItems / this.config.pageSize);
  }

  private hasNextPage(): boolean {
    return this.config.page < this.getTotalPages();
  }

  private hasPreviousPage(): boolean {
    return this.config.page > 1;
  }

  private getStartIndex(): number {
    return (this.config.page - 1) * this.config.pageSize;
  }

  private getEndIndex(): number {
    const startIndex = this.getStartIndex();
    return Math.min(startIndex + this.config.pageSize - 1, this.config.totalItems - 1);
  }

  getPaginatedData(): PaginationResult<T> {
    const startIndex = this.getStartIndex();
    const endIndex = startIndex + this.config.pageSize;
    
    const paginatedData = this.data.slice(startIndex, endIndex);
    
    const pagination: PaginationInfo = {
      currentPage: this.config.page,
      pageSize: this.config.pageSize,
      totalItems: this.config.totalItems,
      totalPages: this.getTotalPages(),
      hasNextPage: this.hasNextPage(),
      hasPreviousPage: this.hasPreviousPage(),
      startIndex: this.getStartIndex(),
      endIndex: this.getEndIndex()
    };

    return {
      data: paginatedData,
      pagination
    };
  }

  getPaginationInfo(): PaginationInfo {
    return {
      currentPage: this.config.page,
      pageSize: this.config.pageSize,
      totalItems: this.config.totalItems,
      totalPages: this.getTotalPages(),
      hasNextPage: this.hasNextPage(),
      hasPreviousPage: this.hasPreviousPage(),
      startIndex: this.getStartIndex(),
      endIndex: this.getEndIndex()
    };
  }

  getConfig(): PaginationConfig {
    return { ...this.config };
  }

  // Utility methods for common pagination patterns
  static getPageNumbers(currentPage: number, totalPages: number, maxVisible: number = 5): number[] {
    const pages: number[] = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisible / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxVisible - 1);
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  static getPageSizeOptions(): number[] {
    return [5, 10, 25, 50, 100];
  }

  // Method to get display text for pagination info
  getDisplayText(): string {
    const { startIndex, endIndex, totalItems } = this.getPaginationInfo();
    if (totalItems === 0) {
      return 'No items to display';
    }
    return `Showing ${startIndex + 1}-${endIndex + 1} of ${totalItems} items`;
  }
}