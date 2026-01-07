/**
 * useSerialNumbers Hook
 * Manages serial number state for document items
 */

import { useState, useCallback } from 'react';

interface UseSerialNumbersReturn {
    serialNumbers: Record<string, string[]>;
    serialNumberErrors: Record<string, string>;
    setSerialNumbers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    setSerialNumberErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    updateSerialNumbers: (fieldId: string, serials: string[]) => void;
    validateSerialNumbers: (
        items: Array<{ productId: string; quantity: number }>,
        products: Array<{ id: string; hasSerialNumber?: boolean; productName?: string }>,
        fieldIds: string[]
    ) => { valid: boolean; errors: Record<string, string> };
    clearSerialNumberError: (fieldId: string) => void;
    resetSerialNumbers: () => void;
}

export function useSerialNumbers(
    initialSerialNumbers: Record<string, string[]> = {}
): UseSerialNumbersReturn {
    const [serialNumbers, setSerialNumbers] = useState<Record<string, string[]>>(initialSerialNumbers);
    const [serialNumberErrors, setSerialNumberErrors] = useState<Record<string, string>>({});

    const updateSerialNumbers = useCallback((fieldId: string, serials: string[]) => {
        setSerialNumbers((prev) => ({
            ...prev,
            [fieldId]: serials,
        }));
        // Clear error when serials are updated
        setSerialNumberErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldId];
            return newErrors;
        });
    }, []);

    const clearSerialNumberError = useCallback((fieldId: string) => {
        setSerialNumberErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldId];
            return newErrors;
        });
    }, []);

    const validateSerialNumbers = useCallback(
        (
            items: Array<{ productId: string; quantity: number }>,
            products: Array<{ id: string; hasSerialNumber?: boolean; productName?: string }>,
            fieldIds: string[]
        ): { valid: boolean; errors: Record<string, string> } => {
            const newErrors: Record<string, string> = {};
            let valid = true;

            items.forEach((item, index) => {
                const product = products.find((p) => p.id === item.productId);
                if (product?.hasSerialNumber === true) {
                    const fieldId = fieldIds[index];
                    const itemSerials = fieldId ? serialNumbers[fieldId] || [] : [];
                    const quantity = Number(item.quantity) || 0;

                    if (itemSerials.length !== quantity) {
                        newErrors[fieldId] = `Please enter ${quantity} serial number(s) for ${product.productName || 'product'}`;
                        valid = false;
                    } else if (itemSerials.some((sn) => !sn || sn.trim() === '')) {
                        newErrors[fieldId] = 'Serial numbers cannot be empty';
                        valid = false;
                    }
                }
            });

            setSerialNumberErrors(newErrors);
            return { valid, errors: newErrors };
        },
        [serialNumbers]
    );

    const resetSerialNumbers = useCallback(() => {
        setSerialNumbers({});
        setSerialNumberErrors({});
    }, []);

    return {
        serialNumbers,
        serialNumberErrors,
        setSerialNumbers,
        setSerialNumberErrors,
        updateSerialNumbers,
        validateSerialNumbers,
        clearSerialNumberError,
        resetSerialNumbers,
    };
}

export default useSerialNumbers;
