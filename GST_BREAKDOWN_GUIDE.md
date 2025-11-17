# GST Breakdown Feature - Quick Reference

## Visual Example

### Scenario: Invoice with Mixed GST Rates

**Products Added:**
```
1. Laptop (18% GST)      - Qty: 2  - Price: ₹50,000 each
2. Mouse (12% GST)       - Qty: 5  - Price: ₹500 each
3. Luxury Watch (28% GST) - Qty: 1  - Price: ₹20,000
```

### PDF Output (Intra-State Transaction)

```
┌──────────────────────────────────────────────────────────────────┐
│                         TAX INVOICE                               │
│                     ABC Company Pvt Ltd                           │
│                    Invoice No: INV-001                            │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ ITEMS                                                                       │
├────┬─────────────┬─────┬──────┬────────┬──────┬──────┬──────┬─────────────┤
│S.No│ Description │ HSN │ Qty  │  Rate  │ GST% │ Tax  │      │   Amount    │
├────┼─────────────┼─────┼──────┼────────┼──────┼──────┼──────┼─────────────┤
│ 1  │ Laptop      │8471 │  2   │ 50,000 │  18% │18,000│      │  1,18,000   │
│ 2  │ Mouse       │8471 │  5   │    500 │  12% │  300 │      │     2,800   │
│ 3  │ Luxury Watch│9102 │  1   │ 20,000 │  28% │ 5,600│      │    25,600   │
└────┴─────────────┴─────┴──────┴────────┴──────┴──────┴──────┴─────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          GST BREAKDOWN                                    │
├──────────┬─────────────────┬─────────────┬─────────────┬────────────────┤
│ GST Rate │ Taxable Amount  │    CGST     │    SGST     │   Total Tax    │
├──────────┼─────────────────┼─────────────┼─────────────┼────────────────┤
│   12%    │   ₹2,500.00     │  ₹150.00    │  ₹150.00    │    ₹300.00     │
│          │                 │    (6%)     │    (6%)     │                │
├──────────┼─────────────────┼─────────────┼─────────────┼────────────────┤
│   18%    │ ₹1,00,000.00    │ ₹9,000.00   │ ₹9,000.00   │  ₹18,000.00    │
│          │                 │    (9%)     │    (9%)     │                │
├──────────┼─────────────────┼─────────────┼─────────────┼────────────────┤
│   28%    │  ₹20,000.00     │ ₹2,800.00   │ ₹2,800.00   │   ₹5,600.00    │
│          │                 │   (14%)     │   (14%)     │                │
└──────────┴─────────────────┴─────────────┴─────────────┴────────────────┘

Grand Total: ₹1,46,400.00

Amount in Words: One Lakh Forty Six Thousand Four Hundred Rupees Only
```

### PDF Output (Inter-State Transaction)

```
┌──────────────────────────────────────────────────────────────────┐
│                         TAX INVOICE                               │
│                     ABC Company Pvt Ltd                           │
│                    Invoice No: INV-002                            │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│ ITEMS                                                                       │
├────┬─────────────┬─────┬──────┬────────┬──────┬──────┬──────┬─────────────┤
│S.No│ Description │ HSN │ Qty  │  Rate  │ GST% │ Tax  │      │   Amount    │
├────┼─────────────┼─────┼──────┼────────┼──────┼──────┼──────┼─────────────┤
│ 1  │ Laptop      │8471 │  2   │ 50,000 │  18% │18,000│      │  1,18,000   │
│ 2  │ Mouse       │8471 │  5   │    500 │  12% │  300 │      │     2,800   │
│ 3  │ Luxury Watch│9102 │  1   │ 20,000 │  28% │ 5,600│      │    25,600   │
└────┴─────────────┴─────┴──────┴────────┴──────┴──────┴──────┴─────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          GST BREAKDOWN                               │
├──────────┬─────────────────┬─────────────────┬───────────────────┤
│ GST Rate │ Taxable Amount  │      IGST       │    Total Tax      │
├──────────┼─────────────────┼─────────────────┼───────────────────┤
│   12%    │   ₹2,500.00     │    ₹300.00      │     ₹300.00       │
│          │                 │     (12%)       │                   │
├──────────┼─────────────────┼─────────────────┼───────────────────┤
│   18%    │ ₹1,00,000.00    │  ₹18,000.00     │   ₹18,000.00      │
│          │                 │     (18%)       │                   │
├──────────┼─────────────────┼─────────────────┼───────────────────┤
│   28%    │  ₹20,000.00     │   ₹5,600.00     │    ₹5,600.00      │
│          │                 │     (28%)       │                   │
└──────────┴─────────────────┴─────────────────┴───────────────────┘

Grand Total: ₹1,46,400.00

Amount in Words: One Lakh Forty Six Thousand Four Hundred Rupees Only
```

