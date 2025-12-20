/**
 * Form Validation Engine
 * Advanced validation utilities for forms
 */

import { ZodSchema, ZodError } from 'zod';

export interface ValidationRule<T = any> {
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
}

export interface AsyncValidationRule<T = any> {
  validator: (value: T) => Promise<boolean>;
  message: string;
  debounceMs?: number;
}

export interface FieldValidationConfig {
  required?: boolean;
  rules?: ValidationRule[];
  asyncRules?: AsyncValidationRule[];
  dependencies?: string[];
}

export class FormValidationEngine {
  private validationCache = new Map<string, { result: boolean; timestamp: number }>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();

  /**
   * Validate a single field with custom rules
   */
  async validateField(
    fieldName: string,
    value: any,
    config: FieldValidationConfig
  ): Promise<string | null> {
    // Required validation
    if (config.required && this.isEmpty(value)) {
      return `${fieldName} is required`;
    }

    // Skip other validations if empty and not required
    if (this.isEmpty(value) && !config.required) {
      return null;
    }

    // Synchronous rules
    if (config.rules) {
      for (const rule of config.rules) {
        const isValid = await rule.validator(value);
        if (!isValid) {
          return rule.message;
        }
      }
    }

    // Asynchronous rules with debouncing
    if (config.asyncRules) {
      for (const rule of config.asyncRules) {
        const error = await this.validateAsyncRule(fieldName, value, rule);
        if (error) {
          return error;
        }
      }
    }

    return null;
  }

  /**
   * Validate async rule with debouncing and caching
   */
  private async validateAsyncRule(
    fieldName: string,
    value: any,
    rule: AsyncValidationRule
  ): Promise<string | null> {
    const cacheKey = `${fieldName}:${JSON.stringify(value)}`;
    const debounceMs = rule.debounceMs || 300;

    // Check cache first
    const cached = this.validationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30000) { // 30s cache
      return cached.result ? null : rule.message;
    }

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(fieldName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Create debounced validation
    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          const isValid = await rule.validator(value);
          
          // Cache result
          this.validationCache.set(cacheKey, {
            result: isValid,
            timestamp: Date.now(),
          });

          resolve(isValid ? null : rule.message);
        } catch (error) {
          resolve(rule.message);
        } finally {
          this.debounceTimers.delete(fieldName);
        }
      }, debounceMs);

      this.debounceTimers.set(fieldName, timer);
    });
  }

  /**
   * Validate form with Zod schema
   */
  validateWithSchema<T>(data: T, schema: ZodSchema<T>): Record<string, string> {
    try {
      schema.parse(data);
      return {};
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string> = {};
        (error as any).issues.forEach((err: any) => {
          const path = (err.path || []).join('.');
          errors[path] = err.message;
        });
        return errors;
      }
      return {};
    }
  }

  /**
   * Validate dependent fields
   */
  validateDependencies(
    fieldName: string,
    formData: Record<string, any>,
    dependencies: string[]
  ): string[] {
    const errors: string[] = [];
    
    dependencies.forEach(depField => {
      if (this.isEmpty(formData[depField])) {
        errors.push(`${depField} is required when ${fieldName} is provided`);
      }
    });

    return errors;
  }

  /**
   * Cross-field validation
   */
  validateCrossFields(
    formData: Record<string, any>,
    rules: Array<{
      fields: string[];
      validator: (values: any[]) => boolean;
      message: string;
    }>
  ): Record<string, string> {
    const errors: Record<string, string> = {};

    rules.forEach(rule => {
      const values = rule.fields.map(field => formData[field]);
      const isValid = rule.validator(values);
      
      if (!isValid) {
        rule.fields.forEach(field => {
          errors[field] = rule.message;
        });
      }
    });

    return errors;
  }

  /**
   * Check if value is empty
   */
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// Singleton instance
export const validationEngine = new FormValidationEngine();

// Common validation rules
export const commonValidationRules = {
  email: {
    validator: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
  },
  
  phone: {
    validator: (value: string) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, '')),
    message: 'Please enter a valid 10-digit phone number',
  },
  
  gstin: {
    validator: (value: string) => 
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value),
    message: 'Please enter a valid GSTIN',
  },
  
  pan: {
    validator: (value: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value),
    message: 'Please enter a valid PAN number',
  },
  
  pincode: {
    validator: (value: string) => /^[1-9][0-9]{5}$/.test(value),
    message: 'Please enter a valid 6-digit pincode',
  },
  
  ifsc: {
    validator: (value: string) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value),
    message: 'Please enter a valid IFSC code',
  },
  
  minLength: (min: number) => ({
    validator: (value: string) => value.length >= min,
    message: `Must be at least ${min} characters long`,
  }),
  
  maxLength: (max: number) => ({
    validator: (value: string) => value.length <= max,
    message: `Must be no more than ${max} characters long`,
  }),
  
  minValue: (min: number) => ({
    validator: (value: number) => value >= min,
    message: `Must be at least ${min}`,
  }),
  
  maxValue: (max: number) => ({
    validator: (value: number) => value <= max,
    message: `Must be no more than ${max}`,
  }),
};

// Compatibility type exports expected by module index
export type ValidationSchema = ZodSchema<any>;
export type ValidationError = Record<string, string>;
export type ValidatorFunction = (value: any) => boolean | Promise<boolean>;