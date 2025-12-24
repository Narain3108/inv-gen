# Form Validation Enhancements: Immediate Quantity Validation and Serial Number Management

## Overview
This document describes the implementation of immediate quantity validation and enhanced serial number management features across QuotationForm, InvoiceForm, and PurchaseForm components.

## Features Implemented

### 1. Immediate Quantity Validation
- **Real-time stock checking**: Validates stock availability as soon as quantity is entered
- **Visual feedback**: Red border on quantity inputs when stock is exceeded
- **Out-of-stock dialog**: Immediate popup when requested quantity exceeds available stock
- **Proceed anyway option**: Allows users to continue with insufficient stock (with warnings)

### 2. Auto-popup Serial Number Management
- **Automatic modal opening**: Serial manager opens immediately when quantity is entered for products requiring serials
- **Smart triggering**: Only opens when serials are incomplete or missing
- **Manual access**: "Manage Serial" buttons remain available for user-initiated access

### 3. Enhanced User Experience
- **Immediate feedback**: No delays - validation happens instantly on quantity change
- **Visual indicators**: Clear status indicators for stock and serial requirements
- **Consistent behavior**: Same UX patterns across all forms with context-appropriate messaging

## Implementation Guide

### Step 1: Required Imports and Dependencies

Add these imports to your form component:

```typescript
import { OutOfStockDialog } from '@/components/shared/OutOfStockDialog';
import SerialManager from '@/components/shared/SerialManager';
```

### Step 2: State Management

Add the following state variables to your form component:

```typescript
// Out of Stock Dialog State
const [outOfStockDialogOpen, setOutOfStockDialogOpen] = useState(false);
const [outOfStockData, setOutOfStockData] = useState<{
  product: Product;
  requestedQuantity: number;
  availableStock: number;
  itemIndex: number;
} | null>(null);

// Serial Modal State (if not already present)
const [serialModalIndex, setSerialModalIndex] = useState<number | null>(null);
```

### Step 3: Quantity Change Handler

Implement the `handleQuantityChange` function:

```typescript
// Handle quantity change with stock validation and serial number management
const handleQuantityChange = (index: number, quantity: number) => {
  const item = watchItems?.[index];
  const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;
  
  if (!product || quantity <= 0 || isNaN(quantity)) {
    return;
  }

  // For QuotationForm and InvoiceForm: Check stock availability FIRST
  if (product.stock !== undefined && quantity > product.stock) {
    setOutOfStockData({
      product,
      requestedQuantity: quantity,
      availableStock: product.stock,
      itemIndex: index,
    });
    setOutOfStockDialogOpen(true);
    return; // Don't proceed to serial manager if out of stock
  }

  // For PurchaseForm: Skip stock validation (we're adding stock)
  // Update quantity for PurchaseForm
  if (formType === 'purchase') {
    setValue(`items.${index}.quantity`, quantity);
    
    // Handle serial number array for purchases
    if (product.hasSerialNumber) {
      const currentSerials = item.serialNumbers || [];
      const newSerials = [...currentSerials];
      
      // Adjust array length to match quantity
      if (newSerials.length < quantity) {
        while (newSerials.length < quantity) {
          newSerials.push('');
        }
      } else if (newSerials.length > quantity) {
        newSerials.splice(quantity);
      }
      
      setValue(`items.${index}.serialNumbers`, newSerials);
      
      // Auto-open serial modal if serials are incomplete
      const filledSerials = newSerials.filter(s => s && s.trim()).length;
      if (filledSerials !== quantity && quantity > 0) {
        setTimeout(() => {
          setSerialModalIndex(index);
        }, 300);
      }
    }
    return;
  }

  // For QuotationForm and InvoiceForm: Only if stock is available AND product has serial numbers
  if (product.hasSerialNumber && quantity > 0) {
    setSerialModalIndex(index);
  }
};
```

### Step 4: Out of Stock Proceed Handler

Add the proceed anyway handler:

```typescript
// Handle out of stock proceed anyway
const handleOutOfStockProceed = () => {
  if (outOfStockData) {
    // After user proceeds with out-of-stock quantity, check if serial numbers are needed
    if (outOfStockData.product.hasSerialNumber) {
      setSerialModalIndex(outOfStockData.itemIndex);
    }
    // Close the dialog and reset state
    setOutOfStockDialogOpen(false);
    setOutOfStockData(null);
  }
};
```

### Step 5: Update Quantity Inputs

#### Desktop Quantity Input:
```typescript
<Controller
  control={control}
  name={`items.${index}.quantity` as const}
  defaultValue={item?.quantity ?? ''}
  render={({ field }) => (
    <Input
      type="number"
      step="1"
      min="1"
      max={product?.type === 'product' && typeof product.stock === 'number' ? product.stock : undefined}
      {...field}
      value={field.value ?? ''}
      onChange={(e) => {
        const newQuantity = e.target.value === '' ? '' : parseInt(e.target.value);
        field.onChange(newQuantity);
        // Call handleQuantityChange immediately for any valid number
        if (newQuantity && !isNaN(newQuantity) && newQuantity > 0) {
          handleQuantityChange(index, newQuantity);
        }
      }}
      className={`text-center text-lg font-semibold ${
        product?.type === 'product' && 
        typeof product.stock === 'number' && 
        field.value && 
        !isNaN(field.value as number) && 
        (field.value as number) > product.stock 
          ? 'border-red-500' 
          : ''
      }`}
    />
  )}
/>
```

