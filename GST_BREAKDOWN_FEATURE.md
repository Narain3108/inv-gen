# GST Breakdown by Rate - Feature Implementation

## Overview
Implemented comprehensive GST breakdown functionality that displays CGST/SGST/IGST separately for each GST rate (5%, 12%, 18%, 28%, etc.) used in invoices and quotations.

## Problem Statement
Previously, invoices and quotations showed only **total** CGST/SGST/IGST values, which is incorrect for Indian GST compliance when multiple GST rates are used in a single bill.

### Example of Issue:
**Before (Incorrect):**
```
Item 1: Widget A (18% GST) - ₹1000
Item 2: Widget B (28% GST) - ₹2000

Totals:
- Taxable Amount: ₹3000
- CGST: ₹270 (combined)
- SGST: ₹270 (combined)
- Total: ₹3540
```

**After (Correct):**
```
Item 1: Widget A (18% GST) - ₹1000
Item 2: Widget B (28% GST) - ₹2000

GST Breakdown:
┌──────────┬─────────────────┬──────────┬──────────┬───────────┐
│ GST Rate │ Taxable Amount  │   CGST   │   SGST   │ Total Tax │
├──────────┼─────────────────┼──────────┼──────────┼───────────┤
│   18%    │    ₹1,000.00    │  ₹90.00  │  ₹90.00  │  ₹180.00  │
│          │                 │   (9%)   │   (9%)   │           │
├──────────┼─────────────────┼──────────┼──────────┼───────────┤
│   28%    │    ₹2,000.00    │ ₹280.00  │ ₹280.00  │  ₹560.00  │
│          │                 │  (14%)   │  (14%)   │           │
└──────────┴─────────────────┴──────────┴──────────┴───────────┘

Grand Total: ₹3,740.00
```

## Implementation Details

### 1. Type System Updates

#### `src/types/index.ts`
- **Enhanced `TaxBreakdown` interface:**
  ```typescript
  export interface TaxBreakdown {
    rate: number;           // GST rate (5, 12, 18, 28, etc.)
    taxableAmount: number;  // Taxable amount for this rate
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    totalTax: number;
  }
  ```

- **Added `taxBreakdown` field to Invoice and Quotation:**
  ```typescript
  export interface Invoice {
    // ... existing fields
    taxBreakdown?: TaxBreakdown[]; // GST breakdown by rate
  }

  export interface Quotation {
    // ... existing fields
    taxBreakdown?: TaxBreakdown[]; // GST breakdown by rate
  }
  ```

#### `src/types/customization.ts`
- **Added `showGSTBreakdown` to TotalsFormat:**
  ```typescript
  export interface TotalsFormat {
    // ... existing fields
    showGSTBreakdown: boolean; // Show CGST/SGST/IGST breakdown by GST rate
  }
  ```

### 2. Tax Calculation Updates

#### `src/lib/utils/tax-calculator.ts`
The existing `calculateTaxBreakdown()` function was already implemented but **not being used**. This function:
- Groups items by GST rate
- Calculates CGST/SGST/IGST for each rate separately
- Returns array of `TaxBreakdown` objects

### 3. Form Updates

#### `src/components/invoices/InvoiceForm.tsx`
```typescript
// Import the breakdown calculator
import { calculateInvoiceTotals, calculateTaxBreakdown } from '@/lib/utils/tax-calculator';

// In calculateTotals() function:
const taxBreakdown = calculateTaxBreakdown(
  validItems.map(item => ({
    amount: Number(item.unitPrice) || 0,
    quantity: Number(item.quantity) || 0,
    gstRate: products.find(p => p.id === item.productId)?.gstRate || 0,
    discount: Number(item.discount) || 0,
  })),
  companyState,
  selectedClient.address.state
);

return {
  // ... existing fields
  taxBreakdown, // Add GST breakdown by rate
};
```

#### `src/components/quotations/QuotationForm.tsx`
Same implementation as InvoiceForm - calculates and includes `taxBreakdown` in quotation data.

### 4. PDF Generation Updates

#### New File: `src/lib/utils/pdf/gst-breakdown-builder.ts`
**Purpose:** Modular component for building GST breakdown table in PDFs

**Key Functions:**

1. **`buildGSTBreakdownTable()`**
   - Creates detailed table showing GST breakdown by rate
   - Adapts columns based on inter-state vs intra-state
   - Respects customization settings (showCGST, showSGST, showIGST)
   - Shows rate percentages alongside amounts

2. **`buildSummaryTotals()`**
   - Shows grand total when detailed breakdown is displayed
   - Simplifies totals section when breakdown is enabled

**Features:**
- ✅ Automatic detection of inter-state (IGST) vs intra-state (CGST+SGST)
- ✅ Percentage labels for tax components
- ✅ Professional table formatting
- ✅ Respects customization settings
- ✅ Maintains modular architecture

#### Updated: `src/lib/utils/pdf/totals-builder.ts`
```typescript
import { buildGSTBreakdownTable, buildSummaryTotals } from './gst-breakdown-builder';

export const buildTotalsSection = (data, customization) => {
  const showGSTBreakdown = customization?.totals?.showGSTBreakdown !== false;

  // If GST breakdown is enabled and available
  if (showGSTBreakdown && data.taxBreakdown && data.taxBreakdown.length > 0) {
    return [
      ...buildGSTBreakdownTable(data, customization),  // Detailed breakdown
      ...buildSummaryTotals(data, customization),      // Grand total
      // Amount in words...
    ];
  }

  // Otherwise, show simple totals (legacy format)
  return [/* ... simple totals ... */];
};
```

### 5. Customization UI Updates

