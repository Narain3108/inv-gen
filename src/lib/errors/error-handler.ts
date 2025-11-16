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
 * Firebase-specific errors
 */
export class FirebaseError extends AppError {
  constructor(message: string, code: string = 'FIREBASE_ERROR') {
    super(message, code, 500);
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
 * Map Firebase error codes to user-friendly messages
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'permission-denied': 'You do not have permission to perform this action',
  'not-found': 'The requested resource was not found',
  'already-exists': 'This resource already exists',
  'failed-precondition': 'Operation cannot be performed in the current state',
  'unauthenticated': 'You must be signed in to perform this action',
  'unavailable': 'Service is temporarily unavailable. Please try again',
  'deadline-exceeded': 'Request timed out. Please try again',
};

/**
 * Convert Firebase errors to AppError
 */
export function handleFirebaseError(error: any): AppError {
  const code = error.code || 'UNKNOWN_ERROR';
  const message = FIREBASE_ERROR_MESSAGES[code] || error.message || 'An unexpected error occurred';
  
  return new FirebaseError(message, code);
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
    
    if (error.code && error.code.startsWith('firebase')) {
      throw handleFirebaseError(error);
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
