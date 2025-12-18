import { useState, useCallback, useRef } from 'react';

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface AsyncWithRetryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

export interface AsyncWithRetryActions {
  execute: () => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export function useAsyncWithRetry<T>(
  asyncFunction: () => Promise<T>,
  config: RetryConfig = {}
): AsyncWithRetryState<T> & AsyncWithRetryActions {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    retryCondition = () => true
  } = config;

  const [state, setState] = useState<AsyncWithRetryState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    isRetrying: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const executeWithRetry = useCallback(async (isRetry = false) => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending retry timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      isRetrying: isRetry
    }));

    try {
      const result = await asyncFunction();
      
      // Check if operation was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setState(prev => ({
        ...prev,
        data: result,
        loading: false,
        error: null,
        retryCount: 0,
        isRetrying: false
      }));
    } catch (error) {
      // Check if operation was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const err = error as Error;
      const currentRetryCount = isRetry ? state.retryCount + 1 : 1;

      setState(prev => ({
        ...prev,
        loading: false,
        error: err,
        retryCount: currentRetryCount,
        isRetrying: false
      }));

      // Check if we should retry
      if (
        currentRetryCount <= maxRetries &&
        retryCondition(err)
      ) {
        const delay = retryDelay * Math.pow(backoffMultiplier, currentRetryCount - 1);
        
        setState(prev => ({
          ...prev,
          isRetrying: true
        }));

        timeoutRef.current = setTimeout(() => {
          executeWithRetry(true);
        }, delay);
      }
    }
  }, [asyncFunction, maxRetries, retryDelay, backoffMultiplier, retryCondition, state.retryCount]);

  const execute = useCallback(() => {
    return executeWithRetry(false);
  }, [executeWithRetry]);

  const retry = useCallback(() => {
    return executeWithRetry(true);
  }, [executeWithRetry]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState({
      data: null,
      loading: false,
      error: null,
      retryCount: 0,
      isRetrying: false
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      loading: false,
      isRetrying: false
    }));
  }, []);

  return {
    ...state,
    execute,
    retry,
    reset,
    cancel
  };
}

// Utility function to create common retry conditions
export const RetryConditions = {
  networkErrors: (error: Error) => {
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  },
  
  serverErrors: (error: Error) => {
    // Assuming error has a status property for HTTP errors
    const status = (error as any).status;
    return status >= 500 && status < 600;
  },
  
  rateLimitErrors: (error: Error) => {
    const status = (error as any).status;
    return status === 429;
  },
  
  temporaryErrors: (error: Error) => {
    const status = (error as any).status;
    return status === 503 || status === 502 || status === 504;
  },
  
  combine: (...conditions: ((error: Error) => boolean)[]) => {
    return (error: Error) => conditions.some(condition => condition(error));
  }
};