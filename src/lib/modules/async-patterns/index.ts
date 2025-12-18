// Async Patterns Module - Enhanced async operation utilities
export { useAsyncWithRetry, RetryConditions } from './useAsyncWithRetry';

export type {
  RetryConfig,
  AsyncWithRetryState,
  AsyncWithRetryActions
} from './useAsyncWithRetry';

// Main exports - use RetryConditions directly for utility functions
// Example usage:
// import { useAsyncWithRetry, RetryConditions } from '@/lib/modules/async-patterns';
// const { execute } = useAsyncWithRetry(asyncFn, { retryCondition: RetryConditions.networkErrors });