#### `src/components/invoices/CustomizationDialog.tsx`
Added new option in **Totals** tab:
```typescript
{
  showGSTBreakdown: 'Show GST Breakdown by Rate',
  // ... other options
}
```

**Location:** Settings → Customize → Totals Tab

## Usage Guide

### For Users

1. **Enable GST Breakdown:**
   - Go to Invoice/Quotation page
   - Click "Customize" button
   - Navigate to "Totals" tab
   - Enable "Show GST Breakdown by Rate"
   - Save settings

2. **Create Invoice/Quotation:**
   - Add items with different GST rates (e.g., 18%, 28%)
   - System automatically calculates breakdown
   - Preview/Download PDF to see detailed GST table

3. **PDF Output:**
   - Shows separate rows for each GST rate used
   - Displays taxable amount per rate
   - Shows CGST/SGST (intra-state) or IGST (inter-state) with percentages
   - Clear total tax per rate
   - Grand total at bottom

### For Developers

**Data Flow:**
```
Form Component (InvoiceForm/QuotationForm)
    ↓
calculateTaxBreakdown() [tax-calculator.ts]
    ↓
Invoice/Quotation object with taxBreakdown[]
    ↓
Firestore Database
    ↓
PDF Generator (invoice-generator.ts / quotation-generator.ts)
    ↓
buildTotalsSection() [totals-builder.ts]
    ↓
buildGSTBreakdownTable() [gst-breakdown-builder.ts]
    ↓
PDF with detailed GST breakdown
```

## GST Compliance

### Intra-State Transaction (Same State)
**Example:** Company in Maharashtra, Client in Maharashtra
- Shows CGST (Central GST) = Rate/2
- Shows SGST (State GST) = Rate/2
- Total GST = CGST + SGST

**For 18% GST:**
- CGST: 9%
- SGST: 9%

### Inter-State Transaction (Different States)
**Example:** Company in Maharashtra, Client in Karnataka
- Shows IGST (Integrated GST) = Full Rate
- No CGST/SGST

**For 18% GST:**
- IGST: 18%

## Testing Scenarios

1. **Single GST Rate:**
   - All items at 18% → Shows one row in breakdown

2. **Multiple GST Rates:**
   - Items at 5%, 12%, 18%, 28% → Shows four rows

3. **Inter-State:**
   - Different state codes → Shows IGST column

4. **Intra-State:**
   - Same state codes → Shows CGST + SGST columns

5. **Customization Off:**
   - Disable "Show GST Breakdown" → Falls back to simple totals

6. **Legacy Data:**
   - Invoices without taxBreakdown → Shows simple totals

## Benefits

✅ **GST Compliance:** Meets Indian GST requirements for multi-rate invoices
✅ **Clarity:** Clear breakdown helps clients understand tax calculation
✅ **Professional:** Industry-standard invoice format
✅ **Flexible:** Can be enabled/disabled via customization
✅ **Backward Compatible:** Works with existing invoices (shows simple totals)
✅ **Modular:** Clean separation of concerns in codebase
✅ **Maintainable:** Easy to extend or modify

## Technical Architecture

### Modular Structure
```
src/lib/utils/pdf/
  ├── gst-breakdown-builder.ts    (NEW - 160 lines)
  ├── totals-builder.ts           (UPDATED - enhanced logic)
  ├── invoice-generator.ts        (No changes needed)
  ├── quotation-generator.ts      (No changes needed)
  └── ...other builders
```

### Code Principles
- ✅ **Single Responsibility:** Each builder does one thing
- ✅ **Open/Closed:** Extended functionality without modifying generators
- ✅ **DRY:** Shared logic in tax-calculator.ts
- ✅ **Type Safety:** Full TypeScript support
- ✅ **Clean Code:** Under 200 lines per file

## Migration Notes

### Existing Invoices/Quotations
- Will continue to work (backward compatible)
- Show simple totals (no breakdown) until regenerated
- No database migration needed

### New Invoices/Quotations
- Automatically include `taxBreakdown` field
- Show detailed breakdown if enabled in customization
- Work seamlessly with all existing features

## Future Enhancements

Potential improvements:
1. **Cess Support:** Add cess breakdown (currently 0)
2. **Export Options:** Excel/CSV export of GST breakdown
3. **Summary Report:** Monthly GST summary across all invoices
4. **Print Optimization:** Responsive breakdown table for thermal printers

## Files Modified

### Type Definitions
- ✅ `src/types/index.ts` - Added `rate` and `taxableAmount` to TaxBreakdown, added `taxBreakdown` to Invoice and Quotation
- ✅ `src/types/customization.ts` - Added `showGSTBreakdown` option

### Components
- ✅ `src/components/invoices/InvoiceForm.tsx` - Calculate and include taxBreakdown
- ✅ `src/components/quotations/QuotationForm.tsx` - Calculate and include taxBreakdown
- ✅ `src/components/invoices/CustomizationDialog.tsx` - Added UI option for GST breakdown

### PDF Generation
- ✅ `src/lib/utils/pdf/gst-breakdown-builder.ts` - NEW FILE (160 lines)
- ✅ `src/lib/utils/pdf/totals-builder.ts` - Enhanced to use GST breakdown

### Tax Calculator
- ✅ `src/lib/utils/tax-calculator.ts` - No changes (already had calculateTaxBreakdown function)

## Summary

This implementation provides **complete GST compliance** for Indian invoicing with:
- Proper breakdown by tax rate
- Clear CGST/SGST/IGST separation
- Professional PDF output
- Flexible customization
- Clean, modular code
- Full backward compatibility

The feature is production-ready and follows all established patterns in the codebase.
