/**
 * Copy Type Dialog Component
 * Allows user to select Original or Duplicate copy before downloading invoice
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Copy } from 'lucide-react';

interface CopyTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCopyType: (copyType: 'original' | 'duplicate') => void;
}

export function CopyTypeDialog({
  open,
  onOpenChange,
  onSelectCopyType,
}: CopyTypeDialogProps) {
  const handleSelect = (copyType: 'original' | 'duplicate') => {
    onSelectCopyType(copyType);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Copy Type</DialogTitle>
          <DialogDescription>
            Choose whether to download original or duplicate copy of the invoice.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {/* Original Copy Button */}
          <Button
            variant="outline"
            className="h-auto flex-col gap-3 p-6 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => handleSelect('original')}
          >
            <FileText className="h-12 w-12 text-primary" />
            <div className="text-center">
              <div className="font-semibold text-base">Original</div>
              <div className="text-xs text-muted-foreground mt-1">
                Standard copy
              </div>
            </div>
          </Button>

          {/* Duplicate Copy Button */}
          <Button
            variant="outline"
            className="h-auto flex-col gap-3 p-6 hover:bg-secondary/5 hover:border-secondary transition-all"
            onClick={() => handleSelect('duplicate')}
          >
            <Copy className="h-12 w-12 text-secondary" />
            <div className="text-center">
              <div className="font-semibold text-base">Duplicate</div>
              <div className="text-xs text-muted-foreground mt-1">
                Marked as duplicate
              </div>
            </div>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Duplicate copies will be marked in the top right corner
        </div>
      </DialogContent>
    </Dialog>
  );
}
