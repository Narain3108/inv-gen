// Table Utilities Module - Comprehensive table management utilities
export { TableFilterEngine } from './tableFilterEngine';
export { TableSortManager } from './tableSortManager';
export { PaginationHandler } from './paginationHandler';
export { SearchEngine } from './searchEngine';

export type { FilterConfig, FilterState } from './tableFilterEngine';
export type { SortDirection, SortConfig, MultiSortConfig } from './tableSortManager';
export type { PaginationConfig, PaginationResult, PaginationInfo } from './paginationHandler';
export type { SearchConfig, SearchResult, SearchMatch } from './searchEngine';

// Main exports - use the classes directly for static methods
// Example usage:
// import { TableFilterEngine, TableSortManager } from '@/lib/modules/table-utils';
// const filter = TableFilterEngine.createDateRangeFilter('date', startDate, endDate);
// const sort = TableSortManager.createDateSort('createdAt', 'desc');