'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * FloatingLabelTextarea
 *
 * A reusable textarea component with a floating label.
 * Follows the same pattern as FloatingLabelInput for consistency.
 */

export interface FloatingLabelTextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
}

const FloatingLabelTextarea = React.forwardRef<
    HTMLTextAreaElement,
    FloatingLabelTextareaProps
>(({ className, label, id, error, ...props }, ref) => {
    const textareaId = id || React.useId();

    return (
        <div className="relative w-full">
            <textarea
                id={textareaId}
                ref={ref}
                placeholder=" "
                aria-invalid={!!error}
                className={cn(
                    'peer block w-full min-h-[80px] appearance-none rounded-md border-2 border-foreground/40 bg-transparent px-2.5 pb-1.5 pt-3 text-xs',
                    'transition-colors duration-200 resize-y',
                    'focus:outline-none focus:ring-0',
                    'focus:border-primary focus:ring-2 focus:ring-primary/20',
                    error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
                    className
                )}
                {...props}
            />
            <label
                htmlFor={textareaId}
                className={cn(
                    'absolute left-2.5 top-3 origin-[0] select-none bg-transparent px-0.5',
                    'text-xs text-muted-foreground pointer-events-none',
                    'transition-all duration-200 ease-out',
                    'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:px-1 peer-focus:text-primary peer-focus:bg-background',
                    'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-background',
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

FloatingLabelTextarea.displayName = 'FloatingLabelTextarea';

export { FloatingLabelTextarea };
