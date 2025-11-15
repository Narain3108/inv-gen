/**
 * useAsync Hook
 * 
 * Generic hook for handling async operations with loading, error,
 * and success states.
 * 
 * @module hooks/useAsync
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppError, getUserMessage, logError } from '@/lib/errors/error-handler';
import { toast } from 'sonner';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface AsyncActions<T, Args extends unknown[]> {
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
  setData: (data: T | null) => void;
}

export interface UseAsyncOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  successMessage?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing async operations
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: UseAsyncOptions = {}
): AsyncState<T> & AsyncActions<T, Args> {
  const {
    showErrorToast = true,
    showSuccessToast = false,
    successMessage,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, loading: false, error: null });

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        onSuccess?.();
        return result;
      } catch (error: any) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: errorObj });

        logError(errorObj, 'useAsync');

        if (showErrorToast) {
          toast.error(getUserMessage(errorObj));
        }

        onError?.(errorObj);
        return null;
      }
    },
    [asyncFunction, showErrorToast, showSuccessToast, successMessage, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
  };
}

/**
 * Hook for auto-executing async operations on mount
 */
export function useAsyncEffect<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions = {}
): AsyncState<T> {
  const { data, loading, error, execute, reset, setData } = useAsync(asyncFunction, options);

  useEffect(() => {
    execute();
    return () => reset();
  }, deps);

  return { data, loading, error };
}
