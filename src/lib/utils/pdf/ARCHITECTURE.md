# PDF Generator - Module Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                             │
│  (Invoice Page, Quotation Page, etc.)                               │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ imports
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    pdf-generator.ts (Legacy)                         │
│  Re-exports for backward compatibility                              │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ re-exports from
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      pdf/index.ts (New)                              │
│  Main export hub for all modules                                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
                ▼                          ▼
┌───────────────────────────┐  ┌──────────────────────────┐
│  invoice-generator.ts     │  │  quotation-generator.ts  │
│  - generateInvoicePDF()   │  │  - generateQuotationPDF()│
│  - previewInvoicePDF()    │  │                          │
└───────┬───────────────────┘  └───────┬──────────────────┘
        │                              │
        │  assembles sections from     │
        │                              │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│header-builder│ │address-builder│ │items-table- │
│              │ │               │ │   builder    │
│- buildCompany│ │- buildAddress │ │- buildItems  │
│  Header()    │ │  Section()    │ │  Table()     │
│- buildInvoice│ │               │ │              │
│  Title()     │ │               │ │              │
│- buildInvoice│ │               │ │              │
│  Info()      │ │               │ │              │
└──────┬───────┘ └──────────────┘ └───────┬──────┘
       │                                   │
       │         uses                      │
       │                                   │
       ▼              ┌───────────────────┘
┌──────────────┐     │
│totals-builder│     │
│              │     │
│- buildTotals │     │
│  Section()   │     │
│              │     │
└──────┬───────┘     │
       │             │
       │             ▼
       │      ┌──────────────────┐
       │      │ table-structure  │
       │      │                  │
       │      │- getTableStructure()
       │      │                  │
       │      └────────┬─────────┘
       │               │
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│footer-builder│ │ table-rows   │
│              │ │              │
│- buildBank   │ │- buildInvoice│
│  Details()   │ │  ItemRow()   │
│- buildTerms  │ │              │
│  AndCond...()│ │              │
│- buildNotes  │ │              │
│  Section()   │ │              │
│- buildSigna  │ │              │
│  ture()      │ │              │
└──────┬───────┘ └───────┬──────┘
       │                 │
       │  uses           │
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌──────────────┐
        │   helpers    │
        │              │
        │- safeCurrency│
        │- parseWidth  │
        │- getFontSize │
        └──────┬───────┘
               │
               │ uses
               ▼
        ┌──────────────┐
        │    types     │
        │              │
        │- InvoicePDF  │
        │  Data        │
        │- QuotationPDF│
        │  Data        │
        │- TableStruct │
        │- PDFDocument │
        │  Definition  │
        └──────────────┘

External Dependencies:
├── pdfmake - PDF generation library
├── @/types - Invoice, Company, Client, Quotation
├── @/types/customization - InvoiceCustomization
├── @/utils/formatters - formatCurrency, formatDate
└── @/lib/utils/number-to-words - amountToWords
```

## Module Dependency Flow

1. **Application** calls `generateInvoicePDF()` or `previewInvoicePDF()`
2. **Main Generators** (invoice/quotation) assemble content from builders
3. **Section Builders** create specific PDF sections:
   - Header builders → Company info, title, invoice details
   - Address builder → Billing and shipping addresses
   - Items builder → Uses table structure + rows
   - Totals builder → Tax summary and amount
   - Footer builders → Bank, terms, notes, signature
4. **Helper Functions** provide utilities (currency, width parsing, etc.)
5. **Types** ensure type safety across all modules

## Data Flow Example

```
User clicks "View Invoice"
         ↓
loadCustomization(companyId) 
         ↓
Fetch company data (terms, notes)
         ↓
Merge into customization object
         ↓
previewInvoicePDF({ invoice, company, client, customization })
         ↓
invoice-generator.ts:
  ├─ Apply page settings (size, margins)
  ├─ buildCompanyHeader(company, customization)
  ├─ buildInvoiceTitle(customization)
  ├─ buildInvoiceInfo(invoice, customization)
  ├─ buildAddressSection(client, customization)
  ├─ buildItemsTable(items, customization)
  │   ├─ getTableStructure(customization) → widths, headers
  │   └─ items.map(item => buildInvoiceItemRow(item, customization))
  ├─ buildTotalsSection(invoice, customization)
  ├─ buildBankDetails(company, customization)
  ├─ buildTermsAndConditions(customization) → uses company terms
  ├─ buildNotesSection(customization) → uses company notes
  └─ buildSignature(company, customization)
         ↓
pdfMake.createPdf(docDefinition).open()
         ↓
PDF opens in new browser window
```

## Customization Application Points

Each builder checks customization settings:

```
buildCompanyHeader()
├─ showLogo → Include/exclude logo
├─ showAddress → Include/exclude address
├─ showGSTIN → Include/exclude GSTIN
├─ showPhone → Include/exclude phone
├─ showEmail → Include/exclude email
└─ colorScheme.primary → Apply brand color

buildInvoiceTitle()
├─ header.title → Custom title text
├─ header.fontSize → small/medium/large
└─ colorScheme.primary → Title color

buildInvoiceInfo()
├─ showInvoiceNumber → Include/exclude number
├─ showDate → Include/exclude date
├─ showDueDate → Include/exclude due date
├─ invoiceNumberLabel → Custom label
├─ dateLabel → Custom label
└─ dueDateLabel → Custom label

getTableStructure()
├─ table.columns → Filter enabled columns
├─ column.order → Sort columns
└─ column.width → Set column widths

buildTotalsSection()
├─ showTaxableAmount → Include/exclude
├─ showCGST → Include/exclude CGST
├─ showSGST → Include/exclude SGST
├─ showIGST → Include/exclude IGST
└─ showAmountInWords → Include/exclude

buildFooter...()
├─ showBankDetails → Include/exclude bank info
├─ showTermsAndConditions → Include/exclude terms
├─ footer.termsText → Company-specific terms
├─ showThankYouNote → Include/exclude notes
├─ footer.thankYouText → Company-specific notes
└─ showSignature → Include/exclude signature
```

## Module Size Comparison

| Module | Before (lines) | After (lines) | Reduction |
|--------|---------------|---------------|-----------|
| pdf-generator.ts | 1,307 | 11 | 99.2% |
| types.ts | - | 30 | New |
| helpers.ts | - | 40 | New |
| table-structure.ts | - | 75 | New |
| table-rows.ts | - | 120 | New |
| header-builder.ts | - | 155 | New |
| address-builder.ts | - | 145 | New |
| items-table-builder.ts | - | 30 | New |
| totals-builder.ts | - | 75 | New |
| footer-builder.ts | - | 130 | New |
| invoice-generator.ts | - | 150 | New |
| quotation-generator.ts | - | 100 | New |
| index.ts | - | 20 | New |
| **Total** | **1,307** | **1,081** | **-17.3%** |

**Result**: Code split into 12 manageable modules with slight reduction in total lines due to eliminated duplication. Largest module is only 155 lines (vs 1,307 before).
