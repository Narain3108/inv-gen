# Invoice Generator - Code Architecture

This document outlines the refactored architecture and best practices implemented in the Invoice Generator application.

## 📁 Project Structure

```
src/
├── app/                      # Next.js 14 App Router pages
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Landing page
│   └── invoices/            # Invoice management routes
├── components/              # React components (organized by feature)
│   ├── auth/               # Authentication components
│   ├── clients/            # Client management
│   ├── company/            # Company management
│   ├── dashboard/          # Dashboard widgets
│   ├── invoices/           # Invoice components
│   ├── layout/             # Layout components (Sidebar, Header)
│   ├── products/           # Product management
│   ├── quotations/         # Quotation management
│   ├── shared/             # Shared/reusable components (NEW)
│   │   ├── ErrorBoundary.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── LoadingSpinner.tsx
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
│   ├── useAsync.tsx        # (NEW) Async operation management
│   ├── useAuth.tsx         # Authentication hook
│   ├── useCompany.tsx      # Company state management
│   ├── useFormValidation.tsx # (NEW) Form validation with Zod
│   └── useFirestore.tsx    # Firestore operations
├── lib/                    # Core business logic and utilities
│   ├── constants.ts        # Application constants
│   ├── validations.ts      # Zod validation schemas
│   ├── errors/            # (NEW) Error handling
│   │   ├── error-handler.ts    # Error classes and handlers
│   │   └── error-messages.ts   # Centralized error messages
│   ├── firebase/          # Firebase configuration and helpers
│   │   ├── config.ts          # Firebase initialization
│   │   ├── auth-context.tsx   # Authentication context
│   │   └── firestore-helpers.ts # CRUD operations with error handling
│   ├── services/          # (NEW) Service layer
│   │   ├── base-service.ts    # Base CRUD service
│   │   ├── company-service.ts # Company business logic
│   │   ├── client-service.ts  # Client business logic
│   │   ├── product-service.ts # Product business logic
│   │   ├── invoice-service.ts # Invoice business logic
│   │   └── index.ts          # Service exports
│   ├── utils/            # Utility functions
│   │   ├── pdf-generator.ts  # PDF generation
│   │   ├── tax-calculator.ts # GST calculations
│   │   └── number-to-words.ts # Number to words conversion
│   └── api/              # External API integrations
│       └── gst-api.ts    # GST verification API
├── types/               # TypeScript type definitions
│   └── index.ts        # All application types
└── utils/              # Helper utilities
    ├── formatters.ts   # Date, currency, text formatters
    └── helpers.ts      # General helper functions
```

## 🏗️ Architecture Patterns

### 1. **Service Layer Pattern**

All business logic is encapsulated in service classes that extend a `BaseService`:

```typescript
// Example: CompanyService
class CompanyService extends BaseService<Company> {
  constructor() {
    super('companies');
  }

  async create(data: Omit<Company, 'id'>): Promise<string> {
    this.validateCompanyData(data);
    return super.create(data);
  }
}
```

**Benefits:**
- Separation of concerns
- Reusable business logic
- Centralized validation
- Easy testing

### 2. **Error Handling**

Comprehensive error handling with custom error classes:

```typescript
// Custom error classes
class AppError extends Error
class FirebaseError extends AppError
class ValidationError extends AppError
class NotFoundError extends AppError
class UnauthorizedError extends AppError
```

**Features:**
- Error boundaries for React components
- Centralized error messages
- User-friendly error feedback
- Proper error logging

### 3. **Type Safety**

Strong TypeScript typing throughout:

```typescript
// Generic type constraints
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null>

// No 'any' types
// Proper interface definitions
// Type guards where needed
```

### 4. **Custom Hooks**

Reusable React hooks for common patterns:

- `useAsync`: Manages async operations with loading/error states
- `useFormValidation`: Form validation with Zod schemas
- `useAuth`: Authentication state management
- `useCompany`: Company selection state

### 5. **Component Composition**

Components follow single responsibility principle:

```
InvoicesPage
├── DashboardLayout
│   ├── Header
│   ├── Sidebar
│   └── Main Content
└── InvoiceContent
    ├── InvoiceList
    └── InvoiceForm
```

## 🎯 Best Practices Implemented

### Code Quality

1. **TypeScript Strict Mode**
   - No `any` types
   - Proper generics
   - Strong type inference

2. **Error Handling**
   - Try-catch blocks
   - Error boundaries
   - User-friendly messages
   - Proper error logging

3. **Documentation**
   - JSDoc comments
   - Inline documentation
   - Type descriptions
   - Function examples

