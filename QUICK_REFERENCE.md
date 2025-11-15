# Quick Reference Guide - Invoice Generator

## 🚀 Quick Start for Developers

### Using Services

```typescript
// Import services
import { 
  companyService, 
  clientService, 
  productService, 
  invoiceService 
} from '@/lib/services';

// Create
const id = await companyService.create(data);

// Read
const company = await companyService.getById(id);
const companies = await companyService.getAll();
const companyClients = await clientService.getByCompanyId(companyId);

// Update
await companyService.update(id, { name: 'New Name' });

// Delete
await companyService.delete(id);
```

### Error Handling

```typescript
import { handleAsyncError, logError, getUserMessage } from '@/lib/errors/error-handler';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/errors/error-messages';

// Wrap async operations
try {
  const result = await handleAsyncError(
    () => someAsyncOperation(),
    ERROR_MESSAGES.COMPANY.CREATE_FAILED
  );
} catch (error) {
  logError(error, 'ComponentName');
  toast.error(getUserMessage(error));
}
```

### Custom Hooks

```typescript
// Async operations
import { useAsync, useAsyncEffect } from '@/hooks';

const { data, loading, error, execute } = useAsync(fetchData, {
  showErrorToast: true,
  successMessage: SUCCESS_MESSAGES.COMPANY.CREATED,
  onSuccess: () => console.log('Success!'),
});

// Auto-execute on mount
const { data, loading, error } = useAsyncEffect(fetchData);

// Form validation
import { useFormValidation } from '@/hooks';

const { errors, validate, clearErrors } = useFormValidation(schema);
const result = validate(formData);
if (result.isValid) {
  // Submit form
}
```

### Error Boundaries

```typescript
import { ErrorBoundary, withErrorBoundary } from '@/components/shared';

// Wrap components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// Or use HOC
export default withErrorBoundary(YourComponent);
```

### Formatters

```typescript
import { 
  formatCurrency, 
  formatDate, 
  formatGSTIN,
  formatPhone 
} from '@/utils/formatters';

formatCurrency(1234.56); // "₹1,234.56"
formatDate(new Date()); // "15/11/2025"
formatGSTIN("29ABCDE1234F1Z5"); // "29 ABCDE 1234 F 1Z 5"
formatPhone("9876543210"); // "+91 9876543210"
```

### Constants

```typescript
import { 
  INDIAN_STATES, 
  GST_RATES, 
  PAYMENT_MODES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES 
} from '@/lib/constants';

// Use in components
<select>
  {INDIAN_STATES.map(state => (
    <option key={state.code} value={state.value}>
      {state.name}
    </option>
  ))}
</select>
```

## 📝 Common Patterns

### Creating a New Feature

1. **Define Types** (`src/types/index.ts`)
```typescript
export interface NewFeature {
  id: string;
  name: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

2. **Create Service** (`src/lib/services/feature-service.ts`)
```typescript
import { BaseService } from './base-service';
import { NewFeature } from '@/types';

class FeatureService extends BaseService<NewFeature> {
  constructor() {
    super('features');
  }
  
  // Add custom methods
  async customMethod() {
    // Implementation
  }
}

export const featureService = new FeatureService();
```

3. **Add Validation** (`src/lib/validations.ts`)
```typescript
export const featureFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  // ... other fields
});
```

4. **Create Component** (`src/components/features/FeatureForm.tsx`)
```typescript
import { useAsync } from '@/hooks';
import { featureService } from '@/lib/services';

export function FeatureForm() {
  const { execute, loading } = useAsync(
    featureService.create,
    { successMessage: 'Feature created!' }
  );

  // Component implementation
}
```

### Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { featureFormSchema } from '@/lib/validations';

const form = useForm({
  resolver: zodResolver(featureFormSchema),
  defaultValues: {
    name: '',
  },
});

const onSubmit = async (data) => {
  await featureService.create(data);
};
```

### Error Display

```typescript
// Form errors
{errors.name && (
  <p className="text-sm text-destructive">{errors.name.message}</p>
)}

// API errors
{error && (
  <Alert variant="destructive">
    <AlertDescription>{getUserMessage(error)}</AlertDescription>
  </Alert>
)}
```

### Loading States

```typescript
{loading ? (
  <LoadingSpinner />
) : (
  <DataDisplay data={data} />
)}
```

### Empty States

```typescript
import { EmptyState } from '@/components/shared';

{items.length === 0 ? (
  <EmptyState
    icon={FileText}
    title="No items found"
    description="Get started by creating your first item"
  />
) : (
  <ItemList items={items} />
)}
```

## 🎯 Code Style

### Naming Conventions

```typescript
// Components: PascalCase
export function InvoiceForm() {}

// Hooks: camelCase with 'use' prefix
export function useInvoice() {}

// Services: camelCase with 'Service' suffix
class InvoiceService extends BaseService {}
export const invoiceService = new InvoiceService();

// Constants: UPPER_SNAKE_CASE
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Types/Interfaces: PascalCase
export interface Invoice {}
export type PaymentMode = 'cash' | 'upi';
```

### Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';

// 3. Internal - Components
import { Button } from '@/components/ui/button';
import { InvoiceForm } from '@/components/invoices';

// 4. Internal - Hooks
import { useAsync, useAuth } from '@/hooks';

// 5. Internal - Services
import { invoiceService } from '@/lib/services';

// 6. Internal - Utils
import { formatCurrency } from '@/utils/formatters';

// 7. Types
import type { Invoice, Company } from '@/types';
```

### File Structure

```typescript
/**
 * Component/Module description
 * 
 * Additional details about what this does
 * 
 * @module path/to/module
 */

'use client'; // If needed

// Imports

// Types (if file-specific)
interface Props {}

// Component
export function Component() {
  // State
  // Hooks
  // Effects
  // Handlers
  // Render
}
```

## 🔍 Debugging Tips

### Check Errors

```typescript
// Development console
console.log('[DEBUG]', { data, state });

// Production - use error handler
logError(error, 'Context Information');
```

### Firestore Debugging

```typescript
// Enable Firestore debug logging (development only)
if (process.env.NODE_ENV === 'development') {
  enableDebugLogging();
}
```

### React DevTools

- Use React DevTools to inspect component state
- Check component re-renders
- Profile performance

## 📚 Resources

- **Architecture**: See `ARCHITECTURE.md`
- **Refactoring Summary**: See `REFACTORING_SUMMARY.md`
- **Types**: `src/types/index.ts`
- **Constants**: `src/lib/constants.ts`
- **Error Messages**: `src/lib/errors/error-messages.ts`

## 🆘 Common Issues

### Issue: Type Error in Service

```typescript
// Wrong
const data = await service.create({ /* missing required fields */ });

// Right
const data: Omit<Type, 'id' | 'createdAt' | 'updatedAt'> = {
  // All required fields
};
await service.create(data);
```

### Issue: Error Not Showing to User

```typescript
// Wrong
try {
  await operation();
} catch (error) {
  console.error(error); // Only logs, no user feedback
}

// Right
try {
  await operation();
} catch (error) {
  logError(error, 'Context');
  toast.error(getUserMessage(error));
}
```

### Issue: Validation Not Working

```typescript
// Make sure schema matches form data structure
const schema = z.object({
  // Schema fields must match form fields exactly
});

// Validate before submit
const result = validate(formData);
if (!result.isValid) {
  // Show errors
  return;
}
```

---

**Remember**: This codebase follows enterprise best practices. Always maintain:
- Type safety
- Error handling
- Documentation
- Code organization
- Testing

For more details, refer to `ARCHITECTURE.md` and `REFACTORING_SUMMARY.md`.
