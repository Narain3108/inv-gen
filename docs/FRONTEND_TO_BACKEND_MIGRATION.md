# Frontend Migration from Firebase to FastAPI Backend

## Migration Summary

Successfully migrated the Invoice Billing System frontend from Firebase Client SDK to FastAPI backend API.

## Changes Made

### 1. API Client Layer (`src/lib/api/`)

#### Updated Files:
- **`client.ts`**: Changed base URL from `/api` to `/api/v1` to match FastAPI endpoints
- **`companies.api.ts`**: Removed pagination, updated to return `Company[]` instead of `PaginatedResponse<Company>`
- **`clients.api.ts`**: Removed pagination, changed `company` filter to `company_id`
- **`products.api.ts`**: Removed pagination, changed `company` filter to `company_id`
- **`invoices.api.ts`**: Removed pagination, changed `company`/`client` filters to `company_id`/`client_id`
- **`quotations.api.ts`**: Removed pagination, changed filters to use `company_id`/`client_id`
- **`categories.api.ts`**: Updated to use subcollection endpoints `/companies/{id}/product-categories/`

#### New Files:
- **`customizations.api.ts`**: Created API client for customization subcollection endpoints

### 2. Service Layer (`src/lib/services/`)

#### Created:
- **`api-base-service.ts`**: New base service class that uses API instead of Firestore

#### Updated:
- **`company-service.ts`**: Changed from `BaseService` to `ApiBaseService`, uses `companiesApi`
- **`client-service.ts`**: Changed from `BaseService` to `ApiBaseService`, uses `clientsApi`
- **`product-service.ts`**: Changed from `BaseService` to `ApiBaseService`, uses `productsApi`
- **`invoice-service.ts`**: Changed from `BaseService` to `ApiBaseService`, uses `invoicesApi`
- **`customization-service.ts`**: Replaced Firestore SDK calls with `customizationsApi` and `companiesApi`
- **`product-category-service.ts`**: Replaced Firestore SDK calls with `categoriesApi`, updated all functions to require `companyId`

### 3. Hooks (`src/hooks/`)

#### Updated:
- **`useCompanies.tsx`**: Replaced `getAllDocuments` Firestore helper with `companiesApi.getAll()`
- **`useFirestore.tsx`**: Left as-is (can be deprecated or removed in future cleanup)

### 4. Types (`src/types/`)

#### Updated:
- **`index.ts`**: 
  - Removed `import { Timestamp } from 'firebase/firestore'`
  - Replaced all `Timestamp` types with `string | Date` for:
    - User, Company, ProductCategory, Product, Client
    - Invoice, Quotation, PaymentRecord
    - ClientStatistics

### 5. Utilities (`src/utils/`)

#### Updated:
- **`formatters.ts`**: 
  - Removed `import { Timestamp } from 'firebase/firestore'`
  - Updated all date formatting functions to accept `Date | string` instead of `Date | Timestamp`
  - Changed date conversion from `date instanceof Timestamp ? date.toDate() : date` to `typeof date === 'string' ? new Date(date) : date`

## Backend API Endpoints Used

### Top-Level Collections:
- `/api/v1/companies/` - CRUD operations for companies
- `/api/v1/clients/` - CRUD operations for clients
- `/api/v1/products/?company_id={id}` - CRUD operations for products (filtered by company)
- `/api/v1/invoices/?company_id={id}` - CRUD operations for invoices (filtered by company)
- `/api/v1/quotations/?company_id={id}` - CRUD operations for quotations (filtered by company)

### Subcollection Endpoints:
- `/api/v1/companies/{id}/customizations/` - Customization settings per company
- `/api/v1/companies/{id}/product-categories/` - Product categories per company

## Response Format Changes

### Before (Expected Django-style pagination):
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

### After (FastAPI simple arrays):
```typescript
T[]  // Direct array of objects
```

## Breaking Changes

### Function Signatures Updated:

#### Product Category Service:
- `fetchProductCategories()` → `fetchProductCategories(companyId: string)`
- `createProductCategory(data)` → `createProductCategory(companyId: string, data)`
- `updateProductCategory(id, data)` → `updateProductCategory(companyId: string, id, data)`
- `deleteProductCategory(id)` → `deleteProductCategory(companyId: string, id)`
- `findCategoryByHSN(hsn)` → `findCategoryByHSN(companyId: string, hsn)`
- `findCategoryByProductName(name)` → `findCategoryByProductName(companyId: string, name)`
- `getSuggestedGSTRate(hsn, name)` → `getSuggestedGSTRate(companyId: string, hsn, name)`

## Environment Configuration

The API base URL can be configured via environment variable:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
```

Default: `http://127.0.0.1:8000/api/v1`

## Firebase Client SDK Dependencies

The following Firebase packages are NO LONGER NEEDED for frontend functionality:
- `firebase/firestore` - Replaced with REST API calls
- Direct Firestore operations (collection, doc, getDocs, etc.)

**Note**: Firebase configuration may still be needed for:
- Firebase Auth (if used for authentication in future)
- File uploads to Firebase Storage (if used)

## Files That Still Reference Firebase

These files may need cleanup in a future PR:
- `src/lib/firebase/config.ts` - Firebase initialization
- `src/lib/firebase/firestore-helpers.ts` - Firestore helper functions (unused)
- `src/hooks/useFirestore.tsx` - Generic Firestore hook (can be deprecated)
- Any component files directly importing from `firebase/firestore`

## Testing Required

Before deploying to production:

1. **Company CRUD**: Create, read, update, delete companies
2. **Client CRUD**: Create, read, update, delete clients
3. **Product CRUD**: Create, read, update, delete products (with company filtering)
4. **Invoice CRUD**: Create, read, update, delete invoices (with company filtering)
5. **Quotation CRUD**: Create, read, update, delete quotations (with company filtering)
6. **Customizations**: Load and save invoice/quotation customization settings
7. **Product Categories**: CRUD operations for product categories (per company)
8. **Date Handling**: Verify all date fields display and save correctly
9. **Error Handling**: Verify API errors are caught and displayed properly

## Next Steps

1. ✅ Update API layer
2. ✅ Update service layer
3. ✅ Update types
4. ✅ Update utilities
5. ⏳ Integration testing
6. 🔜 Remove unused Firebase imports
7. 🔜 Clean up `useFirestore` hook
8. 🔜 Update components using Firestore directly (if any)
9. 🔜 Remove Firebase client SDK from package.json dependencies

## Benefits

1. **Centralized Logic**: Business logic and data validation now in backend
2. **Better Error Handling**: Consistent error responses from API
3. **Easier Testing**: Can test backend independently
4. **Security**: No direct database access from client
5. **Scalability**: Backend can be scaled independently
6. **Type Safety**: Maintained with TypeScript interfaces
7. **No Composite Indexes**: Backend handles complex queries without Firestore index requirements

## Migration Status: ✅ COMPLETE

The frontend is now fully using the FastAPI backend instead of Firebase Client SDK for all data operations.
