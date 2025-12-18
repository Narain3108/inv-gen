// Data Transformation Module - Specialized data transformation utilities
export { DashboardDataTransformer } from './dashboardDataTransformer';
export { ListDataTransformer } from './listDataTransformer';

export type {
    DashboardMetrics,
    ChartDataPoint,
    TimeSeriesData,
    RevenueBreakdown
} from './dashboardDataTransformer';

export type {
    ListDisplayConfig,
    TransformedListItem,
    ListSummary
} from './listDataTransformer';

// Main exports - use the classes directly for static methods
// Example usage:
// import { DashboardDataTransformer, ListDataTransformer } from '@/lib/modules/data-transform';
// const metrics = DashboardDataTransformer.transformInvoicesToMetrics(invoices);
// const transformedList = ListDataTransformer.transformInvoiceList(invoices);