#### Mobile Quantity Input:
```typescript
<Controller
  control={control}
  name={`items.${index}.quantity` as const}
  defaultValue={item?.quantity ?? ''}
  render={({ field }) => (
    <Input
      type="number"
      step="1"
      min="1"
      max={product?.type === 'product' && typeof product.stock === 'number' ? product.stock : undefined}
      {...field}
      value={field.value ?? ''}
      onChange={(e) => {
        const value = e.target.value === '' ? '' : parseInt(e.target.value);
        field.onChange(value);
        if (value && !isNaN(value as number)) {
          handleQuantityChange(index, value as number);
        }
      }}
      className={`text-center text-lg font-semibold ${
        product?.type === 'product' && 
        typeof product.stock === 'number' && 
        field.value && 
        !isNaN(field.value as number) && 
        (field.value as number) > product.stock 
          ? 'border-red-500' 
          : ''
      }`}
    />
  )}
/>
```

#### Purchase Form Quantity Input (Special Case):
```typescript
<Input 
  type="number" 
  min="1" 
  className={`h-9 flex-1 ${
    item.hasSerialNumber && quantity > 0 && 
    (item.serialNumbers || []).filter(Boolean).length !== quantity 
      ? 'border-blue-500 ring-1 ring-blue-200' 
      : ''
  }`}
  {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
  onChange={(e) => {
    const newQuantity = parseInt(e.target.value) || 0;
    if (newQuantity > 0) {
      handleQuantityChange(index, newQuantity);
    }
  }}
/>
```

### Step 6: Add Dialog Components

Add the OutOfStockDialog component before the closing form tag:

```typescript
<OutOfStockDialog
  isOpen={outOfStockDialogOpen}
  onClose={() => {
    setOutOfStockDialogOpen(false);
    setOutOfStockData(null);
  }}
  product={outOfStockData?.product || {} as Product}
  availableStock={outOfStockData?.availableStock || 0}
  requestedQuantity={outOfStockData?.requestedQuantity || 0}
  onProceedAnyway={handleOutOfStockProceed}
  isInvoice={formType === 'invoice'} // true for InvoiceForm, false for QuotationForm
/>
```

### Step 7: Add Manual Serial Management Buttons

#### Desktop View:
```typescript
{product?.hasSerialNumber && (
  <div className="mt-2">
    <Button 
      type="button" 
      variant="outline" 
      size="sm" 
      onClick={() => setSerialModalIndex(index)}
    >
      Manage Serials
    </Button>
    <div className="text-xs text-muted-foreground mt-1">
      {(serialNumbers[index] || []).filter(Boolean).length} selected
    </div>
  </div>
)}
```

#### Mobile View:
```typescript
{product?.hasSerialNumber && (
  <div className="mt-2">
    <Button type="button" variant="outline" size="sm" onClick={() => setSerialModalIndex(index)}>
      Manage Serials
    </Button>
    <div className="text-xs text-muted-foreground mt-1">
      {(serialNumbers[index] || []).filter(Boolean).length} selected
    </div>
  </div>
)}
```

## Form-Specific Considerations

### QuotationForm
- **Stock validation**: Shows out-of-stock dialog but allows proceeding
- **Message context**: "You can still proceed with this quotation, but please ensure stock availability before converting to an invoice."
- **Serial behavior**: Auto-opens serial manager after stock validation passes

### InvoiceForm
- **Stock validation**: Shows out-of-stock dialog with stronger warnings
- **Message context**: "Proceeding with insufficient stock may cause fulfillment issues. Consider updating stock levels first."
- **Serial behavior**: Auto-opens serial manager after stock validation passes

### PurchaseForm
- **No stock validation**: We're adding stock, not consuming it
- **Serial behavior**: Auto-opens serial manager immediately when quantity is entered
- **Visual feedback**: Blue border and "S#" button for serial management
- **Array management**: Automatically adjusts serial number arrays to match quantity

## Visual Indicators

### Stock Validation
- **Red border**: Applied to quantity inputs when stock is exceeded
- **Error state**: `border-red-500` class for visual feedback

### Serial Number Requirements
- **Blue border**: Applied to quantity inputs when serials are needed (PurchaseForm)
- **Status badges**: Show serial completion status
- **Counter displays**: "X/Y selected" or "Serials: X/Y"

## Testing Checklist

### Functionality Tests
- [ ] Quantity validation triggers immediately on input change
- [ ] Out-of-stock dialog appears when stock is exceeded
- [ ] Serial manager opens automatically for products requiring serials
- [ ] "Proceed anyway" functionality works correctly
- [ ] Manual "Manage Serial" buttons function properly
- [ ] Visual indicators (red/blue borders) appear correctly

### Edge Cases
- [ ] Empty quantity values handled gracefully
- [ ] Zero or negative quantities rejected
- [ ] Products without stock information handled correctly
- [ ] Products without serial requirements work normally
- [ ] Form submission validation includes serial number checks

### Cross-Form Consistency
- [ ] Same behavior across QuotationForm and InvoiceForm (with appropriate messaging)
- [ ] PurchaseForm has appropriate purchase-specific behavior
- [ ] Visual styling is consistent across all forms

## Dependencies

### Required Components
- `OutOfStockDialog` from `@/components/shared/OutOfStockDialog`
- `SerialManager` from `@/components/shared/SerialManager`

### Required Types
- `Product` type with `stock`, `hasSerialNumber` properties
- Form data types with `quantity`, `productId` fields

### Required Utilities
- Form validation libraries (react-hook-form)
- State management (useState, useEffect)
- Product lookup functions

## Notes for Implementation

1. **Timing**: Use immediate onChange handlers, not debounced inputs
2. **State Management**: Keep dialog state separate from form state for better control
3. **Error Handling**: Always validate inputs before processing
4. **Performance**: Use setTimeout with minimal delays (200-300ms) for modal opening
5. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
6. **Responsive Design**: Test on both desktop and mobile layouts

This implementation provides a smooth, responsive user experience with immediate feedback and validation across all form types.