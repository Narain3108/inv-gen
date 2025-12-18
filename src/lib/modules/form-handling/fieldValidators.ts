export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class FieldValidators {
  static validateField(value: any, rules: ValidationRule): ValidationResult {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return { isValid: false, error: 'This field is required' };
    }

    // Skip other validations if field is empty and not required
    if (!value && !rules.required) {
      return { isValid: true };
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return { isValid: false, error: `Minimum length is ${rules.minLength} characters` };
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        return { isValid: false, error: `Maximum length is ${rules.maxLength} characters` };
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        return { isValid: false, error: 'Invalid format' };
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return { isValid: false, error: `Minimum value is ${rules.min}` };
      }
      
      if (rules.max !== undefined && value > rules.max) {
        return { isValid: false, error: `Maximum value is ${rules.max}` };
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        return { isValid: false, error: customError };
      }
    }

    return { isValid: true };
  }

  // Predefined validators for common fields
  static email = {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  };

  static phone = {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
    custom: (value: string) => {
      if (value && !/^[\+]?[1-9][\d]{0,15}$/.test(value)) {
        return 'Please enter a valid phone number';
      }
      return null;
    }
  };

  static currency = {
    min: 0,
    custom: (value: number) => {
      if (value !== undefined && (isNaN(value) || value < 0)) {
        return 'Please enter a valid amount';
      }
      return null;
    }
  };

  static percentage = {
    min: 0,
    max: 100,
    custom: (value: number) => {
      if (value !== undefined && (isNaN(value) || value < 0 || value > 100)) {
        return 'Please enter a percentage between 0 and 100';
      }
      return null;
    }
  };

  static date = {
    custom: (value: string) => {
      if (value && isNaN(Date.parse(value))) {
        return 'Please enter a valid date';
      }
      return null;
    }
  };

  static url = {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      if (value && !/^https?:\/\/.+/.test(value)) {
        return 'Please enter a valid URL';
      }
      return null;
    }
  };
}