import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    imageSrc?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    action,
    className,
    imageSrc
}: EmptyStateProps) {
    return (
        <Card className={cn("flex flex-col items-center justify-center p-8 sm:p-12 text-center h-full min-h-[400px] border-dashed", className)}>
            <div className="bg-muted/50 p-4 rounded-full mb-4 ring-8 ring-muted/20">
                {Icon ? (
                    <Icon className="h-8 w-8 text-muted-foreground" />
                ) : (
                    <div className="h-8 w-8" />
                )}
            </div>

            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mb-6">
                {description}
            </p>

            {action && (
                <Button onClick={action.onClick} className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    {action.label}
                </Button>
            )}
        </Card>
    );
}
