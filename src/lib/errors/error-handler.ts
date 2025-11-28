/**
 * Centralized Error Handling
 * 
 * Provides consistent error handling across the application with proper
 * error types, logging, and user-friendly messages.
 * 
 * @module lib/errors/error-handler
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}



/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

/**
 * Not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

/**
 * Unauthorized errors
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
  }
}



/**
 * Generic error handler for async operations
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Operation failed'
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(errorMessage, 'OPERATION_ERROR', 500);
  }
}

/**
 * Log errors appropriately based on environment
 */
export function logError(error: Error | AppError, context?: string): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    console.error(`[${context || 'Error'}]:`, error);
  } else {
    // In production, you might want to send errors to a service like Sentry
    // For now, we'll just log the basic info
    console.error(`Error: ${error.message}`);
  }
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
