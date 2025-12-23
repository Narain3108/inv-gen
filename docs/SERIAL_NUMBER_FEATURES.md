# Serial Number Management Features

## Overview
This document describes the new serial number management features implemented in the quotation form.

## Features Implemented

### 1. Serial Number Management Button
- **Location**: Appears in the "Serial" column of the quotation items table
- **Activation**: Only enabled when:
  - A product is selected
  - The product has `hasSerialNumber: true` in the database
  - A valid quantity (> 0) is entered
- **Visual Indicator**: Shows a badge with the count of serial numbers added

### 2. Serial Number Modal
- **Trigger**: Clicking the "Manage Serial" button
- **Functionality**: 
  - Opens a modal with input fields for serial numbers
  - Requires exactly the same number of serial numbers as the quantity
  - Validates for duplicates and empty values
  - Does not auto-generate serial numbers (as requested)

### 3. Stock Validation
- **Real-time Validation**: Shows stock warning immediately when quantity is entered
- **Location**: Appears below the quantity input field
- **Behavior**: 
  - Shows current stock for products
  - Displays error toast if quantity exceeds available stock
  - Prevents form submission with insufficient stock

### 4. Database Integration
- **Backend**: Added stock check endpoint `/products/{id}/check-stock`
- **Frontend**: Added `productsApi.checkStock()` method
- **Storage**: Serial numbers are stored in the `serialNumbers` array field of quotation items

## Technical Implementation

### Frontend Changes
1. **QuotationForm.tsx**:
   - Added serial number state management
   - Added stock validation on quantity change
   - Added "Manage Serial" button in both desktop and mobile views
   - Added SerialManager modal integration
   - Added validation for serial numbers before form submission

2. **API Integration**:
   - Added stock check API method
   - Enhanced products API with stock validation

### Backend Changes
1. **products_firestore.py**:
   - Added `/products/{id}/check-stock` endpoint
   - Returns stock availability information

### Database Schema
- Products table: `hasSerialNumber` boolean field
- Quotation items: `serialNumbers` array field for storing serial numbers

## Usage Flow

1. **Select Product**: User selects a product in the quotation form
2. **Enter Quantity**: User enters the desired quantity
   - If quantity > stock, shows error immediately
3. **Manage Serials**: If product requires serial numbers:
   - "Manage Serial" button becomes active
   - User clicks button to open serial management modal
4. **Add Serial Numbers**: User adds exactly the required number of serial numbers
5. **Validation**: Form validates all serial numbers are provided before submission
6. **Submit**: Quotation is created with serial numbers stored in the database

## Error Handling

- **Stock Validation**: Immediate feedback when quantity exceeds stock
- **Serial Number Validation**: 
  - Must provide exactly the required quantity of serial numbers
  - No duplicate serial numbers allowed
  - No empty serial numbers allowed
- **Form Submission**: Prevents submission if validation fails

## Future Enhancements

1. **Serial Number Pool**: Could integrate with product serial number inventory
2. **Barcode Scanning**: Could add barcode scanning for serial number input
3. **Serial Number History**: Could track serial number usage across quotations/invoices
4. **Bulk Serial Import**: Could allow CSV import of serial numbers

## Testing

To test the features:

1. Create a product with `hasSerialNumber: true`
2. Add the product to a quotation
3. Enter a quantity
4. Verify the "Manage Serial" button is enabled
5. Click the button and add serial numbers
6. Verify validation works correctly
7. Submit the quotation and verify serial numbers are saved