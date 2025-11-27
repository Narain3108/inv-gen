# Frontend-Backend Integration Analysis
## Current State & Migration Requirements

---

## 📊 **CURRENT ARCHITECTURE**

### **Frontend (Next.js + Firebase Client SDK)**
- **Direct Firestore Access**: Frontend directly queries Firebase Firestore using client SDK
- **Global Collections**: companies, clients, products (all accessible without user authentication)
- **Company Subcollections**: invoices, quotations stored under company documents
- **No Authentication**: Public prototype with no user login system
- **Real-time Updates**: Uses `onSnapshot` for live data synchronization

### **Backend (FastAPI + Firebase Admin SDK)**
- **Firestore Admin Access**: Server-side Firebase Admin SDK
- **REST API Endpoints**: Full CRUD for all resources
- **Global Collections**: companies, clients, products (top-level)
- **Company Subcollections**: invoices, quotations, customizations, productCategories (nested)
- **No Authentication**: Public API with no auth requirements
- **Auto-numbering**: Invoice/quotation numbers generated server-side

---

## 🔍 **FRONTEND FIRESTORE USAGE ANALYSIS**

### **1. Firebase Configuration** (`src/lib/firebase/config.ts`)
```typescript
// Client-side Firebase initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Initializes Firebase with env variables
// Enables offline persistence for client-side caching
```

**Issues:**
- ❌ Direct Firestore access from client
- ❌ No centralized API endpoint
- ❌ Offline persistence may cause data sync issues
- ❌ No validation on client side before write

---

### **2. Firestore Helper Functions** (`src/lib/firebase/firestore-helpers.ts`)

**Current Functions:**
```typescript
// CRUD Operations
getDocument<T>(collectionName, docId) → T | null
getAllDocuments<T>(collectionName, orderBy?, limit?) → T[]
queryDocuments<T>(collectionName, field, operator, value) → T[]
createDocument<T>(collectionName, data) → string (docId)
updateDocument<T>(collectionName, docId, data) → void
deleteDocument(collectionName, docId) → void

// Company-specific
getCompanyDocuments<T>(collectionName, companyId) → T[]
getUserCompanyDocuments<T>(collectionName, userId, companyId) → T[]

// Utility
documentExists(collectionName, docId) → boolean
countDocuments(collectionName, field?, operator?, value?) → number
searchDocuments<T>(collectionName, field, searchTerm) → T[]
```

**Problems:**
- ❌ All queries hit Firestore directly
- ❌ No centralized validation logic
- ❌ No server-side business logic (auto-numbering, calculations)
- ❌ Client-side filtering for search (inefficient)
- ❌ No rate limiting or access control

---

### **3. Service Layer** (`src/lib/services/`)

#### **BaseService** (`base-service.ts`)
```typescript
abstract class BaseService<T> {
  constructor(protected collectionName: string)
  
  async getById(id: string): Promise<T | null>
  async getAll(orderBy?, direction?): Promise<T[]>
  async getByCompanyId(companyId, orderBy?, direction?): Promise<T[]>
  async create(data): Promise<string>
  async update(id, data): Promise<void>
  async delete(id): Promise<void>
  protected async query(field, operator, value): Promise<T[]>
}
```

**All services extend BaseService:**
- InvoiceService (`invoice-service.ts`)
- ClientService (`client-service.ts`)
- CompanyService (`company-service.ts`)
- ProductService (`product-service.ts`)
- CustomizationService (`customization-service.ts`)
- ProductCategoryService (`product-category-service.ts`)

**Current Behavior:**
- ✅ Provides abstraction over Firestore helpers
- ❌ Still directly queries Firestore
- ❌ No backend API integration
- ✅ Has validation logic (but only client-side)
- ✅ Has business logic (tax calculations, totals)

---

### **4. App Data Context** (`src/contexts/AppDataContext.tsx`)

**Current Implementation:**
```typescript
export function AppDataProvider({ children }) {
  // State management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Direct Firestore queries
  const loadCompanies = async () => {
    const snapshot = await getDocs(collection(db, 'companies'));
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setCompanies(data);
  };
  
  const loadClients = async () => {
    const snapshot = await getDocs(collection(db, 'clients'));
    // ...
  };
  
  const loadProducts = async () => {
    // Queries company-specific products by companyId
    const q = query(
      collection(db, 'products'),
      where('companyId', '==', selectedCompany.id)
    );
    // ...
  };
}
```

**Issues:**
- ❌ Direct Firestore queries in context
- ❌ No API layer
- ❌ Products filtered by `companyId` field (but backend has global products collection)
- ⚠️ **ARCHITECTURAL MISMATCH**: Frontend expects products to be company-specific, backend treats products as global

---

## 🚨 **CRITICAL MISMATCHES**

### **1. Products Collection Structure**

| Aspect | Frontend Expectation | Backend Reality | Issue |
|--------|---------------------|-----------------|-------|
| **Collection Type** | Company-specific (filtered by `companyId`) | Global collection (no `companyId` filter) | ❌ Mismatch |
| **Query Method** | `where('companyId', '==', companyId)` | `/api/v1/products/` (all products) | ❌ Different |
| **Endpoint** | N/A (direct Firestore) | `/api/v1/products/` | 🔄 Needs adapter |

