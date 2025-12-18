# Modular System Usage Guide

## Overview
This guide shows developers how to use the new modular system and migrate existing components to use the centralized utilities.

## Quick Start

### Installation
All modules are already available in your project. Simply import what you need:

```typescript
// Form handling
import { FormStateManager, FieldValidators } from '@/lib/modules/form-handling';

// Table utilities
import { TableFilterEngine, SearchEngine } from '@/lib/modules/table-utils';

// Dialog management
import { DialogStateManager } from '@/lib/modules/dialog-management';

// Data transformation
import { DashboardDataTransformer } from '@/lib/modules/data-transform';

// Async patterns
import { useAsyncWithRetry } from '@/lib/modules/async-patterns';
```

## Module Usage Examples

### 1. Form Handling Module

#### Before (Traditional Approach)
```typescript
const [formData, setFormData] = useState(initialData);
const [errors, setErrors] = useState({});

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleSubmit = (e) => {
  e.preventDefault();
  const newErrors = {};
  
  if (!formData.name) newErrors.name = 'Name is required';
  if (!validateEmail(formData.email)) newErrors.email = 'Invalid email';
  
  setErrors(newErrors);
  if (Object.keys(newErrors).length === 0) {
    // Submit form
  }
};
```

#### After (Modular Approach)
```typescript
import { FormStateManager, FieldValidators } from '@/lib/modules/form-handling';

const formManager = new FormStateManager({
  initialData,
  validationSchema: {
    name: { required: true, minLength: 2 },
    email: FieldValidators.email,
    phone: FieldValidators.phone
  }
});

const handleSubmit = async (e) => {
  e.preventDefault();
  const isValid = formManager.validateForm();
  
  if (isValid) {
    await formManager.submitForm(onSubmit);
  }
};
```

### 2. Table Utilities Module

#### Before (Traditional Approach)
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [sortField, setSortField] = useState('name');
const [sortDirection, setSortDirection] = useState('asc');

const filteredData = data.filter(item => 
  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.email.toLowerCase().includes(searchTerm.toLowerCase())
);

const sortedData = [...filteredData].sort((a, b) => {
  if (sortDirection === 'asc') {
    return a[sortField] > b[sortField] ? 1 : -1;
  }
  return a[sortField] < b[sortField] ? 1 : -1;
});
```

#### After (Modular Approach)
```typescript
import { SearchEngine, TableSortManager } from '@/lib/modules/table-utils';

const searchEngine = new SearchEngine(data, {
  fields: ['name', 'email', 'phone'],
  fuzzySearch: true,
  highlightMatches: true
});

const sortManager = new TableSortManager(data);
sortManager.setSingleSort('name', 'asc');

const filteredData = searchEngine.getFilteredItems(searchTerm);
const sortedData = sortManager.getSortedData();
```

### 3. Data Transformation Module

#### Before (Traditional Approach)
```typescript
const calculateMetrics = (invoices) => {
  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
    
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  
  return { totalRevenue, totalInvoices, paidInvoices };
};

const transformToChart = (invoices) => {
  const monthlyData = {};
  invoices.forEach(inv => {
    const month = new Date(inv.date).toLocaleString('default', { month: 'short' });
    monthlyData[month] = (monthlyData[month] || 0) + inv.total;
  });
  return Object.entries(monthlyData).map(([month, value]) => ({ month, value }));
};
```

#### After (Modular Approach)
```typescript
import { DashboardDataTransformer } from '@/lib/modules/data-transform';

const metrics = DashboardDataTransformer.transformInvoicesToMetrics(invoices);
const chartData = DashboardDataTransformer.transformToRevenueChart(invoices, 'monthly');
const statusChart = DashboardDataTransformer.transformToStatusChart(invoices);
```

### 4. Dialog Management Module

#### Before (Traditional Approach)
```typescript
const [showConfirm, setShowConfirm] = useState(false);
const [showAlert, setShowAlert] = useState(false);
const [pendingAction, setPendingAction] = useState(null);

const handleDelete = (item) => {
  setPendingAction(() => () => deleteItem(item.id));
  setShowConfirm(true);
};
```

#### After (Modular Approach)
```typescript
import { DialogStateManager } from '@/lib/modules/dialog-management';

const dialogManager = new DialogStateManager();

const handleDelete = (item) => {
  const confirmDialog = DialogStateManager.createConfirmDialog(
    `delete-${item.id}`,
    'Delete Item',
    'Are you sure you want to delete this item?',
    () => deleteItem(item.id)
  );
  
  dialogManager.openDialog(confirmDialog);
};
```

### 5. Async Patterns Module

#### Before (Traditional Approach)
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [retryCount, setRetryCount] = useState(0);

const handleSubmit = async () => {
  setLoading(true);
  setError(null);
  
  try {
    await submitData();
  } catch (err) {
    setError(err);
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        handleSubmit();
      }, 1000 * Math.pow(2, retryCount));
    }
  } finally {
    setLoading(false);
  }
};
```

#### After (Modular Approach)
```typescript
import { useAsyncWithRetry, RetryConditions } from '@/lib/modules/async-patterns';

const { execute, loading, error, retryCount } = useAsyncWithRetry(
  submitData,
  {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    retryCondition: RetryConditions.networkErrors
  }
);
```

## Migration Strategy

### Phase 1: New Components
- Use modular utilities for all new components
- Follow the patterns shown in the examples above

