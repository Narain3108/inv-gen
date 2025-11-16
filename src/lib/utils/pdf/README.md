# PDF Generator - Modular Architecture

This directory contains the refactored PDF generation system with a clean, modular structure.

## 📁 File Structure

```
src/lib/utils/pdf/
├── index.ts                    # Main export file
├── types.ts                    # TypeScript type definitions
├── helpers.ts                  # Utility helper functions
├── table-structure.ts          # Table column structure builder
├── table-rows.ts               # Table row builder for items
├── header-builder.ts           # PDF header section builder
├── address-builder.ts          # Billing/shipping address builder
├── items-table-builder.ts      # Complete items table builder
├── totals-builder.ts           # Tax summary and totals builder
├── footer-builder.ts           # Footer sections (bank, terms, signature)
├── invoice-generator.ts        # Main invoice PDF generator
└── quotation-generator.ts      # Main quotation PDF generator
```

## 🎯 Design Principles

Each module follows these principles:
- **Single Responsibility**: Each file handles one specific aspect
- **Under 200 Lines**: No file exceeds 200 lines for maintainability
- **Pure Functions**: Builders are pure functions with no side effects
- **Type Safety**: Full TypeScript typing throughout
- **Reusability**: Components can be reused across invoice and quotation PDFs

## 📦 Module Overview

### Core Types (`types.ts`)
Defines all TypeScript interfaces used across the PDF system:
- `InvoicePDFData` - Invoice data structure
- `QuotationPDFData` - Quotation data structure
- `TableStructure` - Table configuration
- `PDFDocumentDefinition` - PDF document structure

### Helper Functions (`helpers.ts`)
Utility functions for common operations:
- `safeCurrency()` - Safe number to currency conversion
- `parseWidth()` - Parse width values (number or '*')
- `getFontSize()` - Get font size from customization

### Table Structure (`table-structure.ts`)
Builds table column configuration:
- `getTableStructure()` - Returns widths and headers based on customization
- Handles enabled/disabled columns
- Sorts columns by order
- Validates column data

### Table Rows (`table-rows.ts`)
Builds individual item rows:
- `buildInvoiceItemRow()` - Creates row cells for each item
- Maps customization columns to item data
- Handles serial numbers
- Applies proper formatting

### Header Builder (`header-builder.ts`)
Creates PDF header sections:
- `buildCompanyHeader()` - Company logo and details
- `buildInvoiceTitle()` - Invoice/quotation title
- `buildInvoiceInfo()` - Invoice number and dates
- Respects customization settings

### Address Builder (`address-builder.ts`)
Creates address sections:
- `buildAddressSection()` - Billing and shipping addresses
- Configurable labels
- Optional fields (GSTIN, phone, email)
- Place of supply

### Items Table Builder (`items-table-builder.ts`)
Assembles complete items table:
- `buildItemsTable()` - Combines structure and rows
- Applies table styling
- Handles layout options

### Totals Builder (`totals-builder.ts`)
Creates totals/tax summary:
- `buildTotalsSection()` - Tax breakdown and total
- Conditional CGST/SGST/IGST display
- Amount in words
- Respects customization flags

### Footer Builder (`footer-builder.ts`)
Creates footer sections:
- `buildBankDetails()` - Bank account information
- `buildTermsAndConditions()` - Terms from company data
- `buildNotesSection()` - Additional notes
- `buildSignature()` - Authorized signatory section

### Invoice Generator (`invoice-generator.ts`)
Main invoice PDF generation:
- `generateInvoicePDF()` - Download invoice PDF
- `previewInvoicePDF()` - Open invoice in new window
- Assembles all sections in correct order
- Applies page settings from customization

### Quotation Generator (`quotation-generator.ts`)
Main quotation PDF generation:
- `generateQuotationPDF()` - Download quotation PDF
- Similar to invoice but with quotation-specific elements
- Includes validity notice

## 🔧 Usage

### Basic Usage

```typescript
import { generateInvoicePDF, previewInvoicePDF } from '@/lib/utils/pdf';

// Generate and download
generateInvoicePDF({
  invoice,
  company,
  client,
  customization // optional
});

// Preview in browser
previewInvoicePDF({
  invoice,
  company,
  client,
  customization // optional
});
```

### Advanced Usage - Custom Builders

You can also use individual builders for custom PDF layouts:

```typescript
import { 
  buildCompanyHeader,
  buildItemsTable,
  buildTotalsSection 
} from '@/lib/utils/pdf';

const content = [
  buildCompanyHeader(company, customization),
  buildItemsTable(items, customization),
  ...buildTotalsSection(invoice, customization),
];
```

## 🎨 Customization Support

All builders respect the `InvoiceCustomization` interface:

### Layout Customization
- Page size (A4, Letter)
- Page orientation
- Margins (top, right, bottom, left)

### Header Customization
- Title text and font size
- Show/hide invoice number, date
- Custom labels

### Company Details
- Show/hide logo, address, GSTIN, phone, email
- Show/hide bank details

### Address Customization
- Custom labels for billing/shipping
- Show/hide GSTIN, phone, email

### Table Customization
- Enable/disable columns
- Column order
- Column widths
- Serial number display

### Totals Customization
- Show/hide taxable amount
- Show/hide CGST/SGST/IGST
- Show/hide amount in words

### Footer Customization
- Show/hide terms and conditions (from company data)
- Show/hide notes (from company data)
- Show/hide signature
- Custom signature label

### Color Scheme
- Primary color
- Secondary color
- Text color

## 🔄 Migration from Old System

The old `pdf-generator.ts` file now re-exports from this modular system, so existing code continues to work:

```typescript
// Old import (still works)
import { generateInvoicePDF } from '@/lib/utils/pdf-generator';

// New import (recommended)
import { generateInvoicePDF } from '@/lib/utils/pdf';
```

## 📝 Adding New Features

To add a new PDF section:

1. Create a new builder file (e.g., `payment-builder.ts`)
2. Export builder functions
3. Add to `index.ts` exports
4. Use in main generators

Example:

```typescript
// payment-builder.ts
export const buildPaymentSection = (payments, customization) => {
  // ... implementation under 200 lines
};

// index.ts
export * from './payment-builder';

// invoice-generator.ts
import { buildPaymentSection } from './payment-builder';

content: [
  // ... other sections
  ...buildPaymentSection(invoice.payments, customization),
];
```

## ✅ Benefits

1. **Maintainability**: Small, focused files easy to understand
2. **Testability**: Pure functions easy to unit test
3. **Reusability**: Builders shared between invoice and quotation
4. **Extensibility**: Easy to add new sections without affecting others
5. **Type Safety**: Full TypeScript support with proper types
6. **Documentation**: Each module is self-documenting

## 🐛 Debugging

Console logs are included at key points:
- Table structure validation
- Row building for each item
- Column counting and matching

Check browser console for PDF generation debug info.
