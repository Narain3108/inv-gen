/**
 * Form State Manager
 * Centralized form state management with validation and submission handling
 */

import { useState, useCallback, useEffect } from 'react';
import { ZodSchema, ZodError } from 'zod';

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormConfig<T> {
  initialData: T;
  validationSchema?: ZodSchema<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export function useFormState<T extends Record<string, any>>(config: FormConfig<T>) {
  const {
    initialData,
    validationSchema,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
  } = config;

  const [state, setState] = useState<FormState<T>>({
    data: initialData,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    isDirty: false,
  });

  // Validate single field
  const validateField = useCallback((fieldName: keyof T, value: any): string | null => {
    if (!validationSchema) return null;

    try {
      const fieldSchema = validationSchema.shape[fieldName as string];
      if (fieldSchema) {
        fieldSchema.parse(value);
      }
      return null;
    } catch (error) {
      if (error instanceof ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Validation error';
    }
  }, [validationSchema]);

  // Validate entire form
  const validateForm = useCallback((data: T): Record<string, string> => {
    if (!validationSchema) return {};

    try {
      validationSchema.parse(data);
      return {};
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return errors;
      }
      return {};
    }
  }, [validationSchema]);

  // Update field value
  const updateField = useCallback((fieldName: keyof T, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [fieldName]: value };
      const newErrors = { ...prev.errors };
      
      // Validate field if enabled
      if (validateOnChange) {
        const fieldError = validateField(fieldName, value);
        if (fieldError) {
          newErrors[fieldName as string] = fieldError;
        } else {
          delete newErrors[fieldName as string];
        }
      }

      return {
        ...prev,
        data: newData,
        errors: newErrors,
        isDirty: true,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, [validateField, validateOnChange]);

  // Handle field blur
  const handleBlur = useCallback((fieldName: keyof T) => {
    setState(prev => {
      const newTouched = { ...prev.touched, [fieldName]: true };
      let newErrors = { ...prev.errors };

      // Validate field on blur if enabled
      if (validateOnBlur) {
        const fieldError = validateField(fieldName, prev.data[fieldName]);
        if (fieldError) {
          newErrors[fieldName as string] = fieldError;
        } else {
          delete newErrors[fieldName as string];
        }
      }

      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, [validateField, validateOnBlur]);

  // Submit form
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate entire form
    const formErrors = validateForm(state.data);
    
    setState(prev => ({
      ...prev,
      errors: formErrors,
      isValid: Object.keys(formErrors).length === 0,
      isSubmitting: true,
    }));

    if (Object.keys(formErrors).length > 0) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      return false;
    }

    try {
      if (onSubmit) {
        await onSubmit(state.data);
      }
      setState(prev => ({ ...prev, isSubmitting: false }));
      return true;
    } catch (error) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [state.data, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setState({
      data: initialData,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
      isDirty: false,
    });
  }, [initialData]);

  // Set form data
  const setFormData = useCallback((data: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...data },
      isDirty: true,
    }));
  }, []);

  return {
    ...state,
    updateField,
    handleBlur,
    handleSubmit,
    resetForm,
    setFormData,
    validateField,
    validateForm,
  };
}