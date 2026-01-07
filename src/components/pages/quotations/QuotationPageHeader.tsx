/**
 * QuotationPageHeader Component
 * Header section with title, description, and action buttons
 * Following Single Responsibility Principle
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/shared';
import { Plus, Settings } from 'lucide-react';

interface QuotationPageHeaderProps {
    onAddQuotation: () => void;
    onOpenCustomization: () => void;
    onExportExcel: () => Promise<boolean>;
    onExportCSV: () => Promise<boolean>;
}

export function QuotationPageHeader({
    onAddQuotation,
    onOpenCustomization,
    onExportExcel,
    onExportCSV,
}: QuotationPageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Quotations
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                    Create and manage price estimates for clients
                </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <ExportButton
                    onExportExcel={onExportExcel}
                    onExportCSV={onExportCSV}
                    className="flex-1 sm:flex-none"
                />
                <Button
                    variant="outline"
                    onClick={onOpenCustomization}
                    className="flex-1 sm:flex-none"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Customize Bill</span>
                </Button>
                <Button
                    onClick={onAddQuotation}
                    className="bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all flex-1 sm:flex-none"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">New Quotation</span>
                </Button>
            </div>
        </div>
    );
}

export default QuotationPageHeader;