4. **Code Organization**
   - Feature-based structure
   - Clear module boundaries
   - Centralized exports

### Performance

1. **React Optimizations**
   - `useCallback` for memoized functions
   - `useMemo` for expensive calculations
   - Lazy loading for code splitting
   - Proper dependency arrays

2. **Firebase**
   - Offline persistence
   - Query optimization
   - Batch operations
   - Index management

### Security

1. **Authentication**
   - Protected routes
   - Session management
   - Firebase Auth integration

2. **Data Validation**
   - Zod schemas
   - Server-side validation
   - GSTIN/PAN validation
   - Input sanitization

## 📋 Coding Standards

### File Naming

- Components: PascalCase (`InvoiceForm.tsx`)
- Hooks: camelCase with 'use' prefix (`useAuth.tsx`)
- Utils: camelCase (`formatters.ts`)
- Types: PascalCase (`index.ts` with interfaces)
- Services: kebab-case with 'service' suffix (`company-service.ts`)

### Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { toast } from 'sonner';

// 2. Internal modules (absolute imports)
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';

// 3. Types
import type { Invoice, Company } from '@/types';

// 4. Relative imports (if needed)
import { helper } from './helper';
```

### Function Documentation

```typescript
/**
 * Calculate invoice totals with GST
 * 
 * @param items - Array of invoice items
 * @param companyState - Company state code
 * @param clientState - Client state code
 * @returns Calculated totals with tax breakdown
 * 
 * @example
 * calculateTotals(items, 'Karnataka', 'Maharashtra')
 * // Returns: { taxableAmount: 1000, cgst: 0, sgst: 0, igst: 180 }
 */
function calculateTotals(...) { }
```

## 🔄 Data Flow

### 1. **User Action → Component**
```
User clicks button → Component event handler
```

### 2. **Component → Service**
```
Component → Service method → Firebase operation
```

### 3. **Service → Error Handling**
```
Service → try/catch → Error handler → User feedback
```

### 4. **State Management**
```
Zustand store → Component subscription → UI update
```

## 🧪 Testing Strategy

### Unit Tests
- Service layer methods
- Utility functions
- Custom hooks
- Validation logic

### Integration Tests
- Component interactions
- Firebase operations
- API calls
- Form submissions

### E2E Tests
- User workflows
- Invoice creation
- PDF generation
- Data persistence

## 🚀 Performance Optimizations

1. **Code Splitting**: Dynamic imports for large components
2. **Memoization**: React.memo for pure components
3. **Lazy Loading**: Route-based code splitting
4. **Debouncing**: Search inputs
5. **Pagination**: Large data sets
6. **Caching**: Firebase offline persistence

## 📝 Maintenance Guidelines

### Adding New Features

1. Create service in `lib/services/`
2. Define types in `types/index.ts`
3. Add validation in `lib/validations.ts`
4. Create component in appropriate feature folder
5. Add error messages in `lib/errors/error-messages.ts`
6. Document with JSDoc comments

### Modifying Existing Features

1. Update service layer first
2. Update types if needed
3. Update validation schemas
4. Update components
5. Update tests
6. Update documentation

## 🔐 Security Checklist

- ✅ Input validation with Zod
- ✅ Firebase security rules
- ✅ Authentication on all routes
- ✅ HTTPS only
- ✅ Environment variables for secrets
- ✅ No sensitive data in client code
- ✅ CSRF protection (Next.js built-in)
- ✅ XSS prevention (React auto-escaping)

## 📚 Dependencies

### Core
- Next.js 16 - React framework
- React 19 - UI library
- TypeScript 5 - Type safety
- Tailwind CSS 4 - Styling

### Firebase
- firebase 12.5.0 - Backend services

### UI
- Radix UI - Headless components
- shadcn/ui - Component library
- lucide-react - Icons
- framer-motion - Animations

### Forms & Validation
- react-hook-form 7.66 - Form management
- zod 4.1 - Schema validation
- @hookform/resolvers - Form validation bridge

### Utilities
- date-fns 4.1 - Date manipulation
- pdfmake 0.2 - PDF generation
- zustand 5.0 - State management
- sonner 2.0 - Toast notifications

## 🎓 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Best Practices](https://react.dev/learn)
- [Zod Documentation](https://zod.dev)

---

## 📞 Support

For questions or issues:
1. Check the documentation
2. Review error messages
3. Check the logs
4. Review type definitions
5. Consult the service layer

**Remember:** This codebase follows enterprise-grade patterns. Always maintain code quality, proper typing, and comprehensive error handling.