**Backend Products Endpoint:**
```
GET  /api/v1/products/
POST /api/v1/products/
GET  /api/v1/products/{product_id}
PUT  /api/v1/products/{product_id}
DELETE /api/v1/products/{product_id}
```

**Decision Required:**
- Option A: Add `companyId` filter to products (make it company-specific)
- Option B: Change frontend to treat products as global
- Option C: Create separate endpoint `/api/v1/companies/{id}/products/`

---

### **2. Invoices/Quotations Subcollection Structure**

| Aspect | Frontend Approach | Backend Approach | Status |
|--------|------------------|------------------|--------|
| **Storage** | Top-level `invoices` collection | Subcollection `companies/{id}/invoices` | ❌ Different |
| **Query** | `where('companyId', '==', companyId)` | Subcollection query | ❌ Incompatible |
| **Field Name** | `invoiceNumber` (camelCase) | `invoice_number` (snake_case) | ✅ Fixed (flexible schemas) |

**Backend Invoice Endpoints:**
```
POST   /api/v1/companies/{company_id}/invoices/
GET    /api/v1/companies/{company_id}/invoices/
GET    /api/v1/companies/{company_id}/invoices/{invoice_id}
PUT    /api/v1/companies/{company_id}/invoices/{invoice_id}
DELETE /api/v1/companies/{company_id}/invoices/{invoice_id}
```

**Frontend Expectation:**
```typescript
// Currently queries top-level collection
const invoicesRef = collection(db, 'invoices');
const q = query(invoicesRef, where('companyId', '==', companyId));
```

**Action Required:**
- 🔄 Update frontend to query subcollection: `collection(db, 'companies', companyId, 'invoices')`
- OR migrate API calls: `GET /api/v1/companies/{companyId}/invoices/`

---

### **3. Field Naming Conventions**

| Frontend (Firestore) | Backend (API) | Fixed? |
|---------------------|---------------|--------|
| `clientName` | `name` | ✅ Yes (flexible schemas) |
| `createdAt` | `created_at` | ✅ Yes (accepts both) |
| `updatedAt` | `updated_at` | ✅ Yes (accepts both) |
| `invoiceNumber` | `invoice_number` | ✅ Yes (accepts both) |
| `companyId` | `company_id` | ✅ Yes (accepts both) |

**Status:** ✅ Backend schemas now accept both camelCase and snake_case

---

## 🔄 **MIGRATION STRATEGY**

### **Phase 1: Parallel Operation (Recommended)**
Run both Firebase (frontend) and API (backend) simultaneously to ensure compatibility.

```typescript
// src/lib/services/api-client.ts (NEW)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  }
}

export const apiClient = new ApiClient();
```

---

### **Phase 2: Service Layer Migration**

#### **Example: InvoiceService with API Integration**

```typescript
// src/lib/services/invoice-service-api.ts (NEW)
import { Invoice } from '@/types';
import { apiClient } from './api-client';

export class InvoiceApiService {
  private basePath = '/companies';

  async getAll(companyId: string): Promise<Invoice[]> {
    return apiClient.get<Invoice[]>(`${this.basePath}/${companyId}/invoices/`);
  }

  async getById(companyId: string, invoiceId: string): Promise<Invoice> {
    return apiClient.get<Invoice>(`${this.basePath}/${companyId}/invoices/${invoiceId}`);
  }

  async create(companyId: string, data: Partial<Invoice>): Promise<Invoice> {
    return apiClient.post<Invoice>(`${this.basePath}/${companyId}/invoices/`, data);
  }

  async update(companyId: string, invoiceId: string, data: Partial<Invoice>): Promise<Invoice> {
    return apiClient.put<Invoice>(`${this.basePath}/${companyId}/invoices/${invoiceId}`, data);
  }

  async delete(companyId: string, invoiceId: string): Promise<void> {
    return apiClient.delete(`${this.basePath}/${companyId}/invoices/${invoiceId}`);
  }
}

export const invoiceApiService = new InvoiceApiService();
```

---

### **Phase 3: Context Migration**

#### **Update AppDataContext to use API**

```typescript
// src/contexts/AppDataContext.tsx (UPDATED)
import { apiClient } from '@/lib/services/api-client';

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  // Toggle between Firestore and API
  const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';

  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      if (USE_API) {
        // API approach
        const data = await apiClient.get<Company[]>('/companies/');
        setCompanies(data);
      } else {
        // Firestore approach (current)
        const snapshot = await getDocs(collection(db, 'companies'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Company[];
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setCompaniesLoading(false);
    }
  }, [USE_API]);

  // Similar updates for clients, products, invoices, quotations
}
```

---

## 📋 **MIGRATION CHECKLIST**

### **Backend Preparation** ✅ COMPLETE
- [x] All endpoints created
- [x] Datetime serialization fixed
- [x] Flexible schemas (camelCase + snake_case)
- [x] Routes corrected (/companies prefix)
- [x] CRUD operations tested

### **Frontend Migration Tasks** ⏳ PENDING

