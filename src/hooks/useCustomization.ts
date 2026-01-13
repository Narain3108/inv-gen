/**
 * useCustomization Hook
 * Manages customization state and operations for invoice/quotation templates
 * Following Single Responsibility Principle
 */

import { useState, useEffect, useCallback } from 'react';
import { InvoiceCustomization, DEFAULT_INVOICE_CUSTOMIZATION, DEFAULT_QUOTATION_CUSTOMIZATION } from '@/types/customization';
import { customizationsApi } from '@/lib/api/customizations.api';
import { toast } from 'sonner';

import { Company } from '@/types';

interface UseCustomizationConfig {
    companyId: string;
    company?: Company;
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
    company,
    type,
    open,
    onSave,
    onClose,
}: UseCustomizationConfig): UseCustomizationReturn {
    const baseDefaults = type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION;

    // Merge company-specific text into defaults
    const defaults = {
        ...baseDefaults,
        footer: {
            ...baseDefaults.footer,
            termsText: company?.termsAndConditions || baseDefaults.footer.termsText,
        }
    };

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
    }, [open, companyId, type, company]); // Reload if company data changes

    const loadCustomization = async () => {
        setLoading(true);
        try {
            const data = await customizationsApi.getByCompanyId(companyId, type);

            if (data && data.id !== 'default') {
                // Sanitize legacy defaults: If the loaded text matches the old hardcoded string, use company data instead
                const legacyTermMatch = data.footer?.termsText?.includes('Due within 30 days') || data.footer?.termsText?.includes('1.5% monthly interest');
                const termsText = legacyTermMatch && company?.termsAndConditions
                    ? company.termsAndConditions
                    : (data.footer?.termsText !== undefined ? data.footer?.termsText : defaults.footer.termsText);

                setCustomization({
                    ...defaults,
                    ...data,
                    header: { ...defaults.header, ...(data.header || {}) },
                    companyDetails: { ...defaults.companyDetails, ...(data.companyDetails || {}) },
                    addresses: { ...defaults.addresses, ...(data.addresses || {}) },
                    table: { ...defaults.table, ...(data.table || {}) },
                    totals: { ...defaults.totals, ...(data.totals || {}) },
                    footer: {
                        ...defaults.footer,
                        ...(data.footer || {}),
                        termsText // Use sanitized terms
                    },
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
