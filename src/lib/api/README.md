# API Layer Documentation

This directory contains all API communication logic for the Invoice Generator application.

## Structure

```
api/
├── client.ts           # Base HTTP client with error handling
├── companies.api.ts    # Company endpoints
├── clients.api.ts      # Client endpoints
├── products.api.ts     # Product endpoints
├── categories.api.ts   # Category endpoints
├── invoices.api.ts     # Invoice endpoints
├── quotations.api.ts   # Quotation endpoints
├── uploads.api.ts      # File upload endpoints
├── index.ts           # Central exports
└── README.md          # This file
```

## Usage Examples

### Basic Usage

```typescript
import { companiesApi, clientsApi, invoicesApi } from '@/lib/api';

// Fetch all companies
const companies = await companiesApi.getAll();

// Get a single client
const client = await clientsApi.getById('client-id');

// Create an invoice
const newInvoice = await invoicesApi.create({
  company: 'company-id',
  client: 'client-id',
  items: [...],
  // ... other fields
});
```

### With Filters

```typescript
import { invoicesApi } from '@/lib/api';

// Get filtered invoices
const paidInvoices = await invoicesApi.getAll({
  payment_status: 'paid',
  date_from: '2025-01-01',
  ordering: '-created_at',
  page: 1,
  page_size: 20,
});
```

### Error Handling

```typescript
import { companiesApi, ApiError } from '@/lib/api';

try {
  const company = await companiesApi.create(formData);
  console.log('Success:', company);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}:`, error.message);
    console.error('Details:', error.data);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### File Uploads

```typescript
import { uploadsApi } from '@/lib/api';

// Upload logo
const handleLogoUpload = async (file: File) => {
  try {
    const result = await uploadsApi.uploadLogo(file);
    console.log('Uploaded to:', result.url);
    return result.url;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Delete file
await uploadsApi.deleteFile('public-id');
```

### Using the Centralized API Object

```typescript
import { api } from '@/lib/api';

// All APIs accessible from single import
const companies = await api.companies.getAll();
const products = await api.products.getAll({ company: companyId });
const invoice = await api.invoices.create(data);
```

## Configuration

Set the API base URL in your environment variables:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

If not set, it defaults to `http://127.0.0.1:8000/api`.

## Best Practices

1. **Always use TypeScript types** - Import types from `@/types` or API filters
2. **Handle errors properly** - Use try-catch blocks and check for `ApiError`
3. **Use filters for pagination** - Don't fetch all records at once
4. **Optimize requests** - Only request data when needed
5. **Consistent naming** - Follow the established patterns when adding new endpoints

## Adding New Endpoints

1. Create a new file: `feature.api.ts`
2. Define the API functions following the pattern:

```typescript
import { apiClient, PaginatedResponse } from './client';
import type { YourType } from '@/types';

export const featureApi = {
  getAll: async (): Promise<PaginatedResponse<YourType>> => {
    return apiClient.get<PaginatedResponse<YourType>>('/feature/');
  },
  // ... other CRUD operations
};
```

3. Export in `index.ts`:

```typescript
export { featureApi } from './feature.api';
```

## API Response Format

### Single Resource
```typescript
{
  id: string;
  name: string;
  // ... other fields
  created_at: string;
  updated_at: string;
}
```

### Paginated List
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Resource>;
}
```

## Common Filters

Most endpoints support these common filters:
- `search` - Full-text search
- `ordering` - Sort by field (prefix with `-` for descending)
- `page` - Page number
- `page_size` - Results per page

## Testing

Test API calls in isolation:

```typescript
// In a test file or component
const testApi = async () => {
  const result = await companiesApi.getAll();
  console.log('API Response:', result);
};
```
