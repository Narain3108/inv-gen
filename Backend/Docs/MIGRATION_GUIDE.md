# Firebase to FastAPI Migration Guide

## 📋 Overview

This guide helps you migrate from the current Firebase Firestore frontend setup to the new FastAPI backend while maintaining data integrity.

## 🔄 Migration Strategy

### Phase 1: Setup Backend (Current)
✅ FastAPI backend implemented with all endpoints
✅ PostgreSQL database schema created
✅ API documentation available

### Phase 2: Data Migration (Next Steps)

#### Option A: Manual Export/Import
1. Export Firestore data to JSON
2. Transform to match PostgreSQL schema
3. Import via API endpoints

#### Option B: Dual Write (Recommended)
1. Keep Firebase active
2. Write to both Firebase and FastAPI
3. Gradually migrate reads to FastAPI
4. Decommission Firebase after validation

#### Option C: Background Sync
1. Run sync script to copy Firestore → PostgreSQL
2. Validate data integrity
3. Switch frontend to FastAPI
4. Archive Firebase data

## 🛠️ Migration Tools

### Export Firestore Data

Create `Backend/scripts/export_firebase.py`:

```python
import firebase_admin
from firebase_admin import credentials, firestore
import json
from datetime import datetime

# Initialize Firebase
cred = credentials.Certificate('path/to/serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

def export_collection(collection_name):
    """Export a Firestore collection to JSON"""
    docs = db.collection(collection_name).stream()
    data = []
    
    for doc in docs:
        doc_data = doc.to_dict()
        doc_data['id'] = doc.id
        # Convert timestamps
        for key, value in doc_data.items():
            if isinstance(value, datetime):
                doc_data[key] = value.isoformat()
        data.append(doc_data)
    
    filename = f'{collection_name}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Exported {len(data)} documents from {collection_name} to {filename}")
    return data

# Export all collections
collections = ['users', 'companies', 'clients', 'products', 'invoices', 'quotations']
for collection in collections:
    export_collection(collection)
```

### Import to PostgreSQL

Create `Backend/scripts/import_to_postgres.py`:

```python
import asyncio
import json
from datetime import datetime
from uuid import UUID
import httpx

API_BASE = "http://localhost:8000/api/v1"

async def import_users(data):
    """Import users from Firebase export"""
    async with httpx.AsyncClient() as client:
        for user in data:
            payload = {
                "email": user.get("email"),
                "name": user.get("name") or user.get("displayName"),
                "photo_url": user.get("photoURL"),
                "legacy_firebase_uid": user.get("id")  # Store original Firebase ID
            }
            response = await client.post(f"{API_BASE}/users", json=payload)
            if response.status_code == 200:
                print(f"✅ Imported user: {payload['email']}")
            else:
                print(f"❌ Failed to import user: {payload['email']}")

async def import_companies(data, user_mapping):
    """Import companies with mapped user IDs"""
    async with httpx.AsyncClient() as client:
        for company in data:
            # Map Firebase user ID to new PostgreSQL UUID
            firebase_user_id = company.get("userId")
            user_id = user_mapping.get(firebase_user_id)
            
            if not user_id:
                print(f"⚠️  Skipping company {company.get('name')} - user not found")
                continue
            
            payload = {
                "user_id": user_id,
                "name": company.get("name"),
                "gstin": company.get("gstin"),
                "pan": company.get("pan"),
                "address": company.get("address", {}),
                "contact": company.get("contact", {}),
                "bank_details": company.get("bankDetails", {}),
                "logo_url": company.get("logoUrl"),
                # ... map other fields
            }
            response = await client.post(f"{API_BASE}/companies", json=payload)
            if response.status_code == 200:
                print(f"✅ Imported company: {payload['name']}")
            else:
                print(f"❌ Failed to import company: {payload['name']}")

# Similar functions for clients, products, invoices, quotations...

async def main():
    # Load exported data
    with open('users_export.json') as f:
        users_data = json.load(f)
    
    # Create user mapping (Firebase ID → PostgreSQL UUID)
    user_mapping = await import_users(users_data)
    
    # Import other collections with mappings
    # ...

if __name__ == "__main__":
    asyncio.run(main())
```

## 📊 Data Mapping

### Users Collection
```
Firebase → PostgreSQL
---------------------------------
uid → legacy_firebase_uid
email → email
displayName → name
photoURL → photo_url
```

