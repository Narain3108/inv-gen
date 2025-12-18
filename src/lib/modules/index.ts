// Main Modules Index - Centralized access to all modular utilities

// Form Handling
export * from './form-handling';

// Table Utilities  
export * from './table-utils';

// Dialog Management
export * from './dialog-management';

// Data Transformation
export * from './data-transform';

// Async Patterns
export * from './async-patterns';

// Module metadata for documentation and tooling
export const MODULES = {
    FORM_HANDLING: 'form-handling',
    TABLE_UTILS: 'table-utils',
    DIALOG_MANAGEMENT: 'dialog-management',
    DATA_TRANSFORM: 'data-transform',
    ASYNC_PATTERNS: 'async-patterns'
} as const;

export const MODULE_VERSIONS = {
    [MODULES.FORM_HANDLING]: '1.0.0',
    [MODULES.TABLE_UTILS]: '1.0.0',
    [MODULES.DIALOG_MANAGEMENT]: '1.0.0',
    [MODULES.DATA_TRANSFORM]: '1.0.0',
    [MODULES.ASYNC_PATTERNS]: '1.0.0'
} as const;