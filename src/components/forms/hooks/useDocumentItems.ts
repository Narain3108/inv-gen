/**
 * useDocumentItems Hook
 * Manages item field array operations for document forms
 */

import { useCallback } from 'react';
import { useFieldArray, UseFormSetValue, UseFormClearErrors, UseFormSetError, Control } from 'react-hook-form';
import { Product } from '@/types';
import { toast } from 'sonner';

interface DocumentItem {
    productId?: string;
    quantity?: number;
    unitPrice?: number;
    discount?: number;
    unit?: string;
}

interface UseDocumentItemsProps {
    control: Control<any>;
    setValue: UseFormSetValue<any>;
    clearErrors: UseFormClearErrors<any>;
    setError: UseFormSetError<any>;
    products: Product[];
    watchItems: DocumentItem[];
    originalItems?: Record<string, { productId: string; quantity: number }>;
    isEditing?: boolean;
    onProductSelect?: (index: number, productId: string) => void;
    onOutOfStock?: (data: { product: Product; requestedQuantity: number; availableStock: number; itemIndex: number }) => void;
    onOpenSerialManager?: (index: number) => void;
}

interface UseDocumentItemsReturn {
    fields: any[];
    append: (value: DocumentItem) => void;
    remove: (index: number) => void;
    handleProductSelect: (index: number, productId: string) => void;
    handleQuantityChange: (index: number, quantity: number, fieldId?: string) => void;
    addNewItem: () => void;
    removeItem: (index: number) => void;
}

export function useDocumentItems({
    control,
    setValue,
    clearErrors,
    setError,
    products,
    watchItems,
    originalItems = {},
    isEditing = false,
    onProductSelect,
    onOutOfStock,
    onOpenSerialManager,
}: UseDocumentItemsProps): UseDocumentItemsReturn {
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const handleProductSelect = useCallback(
        (index: number, productId: string) => {
            const product = products.find((p) => p.id === productId);
            if (product) {
                setValue(`items.${index}.productId`, productId);
                setValue(`items.${index}.unitPrice`, product.price);
                setValue(`items.${index}.unit`, product.unit);
                onProductSelect?.(index, productId);
            }
        },
        [products, setValue, onProductSelect]
    );

    const handleQuantityChange = useCallback(
        (index: number, quantity: number, fieldId?: string) => {
            const item = watchItems?.[index];
            const product = item?.productId ? products.find((p) => p.id === item.productId) : null;

            if (!product || quantity <= 0 || isNaN(quantity)) {
                return;
            }

            // Stock validation for products (not services)
            if (product.type === 'product') {
                if (isEditing) {
                    // Delta-based validation for editing
                    const origItem = fieldId ? originalItems[fieldId] : null;
                    const q_old = origItem && origItem.productId === product.id ? origItem.quantity : 0;
                    const s_db = product.stock !== undefined ? product.stock : 0;
                    const available_for_edit = s_db + q_old;

                    if (quantity > available_for_edit) {
                        setError(`items.${index}.quantity` as any, {
                            type: 'manual',
                            message: `Insufficient stock. Max: ${available_for_edit}`,
                        });
                        toast.error(`Insufficient stock for ${product.productName}. Max available: ${available_for_edit}`);
                        return;
                    } else {
                        clearErrors(`items.${index}.quantity` as any);
                    }
                } else {
                    // Create mode - check absolute stock
                    if (product.stock !== undefined && quantity > product.stock) {
                        onOutOfStock?.({
                            product,
                            requestedQuantity: quantity,
                            availableStock: product.stock,
                            itemIndex: index,
                        });
                        return;
                    }
                }
            }

            // Update quantity
            setValue(`items.${index}.quantity`, quantity);

            // Open serial manager if product has serial numbers and quantity increased
            if (product.hasSerialNumber && onOpenSerialManager) {
                onOpenSerialManager(index);
            }
        },
        [products, watchItems, isEditing, originalItems, setValue, setError, clearErrors, onOutOfStock, onOpenSerialManager]
    );

    const addNewItem = useCallback(() => {
        append({ productId: '', quantity: 1, unitPrice: 0, discount: 0 });
    }, [append]);

    const removeItem = useCallback(
        (index: number) => {
            if (fields.length > 1) {
                remove(index);
            } else {
                toast.warning('At least one item is required');
            }
        },
        [fields.length, remove]
    );

    return {
        fields,
        append,
        remove,
        handleProductSelect,
        handleQuantityChange,
        addNewItem,
        removeItem,
    };
}

export default useDocumentItems;
