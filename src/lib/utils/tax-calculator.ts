/**
 * Tax Calculator Utility
 * 
 * Handles GST tax calculations for Indian invoices
 * - CGST + SGST for intra-state transactions (same state)
 * - IGST for inter-state transactions (different states)
 */

import { TaxBreakdown } from '@/types';

export interface TaxCalculationInput {
  amount: number;
  gstRate: number;
  quantity?: number;
  discount?: number;
  companyStateCode: string;
  clientStateCode: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  isInterState: boolean;
}

/**
 * Calculate GST tax breakdown for a single item or invoice
 */
export function calculateTax(input: TaxCalculationInput): TaxCalculationResult {
  const {
    amount,
    gstRate,
    quantity = 0,
    discount = 0,
    companyStateCode,
    clientStateCode,
  } = input;

  // Calculate subtotal
  const subtotal = amount * quantity;

  // Calculate taxable amount after discount
  const taxableAmount = subtotal - discount;

  // Determine if it's inter-state (different states) or intra-state (same state)
  const isInterState = companyStateCode !== clientStateCode;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    // Inter-state: Apply IGST (full GST rate)
    igst = (taxableAmount * gstRate) / 100;
  } else {
    // Intra-state: Split into CGST and SGST (half each)
    const halfRate = gstRate / 2;
    cgst = (taxableAmount * halfRate) / 100;
    sgst = (taxableAmount * halfRate) / 100;
  }

  const totalTax = cgst + sgst + igst;
  const grandTotal = taxableAmount + totalTax;

  return {
    subtotal,
    discount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal,
    isInterState,
  };
}

/**
 * Calculate tax breakdown by GST rate for invoice summary
 */
export function calculateTaxBreakdown(
  items: Array<{
    amount: number;
    quantity: number;
    gstRate: number;
    discount?: number;
  }>,
  companyStateCode: string,
  clientStateCode: string
): Array<TaxBreakdown & { rate: number; taxableAmount: number }> {
  // Group items by GST rate
  const groupedByRate = items.reduce((acc, item) => {
    const rate = item.gstRate;
    if (!acc[rate]) {
      acc[rate] = [];
    }
    acc[rate].push(item);
    return acc;
  }, {} as Record<number, typeof items>);

  // Calculate tax for each rate group
  const breakdown = Object.entries(groupedByRate).map(
    ([rate, rateItems]) => {
      const gstRate = Number(rate);
      
      // Sum all items in this rate group
      const totals = rateItems.reduce(
        (sum, item) => {
          const itemCalc = calculateTax({
            amount: item.amount,
            quantity: item.quantity,
            gstRate: item.gstRate,
            discount: item.discount || 0,
            companyStateCode,
            clientStateCode,
          });

          return {
            taxable: sum.taxable + itemCalc.taxableAmount,
            cgst: sum.cgst + itemCalc.cgst,
            sgst: sum.sgst + itemCalc.sgst,
            igst: sum.igst + itemCalc.igst,
          };
        },
        { taxable: 0, cgst: 0, sgst: 0, igst: 0 }
      );

      return {
        rate: gstRate,
        taxableAmount: totals.taxable,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        cess: 0, // Cess support can be added later if needed
        totalTax: totals.cgst + totals.sgst + totals.igst,
      };
    }
  );

  return breakdown.sort((a, b) => a.rate - b.rate);
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  items: Array<{
    amount: number;
    quantity: number;
    gstRate: number;
    discount?: number;
  }>,
  companyStateCode: string,
  clientStateCode: string,
  additionalDiscount: number = 0,
  shippingCharges: number = 0
) {
  // Calculate all items
  const itemsTotal = items.reduce(
    (sum, item) => {
      const itemCalc = calculateTax({
        amount: item.amount,
        quantity: item.quantity,
        gstRate: item.gstRate,
        discount: item.discount || 0,
        companyStateCode,
        clientStateCode,
      });

      return {
        subtotal: sum.subtotal + itemCalc.subtotal,
        itemDiscount: sum.itemDiscount + itemCalc.discount,
        taxableAmount: sum.taxableAmount + itemCalc.taxableAmount,
        cgst: sum.cgst + itemCalc.cgst,
        sgst: sum.sgst + itemCalc.sgst,
        igst: sum.igst + itemCalc.igst,
        totalTax: sum.totalTax + itemCalc.totalTax,
      };
    },
    {
      subtotal: 0,
      itemDiscount: 0,
      taxableAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalTax: 0,
    }
  );

  // Apply additional invoice-level discount
  const finalTaxableAmount = itemsTotal.taxableAmount - additionalDiscount;

  // Recalculate tax if there's an additional discount
  let finalCgst = itemsTotal.cgst;
  let finalSgst = itemsTotal.sgst;
  let finalIgst = itemsTotal.igst;

  if (additionalDiscount > 0) {
    const discountRatio = finalTaxableAmount / itemsTotal.taxableAmount;
    finalCgst = itemsTotal.cgst * discountRatio;
    finalSgst = itemsTotal.sgst * discountRatio;
    finalIgst = itemsTotal.igst * discountRatio;
  }

  const finalTotalTax = finalCgst + finalSgst + finalIgst;
  const grandTotal = finalTaxableAmount + finalTotalTax + shippingCharges;

  const isInterState = companyStateCode !== clientStateCode;

  return {
    subtotal: itemsTotal.subtotal,
    itemDiscount: itemsTotal.itemDiscount,
    additionalDiscount,
    totalDiscount: itemsTotal.itemDiscount + additionalDiscount,
    taxableAmount: finalTaxableAmount,
    cgst: finalCgst,
    sgst: finalSgst,
    igst: finalIgst,
    totalTax: finalTotalTax,
    shippingCharges,
    grandTotal,
    isInterState,
  };
}

/**
 * Round to 2 decimal places (for currency)
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate reverse GST (extract tax from total amount)
 * Useful when you have final price and need to break down the tax
 */
export function reverseGST(totalAmount: number, gstRate: number, isInterState: boolean) {
  const divisor = 1 + gstRate / 100;
  const baseAmount = totalAmount / divisor;
  const taxAmount = totalAmount - baseAmount;

  if (isInterState) {
    return {
      baseAmount,
      cgst: 0,
      sgst: 0,
      igst: taxAmount,
      totalTax: taxAmount,
    };
  } else {
    const halfTax = taxAmount / 2;
    return {
      baseAmount,
      cgst: halfTax,
      sgst: halfTax,
      igst: 0,
      totalTax: taxAmount,
    };
  }
}
