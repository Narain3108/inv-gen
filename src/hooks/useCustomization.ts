/**
 * useCustomization Hook
 * Manages customization state and operations for invoice/quotation templates
 * Following Single Responsibility Principle
 */

import { useState, useEffect, useCallback } from 'react';
import { InvoiceCustomization, DEFAULT_INVOICE_CUSTOMIZATION, DEFAULT_QUOTATION_CUSTOMIZATION } from '@/types/customization';
import { customizationsApi } from '@/lib/api/customizations.api';
import { toast } from 'sonner';

interface UseCustomizationConfig {
    companyId: string;
    type: 'invoice' | 'quotation';
    open: boolean;
    onSave?: () => void;
    onClose: () => void;
}

interface UseCustomizationReturn {
    customization: InvoiceCustomization;
    loading: boolean;
    saving: boolean;
    updateCustomization: (path: string, value: any) => void;
    handleColumnToggle: (columnId: string, enabled: boolean) => void;
    handleColumnReorder: (result: any) => void;
    handleSave: () => Promise<void>;
    handleReset: () => void;
}

export function useCustomization({
    companyId,
    type,
    open,
    onSave,
    onClose,
}: UseCustomizationConfig): UseCustomizationReturn {
    const defaults = type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION;

    const [customization, setCustomization] = useState<InvoiceCustomization>({
        ...defaults,
        companyId,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Load customization when dialog opens
    useEffect(() => {
        if (open && companyId) {
            loadCustomization();
        }
    }, [open, companyId, type]);

    const loadCustomization = async () => {
        setLoading(true);
        try {
            const data = await customizationsApi.getByCompanyId(companyId, type);

            if (data && data.id !== 'default') {
                setCustomization({
                    ...defaults,
                    ...data,
                    header: { ...defaults.header, ...(data.header || {}) },
                    companyDetails: { ...defaults.companyDetails, ...(data.companyDetails || {}) },
                    addresses: { ...defaults.addresses, ...(data.addresses || {}) },
                    table: { ...defaults.table, ...(data.table || {}) },
                    totals: { ...defaults.totals, ...(data.totals || {}) },
                    footer: { ...defaults.footer, ...(data.footer || {}) },
                    colorScheme: { ...defaults.colorScheme, ...(data.colorScheme || {}) },
                    margins: { ...defaults.margins, ...(data.margins || {}) },
                    companyId,
                    type,
                } as InvoiceCustomization);
            } else {
                setCustomization({ ...defaults, companyId, type });
            }
        } catch (error) {
            console.error('Error loading customization:', error);
            toast.error('Failed to load customization settings');
        } finally {
            setLoading(false);
        }
    };

    const updateCustomization = useCallback((path: string, value: any) => {
        setCustomization(prev => {
            const keys = path.split('.');
            const newCustomization = { ...prev };
            let current: any = newCustomization;

            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newCustomization;
        });
    }, []);

    const handleColumnToggle = useCallback((columnId: string, enabled: boolean) => {
        setCustomization(prev => ({
            ...prev,
            table: {
                ...prev.table,
                columns: prev.table.columns.map(col =>
                    col.id === columnId ? { ...col, enabled } : col
                ),
            },
        }));
    }, []);

    const handleColumnReorder = useCallback((result: any) => {
        if (!result.destination) return;

        setCustomization(prev => {
            const items = Array.from(prev.table.columns);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination.index, 0, reorderedItem);
            const reorderedColumns = items.map((col, index) => ({ ...col, order: index }));

            return {
                ...prev,
                table: { ...prev.table, columns: reorderedColumns },
            };
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await customizationsApi.createOrUpdate(companyId, {
                ...customization,
                companyId,
                type,
            });

            toast.success(`${type === 'invoice' ? 'Invoice' : 'Quotation'} customization saved successfully`);
            onSave?.();
            onClose();
        } catch (error) {
            console.error('Error saving customization:', error);
            toast.error('Failed to save customization');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = useCallback(() => {
        setCustomization({ ...defaults, companyId });
        toast.success('Reset to default settings');
    }, [defaults, companyId]);

    return {
        customization,
        loading,
        saving,
        updateCustomization,
        handleColumnToggle,
        handleColumnReorder,
        handleSave,
        handleReset,
    };
}

export default useCustomization;
