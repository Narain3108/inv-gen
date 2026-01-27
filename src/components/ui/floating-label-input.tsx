'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * FloatingLabelInput
 *
 * A reusable input component with a floating label that moves to the border
 * when the input is focused or has a value.
 *
 * Principles:
 * - SRP: This component is solely responsible for rendering a styled input with a floating label.
 * - DRY: Consolidates floating label logic, avoiding repetition across forms.
 * - KISS: Uses CSS `peer` class for animation, keeping JS logic minimal.
 */

export interface FloatingLabelInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

const FloatingLabelInput = React.forwardRef<
    HTMLInputElement,
    FloatingLabelInputProps
>(({ className, label, id, error, type = 'text', ...props }, ref) => {
    const inputId = id || React.useId();

    return (
        <div className="relative w-full">
            <input
                type={type}
                id={inputId}
                ref={ref}
                placeholder=" " // Important: space placeholder for :placeholder-shown CSS selector
                aria-invalid={!!error}
                className={cn(
                    // Base styles - Compact version with high visibility borders
                    'peer block w-full appearance-none rounded-md border-2 border-foreground/40 bg-transparent px-2.5 pb-1.5 pt-3 text-xs',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-0',
                    // Focus state - darker border
                    'focus:border-primary focus:ring-2 focus:ring-primary/20',
                    // Error state
                    error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                    // Disabled state
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
                    className
                )}
                {...props}
            />
            <label
                htmlFor={inputId}
                className={cn(
                    // Base styles - Compact
                    'absolute left-2.5 top-1/2 -translate-y-1/2 origin-[0] select-none bg-transparent px-0.5',
                    'text-xs text-muted-foreground pointer-events-none',
                    'transition-all duration-200 ease-out',
                    // Floating state: when input is focused or has value
                    'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:px-1 peer-focus:text-primary peer-focus:bg-background',
                    'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-background',
                    // Error state
                    error && 'peer-focus:text-destructive'
                )}
            >
                {label}
            </label>
            {error && (
                <p className="mt-1 text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
});

FloatingLabelInput.displayName = 'FloatingLabelInput';

export { FloatingLabelInput };
