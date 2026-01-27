'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

/**
 * FloatingLabelSelect
 *
 * A wrapper component that adds a floating label to the existing Shadcn Select.
 * Due to the nature of Radix Select (not using a native input), we handle
 * the "filled" state via a prop or by checking if a value is present.
 *
 * Principles:
 * - OCP: Open for extension by accepting children (SelectContent, SelectItems).
 * - DRY: Centralizes the floating label pattern for selects.
 */

export interface FloatingLabelSelectProps {
    label: string;
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
    children: React.ReactNode;
    id?: string;
}

const FloatingLabelSelect = React.forwardRef<
    HTMLButtonElement,
    FloatingLabelSelectProps
>(
    (
        {
            label,
            value,
            onValueChange,
            placeholder,
            error,
            disabled,
            className,
            triggerClassName,
            children,
            id,
        },
        ref
    ) => {
        const selectId = id || React.useId();
        const hasValue = value !== undefined && value !== '';

        return (
            <div className={cn('relative w-full', className)}>
                <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                    <SelectTrigger
                        ref={ref}
                        id={selectId}
                        aria-invalid={!!error}
                        className={cn(
                            'w-full rounded-md border-2 border-foreground/40 bg-transparent px-2.5 pb-1.5 pt-3 text-xs h-auto min-h-[38px]',
                            'transition-colors duration-200',
                            'focus:outline-none focus:ring-0',
                            'focus:border-primary focus:ring-2 focus:ring-primary/20',
                            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
                            'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
                            // Peer-like data attribute for label styling
                            hasValue && 'data-[has-value=true]',
                            triggerClassName
                        )}
                        data-has-value={hasValue}
                    >
                        <SelectValue placeholder={placeholder || ' '} />
                    </SelectTrigger>
                    {children}
                </Select>
                <label
                    htmlFor={selectId}
                    className={cn(
                        'absolute left-2.5 top-1/2 -translate-y-1/2 origin-[0] select-none bg-transparent px-0.5',
                        'text-xs text-muted-foreground pointer-events-none',
                        'transition-all duration-200 ease-out',
                        // Floating state when has value or focused (using data attribute)
                        hasValue &&
                        'top-0 -translate-y-1/2 scale-[0.85] px-1 bg-background text-primary',
                        error && hasValue && 'text-destructive'
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
    }
);

FloatingLabelSelect.displayName = 'FloatingLabelSelect';

export { FloatingLabelSelect };