### Companies Collection
```
Firebase → PostgreSQL
---------------------------------
userId → user_id (mapped)
name → name
gstin → gstin
pan → pan
address → address (JSONB)
contact → contact (JSONB)
bankDetails → bank_details (JSONB)
logoUrl → logo_url
invoiceSettings → invoice_* fields
quotationSettings → quotation_* fields
```

### Invoices Collection
```
Firebase → PostgreSQL
---------------------------------
companyId → company_id (mapped)
clientId → client_id (mapped)
invoiceNumber → invoice_number
date → date
dueDate → due_date
items[] → invoice_items table (separate rows)
amountPaid → amount_paid
paymentStatus → payment_status
paymentRecords[] → payments table
```

## 🔀 Frontend Integration

### Update API Service

Replace Firebase calls in `src/lib/services/`:

**Before (Firebase):**
```typescript
// src/lib/firebase/invoices.ts
import { collection, addDoc } from 'firebase/firestore';

export async function createInvoice(data: InvoiceCreate) {
  const docRef = await addDoc(collection(db, 'invoices'), data);
  return docRef.id;
}
```

**After (FastAPI):**
```typescript
// src/lib/api/invoices.ts
export async function createInvoice(data: InvoiceCreate) {
  const response = await fetch('http://localhost:8000/api/v1/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const invoice = await response.json();
  return invoice.id;
}
```

### Environment Configuration

Add to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_USE_FIREBASE=false  # Toggle between Firebase and API
```

### Gradual Migration Pattern

```typescript
// src/lib/services/invoice-service.ts
import { createInvoice as createInvoiceFirebase } from '@/lib/firebase/invoices';
import { createInvoice as createInvoiceAPI } from '@/lib/api/invoices';

export async function createInvoice(data: InvoiceCreate) {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE === 'true') {
    return createInvoiceFirebase(data);
  } else {
    return createInvoiceAPI(data);
  }
}
```

## ✅ Migration Checklist

### Pre-Migration
- [ ] Backup Firestore data
- [ ] Set up PostgreSQL database
- [ ] Run FastAPI backend
- [ ] Test all API endpoints
- [ ] Export Firestore collections

### Migration
- [ ] Create user mapping (Firebase UID → PostgreSQL UUID)
- [ ] Import users
- [ ] Import companies with user mapping
- [ ] Import clients with company mapping
- [ ] Import products with company mapping
- [ ] Import invoices with all mappings
- [ ] Import invoice items
- [ ] Import payments
- [ ] Import quotations and items
- [ ] Import customizations

### Post-Migration
- [ ] Validate data integrity (counts, totals, relationships)
- [ ] Update frontend environment variables
- [ ] Test CRUD operations via frontend
- [ ] Update invoice PDFs to use new API
- [ ] Monitor error logs
- [ ] Keep Firebase read-only as backup for 30 days
- [ ] Decommission Firebase

## 🔐 Authentication Migration

### Current: Firebase Auth (Frontend)
```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
```

### Future: Firebase Admin SDK (Backend)

Add to FastAPI backend:

```python
# app/core/auth.py
from firebase_admin import auth
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def verify_firebase_token(credentials = Depends(security)):
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# Usage in endpoints
@router.get("/protected")
async def protected_route(user = Depends(verify_firebase_token)):
    return {"user_id": user['uid']}
```

Frontend sends token:
```typescript
const token = await user.getIdToken();
fetch('/api/v1/invoices', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 📈 Performance Benefits

### Before (Firebase)
- Client-side queries and calculations
- Multiple round trips for complex data
- Limited aggregation capabilities
- Frontend bundle size increased

### After (FastAPI)
- Server-side processing
- Single API call for complex operations
- SQL aggregations and joins
- Automatic tax calculations
- Invoice numbering handled server-side
- Better caching possibilities

## 🆘 Rollback Plan

If issues occur:

1. **Switch environment variable**
   ```env
   NEXT_PUBLIC_USE_FIREBASE=true
   ```

2. **Firebase data is still intact** (read-only mode during migration)

3. **PostgreSQL can be reset** without affecting Firebase

4. **Gradual rollout**: Migrate one user/company at a time

## 📞 Support

For migration assistance:
1. Check logs in `Backend/logs/`
2. Review API errors at http://localhost:8000/docs
3. Verify data mappings in import scripts
4. Contact development team

---

**Migration Timeline: 1-2 weeks recommended for testing and validation**