### Phase 2: High-Impact Components
Migrate these components first for maximum benefit:
1. **Form Components**: InvoiceForm, ClientForm, ProductForm
2. **List Components**: InvoiceList, ClientList, ProductList
3. **Dashboard Components**: All dashboard widgets

### Phase 3: Remaining Components
- Gradually migrate other components
- No rush - old and new patterns can coexist

## Best Practices

### 1. Form Handling
```typescript
// ✅ Good: Use predefined validators
const schema = {
  email: FieldValidators.email,
  phone: FieldValidators.phone,
  currency: FieldValidators.currency
};

// ❌ Avoid: Custom validation logic in components
const validateEmail = (email) => { /* custom logic */ };
```

### 2. Table Utilities
```typescript
// ✅ Good: Configure search engine once
const searchEngine = useMemo(() => 
  new SearchEngine(data, { fields: ['name', 'email'] }), [data]
);

// ❌ Avoid: Recreating utilities on every render
const searchEngine = new SearchEngine(data, config); // In render function
```

### 3. Data Transformation
```typescript
// ✅ Good: Use static methods for transformations
const metrics = DashboardDataTransformer.transformInvoicesToMetrics(invoices);

// ❌ Avoid: Inline transformation logic
const metrics = invoices.reduce((acc, inv) => { /* complex logic */ }, {});
```

### 4. Async Patterns
```typescript
// ✅ Good: Use appropriate retry conditions
const { execute } = useAsyncWithRetry(apiCall, {
  retryCondition: RetryConditions.combine(
    RetryConditions.networkErrors,
    RetryConditions.serverErrors
  )
});

// ❌ Avoid: Retrying all errors
const { execute } = useAsyncWithRetry(apiCall, {
  retryCondition: () => true // Retries everything
});
```

## Performance Tips

### 1. Memoization
```typescript
// ✅ Good: Memoize expensive operations
const searchEngine = useMemo(() => 
  new SearchEngine(data, config), [data, config]
);

const transformedData = useMemo(() => 
  DashboardDataTransformer.transformInvoicesToMetrics(invoices), [invoices]
);
```

### 2. Lazy Loading
```typescript
// ✅ Good: Create utilities only when needed
const [searchEngine, setSearchEngine] = useState(null);

useEffect(() => {
  if (data.length > 0) {
    setSearchEngine(new SearchEngine(data, config));
  }
}, [data]);
```

### 3. Batch Operations
```typescript
// ✅ Good: Process multiple operations together
const filterEngine = new TableFilterEngine(data);
filterEngine.addFilter({ field: 'status', operator: 'equals', value: 'active' });
filterEngine.addFilter({ field: 'date', operator: 'gte', value: startDate });
const filtered = filterEngine.getFilteredData();
```

## Common Patterns

### 1. Search + Sort + Paginate
```typescript
const useTableData = (data, searchTerm, sortConfig, pageConfig) => {
  return useMemo(() => {
    // Search
    const searchEngine = new SearchEngine(data, { fields: ['name', 'email'] });
    const filtered = searchTerm ? searchEngine.getFilteredItems(searchTerm) : data;
    
    // Sort
    const sortManager = new TableSortManager(filtered);
    if (sortConfig.field) {
      sortManager.setSingleSort(sortConfig.field, sortConfig.direction);
    }
    const sorted = sortManager.getSortedData();
    
    // Paginate
    const paginationHandler = new PaginationHandler(sorted, pageConfig);
    return paginationHandler.getPaginatedData();
  }, [data, searchTerm, sortConfig, pageConfig]);
};
```

### 2. Form with Async Submission
```typescript
const useFormWithSubmission = (initialData, validationSchema, onSubmit) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  
  const formManager = new FormStateManager({ initialData, validationSchema });
  
  const { execute: submit, loading, error } = useAsyncWithRetry(
    async () => {
      const isValid = formManager.validateForm(formData);
      if (!isValid) {
        setErrors(formManager.getErrors());
        throw new Error('Validation failed');
      }
      
      await onSubmit(formData);
      setFormData(initialData); // Reset form
      setErrors({});
    },
    { retryCondition: RetryConditions.networkErrors }
  );
  
  return { formData, setFormData, errors, submit, loading, error };
};
```

## Troubleshooting

### Common Issues

1. **Module not found**: Ensure you're importing from the correct path
   ```typescript
   // ✅ Correct
   import { FormStateManager } from '@/lib/modules/form-handling';
   
   // ❌ Incorrect
   import { FormStateManager } from '@/lib/modules';
   ```

2. **Performance issues**: Use memoization for expensive operations
   ```typescript
   // ✅ Good
   const searchEngine = useMemo(() => new SearchEngine(data, config), [data]);
   
   // ❌ Bad
   const searchEngine = new SearchEngine(data, config); // Every render
   ```

3. **Type errors**: Ensure proper TypeScript generics
   ```typescript
   // ✅ Good
   const formManager = new FormStateManager<MyFormData>({ ... });
   
   // ❌ May cause issues
   const formManager = new FormStateManager({ ... }); // No type
   ```

## Support

For questions or issues with the modular system:
1. Check this guide first
2. Look at the example component: `src/components/examples/ModularExampleComponent.tsx`
3. Review the module source code in `src/lib/modules/`
4. Ask the development team for help

## Future Enhancements

Planned additions to the modular system:
- Enhanced validation rules
- More data transformation utilities
- Advanced async patterns (caching, optimistic updates)
- Additional table utilities (advanced filtering, export)
- More dialog types and animations