#### **Step 1: API Client Setup**
- [ ] Create `src/lib/services/api-client.ts`
- [ ] Add `NEXT_PUBLIC_API_URL` to `.env.local`
- [ ] Add `NEXT_PUBLIC_USE_API` feature flag

#### **Step 2: Service Layer**
- [ ] Create API-based services:
  - [ ] `company-service-api.ts`
  - [ ] `client-service-api.ts`
  - [ ] `product-service-api.ts`
  - [ ] `invoice-service-api.ts`
  - [ ] `quotation-service-api.ts`
  - [ ] `customization-service-api.ts`
  - [ ] `product-category-service-api.ts`

#### **Step 3: Context Updates**
- [ ] Update `AppDataContext.tsx` with API toggle
- [ ] Test parallel operation (Firestore + API)
- [ ] Verify data consistency

#### **Step 4: Component Updates**
- [ ] Update invoice creation forms
- [ ] Update quotation creation forms
- [ ] Update client/product/company management
- [ ] Fix any field name mismatches

#### **Step 5: Architecture Decisions**
- [ ] **CRITICAL**: Decide on products collection structure
  - Option A: Keep global, filter on frontend
  - Option B: Make company-specific with companyId field
  - Option C: Create company subcollection endpoint
- [ ] Migrate invoices/quotations to subcollection structure
- [ ] Test auto-numbering from backend

#### **Step 6: Testing**
- [ ] Test all CRUD operations via API
- [ ] Verify data sync between Firestore and API
- [ ] Test error handling
- [ ] Verify offline behavior (remove if using API)

#### **Step 7: Cutover**
- [ ] Set `NEXT_PUBLIC_USE_API=true`
- [ ] Remove Firestore client SDK dependencies
- [ ] Remove `src/lib/firebase/` folder
- [ ] Update documentation

---

## 🎯 **RECOMMENDED IMMEDIATE ACTIONS**

### **1. Products Collection Decision** 🚨 URGENT
**Current State:**
- Frontend: Expects company-specific products with `companyId` field
- Backend: Global products collection

**Recommended Solution:**
Add `companyId` to products schema and filter in backend:

```python
# Backend: app/api/v1/products_firestore.py
@router.get("/", response_model=List[ProductOut])
async def list_products(
    skip: int = 0, 
    limit: int = 50,
    company_id: Optional[str] = None  # ADD THIS
):
    db = get_firestore_db()
    query = db.collection("products")
    
    if company_id:  # ADD FILTERING
        query = query.where("company_id", "==", company_id)
    
    query = query.limit(limit).offset(skip)
    # ... rest of code
```

### **2. Create API Client** ✅ HIGH PRIORITY
Create the API client service as shown in Phase 1 above.

### **3. Add Feature Flag** ✅ HIGH PRIORITY
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_API=false  # Toggle to switch between Firestore and API
```

---

## 📊 **ENDPOINT MAPPING TABLE**

| Resource | Frontend Firestore Path | Backend API Endpoint | Compatible? |
|----------|------------------------|----------------------|-------------|
| **Companies** | `companies` (collection) | `GET /api/v1/companies/` | ✅ Yes |
| **Clients** | `clients` (collection) | `GET /api/v1/clients/` | ✅ Yes |
| **Products** | `products` (filtered by companyId) | `GET /api/v1/products/` | ⚠️ Needs companyId filter |
| **Invoices** | `invoices` (filtered by companyId) | `GET /api/v1/companies/{id}/invoices/` | ❌ Different structure |
| **Quotations** | `quotations` (filtered by companyId) | `GET /api/v1/companies/{id}/quotations/` | ❌ Different structure |
| **Customizations** | `customizations` (filtered by companyId) | `GET /api/v1/companies/{id}/customizations/` | ❌ Different structure |
| **Product Categories** | `productCategories` (filtered by companyId) | `GET /api/v1/companies/{id}/product-categories/` | ❌ Different structure |

---

## 💡 **CONCLUSION**

### **Current State**
- ✅ Backend API fully functional with all endpoints
- ❌ Frontend still uses direct Firestore access
- ⚠️ Architectural mismatches in collection structures

### **Next Steps**
1. **Decide on products collection structure** (global vs company-specific)
2. **Create API client layer** in frontend
3. **Implement feature flag** for gradual migration
4. **Test parallel operation** before full cutover
5. **Migrate one resource at a time** (start with companies/clients)

### **Estimated Timeline**
- Phase 1 (API Client): 1-2 hours
- Phase 2 (Service Layer): 4-6 hours
- Phase 3 (Context Updates): 2-3 hours
- Phase 4 (Component Updates): 3-4 hours
- Phase 5 (Testing): 2-3 hours
- **Total**: 12-18 hours of development

### **Risk Assessment**
- 🟢 Low Risk: Companies, Clients (direct mapping)
- 🟡 Medium Risk: Products (needs companyId decision)
- 🔴 High Risk: Invoices, Quotations (subcollection structure change)

---

**Document Version**: 1.0  
**Last Updated**: November 27, 2025  
**Status**: Analysis Complete - Awaiting Migration Decisions
