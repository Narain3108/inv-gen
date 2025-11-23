/**
 * Confirm Dialog Component
 */

'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg dark:bg-background dark:border-primary/30">
        <AlertDialogHeader className="space-y-3 sm:space-y-4">
          <AlertDialogTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          <AlertDialogCancel className="w-full sm:w-auto min-h-[44px] dark:border-primary/30 dark:hover:border-primary/50 dark:hover:bg-muted/50">
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={`w-full sm:w-auto min-h-[44px] font-semibold ${
              variant === 'destructive' 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 dark:bg-red-600 dark:hover:bg-red-700' 
                : 'dark:bg-primary dark:hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