## How to Enable

### Step 1: Access Customization
- Navigate to **Invoices** or **Quotations** page
- Click **"Customize"** button (top right)

### Step 2: Enable GST Breakdown
- Go to **"Totals"** tab
- Find **"Show GST Breakdown by Rate"** option
- Toggle it **ON** (enabled by default)

### Step 3: Save
- Click **"Save Customization"**
- Settings apply to all future PDFs

## Feature Comparison

### Before (Simple Totals)
```
Taxable Amount:  ₹1,22,500.00
CGST:           ₹11,950.00  ← Combined all rates
SGST:           ₹11,950.00  ← Combined all rates
Total:          ₹1,46,400.00
```
**Issue:** Can't see breakdown by different GST rates

### After (GST Breakdown)
```
GST Breakdown:
12% GST: ₹2,500 → CGST ₹150 + SGST ₹150 = ₹300
18% GST: ₹1,00,000 → CGST ₹9,000 + SGST ₹9,000 = ₹18,000
28% GST: ₹20,000 → CGST ₹2,800 + SGST ₹2,800 = ₹5,600

Grand Total: ₹1,46,400.00
```
**Benefit:** Clear, GST-compliant breakdown

## Customization Options

You can control what appears in the breakdown:

| Option | Effect |
|--------|--------|
| **Show GST Breakdown by Rate** | Master toggle for detailed breakdown |
| **Show CGST** | Show/hide CGST column in breakdown |
| **Show SGST** | Show/hide SGST column in breakdown |
| **Show IGST** | Show/hide IGST column in breakdown |
| **Show Taxable Amount** | Show/hide taxable amount per rate |
| **Show Amount in Words** | Show total in words below breakdown |

## When to Use

### ✅ Use GST Breakdown When:
- Invoice has products with **different GST rates**
- Need **GST compliance** documentation
- Client requires **detailed tax breakup**
- Filing GST returns (helps reconciliation)
- Audit requirements

### ❌ Use Simple Totals When:
- All items have the **same GST rate**
- Need a **compact** invoice
- Printing on **thermal printer** (limited space)
- Customer preference for simplicity

## GST Compliance Notes

### Indian GST Requirements
According to GST rules, invoices with multiple tax rates should show:
1. ✅ Taxable value for each rate
2. ✅ Tax amount for each rate
3. ✅ Rate of tax applied
4. ✅ Separate CGST/SGST for intra-state
5. ✅ IGST for inter-state

This feature ensures **100% compliance** with these requirements.

### Tax Rate Categories in India
- **0%** - Exempt items (milk, bread, fresh vegetables)
- **5%** - Essential goods (sugar, tea, coffee, edible oils)
- **12%** - Standard goods (computers, processed foods)
- **18%** - Most goods and services (IT services, capital goods)
- **28%** - Luxury items (cars, AC, cigarettes)

## Testing Checklist

- [ ] Create invoice with single GST rate (18%)
- [ ] Create invoice with multiple rates (12%, 18%, 28%)
- [ ] Test intra-state transaction (same state)
- [ ] Test inter-state transaction (different states)
- [ ] Toggle GST breakdown ON/OFF
- [ ] Verify PDF shows correct breakdown
- [ ] Check amount in words
- [ ] Test with quotations
- [ ] Verify customization persists

## Support

If GST breakdown is not showing:
1. Check customization settings (Totals → Show GST Breakdown)
2. Ensure invoice has multiple GST rates
3. Verify company and client state codes are correct
4. Try regenerating the PDF
5. Check browser console for errors

## Technical Details

**Data Structure:**
```typescript
taxBreakdown: [
  {
    rate: 12,
    taxableAmount: 2500,
    cgst: 150,
    sgst: 150,
    igst: 0,
    cess: 0,
    totalTax: 300
  },
  {
    rate: 18,
    taxableAmount: 100000,
    cgst: 9000,
    sgst: 9000,
    igst: 0,
    cess: 0,
    totalTax: 18000
  }
]
```

**Calculation Logic:**
1. Group invoice items by GST rate
2. Sum taxable amounts per rate group
3. Calculate CGST/SGST (intra-state) or IGST (inter-state)
4. Generate breakdown table in PDF
5. Display with percentages and amounts

## Best Practices

1. **Always Enable for Production:** GST breakdown ensures compliance
2. **Review Before Finalizing:** Check breakdown matches your calculations
3. **Keep State Codes Updated:** Affects CGST/SGST vs IGST calculation
4. **Archive Old Invoices:** Keep records for GST filing (3-7 years)
5. **Reconcile Monthly:** Use breakdown for GST return preparation

---

**Feature Version:** 1.0
**Last Updated:** November 17, 2025
**Compatibility:** All invoice and quotation types
