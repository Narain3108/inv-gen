// Form Handling Module - Centralized form management utilities
export { useFormState } from './formStateManager';
export { FormValidationEngine } from './formValidationEngine';
export { FormSubmissionHandler, useFormSubmission } from './formSubmissionHandler';
export { FieldValidators } from './fieldValidators';

export type {
  FormState,
  FormConfig
} from './formStateManager';

export type {
  SubmissionConfig,
  SubmissionState
} from './formSubmissionHandler';

export type {
  ValidationSchema,
  ValidationError,
  ValidatorFunction
} from './formValidationEngine';

// Main exports - use hooks and utilities for form handling
// Example usage:
// import { useFormState, FieldValidators } from '@/lib/modules/form-handling';
// const formState = useFormState({ initialData, validationSchema });
// const emailRule = FieldValidators.email;