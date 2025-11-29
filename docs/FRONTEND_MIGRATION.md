# Next.js Frontend Migration - Exact Code Changes

## 📝 Overview

This document shows **exact code replacements** needed to migrate your Next.js frontend from Firebase to Django.

---

## 1. Create Django API Client

### Create: `src/lib/api/django-client.ts`

```typescript
/**
 * Django API Client
 * Replaces ALL Firebase SDK calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    name: string;
    photo_url?: string;
  };
}

class DjangoAPIClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || error.detail || 'Request failed');
    }

    return response.json();
  }

  // ==================== AUTHENTICATION ====================

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ email, password, password2: password, name }),
    });

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await this.request<AuthResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    return data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  async getProfile() {
    return this.request('/auth/profile/');
  }

  async updateProfile(data: any) {
    return this.request('/auth/profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== COMPANIES ====================

  async getCompanies() {
    return this.request('/companies/');
  }

  async getCompany(id: string) {
    return this.request(`/companies/${id}/`);
  }

  async createCompany(data: any) {
    return this.request('/companies/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCompany(id: string, data: any) {
    return this.request(`/companies/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCompany(id: string) {
    return this.request(`/companies/${id}/`, {
      method: 'DELETE',
    });
  }

  // ==================== CLIENTS ====================

  async getClients(companyId?: string) {
    const query = companyId ? `?company_id=${companyId}` : '';
    return this.request(`/clients/${query}`);
  }

  async getClient(id: string) {
    return this.request(`/clients/${id}/`);
  }

  async createClient(data: any) {
    return this.request('/clients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: any) {
    return this.request(`/clients/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}/`, {
      method: 'DELETE',
    });
  }

  // ==================== PRODUCTS ====================

  async getProducts(companyId?: string) {
    const query = companyId ? `?company_id=${companyId}` : '';
    return this.request(`/products/${query}`);
  }

  async getProduct(id: string) {
    return this.request(`/products/${id}/`);
  }

  async createProduct(data: any) {
    return this.request('/products/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: string, data: any) {
    return this.request(`/products/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}/`, {
      method: 'DELETE',
    });
  }

  // ==================== CATEGORIES ====================

  async getCategories() {
    return this.request('/categories/');
  }

  async createCategory(data: any) {
    return this.request('/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== INVOICES ====================

  async getInvoices(companyId?: string) {
    const query = companyId ? `?company_id=${companyId}` : '';
    return this.request(`/invoices/${query}`);
  }

  async getInvoice(id: string) {
    return this.request(`/invoices/${id}/`);
  }

  async createInvoice(data: any) {
    return this.request('/invoices/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInvoice(id: string, data: any) {
    return this.request(`/invoices/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInvoice(id: string) {
    return this.request(`/invoices/${id}/`, {
      method: 'DELETE',
    });
  }

  async addPayment(invoiceId: string, paymentData: any) {
    return this.request(`/invoices/${invoiceId}/add_payment/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // ==================== QUOTATIONS ====================

  async getQuotations(companyId?: string) {
    const query = companyId ? `?company_id=${companyId}` : '';
    return this.request(`/quotations/${query}`);
  }

  async getQuotation(id: string) {
    return this.request(`/quotations/${id}/`);
  }

  async createQuotation(data: any) {
    return this.request('/quotations/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuotation(id: string, data: any) {
    return this.request(`/quotations/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuotation(id: string) {
    return this.request(`/quotations/${id}/`, {
      method: 'DELETE',
    });
  }

  async convertQuotationToInvoice(quotationId: string) {
    return this.request(`/quotations/${quotationId}/convert_to_invoice/`, {
      method: 'POST',
    });
  }

  // ==================== UPLOADS ====================

  async uploadImage(file: File, folder: string = 'logos') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/uploads/image/`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async deleteImage(publicId: string) {
    return this.request('/uploads/image/delete/', {
      method: 'DELETE',
      body: JSON.stringify({ public_id: publicId }),
    });
  }
}

export const djangoAPI = new DjangoAPIClient();
```

---

## 2. Update Environment Variables

### Add to: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 3. Update Service Files

### Replace: `src/lib/services/company-service.ts`

**Before (Firebase):**
```typescript
import { BaseService } from './base-service';
import { Company } from '@/types';

class CompanyService extends BaseService<Company> {
  constructor() {
    super('companies');
  }
}

export const companyService = new CompanyService();
```

**After (Django):**
```typescript
import { djangoAPI } from '@/lib/api/django-client';
import { Company } from '@/types';

class CompanyService {
  async getAll() {
    return djangoAPI.getCompanies();
  }

  async getById(id: string) {
    return djangoAPI.getCompany(id);
  }

  async create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) {
    return djangoAPI.createCompany(data);
  }

  async update(id: string, data: Partial<Company>) {
    return djangoAPI.updateCompany(id, data);
  }

  async delete(id: string) {
    return djangoAPI.deleteCompany(id);
  }
}

export const companyService = new CompanyService();
```

Apply same pattern to:
- `client-service.ts`
- `product-service.ts`
- `invoice-service.ts`
- `customization-service.ts`

---

## 4. Update Authentication Context

### Replace: `src/contexts/AuthContext.tsx`

**Before (Firebase):**
```typescript
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

const signIn = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

const logout = async () => {
  await signOut(auth);
};
```

**After (Django):**
```typescript
import { djangoAPI } from '@/lib/api/django-client';

const signIn = async (email: string, password: string) => {
  const data = await djangoAPI.login(email, password);
  setUser(data.user);
};

const signUp = async (email: string, password: string, name: string) => {
  const data = await djangoAPI.register(email, password, name);
  setUser(data.user);
};

const logout = async () => {
  await djangoAPI.logout();
  setUser(null);
};
```

---

## 5. Update Cloudinary Service

### Replace: `src/lib/services/cloudinary-service.ts`

**Before (Client-Side):**
```typescript
export async function uploadToCloudinary(file: File, folder?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder || 'logos');

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}
```

**After (Server-Side via Django):**
```typescript
import { djangoAPI } from '@/lib/api/django-client';

export async function uploadToCloudinary(file: File, folder?: string) {
  return djangoAPI.uploadImage(file, folder || 'logos');
}

export async function deleteFromCloudinary(publicId: string) {
  return djangoAPI.deleteImage(publicId);
}
```

---

## 6. Update Hooks

### Replace: `src/hooks/useCompanies.tsx`

**Before (Firebase):**
```typescript
import { useState, useEffect } from 'react';
import { companyService } from '@/lib/services/company-service';

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      const data = await companyService.getAll();
      setCompanies(data);
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  return { companies, loading };
}
```

**After (Django) - No changes needed!**
```typescript
// Works the same! Just update the service file
import { useState, useEffect } from 'react';
import { companyService } from '@/lib/services/company-service';

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      const data = await companyService.getAll();
      setCompanies(data);
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  return { companies, loading };
}
```

---

## 7. Remove Firebase Files

Delete these files/folders:

```
src/lib/firebase/
  ├── config.ts              ❌ DELETE
  ├── auth-context.tsx       ❌ DELETE
  ├── firestore-helpers.ts   ❌ DELETE
  └── ...

Remove from package.json:
  - firebase
  - @firebase/firestore
  - @firebase/auth
```

---

## 8. Update package.json

### Remove:
```json
{
  "dependencies": {
    "firebase": "^12.5.0",  // ❌ REMOVE
  }
}
```

### Add (Optional - for better API calls):
```json
{
  "dependencies": {
    "axios": "^1.6.0",  // Optional alternative to fetch
    "swr": "^2.2.0",    // Optional for data fetching
  }
}
```

---

## 9. Update Company Form Component

### File: `src/components/company/CompanyForm.tsx`

**Before (Firebase structure):**
```typescript
const handleSubmit = async (data) => {
  await companyService.create({
    name: data.name,
    gstin: data.gstin,
    address: {
      street: data.address.street,
      // ...
    },
    // ...
  });
};
```

**After (Django structure) - Same!**
```typescript
const handleSubmit = async (data) => {
  await companyService.create({
    name: data.name,
    gstin: data.gstin,
    address: {
      street: data.address.street,
      // ...
    },
    // ...
  });
};
```

No changes needed! Django backend handles nested structure.

---

## 10. Update Image Upload Component

### File: `src/components/shared/ImageUpload.tsx`

**Before:**
```typescript
import { uploadToCloudinary } from '@/lib/services/cloudinary-service';

const handleUpload = async (file: File) => {
  const result = await uploadToCloudinary(file, 'logos');
  setImageUrl(result.secure_url);
};
```

**After - No changes needed!**
```typescript
import { uploadToCloudinary } from '@/lib/services/cloudinary-service';

const handleUpload = async (file: File) => {
  // Now goes through Django instead of directly to Cloudinary
  const result = await uploadToCloudinary(file, 'logos');
  setImageUrl(result.secure_url);
};
```

---

## ✅ Migration Checklist

- [ ] Create `src/lib/api/django-client.ts`
- [ ] Add `NEXT_PUBLIC_API_URL` to `.env.local`
- [ ] Update all service files to use `djangoAPI`
- [ ] Update auth context to use Django auth
- [ ] Update Cloudinary service to use Django endpoint
- [ ] Remove `src/lib/firebase/` folder
- [ ] Remove Firebase from `package.json`
- [ ] Run `npm install` to clean dependencies
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Test image uploads
- [ ] Verify all features work

---

## 🧪 Testing

```typescript
// Test authentication
const testAuth = async () => {
  try {
    const data = await djangoAPI.register('test@example.com', 'password123', 'Test User');
    console.log('✅ Register:', data);

    const loginData = await djangoAPI.login('test@example.com', 'password123');
    console.log('✅ Login:', loginData);
  } catch (error) {
    console.error('❌ Auth error:', error);
  }
};

// Test companies
const testCompanies = async () => {
  const companies = await djangoAPI.getCompanies();
  console.log('✅ Companies:', companies);
};

// Test image upload
const testUpload = async (file: File) => {
  const result = await djangoAPI.uploadImage(file, 'logos');
  console.log('✅ Upload:', result.secure_url);
};
```

---

## 🎉 Done!

Your Next.js app now uses Django backend exclusively!

**No more Firebase client SDK!** 🔥 → 🐍

All data goes through your secure Django REST API! 🚀
