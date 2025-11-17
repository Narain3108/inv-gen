/**
 * Export Button Component
 * Dropdown button for exporting data to Excel or CSV
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonProps {
  onExportExcel: () => Promise<boolean>;
  onExportCSV: () => Promise<boolean>;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function ExportButton({ 
  onExportExcel, 
  onExportCSV,
  label = 'Export',
  variant = 'outline'
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: 'excel' | 'csv') => {
    setExporting(true);
    try {
      const success = type === 'excel' ? await onExportExcel() : await onExportCSV();
      if (success) {
        toast.success(`Exported to ${type.toUpperCase()} successfully`);
      } else {
        toast.error(`Failed to export to ${type.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} disabled={exporting}>
          {exporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Export to Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          Export to CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
