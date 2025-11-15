/**
 * useFormValidation Hook
 * 
 * Enhanced form validation hook with better error handling
 * and user feedback.
 * 
 * @module hooks/useFormValidation
 */

'use client';

import { useState, useCallback } from 'react';
import { ZodSchema, ZodError } from 'zod';
import { toast } from 'sonner';

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Partial<Record<keyof T, string>>;
  data?: T;
}

export interface UseFormValidationReturn<T> {
  errors: Partial<Record<keyof T, string>>;
  validate: (data: T) => ValidationResult<T>;
  validateField: (field: keyof T, value: unknown) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof T) => void;
  setFieldError: (field: keyof T, message: string) => void;
}

/**
 * Hook for form validation with Zod schemas
 */
export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodSchema<T>
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = useCallback(
    (data: T): ValidationResult<T> => {
      try {
        const validatedData = schema.parse(data);
        setErrors({});
        return {
          isValid: true,
          errors: {},
          data: validatedData,
        };
      } catch (error) {
        if (error instanceof ZodError) {
          const newErrors: Partial<Record<keyof T, string>> = {};
          
          error.issues.forEach((issue) => {
            const field = issue.path[0] as keyof T;
            if (field) {
              newErrors[field] = issue.message;
            }
          });

          setErrors(newErrors);
          
          return {
            isValid: false,
            errors: newErrors,
          };
        }

        // Unknown error type
        toast.error('Validation failed');
        return {
          isValid: false,
          errors: {},
        };
      }
    },
    [schema]
  );

  const validateField = useCallback(
    (field: keyof T, value: unknown): boolean => {
      // Simplified field validation - validates against the error message only
      // For full field validation, the entire form should be validated
      try {
        // Clear error if value seems valid (basic check)
        if (value !== undefined && value !== null && value !== '') {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
          });
          return true;
        }
        return false;
      } catch (error) {
        return false;
      }
    },
    []
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
  };
}
