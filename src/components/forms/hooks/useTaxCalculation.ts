/**
 * useTaxCalculation Hook
 * Centralized GST/tax calculation logic for all document forms
 */

import { useMemo } from 'react';
import { Product, Client, InvoiceItem } from '@/types';
import { calculateTaxBreakdown } from '@/lib/utils/tax-calculator';

export interface TaxCalculationItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    unit?: string;
    serialNumbers?: string[];
}

export interface TaxTotals {
    items: InvoiceItem[];
    subtotal: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
    totalAmount: number;
    totalAmountInWords: string;
    taxBreakdown: ReturnType<typeof calculateTaxBreakdown>;
    isInterState: boolean;
}

interface UseTaxCalculationProps {
    items: TaxCalculationItem[];
    products: Product[];
    selectedClient: Client | null;
    companyState: string;
    serialNumbers?: Record<string, string[]>;
    fieldIds?: string[];
}

/**
 * Calculate tax totals for a list of items
 */
export function useTaxCalculation({
    items,
    products,
    selectedClient,
    companyState,
    serialNumbers = {},
    fieldIds = [],
}: UseTaxCalculationProps): TaxTotals | null {
    return useMemo(() => {
        if (!items || items.length === 0 || !selectedClient) return null;

        // Filter valid items
        const validItems = items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.productId && item.quantity > 0 && item.unitPrice >= 0);

        if (validItems.length === 0) return null;

        let subtotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;
        let totalCess = 0;
        let totalTaxableAmount = 0;

        const isInterState = companyState !== selectedClient.address?.state;

        const processedItems: InvoiceItem[] = validItems
            .map(({ item, index }) => {
                const product = products.find((p) => p.id === item.productId);
                if (!product) return null;

                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const discount = Number(item.discount) || 0;

                const baseAmount = quantity * unitPrice;
                const discountAmount = (baseAmount * discount) / 100;
                const taxableAmount = baseAmount - discountAmount;

                let cgst = 0;
                let sgst = 0;
                let igst = 0;
                let cess = 0;

                if (isInterState) {
                    igst = (taxableAmount * product.gstRate) / 100;
                } else {
                    const halfRate = product.gstRate / 2;
                    cgst = (taxableAmount * halfRate) / 100;
                    sgst = (taxableAmount * halfRate) / 100;
                }

                if (product.cessRate) {
                    cess = (taxableAmount * product.cessRate) / 100;
                }

                const lineTotal = taxableAmount + cgst + sgst + igst + cess;

                subtotal += baseAmount;
                totalTaxableAmount += taxableAmount;
                totalCgst += cgst;
                totalSgst += sgst;
                totalIgst += igst;
                totalCess += cess;

                const invoiceItem: any = {
                    productId: product.id,
                    description: product.productName,
                    productDescription: product.description || '',
                    hsn: product.hsn,
                    quantity,
                    unit: item.unit || product.unit,
                    unitPrice,
                    discount,
                    gstRate: product.gstRate,
                    cessRate: product.cessRate || 0,
                    taxableAmount,
                    cgst,
                    sgst,
                    igst,
                    cess,
                    lineTotal,
                };

                if (product.itemCode) {
                    invoiceItem.itemCode = product.itemCode;
                }

                // Include serial numbers if product requires them
                if (product.hasSerialNumber === true) {
                    const fieldId = fieldIds[index];
                    if (fieldId && serialNumbers[fieldId]) {
                        invoiceItem.serialNumbers = serialNumbers[fieldId];
                    }
                }

                return invoiceItem;
            })
            .filter(Boolean) as InvoiceItem[];

        const totalTax = totalCgst + totalSgst + totalIgst + totalCess;
        const grandTotal = totalTaxableAmount + totalTax;

        // Calculate tax breakdown by GST rate
        const taxBreakdown = calculateTaxBreakdown(
            validItems.map(({ item }) => ({
                amount: Number(item.unitPrice) || 0,
                quantity: Number(item.quantity) || 0,
                gstRate: products.find((p) => p.id === item.productId)?.gstRate || 0,
                discount: Number(item.discount) || 0,
            })),
            companyState,
            selectedClient.address?.state || ''
        );

        return {
            items: processedItems,
            subtotal,
            taxableAmount: totalTaxableAmount,
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalIgst,
            cess: totalCess,
            totalTax,
            totalAmount: grandTotal,
            totalAmountInWords: '',
            taxBreakdown,
            isInterState,
        };
    }, [items, products, selectedClient, companyState, serialNumbers, fieldIds]);
}

export default useTaxCalculation;
