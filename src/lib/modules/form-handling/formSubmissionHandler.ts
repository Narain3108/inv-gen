/**
 * Form Submission Handler
 * Centralized form submission logic with error handling and loading states
 */

import { toast } from 'sonner';

export interface SubmissionConfig<T> {
  onSubmit: (data: T) => Promise<any>;
  onSuccess?: (result: any, data: T) => void;
  onError?: (error: Error, data: T) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  resetFormOnSuccess?: boolean;
  redirectOnSuccess?: string;
}

export interface SubmissionState {
  isSubmitting: boolean;
  error: Error | null;
  result: any;
}

export class FormSubmissionHandler<T> {
  private config: SubmissionConfig<T>;
  private state: SubmissionState = {
    isSubmitting: false,
    error: null,
    result: null,
  };

  constructor(config: SubmissionConfig<T>) {
    this.config = config;
  }

  /**
   * Handle form submission with comprehensive error handling
   */
  async handleSubmit(
    data: T,
    options?: {
      skipValidation?: boolean;
      customSuccessMessage?: string;
      customErrorMessage?: string;
    }
  ): Promise<{ success: boolean; result?: any; error?: Error }> {
    const {
      skipValidation = false,
      customSuccessMessage,
      customErrorMessage,
    } = options || {};

    // Set loading state
    this.state = {
      isSubmitting: true,
      error: null,
      result: null,
    };

    try {
      // Execute submission
      const result = await this.config.onSubmit(data);

      // Update state
      this.state = {
        isSubmitting: false,
        error: null,
        result,
      };

      // Handle success
      this.handleSuccess(result, data, customSuccessMessage);

      return { success: true, result };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Update state
      this.state = {
        isSubmitting: false,
        error: errorObj,
        result: null,
      };

      // Handle error
      this.handleError(errorObj, data, customErrorMessage);

      return { success: false, error: errorObj };
    }
  }

  /**
   * Handle successful submission
   */
  private handleSuccess(result: any, data: T, customMessage?: string): void {
    const { onSuccess, successMessage, showSuccessToast = true } = this.config;

    // Call success callback
    if (onSuccess) {
      onSuccess(result, data);
    }

    // Show success toast
    if (showSuccessToast) {
      const message = customMessage || successMessage || 'Operation completed successfully';
      toast.success(message);
    }

    // Handle redirect
    if (this.config.redirectOnSuccess && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = this.config.redirectOnSuccess!;
      }, 1000);
    }
  }

  /**
   * Handle submission error
   */
  private handleError(error: Error, data: T, customMessage?: string): void {
    const { onError, errorMessage, showErrorToast = true } = this.config;

    // Call error callback
    if (onError) {
      onError(error, data);
    }

    // Show error toast
    if (showErrorToast) {
      const message = customMessage || errorMessage || this.getErrorMessage(error);
      toast.error(message);
    }

    // Log error for debugging
    console.error('Form submission error:', error);
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: Error): string {
    // Handle specific error types
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return 'You are not authorized to perform this action.';
    }
    
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Access denied. Please contact your administrator.';
    }
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'The requested resource was not found.';
    }
    
    if (error.message.includes('422') || error.message.includes('Validation')) {
      return 'Please check your input and try again.';
    }
    
    if (error.message.includes('500') || error.message.includes('Internal Server')) {
      return 'Server error. Please try again later.';
    }

    // Return original message if it's user-friendly, otherwise generic message
    return error.message.length < 100 && !error.message.includes('Error:') 
      ? error.message 
      : 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get current submission state
   */
  getState(): SubmissionState {
    return { ...this.state };
  }

  /**
   * Reset submission state
   */
  reset(): void {
    this.state = {
      isSubmitting: false,
      error: null,
      result: null,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SubmissionConfig<T>>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Hook for using form submission handler
 */
export function useFormSubmission<T>(config: SubmissionConfig<T>) {
  const handler = new FormSubmissionHandler(config);

  return {
    handleSubmit: handler.handleSubmit.bind(handler),
    getState: handler.getState.bind(handler),
    reset: handler.reset.bind(handler),
    updateConfig: handler.updateConfig.bind(handler),
  };
}

/**
 * Utility for batch form submissions
 */
export class BatchSubmissionHandler<T> {
  private handlers: Array<{ id: string; handler: FormSubmissionHandler<T> }> = [];

  addHandler(id: string, config: SubmissionConfig<T>): void {
    const handler = new FormSubmissionHandler(config);
    this.handlers.push({ id, handler });
  }

  async submitAll(dataMap: Record<string, T>): Promise<Record<string, { success: boolean; result?: any; error?: Error }>> {
    const results: Record<string, { success: boolean; result?: any; error?: Error }> = {};

    await Promise.all(
      this.handlers.map(async ({ id, handler }) => {
        if (dataMap[id]) {
          results[id] = await handler.handleSubmit(dataMap[id]);
        }
      })
    );

    return results;
  }

  getStates(): Record<string, SubmissionState> {
    const states: Record<string, SubmissionState> = {};
    this.handlers.forEach(({ id, handler }) => {
      states[id] = handler.getState();
    });
    return states;
  }

  resetAll(): void {
    this.handlers.forEach(({ handler }) => handler.reset());
  }
}